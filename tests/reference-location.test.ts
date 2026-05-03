import { describe, expect, it } from "vitest";

import { DISTANCE_UNAVAILABLE_LABEL, hasValidReferenceCoordinates, resolveReferenceLocation } from "../lib/pharmagarde/reference-location";

describe("referenceLocation", () => {
  it("utilise les coordonnées de la ville sélectionnée quand la sélection manuelle est active", () => {
    const referenceLocation = resolveReferenceLocation({
      selectedCity: "Bobo-Dioulasso",
      isManualCitySelection: true,
      userLocation: { latitude: 12.3714, longitude: -1.5197 },
    });

    expect(referenceLocation).toEqual({ latitude: 11.1784, longitude: -4.2979 });
  });

  it("utilise uniquement la position GPS utilisateur quand la sélection manuelle est inactive", () => {
    const gpsLocation = { latitude: 12.48, longitude: -1.56 };
    const referenceLocation = resolveReferenceLocation({
      selectedCity: "Koudougou",
      isManualCitySelection: false,
      userLocation: gpsLocation,
    });

    expect(referenceLocation).toEqual(gpsLocation);
  });

  it("renvoie undefined sans position GPS valide quand la sélection manuelle est inactive", () => {
    expect(resolveReferenceLocation({ selectedCity: "Ouagadougou", isManualCitySelection: false })).toBeUndefined();
    expect(resolveReferenceLocation({ selectedCity: "Ouagadougou", isManualCitySelection: false, userLocation: { latitude: 0, longitude: 0 } })).toBeUndefined();
    expect(resolveReferenceLocation({ selectedCity: "Ouagadougou", isManualCitySelection: false, userLocation: { latitude: Number.NaN, longitude: -1.5 } })).toBeUndefined();
  });

  it("expose le libellé de fallback demandé lorsque la distance ne peut pas être calculée", () => {
    expect(DISTANCE_UNAVAILABLE_LABEL).toBe("Distance indisponible");
    expect(hasValidReferenceCoordinates({ latitude: 91, longitude: -1.5 })).toBe(false);
    expect(hasValidReferenceCoordinates({ latitude: 12.3714, longitude: -1.5197 })).toBe(true);
  });
});
