import { mkdtemp, writeFile } from "node:fs/promises";
import { tmpdir } from "node:os";
import path from "node:path";

import { afterEach, describe, expect, it, vi } from "vitest";

type RegisteredRoute = (req: { body?: unknown; header?: (name: string) => string | undefined }, res: FakeResponse) => unknown;

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
        items: [{ id: "ph-1", type: "pharmacy", name: "Pharmacie Centrale", source: "local" }],
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
        items: [{ id: "cl-1", type: "clinic", name: "Clinique du Centre", source: "local" }],
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
    routes["GET /pharmacies"]?.({ header: () => undefined }, pharmaciesResponse);

    const healthcareResponse = new FakeResponse();
    routes["GET /healthcare"]?.({ header: () => undefined }, healthcareResponse);

    expect(fetchSpy).not.toHaveBeenCalled();
    expect(pharmaciesResponse.headers["X-PharmaGarde-Cache-Source"]).toBe("server-local-cache");
    expect(pharmaciesResponse.body).toMatchObject({
      pharmacies: [{ id: "ph-1", name: "Pharmacie Centrale" }],
      meta: { cache: "server-local-cache", kind: "pharmacies", itemCount: 1, stale: false },
    });
    expect(healthcareResponse.body).toMatchObject({
      healthcare: [{ id: "cl-1", name: "Clinique du Centre" }],
      meta: { cache: "server-local-cache", kind: "healthcare", itemCount: 1, stale: false },
    });
  });
});
