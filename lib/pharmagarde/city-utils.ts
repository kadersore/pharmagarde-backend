import { Coordinates, HealthPlace } from "./types";

type KnownCity = Coordinates & {
  name: string;
  aliases: string[];
};

export const PHARMAGARDE_CITIES = [
  "Ouagadougou",
  "Bobo-Dioulasso",
  "Koudougou",
  "Ouahigouya",
  "Kaya",
  "Tenkodogo",
  "Fada N'gourma",
  "Dori",
  "Gaoua",
  "Banfora",
  "Ziniaré",
  "Dédougou",
  "Manga",
] as const;

const KNOWN_BURKINA_CITIES: KnownCity[] = [
  { name: "Ouagadougou", latitude: 12.3714, longitude: -1.5197, aliases: ["ouagadougou", "ouaga", "kadiogo"] },
  { name: "Bobo-Dioulasso", latitude: 11.1784, longitude: -4.2979, aliases: ["bobo-dioulasso", "bobo dioulasso", "bobo", "houet"] },
  { name: "Koudougou", latitude: 12.2526, longitude: -2.3627, aliases: ["koudougou", "boulkiemde", "boulkiemdé"] },
  { name: "Ouahigouya", latitude: 13.5828, longitude: -2.4216, aliases: ["ouahigouya", "yatenga"] },
  { name: "Kaya", latitude: 13.0917, longitude: -1.0844, aliases: ["kaya", "sanmatenga"] },
  { name: "Tenkodogo", latitude: 11.7800, longitude: -0.3697, aliases: ["tenkodogo", "boulgou"] },
  { name: "Fada N'gourma", latitude: 12.0616, longitude: 0.3589, aliases: ["fada n'gourma", "fada ngourma", "fada n’gourma", "fada", "gourma"] },
  { name: "Dori", latitude: 14.0354, longitude: -0.0345, aliases: ["dori", "séno", "seno"] },
  { name: "Gaoua", latitude: 10.3250, longitude: -3.1740, aliases: ["gaoua", "poni"] },
  { name: "Banfora", latitude: 10.6333, longitude: -4.7667, aliases: ["banfora", "comoé", "comoe"] },
  { name: "Ziniaré", latitude: 12.5822, longitude: -1.2972, aliases: ["ziniaré", "ziniare", "oubritenga"] },
  { name: "Dédougou", latitude: 12.4634, longitude: -3.4608, aliases: ["dédougou", "dedougou", "mouhoun"] },
  { name: "Manga", latitude: 11.6636, longitude: -1.0731, aliases: ["manga", "zoundwéogo", "zoundweogo"] },
];

function normalizeText(value?: string | null) {
  return (value ?? "")
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .replace(/[’']/g, " ")
    .replace(/[^a-z0-9]+/g, " ")
    .trim();
}

function distanceKm(a: Coordinates, b: Coordinates) {
  const radiusKm = 6371;
  const dLat = ((b.latitude - a.latitude) * Math.PI) / 180;
  const dLon = ((b.longitude - a.longitude) * Math.PI) / 180;
  const lat1 = (a.latitude * Math.PI) / 180;
  const lat2 = (b.latitude * Math.PI) / 180;
  const h = Math.sin(dLat / 2) ** 2 + Math.cos(lat1) * Math.cos(lat2) * Math.sin(dLon / 2) ** 2;
  return 2 * radiusKm * Math.asin(Math.sqrt(h));
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
