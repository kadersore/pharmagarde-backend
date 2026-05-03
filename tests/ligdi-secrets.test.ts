import { describe, expect, it } from "vitest";

function buildLigdiConfirmUrl(baseUrl: string, invoiceToken: string) {
  const normalizedBaseUrl = baseUrl.replace(/\/+$/, "");
  return `${normalizedBaseUrl}/checkout-invoice/confirm/?invoiceToken=${encodeURIComponent(invoiceToken)}`;
}

describe("ligdi cash secrets", () => {
  it("valide que les secrets Ligdi Cash permettent d’appeler l’API de confirmation sans erreur d’authentification", async () => {
    const baseUrl = process.env.LIGDI_BASE_URL;
    const apiToken = process.env.LIGDI_API_TOKEN;

    expect(baseUrl, "LIGDI_BASE_URL doit être configurée").toBeTruthy();
    expect(apiToken, "LIGDI_API_TOKEN doit être configuré").toBeTruthy();

    const response = await fetch(buildLigdiConfirmUrl(baseUrl!, "manus-secret-validation"), {
      method: "GET",
      headers: {
        Accept: "application/json",
        Authorization: `Bearer ${apiToken}`,
      },
    });

    expect(response.status, "Le token Ligdi Cash ne doit pas être refusé par l’API").not.toBe(401);
    expect(response.status, "Le token Ligdi Cash ne doit pas être interdit par l’API").not.toBe(403);
  }, 15000);
});
