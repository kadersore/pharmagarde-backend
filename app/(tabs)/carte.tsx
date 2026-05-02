import { StyleSheet, Text, View } from "react-native";

import { AppChrome } from "@/components/pharmagarde/app-ui";
import { PharmaMap } from "@/components/pharmagarde/PharmaMap";
import { usePharmaGarde } from "@/lib/pharmagarde/app-state";

export default function MapScreen() {
  const { pharmacies, clinics, userLocation } = usePharmaGarde();
  const places = [...pharmacies, ...clinics];

  return (
    <AppChrome subtitle="Carte">
      <View style={styles.content}>
        <Text style={styles.pageTitle}>Carte des pharmacies et cliniques</Text>
        <PharmaMap places={places} userLocation={userLocation} />
      </View>
    </AppChrome>
  );
}

const styles = StyleSheet.create({
  content: { flex: 1, paddingTop: 18 },
  pageTitle: { color: "#102016", fontSize: 24, lineHeight: 31, fontWeight: "900", marginHorizontal: 16, marginBottom: 12 },
});
