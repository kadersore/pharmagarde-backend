import { and, desc, eq } from "drizzle-orm";
import type { Request, Response } from "express";
import { z } from "zod";

import { transactions, users, type InsertTransaction, type User } from "../drizzle/schema";
import { getDb } from "./db";
import { sdk } from "./_core/sdk";

export type PremiumPlanId = "week" | "month" | "quarter" | "semester";

export const PREMIUM_PLANS: Record<PremiumPlanId, { id: PremiumPlanId; label: string; amount: number; durationDays: number }> = {
  week: { id: "week", label: "1 semaine", amount: 200, durationDays: 7 },
  month: { id: "month", label: "1 mois", amount: 400, durationDays: 30 },
  quarter: { id: "quarter", label: "3 mois", amount: 1000, durationDays: 90 },
  semester: { id: "semester", label: "6 mois", amount: 2000, durationDays: 180 },
};

const paymentInitSchema = z.object({
  planId: z.enum(["week", "month", "quarter", "semester"]),
});

const webhookSchema = z.object({
  token: z.string().optional(),
  transaction_id: z.union([z.string(), z.number()]).optional(),
  transactionId: z.union([z.string(), z.number()]).optional(),
  invoice: z.object({ token: z.string().optional(), status: z.string().optional() }).optional(),
  status: z.string().optional(),
  response_code: z.string().optional(),
  amount: z.union([z.string(), z.number()]).optional(),
}).passthrough();

type PremiumStatus = {
  isPremium: boolean;
  subscriptionEnd: string | null;
  serverTime: string;
};

export function isSubscriptionActive(subscriptionEnd?: Date | string | null, now = new Date()) {
  if (!subscriptionEnd) return false;
  const endDate = subscriptionEnd instanceof Date ? subscriptionEnd : new Date(subscriptionEnd);
  return Number.isFinite(endDate.getTime()) && endDate.getTime() > now.getTime();
}

export function getPremiumStatusForUser(user?: Pick<User, "subscriptionEnd"> | null, now = new Date()): PremiumStatus {
  const subscriptionEnd = user?.subscriptionEnd ? new Date(user.subscriptionEnd) : null;
  return {
    isPremium: isSubscriptionActive(subscriptionEnd, now),
    subscriptionEnd: subscriptionEnd && Number.isFinite(subscriptionEnd.getTime()) ? subscriptionEnd.toISOString() : null,
    serverTime: now.toISOString(),
  };
}

export function calculateSubscriptionEnd(currentEnd: Date | string | null | undefined, planId: PremiumPlanId, now = new Date()) {
  const plan = PREMIUM_PLANS[planId];
  const current = currentEnd ? new Date(currentEnd) : null;
  const startsAt = current && Number.isFinite(current.getTime()) && current.getTime() > now.getTime() ? current : now;
  return new Date(startsAt.getTime() + plan.durationDays * 24 * 60 * 60 * 1000);
}

function extractReference(payload: z.infer<typeof webhookSchema>) {
  return payload.token ?? payload.invoice?.token ?? undefined;
}

function extractProviderTransactionId(payload: z.infer<typeof webhookSchema>) {
  const value = payload.transaction_id ?? payload.transactionId;
  return value === undefined ? undefined : String(value);
}

function isSuccessfulLigdiCashStatus(payload: z.infer<typeof webhookSchema>) {
  const status = String(payload.status ?? payload.invoice?.status ?? "").toLowerCase();
  const code = String(payload.response_code ?? "").toLowerCase();
  return ["completed", "complete", "success", "successful", "paid", "approved"].includes(status) || ["00", "0", "success"].includes(code);
}

function readAuthorizationHeader(req: Request): string | undefined {
  const rawHeader = req.headers.authorization;
  if (Array.isArray(rawHeader)) return rawHeader[0];
  if (typeof rawHeader === "string") return rawHeader;
  return req.header("authorization") ?? undefined;
}

function extractBearerToken(req: Request): string | undefined {
  const header = readAuthorizationHeader(req);
  if (!header) return undefined;
  const match = header.match(/^Bearer\s+(.+)$/i);
  return match?.[1]?.trim() || undefined;
}

function maskTokenForLogs(token?: string): string | null {
  if (!token) return null;
  if (token.length <= 18) return `${token.slice(0, 4)}…${token.slice(-4)} (${token.length} chars)`;
  return `${token.slice(0, 12)}…${token.slice(-6)} (${token.length} chars)`;
}

export async function getAuthenticatedDbUser(req: Request) {
  const authHeader = readAuthorizationHeader(req);
  const bearerToken = extractBearerToken(req);
  console.info("[PremiumAuth] Token reçu sur route protégée", {
    hasAuthorizationHeader: Boolean(authHeader),
    hasBearerToken: Boolean(bearerToken),
    token: maskTokenForLogs(bearerToken),
  });

  if (bearerToken) {
    try {
      return await sdk.authenticateRequest(req);
    } catch (error) {
      console.warn("[PremiumAuth] Échec de validation du Bearer token", error instanceof Error ? error.message : String(error));
    }
  }

  const authUser = (req as Request & { user?: User }).user;
  if (authUser?.id) return authUser;

  const openId = typeof req.header("x-user-open-id") === "string" ? req.header("x-user-open-id") : undefined;
  if (!openId) return undefined;
  const db = await getDb();
  if (!db) return undefined;
  const result = await db.select().from(users).where(eq(users.openId, openId)).limit(1);
  return result[0];
}

async function createLigdiCashPayment(input: { amount: number; reference: string; description: string; returnUrl: string; callbackUrl: string }) {
  const apiUrl = process.env.LIGDICASH_API_URL ?? "https://app.ligdicash.com/pay/v01/redirect/checkout-invoice/create";
  const authToken = process.env.LIGDICASH_AUTH_TOKEN;
  const apiKey = process.env.LIGDICASH_API_KEY;
  const commandName = process.env.LIGDICASH_COMMAND_NAME ?? "PharmaGarde BF";

  if (!authToken || !apiKey) {
    return {
      providerTransactionId: `mock-${input.reference}`,
      paymentUrl: `${input.returnUrl}${input.returnUrl.includes("?") ? "&" : "?"}reference=${encodeURIComponent(input.reference)}&mode=ligdicash-mock`,
      rawPayload: JSON.stringify({ mode: "mock", reason: "Ligdi Cash credentials are not configured" }),
    };
  }

  const payload = {
    commande: {
      invoice: {
        items: [{ name: input.description, description: input.description, quantity: 1, unit_price: input.amount, total_price: input.amount }],
        total_amount: input.amount,
        devise: "XOF",
        description: input.description,
        customer: "PharmaGarde BF",
        external_id: input.reference,
      },
      store: { name: commandName, website_url: input.returnUrl },
      actions: { cancel_url: input.returnUrl, return_url: input.returnUrl, callback_url: input.callbackUrl },
      custom_data: { reference: input.reference },
    },
  };

  const response = await fetch(apiUrl, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${authToken}`,
      Apikey: apiKey,
    },
    body: JSON.stringify(payload),
  });

  const rawText = await response.text();
  let rawPayload: unknown = rawText;
  try { rawPayload = JSON.parse(rawText); } catch {}
  if (!response.ok) {
    throw new Error(`Ligdi Cash a refusé l'initialisation du paiement (${response.status}).`);
  }

  const record = rawPayload && typeof rawPayload === "object" ? rawPayload as Record<string, unknown> : {};
  const responseText = JSON.stringify(record);
  const paymentUrl =
    (typeof record.response_text === "string" ? record.response_text : undefined) ??
    (typeof record.payment_url === "string" ? record.payment_url : undefined) ??
    (typeof record.url === "string" ? record.url : undefined);
  const providerTransactionId =
    (typeof record.token === "string" ? record.token : undefined) ??
    (typeof record.transaction_id === "string" ? record.transaction_id : undefined) ??
    input.reference;

  if (!paymentUrl) throw new Error("Ligdi Cash n’a pas renvoyé d’URL de paiement exploitable.");
  return { providerTransactionId, paymentUrl, rawPayload: responseText };
}

export async function initPremiumPayment(req: Request, res: Response) {
  try {
    const db = await getDb();
    if (!db) return res.status(503).json({ error: "Base de données indisponible pour initialiser un abonnement." });
    const user = await getAuthenticatedDbUser(req);
    if (!user) return res.status(401).json({ error: "Connexion requise pour souscrire à Premium." });

    const { planId } = paymentInitSchema.parse(req.body ?? {});
    const plan = PREMIUM_PLANS[planId];
    const reference = `pg-${user.id}-${planId}-${Date.now()}`;
    const publicBaseUrl = process.env.PUBLIC_APP_URL ?? `${req.protocol}://${req.get("host")}`;
    const callbackBaseUrl = process.env.PUBLIC_API_URL ?? `${req.protocol}://${req.get("host")}`;
    const returnUrl = `${publicBaseUrl}/pharmagarde/abonnement?paymentReference=${encodeURIComponent(reference)}`;
    const callbackUrl = `${callbackBaseUrl}/payment/webhook`;

    const payment = await createLigdiCashPayment({
      amount: plan.amount,
      reference,
      description: `Abonnement Premium PharmaGarde BF - ${plan.label}`,
      returnUrl,
      callbackUrl,
    });

    const transaction: InsertTransaction = {
      userId: user.id,
      planId,
      amount: plan.amount,
      currency: "XOF",
      status: "pending",
      provider: "ligdicash",
      providerTransactionId: payment.providerTransactionId,
      merchantReference: reference,
      paymentUrl: payment.paymentUrl,
      rawProviderPayload: payment.rawPayload,
    };
    await db.insert(transactions).values(transaction);

    return res.json({ reference, paymentUrl: payment.paymentUrl, plan, status: "pending" });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Erreur d’initialisation du paiement.";
    return res.status(400).json({ error: message });
  }
}

function firstQueryValue(value: unknown): string | undefined {
  if (Array.isArray(value)) return firstQueryValue(value[0]);
  if (typeof value === "string") return value.trim() || undefined;
  if (typeof value === "number") return String(value);
  return undefined;
}

function appendPaymentReturnParams(baseUrl: string, params: { paymentReference?: string; reference?: string; mode?: string }) {
  const url = new URL(baseUrl);
  for (const [key, value] of Object.entries(params)) {
    if (value) url.searchParams.set(key, value);
  }
  return url.toString();
}

function renderPaymentReturnPage(params: { paymentReference?: string; reference?: string; mode?: string; status?: string }) {
  const reference = params.paymentReference ?? params.reference ?? "Référence indisponible";
  const status = params.status ?? "retour reçu";
  return `<!doctype html>
<html lang="fr">
<head>
  <meta charset="utf-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1" />
  <title>Abonnement Premium PharmaGarde BF</title>
  <style>
    body { margin: 0; font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif; background: #f4fbf7; color: #102016; }
    main { min-height: 100vh; display: grid; place-items: center; padding: 24px; }
    section { width: min(440px, 100%); background: #fff; border-radius: 28px; box-shadow: 0 18px 50px rgba(10, 126, 80, .14); padding: 28px; text-align: center; }
    .badge { width: 64px; height: 64px; margin: 0 auto 16px; border-radius: 22px; display: grid; place-items: center; background: #10c85a; color: #fff; font-size: 34px; font-weight: 800; }
    h1 { font-size: 24px; line-height: 1.2; margin: 0 0 12px; }
    p { color: #53645a; line-height: 1.55; margin: 0 0 14px; }
    dl { margin: 18px 0 0; text-align: left; background: #f4fbf7; border-radius: 18px; padding: 16px; }
    dt { font-size: 12px; color: #6b7b72; text-transform: uppercase; letter-spacing: .04em; }
    dd { margin: 4px 0 14px; font-weight: 700; overflow-wrap: anywhere; }
  </style>
</head>
<body>
  <main>
    <section>
      <div class="badge">✓</div>
      <h1>Retour de paiement reçu</h1>
      <p>Votre retour Ligdi Cash a été enregistré. Vous pouvez revenir dans PharmaGarde BF pour vérifier l’état de votre abonnement Premium.</p>
      <dl>
        <dt>Référence</dt><dd>${reference.replace(/[<>&"]/g, (char) => ({ "<": "&lt;", ">": "&gt;", "&": "&amp;", '"': "&quot;" })[char] ?? char)}</dd>
        <dt>Statut</dt><dd>${status}</dd>
        <dt>Mode</dt><dd>${params.mode ?? "non précisé"}</dd>
      </dl>
    </section>
  </main>
</body>
</html>`;
}

export async function handlePremiumPaymentReturn(req: Request, res: Response) {
  const paymentReference = firstQueryValue(req.query.paymentReference);
  const reference = firstQueryValue(req.query.reference);
  const mode = firstQueryValue(req.query.mode);
  const resolvedReference = paymentReference ?? reference;

  console.info("[PremiumPaymentReturn] Retour paiement reçu", { paymentReference, reference, mode });

  const mobileReturnUrl = process.env.PHARMAGARDE_PAYMENT_RETURN_DEEP_LINK;
  if (mobileReturnUrl) {
    return res.redirect(302, appendPaymentReturnParams(mobileReturnUrl, { paymentReference, reference, mode }));
  }

  let status: string | undefined;
  if (resolvedReference) {
    const db = await getDb();
    if (db) {
      const found = await db.select().from(transactions).where(eq(transactions.merchantReference, resolvedReference)).limit(1);
      status = found[0]?.status;
    }
  }

  return res.status(200).type("html").send(renderPaymentReturnPage({ paymentReference, reference, mode, status }));
}

export async function handleLigdiCashWebhook(req: Request, res: Response) {
  try {
    const db = await getDb();
    if (!db) return res.status(503).json({ error: "Base de données indisponible." });
    const payload = webhookSchema.parse(req.body ?? {});
    const reference = extractReference(payload);
    if (!reference) return res.status(400).json({ error: "Référence de transaction manquante." });

    const found = await db.select().from(transactions).where(eq(transactions.merchantReference, reference)).limit(1);
    const transaction = found[0];
    if (!transaction) return res.status(404).json({ error: "Transaction inconnue." });

    const status = isSuccessfulLigdiCashStatus(payload) ? "success" : "failed";
    await db.update(transactions).set({
      status,
      providerTransactionId: extractProviderTransactionId(payload) ?? transaction.providerTransactionId,
      rawProviderPayload: JSON.stringify(payload),
    }).where(eq(transactions.id, transaction.id));

    if (status === "success") {
      const userRows = await db.select().from(users).where(eq(users.id, transaction.userId)).limit(1);
      const user = userRows[0];
      const nextEnd = calculateSubscriptionEnd(user?.subscriptionEnd, transaction.planId as PremiumPlanId);
      await db.update(users).set({ subscriptionEnd: nextEnd }).where(eq(users.id, transaction.userId));
    }

    return res.json({ ok: true, status });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Erreur webhook Ligdi Cash.";
    return res.status(400).json({ error: message });
  }
}

export async function getPremiumStatus(openId: string) {
  const db = await getDb();
  if (!db) return getPremiumStatusForUser(null);
  const result = await db.select().from(users).where(eq(users.openId, openId)).limit(1);
  return getPremiumStatusForUser(result[0] ?? null);
}

export async function requirePremium(openId: string) {
  const status = await getPremiumStatus(openId);
  if (!status.isPremium) {
    const error = new Error("Abonnement Premium requis.");
    (error as Error & { code?: string }).code = "PREMIUM_REQUIRED";
    throw error;
  }
  return status;
}

export async function getRecentTransactions(openId: string) {
  const db = await getDb();
  if (!db) return [];
  const userRows = await db.select().from(users).where(eq(users.openId, openId)).limit(1);
  const user = userRows[0];
  if (!user) return [];
  return db.select().from(transactions).where(and(eq(transactions.userId, user.id))).orderBy(desc(transactions.createdAt)).limit(10);
}
