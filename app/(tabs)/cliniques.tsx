import { FlatList, StyleSheet, Text, View } from "react-native";

import { AppChrome, EmptyState, PlaceCard, StatusNotice } from "@/components/pharmagarde/app-ui";
import { usePharmaGarde } from "@/lib/pharmagarde/app-state";
import { HealthPlace } from "@/lib/pharmagarde/types";

export default function ClinicsScreen() {
  const { clinics, errors, refreshData } = usePharmaGarde();

  const header = (
    <View>
      <View style={styles.headerCard}>
        <Text style={styles.kicker}>Structures sanitaires</Text>
        <Text style={styles.title}>Cliniques et centres de soins</Text>
        <Text style={styles.description}>Les données affichées proviennent de votre endpoint `/cliniques/nearby`. Les cartes indiquent téléphone, distance, état d’ouverture et itinéraire lorsque l’API les fournit.</Text>
      </View>
      <StatusNotice message={errors.clinics} tone="error" />
    </View>
  );

  return (
    <AppChrome subtitle="Cliniques">
      <FlatList<HealthPlace>
        data={clinics}
        keyExtractor={(item) => item.id}
        renderItem={({ item }) => <PlaceCard place={item} />}
        ListHeaderComponent={header}
        ListEmptyComponent={<EmptyState title="Aucune clinique disponible" message="Configurez un backend réel, puis actualisez depuis l’accueil ou le menu." actionLabel="Réessayer" onAction={refreshData} />}
        contentContainerStyle={styles.listContent}
      />
    </AppChrome>
  );
}

const styles = StyleSheet.create({
  listContent: { paddingBottom: 28 },
  headerCard: { margin: 16, padding: 18, borderRadius: 26, backgroundColor: "#EAF4FF", borderWidth: 1, borderColor: "#B9DAFF" },
  kicker: { color: "#0B74DE", fontSize: 12, lineHeight: 17, fontWeight: "900", textTransform: "uppercase", letterSpacing: 0.6 },
  title: { color: "#102016", fontSize: 22, lineHeight: 28, fontWeight: "900", marginTop: 6 },
  description: { color: "#667085", fontSize: 14, lineHeight: 21, marginTop: 8 },
});
