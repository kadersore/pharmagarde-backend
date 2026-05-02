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
