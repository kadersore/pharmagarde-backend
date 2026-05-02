import { mkdtemp, writeFile } from "node:fs/promises";
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

function createRouteMap(registerPharmaGardeCacheRoutes: (app: never) => void) {
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
  return routes;
}

describe("cache backend PharmaGarde", () => {
  afterEach(() => {
    vi.restoreAllMocks();
    vi.resetModules();
    delete process.env.PHARMAGARDE_CACHE_DIR;
    delete process.env.GOOGLE_PLACES_API_KEY;
    delete process.env.GOOGLE_MAPS_API_KEY;
  });

  it("sert les endpoints publics depuis le cache local par ville sans appeler Google", async () => {
    const cacheDir = await mkdtemp(path.join(tmpdir(), "pharmagarde-cache-"));
    const updatedAt = new Date().toISOString();
    const expiresAt = new Date(Date.now() + 60_000).toISOString();

    await writeFile(
      path.join(cacheDir, "pharmacies.json"),
      JSON.stringify({
        version: 2,
        kind: "pharmacies",
        byCity: {
          ouagadougou: [{ id: "ph-1", type: "pharmacy", name: "Pharmacie Centrale", city: "Ouagadougou", source: "local" }],
        },
        updatedAt,
        expiresAt,
        lastRefreshAttemptAt: null,
      }),
      "utf8",
    );

    await writeFile(
      path.join(cacheDir, "healthcare.json"),
      JSON.stringify({
        version: 2,
        kind: "healthcare",
        byCity: {
          ouagadougou: [{ id: "cl-1", type: "clinic", name: "Clinique du Centre", city: "Ouagadougou", source: "local" }],
        },
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
    const routes = createRouteMap(registerPharmaGardeCacheRoutes as never);

    const pharmaciesResponse = new FakeResponse();
    routes["GET /pharmacies"]?.({ header: () => undefined, query: {} }, pharmaciesResponse);

    const healthcareResponse = new FakeResponse();
    routes["GET /healthcare"]?.({ header: () => undefined, query: {} }, healthcareResponse);

    expect(fetchSpy).not.toHaveBeenCalled();
    expect(pharmaciesResponse.headers["X-PharmaGarde-Cache-Source"]).toBe("server-local-cache-by-city");
    expect(pharmaciesResponse.body).toMatchObject({
      pharmacies: [{ id: "ph-1", name: "Pharmacie Centrale", city: "Ouagadougou" }],
      meta: { cache: "server-local-cache-by-city", kind: "pharmacies", itemCount: 1, totalItemCount: 1, stale: false },
    });
    expect(healthcareResponse.body).toMatchObject({
      healthcare: [{ id: "cl-1", name: "Clinique du Centre", city: "Ouagadougou" }],
      meta: { cache: "server-local-cache-by-city", kind: "healthcare", itemCount: 1, totalItemCount: 1, stale: false },
    });
  });

  it("filtre strictement pharmacies et structures de santé par clé de ville normalisée", async () => {
    const cacheDir = await mkdtemp(path.join(tmpdir(), "pharmagarde-city-cache-"));
    const updatedAt = new Date().toISOString();
    const expiresAt = new Date(Date.now() + 60_000).toISOString();

    await writeFile(
      path.join(cacheDir, "pharmacies.json"),
      JSON.stringify({
        version: 2,
        kind: "pharmacies",
        byCity: {
          ouagadougou: [{ id: "ph-ouaga", type: "pharmacy", name: "Pharmacie Ouaga", city: "Ouagadougou", source: "local" }],
          "bobo-dioulasso": [{ id: "ph-bobo", type: "pharmacy", name: "Pharmacie Bobo", city: "Bobo-Dioulasso", source: "local" }],
          koudougou: [{ id: "ph-kdg", type: "pharmacy", name: "Pharmacie Koudougou", city: "Koudougou", source: "local" }],
          kaya: [{ id: "ph-kaya", type: "pharmacy", name: "Pharmacie Kaya", city: "Kaya", source: "local" }],
        },
        updatedAt,
        expiresAt,
        lastRefreshAttemptAt: null,
      }),
      "utf8",
    );

    await writeFile(
      path.join(cacheDir, "healthcare.json"),
      JSON.stringify({
        version: 2,
        kind: "healthcare",
        byCity: {
          "bobo-dioulasso": [{ id: "cl-bobo", type: "clinic", name: "Clinique Bobo", city: "Bobo-Dioulasso", source: "local" }],
          ziniare: [{ id: "cl-ziniare", type: "clinic", name: "CSPS Ziniaré", city: "Ziniaré", source: "local" }],
          koudougou: [{ id: "cl-kdg", type: "clinic", name: "CMA Koudougou", city: "Koudougou", source: "local" }],
        },
        updatedAt,
        expiresAt,
        lastRefreshAttemptAt: null,
      }),
      "utf8",
    );

    process.env.PHARMAGARDE_CACHE_DIR = cacheDir;
    const fetchSpy = vi.spyOn(globalThis, "fetch");
    const infoSpy = vi.spyOn(console, "info").mockImplementation(() => undefined);
    const { initializePharmaGardeCache, registerPharmaGardeCacheRoutes } = await import("../server/pharmagarde-cache");

    await initializePharmaGardeCache();
    const routes = createRouteMap(registerPharmaGardeCacheRoutes as never);

    const koudougouResponse = new FakeResponse();
    routes["GET /pharmacies"]?.({ header: () => undefined, query: { city: "kOuDoUgOu" } }, koudougouResponse);

    const kayaResponse = new FakeResponse();
    routes["GET /pharmacies"]?.({ header: () => undefined, query: { city: "Kaya" } }, kayaResponse);

    const allPharmaciesResponse = new FakeResponse();
    routes["GET /pharmacies"]?.({ header: () => undefined, query: {} }, allPharmaciesResponse);

    const unsupportedCityResponse = new FakeResponse();
    routes["GET /pharmacies"]?.({ header: () => undefined, query: { city: "Ville Introuvable" } }, unsupportedCityResponse);

    const healthcareResponse = new FakeResponse();
    routes["GET /healthcare"]?.({ header: () => undefined, query: { city: "Ziniare" } }, healthcareResponse);

    expect(fetchSpy).not.toHaveBeenCalled();
    expect(koudougouResponse.body).toMatchObject({
      pharmacies: [{ id: "ph-kdg", city: "Koudougou" }],
      meta: { city: "Koudougou", cityKey: "koudougou", itemCount: 1, totalItemCount: 4 },
    });
    expect(koudougouResponse.body).not.toMatchObject({
      pharmacies: expect.arrayContaining([{ id: "ph-ouaga" }, { id: "ph-bobo" }, { id: "ph-kaya" }]),
    });
    expect(kayaResponse.body).toMatchObject({
      pharmacies: [{ id: "ph-kaya", city: "Kaya" }],
      meta: { city: "Kaya", cityKey: "kaya", itemCount: 1, totalItemCount: 4 },
    });
    expect(allPharmaciesResponse.body).toMatchObject({
      meta: { city: null, itemCount: 4, totalItemCount: 4 },
    });
    expect(unsupportedCityResponse.body).toMatchObject({
      pharmacies: [],
      meta: { city: "Ville Introuvable", cityKey: "ville-introuvable", itemCount: 0, totalItemCount: 4 },
    });
    expect(healthcareResponse.body).toMatchObject({
      healthcare: [{ id: "cl-ziniare", city: "Ziniaré" }],
      meta: { city: "Ziniaré", cityKey: "ziniare", itemCount: 1, totalItemCount: 3 },
    });
    expect(infoSpy).toHaveBeenCalledWith("[PharmaGardeCache] pharmacies: ville demandée=Koudougou, résultats retournés=1");
    expect(infoSpy).toHaveBeenCalledWith("[PharmaGardeCache] pharmacies: ville demandée=toutes, résultats retournés=4");
    expect(infoSpy).toHaveBeenCalledWith("[PharmaGardeCache] pharmacies: ville demandée=Ville Introuvable, résultats retournés=0");
    expect(infoSpy).toHaveBeenCalledWith("[PharmaGardeCache] healthcare: ville demandée=Ziniaré, résultats retournés=1");
  });

  it("ignore complètement l’ancien cache plat version 1", async () => {
    const cacheDir = await mkdtemp(path.join(tmpdir(), "pharmagarde-legacy-cache-"));
    const updatedAt = new Date().toISOString();
    const expiresAt = new Date(Date.now() + 60_000).toISOString();

    await writeFile(
      path.join(cacheDir, "pharmacies.json"),
      JSON.stringify({
        version: 1,
        kind: "pharmacies",
        items: [{ id: "ph-legacy", type: "pharmacy", name: "Ancienne pharmacie globale", city: "Ouagadougou", source: "local" }],
        updatedAt,
        expiresAt,
        lastRefreshAttemptAt: null,
      }),
      "utf8",
    );

    process.env.PHARMAGARDE_CACHE_DIR = cacheDir;
    const { initializePharmaGardeCache, registerPharmaGardeCacheRoutes } = await import("../server/pharmagarde-cache");

    await initializePharmaGardeCache();
    const routes = createRouteMap(registerPharmaGardeCacheRoutes as never);
    const response = new FakeResponse();
    routes["GET /pharmacies"]?.({ header: () => undefined, query: { city: "Ouagadougou" } }, response);

    expect(response.body).toMatchObject({
      pharmacies: [],
      meta: { cache: "server-local-cache-by-city", city: "Ouagadougou", cityKey: "ouagadougou", itemCount: 0, totalItemCount: 0 },
    });
  });

  it("collecte Google Places avec les coordonnées de chaque ville et stocke par clé de ville", async () => {
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

    for (const city of SUPPORTED_CITIES) {
      const key = city.name
        .normalize("NFD")
        .replace(/[\u0300-\u036f]/g, "")
        .replace(/[’']/g, "")
        .replace(/[-_]+/g, " ")
        .replace(/\s+/g, " ")
        .toLowerCase()
        .replace(/\s+/g, "-");
      expect(getCacheState("pharmacies").byCity[key]).toHaveLength(1);
      expect(getCacheState("pharmacies").byCity[key][0]?.city).toBe(city.name);
      expect(getCacheState("healthcare").byCity[key]).toHaveLength(2);
      expect(getCacheState("healthcare").byCity[key].every((item) => item.city === city.name)).toBe(true);
    }
  });
});
