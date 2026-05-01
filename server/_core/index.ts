import "dotenv/config";
import express from "express";
import { createServer } from "http";
import { createExpressMiddleware } from "@trpc/server/adapters/express";
import { registerOAuthRoutes } from "./oauth";
import { registerStorageProxy } from "./storageProxy";
import { appRouter } from "../routers";
import { createContext } from "./context";
import { clinics, getNearbyPlaces, pharmacies } from "../data/healthPlaces";

function readNumericQueryValue(value: unknown) {
  const rawValue = Array.isArray(value) ? value[0] : value;
  if (typeof rawValue === "number" && Number.isFinite(rawValue)) return rawValue;
  if (typeof rawValue === "string") {
    const parsedValue = Number(rawValue.replace(",", "."));
    if (Number.isFinite(parsedValue)) return parsedValue;
  }
  return undefined;
}

function readNearbyQuery(query: Record<string, unknown>) {
  const lat = readNumericQueryValue(query.lat ?? query.latitude);
  const lng = readNumericQueryValue(query.lng ?? query.longitude ?? query.lon);
  const maxDistanceKm = readNumericQueryValue(query.maxDistanceKm ?? query.radiusKm ?? query.distanceKm) ?? 25;

  if (lat === undefined || lng === undefined) {
    return {
      ok: false as const,
      error: "Les paramètres lat et lng sont requis et doivent être numériques.",
    };
  }

  if (maxDistanceKm <= 0) {
    return {
      ok: false as const,
      error: "Le rayon de recherche doit être supérieur à 0 km.",
    };
  }

  return { ok: true as const, origin: { lat, lng }, maxDistanceKm };
}

async function startServer() {
  const app = express();
  const server = createServer(app);

  // Enable CORS for all routes - reflect the request origin to support credentials
  app.use((req, res, next) => {
    const origin = req.headers.origin;
    if (origin) {
      res.header("Access-Control-Allow-Origin", origin);
    }
    res.header("Access-Control-Allow-Methods", "GET, POST, PUT, DELETE, OPTIONS");
    res.header(
      "Access-Control-Allow-Headers",
      "Origin, X-Requested-With, Content-Type, Accept, Authorization",
    );
    res.header("Access-Control-Allow-Credentials", "true");

    // Handle preflight requests
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

  app.get("/pharmacies", (_req, res) => {
    res.json(pharmacies);
  });

  app.get("/pharmacies/nearby", (req, res) => {
    const parsedQuery = readNearbyQuery(req.query as Record<string, unknown>);
    if (!parsedQuery.ok) {
      res.status(400).json({ error: parsedQuery.error });
      return;
    }

    res.json(getNearbyPlaces(pharmacies, parsedQuery.origin, parsedQuery.maxDistanceKm));
  });

  app.get("/clinics", (_req, res) => {
    res.json(clinics);
  });

  app.get("/clinics/nearby", (req, res) => {
    const parsedQuery = readNearbyQuery(req.query as Record<string, unknown>);
    if (!parsedQuery.ok) {
      res.status(400).json({ error: parsedQuery.error });
      return;
    }

    res.json(getNearbyPlaces(clinics, parsedQuery.origin, parsedQuery.maxDistanceKm));
  });

  app.get("/cliniques", (_req, res) => {
    res.json(clinics);
  });

  app.get("/cliniques/nearby", (req, res) => {
    const parsedQuery = readNearbyQuery(req.query as Record<string, unknown>);
    if (!parsedQuery.ok) {
      res.status(400).json({ error: parsedQuery.error });
      return;
    }

    res.json(getNearbyPlaces(clinics, parsedQuery.origin, parsedQuery.maxDistanceKm));
  });

  registerStorageProxy(app);
  registerOAuthRoutes(app);

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
  });
}

startServer().catch(console.error);
