import MaterialIcons from "@expo/vector-icons/MaterialIcons";
import { useRouter } from "expo-router";
import { FlatList, Pressable, StyleSheet, Text, View } from "react-native";

import { AppChrome } from "@/components/pharmagarde/app-ui";
import { usePharmaGarde } from "@/lib/pharmagarde/app-state";
import { PHARMAGARDE_CITIES } from "@/lib/pharmagarde/city-utils";

const BRAND_GREEN = "#03C04A";


export default function CitySelectionScreen() {
  const router = useRouter();
  const { preferences, updatePreference } = usePharmaGarde();

  const selectCity = async (city: string) => {
    await updatePreference("city", city);
    router.back();
  };

  return (
    <AppChrome subtitle="Ville">
      <View style={styles.content}>
        <Text style={styles.title}>Changer de ville</Text>
        <Text style={styles.description}>Choisissez la ville qui servira de référence pour la carte, les recherches et les suggestions locales.</Text>
        <FlatList
          data={PHARMAGARDE_CITIES}
          keyExtractor={(item) => item}
          contentContainerStyle={styles.list}
          renderItem={({ item }) => {
            const selected = item === preferences.city;
            return (
              <Pressable
                accessibilityRole="button"
                accessibilityState={{ selected }}
                android_ripple={{ color: "rgba(3,192,74,0.12)", borderless: false }}
                style={({ pressed }) => [styles.cityRow, selected && styles.selectedRow, pressed && styles.pressed]}
                onPress={() => selectCity(item)}
              >
                <View style={[styles.icon, selected && styles.selectedIcon]}>
                  <MaterialIcons name="location-city" size={21} color={selected ? "#FFFFFF" : BRAND_GREEN} />
                </View>
                <Text style={[styles.cityText, selected && styles.selectedText]}>{item}</Text>
                {selected ? <MaterialIcons name="check-circle" size={22} color={BRAND_GREEN} /> : null}
              </Pressable>
            );
          }}
        />
      </View>
    </AppChrome>
  );
}

const styles = StyleSheet.create({
  content: { flex: 1, paddingTop: 18 },
  title: { color: "#102016", fontSize: 25, lineHeight: 32, fontWeight: "900", marginHorizontal: 16 },
  description: { color: "#667085", fontSize: 14, lineHeight: 21, marginHorizontal: 16, marginTop: 6, marginBottom: 14 },
  list: { paddingHorizontal: 16, paddingBottom: 28 },
  cityRow: { minHeight: 66, borderRadius: 12, borderWidth: 1, borderColor: "#D6EBDD", backgroundColor: "#FFFFFF", paddingHorizontal: 14, marginBottom: 10, flexDirection: "row", alignItems: "center", gap: 12, shadowColor: "#092A13", shadowOpacity: 0.05, shadowRadius: 8, shadowOffset: { width: 0, height: 3 }, elevation: 2 },
  selectedRow: { backgroundColor: "#F0FFF5", borderColor: BRAND_GREEN },
  pressed: { opacity: 0.78, transform: [{ scale: 0.995 }] },
  icon: { width: 42, height: 42, borderRadius: 21, backgroundColor: "#EAF8EF", alignItems: "center", justifyContent: "center" },
  selectedIcon: { backgroundColor: BRAND_GREEN },
  cityText: { flex: 1, color: "#102016", fontSize: 16, lineHeight: 22, fontWeight: "900" },
  selectedText: { color: "#02983B" },
});
