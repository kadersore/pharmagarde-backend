import MaterialIcons from "@expo/vector-icons/MaterialIcons";
import { Pressable, ScrollView, StyleSheet, Text, View } from "react-native";

import { AppChrome } from "@/components/pharmagarde/app-ui";

const BRAND_GREEN = "#03C04A";

const BENEFITS = [
  "Alertes de garde prioritaires par ville",
  "Favoris avancés pour pharmacies et cliniques",
  "Historique de recherches et accès rapide hors ligne",
  "Contribution vérifiée avec suivi de statut",
];

export default function SubscriptionScreen() {
  return (
    <AppChrome subtitle="Services">
      <ScrollView style={styles.page} contentContainerStyle={styles.content}>
        <View style={styles.heroCard}>
          <View style={styles.badge}>
            <MaterialIcons name="workspace-premium" size={28} color="#FFFFFF" />
          </View>
          <Text style={styles.title}>Abonnement PharmaGarde Plus</Text>
          <Text style={styles.description}>Une offre premium est prévue pour renforcer les alertes locales, les favoris et la contribution communautaire validée.</Text>
        </View>

        <View style={styles.card}>
          <Text style={styles.sectionTitle}>Fonctionnalités prévues</Text>
          {BENEFITS.map((benefit) => (
            <View key={benefit} style={styles.benefitRow}>
              <MaterialIcons name="check-circle" size={21} color={BRAND_GREEN} />
              <Text style={styles.benefitText}>{benefit}</Text>
            </View>
          ))}
        </View>

        <Pressable accessibilityRole="button" style={({ pressed }) => [styles.button, pressed && styles.pressed]}>
          <MaterialIcons name="notifications-active" size={19} color="#FFFFFF" />
          <Text style={styles.buttonText}>Me prévenir au lancement</Text>
        </Pressable>
        <Text style={styles.note}>Aucun paiement n’est activé dans cette version. L’écran est prêt pour une future intégration d’abonnement.</Text>
      </ScrollView>
    </AppChrome>
  );
}

const styles = StyleSheet.create({
  page: { flex: 1, backgroundColor: "#F6FBF8" },
  content: { padding: 16, paddingBottom: 28 },
  heroCard: { borderRadius: 30, padding: 18, backgroundColor: "#102016", overflow: "hidden" },
  badge: { width: 58, height: 58, borderRadius: 29, backgroundColor: BRAND_GREEN, alignItems: "center", justifyContent: "center", marginBottom: 14 },
  title: { color: "#FFFFFF", fontSize: 26, lineHeight: 33, fontWeight: "900" },
  description: { color: "rgba(255,255,255,0.78)", fontSize: 15, lineHeight: 22, marginTop: 8 },
  card: { marginTop: 16, borderRadius: 28, backgroundColor: "#FFFFFF", borderWidth: 1, borderColor: "#D6EBDD", padding: 16, gap: 12 },
  sectionTitle: { color: "#102016", fontSize: 17, lineHeight: 23, fontWeight: "900", marginBottom: 2 },
  benefitRow: { flexDirection: "row", alignItems: "flex-start", gap: 10 },
  benefitText: { flex: 1, color: "#102016", fontSize: 14, lineHeight: 21, fontWeight: "700" },
  button: { minHeight: 52, borderRadius: 26, backgroundColor: BRAND_GREEN, alignItems: "center", justifyContent: "center", flexDirection: "row", gap: 9, marginTop: 16 },
  pressed: { opacity: 0.86, transform: [{ scale: 0.99 }] },
  buttonText: { color: "#FFFFFF", fontSize: 15, fontWeight: "900" },
  note: { color: "#667085", fontSize: 13, lineHeight: 19, marginTop: 10, textAlign: "center" },
});
