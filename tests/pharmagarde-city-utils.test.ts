import { describe, expect, it } from "vitest";

import { filterPlacesByCity, inferCityFromAddressParts, inferNearestKnownCity, normalizeCityName } from "../lib/pharmagarde/city-utils";
import { HealthPlace } from "../lib/pharmagarde/types";

const places: HealthPlace[] = [
  {
    id: "ph-ouaga",
    type: "pharmacy",
    name: "Pharmacie du Centre",
    city: "Ouagadougou",
    latitude: 12.3714,
    longitude: -1.5197,
  },
  {
    id: "cl-bobo",
    type: "clinic",
    name: "Clinique Bobo",
    city: "Bobo Dioulasso",
    latitude: 11.1784,
    longitude: -4.2979,
  },
  {
    id: "ph-unknown-city",
    type: "pharmacy",
    name: "Pharmacie sans ville",
    latitude: 12.37,
    longitude: -1.52,
  },
];

describe("utilitaires ville PharmaGarde", () => {
  it("déduit une ville normalisée depuis les champs de géocodage inverse", () => {
    expect(inferCityFromAddressParts(["Secteur 4", "Kadiogo", "Centre"])).toBe("Ouagadougou");
    expect(inferCityFromAddressParts(["Houet", "Hauts-Bassins"])).toBe("Bobo-Dioulasso");
    expect(normalizeCityName("Bobo Dioulasso")).toBe("Bobo-Dioulasso");
  });

  it("retourne la ville connue la plus proche lorsque le géocodage inverse est incomplet", () => {
    expect(inferNearestKnownCity({ latitude: 11.18, longitude: -4.3 })).toBe("Bobo-Dioulasso");
    expect(inferNearestKnownCity({ latitude: 12.37, longitude: -1.52 })).toBe("Ouagadougou");
  });

  it("filtre les structures par ville tout en conservant les éléments sans ville explicite", () => {
    expect(filterPlacesByCity(places, "Ouaga").map((place) => place.id)).toEqual(["ph-ouaga", "ph-unknown-city"]);
    expect(filterPlacesByCity(places, "Bobo-Dioulasso").map((place) => place.id)).toEqual(["cl-bobo", "ph-unknown-city"]);
  });
});
