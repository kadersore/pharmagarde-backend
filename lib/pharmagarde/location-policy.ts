import { Coordinates } from "./types";

export const DEFAULT_LOCATION: Coordinates = { latitude: 12.3714, longitude: -1.5197 };
export const DEFAULT_LOCATION_MESSAGE = "Localisation refusée. Résultats basés sur Ouagadougou.";

export function getDefaultLocationFallback() {
  return {
    location: { ...DEFAULT_LOCATION },
    message: DEFAULT_LOCATION_MESSAGE,
  };
}
