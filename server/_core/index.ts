import "dotenv/config";
import express from "express";
import { createServer } from "http";
import { createExpressMiddleware } from "@trpc/server/adapters/express";
import { registerOAuthRoutes } from "./oauth";
import { registerStorageProxy } from "./storageProxy";
import { appRouter } from "../routers";
import { createContext } from "./context";
import {
  getNearbyPlaces,
  getPlaces,
  refreshAllCaches,
  startAutoRefresh,
  type PlaceResource,
} from "../services/googlePlacesService";
import { initializePharmaGardeCache, registerPharmaGardeCacheRoutes, startPharmaGardeSchedulers } from "../pharmagarde-cache";

function parseCoordinates(query: { lat?: unknown; lng?: unknown }) {
  const lat = Number(query.lat);
  const lng = Number(query.lng);

  if (!Number.isFinite(lat) || !Number.isFinite(lng)) {
    return {
      ok: false as const,
      status: 400,
      message: "Les paramètres lat et lng sont obligatoires et doivent être numériques.",
    };
  }

  if (lat < -90 || lat > 90 || lng < -180 || lng > 180) {
    return {
      ok: false as const,
      status: 400,
      message: "Coordonnées invalides. lat doit être entre -90 et 90, lng entre -180 et 180.",
    };
  }

  return { ok: true as const, lat, lng };
}

function parseLimit(value: unknown) {
  if (value === undefined) return undefined;

  const limit = Number(value);
  return Number.isFinite(limit) && limit > 0 ? limit : undefined;
}

async function startServer() {
  const app = express();
  const server = createServer(app);

  // Register PharmaGarde public REST routes immediately so /pharmacies and /healthcare remain reachable.
  registerPharmaGardeCacheRoutes(app);

  app.use((req, res, next) => {
    const configuredOrigin = process.env.CORS_ORIGIN;
    const requestOrigin = req.headers.origin;
    const allowedOrigin = configuredOrigin || requestOrigin;

    if (allowedOrigin) {
      res.header("Access-Control-Allow-Origin", allowedOrigin);
    }

    res.header("Access-Control-Allow-Methods", "GET, POST, PUT, DELETE, OPTIONS");
    res.header(
      "Access-Control-Allow-Headers",
      "Origin, X-Requested-With, Content-Type, Accept, Authorization",
    );
    res.header("Access-Control-Allow-Credentials", "true");

    if (req.method === "OPTIONS") {
      res.sendStatus(200);
      return;
    }

    next();
  });

  app.use(express.json({ limit: "50mb" }));
  app.use(express.urlencoded({ limit: "50mb", extended: true }));

  app.get("/", (_req, res) => {
    res.type("text/plain").send("API OK");
  });

  app.get("/health", (_req, res) => {
    res.json({ status: "ok" });
  });

  app.get("/pharmacies", async (_req, res) => {
    try {
      const pharmacies = await getPlaces("pharmacies");
      res.json(pharmacies);
    } catch (error) {
      console.error("[GET /pharmacies]", error);
      res.status(503).json([]);
    }
  });

  app.get("/pharmacies/nearby", async (req, res) => {
    const coordinates = parseCoordinates(req.query);

    if (!coordinates.ok) {
      res.status(coordinates.status).json({ error: coordinates.message });
      return;
    }

    try {
      const pharmacies = await getNearbyPlaces(
        "pharmacies",
        coordinates.lat,
        coordinates.lng,
        parseLimit(req.query.limit),
      );
      res.json(pharmacies);
    } catch (error) {
      console.error("[GET /pharmacies/nearby]", error);
      res.status(503).json([]);
    }
  });

  const registerClinicRoutes = (pathPrefix: string, resourceName: PlaceResource) => {
    app.get(pathPrefix, async (_req, res) => {
      try {
        const clinics = await getPlaces(resourceName);
        res.json(clinics);
      } catch (error) {
        console.error(`[GET ${pathPrefix}]`, error);
        res.status(503).json([]);
      }
    });

    app.get(`${pathPrefix}/nearby`, async (req, res) => {
      const coordinates = parseCoordinates(req.query);

      if (!coordinates.ok) {
        res.status(coordinates.status).json({ error: coordinates.message });
        return;
      }

      try {
        const clinics = await getNearbyPlaces(
          resourceName,
          coordinates.lat,
          coordinates.lng,
          parseLimit(req.query.limit),
        );
        res.json(clinics);
      } catch (error) {
        console.error(`[GET ${pathPrefix}/nearby]`, error);
        res.status(503).json([]);
      }
    });
  };

  registerClinicRoutes("/clinics", "clinics");
  registerClinicRoutes("/cliniques", "clinics");

  await initializePharmaGardeCache();
  registerStorageProxy(app);
  registerOAuthRoutes(app);
  startPharmaGardeSchedulers();

  app.get("/api/health", (_req, res) => {
    res.json({ ok: true, timestamp: Date.now() });
  });

  app.use(
    "/api/trpc",
    createExpressMiddleware({
      router: appRouter,
      createContext,
    }),
  );

  const port = parseInt(process.env.PORT || "3000", 10);

  server.listen(port, () => {
    console.log(`[api] server listening on port ${port}`);

    refreshAllCaches().catch((error: unknown) => {
      console.error("[Cache warmup] Le préchargement Google Places a échoué:", error instanceof Error ? error.message : error);
    });

    startAutoRefresh();
  });
}

startServer().catch(console.error);
