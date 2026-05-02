import { FlatList, StyleSheet } from "react-native";

import { AppChrome, EmptyState, PlaceCard } from "@/components/pharmagarde/app-ui";
import { usePharmaGarde } from "@/lib/pharmagarde/app-state";
import { HealthPlace } from "@/lib/pharmagarde/types";

export default function HomeScreen() {
  const { pharmacies } = usePharmaGarde();

  return (
    <AppChrome subtitle="Accueil">
      <FlatList<HealthPlace>
        data={pharmacies.slice(0, 6)}
        keyExtractor={(item) => item.id}
        renderItem={({ item }) => <PlaceCard place={item} />}
        ListEmptyComponent={<EmptyState title="Aucune pharmacie chargée" message="La version testable attend une API réelle. Ouvrez le menu pour renseigner l’URL du backend puis actualisez." />}
        contentContainerStyle={styles.listContent}
      />
    </AppChrome>
  );
}

const styles = StyleSheet.create({
  listContent: { paddingBottom: 28 },
});
