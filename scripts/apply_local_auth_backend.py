from pathlib import Path

root = Path('/home/ubuntu/pharmagarde_bf_expo')

schema = root / 'drizzle/schema.ts'
text = schema.read_text()
text = text.replace('  email: varchar("email", { length: 320 }),\n  loginMethod: varchar("loginMethod", { length: 64 }),', '  email: varchar("email", { length: 320 }),\n  phone: varchar("phone", { length: 32 }).unique(),\n  passwordHash: text("passwordHash"),\n  loginMethod: varchar("loginMethod", { length: 64 }),')
schema.write_text(text)

migration = root / 'drizzle/0001_local_auth_credentials.sql'
migration.write_text("""ALTER TABLE `users` ADD `phone` varchar(32);\nALTER TABLE `users` ADD `passwordHash` text;\nALTER TABLE `users` ADD CONSTRAINT `users_phone_unique` UNIQUE(`phone`);\n""")

local_auth = root / 'server/_core/local-auth.ts'
local_auth.write_text(r'''import { scryptSync, timingSafeEqual, randomBytes } from "crypto";

const PHONE_PATTERN = /^\+226[0-9]{8}$/;
const EMAIL_PATTERN = /^[^\s@<>"']+@[^\s@<>"']+\.[^\s@<>"']{2,}$/i;
const SCRYPT_KEY_LENGTH = 64;

type RegisterValidationResult =
  | { ok: true; phone: string; email: string | null; password: string }
  | { ok: false; errors: Record<string, string> };

type LoginValidationResult =
  | { ok: true; identifier: string; password: string; identifierType: "phone" | "email" }
  | { ok: false; errors: Record<string, string> };

function stripDangerousCharacters(value: string) {
  return value.replace(/[<>"'`{}[\]\\]/g, "").trim();
}

export function normalizePhone(value: unknown) {
  const raw = typeof value === "string" ? value : "";
  const trimmed = stripDangerousCharacters(raw);
  const digits = trimmed.replace(/[^0-9+]/g, "");
  if (digits.startsWith("+226")) return `+226${digits.slice(4).replace(/\D/g, "").slice(0, 8)}`;
  const localDigits = digits.replace(/\D/g, "");
  if (localDigits.startsWith("226") && localDigits.length >= 11) return `+${localDigits.slice(0, 11)}`;
  if (localDigits.length === 8) return `+226${localDigits}`;
  return digits;
}

export function normalizeEmail(value: unknown) {
  const raw = typeof value === "string" ? value : "";
  const email = stripDangerousCharacters(raw).toLowerCase();
  return email.length > 0 ? email : null;
}

export function isValidPhone(phone: string) {
  return PHONE_PATTERN.test(phone);
}

export function isValidEmail(email: string) {
  return EMAIL_PATTERN.test(email);
}

export function validateRegisterPayload(payload: unknown): RegisterValidationResult {
  const body = payload && typeof payload === "object" ? (payload as Record<string, unknown>) : {};
  const phone = normalizePhone(body.phone);
  const email = normalizeEmail(body.email);
  const password = typeof body.password === "string" ? body.password.trim() : "";
  const confirmPassword = typeof body.confirmPassword === "string" ? body.confirmPassword.trim() : password;
  const errors: Record<string, string> = {};

  if (!phone) errors.phone = "Le téléphone est obligatoire.";
  else if (!isValidPhone(phone)) errors.phone = "Le téléphone doit être au format Burkina Faso, par exemple +22670123456.";

  if (email && !isValidEmail(email)) errors.email = "Adresse email invalide.";

  if (!password) errors.password = "Le mot de passe est obligatoire.";
  else if (password.length < 6) errors.password = "Le mot de passe doit contenir au moins 6 caractères.";

  if (!confirmPassword) errors.confirmPassword = "La confirmation du mot de passe est obligatoire.";
  else if (password !== confirmPassword) errors.confirmPassword = "La confirmation doit correspondre au mot de passe.";

  if (Object.keys(errors).length > 0) return { ok: false, errors };
  return { ok: true, phone, email, password };
}

export function validateLoginPayload(payload: unknown): LoginValidationResult {
  const body = payload && typeof payload === "object" ? (payload as Record<string, unknown>) : {};
  const rawIdentifier = typeof body.identifier === "string" ? body.identifier : typeof body.emailOrPhone === "string" ? body.emailOrPhone : typeof body.phone === "string" ? body.phone : typeof body.email === "string" ? body.email : "";
  const trimmedIdentifier = stripDangerousCharacters(rawIdentifier);
  const password = typeof body.password === "string" ? body.password.trim() : "";
  const errors: Record<string, string> = {};
  let identifier = trimmedIdentifier;
  let identifierType: "phone" | "email" = "phone";

  if (!trimmedIdentifier) {
    errors.identifier = "Téléphone ou email obligatoire.";
  } else if (trimmedIdentifier.includes("@")) {
    identifierType = "email";
    identifier = normalizeEmail(trimmedIdentifier) ?? "";
    if (!identifier || !isValidEmail(identifier)) errors.identifier = "Adresse email invalide.";
  } else {
    identifierType = "phone";
    identifier = normalizePhone(trimmedIdentifier);
    if (!isValidPhone(identifier)) errors.identifier = "Téléphone invalide.";
  }

  if (!password) errors.password = "Le mot de passe est obligatoire.";

  if (Object.keys(errors).length > 0) return { ok: false, errors };
  return { ok: true, identifier, password, identifierType };
}

export function hashPassword(password: string) {
  const salt = randomBytes(16).toString("hex");
  const derived = scryptSync(password, salt, SCRYPT_KEY_LENGTH).toString("hex");
  return `scrypt:${salt}:${derived}`;
}

export function verifyPassword(password: string, storedHash: string | null | undefined) {
  if (!storedHash) return false;
  const [algorithm, salt, hash] = storedHash.split(":");
  if (algorithm !== "scrypt" || !salt || !hash) return false;
  const stored = Buffer.from(hash, "hex");
  const derived = scryptSync(password, salt, stored.length);
  return stored.length === derived.length && timingSafeEqual(stored, derived);
}

export function buildLocalOpenId(phone: string) {
  return `local:${phone}`;
}
''')

db = root / 'server/db.ts'
text = db.read_text()
text = text.replace('import { eq } from "drizzle-orm";', 'import { eq, or } from "drizzle-orm";')
text = text.replace('    const textFields = ["name", "email", "loginMethod"] as const;', '    const textFields = ["name", "email", "phone", "passwordHash", "loginMethod"] as const;')
insert = r'''
export async function getUserByPhone(phone: string) {
  const db = await getDb();
  if (!db) {
    console.warn("[Database] Cannot get user by phone: database not available");
    return undefined;
  }

  const result = await db.select().from(users).where(eq(users.phone, phone)).limit(1);
  return result.length > 0 ? result[0] : undefined;
}

export async function getUserByEmail(email: string) {
  const db = await getDb();
  if (!db) {
    console.warn("[Database] Cannot get user by email: database not available");
    return undefined;
  }

  const result = await db.select().from(users).where(eq(users.email, email)).limit(1);
  return result.length > 0 ? result[0] : undefined;
}

export async function getUserByPhoneOrEmail(identifier: string) {
  const db = await getDb();
  if (!db) {
    console.warn("[Database] Cannot get user by phone/email: database not available");
    return undefined;
  }

  const result = await db
    .select()
    .from(users)
    .where(or(eq(users.phone, identifier), eq(users.email, identifier)))
    .limit(1);
  return result.length > 0 ? result[0] : undefined;
}

export async function createLocalAuthUser(user: InsertUser) {
  if (!user.openId || !user.phone || !user.passwordHash) {
    throw new Error("Local auth user requires openId, phone and passwordHash");
  }

  const db = await getDb();
  if (!db) {
    throw new Error("DATABASE_UNAVAILABLE");
  }

  await db.insert(users).values(user);
  return getUserByOpenId(user.openId);
}
'''
text = text.rstrip() + '\n' + insert
# remove unused import "or" warning is okay because used. 
db.write_text(text)

oauth = root / 'server/_core/oauth.ts'
text = oauth.read_text()
text = text.replace('import { getUserByOpenId, upsertUser } from "../db";', 'import { createLocalAuthUser, getUserByEmail, getUserByOpenId, getUserByPhone, getUserByPhoneOrEmail, upsertUser } from "../db";')
text = text.replace('import { sdk } from "./sdk";', 'import { sdk } from "./sdk";\nimport { buildLocalOpenId, hashPassword, validateLoginPayload, validateRegisterPayload, verifyPassword } from "./local-auth";')
text = text.replace('    email: user?.email ?? null,\n    loginMethod: user?.loginMethod ?? null,', '    email: user?.email ?? null,\n    phone: (user as any)?.phone ?? null,\n    loginMethod: user?.loginMethod ?? null,')
register_block = r'''
  const registerLocalAuthRoutes = (path: string) => {
    app.post(`${path}/register`, async (req: Request, res: Response) => {
      const validation = validateRegisterPayload(req.body);
      if (!validation.ok) {
        res.status(400).json({ error: "Validation échouée", errors: validation.errors });
        return;
      }

      try {
        const existingPhone = await getUserByPhone(validation.phone);
        if (existingPhone) {
          res.status(409).json({ error: "Ce téléphone est déjà utilisé.", field: "phone" });
          return;
        }

        if (validation.email) {
          const existingEmail = await getUserByEmail(validation.email);
          if (existingEmail) {
            res.status(409).json({ error: "Cet email est déjà utilisé.", field: "email" });
            return;
          }
        }

        const openId = buildLocalOpenId(validation.phone);
        const user = await createLocalAuthUser({
          openId,
          phone: validation.phone,
          email: validation.email,
          passwordHash: hashPassword(validation.password),
          loginMethod: "phone_password",
          lastSignedIn: new Date(),
        });

        if (!user) {
          res.status(500).json({ error: "Compte créé mais utilisateur introuvable." });
          return;
        }

        const token = await sdk.createSessionToken(openId, { name: validation.phone, expiresInMs: ONE_YEAR_MS });
        const cookieOptions = getSessionCookieOptions(req);
        res.cookie(COOKIE_NAME, token, { ...cookieOptions, maxAge: ONE_YEAR_MS });
        res.status(201).json({ token, user: buildUserResponse(user) });
      } catch (error) {
        console.error("[Auth] register failed", error);
        const message = error instanceof Error && error.message === "DATABASE_UNAVAILABLE" ? "Base de données indisponible." : "Impossible de créer le compte.";
        res.status(error instanceof Error && error.message === "DATABASE_UNAVAILABLE" ? 503 : 500).json({ error: message });
      }
    });

    app.post(`${path}/login`, async (req: Request, res: Response) => {
      const validation = validateLoginPayload(req.body);
      if (!validation.ok) {
        res.status(400).json({ error: "Validation échouée", errors: validation.errors });
        return;
      }

      try {
        const user = await getUserByPhoneOrEmail(validation.identifier);
        if (!user || !verifyPassword(validation.password, (user as any).passwordHash)) {
          res.status(401).json({ error: "Téléphone/email ou mot de passe incorrect." });
          return;
        }

        await upsertUser({ openId: user.openId, lastSignedIn: new Date() });
        const refreshedUser = (await getUserByOpenId(user.openId)) ?? user;
        const token = await sdk.createSessionToken(user.openId, { name: user.phone ?? user.email ?? user.openId, expiresInMs: ONE_YEAR_MS });
        const cookieOptions = getSessionCookieOptions(req);
        res.cookie(COOKIE_NAME, token, { ...cookieOptions, maxAge: ONE_YEAR_MS });
        res.json({ token, user: buildUserResponse(refreshedUser) });
      } catch (error) {
        console.error("[Auth] login failed", error);
        res.status(500).json({ error: "Impossible de connecter cet utilisateur." });
      }
    });
  };

  registerLocalAuthRoutes("/auth");
  registerLocalAuthRoutes("/api/auth");
'''
text = text.replace('export function registerOAuthRoutes(app: Express) {\n', 'export function registerOAuthRoutes(app: Express) {\n' + register_block)
oauth.write_text(text)
