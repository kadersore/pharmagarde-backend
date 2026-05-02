import MaterialIcons from "@expo/vector-icons/MaterialIcons";
import * as Haptics from "expo-haptics";
import * as WebBrowser from "expo-web-browser";
import { useEffect, useMemo, useRef, useState } from "react";
import {
  Animated,
  FlatList,
  Linking,
  PanResponder,
  Platform,
  Pressable,
  StyleSheet,
  Text,
  View,
  useWindowDimensions,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import { PharmaMap } from "@/components/pharmagarde/PharmaMap";
import { useColors } from "@/hooks/use-colors";
import { usePharmaGarde, toFavoriteFromPlace } from "@/lib/pharmagarde/app-state";
import { FavoriteItem, HealthPlace } from "@/lib/pharmagarde/types";

const BRAND_GREEN = "#03C04A";
const BRAND_BLUE = "#0B74DE";
const ERROR = "#D92D20";

type SheetState = "collapsed" | "medium" | "expanded";

type PremiumMapExperienceProps = {
  places: HealthPlace[];
  title: string;
  subtitle: string;
  emptyTitle: string;
  emptyMessage: string;
  filter?: "all" | "pharmacy" | "clinic";
};

function placeKey(place: HealthPlace) {
  return `${place.type}:${place.id}`;
}

async function lightImpact() {
  if (Platform.OS === "web") return;
  await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
}

async function successImpact() {
  if (Platform.OS === "web") return;
  await Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
}

async function openDirections(item: { latitude?: number; longitude?: number }) {
  if (item.latitude === undefined || item.longitude === undefined) return;
  const destination = `${item.latitude},${item.longitude}`;
  await WebBrowser.openBrowserAsync(`https://www.google.com/maps/dir/?api=1&destination=${encodeURIComponent(destination)}&travelmode=driving`);
}

async function callPhone(phone?: string) {
  if (!phone) return;
  await Linking.openURL(`tel:${phone.replace(/\s+/g, "")}`);
}

function statusText(place: HealthPlace) {
  if (place.isOpen === true) return place.type === "pharmacy" ? "Ouvert · garde" : "Ouvert";
  if (place.isOpen === false) return "Fermé";
  return "Statut à confirmer";
}

function PremiumPlaceCard({ place, active, onSelect }: { place: HealthPlace; active: boolean; onSelect: (place: HealthPlace) => void }) {
  const colors = useColors();
  const { favoriteKeys, toggleFavorite } = usePharmaGarde();
  const scale = useRef(new Animated.Value(1)).current;
  const favorite: FavoriteItem = toFavoriteFromPlace(place);
  const isFavorite = favoriteKeys.has(`${favorite.entityType}:${favorite.id}`);
  const accent = place.type === "pharmacy" ? BRAND_GREEN : BRAND_BLUE;
  const disabledDirection = place.latitude === undefined || place.longitude === undefined;

  const pressIn = () => Animated.timing(scale, { toValue: 0.975, duration: 90, useNativeDriver: true }).start();
  const pressOut = () => Animated.timing(scale, { toValue: 1, duration: 120, useNativeDriver: true }).start();

  const onFavorite = async () => {
    await lightImpact();
    await toggleFavorite(favorite);
  };

  return (
    <Animated.View style={[styles.cardScale, { transform: [{ scale }] }]}>
      <Pressable
        accessibilityRole="button"
        accessibilityLabel={`Sélectionner ${place.name}`}
        onPressIn={pressIn}
        onPressOut={pressOut}
        onPress={async () => {
          await lightImpact();
          onSelect(place);
        }}
        style={({ pressed }) => [
          styles.placeCard,
          {
            backgroundColor: colors.surface,
            borderColor: active ? accent : colors.border,
            shadowColor: colors.text,
          },
          active ? styles.placeCardActive : undefined,
          pressed ? styles.placeCardPressed : undefined,
        ]}
      >
        <View style={styles.cardTopRow}>
          <View style={[styles.placeVisual, { backgroundColor: `${accent}18` }]}>
            <View style={[styles.placeVisualInner, { backgroundColor: accent }]}>
              <MaterialIcons name={place.type === "pharmacy" ? "local-pharmacy" : "local-hospital"} size={21} color="#FFFFFF" />
            </View>
          </View>
          <View style={styles.placeTextBlock}>
            <Text style={[styles.placeTitle, { color: colors.text }]} numberOfLines={1}>{place.name}</Text>
            <Text style={[styles.placeSubtitle, { color: colors.muted }]} numberOfLines={1}>{place.address ?? place.city ?? "Adresse non renseignée"}</Text>
          </View>
          <Pressable
            accessibilityRole="button"
            accessibilityLabel={isFavorite ? "Retirer des favoris" : "Ajouter aux favoris"}
            onPress={onFavorite}
            style={({ pressed }) => [styles.roundAction, { backgroundColor: active ? `${accent}14` : `${colors.border}55` }, pressed ? styles.actionPressed : undefined]}
          >
            <MaterialIcons name={isFavorite ? "favorite" : "favorite-border"} size={22} color={isFavorite ? ERROR : colors.muted} />
          </Pressable>
        </View>

        <View style={styles.metaRowPremium}>
          <View style={[styles.metaPillPremium, { backgroundColor: `${accent}12` }]}>
            <MaterialIcons name="near-me" size={14} color={accent} />
            <Text style={[styles.metaPillText, { color: colors.text }]}>{place.distanceKm !== undefined ? `${place.distanceKm.toFixed(1)} km` : "Distance inconnue"}</Text>
          </View>
          <View style={[styles.metaPillPremium, { backgroundColor: place.isOpen === false ? "#FDECEC" : "#EAF8EF" }]}>
            <View style={[styles.statusDot, { backgroundColor: place.isOpen === false ? ERROR : BRAND_GREEN }]} />
            <Text style={[styles.metaPillText, { color: colors.text }]}>{statusText(place)}</Text>
          </View>
        </View>

        <View style={styles.cardActionsPremium}>
          <Pressable
            accessibilityRole="button"
            disabled={!place.phone}
            onPress={async () => {
              await lightImpact();
              await callPhone(place.phone);
            }}
            style={({ pressed }) => [styles.actionButton, { borderColor: colors.border }, !place.phone ? styles.disabledAction : undefined, pressed ? styles.actionPressed : undefined]}
          >
            <MaterialIcons name="call" size={18} color={place.phone ? accent : colors.muted} />
            <Text style={[styles.actionText, { color: place.phone ? accent : colors.muted }]}>Appel</Text>
          </Pressable>
          <Pressable
            accessibilityRole="button"
            disabled={disabledDirection}
            onPress={async () => {
              await lightImpact();
              await openDirections(place);
            }}
            style={({ pressed }) => [styles.actionButton, { borderColor: colors.border }, disabledDirection ? styles.disabledAction : undefined, pressed ? styles.actionPressed : undefined]}
          >
            <MaterialIcons name="directions" size={18} color={!disabledDirection ? accent : colors.muted} />
            <Text style={[styles.actionText, { color: !disabledDirection ? accent : colors.muted }]}>Itinéraire</Text>
          </Pressable>
        </View>
      </Pressable>
    </Animated.View>
  );
}

function SkeletonRows() {
  const colors = useColors();
  const pulse = useRef(new Animated.Value(0.45)).current;

  useEffect(() => {
    const loop = Animated.loop(
      Animated.sequence([
        Animated.timing(pulse, { toValue: 1, duration: 680, useNativeDriver: true }),
        Animated.timing(pulse, { toValue: 0.45, duration: 680, useNativeDriver: true }),
      ]),
    );
    loop.start();
    return () => loop.stop();
  }, [pulse]);

  return (
    <View style={styles.skeletonWrap}>
      {[0, 1, 2].map((item) => (
        <Animated.View key={item} style={[styles.skeletonCard, { opacity: pulse, backgroundColor: colors.surface, borderColor: colors.border }]}>
          <View style={[styles.skeletonIcon, { backgroundColor: colors.border }]} />
          <View style={styles.skeletonLines}>
            <View style={[styles.skeletonLineWide, { backgroundColor: colors.border }]} />
            <View style={[styles.skeletonLineNarrow, { backgroundColor: colors.border }]} />
          </View>
        </Animated.View>
      ))}
    </View>
  );
}

export function PremiumMapExperience({ places, title, subtitle, emptyTitle, emptyMessage, filter = "all" }: PremiumMapExperienceProps) {
  const colors = useColors();
  const { preferences, userLocation, loading, errors, refreshData } = usePharmaGarde();
  const insets = useSafeAreaInsets();
  const { height } = useWindowDimensions();
  const [selectedKey, setSelectedKey] = useState<string | undefined>(() => places[0] ? placeKey(places[0]) : undefined);
  const [sheetState, setSheetState] = useState<SheetState>("medium");
  const listRef = useRef<FlatList<HealthPlace>>(null);
  const sheetHeight = Math.max(460, height - Math.max(insets.top, 18) - 74);
  const collapsedSnap = 132;
  const mediumSnap = Math.min(365, sheetHeight - 96);
  const expandedSnap = sheetHeight;
  const translateY = useRef(new Animated.Value(sheetHeight - mediumSnap)).current;
  const dragStart = useRef(sheetHeight - mediumSnap);

  const visiblePlaces = useMemo(() => {
    if (filter === "pharmacy") return places.filter((place) => place.type === "pharmacy");
    if (filter === "clinic") return places.filter((place) => place.type === "clinic");
    return places;
  }, [filter, places]);

  useEffect(() => {
    if (!selectedKey && visiblePlaces[0]) setSelectedKey(placeKey(visiblePlaces[0]));
  }, [selectedKey, visiblePlaces]);

  const snapTo = (state: SheetState) => {
    const snapHeight = state === "collapsed" ? collapsedSnap : state === "expanded" ? expandedSnap : mediumSnap;
    setSheetState(state);
    Animated.spring(translateY, { toValue: sheetHeight - snapHeight, damping: 24, stiffness: 210, mass: 0.8, useNativeDriver: true }).start();
  };

  const panResponder = useMemo(() => PanResponder.create({
    onMoveShouldSetPanResponder: (_, gesture) => Math.abs(gesture.dy) > 8,
    onPanResponderGrant: () => {
      translateY.stopAnimation((value) => {
        dragStart.current = value;
      });
    },
    onPanResponderMove: (_, gesture) => {
      const next = Math.min(sheetHeight - collapsedSnap, Math.max(0, dragStart.current + gesture.dy));
      translateY.setValue(next);
    },
    onPanResponderRelease: (_, gesture) => {
      const projected = dragStart.current + gesture.dy + gesture.vy * 80;
      const collapsedY = sheetHeight - collapsedSnap;
      const mediumY = sheetHeight - mediumSnap;
      const expandedY = sheetHeight - expandedSnap;
      const distances = [
        { state: "collapsed" as const, value: Math.abs(projected - collapsedY) },
        { state: "medium" as const, value: Math.abs(projected - mediumY) },
        { state: "expanded" as const, value: Math.abs(projected - expandedY) },
      ].sort((a, b) => a.value - b.value);
      void lightImpact();
      snapTo(distances[0].state);
    },
  }), [collapsedSnap, expandedSnap, mediumSnap, sheetHeight, translateY]);

  const selectedPlace = visiblePlaces.find((place) => placeKey(place) === selectedKey);

  const selectPlace = async (place: HealthPlace) => {
    const key = placeKey(place);
    setSelectedKey(key);
    await successImpact();
    const index = visiblePlaces.findIndex((item) => placeKey(item) === key);
    if (index >= 0) {
      listRef.current?.scrollToIndex({ index, animated: true, viewPosition: 0.16 });
    }
    if (sheetState === "collapsed") snapTo("medium");
  };

  const errorMessage = errors.pharmacies || errors.clinics;

  return (
    <View style={[styles.root, { backgroundColor: colors.background }]}> 
      <PharmaMap
        places={visiblePlaces}
        userLocation={userLocation}
        mapType={preferences.mapType}
        selectedPlaceId={selectedKey}
        onSelectPlace={(place) => void selectPlace(place)}
        fullscreen
      />

      <View style={[styles.mapStatusCard, { top: Math.max(insets.top, 16) + 76, backgroundColor: `${colors.surface}F2`, borderColor: colors.border }]}> 
        <View style={styles.statusCopy}>
          <Text style={[styles.statusKicker, { color: BRAND_GREEN }]}>{visiblePlaces.length} point{visiblePlaces.length > 1 ? "s" : ""} disponible{visiblePlaces.length > 1 ? "s" : ""}</Text>
          <Text style={[styles.statusTitle, { color: colors.text }]} numberOfLines={1}>{selectedPlace?.name ?? title}</Text>
          <Text style={[styles.statusSubtitle, { color: colors.muted }]} numberOfLines={1}>{selectedPlace ? statusText(selectedPlace) : subtitle}</Text>
        </View>
        <Pressable accessibilityRole="button" onPress={() => void refreshData()} style={({ pressed }) => [styles.refreshButton, { backgroundColor: `${BRAND_GREEN}16` }, pressed ? styles.actionPressed : undefined]}>
          <MaterialIcons name="refresh" size={21} color={BRAND_GREEN} />
        </Pressable>
      </View>

      <Animated.View style={[styles.bottomSheet, { height: sheetHeight, transform: [{ translateY }], backgroundColor: colors.surface, shadowColor: colors.text }]}> 
        <View style={styles.sheetHandleArea} {...panResponder.panHandlers}>
          <View style={[styles.sheetHandle, { backgroundColor: colors.border }]} />
          <View style={styles.sheetHeadingRow}>
            <View>
              <Text style={[styles.sheetEyebrow, { color: BRAND_GREEN }]}>À proximité</Text>
              <Text style={[styles.sheetTitle, { color: colors.text }]}>{title}</Text>
              <Text style={[styles.sheetSubtitle, { color: colors.muted }]}>{subtitle}</Text>
            </View>
            <Pressable
              accessibilityRole="button"
              accessibilityLabel="Changer la hauteur du panneau"
              onPress={() => snapTo(sheetState === "expanded" ? "collapsed" : sheetState === "collapsed" ? "medium" : "expanded")}
              style={({ pressed }) => [styles.sheetModeButton, { borderColor: colors.border }, pressed ? styles.actionPressed : undefined]}
            >
              <MaterialIcons name={sheetState === "expanded" ? "keyboard-arrow-down" : "keyboard-arrow-up"} size={24} color={BRAND_GREEN} />
            </Pressable>
          </View>
        </View>

        {errorMessage ? (
          <View style={[styles.inlineNotice, { borderColor: "#FDA29B", backgroundColor: "#FFF1F0" }]}> 
            <MaterialIcons name="info-outline" size={18} color={ERROR} />
            <Text style={styles.inlineNoticeText}>{errorMessage}</Text>
          </View>
        ) : null}

        {loading ? <SkeletonRows /> : (
          <FlatList<HealthPlace>
            ref={listRef}
            data={visiblePlaces}
            keyExtractor={placeKey}
            renderItem={({ item }) => <PremiumPlaceCard place={item} active={placeKey(item) === selectedKey} onSelect={(place) => void selectPlace(place)} />}
            contentContainerStyle={[styles.listContent, { paddingBottom: Math.max(insets.bottom, 12) + 104 }]}
            showsVerticalScrollIndicator={false}
            onScrollToIndexFailed={({ index }) => {
              setTimeout(() => listRef.current?.scrollToIndex({ index, animated: true, viewPosition: 0.16 }), 250);
            }}
            ListEmptyComponent={
              <View style={styles.emptyPremium}>
                <View style={[styles.emptyPremiumIcon, { backgroundColor: `${BRAND_GREEN}15` }]}>
                  <MaterialIcons name="map" size={30} color={BRAND_GREEN} />
                </View>
                <Text style={[styles.emptyPremiumTitle, { color: colors.text }]}>{emptyTitle}</Text>
                <Text style={[styles.emptyPremiumMessage, { color: colors.muted }]}>{emptyMessage}</Text>
                <Pressable accessibilityRole="button" onPress={() => void refreshData()} style={({ pressed }) => [styles.emptyPremiumButton, pressed ? styles.actionPressed : undefined]}>
                  <Text style={styles.emptyPremiumButtonText}>Réessayer</Text>
                </Pressable>
              </View>
            }
          />
        )}
      </Animated.View>
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, overflow: "hidden" },
  mapStatusCard: {
    position: "absolute",
    left: 18,
    right: 18,
    minHeight: 76,
    borderRadius: 18,
    borderWidth: 1,
    paddingHorizontal: 14,
    paddingVertical: 12,
    flexDirection: "row",
    alignItems: "center",
    shadowOpacity: 0.1,
    shadowRadius: 16,
    shadowOffset: { width: 0, height: 7 },
    elevation: 8,
  },
  statusCopy: { flex: 1, paddingRight: 10 },
  statusKicker: { fontSize: 11, lineHeight: 15, fontWeight: "900", textTransform: "uppercase", letterSpacing: 0.8 },
  statusTitle: { marginTop: 3, fontSize: 16, lineHeight: 21, fontWeight: "900" },
  statusSubtitle: { marginTop: 1, fontSize: 12, lineHeight: 17, fontWeight: "700" },
  refreshButton: { width: 42, height: 42, borderRadius: 14, alignItems: "center", justifyContent: "center" },
  bottomSheet: {
    position: "absolute",
    left: 0,
    right: 0,
    bottom: 0,
    borderTopLeftRadius: 26,
    borderTopRightRadius: 26,
    shadowOpacity: 0.18,
    shadowRadius: 22,
    shadowOffset: { width: 0, height: -7 },
    elevation: 18,
  },
  sheetHandleArea: { paddingTop: 10, paddingHorizontal: 18, paddingBottom: 8 },
  sheetHandle: { alignSelf: "center", width: 44, height: 5, borderRadius: 999, marginBottom: 12 },
  sheetHeadingRow: { flexDirection: "row", alignItems: "center", justifyContent: "space-between", gap: 12 },
  sheetEyebrow: { fontSize: 11, lineHeight: 14, fontWeight: "900", textTransform: "uppercase", letterSpacing: 0.7 },
  sheetTitle: { fontSize: 20, lineHeight: 25, fontWeight: "900" },
  sheetSubtitle: { marginTop: 2, fontSize: 13, lineHeight: 18, fontWeight: "700" },
  sheetModeButton: { width: 42, height: 42, borderRadius: 14, borderWidth: 1, alignItems: "center", justifyContent: "center" },
  listContent: { paddingTop: 4 },
  cardScale: { marginHorizontal: 16, marginVertical: 7 },
  placeCard: {
    borderRadius: 14,
    borderWidth: 1,
    padding: 14,
    shadowOpacity: 0.08,
    shadowRadius: 12,
    shadowOffset: { width: 0, height: 5 },
    elevation: 3,
  },
  placeCardActive: { borderWidth: 1.5, shadowOpacity: 0.13, transform: [{ translateY: -1 }] },
  placeCardPressed: { opacity: 0.96 },
  cardTopRow: { flexDirection: "row", alignItems: "center", gap: 12 },
  placeVisual: { width: 48, height: 48, borderRadius: 14, alignItems: "center", justifyContent: "center" },
  placeVisualInner: { width: 36, height: 36, borderRadius: 11, alignItems: "center", justifyContent: "center" },
  placeTextBlock: { flex: 1 },
  placeTitle: { fontSize: 16, lineHeight: 21, fontWeight: "900" },
  placeSubtitle: { marginTop: 2, fontSize: 12, lineHeight: 17, fontWeight: "600" },
  roundAction: { width: 40, height: 40, borderRadius: 13, alignItems: "center", justifyContent: "center" },
  metaRowPremium: { flexDirection: "row", flexWrap: "wrap", gap: 8, marginTop: 13 },
  metaPillPremium: { minHeight: 30, borderRadius: 10, paddingHorizontal: 10, flexDirection: "row", alignItems: "center", gap: 6 },
  metaPillText: { fontSize: 12, lineHeight: 16, fontWeight: "800" },
  statusDot: { width: 7, height: 7, borderRadius: 999 },
  cardActionsPremium: { flexDirection: "row", gap: 10, marginTop: 13 },
  actionButton: { flex: 1, minHeight: 42, borderRadius: 12, borderWidth: 1, flexDirection: "row", alignItems: "center", justifyContent: "center", gap: 7 },
  actionText: { fontSize: 13, lineHeight: 17, fontWeight: "900" },
  disabledAction: { opacity: 0.48 },
  actionPressed: { opacity: 0.78, transform: [{ scale: 0.97 }] },
  inlineNotice: { marginHorizontal: 16, marginTop: 6, marginBottom: 6, borderRadius: 12, borderWidth: 1, padding: 11, flexDirection: "row", gap: 8 },
  inlineNoticeText: { flex: 1, color: ERROR, fontSize: 12, lineHeight: 17, fontWeight: "700" },
  skeletonWrap: { paddingTop: 8 },
  skeletonCard: { marginHorizontal: 16, marginVertical: 7, borderRadius: 14, borderWidth: 1, padding: 14, flexDirection: "row", gap: 12 },
  skeletonIcon: { width: 48, height: 48, borderRadius: 14 },
  skeletonLines: { flex: 1, justifyContent: "center", gap: 10 },
  skeletonLineWide: { height: 13, width: "72%", borderRadius: 999 },
  skeletonLineNarrow: { height: 11, width: "48%", borderRadius: 999 },
  emptyPremium: { alignItems: "center", paddingHorizontal: 28, paddingTop: 30 },
  emptyPremiumIcon: { width: 62, height: 62, borderRadius: 18, alignItems: "center", justifyContent: "center", marginBottom: 14 },
  emptyPremiumTitle: { fontSize: 18, lineHeight: 24, fontWeight: "900", textAlign: "center" },
  emptyPremiumMessage: { marginTop: 8, fontSize: 13, lineHeight: 20, textAlign: "center" },
  emptyPremiumButton: { marginTop: 16, minHeight: 44, paddingHorizontal: 20, borderRadius: 14, backgroundColor: BRAND_GREEN, alignItems: "center", justifyContent: "center" },
  emptyPremiumButtonText: { color: "#FFFFFF", fontSize: 14, fontWeight: "900" },
});
