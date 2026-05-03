import { useRouter } from "expo-router";
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
        <ActivityIndicator size="large" color={palette.brand} />
        <Text style={[styles.title, { color: palette.text }]}>Vérification de la session…</Text>
        <Text style={[styles.subtitle, { color: palette.muted }]}>Nous restaurons automatiquement votre compte si un token valide est disponible.</Text>
      </View>
    </ScreenContainer>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, alignItems: "center", justifyContent: "center", gap: 14 },
  title: { fontSize: 20, fontWeight: "900", textAlign: "center" },
  subtitle: { fontSize: 14, lineHeight: 21, textAlign: "center", maxWidth: 300 },
});
