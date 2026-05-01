import { useRouter } from "expo-router";
import { FlatList, StyleSheet, Text, TouchableOpacity, View } from "react-native";

import { EmptyState, SearchField, SearchResultRow } from "@/components/pharmagarde/app-ui";
import { ScreenContainer } from "@/components/screen-container";
import { usePharmaGarde } from "@/lib/pharmagarde/app-state";
import { CombinedSearchItem } from "@/lib/pharmagarde/types";

export default function SearchScreen() {
  const router = useRouter();
  const { searchQuery, setSearchQuery, searchResults } = usePharmaGarde();

  const header = (
    <View>
      <View style={styles.topRow}>
        <Text style={styles.title}>Recherche</Text>
        <TouchableOpacity style={styles.closeButton} onPress={() => router.back()}>
          <Text style={styles.closeText}>Fermer</Text>
        </TouchableOpacity>
      </View>
      <SearchField value={searchQuery} onChangeText={setSearchQuery} placeholder="Nom, quartier, catégorie..." />
      <Text style={styles.count}>{searchResults.length} résultat(s)</Text>
    </View>
  );

  return (
    <ScreenContainer className="" containerClassName="">
      <FlatList<CombinedSearchItem>
        style={styles.page}
        data={searchResults}
        keyExtractor={(item) => `${item.entityType}-${item.id}`}
        renderItem={({ item }) => <SearchResultRow item={item} />}
        ListHeaderComponent={header}
        ListEmptyComponent={<EmptyState title="Aucun résultat" message="Vérifiez le terme recherché ou configurez une API contenant des données réelles." />}
        contentContainerStyle={styles.content}
      />
    </ScreenContainer>
  );
}

const styles = StyleSheet.create({
  page: { flex: 1, backgroundColor: "#F6FBF8" },
  content: { paddingBottom: 28 },
  topRow: { flexDirection: "row", alignItems: "center", justifyContent: "space-between", paddingHorizontal: 16, paddingTop: 14 },
  title: { fontSize: 26, lineHeight: 32, fontWeight: "900", color: "#102016" },
  closeButton: { minHeight: 40, paddingHorizontal: 16, borderRadius: 20, backgroundColor: "#FFFFFF", borderWidth: 1, borderColor: "#D6EBDD", alignItems: "center", justifyContent: "center" },
  closeText: { color: "#03A63F", fontWeight: "900" },
  count: { marginHorizontal: 16, marginTop: 4, marginBottom: 6, color: "#667085", fontSize: 13, lineHeight: 18, fontWeight: "700" },
});
