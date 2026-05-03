import { apiCall } from "../_core/api";
import { hasSessionToken } from "../_core/auth";

export type PremiumPlanId = "week" | "month" | "quarter" | "semester";

export type PremiumPlan = {
  id: PremiumPlanId;
  label: string;
  amount: number;
  durationDays: number;
};

export type PremiumStatus = {
  isPremium: boolean;
  subscriptionEnd: string | null;
  serverTime: string;
};

export type PaymentInitResponse = {
  reference: string;
  paymentUrl: string;
  plan: PremiumPlan;
  status: "pending";
};

export const PREMIUM_RESULT_LIMIT = 3;

export const PREMIUM_PLANS: PremiumPlan[] = [
  { id: "week", label: "1 semaine", amount: 200, durationDays: 7 },
  { id: "month", label: "1 mois", amount: 400, durationDays: 30 },
  { id: "quarter", label: "3 mois", amount: 1000, durationDays: 90 },
  { id: "semester", label: "6 mois", amount: 2000, durationDays: 180 },
];

export async function fetchPremiumStatus() {
  const tokenAvailable = await hasSessionToken();
  if (!tokenAvailable) {
    return {
      isPremium: false,
      subscriptionEnd: null,
      serverTime: new Date().toISOString(),
    } satisfies PremiumStatus;
  }

  const response = await apiCall<{ result?: { data?: PremiumStatus }; isPremium?: boolean; subscriptionEnd?: string | null; serverTime?: string }>("/api/trpc/premium.status?batch=1&input=%7B%7D");
  const data = response.result?.data ?? response;
  return {
    isPremium: Boolean(data.isPremium),
    subscriptionEnd: typeof data.subscriptionEnd === "string" ? data.subscriptionEnd : null,
    serverTime: typeof data.serverTime === "string" ? data.serverTime : new Date().toISOString(),
  } satisfies PremiumStatus;
}

export async function initPremiumPayment(planId: PremiumPlanId) {
  const tokenAvailable = await hasSessionToken();
  if (!tokenAvailable) {
    throw new Error("Connexion requise avant d’initialiser le paiement premium.");
  }

  return apiCall<PaymentInitResponse>("/payment/init", {
    method: "POST",
    body: JSON.stringify({ planId }),
  });
}

export function limitFreeResults<T>(items: T[], isPremium: boolean) {
  return isPremium ? items : items.slice(0, PREMIUM_RESULT_LIMIT);
}
