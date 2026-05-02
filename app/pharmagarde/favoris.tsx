import MaterialIcons from "@expo/vector-icons/MaterialIcons";
import { useRouter } from "expo-router";
import { FlatList, Pressable, StyleSheet, Text, View } from "react-native";

import { AppChrome, EmptyState, FavoriteRow } from "@/components/pharmagarde/app-ui";
import { haptic, usePremiumPalette } from "@/lib/pharmagarde/premium-ui";
import { usePharmaGarde } from "@/lib/pharmagarde/app-state";
import { FavoriteItem } from "@/lib/pharmagarde/types";

export default function FavoritesScreen() {
  const router = useRouter();
  const palette = usePremiumPalette();
  const { favorites } = usePharmaGarde();

  const header = (
    <View style={styles.topRow}>
      <View>
        <Text style={[styles.kicker, { color: palette.brand }]}>Sauvegardés</Text>
        <Text style={[styles.title, { color: palette.text }]}>Favoris</Text>
      </View>
      <Pressable
        accessibilityRole="button"
        accessibilityLabel="Fermer les favoris"
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
  );

  return (
    <AppChrome subtitle="Favoris">
      <FlatList<FavoriteItem>
        style={[styles.page, { backgroundColor: palette.background }]}
        data={favorites}
        keyExtractor={(item) => `${item.entityType}-${item.id}`}
        renderItem={({ item }) => <FavoriteRow item={item} />}
        ListHeaderComponent={header}
        ListEmptyComponent={<EmptyState title="Aucun favori" message="Ajoutez des pharmacies, cliniques ou médicaments depuis les listes pour les retrouver ici." />}
        contentContainerStyle={styles.content}
      />
    </AppChrome>
  );
}

const styles = StyleSheet.create({
  page: { flex: 1 },
  content: { paddingBottom: 28 },
  topRow: { paddingHorizontal: 16, paddingTop: 16, paddingBottom: 12, flexDirection: "row", alignItems: "center", justifyContent: "space-between", gap: 14 },
  kicker: { fontSize: 11, lineHeight: 15, fontWeight: "900", textTransform: "uppercase", letterSpacing: 0.8 },
  title: { fontSize: 25, lineHeight: 31, fontWeight: "900", marginTop: 2 },
  closeButton: { minHeight: 42, paddingHorizontal: 13, borderRadius: 21, borderWidth: 1, flexDirection: "row", alignItems: "center", justifyContent: "center", gap: 6, shadowColor: "#092A13", shadowOpacity: 0.08, shadowRadius: 12, shadowOffset: { width: 0, height: 5 }, elevation: 3 },
  closeText: { fontWeight: "900", fontSize: 13, lineHeight: 17 },
  pressedScale: { opacity: 0.86, transform: [{ scale: 0.97 }] },
});
