import { FlatList, StyleSheet, View } from "react-native";

import { AppChrome, EmptyState, PlaceCard, StatusNotice } from "@/components/pharmagarde/app-ui";
import { usePharmaGarde } from "@/lib/pharmagarde/app-state";
import { HealthPlace } from "@/lib/pharmagarde/types";

export default function ClinicsScreen() {
  const { clinics, errors, refreshData } = usePharmaGarde();

  const header = (
    <View style={styles.headerNotice}>
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
  headerNotice: { marginTop: 8 },
});
