from pathlib import Path

root = Path('/home/ubuntu/pharmagarde_bf_expo')
(root / 'app/auth').mkdir(parents=True, exist_ok=True)

validation = root / 'lib/pharmagarde/auth-validation.ts'
validation.write_text(r'''export type RegisterForm = {
  phone: string;
  email: string;
  password: string;
  confirmPassword: string;
};

export type LoginForm = {
  identifier: string;
  password: string;
};

export type RegisterErrors = Partial<Record<keyof RegisterForm, string>>;
export type LoginErrors = Partial<Record<keyof LoginForm, string>>;

const EMAIL_PATTERN = /^[^\s@<>"']+@[^\s@<>"']+\.[^\s@<>"']{2,}$/i;
const PHONE_PATTERN = /^\+226[0-9]{8}$/;

export function sanitizeInput(value: string) {
  return value.replace(/[<>"'`{}[\]\\]/g, "").trim();
}

export function normalizePhone(value: string) {
  const cleaned = sanitizeInput(value);
  const digits = cleaned.replace(/[^0-9+]/g, "");
  if (digits.startsWith("+226")) return `+226${digits.slice(4).replace(/\D/g, "").slice(0, 8)}`;
  const localDigits = digits.replace(/\D/g, "");
  if (localDigits.startsWith("226") && localDigits.length >= 11) return `+${localDigits.slice(0, 11)}`;
  if (localDigits.length === 8) return `+226${localDigits}`;
  return digits;
}

export function formatBurkinaPhone(value: string) {
  const normalized = normalizePhone(value);
  const local = normalized.startsWith("+226") ? normalized.slice(4) : normalized.replace(/\D/g, "");
  return local.replace(/(\d{2})(?=\d)/g, "$1 ").trim();
}

export function normalizeEmail(value: string) {
  const email = sanitizeInput(value).toLowerCase();
  return email.length > 0 ? email : "";
}

export function normalizeIdentifier(value: string) {
  const cleaned = sanitizeInput(value);
  return cleaned.includes("@") ? normalizeEmail(cleaned) : normalizePhone(cleaned);
}

export function isValidPhone(phone: string) {
  return PHONE_PATTERN.test(phone);
}

export function isValidEmail(email: string) {
  return EMAIL_PATTERN.test(email);
}

export function validateRegisterForm(form: RegisterForm): RegisterErrors {
  const phone = normalizePhone(form.phone);
  const email = normalizeEmail(form.email);
  const password = form.password.trim();
  const confirmPassword = form.confirmPassword.trim();
  const errors: RegisterErrors = {};

  if (!phone) errors.phone = "Téléphone obligatoire.";
  else if (!isValidPhone(phone)) errors.phone = "Numéro burkinabè invalide. Exemple : 70 12 34 56.";

  if (email && !isValidEmail(email)) errors.email = "Adresse email invalide.";

  if (!password) errors.password = "Mot de passe obligatoire.";
  else if (password.length < 6) errors.password = "Le mot de passe doit contenir au moins 6 caractères.";

  if (!confirmPassword) errors.confirmPassword = "Confirmation obligatoire.";
  else if (password !== confirmPassword) errors.confirmPassword = "La confirmation doit correspondre au mot de passe.";

  return errors;
}

export function validateLoginForm(form: LoginForm): LoginErrors {
  const identifier = sanitizeInput(form.identifier);
  const password = form.password.trim();
  const errors: LoginErrors = {};

  if (!identifier) errors.identifier = "Téléphone ou email obligatoire.";
  else if (identifier.includes("@")) {
    if (!isValidEmail(normalizeEmail(identifier))) errors.identifier = "Adresse email invalide.";
  } else if (!isValidPhone(normalizePhone(identifier))) {
    errors.identifier = "Téléphone invalide.";
  }

  if (!password) errors.password = "Mot de passe obligatoire.";

  return errors;
}

export function hasNoErrors(errors: Record<string, string | undefined>) {
  return Object.values(errors).every((value) => !value);
}
''')

# Extend core auth module
path = root / 'lib/_core/auth.ts'
text = path.read_text()
text = text.replace('import { SESSION_TOKEN_KEY, USER_INFO_KEY } from "@/constants/oauth";', 'import { SESSION_TOKEN_KEY, USER_INFO_KEY } from "@/constants/oauth";')
text = text.replace('export type User = {\n  id: number;\n  openId: string;\n  name: string | null;\n  email: string | null;\n  loginMethod: string | null;\n  lastSignedIn: Date;\n};', 'export type User = {\n  id: number;\n  openId: string;\n  name: string | null;\n  email: string | null;\n  phone?: string | null;\n  loginMethod: string | null;\n  lastSignedIn: Date;\n};\n\nexport const REMEMBER_ME_KEY = "pharmagarde:remember-me:v1";')
text = text.replace('async function hydrateSessionTokenFromStorage(): Promise<string | null> {\n  try {\n    console.log("[Auth] Hydrating session token...");\n\n    const asyncStorageToken = await AsyncStorage.getItem(SESSION_TOKEN_KEY);', 'async function hydrateSessionTokenFromStorage(): Promise<string | null> {\n  try {\n    console.log("[Auth] Hydrating session token...");\n\n    const rememberMe = await AsyncStorage.getItem(REMEMBER_ME_KEY);\n    if (rememberMe === "false") {\n      console.log("[Auth] Remember me disabled; clearing persisted session token");\n      await AsyncStorage.removeItem(SESSION_TOKEN_KEY);\n      await removeSecureStoreToken();\n      cachedSessionToken = null;\n      return null;\n    }\n\n    const asyncStorageToken = await AsyncStorage.getItem(SESSION_TOKEN_KEY);')
text = text.replace('export async function setSessionToken(token: string): Promise<void> {', 'export async function setSessionToken(token: string, options: { rememberMe?: boolean } = {}): Promise<void> {')
text = text.replace('    cachedSessionToken = normalizedToken;\n    await AsyncStorage.setItem(SESSION_TOKEN_KEY, normalizedToken);', '    cachedSessionToken = normalizedToken;\n    if (typeof options.rememberMe === "boolean") {\n      await AsyncStorage.setItem(REMEMBER_ME_KEY, String(options.rememberMe));\n    }\n    await AsyncStorage.setItem(SESSION_TOKEN_KEY, normalizedToken);')
text = text.replace('    await AsyncStorage.removeItem(SESSION_TOKEN_KEY);', '    await AsyncStorage.removeItem(SESSION_TOKEN_KEY);\n    await AsyncStorage.removeItem(REMEMBER_ME_KEY);')
path.write_text(text)

# Extend API wrapper
path = root / 'lib/_core/api.ts'
text = path.read_text()
text = text.replace('type ApiResponse<T> = {\n  data?: T;\n  error?: string;\n};\n\n', 'export type AuthApiUser = {\n  id: number;\n  openId: string;\n  name: string | null;\n  email: string | null;\n  phone?: string | null;\n  loginMethod: string | null;\n  lastSignedIn: string;\n};\n\nexport type AuthApiResponse = {\n  token: string;\n  user: AuthApiUser;\n};\n\ntype ApiResponse<T> = {\n  data?: T;\n  error?: string;\n};\n\n')
text = text.replace('// Logout\nexport async function logout(): Promise<void> {', 'export async function register(payload: { phone: string; email?: string | null; password: string; confirmPassword: string }): Promise<AuthApiResponse> {\n  return apiCall<AuthApiResponse>("/api/auth/register", {\n    method: "POST",\n    body: JSON.stringify(payload),\n  });\n}\n\nexport async function login(payload: { identifier: string; password: string }): Promise<AuthApiResponse> {\n  return apiCall<AuthApiResponse>("/api/auth/login", {\n    method: "POST",\n    body: JSON.stringify(payload),\n  });\n}\n\n// Logout\nexport async function logout(): Promise<void> {')
text = text.replace('  loginMethod: string | null;\n  lastSignedIn: string;', '  phone?: string | null;\n  loginMethod: string | null;\n  lastSignedIn: string;')
path.write_text(text)

# Extend use-auth hook
path = root / 'hooks/use-auth.ts'
text = path.read_text()
text = text.replace('import * as Auth from "@/lib/_core/auth";', 'import * as Auth from "@/lib/_core/auth";\nimport { normalizeEmail, normalizeIdentifier, normalizePhone } from "@/lib/pharmagarde/auth-validation";')
text = text.replace('          const userInfo: Auth.User = {\n            id: apiUser.id,\n            openId: apiUser.openId,\n            name: apiUser.name,\n            email: apiUser.email,\n            loginMethod: apiUser.loginMethod,\n            lastSignedIn: new Date(apiUser.lastSignedIn),\n          };', '          const userInfo = normalizeAuthUser(apiUser);')
text = text.replace('  const logout = useCallback(async () => {', '  const login = useCallback(async (payload: { identifier: string; password: string; rememberMe?: boolean }) => {\n    setLoading(true);\n    setError(null);\n    try {\n      const result = await Api.login({\n        identifier: normalizeIdentifier(payload.identifier),\n        password: payload.password.trim(),\n      });\n      const userInfo = normalizeAuthUser(result.user);\n      await Auth.setSessionToken(result.token, { rememberMe: payload.rememberMe ?? true });\n      await Auth.setUserInfo(userInfo);\n      setUser(userInfo);\n      return userInfo;\n    } catch (err) {\n      const error = err instanceof Error ? err : new Error("Connexion impossible");\n      setError(error);\n      throw error;\n    } finally {\n      setLoading(false);\n    }\n  }, []);\n\n  const register = useCallback(async (payload: { phone: string; email?: string; password: string; confirmPassword: string; rememberMe?: boolean }) => {\n    setLoading(true);\n    setError(null);\n    try {\n      const result = await Api.register({\n        phone: normalizePhone(payload.phone),\n        email: payload.email ? normalizeEmail(payload.email) : null,\n        password: payload.password.trim(),\n        confirmPassword: payload.confirmPassword.trim(),\n      });\n      const userInfo = normalizeAuthUser(result.user);\n      await Auth.setSessionToken(result.token, { rememberMe: payload.rememberMe ?? true });\n      await Auth.setUserInfo(userInfo);\n      setUser(userInfo);\n      return userInfo;\n    } catch (err) {\n      const error = err instanceof Error ? err : new Error("Inscription impossible");\n      setError(error);\n      throw error;\n    } finally {\n      setLoading(false);\n    }\n  }, []);\n\n  const logout = useCallback(async () => {')
text = text.replace('    logout,\n  };\n}', '    login,\n    register,\n    logout,\n  };\n}\n\nfunction normalizeAuthUser(user: Api.AuthApiUser): Auth.User {\n  return {\n    id: user.id,\n    openId: user.openId,\n    name: user.name,\n    email: user.email,\n    phone: user.phone ?? null,\n    loginMethod: user.loginMethod,\n    lastSignedIn: new Date(user.lastSignedIn || Date.now()),\n  };\n}')
path.write_text(text)

login = root / 'app/auth/login.tsx'
login.write_text(r'''import { useRouter } from "expo-router";
import { useMemo, useState } from "react";
import { ActivityIndicator, KeyboardAvoidingView, Platform, Pressable, StyleSheet, Switch, Text, TextInput, View } from "react-native";

import { ScreenContainer } from "@/components/screen-container";
import { useAuth } from "@/hooks/use-auth";
import { formatBurkinaPhone, normalizeIdentifier, validateLoginForm } from "@/lib/pharmagarde/auth-validation";
import { usePremiumPalette } from "@/lib/pharmagarde/premium-ui";

export default function LoginScreen() {
  const router = useRouter();
  const palette = usePremiumPalette();
  const { login } = useAuth({ autoFetch: false });
  const [identifier, setIdentifier] = useState("");
  const [password, setPassword] = useState("");
  const [rememberMe, setRememberMe] = useState(true);
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);

  const errors = useMemo(() => validateLoginForm({ identifier, password }), [identifier, password]);
  const isValid = !errors.identifier && !errors.password;

  const submit = async () => {
    if (!isValid || loading) return;
    setLoading(true);
    setSubmitError(null);
    try {
      await login({ identifier: normalizeIdentifier(identifier), password, rememberMe });
      router.replace("/(tabs)");
    } catch (error) {
      setSubmitError(error instanceof Error ? error.message : "Identifiants incorrects.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <ScreenContainer edges={["top", "bottom", "left", "right"]} className="px-5 py-4">
      <KeyboardAvoidingView behavior={Platform.OS === "ios" ? "padding" : undefined} style={styles.flex}>
        <View style={styles.header}>
          <Text style={[styles.kicker, { color: palette.emerald }]}>PharmaGarde BF</Text>
          <Text style={[styles.title, { color: palette.text }]}>Connexion</Text>
          <Text style={[styles.subtitle, { color: palette.subtle }]}>Connectez-vous pour accéder aux médicaments premium et aux paiements sécurisés.</Text>
        </View>

        <View style={[styles.card, { backgroundColor: palette.card, borderColor: palette.border }]}> 
          <Field
            label="Téléphone ou email"
            value={identifier}
            onChangeText={setIdentifier}
            placeholder="70 12 34 56 ou nom@email.com"
            keyboardType="email-address"
            error={identifier ? errors.identifier : undefined}
            helper={!identifier.includes("@") && identifier ? `Format détecté : ${formatBurkinaPhone(identifier)}` : undefined}
          />
          <PasswordField
            label="Mot de passe"
            value={password}
            onChangeText={setPassword}
            showPassword={showPassword}
            onTogglePassword={() => setShowPassword((value) => !value)}
            error={password ? errors.password : undefined}
          />

          <View style={styles.rememberRow}>
            <View style={styles.rememberCopy}>
              <Text style={[styles.rememberTitle, { color: palette.text }]}>Se souvenir de moi</Text>
              <Text style={[styles.rememberHint, { color: palette.subtle }]}>Restaure automatiquement la session au lancement.</Text>
            </View>
            <Switch value={rememberMe} onValueChange={setRememberMe} trackColor={{ false: palette.border, true: palette.emeraldSoft }} thumbColor={rememberMe ? palette.emerald : "#f4f4f5"} />
          </View>

          {submitError ? <Text style={styles.errorBanner}>{submitError}</Text> : null}

          <Pressable
            onPress={submit}
            disabled={!isValid || loading}
            style={({ pressed }) => [styles.primaryButton, { backgroundColor: isValid ? palette.emerald : palette.border, opacity: pressed ? 0.86 : 1 }]}
          >
            {loading ? <ActivityIndicator color="#FFFFFF" /> : <Text style={styles.primaryButtonText}>Se connecter</Text>}
          </Pressable>

          <Pressable onPress={() => router.push("/auth/register")} style={({ pressed }) => [styles.secondaryButton, { opacity: pressed ? 0.72 : 1 }]}>
            <Text style={[styles.secondaryButtonText, { color: palette.emerald }]}>Créer un compte</Text>
          </Pressable>
        </View>
      </KeyboardAvoidingView>
    </ScreenContainer>
  );
}

type FieldProps = {
  label: string;
  value: string;
  onChangeText: (value: string) => void;
  placeholder: string;
  keyboardType?: "default" | "email-address" | "phone-pad";
  error?: string;
  helper?: string;
};

function Field({ label, value, onChangeText, placeholder, keyboardType = "default", error, helper }: FieldProps) {
  const palette = usePremiumPalette();
  return (
    <View style={styles.fieldGroup}>
      <Text style={[styles.label, { color: palette.text }]}>{label}</Text>
      <TextInput
        value={value}
        onChangeText={onChangeText}
        placeholder={placeholder}
        placeholderTextColor={palette.subtle}
        keyboardType={keyboardType}
        autoCapitalize="none"
        autoCorrect={false}
        returnKeyType="next"
        style={[styles.input, { backgroundColor: palette.surface, borderColor: error ? palette.danger : palette.border, color: palette.text }]}
      />
      {error ? <Text style={styles.fieldError}>{error}</Text> : helper ? <Text style={[styles.helper, { color: palette.subtle }]}>{helper}</Text> : null}
    </View>
  );
}

function PasswordField({ label, value, onChangeText, showPassword, onTogglePassword, error }: Omit<FieldProps, "placeholder" | "keyboardType"> & { showPassword: boolean; onTogglePassword: () => void }) {
  const palette = usePremiumPalette();
  return (
    <View style={styles.fieldGroup}>
      <Text style={[styles.label, { color: palette.text }]}>{label}</Text>
      <View style={[styles.passwordRow, { backgroundColor: palette.surface, borderColor: error ? palette.danger : palette.border }]}> 
        <TextInput
          value={value}
          onChangeText={onChangeText}
          placeholder="••••••••"
          placeholderTextColor={palette.subtle}
          secureTextEntry={!showPassword}
          autoCapitalize="none"
          autoCorrect={false}
          returnKeyType="done"
          style={[styles.passwordInput, { color: palette.text }]}
        />
        <Pressable onPress={onTogglePassword} style={({ pressed }) => [styles.showButton, { opacity: pressed ? 0.7 : 1 }]}> 
          <Text style={[styles.showText, { color: palette.emerald }]}>{showPassword ? "Masquer" : "Afficher"}</Text>
        </Pressable>
      </View>
      {error ? <Text style={styles.fieldError}>{error}</Text> : null}
    </View>
  );
}

const styles = StyleSheet.create({
  flex: { flex: 1, justifyContent: "center" },
  header: { marginBottom: 22 },
  kicker: { fontSize: 13, fontWeight: "800", letterSpacing: 0.8, textTransform: "uppercase" },
  title: { fontSize: 34, lineHeight: 40, fontWeight: "900", marginTop: 8 },
  subtitle: { fontSize: 15, lineHeight: 22, marginTop: 10 },
  card: { borderWidth: 1, borderRadius: 28, padding: 18, gap: 16, shadowColor: "#0f172a", shadowOpacity: 0.08, shadowRadius: 20, shadowOffset: { width: 0, height: 12 } },
  fieldGroup: { gap: 8 },
  label: { fontSize: 14, fontWeight: "800" },
  input: { borderWidth: 1, borderRadius: 18, minHeight: 54, paddingHorizontal: 16, fontSize: 16 },
  passwordRow: { minHeight: 54, borderWidth: 1, borderRadius: 18, flexDirection: "row", alignItems: "center" },
  passwordInput: { flex: 1, minHeight: 54, paddingHorizontal: 16, fontSize: 16 },
  showButton: { paddingHorizontal: 14, minHeight: 54, justifyContent: "center" },
  showText: { fontSize: 13, fontWeight: "800" },
  fieldError: { color: "#DC2626", fontSize: 12, fontWeight: "700" },
  helper: { fontSize: 12, fontWeight: "600" },
  rememberRow: { flexDirection: "row", alignItems: "center", justifyContent: "space-between", gap: 14 },
  rememberCopy: { flex: 1 },
  rememberTitle: { fontSize: 14, fontWeight: "800" },
  rememberHint: { fontSize: 12, lineHeight: 17, marginTop: 2 },
  errorBanner: { backgroundColor: "#FEE2E2", color: "#991B1B", borderRadius: 14, padding: 12, fontSize: 13, fontWeight: "700" },
  primaryButton: { minHeight: 54, borderRadius: 18, alignItems: "center", justifyContent: "center" },
  primaryButtonText: { color: "#FFFFFF", fontSize: 16, fontWeight: "900" },
  secondaryButton: { minHeight: 44, alignItems: "center", justifyContent: "center" },
  secondaryButtonText: { fontSize: 15, fontWeight: "800" },
});
''')

register = root / 'app/auth/register.tsx'
register.write_text(r'''import { useRouter } from "expo-router";
import { useMemo, useState } from "react";
import { ActivityIndicator, KeyboardAvoidingView, Platform, Pressable, ScrollView, StyleSheet, Switch, Text, TextInput, View } from "react-native";

import { ScreenContainer } from "@/components/screen-container";
import { useAuth } from "@/hooks/use-auth";
import { formatBurkinaPhone, normalizeEmail, normalizePhone, validateRegisterForm } from "@/lib/pharmagarde/auth-validation";
import { usePremiumPalette } from "@/lib/pharmagarde/premium-ui";

export default function RegisterScreen() {
  const router = useRouter();
  const palette = usePremiumPalette();
  const { register } = useAuth({ autoFetch: false });
  const [phone, setPhone] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [rememberMe, setRememberMe] = useState(true);
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  const errors = useMemo(() => validateRegisterForm({ phone, email, password, confirmPassword }), [phone, email, password, confirmPassword]);
  const isValid = !errors.phone && !errors.email && !errors.password && !errors.confirmPassword;

  const submit = async () => {
    if (!isValid || loading) return;
    setLoading(true);
    setSubmitError(null);
    setSuccess(null);
    try {
      await register({ phone: normalizePhone(phone), email: normalizeEmail(email), password, confirmPassword, rememberMe });
      setSuccess("Compte créé avec succès. Redirection en cours…");
      setTimeout(() => router.replace("/(tabs)"), 650);
    } catch (error) {
      setSubmitError(error instanceof Error ? error.message : "Inscription impossible.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <ScreenContainer edges={["top", "bottom", "left", "right"]} className="px-5 py-4">
      <KeyboardAvoidingView behavior={Platform.OS === "ios" ? "padding" : undefined} style={styles.flex}>
        <ScrollView contentContainerStyle={styles.scroll} showsVerticalScrollIndicator={false} keyboardShouldPersistTaps="handled">
          <View style={styles.header}>
            <Text style={[styles.kicker, { color: palette.emerald }]}>Compte sécurisé</Text>
            <Text style={[styles.title, { color: palette.text }]}>Créer un compte</Text>
            <Text style={[styles.subtitle, { color: palette.subtle }]}>Un compte est requis pour les fonctions premium et les paiements d’abonnement.</Text>
          </View>

          <View style={[styles.card, { backgroundColor: palette.card, borderColor: palette.border }]}> 
            <Field label="Téléphone" value={phone} onChangeText={setPhone} placeholder="70 12 34 56" keyboardType="phone-pad" error={phone ? errors.phone : undefined} helper={phone ? `Stocké comme ${normalizePhone(phone)} · Affiché ${formatBurkinaPhone(phone)}` : "Format Burkina Faso, indicatif +226 automatique."} />
            <Field label="Email optionnel" value={email} onChangeText={setEmail} placeholder="nom@email.com" keyboardType="email-address" error={email ? errors.email : undefined} />
            <PasswordField label="Mot de passe" value={password} onChangeText={setPassword} showPassword={showPassword} onTogglePassword={() => setShowPassword((value) => !value)} error={password ? errors.password : undefined} />
            <PasswordField label="Confirmation" value={confirmPassword} onChangeText={setConfirmPassword} showPassword={showPassword} onTogglePassword={() => setShowPassword((value) => !value)} error={confirmPassword ? errors.confirmPassword : undefined} />

            <View style={styles.rememberRow}>
              <View style={styles.rememberCopy}>
                <Text style={[styles.rememberTitle, { color: palette.text }]}>Se souvenir de moi</Text>
                <Text style={[styles.rememberHint, { color: palette.subtle }]}>Garde votre session active au prochain lancement.</Text>
              </View>
              <Switch value={rememberMe} onValueChange={setRememberMe} trackColor={{ false: palette.border, true: palette.emeraldSoft }} thumbColor={rememberMe ? palette.emerald : "#f4f4f5"} />
            </View>

            {submitError ? <Text style={styles.errorBanner}>{submitError}</Text> : null}
            {success ? <Text style={styles.successBanner}>{success}</Text> : null}

            <Pressable onPress={submit} disabled={!isValid || loading} style={({ pressed }) => [styles.primaryButton, { backgroundColor: isValid ? palette.emerald : palette.border, opacity: pressed ? 0.86 : 1 }]}> 
              {loading ? <ActivityIndicator color="#FFFFFF" /> : <Text style={styles.primaryButtonText}>Créer mon compte</Text>}
            </Pressable>

            <Pressable onPress={() => router.push("/auth/login")} style={({ pressed }) => [styles.secondaryButton, { opacity: pressed ? 0.72 : 1 }]}> 
              <Text style={[styles.secondaryButtonText, { color: palette.emerald }]}>J’ai déjà un compte</Text>
            </Pressable>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </ScreenContainer>
  );
}

type FieldProps = {
  label: string;
  value: string;
  onChangeText: (value: string) => void;
  placeholder: string;
  keyboardType?: "default" | "email-address" | "phone-pad";
  error?: string;
  helper?: string;
};

function Field({ label, value, onChangeText, placeholder, keyboardType = "default", error, helper }: FieldProps) {
  const palette = usePremiumPalette();
  return (
    <View style={styles.fieldGroup}>
      <Text style={[styles.label, { color: palette.text }]}>{label}</Text>
      <TextInput value={value} onChangeText={onChangeText} placeholder={placeholder} placeholderTextColor={palette.subtle} keyboardType={keyboardType} autoCapitalize="none" autoCorrect={false} returnKeyType="next" style={[styles.input, { backgroundColor: palette.surface, borderColor: error ? palette.danger : palette.border, color: palette.text }]} />
      {error ? <Text style={styles.fieldError}>{error}</Text> : helper ? <Text style={[styles.helper, { color: palette.subtle }]}>{helper}</Text> : null}
    </View>
  );
}

function PasswordField({ label, value, onChangeText, showPassword, onTogglePassword, error }: Omit<FieldProps, "placeholder" | "keyboardType"> & { showPassword: boolean; onTogglePassword: () => void }) {
  const palette = usePremiumPalette();
  return (
    <View style={styles.fieldGroup}>
      <Text style={[styles.label, { color: palette.text }]}>{label}</Text>
      <View style={[styles.passwordRow, { backgroundColor: palette.surface, borderColor: error ? palette.danger : palette.border }]}> 
        <TextInput value={value} onChangeText={onChangeText} placeholder="••••••••" placeholderTextColor={palette.subtle} secureTextEntry={!showPassword} autoCapitalize="none" autoCorrect={false} returnKeyType="done" style={[styles.passwordInput, { color: palette.text }]} />
        <Pressable onPress={onTogglePassword} style={({ pressed }) => [styles.showButton, { opacity: pressed ? 0.7 : 1 }]}> 
          <Text style={[styles.showText, { color: palette.emerald }]}>{showPassword ? "Masquer" : "Afficher"}</Text>
        </Pressable>
      </View>
      {error ? <Text style={styles.fieldError}>{error}</Text> : null}
    </View>
  );
}

const styles = StyleSheet.create({
  flex: { flex: 1 },
  scroll: { flexGrow: 1, justifyContent: "center", paddingVertical: 8 },
  header: { marginBottom: 22 },
  kicker: { fontSize: 13, fontWeight: "800", letterSpacing: 0.8, textTransform: "uppercase" },
  title: { fontSize: 33, lineHeight: 40, fontWeight: "900", marginTop: 8 },
  subtitle: { fontSize: 15, lineHeight: 22, marginTop: 10 },
  card: { borderWidth: 1, borderRadius: 28, padding: 18, gap: 15, shadowColor: "#0f172a", shadowOpacity: 0.08, shadowRadius: 20, shadowOffset: { width: 0, height: 12 } },
  fieldGroup: { gap: 8 },
  label: { fontSize: 14, fontWeight: "800" },
  input: { borderWidth: 1, borderRadius: 18, minHeight: 54, paddingHorizontal: 16, fontSize: 16 },
  passwordRow: { minHeight: 54, borderWidth: 1, borderRadius: 18, flexDirection: "row", alignItems: "center" },
  passwordInput: { flex: 1, minHeight: 54, paddingHorizontal: 16, fontSize: 16 },
  showButton: { paddingHorizontal: 14, minHeight: 54, justifyContent: "center" },
  showText: { fontSize: 13, fontWeight: "800" },
  fieldError: { color: "#DC2626", fontSize: 12, fontWeight: "700" },
  helper: { fontSize: 12, fontWeight: "600" },
  rememberRow: { flexDirection: "row", alignItems: "center", justifyContent: "space-between", gap: 14 },
  rememberCopy: { flex: 1 },
  rememberTitle: { fontSize: 14, fontWeight: "800" },
  rememberHint: { fontSize: 12, lineHeight: 17, marginTop: 2 },
  errorBanner: { backgroundColor: "#FEE2E2", color: "#991B1B", borderRadius: 14, padding: 12, fontSize: 13, fontWeight: "700" },
  successBanner: { backgroundColor: "#DCFCE7", color: "#166534", borderRadius: 14, padding: 12, fontSize: 13, fontWeight: "800" },
  primaryButton: { minHeight: 54, borderRadius: 18, alignItems: "center", justifyContent: "center" },
  primaryButtonText: { color: "#FFFFFF", fontSize: 16, fontWeight: "900" },
  secondaryButton: { minHeight: 44, alignItems: "center", justifyContent: "center" },
  secondaryButtonText: { fontSize: 15, fontWeight: "800" },
});
''')

loading = root / 'app/auth/loading.tsx'
loading.write_text(r'''import { useRouter } from "expo-router";
import { useEffect } from "react";
import { ActivityIndicator, StyleSheet, Text, View } from "react-native";

import { ScreenContainer } from "@/components/screen-container";
import { useAuth } from "@/hooks/use-auth";
import { usePremiumPalette } from "@/lib/pharmagarde/premium-ui";

export default function AuthLoadingScreen() {
  const router = useRouter();
  const palette = usePremiumPalette();
  const { loading, isAuthenticated } = useAuth();

  useEffect(() => {
    if (loading) return;
    router.replace(isAuthenticated ? "/(tabs)" : "/auth/login");
  }, [isAuthenticated, loading, router]);

  return (
    <ScreenContainer edges={["top", "bottom", "left", "right"]} className="px-6">
      <View style={styles.container}>
        <ActivityIndicator size="large" color={palette.emerald} />
        <Text style={[styles.title, { color: palette.text }]}>Vérification de la session…</Text>
        <Text style={[styles.subtitle, { color: palette.subtle }]}>Nous restaurons automatiquement votre compte si un token valide est disponible.</Text>
      </View>
    </ScreenContainer>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, alignItems: "center", justifyContent: "center", gap: 14 },
  title: { fontSize: 20, fontWeight: "900", textAlign: "center" },
  subtitle: { fontSize: 14, lineHeight: 21, textAlign: "center", maxWidth: 300 },
});
''')

# Register stack screens
path = root / 'app/_layout.tsx'
text = path.read_text()
text = text.replace('              <Stack.Screen name="pharmagarde/favoris" options={{ presentation: "modal" }} />\n              <Stack.Screen name="oauth/callback" />', '              <Stack.Screen name="pharmagarde/favoris" options={{ presentation: "modal" }} />\n              <Stack.Screen name="auth/login" options={{ presentation: "fullScreenModal" }} />\n              <Stack.Screen name="auth/register" options={{ presentation: "fullScreenModal" }} />\n              <Stack.Screen name="auth/loading" options={{ presentation: "fullScreenModal" }} />\n              <Stack.Screen name="oauth/callback" />')
path.write_text(text)

# Add auth actions to menu
path = root / 'components/pharmagarde/menu-content.tsx'
text = path.read_text()
text = text.replace('import { useColors } from "@/hooks/use-colors";', 'import { useAuth } from "@/hooks/use-auth";\nimport { useColors } from "@/hooks/use-colors";')
text = text.replace('  const { preferences, updatePreference } = usePharmaGarde();\n  const colors = useColors();', '  const { preferences, updatePreference } = usePharmaGarde();\n  const { user, isAuthenticated, logout } = useAuth();\n  const colors = useColors();')
text = text.replace('  const closeSelector = () => setSelector(null);', '  const closeSelector = () => setSelector(null);\n\n  const handleLogout = async () => {\n    await logout();\n    onClose();\n    router.replace("/(tabs)" as never);\n  };')
text = text.replace('        <DrawerSection title="Services">\n          <DrawerActionRow', '        <DrawerSection title="Compte">\n          {isAuthenticated ? (\n            <>\n              <DrawerActionRow\n                icon="verified-user"\n                title={user?.phone ?? user?.email ?? "Compte connecté"}\n                active={false}\n                onPress={() => undefined}\n              />\n              <DrawerActionRow\n                icon="logout"\n                title="Se déconnecter"\n                active={false}\n                onPress={handleLogout}\n              />\n            </>\n          ) : (\n            <>\n              <DrawerActionRow\n                icon="login"\n                title="Connexion"\n                active={pathname.includes("/auth/login")}\n                onPress={() => navigate("/auth/login")}\n              />\n              <DrawerActionRow\n                icon="person-add"\n                title="Inscription"\n                active={pathname.includes("/auth/register")}\n                onPress={() => navigate("/auth/register")}\n              />\n            </>\n          )}\n        </DrawerSection>\n\n        <DrawerSection title="Services">\n          <DrawerActionRow')
path.write_text(text)
