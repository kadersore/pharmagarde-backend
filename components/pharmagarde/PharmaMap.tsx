import { StyleSheet, Text, View } from "react-native";

import { Coordinates, HealthPlace } from "@/lib/pharmagarde/types";

const GREEN = "#03C04A";
const BLUE = "#0B74DE";

function positionFor(place: HealthPlace, index: number, total: number) {
  if (place.latitude === undefined || place.longitude === undefined) {
    const angle = (index / Math.max(total, 1)) * Math.PI * 2;
    return { left: 50 + Math.cos(angle) * 32, top: 50 + Math.sin(angle) * 28 };
  }
  const lat = Math.abs(place.latitude % 1);
  const lng = Math.abs(place.longitude % 1);
  return { left: 14 + lng * 72, top: 14 + (1 - lat) * 72 };
}

export function PharmaMap({ places, userLocation }: { places: HealthPlace[]; userLocation?: Coordinates }) {
  return (
    <View style={styles.wrapper}>
      <View style={styles.gridLineHorizontal} />
      <View style={styles.gridLineVertical} />
      {userLocation ? (
        <View style={styles.userDot}>
          <Text style={styles.userDotText}>Vous</Text>
        </View>
      ) : null}
      {places.map((place, index) => {
        const pos = positionFor(place, index, places.length);
        return (
          <View key={`${place.type}-${place.id}`} style={[styles.pin, { left: `${pos.left}%`, top: `${pos.top}%`, backgroundColor: place.type === "pharmacy" ? GREEN : BLUE }]}>
            <Text style={styles.pinText}>{place.type === "pharmacy" ? "P" : "C"}</Text>
          </View>
        );
      })}

    </View>
  );
}

const styles = StyleSheet.create({
  wrapper: { height: 360, margin: 16, borderRadius: 28, overflow: "hidden", backgroundColor: "#EAF8EF", borderWidth: 1, borderColor: "#CBE7D3" },
  gridLineHorizontal: { position: "absolute", left: 0, right: 0, top: "50%", height: 1, backgroundColor: "rgba(16,32,22,0.12)" },
  gridLineVertical: { position: "absolute", top: 0, bottom: 0, left: "50%", width: 1, backgroundColor: "rgba(16,32,22,0.12)" },
  pin: { position: "absolute", width: 34, height: 34, marginLeft: -17, marginTop: -17, borderRadius: 17, alignItems: "center", justifyContent: "center", borderWidth: 3, borderColor: "#FFFFFF", shadowColor: "#102016", shadowOpacity: 0.18, shadowRadius: 10, shadowOffset: { width: 0, height: 4 } },
  pinText: { color: "#FFFFFF", fontWeight: "900", fontSize: 13 },
  userDot: { position: "absolute", left: "48%", top: "47%", paddingHorizontal: 10, paddingVertical: 6, borderRadius: 14, backgroundColor: "#102016" },
  userDotText: { color: "#FFFFFF", fontWeight: "800", fontSize: 12 },

});
