from pathlib import Path

root = Path('/home/ubuntu/pharmagarde_bf_expo')

# 1) drizzle/schema.ts
schema = root / 'drizzle/schema.ts'
schema.write_text('''import { int, mysqlEnum, mysqlTable, text, timestamp, varchar } from "drizzle-orm/mysql-core";

/**
 * Core user table backing auth flow.
 * Extend this file with additional tables as your product grows.
 * Columns use camelCase to match both database fields and generated types.
 */
export const users = mysqlTable("users", {
  /**
   * Surrogate primary key. Auto-incremented numeric value managed by the database.
   * Use this for relations between tables.
   */
  id: int("id").autoincrement().primaryKey(),
  /** Manus OAuth identifier (openId) returned from the OAuth callback. Unique per user. */
  openId: varchar("openId", { length: 64 }).notNull().unique(),
  name: text("name"),
  email: varchar("email", { length: 320 }),
  loginMethod: varchar("loginMethod", { length: 64 }),
  role: mysqlEnum("role", ["user", "admin"]).default("user").notNull(),
  /** Subscription end date. A user is premium only when this value is in the future. */
  subscriptionEnd: timestamp("subscriptionEnd"),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
  lastSignedIn: timestamp("lastSignedIn").defaultNow().notNull(),
});

export const transactions = mysqlTable("transactions", {
  id: int("id").autoincrement().primaryKey(),
  userId: int("userId").notNull().references(() => users.id),
  provider: varchar("provider", { length: 64 }).default("ligdicash").notNull(),
  providerTransactionId: varchar("providerTransactionId", { length: 128 }),
  merchantReference: varchar("merchantReference", { length: 128 }).notNull().unique(),
  planId: varchar("planId", { length: 32 }).notNull(),
  amount: int("amount").notNull(),
  currency: varchar("currency", { length: 8 }).default("XOF").notNull(),
  status: mysqlEnum("status", ["pending", "success", "failed", "cancelled"]).default("pending").notNull(),
  paymentUrl: text("paymentUrl"),
  rawProviderPayload: text("rawProviderPayload"),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});

export type User = typeof users.$inferSelect;
export type InsertUser = typeof users.$inferInsert;
export type Transaction = typeof transactions.$inferSelect;
export type InsertTransaction = typeof transactions.$inferInsert;
''', encoding='utf8')

# 2) server/premium.ts
(root / 'server/premium.ts').write_text('''import { and, desc, eq } from "drizzle-orm";
import type { Request, Response } from "express";
import { z } from "zod";

import { transactions, users, type InsertTransaction, type User } from "../drizzle/schema";
import { getDb } from "./db";

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

async function getAuthenticatedDbUser(req: Request) {
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
''', encoding='utf8')

# 3) server/db.ts update imports and user fields
(root / 'server/db.ts').write_text('''import { eq } from "drizzle-orm";
import { drizzle } from "drizzle-orm/mysql2";
import { InsertUser, users } from "../drizzle/schema";
import { ENV } from "./_core/env";

let _db: ReturnType<typeof drizzle> | null = null;

// Lazily create the drizzle instance so local tooling can run without a DB.
export async function getDb() {
  if (!_db && process.env.DATABASE_URL) {
    try {
      _db = drizzle(process.env.DATABASE_URL);
    } catch (error) {
      console.warn("[Database] Failed to connect:", error);
      _db = null;
    }
  }
  return _db;
}

export async function upsertUser(user: InsertUser): Promise<void> {
  if (!user.openId) {
    throw new Error("User openId is required for upsert");
  }

  const db = await getDb();
  if (!db) {
    console.warn("[Database] Cannot upsert user: database not available");
    return;
  }

  try {
    const values: InsertUser = {
      openId: user.openId,
    };
    const updateSet: Record<string, unknown> = {};

    const textFields = ["name", "email", "loginMethod"] as const;
    type TextField = (typeof textFields)[number];

    const assignNullable = (field: TextField) => {
      const value = user[field];
      if (value === undefined) return;
      const normalized = value ?? null;
      values[field] = normalized;
      updateSet[field] = normalized;
    };

    textFields.forEach(assignNullable);

    if (user.lastSignedIn !== undefined) {
      values.lastSignedIn = user.lastSignedIn;
      updateSet.lastSignedIn = user.lastSignedIn;
    }
    if (user.subscriptionEnd !== undefined) {
      values.subscriptionEnd = user.subscriptionEnd;
      updateSet.subscriptionEnd = user.subscriptionEnd;
    }
    if (user.role !== undefined) {
      values.role = user.role;
      updateSet.role = user.role;
    } else if (user.openId === ENV.ownerOpenId) {
      values.role = "admin";
      updateSet.role = "admin";
    }

    if (!values.lastSignedIn) {
      values.lastSignedIn = new Date();
    }

    if (Object.keys(updateSet).length === 0) {
      updateSet.lastSignedIn = new Date();
    }

    await db.insert(users).values(values).onDuplicateKeyUpdate({
      set: updateSet,
    });
  } catch (error) {
    console.error("[Database] Failed to upsert user:", error);
    throw error;
  }
}

export async function getUserByOpenId(openId: string) {
  const db = await getDb();
  if (!db) {
    console.warn("[Database] Cannot get user: database not available");
    return undefined;
  }

  const result = await db.select().from(users).where(eq(users.openId, openId)).limit(1);

  return result.length > 0 ? result[0] : undefined;
}
''', encoding='utf8')

# 4) server/_core/index.ts imports/routes
index_path = root / 'server/_core/index.ts'
index_text = index_path.read_text(encoding='utf8')
index_text = index_text.replace('import { initializePharmaGardeCache, registerPharmaGardeCacheRoutes, startPharmaGardeSchedulers } from "../pharmagarde-cache";\n', 'import { initializePharmaGardeCache, registerPharmaGardeCacheRoutes, startPharmaGardeSchedulers } from "../pharmagarde-cache";\nimport { handleLigdiCashWebhook, initPremiumPayment } from "../premium";\n')
index_text = index_text.replace('  registerStorageProxy(app);\n  registerOAuthRoutes(app);\n', '  registerStorageProxy(app);\n  registerOAuthRoutes(app);\n  app.post("/payment/init", initPremiumPayment);\n  app.post("/payment/webhook", handleLigdiCashWebhook);\n')
index_path.write_text(index_text, encoding='utf8')

# 5) server/routers.ts
(root / 'server/routers.ts').write_text('''import { TRPCError } from "@trpc/server";
import { COOKIE_NAME } from "../shared/const.js";
import { getSessionCookieOptions } from "./_core/cookies";
import { systemRouter } from "./_core/systemRouter";
import { protectedProcedure, publicProcedure, router } from "./_core/trpc";
import { getPremiumStatus, getRecentTransactions, PREMIUM_PLANS, requirePremium } from "./premium";

export const appRouter = router({
  // if you need to use socket.io, read and register route in server/_core/index.ts, all api should start with '/api/' so that the gateway can route correctly
  system: systemRouter,
  auth: router({
    me: publicProcedure.query((opts) => opts.ctx.user),
    logout: publicProcedure.mutation(({ ctx }) => {
      const cookieOptions = getSessionCookieOptions(ctx.req);
      ctx.res.clearCookie(COOKIE_NAME, { ...cookieOptions, maxAge: -1 });
      return {
        success: true,
      } as const;
    }),
  }),
  premium: router({
    plans: publicProcedure.query(() => Object.values(PREMIUM_PLANS)),
    status: protectedProcedure.query(async ({ ctx }) => getPremiumStatus(ctx.user.openId)),
    transactions: protectedProcedure.query(async ({ ctx }) => getRecentTransactions(ctx.user.openId)),
    assertAccess: protectedProcedure.query(async ({ ctx }) => {
      try {
        return await requirePremium(ctx.user.openId);
      } catch (error) {
        throw new TRPCError({ code: "FORBIDDEN", message: error instanceof Error ? error.message : "Abonnement Premium requis." });
      }
    }),
  }),
});

export type AppRouter = typeof appRouter;
''', encoding='utf8')

# 6) client premium API
(root / 'lib/pharmagarde/premium.ts').write_text('''import { apiCall } from "@/lib/_core/api";

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
  const response = await apiCall<{ result?: { data?: PremiumStatus }; isPremium?: boolean; subscriptionEnd?: string | null; serverTime?: string }>("/api/trpc/premium.status?batch=1&input=%7B%7D");
  const data = response.result?.data ?? response;
  return {
    isPremium: Boolean(data.isPremium),
    subscriptionEnd: typeof data.subscriptionEnd === "string" ? data.subscriptionEnd : null,
    serverTime: typeof data.serverTime === "string" ? data.serverTime : new Date().toISOString(),
  } satisfies PremiumStatus;
}

export async function initPremiumPayment(planId: PremiumPlanId) {
  return apiCall<PaymentInitResponse>("/payment/init", {
    method: "POST",
    body: JSON.stringify({ planId }),
  });
}

export function limitFreeResults<T>(items: T[], isPremium: boolean) {
  return isPremium ? items : items.slice(0, PREMIUM_RESULT_LIMIT);
}
''', encoding='utf8')

print('premium implementation files written')
''
