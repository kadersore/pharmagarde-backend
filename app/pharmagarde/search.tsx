import MaterialIcons from "@expo/vector-icons/MaterialIcons";
import { useRouter } from "expo-router";
import { FlatList, Pressable, StyleSheet, Text, View } from "react-native";

import { AppChrome, EmptyState, SearchField, SearchResultRow } from "@/components/pharmagarde/app-ui";
import { haptic, usePremiumPalette } from "@/lib/pharmagarde/premium-ui";
import { usePharmaGarde } from "@/lib/pharmagarde/app-state";
import { CombinedSearchItem } from "@/lib/pharmagarde/types";

export default function SearchScreen() {
  const router = useRouter();
  const palette = usePremiumPalette();
  const { searchQuery, setSearchQuery, searchResults } = usePharmaGarde();

  const header = (
    <View>
      <View style={styles.topRow}>
        <View>
          <Text style={[styles.kicker, { color: palette.brand }]}>Recherche intelligente</Text>
          <Text style={[styles.title, { color: palette.text }]}>Trouver un service</Text>
        </View>
        <Pressable
          accessibilityRole="button"
          accessibilityLabel="Fermer la recherche"
          style={({ pressed }) => [styles.closeButton, { backgroundColor: palette.card, borderColor: palette.border }, pressed ? styles.pressedScale : undefined]}
          onPress={() => {
            haptic.light();
            router.back();
          }}
        >
          <MaterialIcons name="close" size={20} color={palette.brand} />
          <Text style={[styles.closeText, { color: palette.brand }]}>Fermer</Text>
        </Pressable>
      </View>
      <SearchField value={searchQuery} onChangeText={setSearchQuery} placeholder="Nom, quartier, catégorie..." />
      <View style={[styles.countPill, { backgroundColor: palette.glass, borderColor: palette.border }]}> 
        <MaterialIcons name="manage-search" size={16} color={palette.brand} />
        <Text style={[styles.count, { color: palette.muted }]}>{searchResults.length} résultat(s) synchronisé(s)</Text>
      </View>
    </View>
  );

  return (
    <AppChrome subtitle="Recherche">
      <FlatList<CombinedSearchItem>
        style={[styles.page, { backgroundColor: palette.background }]}
        data={searchResults}
        keyExtractor={(item) => `${item.entityType}-${item.id}`}
        renderItem={({ item }) => <SearchResultRow item={item} />}
        ListHeaderComponent={header}
        ListEmptyComponent={<EmptyState title="Aucun résultat" message="Vérifiez le terme recherché ou configurez une API contenant des données réelles." />}
        contentContainerStyle={styles.content}
      />
    </AppChrome>
  );
}

const styles = StyleSheet.create({
  page: { flex: 1 },
  content: { paddingBottom: 28 },
  topRow: { flexDirection: "row", alignItems: "center", justifyContent: "space-between", paddingHorizontal: 16, paddingTop: 16, gap: 14 },
  kicker: { fontSize: 11, lineHeight: 15, fontWeight: "900", letterSpacing: 0.8, textTransform: "uppercase" },
  title: { fontSize: 25, lineHeight: 31, fontWeight: "900", marginTop: 2 },
  closeButton: { minHeight: 42, paddingHorizontal: 13, borderRadius: 21, borderWidth: 1, flexDirection: "row", alignItems: "center", justifyContent: "center", gap: 6, shadowColor: "#092A13", shadowOpacity: 0.08, shadowRadius: 12, shadowOffset: { width: 0, height: 5 }, elevation: 3 },
  closeText: { fontWeight: "900", fontSize: 13, lineHeight: 17 },
  countPill: { alignSelf: "flex-start", marginHorizontal: 16, marginTop: 2, marginBottom: 6, minHeight: 34, paddingHorizontal: 12, borderRadius: 17, borderWidth: 1, flexDirection: "row", alignItems: "center", gap: 7 },
  count: { fontSize: 12, lineHeight: 16, fontWeight: "800" },
  pressedScale: { opacity: 0.86, transform: [{ scale: 0.97 }] },
});
