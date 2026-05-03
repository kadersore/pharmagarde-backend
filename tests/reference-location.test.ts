import { describe, expect, it } from "vitest";

import { DISTANCE_UNAVAILABLE_LABEL, hasValidReferenceCoordinates, resolveReferenceLocation } from "../lib/pharmagarde/reference-location";

describe("referenceLocation", () => {
  it("utilise toujours la position GPS utilisateur même quand une ville est sélectionnée", () => {
    const gpsLocation = { latitude: 12.3714, longitude: -1.5197 };
    const referenceLocation = resolveReferenceLocation({
      selectedCity: "Bobo-Dioulasso",
      userLocation: gpsLocation,
    });

    expect(referenceLocation).toEqual(gpsLocation);
  });

  it("garde la ville uniquement comme fallback si aucune position GPS valide n’est disponible", () => {
    const referenceLocation = resolveReferenceLocation({
      selectedCity: "Koudougou",
    });

    expect(referenceLocation).toEqual({ latitude: 12.2526, longitude: -2.3627 });
  });

  it("ignore les coordonnées GPS invalides et revient au centre de la ville sélectionnée", () => {
    expect(resolveReferenceLocation({ selectedCity: "Ouagadougou", userLocation: { latitude: 0, longitude: 0 } })).toEqual({ latitude: 12.3714, longitude: -1.5197 });
    expect(resolveReferenceLocation({ selectedCity: "Ouagadougou", userLocation: { latitude: Number.NaN, longitude: -1.5 } })).toEqual({ latitude: 12.3714, longitude: -1.5197 });
  });

  it("expose le libellé de fallback demandé lorsque la distance ne peut pas être calculée", () => {
    expect(DISTANCE_UNAVAILABLE_LABEL).toBe("Distance indisponible");
    expect(hasValidReferenceCoordinates({ latitude: 91, longitude: -1.5 })).toBe(false);
    expect(hasValidReferenceCoordinates({ latitude: 12.3714, longitude: -1.5197 })).toBe(true);
  });
});
