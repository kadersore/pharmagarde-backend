import { useRouter } from "expo-router";
import { FlatList, StyleSheet, Text, TouchableOpacity, View } from "react-native";

import { EmptyState, FavoriteRow } from "@/components/pharmagarde/app-ui";
import { ScreenContainer } from "@/components/screen-container";
import { usePharmaGarde } from "@/lib/pharmagarde/app-state";
import { FavoriteItem } from "@/lib/pharmagarde/types";

export default function FavoritesScreen() {
  const router = useRouter();
  const { favorites } = usePharmaGarde();

  const header = (
    <View style={styles.topRow}>
      <View>
        <Text style={styles.kicker}>Sauvegardés</Text>
        <Text style={styles.title}>Favoris</Text>
      </View>
      <TouchableOpacity style={styles.closeButton} onPress={() => router.back()}>
        <Text style={styles.closeText}>Fermer</Text>
      </TouchableOpacity>
    </View>
  );

  return (
    <ScreenContainer>
      <FlatList<FavoriteItem>
        style={styles.page}
        data={favorites}
        keyExtractor={(item) => `${item.entityType}-${item.id}`}
        renderItem={({ item }) => <FavoriteRow item={item} />}
        ListHeaderComponent={header}
        ListEmptyComponent={<EmptyState title="Aucun favori" message="Ajoutez des pharmacies, cliniques ou médicaments depuis les listes pour les retrouver ici." />}
        contentContainerStyle={styles.content}
      />
    </ScreenContainer>
  );
}

const styles = StyleSheet.create({
  page: { flex: 1, backgroundColor: "#F6FBF8" },
  content: { paddingBottom: 28 },
  topRow: { paddingHorizontal: 16, paddingTop: 14, paddingBottom: 12, flexDirection: "row", alignItems: "center", justifyContent: "space-between" },
  kicker: { color: "#03A63F", fontSize: 12, lineHeight: 17, fontWeight: "900", textTransform: "uppercase", letterSpacing: 0.8 },
  title: { color: "#102016", fontSize: 26, lineHeight: 32, fontWeight: "900", marginTop: 2 },
  closeButton: { minHeight: 40, paddingHorizontal: 16, borderRadius: 20, backgroundColor: "#FFFFFF", borderWidth: 1, borderColor: "#D6EBDD", alignItems: "center", justifyContent: "center" },
  closeText: { color: "#03A63F", fontWeight: "900" },
});
