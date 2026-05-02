import { FlatList, StyleSheet, Text } from "react-native";

import { AppChrome, EmptyState, PlaceCard } from "@/components/pharmagarde/app-ui";
import { usePharmaGarde } from "@/lib/pharmagarde/app-state";
import { HealthPlace } from "@/lib/pharmagarde/types";

export default function HomeScreen() {
  const { pharmacies } = usePharmaGarde();

  const header = <Text style={styles.sectionTitle}>Pharmacies proches</Text>;

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
  sectionTitle: { color: "#102016", fontSize: 22, lineHeight: 28, fontWeight: "900", marginHorizontal: 16, marginTop: 18, marginBottom: 8 },
});
