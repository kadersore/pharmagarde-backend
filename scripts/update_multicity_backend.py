from pathlib import Path

project = Path('/home/ubuntu/pharmagarde_bf_expo')
cache_path = project / 'server/pharmagarde-cache.ts'
test_path = project / 'tests/pharmagarde-cache.test.ts'

cache_path.write_text(r'''import type { Express, Request, Response } from "express";
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

export type SupportedCity = {
  name: string;
  latitude: number;
  longitude: number;
};

export const SUPPORTED_CITIES: SupportedCity[] = [
  { name: "Ouagadougou", latitude: 12.3714, longitude: -1.5197 },
  { name: "Bobo-Dioulasso", latitude: 11.1771, longitude: -4.2979 },
  { name: "Koudougou", latitude: 12.2526, longitude: -2.3627 },
  { name: "Ouahigouya", latitude: 13.5828, longitude: -2.4216 },
  { name: "Kaya", latitude: 13.0917, longitude: -1.0844 },
  { name: "Tenkodogo", latitude: 11.78, longitude: -0.3697 },
  { name: "Fada N'gourma", latitude: 12.0616, longitude: 0.3587 },
  { name: "Dori", latitude: 14.0354, longitude: -0.0345 },
  { name: "Gaoua", latitude: 10.3256, longitude: -3.1742 },
  { name: "Banfora", latitude: 10.6333, longitude: -4.7667 },
  { name: "Ziniaré", latitude: 12.5822, longitude: -1.2983 },
  { name: "Dédougou", latitude: 12.4634, longitude: -3.4608 },
  { name: "Manga", latitude: 11.6636, longitude: -1.0731 },
];

const PHARMACY_TTL_MS = 24 * 60 * 60 * 1000;
const HEALTHCARE_TTL_MS = 7 * 24 * 60 * 60 * 1000;
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

function normalizeCityName(value?: string | null) {
  return (value ?? "")
    .trim()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[’']/g, "")
    .replace(/[-_]+/g, " ")
    .replace(/\s+/g, " ")
    .toLowerCase();
}

function findSupportedCity(value?: string | null) {
  const normalized = normalizeCityName(value);
  if (!normalized) return undefined;
  return SUPPORTED_CITIES.find((city) => normalizeCityName(city.name) === normalized);
}

function getRequestedCity(req: Request) {
  const rawCity = typeof req.query.city === "string" ? req.query.city : typeof req.query.ville === "string" ? req.query.ville : undefined;
  return findSupportedCity(rawCity);
}

function normalizeGooglePlace(raw: Record<string, unknown>, type: CachedPlaceType, city: SupportedCity, index: number): CachedHealthPlace | null {
  const geometry = isRecord(raw.geometry) ? raw.geometry : undefined;
  const location = geometry && isRecord(geometry.location) ? geometry.location : undefined;
  const placeId = getString(raw, ["place_id", "id"]);
  const name = getString(raw, ["name", "nom", "title"]);
  if (!name) return null;

  const citySlug = normalizeCityName(city.name).replace(/\s+/g, "-");
  return {
    id: placeId ?? `${citySlug}-${type}-${name.toLowerCase().replace(/[^a-z0-9]+/gi, "-")}-${index}`,
    type,
    name,
    address: getString(raw, ["vicinity", "formatted_address", "address", "adresse"]),
    city: city.name,
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
    const cityKey = normalizeCityName(item.city);
    const key = `${cityKey}:${item.googlePlaceId ?? `${item.type}:${item.name}:${item.latitude ?? ""}:${item.longitude ?? ""}`}`.toLowerCase();
    if (seen.has(key)) continue;
    seen.add(key);
    unique.push(item);
  }
  return unique;
}

async function callGoogleNearby(city: SupportedCity, type: "pharmacy" | "hospital" | "doctor") {
  if (!GOOGLE_API_KEY) {
    throw new Error("GOOGLE_PLACES_API_KEY ou GOOGLE_MAPS_API_KEY non configurée.");
  }

  const url = new URL("https://maps.googleapis.com/maps/api/place/nearbysearch/json");
  url.searchParams.set("key", GOOGLE_API_KEY);
  url.searchParams.set("location", `${city.latitude},${city.longitude}`);
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

async function fetchGoogleItemsForCity(kind: CacheKind, city: SupportedCity) {
  if (kind === "pharmacies") {
    const results = await callGoogleNearby(city, "pharmacy");
    return results.map((item, index) => normalizeGooglePlace(item, "pharmacy", city, index)).filter((item): item is CachedHealthPlace => item !== null);
  }

  const [hospitals, doctors] = await Promise.all([callGoogleNearby(city, "hospital"), callGoogleNearby(city, "doctor")]);
  return [...hospitals, ...doctors].map((item, index) => normalizeGooglePlace(item, "clinic", city, index)).filter((item): item is CachedHealthPlace => item !== null);
}

async function fetchGoogleItems(kind: CacheKind) {
  const settled = await Promise.allSettled(SUPPORTED_CITIES.map((city) => fetchGoogleItemsForCity(kind, city)));
  const items = settled.flatMap((result) => (result.status === "fulfilled" ? result.value : []));
  const errors = settled.filter((result): result is PromiseRejectedResult => result.status === "rejected").map((result) => (result.reason instanceof Error ? result.reason.message : "Erreur Google API inconnue"));

  if (items.length === 0 && errors.length > 0) {
    throw new Error(errors.join(" | "));
  }

  return dedupePlaces(items);
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

function filterItemsByCity(items: CachedHealthPlace[], city?: SupportedCity) {
  if (!city) return items;
  const normalizedCity = normalizeCityName(city.name);
  return items.filter((item) => normalizeCityName(item.city) === normalizedCity);
}

function sendCachedDataset(req: Request, res: Response, kind: CacheKind, rootKey: "pharmacies" | "healthcare" | "cliniques") {
  const state = memoryCache[kind];
  const requestedCity = getRequestedCity(req);
  const items = filterItemsByCity(state.items, requestedCity);
  withCacheHeaders(res, kind);
  res.json({
    [rootKey]: items,
    data: items,
    meta: {
      cache: "server-local-cache",
      kind,
      city: requestedCity?.name ?? null,
      supportedCities: SUPPORTED_CITIES.map((city) => city.name),
      itemCount: items.length,
      totalItemCount: state.items.length,
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
  app.get("/pharmacies", (req, res) => sendCachedDataset(req, res, "pharmacies", "pharmacies"));
  app.get("/pharmacies/nearby", (req, res) => sendCachedDataset(req, res, "pharmacies", "pharmacies"));

  app.get("/healthcare", (req, res) => sendCachedDataset(req, res, "healthcare", "healthcare"));
  app.get("/cliniques/nearby", (req, res) => sendCachedDataset(req, res, "healthcare", "cliniques"));

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
''', encoding='utf-8')

test_path.write_text(r'''import { mkdtemp, writeFile } from "node:fs/promises";
import { tmpdir } from "node:os";
import path from "node:path";

import { afterEach, describe, expect, it, vi } from "vitest";

type FakeRequest = {
  body?: unknown;
  query?: Record<string, unknown>;
  header?: (name: string) => string | undefined;
};

type RegisteredRoute = (req: FakeRequest, res: FakeResponse) => unknown;

type RouteMap = Record<string, RegisteredRoute>;

class FakeResponse {
  public statusCode = 200;
  public headers: Record<string, string> = {};
  public body: unknown = null;

  setHeader(name: string, value: string) {
    this.headers[name] = value;
  }

  status(code: number) {
    this.statusCode = code;
    return this;
  }

  json(payload: unknown) {
    this.body = payload;
    return this;
  }
}

describe("cache backend PharmaGarde", () => {
  afterEach(() => {
    vi.restoreAllMocks();
    vi.resetModules();
    delete process.env.PHARMAGARDE_CACHE_DIR;
    delete process.env.GOOGLE_PLACES_API_KEY;
    delete process.env.GOOGLE_MAPS_API_KEY;
  });

  it("sert les endpoints publics depuis le cache local sans appeler Google", async () => {
    const cacheDir = await mkdtemp(path.join(tmpdir(), "pharmagarde-cache-"));
    const updatedAt = new Date().toISOString();
    const expiresAt = new Date(Date.now() + 60_000).toISOString();

    await writeFile(
      path.join(cacheDir, "pharmacies.json"),
      JSON.stringify({
        version: 1,
        kind: "pharmacies",
        items: [{ id: "ph-1", type: "pharmacy", name: "Pharmacie Centrale", city: "Ouagadougou", source: "local" }],
        updatedAt,
        expiresAt,
        lastRefreshAttemptAt: null,
      }),
      "utf8",
    );

    await writeFile(
      path.join(cacheDir, "healthcare.json"),
      JSON.stringify({
        version: 1,
        kind: "healthcare",
        items: [{ id: "cl-1", type: "clinic", name: "Clinique du Centre", city: "Ouagadougou", source: "local" }],
        updatedAt,
        expiresAt,
        lastRefreshAttemptAt: null,
      }),
      "utf8",
    );

    process.env.PHARMAGARDE_CACHE_DIR = cacheDir;
    const fetchSpy = vi.spyOn(globalThis, "fetch");
    const { initializePharmaGardeCache, registerPharmaGardeCacheRoutes } = await import("../server/pharmagarde-cache");

    await initializePharmaGardeCache();

    const routes: RouteMap = {};
    const app = {
      get: (routePath: string, handler: RegisteredRoute) => {
        routes[`GET ${routePath}`] = handler;
      },
      post: (routePath: string, handler: RegisteredRoute) => {
        routes[`POST ${routePath}`] = handler;
      },
    };

    registerPharmaGardeCacheRoutes(app as never);

    const pharmaciesResponse = new FakeResponse();
    routes["GET /pharmacies"]?.({ header: () => undefined, query: {} }, pharmaciesResponse);

    const healthcareResponse = new FakeResponse();
    routes["GET /healthcare"]?.({ header: () => undefined, query: {} }, healthcareResponse);

    expect(fetchSpy).not.toHaveBeenCalled();
    expect(pharmaciesResponse.headers["X-PharmaGarde-Cache-Source"]).toBe("server-local-cache");
    expect(pharmaciesResponse.body).toMatchObject({
      pharmacies: [{ id: "ph-1", name: "Pharmacie Centrale", city: "Ouagadougou" }],
      meta: { cache: "server-local-cache", kind: "pharmacies", itemCount: 1, totalItemCount: 1, stale: false },
    });
    expect(healthcareResponse.body).toMatchObject({
      healthcare: [{ id: "cl-1", name: "Clinique du Centre", city: "Ouagadougou" }],
      meta: { cache: "server-local-cache", kind: "healthcare", itemCount: 1, totalItemCount: 1, stale: false },
    });
  });

  it("filtre les pharmacies et structures de santé par ville sans appeler Google", async () => {
    const cacheDir = await mkdtemp(path.join(tmpdir(), "pharmagarde-city-cache-"));
    const updatedAt = new Date().toISOString();
    const expiresAt = new Date(Date.now() + 60_000).toISOString();

    await writeFile(
      path.join(cacheDir, "pharmacies.json"),
      JSON.stringify({
        version: 1,
        kind: "pharmacies",
        items: [
          { id: "ph-ouaga", type: "pharmacy", name: "Pharmacie Ouaga", city: "Ouagadougou", source: "local" },
          { id: "ph-kdg", type: "pharmacy", name: "Pharmacie Koudougou", city: "Koudougou", source: "local" },
        ],
        updatedAt,
        expiresAt,
        lastRefreshAttemptAt: null,
      }),
      "utf8",
    );

    await writeFile(
      path.join(cacheDir, "healthcare.json"),
      JSON.stringify({
        version: 1,
        kind: "healthcare",
        items: [
          { id: "cl-bobo", type: "clinic", name: "Clinique Bobo", city: "Bobo-Dioulasso", source: "local" },
          { id: "cl-ziniare", type: "clinic", name: "CSPS Ziniaré", city: "Ziniaré", source: "local" },
        ],
        updatedAt,
        expiresAt,
        lastRefreshAttemptAt: null,
      }),
      "utf8",
    );

    process.env.PHARMAGARDE_CACHE_DIR = cacheDir;
    const fetchSpy = vi.spyOn(globalThis, "fetch");
    const { initializePharmaGardeCache, registerPharmaGardeCacheRoutes } = await import("../server/pharmagarde-cache");

    await initializePharmaGardeCache();

    const routes: RouteMap = {};
    const app = {
      get: (routePath: string, handler: RegisteredRoute) => {
        routes[`GET ${routePath}`] = handler;
      },
      post: (routePath: string, handler: RegisteredRoute) => {
        routes[`POST ${routePath}`] = handler;
      },
    };
    registerPharmaGardeCacheRoutes(app as never);

    const pharmacyResponse = new FakeResponse();
    routes["GET /pharmacies"]?.({ header: () => undefined, query: { city: "Koudougou" } }, pharmacyResponse);

    const healthcareResponse = new FakeResponse();
    routes["GET /healthcare"]?.({ header: () => undefined, query: { city: "Ziniare" } }, healthcareResponse);

    expect(fetchSpy).not.toHaveBeenCalled();
    expect(pharmacyResponse.body).toMatchObject({
      pharmacies: [{ id: "ph-kdg", city: "Koudougou" }],
      meta: { city: "Koudougou", itemCount: 1, totalItemCount: 2 },
    });
    expect(healthcareResponse.body).toMatchObject({
      healthcare: [{ id: "cl-ziniare", city: "Ziniaré" }],
      meta: { city: "Ziniaré", itemCount: 1, totalItemCount: 2 },
    });
  });

  it("collecte Google Places pour toutes les villes supportées et écrit le champ city", async () => {
    const cacheDir = await mkdtemp(path.join(tmpdir(), "pharmagarde-google-cache-"));
    process.env.PHARMAGARDE_CACHE_DIR = cacheDir;
    process.env.GOOGLE_PLACES_API_KEY = "test-key";

    const { SUPPORTED_CITIES, getCacheState, updateCachedDataset } = await import("../server/pharmagarde-cache");
    const fetchMock = vi.spyOn(globalThis, "fetch").mockImplementation(async (input) => {
      const url = new URL(String(input));
      const location = url.searchParams.get("location") ?? "0,0";
      const type = url.searchParams.get("type") ?? "unknown";
      return {
        ok: true,
        json: async () => ({
          status: "OK",
          results: [
            {
              place_id: `${type}-${location}`,
              name: `${type} ${location}`,
              vicinity: "Centre-ville",
              geometry: { location: { lat: Number(location.split(",")[0]), lng: Number(location.split(",")[1]) } },
            },
          ],
        }),
      } as Response;
    });

    const pharmaciesResult = await updateCachedDataset("pharmacies", true);
    const healthcareResult = await updateCachedDataset("healthcare", true);

    expect(pharmaciesResult.ok).toBe(true);
    expect(healthcareResult.ok).toBe(true);
    expect(fetchMock).toHaveBeenCalledTimes(SUPPORTED_CITIES.length * 3);
    expect(getCacheState("pharmacies").items).toHaveLength(SUPPORTED_CITIES.length);
    expect(getCacheState("healthcare").items).toHaveLength(SUPPORTED_CITIES.length * 2);
    expect(getCacheState("pharmacies").items.map((item) => item.city)).toEqual(SUPPORTED_CITIES.map((city) => city.name));
    expect(getCacheState("healthcare").items.every((item) => item.city)).toBe(true);
  });
});
''', encoding='utf-8')
