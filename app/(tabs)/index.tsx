import { FlatList, StyleSheet, Text, TouchableOpacity, View } from "react-native";

import { AppChrome, EmptyState, PlaceCard, SearchField, StatusNotice } from "@/components/pharmagarde/app-ui";
import { usePharmaGarde } from "@/lib/pharmagarde/app-state";
import { HealthPlace } from "@/lib/pharmagarde/types";

export default function HomeScreen() {
  const {
    pharmacies,
    clinics,
    medicines,
    errors,
    isApiConfigured,
    locationMessage,
    refreshingLocation,
    searchQuery,
    setSearchQuery,
    requestLocation,
    refreshData,
  } = usePharmaGarde();

  const header = (
    <View>
      <View style={styles.hero}>
        <Text style={styles.heroKicker}>Burkina Faso</Text>
        <Text style={styles.heroTitle}>Trouvez rapidement une structure de santé proche.</Text>
        <Text style={styles.heroText}>Configurez votre API réelle, activez la localisation puis testez les pharmacies, cliniques, médicaments, favoris et itinéraires.</Text>
        <View style={styles.heroActions}>
          <TouchableOpacity style={styles.primaryAction} onPress={refreshData}>
            <Text style={styles.primaryActionText}>Actualiser</Text>
          </TouchableOpacity>
          <TouchableOpacity style={styles.secondaryAction} onPress={requestLocation} disabled={refreshingLocation}>
            <Text style={styles.secondaryActionText}>{refreshingLocation ? "Localisation..." : "Activer la localisation"}</Text>
          </TouchableOpacity>
        </View>
      </View>
      <SearchField value={searchQuery} onChangeText={setSearchQuery} placeholder="Recherche rapide" />
      <View style={styles.statsRow}>
        <View style={styles.statCard}><Text style={styles.statValue}>{pharmacies.length}</Text><Text style={styles.statLabel}>Pharmacies</Text></View>
        <View style={styles.statCard}><Text style={styles.statValue}>{clinics.length}</Text><Text style={styles.statLabel}>Cliniques</Text></View>
        <View style={styles.statCard}><Text style={styles.statValue}>{medicines.length}</Text><Text style={styles.statLabel}>Médicaments</Text></View>
      </View>
      <StatusNotice message={locationMessage} tone="success" />
      <StatusNotice message={!isApiConfigured ? "Aucune donnée locale fictive n’est injectée. Renseignez l’URL API dans le menu pour charger vos données réelles." : undefined} />
      <StatusNotice message={errors.pharmacies} tone="error" />
      <Text style={styles.sectionTitle}>Pharmacies proches</Text>
    </View>
  );

  return (
    <AppChrome subtitle="Accueil">
      <FlatList<HealthPlace>
        data={pharmacies.slice(0, 6)}
        keyExtractor={(item) => item.id}
        renderItem={({ item }) => <PlaceCard place={item} />}
        ListHeaderComponent={header}
        ListEmptyComponent={<EmptyState title="Aucune pharmacie chargée" message="La version testable attend une API réelle. Ouvrez le menu pour renseigner l’URL du backend puis actualisez." />}
        contentContainerStyle={styles.listContent}
      />
    </AppChrome>
  );
}

const styles = StyleSheet.create({
  listContent: { paddingBottom: 28 },
  hero: { margin: 16, padding: 20, borderRadius: 28, backgroundColor: "#03C04A" },
  heroKicker: { color: "#E8FFF0", fontSize: 13, lineHeight: 18, fontWeight: "800", textTransform: "uppercase", letterSpacing: 0.7 },
  heroTitle: { color: "#FFFFFF", fontSize: 26, lineHeight: 32, fontWeight: "900", marginTop: 8 },
  heroText: { color: "#F2FFF6", fontSize: 14, lineHeight: 21, marginTop: 10 },
  heroActions: { flexDirection: "row", gap: 10, marginTop: 18 },
  primaryAction: { flex: 1, height: 46, borderRadius: 23, alignItems: "center", justifyContent: "center", backgroundColor: "#FFFFFF" },
  primaryActionText: { color: "#03A63F", fontWeight: "900", fontSize: 14 },
  secondaryAction: { flex: 1, height: 46, borderRadius: 23, alignItems: "center", justifyContent: "center", backgroundColor: "rgba(255,255,255,0.18)", borderWidth: 1, borderColor: "rgba(255,255,255,0.42)" },
  secondaryActionText: { color: "#FFFFFF", fontWeight: "900", fontSize: 14 },
  statsRow: { flexDirection: "row", gap: 10, marginHorizontal: 16, marginBottom: 4 },
  statCard: { flex: 1, padding: 14, borderRadius: 20, backgroundColor: "#FFFFFF", borderWidth: 1, borderColor: "#D6EBDD" },
  statValue: { color: "#102016", fontSize: 22, lineHeight: 28, fontWeight: "900" },
  statLabel: { color: "#667085", fontSize: 12, lineHeight: 17, marginTop: 2, fontWeight: "700" },
  sectionTitle: { color: "#102016", fontSize: 18, lineHeight: 24, fontWeight: "900", marginHorizontal: 16, marginTop: 18, marginBottom: 4 },
});
