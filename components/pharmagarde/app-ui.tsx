import MaterialIcons from "@expo/vector-icons/MaterialIcons";
import * as WebBrowser from "expo-web-browser";
import { PropsWithChildren, useState } from "react";
import { ActivityIndicator, Image, Linking, StyleSheet, Text, TextInput, TouchableOpacity, View } from "react-native";
import { useRouter } from "expo-router";

import { ScreenContainer } from "@/components/screen-container";
import { usePharmaGarde } from "@/lib/pharmagarde/app-state";
import { CombinedSearchItem, FavoriteItem, HealthPlace, Medicine, favoriteKey } from "@/lib/pharmagarde/types";

const BRAND_GREEN = "#03C04A";
const BRAND_BLUE = "#0B74DE";
const BACKGROUND = "#F6FBF8";
const FOREGROUND = "#102016";
const MUTED = "#667085";
const BORDER = "#D6EBDD";
const SURFACE = "#FFFFFF";
const ERROR = "#D92D20";

function entityLabel(type: FavoriteItem["entityType"]) {
  if (type === "pharmacy") return "Pharmacie";
  if (type === "clinic") return "Clinique";
  return "Médicament";
}

async function openDirections(item: { latitude?: number; longitude?: number; title: string }) {
  if (item.latitude === undefined || item.longitude === undefined) return;
  const destination = `${item.latitude},${item.longitude}`;
  await WebBrowser.openBrowserAsync(`https://www.google.com/maps/dir/?api=1&destination=${encodeURIComponent(destination)}&travelmode=driving`);
}

async function callPhone(phone?: string) {
  if (!phone) return;
  await Linking.openURL(`tel:${phone.replace(/\s+/g, "")}`);
}

export function AppChrome({ children, subtitle }: PropsWithChildren<{ subtitle?: string }>) {
  const router = useRouter();
  const { loading } = usePharmaGarde();
  return (
    <ScreenContainer className="" containerClassName="">
      <View style={styles.page}>
        <View style={styles.topBar}>
          <TouchableOpacity accessibilityRole="button" accessibilityLabel="Ouvrir le menu" style={styles.iconButton} onPress={() => router.push("/pharmagarde/menu" as never)}>
            <MaterialIcons name="menu" size={26} color="#FFFFFF" />
          </TouchableOpacity>
          <View style={styles.titleBlock}>
            <Text style={styles.title}>PharmaGarde BF</Text>
            <Text style={styles.subtitle}>{subtitle ?? "Santé de proximité"}</Text>
          </View>
          <View style={styles.actions}>
            {loading ? <ActivityIndicator color="#FFFFFF" /> : null}
            <TouchableOpacity accessibilityRole="button" accessibilityLabel="Ouvrir les favoris" style={styles.iconButton} onPress={() => router.push("/pharmagarde/favoris" as never)}>
              <MaterialIcons name="favorite-border" size={24} color="#FFFFFF" />
            </TouchableOpacity>
            <TouchableOpacity accessibilityRole="button" accessibilityLabel="Ouvrir la recherche" style={styles.iconButton} onPress={() => router.push("/pharmagarde/search" as never)}>
              <MaterialIcons name="search" size={25} color="#FFFFFF" />
            </TouchableOpacity>
          </View>
        </View>
        {children}
      </View>
    </ScreenContainer>
  );
}

export function EmptyState({ title, message, actionLabel, onAction }: { title: string; message: string; actionLabel?: string; onAction?: () => void }) {
  return (
    <View style={styles.emptyState}>
      <View style={styles.emptyIcon}>
        <MaterialIcons name="local-pharmacy" size={30} color={BRAND_GREEN} />
      </View>
      <Text style={styles.emptyTitle}>{title}</Text>
      <Text style={styles.emptyMessage}>{message}</Text>
      {actionLabel && onAction ? (
        <TouchableOpacity accessibilityRole="button" style={styles.primaryButton} onPress={onAction}>
          <Text style={styles.primaryButtonText}>{actionLabel}</Text>
        </TouchableOpacity>
      ) : null}
    </View>
  );
}

export function StatusNotice({ message, tone = "info" }: { message?: string; tone?: "info" | "error" | "success" }) {
  if (!message) return null;
  return (
    <View style={[styles.notice, tone === "error" ? styles.noticeError : tone === "success" ? styles.noticeSuccess : styles.noticeInfo]}>
      <Text style={[styles.noticeText, tone === "error" ? styles.noticeTextError : undefined]}>{message}</Text>
    </View>
  );
}

export function SearchField({ value, onChangeText, placeholder = "Rechercher" }: { value: string; onChangeText: (value: string) => void; placeholder?: string }) {
  return (
    <View style={styles.searchBox}>
      <MaterialIcons name="search" size={21} color={MUTED} />
      <TextInput
        value={value}
        onChangeText={onChangeText}
        placeholder={placeholder}
        placeholderTextColor={MUTED}
        style={styles.searchInput}
        returnKeyType="search"
      />
    </View>
  );
}

export function PlaceCard({ place }: { place: HealthPlace }) {
  const { favoriteKeys, toggleFavorite } = usePharmaGarde();
  const favorite: FavoriteItem = {
    id: place.id,
    entityType: place.type,
    title: place.name,
    subtitle: place.address ?? place.city,
    metadata: place.distanceKm !== undefined ? `${place.distanceKm.toFixed(1)} km` : place.isOpen === true ? "Ouvert" : undefined,
    phone: place.phone,
    latitude: place.latitude,
    longitude: place.longitude,
  };
  const active = favoriteKeys.has(favoriteKey(favorite.entityType, favorite.id));
  const accent = place.type === "pharmacy" ? BRAND_GREEN : BRAND_BLUE;
  return (
    <View style={styles.card}>
      <View style={styles.cardHeader}>
        <View style={[styles.markerBadge, { backgroundColor: accent }]}>
          <MaterialIcons name={place.type === "pharmacy" ? "local-pharmacy" : "local-hospital"} size={20} color="#FFFFFF" />
        </View>
        <View style={styles.cardTitleArea}>
          <Text style={styles.cardTitle}>{place.name}</Text>
          <Text style={styles.cardSubtitle}>{place.address ?? place.city ?? "Adresse non renseignée"}</Text>
        </View>
        <TouchableOpacity accessibilityRole="button" style={styles.favoriteButton} onPress={() => toggleFavorite(favorite)}>
          <MaterialIcons name={active ? "favorite" : "favorite-border"} size={23} color={active ? ERROR : MUTED} />
        </TouchableOpacity>
      </View>
      <View style={styles.metaRow}>
        <Text style={styles.metaPill}>{place.distanceKm !== undefined ? `${place.distanceKm.toFixed(1)} km` : "Distance inconnue"}</Text>
        <Text style={styles.metaPill}>{place.isOpen === true ? "Ouvert" : place.isOpen === false ? "Fermé" : "Statut inconnu"}</Text>
      </View>
      <View style={styles.cardActions}>
        <TouchableOpacity accessibilityRole="button" style={[styles.secondaryButton, !place.phone ? styles.disabledButton : undefined]} disabled={!place.phone} onPress={() => callPhone(place.phone)}>
          <MaterialIcons name="call" size={18} color={place.phone ? BRAND_GREEN : MUTED} />
          <Text style={[styles.secondaryButtonText, !place.phone ? styles.disabledText : undefined]}>Appeler</Text>
        </TouchableOpacity>
        <TouchableOpacity accessibilityRole="button" style={[styles.secondaryButton, place.latitude === undefined || place.longitude === undefined ? styles.disabledButton : undefined]} disabled={place.latitude === undefined || place.longitude === undefined} onPress={() => openDirections(favorite)}>
          <MaterialIcons name="directions" size={18} color={place.latitude !== undefined && place.longitude !== undefined ? BRAND_GREEN : MUTED} />
          <Text style={[styles.secondaryButtonText, place.latitude === undefined || place.longitude === undefined ? styles.disabledText : undefined]}>Itinéraire</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}

export function MedicineCard({ medicine }: { medicine: Medicine }) {
  const { favoriteKeys, toggleFavorite } = usePharmaGarde();
  const favorite: FavoriteItem = {
    id: medicine.id,
    entityType: "medicine",
    title: medicine.name,
    subtitle: medicine.category,
    metadata: [medicine.ageCategory, medicine.pharmaceuticalType, medicine.priceApprox !== undefined ? `${medicine.priceApprox.toLocaleString("fr-FR")} FCFA` : undefined].filter(Boolean).join(" · "),
  };
  const active = favoriteKeys.has(favoriteKey("medicine", medicine.id));
  return (
    <View style={styles.card}>
      <View style={styles.cardHeader}>
        {medicine.imageUrl ? <Image source={{ uri: medicine.imageUrl }} style={styles.medicineImage} /> : <View style={styles.medicineFallback}><MaterialIcons name="medication" size={23} color={BRAND_GREEN} /></View>}
        <View style={styles.cardTitleArea}>
          <Text style={styles.cardTitle}>{medicine.name}</Text>
          <Text style={styles.cardSubtitle}>{medicine.category ?? "Catégorie non renseignée"}</Text>
        </View>
        <TouchableOpacity accessibilityRole="button" style={styles.favoriteButton} onPress={() => toggleFavorite(favorite)}>
          <MaterialIcons name={active ? "favorite" : "favorite-border"} size={23} color={active ? ERROR : MUTED} />
        </TouchableOpacity>
      </View>
      <View style={styles.metaRow}>
        <Text style={styles.metaPill}>{medicine.ageCategory ?? "Tous"}</Text>
        <Text style={styles.metaPill}>{medicine.pharmaceuticalType ?? "Type inconnu"}</Text>
        <Text style={styles.pricePill}>{medicine.priceApprox !== undefined ? `${medicine.priceApprox.toLocaleString("fr-FR")} FCFA` : "Prix variable"}</Text>
      </View>
      {medicine.description ? <Text style={styles.description}>{medicine.description}</Text> : null}
    </View>
  );
}

export function SearchResultRow({ item }: { item: CombinedSearchItem }) {
  const { favoriteKeys, toggleFavorite } = usePharmaGarde();
  const active = favoriteKeys.has(favoriteKey(item.entityType, item.id));
  return (
    <View style={styles.resultRow}>
      <View style={styles.resultIcon}>
        <MaterialIcons name={item.entityType === "medicine" ? "medication" : item.entityType === "clinic" ? "local-hospital" : "local-pharmacy"} size={20} color={BRAND_GREEN} />
      </View>
      <View style={styles.resultText}>
        <Text style={styles.resultTitle}>{item.title}</Text>
        <Text style={styles.resultSubtitle}>{item.sourceLabel}{item.subtitle ? ` · ${item.subtitle}` : ""}</Text>
      </View>
      <TouchableOpacity accessibilityRole="button" style={styles.favoriteButton} onPress={() => toggleFavorite(item)}>
        <MaterialIcons name={active ? "favorite" : "favorite-border"} size={22} color={active ? ERROR : MUTED} />
      </TouchableOpacity>
    </View>
  );
}

export function FavoriteRow({ item }: { item: FavoriteItem }) {
  const { toggleFavorite } = usePharmaGarde();
  return (
    <View style={styles.resultRow}>
      <View style={styles.resultIcon}>
        <MaterialIcons name={item.entityType === "medicine" ? "medication" : item.entityType === "clinic" ? "local-hospital" : "local-pharmacy"} size={20} color={BRAND_GREEN} />
      </View>
      <View style={styles.resultText}>
        <Text style={styles.resultTitle}>{item.title}</Text>
        <Text style={styles.resultSubtitle}>{entityLabel(item.entityType)}{item.subtitle ? ` · ${item.subtitle}` : ""}</Text>
      </View>
      <TouchableOpacity accessibilityRole="button" style={styles.favoriteButton} onPress={() => toggleFavorite(item)}>
        <MaterialIcons name="favorite" size={22} color={ERROR} />
      </TouchableOpacity>
    </View>
  );
}

export function MenuRow({ icon, title, description, onPress }: { icon: keyof typeof MaterialIcons.glyphMap; title: string; description: string; onPress?: () => void }) {
  return (
    <TouchableOpacity accessibilityRole="button" style={styles.menuRow} onPress={onPress}>
      <View style={styles.menuIcon}>
        <MaterialIcons name={icon} size={21} color={BRAND_GREEN} />
      </View>
      <View style={styles.menuText}>
        <Text style={styles.menuTitle}>{title}</Text>
        <Text style={styles.menuDescription}>{description}</Text>
      </View>
      <MaterialIcons name="chevron-right" size={22} color={MUTED} />
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  page: { flex: 1, backgroundColor: BACKGROUND },
  topBar: { minHeight: 70, paddingHorizontal: 16, paddingBottom: 10, flexDirection: "row", alignItems: "center", justifyContent: "space-between", borderBottomColor: "rgba(255,255,255,0.24)", borderBottomWidth: 1, backgroundColor: BRAND_GREEN },
  iconButton: { width: 42, height: 42, borderRadius: 21, alignItems: "center", justifyContent: "center", backgroundColor: "rgba(255,255,255,0.18)" },
  titleBlock: { flex: 1, alignItems: "center", paddingHorizontal: 8 },
  title: { fontSize: 19, lineHeight: 24, fontWeight: "800", color: "#FFFFFF" },
  subtitle: { fontSize: 12, lineHeight: 16, color: "#E8FFF0", marginTop: 2 },
  actions: { flexDirection: "row", alignItems: "center", gap: 8 },
  emptyState: { flex: 1, alignItems: "center", justifyContent: "center", padding: 28 },
  emptyIcon: { width: 58, height: 58, borderRadius: 29, backgroundColor: "#E6F8EC", alignItems: "center", justifyContent: "center", marginBottom: 14 },
  emptyTitle: { fontSize: 18, lineHeight: 24, fontWeight: "800", color: FOREGROUND, textAlign: "center" },
  emptyMessage: { fontSize: 14, lineHeight: 21, color: MUTED, textAlign: "center", marginTop: 8, marginBottom: 16 },
  primaryButton: { minHeight: 46, paddingHorizontal: 20, borderRadius: 23, backgroundColor: BRAND_GREEN, alignItems: "center", justifyContent: "center" },
  primaryButtonText: { color: "#FFFFFF", fontWeight: "800", fontSize: 15 },
  notice: { marginHorizontal: 16, marginTop: 12, borderRadius: 16, padding: 12, borderWidth: 1 },
  noticeInfo: { backgroundColor: "#EEF8FF", borderColor: "#B9E6FE" },
  noticeSuccess: { backgroundColor: "#EAF8EF", borderColor: BORDER },
  noticeError: { backgroundColor: "#FFF1F0", borderColor: "#FDA29B" },
  noticeText: { color: FOREGROUND, fontSize: 13, lineHeight: 19 },
  noticeTextError: { color: ERROR },
  searchBox: { margin: 16, height: 48, borderRadius: 24, backgroundColor: SURFACE, borderColor: BORDER, borderWidth: 1, flexDirection: "row", alignItems: "center", paddingHorizontal: 15, gap: 10 },
  searchInput: { flex: 1, fontSize: 15, color: FOREGROUND, paddingVertical: 8 },
  card: { backgroundColor: SURFACE, borderRadius: 24, borderWidth: 1, borderColor: BORDER, marginHorizontal: 16, marginVertical: 8, padding: 16, shadowColor: "#092A13", shadowOpacity: 0.06, shadowRadius: 10, shadowOffset: { width: 0, height: 4 }, elevation: 2 },
  cardHeader: { flexDirection: "row", alignItems: "center", gap: 12 },
  markerBadge: { width: 42, height: 42, borderRadius: 21, alignItems: "center", justifyContent: "center" },
  cardTitleArea: { flex: 1 },
  cardTitle: { fontSize: 16, lineHeight: 22, fontWeight: "800", color: FOREGROUND },
  cardSubtitle: { fontSize: 13, lineHeight: 18, color: MUTED, marginTop: 2 },
  favoriteButton: { width: 38, height: 38, borderRadius: 19, alignItems: "center", justifyContent: "center", backgroundColor: "#F7F7F7" },
  metaRow: { flexDirection: "row", flexWrap: "wrap", gap: 8, marginTop: 14 },
  metaPill: { overflow: "hidden", borderRadius: 14, paddingHorizontal: 10, paddingVertical: 6, color: FOREGROUND, backgroundColor: "#EEF8F2", fontSize: 12, fontWeight: "700" },
  pricePill: { overflow: "hidden", borderRadius: 14, paddingHorizontal: 10, paddingVertical: 6, color: "#FFFFFF", backgroundColor: BRAND_GREEN, fontSize: 12, fontWeight: "900" },
  cardActions: { flexDirection: "row", gap: 10, marginTop: 14 },
  secondaryButton: { flex: 1, minHeight: 42, borderRadius: 21, alignItems: "center", justifyContent: "center", flexDirection: "row", gap: 7, backgroundColor: "#F5FBF7", borderWidth: 1, borderColor: BORDER },
  secondaryButtonText: { color: BRAND_GREEN, fontSize: 14, fontWeight: "800" },
  disabledButton: { opacity: 0.55 },
  disabledText: { color: MUTED },
  medicineImage: { width: 50, height: 50, borderRadius: 18, backgroundColor: "#EAF8EF" },
  medicineFallback: { width: 50, height: 50, borderRadius: 18, backgroundColor: "#EAF8EF", alignItems: "center", justifyContent: "center" },
  description: { marginTop: 12, color: MUTED, fontSize: 13, lineHeight: 20 },
  resultRow: { marginHorizontal: 16, marginVertical: 6, padding: 14, borderRadius: 20, backgroundColor: SURFACE, borderWidth: 1, borderColor: BORDER, flexDirection: "row", alignItems: "center", gap: 12 },
  resultIcon: { width: 40, height: 40, borderRadius: 20, backgroundColor: "#EAF8EF", alignItems: "center", justifyContent: "center" },
  resultText: { flex: 1 },
  resultTitle: { color: FOREGROUND, fontSize: 15, lineHeight: 21, fontWeight: "800" },
  resultSubtitle: { color: MUTED, fontSize: 12, lineHeight: 17, marginTop: 2 },
  menuRow: { flexDirection: "row", alignItems: "center", marginHorizontal: 16, marginVertical: 6, padding: 14, borderRadius: 20, borderColor: BORDER, borderWidth: 1, backgroundColor: SURFACE, gap: 12 },
  menuIcon: { width: 40, height: 40, borderRadius: 20, backgroundColor: "#EAF8EF", alignItems: "center", justifyContent: "center" },
  menuText: { flex: 1 },
  menuTitle: { fontSize: 15, lineHeight: 20, color: FOREGROUND, fontWeight: "800" },
  menuDescription: { fontSize: 12, lineHeight: 17, color: MUTED, marginTop: 2 },
});

export const pharmaStyles = styles;
