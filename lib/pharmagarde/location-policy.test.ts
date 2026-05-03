import { describe, expect, it } from "vitest";

import { DEFAULT_LOCATION, DEFAULT_LOCATION_MESSAGE, getDefaultLocationFallback } from "./location-policy";

describe("politique de localisation PharmaGarde", () => {
  it("utilise Ouagadougou comme position par défaut quand la localisation échoue", () => {
    const fallback = getDefaultLocationFallback();

    expect(fallback.location).toEqual({ latitude: 12.3714, longitude: -1.5197 });
    expect(fallback.location).toEqual(DEFAULT_LOCATION);
  });

  it("affiche le message utilisateur attendu pour un refus ou une indisponibilité GPS", () => {
    const fallback = getDefaultLocationFallback();

    expect(fallback.message).toBe("Localisation indisponible. Distances calculées depuis Ouagadougou.");
    expect(fallback.message).toBe(DEFAULT_LOCATION_MESSAGE);
  });

  it("retourne une copie de la position pour éviter les mutations partagées", () => {
    const firstFallback = getDefaultLocationFallback();
    const secondFallback = getDefaultLocationFallback();

    expect(firstFallback.location).not.toBe(secondFallback.location);
    expect(secondFallback.location).toEqual(DEFAULT_LOCATION);
  });
});
