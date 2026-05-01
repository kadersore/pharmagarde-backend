import { FlatList, StyleSheet, Text, View } from "react-native";

import { AppChrome, EmptyState, MedicineCard, StatusNotice } from "@/components/pharmagarde/app-ui";
import { usePharmaGarde } from "@/lib/pharmagarde/app-state";
import { Medicine } from "@/lib/pharmagarde/types";

export default function MedicinesScreen() {
  const { medicines, errors, refreshData } = usePharmaGarde();

  const header = (
    <View>
      <View style={styles.headerCard}>
        <Text style={styles.kicker}>Référentiel</Text>
        <Text style={styles.title}>Médicaments essentiels</Text>
        <Text style={styles.description}>Cette section consomme l’endpoint `/medicaments`. Les images, catégories, formes et descriptions ne sont affichées que si elles existent côté API.</Text>
      </View>
      <StatusNotice message={errors.medicines} tone="error" />
    </View>
  );

  return (
    <AppChrome subtitle="Médicaments">
      <FlatList<Medicine>
        data={medicines}
        keyExtractor={(item) => item.id}
        renderItem={({ item }) => <MedicineCard medicine={item} />}
        ListHeaderComponent={header}
        ListEmptyComponent={<EmptyState title="Aucun médicament chargé" message="Renseignez l’URL du backend réel dans le menu. Aucune liste locale fictive n’est utilisée." actionLabel="Réessayer" onAction={refreshData} />}
        contentContainerStyle={styles.listContent}
      />
    </AppChrome>
  );
}

const styles = StyleSheet.create({
  listContent: { paddingBottom: 28 },
  headerCard: { margin: 16, padding: 18, borderRadius: 26, backgroundColor: "#F1F8F3", borderWidth: 1, borderColor: "#D6EBDD" },
  kicker: { color: "#03A63F", fontSize: 12, lineHeight: 17, fontWeight: "900", textTransform: "uppercase", letterSpacing: 0.6 },
  title: { color: "#102016", fontSize: 22, lineHeight: 28, fontWeight: "900", marginTop: 6 },
  description: { color: "#667085", fontSize: 14, lineHeight: 21, marginTop: 8 },
});
