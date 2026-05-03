const GOOGLE_NEARBY_URL = "https://maps.googleapis.com/maps/api/place/nearbysearch/json";
const GOOGLE_DETAILS_URL = "https://maps.googleapis.com/maps/api/place/details/json";

const DEFAULT_CACHE_TTL_HOURS = 24;
const DEFAULT_RADIUS_METERS = 25_000;
const DEFAULT_MAX_PAGES = 1;
const DEFAULT_DETAILS_CONCURRENCY = 3;

const CACHE_TTL_MS = hoursToMs(Number(process.env.CACHE_TTL_HOURS || DEFAULT_CACHE_TTL_HOURS));
const RADIUS_METERS = Number(process.env.GOOGLE_PLACES_RADIUS_METERS || DEFAULT_RADIUS_METERS);
const MAX_PAGES = clamp(Number(process.env.GOOGLE_PLACES_MAX_PAGES || DEFAULT_MAX_PAGES), 1, 3);
const DETAILS_CONCURRENCY = clamp(Number(process.env.GOOGLE_DETAILS_CONCURRENCY || DEFAULT_DETAILS_CONCURRENCY), 1, 5);

export type PlaceResource = "pharmacies" | "clinics";

export type GoogleBackedPlace = {
  id: string;
  googlePlaceId: string;
  type: "pharmacy" | "clinic";
  category: "pharmacy" | "healthcare";
  name: string;
  latitude: number;
  longitude: number;
  adresse: string | null;
  phone: string | null;
  city: string;
  isOpenNow: boolean | null;
  rating: number | null;
  userRatingsTotal: number | null;
  source: "Google Places API";
  distance?: number;
  distanceUnit?: "km";
};

type CacheEntry = {
  data: GoogleBackedPlace[];
  lastFetchedAt: string | null;
  expiresAt: string | null;
  inFlight: Promise<GoogleBackedPlace[]> | null;
  lastError: { message: string; at: string } | null;
};

type SearchLocation = {
  city: string;
  lat: number;
  lng: number;
};

type ResourceConfig = {
  googleType: "pharmacy" | "hospital";
  label: string;
};

type GoogleNearbyPlace = {
  place_id?: string;
  name?: string;
  vicinity?: string;
  formatted_address?: string;
  geometry?: {
    location?: {
      lat?: number;
      lng?: number;
    };
  };
  opening_hours?: {
    open_now?: boolean;
  };
  rating?: number;
  user_ratings_total?: number;
  types?: string[];
};

type GoogleNearbyPayload = {
  status?: string;
  error_message?: string;
  results?: GoogleNearbyPlace[];
  next_page_token?: string;
};

type GoogleDetailsPayload = {
  status?: string;
  result?: {
    formatted_phone_number?: string;
    international_phone_number?: string;
  };
};

const SEARCH_LOCATIONS: SearchLocation[] = [
  { city: "Ouagadougou", lat: 12.3714, lng: -1.5197 },
  { city: "Bobo-Dioulasso", lat: 11.1771, lng: -4.2979 },
];

const RESOURCE_CONFIG: Record<PlaceResource, ResourceConfig> = {
  pharmacies: {
    googleType: "pharmacy",
    label: "pharmacies",
  },
  clinics: {
    googleType: "hospital",
    label: "cliniques",
  },
};

const cache: Record<PlaceResource, CacheEntry> = {
  pharmacies: createEmptyCacheEntry(),
  clinics: createEmptyCacheEntry(),
};

let autoRefreshStarted = false;

function createEmptyCacheEntry(): CacheEntry {
  return {
    data: [],
    lastFetchedAt: null,
    expiresAt: null,
    inFlight: null,
    lastError: null,
  };
}

export function isGooglePlacesConfigured() {
  return Boolean(process.env.GOOGLE_MAPS_API_KEY);
}

export async function getPlaces(resourceName: PlaceResource) {
  validateResource(resourceName);

  if (!isGooglePlacesConfigured()) {
    const entry = cache[resourceName];
    entry.lastError = {
      message: "GOOGLE_MAPS_API_KEY non configurée ; réponse vide retournée.",
      at: new Date().toISOString(),
    };
    return [];
  }

  const entry = cache[resourceName];

  if (isCacheValid(entry)) {
    return entry.data;
  }

  return refreshCache(resourceName);
}

export async function getNearbyPlaces(resourceName: PlaceResource, lat: number, lng: number, limit?: number) {
  validateResource(resourceName);

  const normalizedLimit = Number.isFinite(limit) && Number(limit) > 0 ? Math.min(Math.floor(Number(limit)), 100) : undefined;
  const places = await getPlaces(resourceName);

  const sorted = places
    .filter((place) => Number.isFinite(place.latitude) && Number.isFinite(place.longitude))
    .map((place) => ({
      ...place,
      distance: roundTo(haversineKm(lat, lng, place.latitude, place.longitude), 2),
      distanceUnit: "km" as const,
    }))
    .sort((a, b) => a.distance - b.distance);

  return normalizedLimit ? sorted.slice(0, normalizedLimit) : sorted;
}

export async function refreshAllCaches() {
  if (!isGooglePlacesConfigured()) {
    return;
  }

  const resources = Object.keys(RESOURCE_CONFIG) as PlaceResource[];
  const results = await Promise.allSettled(resources.map((resourceName) => refreshCache(resourceName)));

  results.forEach((result, index) => {
    const resourceName = resources[index];
    if (result.status === "rejected") {
      console.error(`[refreshAllCaches] Échec du cache ${resourceName}:`, result.reason instanceof Error ? result.reason.message : result.reason);
    }
  });
}

export function startAutoRefresh() {
  if (autoRefreshStarted || !isGooglePlacesConfigured()) return;
  autoRefreshStarted = true;

  setInterval(() => {
    refreshAllCaches().catch((error: unknown) => {
      console.error("[Auto refresh] Échec du rafraîchissement Google Places:", error instanceof Error ? error.message : error);
    });
  }, CACHE_TTL_MS);
}

export function getCacheMetadata(resourceName: PlaceResource) {
  validateResource(resourceName);
  const entry = cache[resourceName];

  return {
    cached: true,
    configured: isGooglePlacesConfigured(),
    lastFetchedAt: entry.lastFetchedAt,
    expiresAt: entry.expiresAt,
    cacheTtlHours: CACHE_TTL_MS / 3_600_000,
    source: "Google Places API",
    locations: SEARCH_LOCATIONS.map(({ city, lat, lng }) => ({ city, lat, lng })),
    lastError: entry.lastError,
  };
}

async function refreshCache(resourceName: PlaceResource) {
  validateResource(resourceName);
  const entry = cache[resourceName];

  if (entry.inFlight) {
    return entry.inFlight;
  }

  entry.inFlight = (async () => {
    try {
      const freshData = await fetchPlacesForResource(resourceName);
      const now = new Date();

      entry.data = freshData;
      entry.lastFetchedAt = now.toISOString();
      entry.expiresAt = new Date(now.getTime() + CACHE_TTL_MS).toISOString();
      entry.lastError = null;

      return entry.data;
    } catch (error) {
      entry.lastError = {
        message: error instanceof Error ? error.message : String(error),
        at: new Date().toISOString(),
      };

      if (entry.data.length > 0) {
        console.warn(`[${resourceName}] Google Places indisponible, ancien cache retourné.`);
        return entry.data;
      }

      throw error;
    } finally {
      entry.inFlight = null;
    }
  })();

  return entry.inFlight;
}

async function fetchPlacesForResource(resourceName: PlaceResource) {
  const apiKey = process.env.GOOGLE_MAPS_API_KEY;

  if (!apiKey) {
    throw new Error("GOOGLE_MAPS_API_KEY est manquante dans les variables d’environnement.");
  }

  const { googleType } = RESOURCE_CONFIG[resourceName];
  const byPlaceId = new Map<string, GoogleBackedPlace>();

  for (const location of SEARCH_LOCATIONS) {
    const nearbyResults = await fetchNearbySearchPages({ apiKey, googleType, location });

    for (const place of nearbyResults) {
      if (!place.place_id || byPlaceId.has(place.place_id)) continue;

      const normalized = normalizeNearbyPlace(place, location.city, resourceName);
      if (normalized) {
        byPlaceId.set(place.place_id, normalized);
      }
    }
  }

  const normalizedPlaces = [...byPlaceId.values()];
  return hydratePhones(normalizedPlaces, apiKey);
}

async function fetchNearbySearchPages({ apiKey, googleType, location }: { apiKey: string; googleType: string; location: SearchLocation }) {
  const allResults: GoogleNearbyPlace[] = [];
  let pageToken: string | null = null;

  for (let page = 1; page <= MAX_PAGES; page += 1) {
    if (pageToken) {
      await sleep(2_000);
    }

    const url = new URL(GOOGLE_NEARBY_URL);
    url.searchParams.set("key", apiKey);
    url.searchParams.set("type", googleType);

    if (pageToken) {
      url.searchParams.set("pagetoken", pageToken);
    } else {
      url.searchParams.set("location", `${location.lat},${location.lng}`);
      url.searchParams.set("radius", String(RADIUS_METERS));
    }

    const payload = await fetchGoogleJson<GoogleNearbyPayload>(url);

    if (payload.status === "ZERO_RESULTS") break;
    if (payload.status !== "OK") {
      throw new Error(
        `Google Nearby Search a échoué pour ${location.city} (${googleType}): ${payload.status}${payload.error_message ? ` - ${payload.error_message}` : ""}`,
      );
    }

    allResults.push(...(payload.results || []));
    pageToken = payload.next_page_token || null;

    if (!pageToken) break;
  }

  return allResults;
}

async function hydratePhones(places: GoogleBackedPlace[], apiKey: string) {
  const hydrated: GoogleBackedPlace[] = [];

  for (let index = 0; index < places.length; index += DETAILS_CONCURRENCY) {
    const chunk = places.slice(index, index + DETAILS_CONCURRENCY);

    const chunkResults = await Promise.all(
      chunk.map(async (place) => {
        const phone = await fetchPlacePhone(place.googlePlaceId, apiKey);
        return {
          ...place,
          phone,
        };
      }),
    );

    hydrated.push(...chunkResults);
  }

  return hydrated.sort((a, b) => a.city.localeCompare(b.city) || a.name.localeCompare(b.name));
}

async function fetchPlacePhone(placeId: string, apiKey: string) {
  const url = new URL(GOOGLE_DETAILS_URL);
  url.searchParams.set("key", apiKey);
  url.searchParams.set("place_id", placeId);
  url.searchParams.set("fields", "formatted_phone_number,international_phone_number");

  try {
    const payload = await fetchGoogleJson<GoogleDetailsPayload>(url);

    if (payload.status === "OK") {
      return payload.result?.international_phone_number || payload.result?.formatted_phone_number || null;
    }

    if (payload.status === "NOT_FOUND" || payload.status === "ZERO_RESULTS") {
      return null;
    }

    console.warn(`[Place Details] Téléphone indisponible pour ${placeId}: ${payload.status}`);
    return null;
  } catch (error) {
    console.warn(`[Place Details] Erreur téléphone pour ${placeId}:`, error instanceof Error ? error.message : error);
    return null;
  }
}

async function fetchGoogleJson<T>(url: URL): Promise<T> {
  const response = await fetch(url, {
    signal: AbortSignal.timeout(12_000),
    headers: {
      Accept: "application/json",
    },
  });

  if (!response.ok) {
    throw new Error(`Erreur HTTP Google Places: ${response.status} ${response.statusText}`);
  }

  return response.json() as Promise<T>;
}

function hasGoogleType(place: GoogleNearbyPlace, googleType: string) {
  return Array.isArray(place.types) && place.types.some((type) => type === googleType);
}

function normalizeNearbyPlace(place: GoogleNearbyPlace, city: string, resourceName: PlaceResource): GoogleBackedPlace | null {
  const latitude = place.geometry?.location?.lat;
  const longitude = place.geometry?.location?.lng;

  if (!place.place_id || !Number.isFinite(latitude) || !Number.isFinite(longitude)) {
    return null;
  }

  if (resourceName === "pharmacies" && !hasGoogleType(place, "pharmacy")) {
    return null;
  }

  if (resourceName === "clinics" && hasGoogleType(place, "pharmacy")) {
    return null;
  }

  const type = resourceName === "pharmacies" ? "pharmacy" : "clinic";

  return {
    id: place.place_id,
    googlePlaceId: place.place_id,
    type,
    category: resourceName === "pharmacies" ? "pharmacy" : "healthcare",
    name: place.name || "Nom indisponible",
    latitude: Number(latitude),
    longitude: Number(longitude),
    adresse: place.vicinity || place.formatted_address || null,
    phone: null,
    city,
    isOpenNow: typeof place.opening_hours?.open_now === "boolean" ? place.opening_hours.open_now : null,
    rating: typeof place.rating === "number" ? place.rating : null,
    userRatingsTotal: typeof place.user_ratings_total === "number" ? place.user_ratings_total : null,
    source: "Google Places API",
  };
}

function haversineKm(lat1: number, lng1: number, lat2: number, lng2: number) {
  const earthRadiusKm = 6_371;
  const dLat = toRadians(lat2 - lat1);
  const dLng = toRadians(lng2 - lng1);

  const a = Math.sin(dLat / 2) ** 2 + Math.cos(toRadians(lat1)) * Math.cos(toRadians(lat2)) * Math.sin(dLng / 2) ** 2;

  return earthRadiusKm * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
}

function validateResource(resourceName: PlaceResource) {
  if (!RESOURCE_CONFIG[resourceName]) {
    throw new Error(`Ressource inconnue: ${resourceName}`);
  }
}

function isCacheValid(entry: CacheEntry) {
  return entry.data.length > 0 && entry.expiresAt && new Date(entry.expiresAt).getTime() > Date.now();
}

function hoursToMs(hours: number) {
  return Math.max(hours, 1) * 3_600_000;
}

function clamp(value: number, min: number, max: number) {
  if (!Number.isFinite(value)) return min;
  return Math.min(Math.max(Math.floor(value), min), max);
}

function roundTo(value: number, decimals: number) {
  const factor = 10 ** decimals;
  return Math.round(value * factor) / factor;
}

function toRadians(degrees: number) {
  return (degrees * Math.PI) / 180;
}

function sleep(ms: number) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}
