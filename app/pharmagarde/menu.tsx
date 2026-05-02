import MaterialIcons from "@expo/vector-icons/MaterialIcons";
import { useRouter } from "expo-router";
import { FlatList, StyleSheet, Text, TextInput, TouchableOpacity, View } from "react-native";

import { MenuRow, StatusNotice } from "@/components/pharmagarde/app-ui";
import { ScreenContainer } from "@/components/screen-container";
import { usePharmaGarde } from "@/lib/pharmagarde/app-state";
import { AppLanguage, AppMode, AppPreferences, MapPreference } from "@/lib/pharmagarde/types";

type MenuItem = {
  id: string;
  icon: keyof typeof MaterialIcons.glyphMap;
  title: string;
  description: string;
  action: () => void;
};

type PreferenceOption<Key extends keyof AppPreferences> = {
  key: Key;
  label: string;
  values: AppPreferences[Key][];
};

const PREFERENCE_OPTIONS: Array<PreferenceOption<"mode"> | PreferenceOption<"language"> | PreferenceOption<"mapType">> = [
  { key: "mode", label: "Affichage", values: ["Clair", "Sombre", "Système"] satisfies AppMode[] },
  { key: "language", label: "Langue", values: ["Français", "Mooré", "Dioula", "Fulfuldé"] satisfies AppLanguage[] },
  { key: "mapType", label: "Carte", values: ["Standard", "Satellite"] satisfies MapPreference[] },
];

export default function MenuScreen() {
  const router = useRouter();
  const { preferences, updatePreference, locationMessage, refreshData, requestLocation } = usePharmaGarde();

  const items: MenuItem[] = [
    { id: "home", icon: "home", title: "Accueil", description: "Voir les pharmacies proches", action: () => router.replace("/" as never) },
    { id: "pharmacies", icon: "local-pharmacy", title: "Pharmacies proches", description: "Accéder directement à la liste d’accueil", action: () => router.replace("/" as never) },
    { id: "clinics", icon: "local-hospital", title: "Cliniques et Centres de soins", description: "Consulter les structures sanitaires", action: () => router.replace("/(tabs)/cliniques" as never) },
    { id: "medicines", icon: "medication", title: "Médicaments essentiels", description: "Voir les produits autorisés et prix indicatifs", action: () => router.replace("/(tabs)/medicaments" as never) },
    { id: "map", icon: "map", title: "Carte", description: "Visualiser pharmacies et cliniques", action: () => router.replace("/(tabs)/carte" as never) },
    { id: "favorites", icon: "favorite", title: "Favoris", description: "Retrouver les éléments sauvegardés", action: () => router.push("/pharmagarde/favoris" as never) },
    { id: "search", icon: "search", title: "Recherche", description: "Rechercher pharmacies, cliniques et médicaments", action: () => router.push("/pharmagarde/search" as never) },
  ];

  const header = (
    <View>
      <View style={styles.topRow}>
        <View>
          <Text style={styles.kicker}>Menu</Text>
          <Text style={styles.title}>PharmaGarde BF</Text>
          <Text style={styles.subtitle}>Navigation et préférences locales</Text>
        </View>
        <TouchableOpacity accessibilityRole="button" style={styles.closeButton} onPress={() => router.back()}>
          <Text style={styles.closeText}>Fermer</Text>
        </TouchableOpacity>
      </View>

      <View style={styles.sectionCard}>
        <Text style={styles.sectionTitle}>Préférences</Text>
        <Text style={styles.sectionText}>Ces réglages sont conservés sur l’appareil et permettent d’adapter l’expérience sans compte utilisateur.</Text>
        {PREFERENCE_OPTIONS.map((option) => (
          <View key={option.key} style={styles.preferenceGroup}>
            <Text style={styles.preferenceLabel}>{option.label}</Text>
            <View style={styles.chipRow}>
              {option.values.map((value) => {
                const active = preferences[option.key] === value;
                return (
                  <TouchableOpacity
                    key={value}
                    accessibilityRole="button"
                    accessibilityState={{ selected: active }}
                    style={[styles.chip, active && styles.activeChip]}
                    onPress={() => updatePreference(option.key, value as never)}
                  >
                    <Text style={[styles.chipText, active && styles.activeChipText]}>{value}</Text>
                  </TouchableOpacity>
                );
              })}
            </View>
          </View>
        ))}
        <Text style={styles.preferenceLabel}>Ville de référence</Text>
        <TextInput
          value={preferences.city}
          onChangeText={(value) => updatePreference("city", value)}
          placeholder="Ouagadougou"
          placeholderTextColor="#98A2B3"
          autoCapitalize="words"
          style={styles.input}
        />
      </View>

      <View style={styles.sectionCard}>
        <Text style={styles.sectionTitle}>Actions rapides</Text>
        <View style={styles.actionsRow}>
          <TouchableOpacity accessibilityRole="button" style={styles.primaryButton} onPress={refreshData}>
            <MaterialIcons name="refresh" size={18} color="#FFFFFF" />
            <Text style={styles.primaryText}>Actualiser</Text>
          </TouchableOpacity>
          <TouchableOpacity accessibilityRole="button" style={styles.secondaryButton} onPress={requestLocation}>
            <MaterialIcons name="my-location" size={18} color="#03A63F" />
            <Text style={styles.secondaryText}>Localiser</Text>
          </TouchableOpacity>
        </View>
        <StatusNotice message={locationMessage} tone="success" />
      </View>

      <Text style={styles.navTitle}>Navigation</Text>
    </View>
  );

  return (
    <ScreenContainer>
      <FlatList<MenuItem>
        style={styles.page}
        data={items}
        keyExtractor={(item) => item.id}
        renderItem={({ item }) => <MenuRow icon={item.icon} title={item.title} description={item.description} onPress={item.action} />}
        ListHeaderComponent={header}
        contentContainerStyle={styles.content}
      />
    </ScreenContainer>
  );
}

const styles = StyleSheet.create({
  page: { flex: 1, backgroundColor: "#F6FBF8" },
  content: { paddingBottom: 30 },
  topRow: { paddingHorizontal: 16, paddingTop: 14, paddingBottom: 10, flexDirection: "row", alignItems: "center", justifyContent: "space-between" },
  kicker: { color: "#03A63F", fontSize: 12, lineHeight: 17, fontWeight: "900", textTransform: "uppercase", letterSpacing: 0.8 },
  title: { color: "#102016", fontSize: 26, lineHeight: 32, fontWeight: "900", marginTop: 2 },
  subtitle: { color: "#667085", fontSize: 13, lineHeight: 18, marginTop: 4, fontWeight: "700" },
  closeButton: { minHeight: 40, paddingHorizontal: 16, borderRadius: 20, backgroundColor: "#FFFFFF", borderWidth: 1, borderColor: "#D6EBDD", alignItems: "center", justifyContent: "center" },
  closeText: { color: "#03A63F", fontWeight: "900" },
  sectionCard: { marginHorizontal: 16, marginTop: 12, padding: 16, borderRadius: 24, backgroundColor: "#FFFFFF", borderWidth: 1, borderColor: "#D6EBDD" },
  sectionTitle: { color: "#102016", fontSize: 18, lineHeight: 24, fontWeight: "900" },
  sectionText: { color: "#667085", fontSize: 13, lineHeight: 19, marginTop: 6, marginBottom: 4 },
  preferenceGroup: { marginTop: 14 },
  preferenceLabel: { color: "#102016", fontSize: 13, lineHeight: 18, fontWeight: "900", marginTop: 14, marginBottom: 8 },
  chipRow: { flexDirection: "row", flexWrap: "wrap", gap: 8 },
  chip: { minHeight: 38, paddingHorizontal: 14, borderRadius: 19, alignItems: "center", justifyContent: "center", backgroundColor: "#F6FBF8", borderWidth: 1, borderColor: "#D6EBDD" },
  activeChip: { backgroundColor: "#03C04A", borderColor: "#03C04A" },
  chipText: { color: "#102016", fontSize: 13, fontWeight: "800" },
  activeChipText: { color: "#FFFFFF" },
  input: { minHeight: 48, borderRadius: 16, borderWidth: 1, borderColor: "#D6EBDD", paddingHorizontal: 14, color: "#102016", backgroundColor: "#F6FBF8", fontWeight: "700" },
  actionsRow: { flexDirection: "row", gap: 10, marginTop: 14 },
  primaryButton: { flex: 1, minHeight: 46, borderRadius: 23, backgroundColor: "#03C04A", alignItems: "center", justifyContent: "center", flexDirection: "row", gap: 7 },
  primaryText: { color: "#FFFFFF", fontWeight: "900", fontSize: 13 },
  secondaryButton: { flex: 1, minHeight: 46, borderRadius: 23, backgroundColor: "#EAF8EF", alignItems: "center", justifyContent: "center", flexDirection: "row", gap: 7 },
  secondaryText: { color: "#03A63F", fontWeight: "900", fontSize: 13 },
  navTitle: { color: "#102016", fontSize: 18, lineHeight: 24, fontWeight: "900", marginHorizontal: 16, marginTop: 18, marginBottom: 4 },
});
