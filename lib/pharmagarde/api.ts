import AsyncStorage from "@react-native-async-storage/async-storage";

import { Coordinates, HealthPlace, Medicine } from "./types";

const DEFAULT_TIMEOUT_MS = 12000;
const CLIENT_CACHE_PREFIX = "pharmagarde:api-cache:v1:";
const CLIENT_CACHE_TTL_MS: Record<"pharmacies" | "clinics" | "medicines", number> = {
  pharmacies: 24 * 60 * 60 * 1000,
  clinics: 7 * 24 * 60 * 60 * 1000,
  medicines: 24 * 60 * 60 * 1000,
};

type CachedPayload = {
  storedAt: number;
  expiresAt: number;
  payload: unknown;
};

const memoryPayloadCache = new Map<string, CachedPayload>();

function normalizeBaseUrl(value?: string | null) {
  const trimmed = (value ?? "").trim();
  if (!trimmed) return "";
  return trimmed.replace(/\/+$/, "");
}

function getString(record: Record<string, unknown>, keys: string[]) {
  for (const key of keys) {
    const value = record[key];
    if (typeof value === "string" && value.trim()) return value.trim();
    if (typeof value === "number" && Number.isFinite(value)) return String(value);
  }
  return undefined;
}

function getNumber(record: Record<string, unknown>, keys: string[]) {
  for (const key of keys) {
    const value = record[key];
    if (typeof value === "number" && Number.isFinite(value)) return value;
    if (typeof value === "string") {
      const parsed = Number(value.replace(",", "."));
      if (Number.isFinite(parsed)) return parsed;
    }
  }
  return undefined;
}

function getBoolean(record: Record<string, unknown>, keys: string[]) {
  for (const key of keys) {
    const value = record[key];
    if (typeof value === "boolean") return value;
    if (typeof value === "string") {
      const normalized = value.toLowerCase();
      if (["true", "1", "open", "ouvert", "yes"].includes(normalized)) return true;
      if (["false", "0", "closed", "fermé", "non"].includes(normalized)) return false;
    }
  }
  return undefined;
}

function asRecords(payload: unknown): Record<string, unknown>[] {
  if (Array.isArray(payload)) return payload.filter((item): item is Record<string, unknown> => !!item && typeof item === "object" && !Array.isArray(item));
  if (payload && typeof payload === "object") {
    const record = payload as Record<string, unknown>;
    const possibleArrays = [record.data, record.items, record.results, record.pharmacies, record.healthcare, record.cliniques, record.clinics, record.medicaments, record.medicines];
    for (const value of possibleArrays) {
      if (Array.isArray(value)) return asRecords(value);
    }
  }
  return [];
}

function normalizePlace(raw: Record<string, unknown>, type: "pharmacy" | "clinic", index: number): HealthPlace | null {
  const name = getString(raw, ["name", "nom", "title", "libelle", "label", "raisonSociale"]);
  const id = getString(raw, ["id", "uuid", "_id", "code", "slug", "googlePlaceId"]) ?? (name ? `${type}-${name}-${index}` : undefined);
  if (!id || !name) return null;
  return {
    id,
    type,
    name,
    address: getString(raw, ["address", "adresse", "location", "quartier", "descriptionAdresse"]),
    city: getString(raw, ["city", "ville", "commune"]),
    phone: getString(raw, ["phone", "telephone", "tel", "mobile", "contact"]),
    distanceKm: getNumber(raw, ["distanceKm", "distance_km", "distance", "distanceInKm"]),
    latitude: getNumber(raw, ["latitude", "lat"]),
    longitude: getNumber(raw, ["longitude", "lng", "lon"]),
    isOpen: getBoolean(raw, ["isOpen", "open", "ouvert", "garde", "onDuty"]),
  };
}

function normalizeMedicine(raw: Record<string, unknown>, index: number): Medicine | null {
  const name = getString(raw, ["name", "nom", "title", "libelle", "designation"]);
  const id = getString(raw, ["id", "uuid", "_id", "code", "slug"]) ?? (name ? `medicine-${name}-${index}` : undefined);
  if (!id || !name) return null;
  return {
    id,
    type: "medicine",
    name,
    category: getString(raw, ["category", "categorie", "classe", "famille"]),
    pharmaceuticalType: getString(raw, ["type", "forme", "form", "dosageForm"]),
    description: getString(raw, ["description", "details", "indication"]),
    imageUrl: getString(raw, ["imageUrl", "image", "photo", "thumbnail", "picture"]),
  };
}

function getDatasetKind(path: string): "pharmacies" | "clinics" | "medicines" | null {
  if (path.includes("pharmacies")) return "pharmacies";
  if (path.includes("cliniques") || path.includes("clinics") || path.includes("healthcare")) return "clinics";
  if (path.includes("medicaments") || path.includes("medicines")) return "medicines";
  return null;
}

function buildCacheKey(baseUrl: string, path: string) {
  return `${CLIENT_CACHE_PREFIX}${normalizeBaseUrl(baseUrl)}:${path.startsWith("/") ? path : `/${path}`}`;
}

async function readCachedPayload(cacheKey: string) {
  const memoryEntry = memoryPayloadCache.get(cacheKey);
  if (memoryEntry && memoryEntry.expiresAt > Date.now()) return memoryEntry.payload;

  try {
    const raw = await AsyncStorage.getItem(cacheKey);
    if (!raw) return null;
    const parsed = JSON.parse(raw) as CachedPayload;
    if (parsed.expiresAt > Date.now()) {
      memoryPayloadCache.set(cacheKey, parsed);
      return parsed.payload;
    }
  } catch {
    return null;
  }
  return null;
}

async function writeCachedPayload(cacheKey: string, payload: unknown, ttlMs: number) {
  const entry: CachedPayload = { storedAt: Date.now(), expiresAt: Date.now() + ttlMs, payload };
  memoryPayloadCache.set(cacheKey, entry);
  try {
    await AsyncStorage.setItem(cacheKey, JSON.stringify(entry));
  } catch {
    // Le cache local ne doit jamais bloquer l’expérience mobile.
  }
}

async function readStalePayload(cacheKey: string) {
  const memoryEntry = memoryPayloadCache.get(cacheKey);
  if (memoryEntry) return memoryEntry.payload;

  try {
    const raw = await AsyncStorage.getItem(cacheKey);
    if (!raw) return null;
    const parsed = JSON.parse(raw) as CachedPayload;
    memoryPayloadCache.set(cacheKey, parsed);
    return parsed.payload;
  } catch {
    return null;
  }
}

async function requestJson(baseUrl: string, path: string, coordinates?: Coordinates) {
  const cleanBase = normalizeBaseUrl(baseUrl);
  if (!cleanBase) {
    throw new Error("API_BASE_URL_NON_CONFIGUREE");
  }

  const datasetKind = getDatasetKind(path);
  const cacheKey = datasetKind ? buildCacheKey(cleanBase, path) : null;
  if (cacheKey) {
    const cached = await readCachedPayload(cacheKey);
    if (cached) return cached;
  }

  const url = new URL(`${cleanBase}${path.startsWith("/") ? path : `/${path}`}`);
  if (coordinates) {
    url.searchParams.set("lat", String(coordinates.latitude));
    url.searchParams.set("lng", String(coordinates.longitude));
    url.searchParams.set("latitude", String(coordinates.latitude));
    url.searchParams.set("longitude", String(coordinates.longitude));
  }

  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), DEFAULT_TIMEOUT_MS);
  try {
    const response = await fetch(url.toString(), {
      headers: { Accept: "application/json" },
      signal: controller.signal,
    });
    if (!response.ok) {
      throw new Error(`Erreur API ${response.status}`);
    }
    const payload = await response.json();
    if (cacheKey && datasetKind) {
      await writeCachedPayload(cacheKey, payload, CLIENT_CACHE_TTL_MS[datasetKind]);
    }
    return payload;
  } catch (error) {
    if (cacheKey) {
      const stalePayload = await readStalePayload(cacheKey);
      if (stalePayload) return stalePayload;
    }
    throw error;
  } finally {
    clearTimeout(timer);
  }
}

export async function fetchPharmacies(baseUrl: string, coordinates?: Coordinates) {
  const payload = await requestJson(baseUrl, "/pharmacies/nearby", coordinates);
  return asRecords(payload).map((item, index) => normalizePlace(item, "pharmacy", index)).filter((item): item is HealthPlace => item !== null);
}

export async function fetchClinics(baseUrl: string, coordinates?: Coordinates) {
  const payload = await requestJson(baseUrl, "/cliniques/nearby", coordinates);
  return asRecords(payload).map((item, index) => normalizePlace(item, "clinic", index)).filter((item): item is HealthPlace => item !== null);
}

export async function fetchMedicines(baseUrl: string) {
  const payload = await requestJson(baseUrl, "/medicaments");
  return asRecords(payload).map((item, index) => normalizeMedicine(item, index)).filter((item): item is Medicine => item !== null);
}

export { normalizeBaseUrl };
