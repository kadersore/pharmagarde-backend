import { getKnownCityCoordinates } from "./city-utils";
import { Coordinates } from "./types";

export const DISTANCE_UNAVAILABLE_LABEL = "Distance indisponible";

type ReferenceLocationInput = {
  selectedCity?: string | null;
  userLocation?: Coordinates | null;
};

export function hasValidReferenceCoordinates(coordinates?: Coordinates | null): coordinates is Coordinates {
  if (!coordinates) return false;
  const { latitude, longitude } = coordinates;
  if (!Number.isFinite(latitude) || !Number.isFinite(longitude)) return false;
  if (latitude < -90 || latitude > 90 || longitude < -180 || longitude > 180) return false;
  return !(latitude === 0 && longitude === 0);
}

export function resolveReferenceLocation({ selectedCity, userLocation }: ReferenceLocationInput): Coordinates | undefined {
  if (hasValidReferenceCoordinates(userLocation)) {
    return { latitude: userLocation.latitude, longitude: userLocation.longitude };
  }

  const cityCoordinates = getKnownCityCoordinates(selectedCity);
  return hasValidReferenceCoordinates(cityCoordinates) ? cityCoordinates : undefined;
}
