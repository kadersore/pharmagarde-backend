
import { afterEach, describe, expect, it, vi } from "vitest";
import { fetchClinics, fetchMedicines, fetchPharmacies, getDefaultApiBaseUrl, normalizeBaseUrl } from "../lib/pharmagarde/api";

describe("pharmagarde API helpers", () => {
  afterEach(() => {
    vi.restoreAllMocks();
  });

  it("normalise l’URL de base sans modifier le slug de l’application", () => {
    expect(normalizeBaseUrl(" https://api.pharmagarde.bf/// ")).toBe("https://api.pharmagarde.bf");
    expect(normalizeBaseUrl("   ")).toBe("");
    expect(normalizeBaseUrl(null)).toBe("");
  });

  it("utilise l’URL API configurée comme base par défaut quand elle existe", () => {
    const previousValue = process.env.EXPO_PUBLIC_API_BASE_URL;
    process.env.EXPO_PUBLIC_API_BASE_URL = "https://api.pharmagarde.bf///";

    expect(getDefaultApiBaseUrl()).toBe("https://api.pharmagarde.bf");

    if (previousValue === undefined) delete process.env.EXPO_PUBLIC_API_BASE_URL;
    else process.env.EXPO_PUBLIC_API_BASE_URL = previousValue;
  });

  it("envoie la ville secondaire et les coordonnées à l’API pharmacies puis normalise les champs francophones", async () => {
    const fetchMock = vi.spyOn(globalThis, "fetch").mockResolvedValue({
      ok: true,
      json: async () => ({
        pharmacies: [
          {
            id: "ph-1",
            nom: "Pharmacie Centrale",
            adresse: "Avenue Kwame Nkrumah",
            ville: "Ouagadougou",
            telephone: "+22670000000",
            note: "4,3",
            distance: "1,4",
            latitude: "12.3714",
            longitude: "-1.5197",
            ouvert: "ouvert",
          },
        ],
      }),
    } as Response);

    const pharmacies = await fetchPharmacies(
      "https://api.pharmagarde.bf/",
      {
        latitude: 12.37,
        longitude: -1.52,
      },
      "Koudougou",
    );

    expect(fetchMock).toHaveBeenCalledTimes(1);
    const calledUrl = new URL(String(fetchMock.mock.calls[0]?.[0]));
    expect(calledUrl.pathname).toBe("/pharmacies");
    expect(calledUrl.searchParams.get("lat")).toBe("12.37");
    expect(calledUrl.searchParams.get("lng")).toBe("-1.52");
    expect(calledUrl.searchParams.get("city")).toBe("Koudougou");
    expect(pharmacies).toHaveLength(1);
    expect(pharmacies[0]).toMatchObject({
      id: "ph-1",
      type: "pharmacy",
      name: "Pharmacie Centrale",
      city: "Ouagadougou",
      rating: 4.3,
      distanceKm: 1.4,
      isOpen: true,
    });
  });

  it("conserve les résultats backend d’une ville secondaire au lieu de produire un état vide client", async () => {
    const fetchMock = vi.spyOn(globalThis, "fetch").mockResolvedValue({
      ok: true,
      json: async () => ({
        data: [{ id: "ph-kdg-1", name: "Pharmacie Wend-Panga", city: "Koudougou", latitude: 12.2526, longitude: -2.3627 }],
        meta: { city: "Koudougou", itemCount: 1 },
      }),
    } as Response);

    const pharmacies = await fetchPharmacies("https://api.pharmagarde.bf", undefined, "Koudougou");

    expect(fetchMock).toHaveBeenCalledTimes(1);
    const calledUrl = new URL(String(fetchMock.mock.calls[0]?.[0]));
    expect(calledUrl.pathname).toBe("/pharmacies");
    expect(calledUrl.searchParams.get("city")).toBe("Koudougou");
    expect(pharmacies).toHaveLength(1);
    expect(pharmacies[0]).toMatchObject({ id: "ph-kdg-1", name: "Pharmacie Wend-Panga", city: "Koudougou" });
  });


  it("refuse tout appel pharmacies sans paramètre city valide", async () => {
    const fetchMock = vi.spyOn(globalThis, "fetch").mockResolvedValue({
      ok: true,
      json: async () => ({ pharmacies: [] }),
    } as Response);

    await expect(fetchPharmacies("https://api.pharmagarde.bf", undefined, "   ")).rejects.toThrow("CITY_PARAM_REQUIRED:/pharmacies");

    expect(fetchMock).not.toHaveBeenCalled();
  });

  it("normalise la ville avant d’appeler les pharmacies et healthcare", async () => {
    const fetchMock = vi.spyOn(globalThis, "fetch")
      .mockResolvedValueOnce({ ok: true, json: async () => ({ pharmacies: [] }) } as Response)
      .mockResolvedValueOnce({ ok: true, json: async () => ({ healthcare: [] }) } as Response);

    await fetchPharmacies("https://api.pharmagarde.bf", undefined, " Bobo Dioulasso ");
    await fetchClinics("https://api.pharmagarde.bf", undefined, " Bobo Dioulasso ");

    const pharmaciesUrl = new URL(String(fetchMock.mock.calls[0]?.[0]));
    const healthcareUrl = new URL(String(fetchMock.mock.calls[1]?.[0]));
    expect(pharmaciesUrl.pathname).toBe("/pharmacies");
    expect(healthcareUrl.pathname).toBe("/healthcare");
    expect(pharmaciesUrl.searchParams.get("city")).toBe("Bobo-Dioulasso");
    expect(healthcareUrl.searchParams.get("city")).toBe("Bobo-Dioulasso");
  });

  it("normalise les cliniques et les médicaments depuis des payloads imbriqués", async () => {
    const fetchMock = vi.spyOn(globalThis, "fetch")
      .mockResolvedValueOnce({
        ok: true,
        json: async () => ({
          results: [{ uuid: "cl-1", libelle: "Clinique du Centre", commune: "Bobo-Dioulasso", googleRating: 4.7, lat: 11.17, lng: -4.29 }],
        }),
      } as Response)
      .mockResolvedValueOnce({
        ok: true,
        json: async () => ({
          data: [{ code: "med-1", designation: "Paracétamol", categorie: "Antalgique", forme: "Comprimé", image: "https://cdn.example.test/paracetamol.png" }],
        }),
      } as Response);

    const clinics = await fetchClinics("https://api.pharmagarde.bf", { latitude: 11.18, longitude: -4.3 }, "Bobo-Dioulasso");
    const medicines = await fetchMedicines("https://api.pharmagarde.bf");

    expect(fetchMock).toHaveBeenCalledTimes(2);
    const clinicsUrl = new URL(String(fetchMock.mock.calls[0]?.[0]));
    expect(clinicsUrl.pathname).toBe("/healthcare");
    expect(clinicsUrl.searchParams.get("city")).toBe("Bobo-Dioulasso");
    expect(clinics[0]).toMatchObject({ id: "cl-1", type: "clinic", name: "Clinique du Centre", city: "Bobo-Dioulasso", rating: 4.7 });
    expect(medicines[0]).toMatchObject({ id: "med-1", type: "medicine", name: "Paracétamol", category: "Antalgique", pharmaceuticalType: "Comprimé" });
  });
});
