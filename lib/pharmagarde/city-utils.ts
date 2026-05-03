import { KNOWN_BURKINA_CITIES, PHARMAGARDE_CITIES } from "./city-coordinates";
import { Coordinates, HealthPlace } from "./types";

export { PHARMAGARDE_CITIES };

function normalizeText(value?: string | null) {
  return (value ?? "")
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .replace(/[’']/g, " ")
    .replace(/[^a-z0-9]+/g, " ")
    .trim();
}

export function distanceKm(a: Coordinates, b: Coordinates) {
  const radiusKm = 6371;
  const dLat = ((b.latitude - a.latitude) * Math.PI) / 180;
  const dLon = ((b.longitude - a.longitude) * Math.PI) / 180;
  const lat1 = (a.latitude * Math.PI) / 180;
  const lat2 = (b.latitude * Math.PI) / 180;
  const h = Math.sin(dLat / 2) ** 2 + Math.cos(lat1) * Math.cos(lat2) * Math.sin(dLon / 2) ** 2;
  return 2 * radiusKm * Math.asin(Math.sqrt(h));
}

export function getKnownCityCoordinates(cityName?: string | null): Coordinates {
  const normalizedCityName = normalizeCityName(cityName);
  const city = KNOWN_BURKINA_CITIES.find((knownCity) => knownCity.name === normalizedCityName) ?? KNOWN_BURKINA_CITIES[0];
  return { latitude: city.latitude, longitude: city.longitude };
}

export function inferCityFromAddressParts(parts: Array<string | null | undefined>) {
  const normalizedParts = parts.map(normalizeText).filter(Boolean);
  for (const city of KNOWN_BURKINA_CITIES) {
    const normalizedName = normalizeText(city.name);
    const aliases = city.aliases.map(normalizeText);
    if (normalizedParts.some((part) => part === normalizedName || part.includes(normalizedName) || aliases.some((alias) => part === alias || part.includes(alias)))) {
      return city.name;
    }
  }
  return undefined;
}

export function inferNearestKnownCity(coordinates: Coordinates) {
  return KNOWN_BURKINA_CITIES
    .map((city) => ({ city, distance: distanceKm(coordinates, city) }))
    .sort((a, b) => a.distance - b.distance)[0]?.city.name ?? "Ouagadougou";
}

export function normalizeCityName(value?: string | null) {
  return inferCityFromAddressParts([value]) ?? (typeof value === "string" && value.trim() ? value.trim() : "Ouagadougou");
}

export function placeMatchesCity(place: HealthPlace, city: string) {
  if (!place.city) return true;
  return normalizeCityName(place.city) === normalizeCityName(city);
}

export function filterPlacesByCity(places: HealthPlace[], city: string) {
  return places.filter((place) => placeMatchesCity(place, city));
}
