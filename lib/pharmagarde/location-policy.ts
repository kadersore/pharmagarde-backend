import { getKnownCityCoordinates, normalizeCityName } from "./city-utils";
import { Coordinates } from "./types";

export const DEFAULT_LOCATION: Coordinates = { latitude: 12.3714, longitude: -1.5197 };
export const DEFAULT_LOCATION_MESSAGE = "Localisation indisponible. Distances calculées depuis Ouagadougou.";

// Fallback par ville : utilisé quand le GPS est refusé, indisponible ou non pris en charge.
export function getDefaultLocationFallback(cityName?: string | null, reason: "denied" | "unavailable" | "unsupported" = "unavailable") {
  const city = normalizeCityName(cityName);
  const reasonLabel = reason === "denied" ? "Localisation refusée" : reason === "unsupported" ? "Géolocalisation non prise en charge" : "Localisation indisponible";
  return {
    location: getKnownCityCoordinates(city),
    message: `${reasonLabel}. Distances calculées depuis ${city}.`,
  };
}
