import MapView, { Marker, PROVIDER_GOOGLE, type Region } from "react-native-maps";
import { useEffect, useMemo, useRef } from "react";
import { Pressable, StyleSheet, Text, View } from "react-native";

import { Coordinates, HealthPlace, MapPreference } from "@/lib/pharmagarde/types";

const GREEN = "#03C04A";
const BLUE = "#0B74DE";
const DEFAULT_REGION = {
  latitude: 12.3714,
  longitude: -1.5197,
  latitudeDelta: 0.12,
  longitudeDelta: 0.12,
};

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

function regionFor(places: HealthPlace[], userLocation?: Coordinates): Region {
  const firstPlace = places.find((place) => place.latitude !== undefined && place.longitude !== undefined);
  return userLocation
    ? { latitude: userLocation.latitude, longitude: userLocation.longitude, latitudeDelta: 0.08, longitudeDelta: 0.08 }
    : firstPlace?.latitude !== undefined && firstPlace.longitude !== undefined
      ? { latitude: firstPlace.latitude, longitude: firstPlace.longitude, latitudeDelta: 0.08, longitudeDelta: 0.08 }
      : DEFAULT_REGION;
}

export function PharmaMap({ places, userLocation, mapType = "Standard", selectedPlaceId, onSelectPlace, fullscreen = false }: PharmaMapProps) {
  const mapRef = useRef<MapView>(null);
  const initialRegion = useMemo(() => regionFor(places, userLocation), [places, userLocation]);
  const selectedPlace = places.find((place) => keyFor(place) === selectedPlaceId);

  useEffect(() => {
    if (selectedPlace?.latitude === undefined || selectedPlace.longitude === undefined) return;
    mapRef.current?.animateToRegion({ latitude: selectedPlace.latitude, longitude: selectedPlace.longitude, latitudeDelta: 0.035, longitudeDelta: 0.035 }, 260);
  }, [selectedPlace]);

  return (
    <View style={[styles.wrapper, fullscreen ? styles.fullscreenWrapper : undefined]}>
      <MapView
        ref={mapRef}
        provider={PROVIDER_GOOGLE}
        style={styles.map}
        initialRegion={initialRegion}
        mapType={mapType === "Satellite" ? "satellite" : "standard"}
        showsUserLocation={!!userLocation}
        showsMyLocationButton={false}
        toolbarEnabled={false}
      >
        {places.map((place) => {
          if (place.latitude === undefined || place.longitude === undefined) return null;
          const active = keyFor(place) === selectedPlaceId;
          const accent = place.type === "pharmacy" ? GREEN : BLUE;
          return (
            <Marker
              key={keyFor(place)}
              coordinate={{ latitude: place.latitude, longitude: place.longitude }}
              title={place.name}
              description={place.address ?? place.city ?? undefined}
              onPress={() => onSelectPlace?.(place)}
              tracksViewChanges={active}
            >
              <View style={[styles.marker, active ? styles.markerActive : undefined, { borderColor: active ? accent : "#FFFFFF", backgroundColor: accent }]}> 
                <Text style={styles.markerText}>{place.type === "pharmacy" ? "P" : "C"}</Text>
              </View>
            </Marker>
          );
        })}
      </MapView>
      {places.length === 0 ? (
        <Pressable style={[styles.overlay, fullscreen ? styles.fullscreenOverlay : undefined]}>
          <Text style={styles.overlayTitle}>Aucun point à afficher</Text>
          <Text style={styles.overlayText}>Configurez l’API puis rechargez les données.</Text>
        </Pressable>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  wrapper: { height: 380, margin: 16, borderRadius: 12, overflow: "hidden", borderWidth: 1, borderColor: "#CBE7D3", shadowColor: "#092A13", shadowOpacity: 0.05, shadowRadius: 8, shadowOffset: { width: 0, height: 3 }, elevation: 2 },
  fullscreenWrapper: { flex: 1, height: undefined, margin: 0, borderRadius: 0, borderWidth: 0, shadowOpacity: 0, elevation: 0 },
  map: { flex: 1 },
  marker: { width: 34, height: 34, borderRadius: 17, alignItems: "center", justifyContent: "center", borderWidth: 3, shadowColor: "#102016", shadowOpacity: 0.2, shadowRadius: 8, shadowOffset: { width: 0, height: 4 }, elevation: 6 },
  markerActive: { width: 44, height: 44, borderRadius: 22, borderWidth: 5, transform: [{ scale: 1.04 }] },
  markerText: { color: "#FFFFFF", fontSize: 13, lineHeight: 17, fontWeight: "900" },
  overlay: { position: "absolute", left: 20, right: 20, bottom: 20, borderRadius: 10, padding: 14, backgroundColor: "rgba(255,255,255,0.94)" },
  fullscreenOverlay: { bottom: 172, borderRadius: 16 },
  overlayTitle: { color: "#102016", fontWeight: "900", fontSize: 15, lineHeight: 20 },
  overlayText: { color: "#667085", marginTop: 4, fontSize: 13, lineHeight: 18 },
});
