import { Pressable, StyleSheet, Text, View } from "react-native";

import { Coordinates, HealthPlace, MapPreference } from "@/lib/pharmagarde/types";

const GREEN = "#03C04A";
const BLUE = "#0B74DE";

type PharmaMapProps = {
  places: HealthPlace[];
  userLocation?: Coordinates;
  mapType?: MapPreference;
  selectedPlaceId?: string;
  onSelectPlace?: (place: HealthPlace) => void;
  fullscreen?: boolean;
};

function keyFor(place: HealthPlace) {
  return `${place.type}:${place.id}`;
}

function positionFor(place: HealthPlace, index: number, total: number) {
  if (place.latitude === undefined || place.longitude === undefined) {
    const angle = (index / Math.max(total, 1)) * Math.PI * 2;
    return { left: 50 + Math.cos(angle) * 32, top: 50 + Math.sin(angle) * 28 };
  }
  const lat = Math.abs(place.latitude % 1);
  const lng = Math.abs(place.longitude % 1);
  return { left: 14 + lng * 72, top: 14 + (1 - lat) * 72 };
}

export function PharmaMap({ places, userLocation, mapType = "Standard", selectedPlaceId, onSelectPlace, fullscreen = false }: PharmaMapProps) {
  return (
    <View style={[styles.wrapper, fullscreen ? styles.fullscreenWrapper : undefined]}>
      {mapType === "Satellite" ? <View style={styles.satelliteOverlay} /> : null}
      <View style={styles.mapTint} />
      <View style={styles.gridLineHorizontal} />
      <View style={styles.gridLineVertical} />
      {userLocation ? (
        <View style={styles.userDot}>
          <Text style={styles.userDotText}>Vous</Text>
        </View>
      ) : null}
      {places.map((place, index) => {
        const pos = positionFor(place, index, places.length);
        const active = keyFor(place) === selectedPlaceId;
        const accent = place.type === "pharmacy" ? GREEN : BLUE;
        return (
          <Pressable
            key={keyFor(place)}
            accessibilityRole="button"
            accessibilityLabel={`Sélectionner ${place.name}`}
            onPress={() => onSelectPlace?.(place)}
            style={[styles.pin, active ? styles.pinActive : undefined, { left: `${pos.left}%`, top: `${pos.top}%`, backgroundColor: accent, borderColor: active ? accent : "#FFFFFF" }]}
          >
            <Text style={styles.pinText}>{place.type === "pharmacy" ? "P" : "C"}</Text>
          </Pressable>
        );
      })}
    </View>
  );
}

const styles = StyleSheet.create({
  wrapper: { height: 360, margin: 16, borderRadius: 12, overflow: "hidden", backgroundColor: "#DFF5E8", borderWidth: 1, borderColor: "#CBE7D3", shadowColor: "#092A13", shadowOpacity: 0.05, shadowRadius: 8, shadowOffset: { width: 0, height: 3 }, elevation: 2 },
  fullscreenWrapper: { flex: 1, height: undefined, margin: 0, borderRadius: 0, borderWidth: 0, shadowOpacity: 0, elevation: 0 },
  mapTint: { ...StyleSheet.absoluteFillObject, backgroundColor: "rgba(246, 251, 248, 0.38)" },
  satelliteOverlay: { ...StyleSheet.absoluteFillObject, backgroundColor: "rgba(17, 64, 38, 0.18)" },
  gridLineHorizontal: { position: "absolute", left: 0, right: 0, top: "50%", height: 1, backgroundColor: "rgba(16,32,22,0.12)" },
  gridLineVertical: { position: "absolute", top: 0, bottom: 0, left: "50%", width: 1, backgroundColor: "rgba(16,32,22,0.12)" },
  pin: { position: "absolute", width: 36, height: 36, marginLeft: -18, marginTop: -18, borderRadius: 18, alignItems: "center", justifyContent: "center", borderWidth: 3, shadowColor: "#102016", shadowOpacity: 0.18, shadowRadius: 10, shadowOffset: { width: 0, height: 4 }, elevation: 5 },
  pinActive: { width: 46, height: 46, marginLeft: -23, marginTop: -23, borderRadius: 23, borderWidth: 5, zIndex: 4, transform: [{ scale: 1.04 }] },
  pinText: { color: "#FFFFFF", fontWeight: "900", fontSize: 13 },
  userDot: { position: "absolute", left: "48%", top: "47%", paddingHorizontal: 10, paddingVertical: 6, borderRadius: 14, backgroundColor: "#102016" },
  userDotText: { color: "#FFFFFF", fontWeight: "800", fontSize: 12 },
});
