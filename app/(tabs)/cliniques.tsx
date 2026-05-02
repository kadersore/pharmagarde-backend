import { useState } from "react";
import { FlatList, StyleSheet, View } from "react-native";

import { AppChrome, EmptyState, PlaceCard, StatusNotice } from "@/components/pharmagarde/app-ui";
import { usePharmaGarde } from "@/lib/pharmagarde/app-state";
import { HealthPlace } from "@/lib/pharmagarde/types";

export default function ClinicsScreen() {
  const { clinics, errors, isApiConfigured, loading, preferences, refreshData } = usePharmaGarde();
  const [expandedPlaceId, setExpandedPlaceId] = useState<string | undefined>();
  const selectedCity = preferences.city;
  const emptyTitle = loading ? "Chargement des cliniques" : errors.clinics ? "Chargement impossible" : `Aucune clinique trouvée à ${selectedCity}`;
  const emptyMessage = loading
    ? `Recherche des structures de santé de ${selectedCity}…`
    : errors.clinics ?? (isApiConfigured
      ? `Le backend n’a retourné aucune structure de santé pour ${selectedCity}. Essayez d’actualiser ou choisissez une autre ville.`
      : "Le backend n’est pas disponible dans cet environnement de test.");

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
        renderItem={({ item }) => {
          const itemKey = `${item.type}-${item.id}`;
          return (
            <PlaceCard
              place={item}
              isExpanded={expandedPlaceId === itemKey}
              onToggle={() => setExpandedPlaceId((current) => current === itemKey ? undefined : itemKey)}
            />
          );
        }}
        ListHeaderComponent={header}
        ListEmptyComponent={<EmptyState title={emptyTitle} message={emptyMessage} actionLabel={errors.clinics ? "Réessayer" : undefined} onAction={errors.clinics ? refreshData : undefined} />}
        contentContainerStyle={styles.listContent}
      />
    </AppChrome>
  );
}

const styles = StyleSheet.create({
  listContent: { paddingBottom: 28 },
  headerNotice: { marginTop: 8 },
});
