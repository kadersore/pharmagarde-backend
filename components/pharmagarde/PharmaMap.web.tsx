import { useEffect, useMemo, useRef, useState } from "react";
import { StyleSheet, Text, View } from "react-native";

import { Coordinates, HealthPlace, MapPreference } from "@/lib/pharmagarde/types";

const GREEN = "#03C04A";
const BLUE = "#0B74DE";
const DEFAULT_CENTER = { latitude: 12.3714, longitude: -1.5197 };
const GOOGLE_MAPS_API_KEY = process.env.EXPO_PUBLIC_GOOGLE_MAPS_API_KEY ?? "";

type PharmaMapProps = {
  places: HealthPlace[];
  userLocation?: Coordinates;
  mapType?: MapPreference;
  selectedPlaceId?: string;
  onSelectPlace?: (place: HealthPlace) => void;
  fullscreen?: boolean;
};

declare global {
  interface Window {
    google?: any;
    __pharmaGoogleMapsPromise?: Promise<void>;
  }
}

function keyFor(place: HealthPlace) {
  return `${place.type}:${place.id}`;
}

function loadGoogleMaps() {
  if (typeof window === "undefined") return Promise.reject(new Error("Google Maps Web requiert un navigateur."));
  if (window.google?.maps) return Promise.resolve();
  if (!GOOGLE_MAPS_API_KEY) return Promise.reject(new Error("Clé Google Maps non configurée."));
  if (window.__pharmaGoogleMapsPromise) return window.__pharmaGoogleMapsPromise;

  window.__pharmaGoogleMapsPromise = new Promise<void>((resolve, reject) => {
    const existingScript = document.querySelector<HTMLScriptElement>('script[data-pharmagarde-google-maps="true"]');
    if (existingScript) {
      existingScript.addEventListener("load", () => resolve(), { once: true });
      existingScript.addEventListener("error", () => reject(new Error("Chargement Google Maps impossible.")), { once: true });
      return;
    }

    const script = document.createElement("script");
    script.src = `https://maps.googleapis.com/maps/api/js?key=${encodeURIComponent(GOOGLE_MAPS_API_KEY)}&v=weekly&loading=async`;
    script.async = true;
    script.defer = true;
    script.dataset.pharmagardeGoogleMaps = "true";
    script.addEventListener("load", () => resolve(), { once: true });
    script.addEventListener("error", () => reject(new Error("Chargement Google Maps impossible.")), { once: true });
    document.head.appendChild(script);
  });

  return window.__pharmaGoogleMapsPromise;
}

function getCenter(places: HealthPlace[], userLocation?: Coordinates) {
  if (userLocation) return { lat: userLocation.latitude, lng: userLocation.longitude };
  const firstPlace = places.find((place) => place.latitude !== undefined && place.longitude !== undefined);
  if (firstPlace?.latitude !== undefined && firstPlace.longitude !== undefined) return { lat: firstPlace.latitude, lng: firstPlace.longitude };
  return { lat: DEFAULT_CENTER.latitude, lng: DEFAULT_CENTER.longitude };
}

function markerLabel(place: HealthPlace) {
  return place.type === "pharmacy" ? "P" : "C";
}

function markerIcon(place: HealthPlace, active: boolean) {
  const accent = place.type === "pharmacy" ? GREEN : BLUE;
  return {
    path: window.google.maps.SymbolPath.CIRCLE,
    fillColor: accent,
    fillOpacity: 1,
    strokeColor: active ? accent : "#FFFFFF",
    strokeWeight: active ? 6 : 3,
    scale: active ? 18 : 14,
  };
}

export function PharmaMap({ places, userLocation, mapType = "Standard", selectedPlaceId, onSelectPlace, fullscreen = false }: PharmaMapProps) {
  const mapContainerRef = useRef<any>(null);
  const mapRef = useRef<any>(null);
  const markersRef = useRef<Map<string, any>>(new Map());
  const [loadError, setLoadError] = useState<string | null>(null);
  const center = useMemo(() => getCenter(places, userLocation), [places, userLocation]);

  useEffect(() => {
    let cancelled = false;

    loadGoogleMaps()
      .then(() => {
        if (cancelled || !mapContainerRef.current || !window.google?.maps) return;

        const map = new window.google.maps.Map(mapContainerRef.current, {
          center,
          zoom: 13,
          mapTypeControl: false,
          streetViewControl: false,
          fullscreenControl: false,
          clickableIcons: true,
          gestureHandling: "greedy",
          mapTypeId: mapType === "Satellite" ? window.google.maps.MapTypeId.SATELLITE : window.google.maps.MapTypeId.ROADMAP,
          styles: [
            { featureType: "poi.medical", stylers: [{ visibility: "on" }] },
            { featureType: "poi.business", stylers: [{ saturation: -25 }] },
            { featureType: "road", elementType: "geometry", stylers: [{ color: "#FFFFFF" }] },
            { featureType: "water", stylers: [{ color: "#CDEFFF" }] },
            { featureType: "landscape", stylers: [{ color: "#EAF5ED" }] },
          ],
        });
        mapRef.current = map;
        markersRef.current.forEach((marker) => marker.setMap(null));
        markersRef.current.clear();

        if (userLocation) {
          new window.google.maps.Marker({
            position: { lat: userLocation.latitude, lng: userLocation.longitude },
            map,
            title: "Votre position",
            label: { text: "Vous", color: "#FFFFFF", fontWeight: "800" },
            icon: {
              path: window.google.maps.SymbolPath.CIRCLE,
              fillColor: "#102016",
              fillOpacity: 1,
              strokeColor: "#FFFFFF",
              strokeWeight: 3,
              scale: 10,
            },
          });
        }

        places.forEach((place) => {
          if (place.latitude === undefined || place.longitude === undefined) return;
          const active = keyFor(place) === selectedPlaceId;
          const marker = new window.google.maps.Marker({
            position: { lat: place.latitude, lng: place.longitude },
            map,
            title: place.name,
            label: { text: markerLabel(place), color: "#FFFFFF", fontWeight: "900" },
            icon: markerIcon(place, active),
            zIndex: active ? 20 : 10,
          });

          marker.addListener("click", () => onSelectPlace?.(place));
          markersRef.current.set(keyFor(place), marker);
        });
      })
      .catch((error: Error) => {
        if (!cancelled) setLoadError(error.message);
      });

    return () => {
      cancelled = true;
    };
  }, [center, places, userLocation, mapType, selectedPlaceId, onSelectPlace]);

  useEffect(() => {
    const selected = places.find((place) => keyFor(place) === selectedPlaceId);
    if (!selected || selected.latitude === undefined || selected.longitude === undefined || !mapRef.current) return;
    mapRef.current.panTo({ lat: selected.latitude, lng: selected.longitude });
    mapRef.current.setZoom(Math.max(mapRef.current.getZoom?.() ?? 13, 15));
  }, [places, selectedPlaceId]);

  return (
    <View style={[styles.wrapper, fullscreen ? styles.fullscreenWrapper : undefined]}>
      <div ref={mapContainerRef} style={styles.webMap as React.CSSProperties} />
      {loadError ? (
        <View style={[styles.overlay, fullscreen ? styles.fullscreenOverlay : undefined]}>
          <Text style={styles.overlayTitle}>Carte interactive en attente</Text>
          <Text style={styles.overlayText}>{loadError}</Text>
          <Text style={styles.overlayHelp}>La liste et les markers simplifiés restent disponibles. Renseignez EXPO_PUBLIC_GOOGLE_MAPS_API_KEY pour activer Google Maps Web.</Text>
        </View>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  wrapper: { height: 380, margin: 16, borderRadius: 12, overflow: "hidden", backgroundColor: "#EAF8EF", borderWidth: 1, borderColor: "#CBE7D3", shadowColor: "#092A13", shadowOpacity: 0.05, shadowRadius: 8, shadowOffset: { width: 0, height: 3 }, elevation: 2 },
  fullscreenWrapper: { flex: 1, height: undefined, margin: 0, borderRadius: 0, borderWidth: 0, shadowOpacity: 0, elevation: 0 },
  webMap: { width: "100%", height: "100%" },
  overlay: { position: "absolute", left: 18, right: 18, top: 18, borderRadius: 10, padding: 14, backgroundColor: "rgba(255,255,255,0.96)", borderWidth: 1, borderColor: "#D8EBDD" },
  fullscreenOverlay: { top: 98, borderRadius: 16 },
  overlayTitle: { color: "#102016", fontWeight: "900", fontSize: 15, lineHeight: 20 },
  overlayText: { color: "#B42318", marginTop: 5, fontWeight: "800", fontSize: 13, lineHeight: 18 },
  overlayHelp: { color: "#667085", marginTop: 6, fontSize: 12, lineHeight: 17 },
});
