import type { Express, Request, Response } from "express";
import { mkdir, readFile, writeFile } from "node:fs/promises";
import path from "node:path";

export type CachedPlaceType = "pharmacy" | "clinic";

export type CachedHealthPlace = {
  id: string;
  type: CachedPlaceType;
  name: string;
  address?: string;
  city?: string;
  phone?: string;
  rating?: number;
  distanceKm?: number;
  latitude?: number;
  longitude?: number;
  isOpen?: boolean;
  source?: "google" | "local";
  googlePlaceId?: string;
  updatedAt?: string;
};

type CacheKind = "pharmacies" | "healthcare";

type CacheState = {
  version: 1;
  kind: CacheKind;
  items: CachedHealthPlace[];
  updatedAt: string | null;
  expiresAt: string | null;
  lastRefreshAttemptAt: string | null;
  lastError?: string;
};

type UpdateResult = {
  kind: CacheKind;
  ok: boolean;
  refreshed: boolean;
  itemCount: number;
  updatedAt: string | null;
  expiresAt: string | null;
  error?: string;
};

const PHARMACY_TTL_MS = 24 * 60 * 60 * 1000;
const HEALTHCARE_TTL_MS = 7 * 24 * 60 * 60 * 1000;
const DEFAULT_LOCATION = { latitude: 12.3714, longitude: -1.5197 };
const DEFAULT_RADIUS_METERS = 15000;
const CACHE_DIR = process.env.PHARMAGARDE_CACHE_DIR ?? path.join(process.cwd(), "server", ".cache");
const GOOGLE_API_KEY = process.env.GOOGLE_PLACES_API_KEY ?? process.env.GOOGLE_MAPS_API_KEY ?? "";

const memoryCache: Record<CacheKind, CacheState> = {
  pharmacies: createEmptyState("pharmacies"),
  healthcare: createEmptyState("healthcare"),
};

const refreshLocks: Partial<Record<CacheKind, Promise<UpdateResult>>> = {};
let schedulersStarted = false;

function createEmptyState(kind: CacheKind): CacheState {
  return {
    version: 1,
    kind,
    items: [],
    updatedAt: null,
    expiresAt: null,
    lastRefreshAttemptAt: null,
  };
}

function ttlFor(kind: CacheKind) {
  return kind === "pharmacies" ? PHARMACY_TTL_MS : HEALTHCARE_TTL_MS;
}

function fileFor(kind: CacheKind) {
  return path.join(CACHE_DIR, `${kind}.json`);
}

function nowIso() {
  return new Date().toISOString();
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return !!value && typeof value === "object" && !Array.isArray(value);
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

function normalizeGooglePlace(raw: Record<string, unknown>, type: CachedPlaceType, index: number): CachedHealthPlace | null {
  const geometry = isRecord(raw.geometry) ? raw.geometry : undefined;
  const location = geometry && isRecord(geometry.location) ? geometry.location : undefined;
  const placeId = getString(raw, ["place_id", "id"]);
  const name = getString(raw, ["name", "nom", "title"]);
  if (!name) return null;

  return {
    id: placeId ?? `${type}-${name.toLowerCase().replace(/[^a-z0-9]+/gi, "-")}-${index}`,
    type,
    name,
    address: getString(raw, ["vicinity", "formatted_address", "address", "adresse"]),
    city: getString(raw, ["city", "ville", "commune"]),
    phone: getString(raw, ["formatted_phone_number", "international_phone_number", "phone", "telephone"]),
    rating: getNumber(raw, ["rating", "note", "googleRating", "google_rating", "noteGoogle", "stars"]),
    latitude: location ? getNumber(location, ["lat", "latitude"]) : getNumber(raw, ["lat", "latitude"]),
    longitude: location ? getNumber(location, ["lng", "lon", "longitude"]) : getNumber(raw, ["lng", "lon", "longitude"]),
    isOpen: isRecord(raw.opening_hours) && typeof raw.opening_hours.open_now === "boolean" ? raw.opening_hours.open_now : undefined,
    source: "google",
    googlePlaceId: placeId,
    updatedAt: nowIso(),
  };
}

function dedupePlaces(items: CachedHealthPlace[]) {
  const seen = new Set<string>();
  const unique: CachedHealthPlace[] = [];
  for (const item of items) {
    const key = item.googlePlaceId ?? `${item.type}:${item.name}:${item.latitude ?? ""}:${item.longitude ?? ""}`.toLowerCase();
    if (seen.has(key)) continue;
    seen.add(key);
    unique.push(item);
  }
  return unique;
}

async function callGoogleNearby(type: "pharmacy" | "hospital" | "doctor") {
  if (!GOOGLE_API_KEY) {
    throw new Error("GOOGLE_PLACES_API_KEY ou GOOGLE_MAPS_API_KEY non configurée.");
  }

  const url = new URL("https://maps.googleapis.com/maps/api/place/nearbysearch/json");
  url.searchParams.set("key", GOOGLE_API_KEY);
  url.searchParams.set("location", `${DEFAULT_LOCATION.latitude},${DEFAULT_LOCATION.longitude}`);
  url.searchParams.set("radius", String(Number(process.env.PHARMAGARDE_GOOGLE_RADIUS_METERS ?? DEFAULT_RADIUS_METERS)));
  url.searchParams.set("type", type);
  url.searchParams.set("language", "fr");

  const response = await fetch(url.toString(), { headers: { accept: "application/json" } });
  if (!response.ok) {
    throw new Error(`Google Places a répondu ${response.status} ${response.statusText}`);
  }
  const payload = await response.json();
  if (!isRecord(payload)) return [];
  const status = getString(payload, ["status"]);
  if (status && !["OK", "ZERO_RESULTS"].includes(status)) {
    throw new Error(`Google Places status=${status}${getString(payload, ["error_message"]) ? `: ${getString(payload, ["error_message"])}` : ""}`);
  }
  return Array.isArray(payload.results) ? payload.results.filter(isRecord) : [];
}

async function fetchGoogleItems(kind: CacheKind) {
  if (kind === "pharmacies") {
    const results = await callGoogleNearby("pharmacy");
    return dedupePlaces(results.map((item, index) => normalizeGooglePlace(item, "pharmacy", index)).filter((item): item is CachedHealthPlace => item !== null));
  }

  const [hospitals, doctors] = await Promise.all([callGoogleNearby("hospital"), callGoogleNearby("doctor")]);
  return dedupePlaces([...hospitals, ...doctors].map((item, index) => normalizeGooglePlace(item, "clinic", index)).filter((item): item is CachedHealthPlace => item !== null));
}

async function persistState(kind: CacheKind, state: CacheState) {
  await mkdir(CACHE_DIR, { recursive: true });
  await writeFile(fileFor(kind), `${JSON.stringify(state, null, 2)}\n`, "utf8");
}

async function loadState(kind: CacheKind) {
  try {
    const raw = await readFile(fileFor(kind), "utf8");
    const parsed = JSON.parse(raw) as Partial<CacheState>;
    if (parsed.kind === kind && Array.isArray(parsed.items)) {
      memoryCache[kind] = {
        version: 1,
        kind,
        items: parsed.items.filter(isRecord) as CachedHealthPlace[],
        updatedAt: parsed.updatedAt ?? null,
        expiresAt: parsed.expiresAt ?? null,
        lastRefreshAttemptAt: parsed.lastRefreshAttemptAt ?? null,
        lastError: parsed.lastError,
      };
    }
  } catch {
    memoryCache[kind] = createEmptyState(kind);
  }
}

export async function initializePharmaGardeCache() {
  await Promise.all([loadState("pharmacies"), loadState("healthcare")]);
}

export function getCacheState(kind: CacheKind) {
  return memoryCache[kind];
}

export function isCacheFresh(kind: CacheKind) {
  const expiresAt = memoryCache[kind].expiresAt;
  return !!expiresAt && Date.parse(expiresAt) > Date.now();
}

export async function updateCachedDataset(kind: CacheKind, force = false): Promise<UpdateResult> {
  if (!force && isCacheFresh(kind)) {
    const state = memoryCache[kind];
    return { kind, ok: true, refreshed: false, itemCount: state.items.length, updatedAt: state.updatedAt, expiresAt: state.expiresAt };
  }

  if (refreshLocks[kind]) return refreshLocks[kind];

  refreshLocks[kind] = (async () => {
    const attemptAt = nowIso();
    memoryCache[kind] = { ...memoryCache[kind], lastRefreshAttemptAt: attemptAt };
    try {
      const items = await fetchGoogleItems(kind);
      const updatedAt = nowIso();
      const next: CacheState = {
        version: 1,
        kind,
        items,
        updatedAt,
        expiresAt: new Date(Date.now() + ttlFor(kind)).toISOString(),
        lastRefreshAttemptAt: attemptAt,
      };
      memoryCache[kind] = next;
      await persistState(kind, next);
      return { kind, ok: true, refreshed: true, itemCount: items.length, updatedAt: next.updatedAt, expiresAt: next.expiresAt };
    } catch (error) {
      const message = error instanceof Error ? error.message : "Erreur Google API inconnue";
      const fallback = { ...memoryCache[kind], lastRefreshAttemptAt: attemptAt, lastError: message };
      memoryCache[kind] = fallback;
      await persistState(kind, fallback).catch(() => undefined);
      return { kind, ok: false, refreshed: false, itemCount: fallback.items.length, updatedAt: fallback.updatedAt, expiresAt: fallback.expiresAt, error: message };
    } finally {
      delete refreshLocks[kind];
    }
  })();

  return refreshLocks[kind];
}

export function startPharmaGardeSchedulers() {
  if (schedulersStarted) return;
  schedulersStarted = true;

  void updateCachedDataset("pharmacies");
  void updateCachedDataset("healthcare");

  const pharmaciesTimer = setInterval(() => {
    void updateCachedDataset("pharmacies", true);
  }, PHARMACY_TTL_MS);

  const healthcareTimer = setInterval(() => {
    void updateCachedDataset("healthcare", true);
  }, HEALTHCARE_TTL_MS);

  maybeUnrefTimer(pharmaciesTimer);
  maybeUnrefTimer(healthcareTimer);
}

function maybeUnrefTimer(timer: ReturnType<typeof setInterval>) {
  const candidate = timer as unknown as { unref?: () => void };
  candidate.unref?.();
}

function withCacheHeaders(res: Response, kind: CacheKind) {
  const state = memoryCache[kind];
  res.setHeader("Cache-Control", kind === "pharmacies" ? "public, max-age=300, stale-while-revalidate=86400" : "public, max-age=1800, stale-while-revalidate=604800");
  if (state.updatedAt) res.setHeader("Last-Modified", new Date(state.updatedAt).toUTCString());
  if (state.expiresAt) res.setHeader("X-PharmaGarde-Cache-Expires-At", state.expiresAt);
  res.setHeader("X-PharmaGarde-Cache-Source", "server-local-cache");
}

function sendCachedDataset(res: Response, kind: CacheKind, rootKey: "pharmacies" | "healthcare" | "cliniques") {
  const state = memoryCache[kind];
  withCacheHeaders(res, kind);
  res.json({
    [rootKey]: state.items,
    data: state.items,
    meta: {
      cache: "server-local-cache",
      kind,
      itemCount: state.items.length,
      updatedAt: state.updatedAt,
      expiresAt: state.expiresAt,
      stale: !isCacheFresh(kind),
      lastError: state.lastError,
    },
  });
}

function isAdminRequest(req: Request) {
  const configuredToken = process.env.PHARMAGARDE_ADMIN_TOKEN;
  if (!configuredToken) return process.env.NODE_ENV !== "production";
  const header = req.header("authorization") ?? "";
  return header === `Bearer ${configuredToken}` || req.header("x-admin-token") === configuredToken;
}

export function registerPharmaGardeCacheRoutes(app: Express) {
  app.get("/pharmacies", (_req, res) => sendCachedDataset(res, "pharmacies", "pharmacies"));
  app.get("/pharmacies/nearby", (_req, res) => sendCachedDataset(res, "pharmacies", "pharmacies"));

  app.get("/healthcare", (_req, res) => sendCachedDataset(res, "healthcare", "healthcare"));
  app.get("/cliniques/nearby", (_req, res) => sendCachedDataset(res, "healthcare", "cliniques"));

  app.post("/admin/update-data", async (req, res) => {
    if (!isAdminRequest(req)) {
      res.status(401).json({ ok: false, error: "ADMIN_TOKEN_REQUIRED" });
      return;
    }

    const body = isRecord(req.body) ? req.body : {};
    const requestedKind = body.kind === "pharmacies" || body.kind === "healthcare" ? body.kind : "all";
    const kinds: CacheKind[] = requestedKind === "all" ? ["pharmacies", "healthcare"] : [requestedKind];
    const results = await Promise.all(kinds.map((kind) => updateCachedDataset(kind, true)));
    res.json({ ok: results.every((item) => item.ok), results });
  });
}
