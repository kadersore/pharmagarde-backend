import { FlatList, StyleSheet, Text, View } from "react-native";

import { AppChrome, EmptyState, MedicineCard, StatusNotice } from "@/components/pharmagarde/app-ui";
import { usePharmaGarde } from "@/lib/pharmagarde/app-state";
import { Medicine } from "@/lib/pharmagarde/types";

export default function MedicinesScreen() {
  const { medicines, errors } = usePharmaGarde();

  const header = (
    <View>
      <View style={styles.headerCard}>
        <Text style={styles.kicker}>Référentiel Burkina Faso</Text>
        <Text style={styles.title}>Médicaments essentiels</Text>
        <Text style={styles.description}>Catalogue indicatif de médicaments courants avec catégorie, forme pharmaceutique et prix approximatif en FCFA. Les prix peuvent varier selon la ville et la disponibilité.</Text>
        <View style={styles.summaryRow}>
          <View style={styles.summaryChip}><Text style={styles.summaryValue}>{medicines.length}</Text><Text style={styles.summaryLabel}>références</Text></View>
          <View style={styles.summaryChip}><Text style={styles.summaryValue}>FCFA</Text><Text style={styles.summaryLabel}>prix indicatifs</Text></View>
        </View>
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
        ListEmptyComponent={<EmptyState title="Aucun médicament disponible" message="La liste locale n’a pas pu être chargée. Veuillez réouvrir l’application ou réessayer plus tard." />}
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
  summaryRow: { flexDirection: "row", gap: 10, marginTop: 14 },
  summaryChip: { flex: 1, borderRadius: 18, backgroundColor: "#FFFFFF", borderWidth: 1, borderColor: "#D6EBDD", padding: 12 },
  summaryValue: { color: "#03A63F", fontSize: 18, lineHeight: 23, fontWeight: "900" },
  summaryLabel: { color: "#667085", fontSize: 12, lineHeight: 16, fontWeight: "700", marginTop: 2 },
});
