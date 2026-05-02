import MapView, { Marker, PROVIDER_GOOGLE } from "react-native-maps";
import { StyleSheet, Text, View } from "react-native";

import { Coordinates, HealthPlace, MapPreference } from "@/lib/pharmagarde/types";

const DEFAULT_REGION = {
  latitude: 12.3714,
  longitude: -1.5197,
  latitudeDelta: 0.12,
  longitudeDelta: 0.12,
};

export function PharmaMap({ places, userLocation, mapType = "Standard" }: { places: HealthPlace[]; userLocation?: Coordinates; mapType?: MapPreference }) {
  const firstPlace = places.find((place) => place.latitude !== undefined && place.longitude !== undefined);
  const region = userLocation
    ? { latitude: userLocation.latitude, longitude: userLocation.longitude, latitudeDelta: 0.08, longitudeDelta: 0.08 }
    : firstPlace?.latitude !== undefined && firstPlace.longitude !== undefined
      ? { latitude: firstPlace.latitude, longitude: firstPlace.longitude, latitudeDelta: 0.08, longitudeDelta: 0.08 }
      : DEFAULT_REGION;

  return (
    <View style={styles.wrapper}>
      <MapView provider={PROVIDER_GOOGLE} style={styles.map} initialRegion={region} mapType={mapType === "Satellite" ? "satellite" : "standard"} showsUserLocation={!!userLocation} showsMyLocationButton>
        {places.map((place) => {
          if (place.latitude === undefined || place.longitude === undefined) return null;
          return (
            <Marker
              key={`${place.type}-${place.id}`}
              coordinate={{ latitude: place.latitude, longitude: place.longitude }}
              title={place.name}
              description={place.address ?? place.city ?? undefined}
              pinColor={place.type === "pharmacy" ? "#03C04A" : "#0B74DE"}
            />
          );
        })}
      </MapView>
      {places.length === 0 ? (
        <View style={styles.overlay}>
          <Text style={styles.overlayTitle}>Aucun point à afficher</Text>
          <Text style={styles.overlayText}>Configurez l’API puis rechargez les données.</Text>
        </View>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  wrapper: { height: 380, margin: 16, borderRadius: 28, overflow: "hidden", borderWidth: 1, borderColor: "#CBE7D3" },
  map: { flex: 1 },
  overlay: { position: "absolute", left: 20, right: 20, bottom: 20, borderRadius: 18, padding: 14, backgroundColor: "rgba(255,255,255,0.94)" },
  overlayTitle: { color: "#102016", fontWeight: "900", fontSize: 15, lineHeight: 20 },
  overlayText: { color: "#667085", marginTop: 4, fontSize: 13, lineHeight: 18 },
});
