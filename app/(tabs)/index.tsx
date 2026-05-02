import { useState } from "react";
import { FlatList, StyleSheet } from "react-native";

import { AppChrome, EmptyState, PlaceCard } from "@/components/pharmagarde/app-ui";
import { usePharmaGarde } from "@/lib/pharmagarde/app-state";
import { HealthPlace } from "@/lib/pharmagarde/types";

export default function HomeScreen() {
  const { pharmacies } = usePharmaGarde();
  const [expandedPlaceId, setExpandedPlaceId] = useState<string | undefined>();

  return (
    <AppChrome subtitle="Accueil">
      <FlatList<HealthPlace>
        data={pharmacies.slice(0, 6)}
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
        ListEmptyComponent={<EmptyState title="Aucune pharmacie chargée" message="La version testable attend une API réelle. Ouvrez le menu pour renseigner l’URL du backend puis actualisez." />}
        contentContainerStyle={styles.listContent}
      />
    </AppChrome>
  );
}

const styles = StyleSheet.create({
  listContent: { paddingBottom: 28 },
});
