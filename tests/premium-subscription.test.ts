import { readFileSync } from "node:fs";

import { describe, expect, it } from "vitest";

import { calculateSubscriptionEnd, getPremiumStatusForUser, isSubscriptionActive, PREMIUM_PLANS } from "../server/premium";

function read(path: string) {
  return readFileSync(path, "utf8");
}

describe("abonnement premium backend", () => {
  it("déclare les quatre offres Ligdi Cash demandées avec montants XOF et durées attendues", () => {
    expect(PREMIUM_PLANS).toMatchObject({
      week: { label: "1 semaine", amount: 200, durationDays: 7 },
      month: { label: "1 mois", amount: 400, durationDays: 30 },
      quarter: { label: "3 mois", amount: 1000, durationDays: 90 },
      semester: { label: "6 mois", amount: 2000, durationDays: 180 },
    });
  });

  it("calcule l’expiration depuis maintenant ou prolonge un abonnement actif existant", () => {
    const now = new Date("2026-05-01T00:00:00.000Z");
    expect(calculateSubscriptionEnd(null, "week", now).toISOString()).toBe("2026-05-08T00:00:00.000Z");
    expect(calculateSubscriptionEnd("2026-05-10T00:00:00.000Z", "month", now).toISOString()).toBe("2026-06-09T00:00:00.000Z");
    expect(calculateSubscriptionEnd("2026-04-01T00:00:00.000Z", "quarter", now).toISOString()).toBe("2026-07-30T00:00:00.000Z");
  });

  it("considère premium uniquement une date subscriptionEnd future validée côté serveur", () => {
    const now = new Date("2026-05-01T12:00:00.000Z");
    expect(isSubscriptionActive("2026-05-01T12:00:01.000Z", now)).toBe(true);
    expect(isSubscriptionActive("2026-05-01T12:00:00.000Z", now)).toBe(false);
    expect(getPremiumStatusForUser({ subscriptionEnd: new Date("2026-04-30T00:00:00.000Z") }, now)).toMatchObject({
      isPremium: false,
      serverTime: "2026-05-01T12:00:00.000Z",
    });
  });

  it("expose les routes /payment/init, /payment/webhook et le statut premium côté serveur", () => {
    const entry = read("server/_core/index.ts");
    const routers = read("server/routers.ts");
    expect(entry).toContain('app.post("/payment/init", initPremiumPayment)');
    expect(entry).toContain('app.post("/payment/webhook", handleLigdiCashWebhook)');
    expect(routers).toContain("premium: router");
    expect(routers).toContain("status: protectedProcedure");
    expect(routers).toContain("assertAccess: protectedProcedure");
  });

  it("persiste users.subscriptionEnd et une table transactions complète pour ne pas dépendre du frontend", () => {
    const schema = read("drizzle/schema.ts");
    expect(schema).toContain("subscriptionEnd: timestamp(\"subscriptionEnd\")");
    expect(schema).toContain("export const transactions = mysqlTable(\"transactions\"");
    expect(schema).toContain("provider: varchar(\"provider\"");
    expect(schema).toContain("merchantReference: varchar(\"merchantReference\"");
    expect(schema).toContain("status: mysqlEnum(\"status\", [\"pending\", \"success\", \"failed\", \"cancelled\"])");
  });
});
