import { FlatList, StyleSheet, Text, View } from "react-native";

import { AppChrome, EmptyState, PlaceCard, StatusNotice } from "@/components/pharmagarde/app-ui";
import { PharmaMap } from "@/components/pharmagarde/PharmaMap";
import { usePharmaGarde } from "@/lib/pharmagarde/app-state";
import { HealthPlace } from "@/lib/pharmagarde/types";

export default function MapScreen() {
  const { pharmacies, clinics, userLocation, locationMessage, errors, requestLocation } = usePharmaGarde();
  const places = [...pharmacies, ...clinics];

  const header = (
    <View>
      <View style={styles.headerCard}>
        <Text style={styles.kicker}>Carte</Text>
        <Text style={styles.title}>Pharmacies et cliniques autour de vous</Text>
        <Text style={styles.description}>Sur web, la carte affiche une vue testable sans clé. Sur Expo Go mobile, les repères natifs utilisent react-native-maps lorsque les coordonnées sont fournies par l’API.</Text>
      </View>
      <PharmaMap places={places} userLocation={userLocation} />
      <StatusNotice message={locationMessage} tone="success" />
      <StatusNotice message={errors.pharmacies ?? errors.clinics} tone="error" />
      <Text style={styles.sectionTitle}>Points affichés</Text>
    </View>
  );

  return (
    <AppChrome subtitle="Carte">
      <FlatList<HealthPlace>
        data={places}
        keyExtractor={(item) => `${item.type}-${item.id}`}
        renderItem={({ item }) => <PlaceCard place={item} />}
        ListHeaderComponent={header}
        ListEmptyComponent={<EmptyState title="Carte vide" message="Aucune structure géolocalisée n’a été chargée. Configurez l’API et autorisez la localisation si nécessaire." actionLabel="Activer la localisation" onAction={requestLocation} />}
        contentContainerStyle={styles.listContent}
      />
    </AppChrome>
  );
}

const styles = StyleSheet.create({
  listContent: { paddingBottom: 28 },
  headerCard: { margin: 16, padding: 18, borderRadius: 26, backgroundColor: "#FFF8E6", borderWidth: 1, borderColor: "#FAD77A" },
  kicker: { color: "#A15C00", fontSize: 12, lineHeight: 17, fontWeight: "900", textTransform: "uppercase", letterSpacing: 0.6 },
  title: { color: "#102016", fontSize: 22, lineHeight: 28, fontWeight: "900", marginTop: 6 },
  description: { color: "#667085", fontSize: 14, lineHeight: 21, marginTop: 8 },
  sectionTitle: { color: "#102016", fontSize: 18, lineHeight: 24, fontWeight: "900", marginHorizontal: 16, marginTop: 10, marginBottom: 4 },
});
