from pathlib import Path

root = Path('/home/ubuntu/pharmagarde_bf_expo')

# 1) Extend shared types with Google Maps rating.
types_path = root / 'lib/pharmagarde/types.ts'
types = types_path.read_text()
types = types.replace('  phone?: string;\n  distanceKm?: number;', '  phone?: string;\n  rating?: number;\n  distanceKm?: number;')
types = types.replace('  phone?: string;\n  latitude?: number;', '  phone?: string;\n  rating?: number;\n  latitude?: number;')
types_path.write_text(types)

# 2) Propagate rating in client API normalization.
api_path = root / 'lib/pharmagarde/api.ts'
api = api_path.read_text()
api = api.replace('    phone: getString(raw, ["phone", "telephone", "tel", "mobile", "contact"]),\n    distanceKm:', '    phone: getString(raw, ["phone", "telephone", "tel", "mobile", "contact", "formatted_phone_number", "international_phone_number"]),\n    rating: getNumber(raw, ["rating", "note", "googleRating", "google_rating", "noteGoogle", "stars"]),\n    distanceKm:')
api_path.write_text(api)

# 3) Propagate rating in server cache model and Google normalization.
cache_path = root / 'server/pharmagarde-cache.ts'
cache = cache_path.read_text()
cache = cache.replace('  phone?: string;\n  distanceKm?: number;', '  phone?: string;\n  rating?: number;\n  distanceKm?: number;')
cache = cache.replace('    phone: getString(raw, ["formatted_phone_number", "international_phone_number", "phone", "telephone"]),\n    latitude:', '    phone: getString(raw, ["formatted_phone_number", "international_phone_number", "phone", "telephone"]),\n    rating: getNumber(raw, ["rating", "note", "googleRating", "google_rating", "noteGoogle", "stars"]),\n    latitude:')
cache_path.write_text(cache)

# 4) Propagate rating in app-state favorites/search mapping if present.
state_path = root / 'lib/pharmagarde/app-state.tsx'
state = state_path.read_text()
state = state.replace('    phone: place.phone,\n    latitude:', '    phone: place.phone,\n    rating: place.rating,\n    latitude:')
state_path.write_text(state)

# 5) Update shared PlaceCard in app-ui.tsx.
app_ui_path = root / 'components/pharmagarde/app-ui.tsx'
app_ui = app_ui_path.read_text()
app_ui = app_ui.replace('    phone: place.phone,\n    latitude:', '    phone: place.phone,\n    rating: place.rating,\n    latitude:')
old_place = '''export function PlaceCard({ place }: { place: HealthPlace }) {
  const { favoriteKeys, toggleFavorite } = usePharmaGarde();
  const palette = usePremiumPalette();
  const favorite: FavoriteItem = {
    id: place.id,
    entityType: place.type,
    title: place.name,
    subtitle: place.address ?? place.city,
    metadata: place.distanceKm !== undefined ? `${place.distanceKm.toFixed(1)} km` : place.isOpen === true ? "Ouvert" : undefined,
    phone: place.phone,
    rating: place.rating,
    latitude: place.latitude,
    longitude: place.longitude,
  };
  const active = favoriteKeys.has(favoriteKey(favorite.entityType, favorite.id));
  const accent = place.type === "pharmacy" ? palette.brand : palette.clinic;
  return (
    <Pressable style={({ pressed }) => [styles.card, { backgroundColor: palette.card, borderColor: palette.border }, pressed ? styles.pressedCard : undefined]} onPress={() => haptic.selection()}>
      <View style={styles.cardHeader}>
        <View style={[styles.markerBadge, { backgroundColor: accent }]}> 
          <MaterialIcons name={place.type === "pharmacy" ? "local-pharmacy" : "local-hospital"} size={20} color="#FFFFFF" />
        </View>
        <View style={styles.cardTitleArea}>
          <Text style={[styles.cardTitle, { color: palette.text }]} numberOfLines={1}>{place.name}</Text>
          <Text style={[styles.cardSubtitle, { color: palette.muted }]} numberOfLines={2}>{place.address ?? place.city ?? "Adresse non renseignée"}</Text>
        </View>
        <View style={styles.placeHeaderMeta}>
          <View style={[styles.metaPill, { backgroundColor: palette.cardMuted }]}> 
            <Text style={[styles.metaText, { color: palette.text }]}>{place.distanceKm !== undefined ? `${place.distanceKm.toFixed(1)} km` : "Distance inconnue"}</Text>
          </View>
          <View style={[styles.metaPill, { backgroundColor: place.isOpen === false ? "rgba(225, 29, 72, 0.1)" : palette.softGreen }]}> 
            <Text style={[styles.metaText, { color: place.isOpen === false ? palette.danger : palette.success }]}>{place.isOpen === true ? "Ouvert" : place.isOpen === false ? "Fermé" : "Statut inconnu"}</Text>
          </View>
        </View>
      </View>
      <View style={styles.metaRow}>
        <Pressable accessibilityRole="button" hitSlop={10} style={({ pressed }) => [styles.favoriteButton, pressed ? styles.pressedScale : undefined]} onPress={() => { haptic.light(); toggleFavorite(favorite); }}>
          <MaterialIcons name={active ? "favorite" : "favorite-border"} size={23} color={active ? palette.danger : palette.muted} />
        </Pressable>
      </View>
      <View style={styles.cardActions}>
        <Pressable accessibilityRole="button" style={({ pressed }) => [styles.secondaryButton, { backgroundColor: palette.cardMuted, opacity: place.phone ? 1 : 0.46 }, pressed && place.phone ? styles.pressedScale : undefined]} disabled={!place.phone} onPress={() => { haptic.light(); callPhone(place.phone); }}>
          <MaterialIcons name="call" size={18} color={place.phone ? accent : palette.muted} />
          <Text style={[styles.secondaryButtonText, { color: place.phone ? palette.text : palette.muted }]}>Appeler</Text>
        </Pressable>
        <Pressable accessibilityRole="button" style={({ pressed }) => [styles.secondaryButton, { backgroundColor: palette.cardMuted, opacity: place.latitude === undefined || place.longitude === undefined ? 0.46 : 1 }, pressed && place.latitude !== undefined && place.longitude !== undefined ? styles.pressedScale : undefined]} disabled={place.latitude === undefined || place.longitude === undefined} onPress={() => { haptic.medium(); openDirections(favorite); }}>
          <MaterialIcons name="directions" size={18} color={place.latitude !== undefined && place.longitude !== undefined ? accent : palette.muted} />
          <Text style={[styles.secondaryButtonText, { color: place.latitude !== undefined && place.longitude !== undefined ? palette.text : palette.muted }]}>Itinéraire</Text>
        </Pressable>
      </View>
    </Pressable>
  );
}
'''
new_place = '''export function PlaceCard({ place }: { place: HealthPlace }) {
  const { favoriteKeys, toggleFavorite } = usePharmaGarde();
  const palette = usePremiumPalette();
  const [expanded, setExpanded] = useState(false);
  const favorite: FavoriteItem = {
    id: place.id,
    entityType: place.type,
    title: place.name,
    subtitle: place.address ?? place.city,
    metadata: place.distanceKm !== undefined ? `${place.distanceKm.toFixed(1)} km` : place.isOpen === true ? "Ouvert" : undefined,
    phone: place.phone,
    rating: place.rating,
    latitude: place.latitude,
    longitude: place.longitude,
  };
  const active = favoriteKeys.has(favoriteKey(favorite.entityType, favorite.id));
  const accent = place.type === "pharmacy" ? palette.brand : palette.clinic;
  const ratingLabel = place.rating !== undefined ? `${place.rating.toFixed(1)}/5` : "Note inconnue";
  const phoneLabel = place.phone ?? "Téléphone indisponible";
  const canNavigate = place.latitude !== undefined && place.longitude !== undefined;

  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={`${place.name}. Appuyer pour ${expanded ? "masquer" : "afficher"} les actions.`}
      style={({ pressed }) => [styles.card, { backgroundColor: palette.card, borderColor: palette.border }, pressed ? styles.pressedCard : undefined]}
      onPress={() => { haptic.selection(); setExpanded((current) => !current); }}
    >
      <View style={styles.cardHeader}>
        <View style={[styles.markerBadge, { backgroundColor: accent }]}> 
          <MaterialIcons name={place.type === "pharmacy" ? "local-pharmacy" : "local-hospital"} size={20} color="#FFFFFF" />
        </View>
        <View style={styles.cardTitleArea}>
          <Text style={[styles.cardTitle, { color: palette.text }]} numberOfLines={1}>{place.name}</Text>
          <Text style={[styles.cardSubtitle, { color: palette.muted }]} numberOfLines={2}>{place.address ?? place.city ?? "Adresse non renseignée"}</Text>
        </View>
        <View style={styles.placeHeaderMeta}>
          <View style={[styles.metaPill, { backgroundColor: palette.cardMuted }]}> 
            <Text style={[styles.metaText, { color: palette.text }]}>{place.distanceKm !== undefined ? `${place.distanceKm.toFixed(1)} km` : "Distance inconnue"}</Text>
          </View>
          <View style={[styles.metaPill, { backgroundColor: place.isOpen === false ? "rgba(225, 29, 72, 0.1)" : palette.softGreen }]}> 
            <Text style={[styles.metaText, { color: place.isOpen === false ? palette.danger : palette.success }]}>{place.isOpen === true ? "Ouvert" : place.isOpen === false ? "Fermé" : "Statut inconnu"}</Text>
          </View>
        </View>
      </View>
      {expanded ? (
        <View style={styles.placeExpandableContent}>
          <View style={styles.placeInfoRow}>
            <Pressable accessibilityRole="button" hitSlop={10} style={({ pressed }) => [styles.favoriteButton, pressed ? styles.pressedScale : undefined]} onPress={(event) => { event.stopPropagation(); haptic.light(); toggleFavorite(favorite); }}>
              <MaterialIcons name={active ? "favorite" : "favorite-border"} size={23} color={active ? palette.danger : palette.muted} />
            </Pressable>
            <View style={[styles.compactInfoPill, { backgroundColor: palette.cardMuted }]}> 
              <MaterialIcons name="star" size={15} color={place.rating !== undefined ? "#F59E0B" : palette.muted} />
              <Text style={[styles.compactInfoText, { color: palette.text }]}>{ratingLabel}</Text>
            </View>
            <View style={[styles.compactInfoPill, styles.phoneInfoPill, { backgroundColor: palette.cardMuted }]}> 
              <MaterialIcons name="phone" size={15} color={place.phone ? accent : palette.muted} />
              <Text numberOfLines={1} style={[styles.compactInfoText, { color: place.phone ? palette.text : palette.muted }]}>{phoneLabel}</Text>
            </View>
          </View>
          <View style={styles.cardActions}>
            <Pressable accessibilityRole="button" style={({ pressed }) => [styles.secondaryButton, { backgroundColor: palette.cardMuted, opacity: place.phone ? 1 : 0.46 }, pressed && place.phone ? styles.pressedScale : undefined]} disabled={!place.phone} onPress={(event) => { event.stopPropagation(); haptic.light(); callPhone(place.phone); }}>
              <MaterialIcons name="call" size={18} color={place.phone ? accent : palette.muted} />
              <Text style={[styles.secondaryButtonText, { color: place.phone ? palette.text : palette.muted }]}>Appeler</Text>
            </Pressable>
            <Pressable accessibilityRole="button" style={({ pressed }) => [styles.secondaryButton, { backgroundColor: palette.cardMuted, opacity: canNavigate ? 1 : 0.46 }, pressed && canNavigate ? styles.pressedScale : undefined]} disabled={!canNavigate} onPress={(event) => { event.stopPropagation(); haptic.medium(); openDirections(favorite); }}>
              <MaterialIcons name="directions" size={18} color={canNavigate ? accent : palette.muted} />
              <Text style={[styles.secondaryButtonText, { color: canNavigate ? palette.text : palette.muted }]}>Itinéraire</Text>
            </Pressable>
          </View>
        </View>
      ) : null}
    </Pressable>
  );
}
'''
if old_place not in app_ui:
    raise SystemExit('PlaceCard block not found')
app_ui = app_ui.replace(old_place, new_place)
app_ui = app_ui.replace('  medicineDetails: { marginTop: 2 },\n', '  medicineDetails: { marginTop: 2 },\n  placeExpandableContent: { marginTop: 2 },\n  placeInfoRow: { flexDirection: "row", alignItems: "center", gap: 8, marginTop: 13 },\n  compactInfoPill: { minHeight: 34, borderRadius: 17, paddingHorizontal: 10, flexDirection: "row", alignItems: "center", justifyContent: "center", gap: 5 },\n  phoneInfoPill: { flex: 1, justifyContent: "flex-start" },\n  compactInfoText: { fontSize: 12, lineHeight: 15, fontWeight: "900" },\n')
app_ui_path.write_text(app_ui)

# 6) Update map cards in carte.tsx with the same expandable lower section.
carte_path = root / 'app/(tabs)/carte.tsx'
carte = carte_path.read_text()
carte = carte.replace('    phone: place.phone,\n    latitude:', '    phone: place.phone,\n    rating: place.rating,\n    latitude:')
old_map = '''function MapPlaceCard({ place, active, favorite, onSelect, onToggleFavorite }: { place: HealthPlace; active: boolean; favorite: boolean; onSelect: () => void; onToggleFavorite: () => void }) {
  const palette = usePremiumPalette();
  const accent = place.type === "pharmacy" ? palette.brand : palette.clinic;
  const canCall = !!place.phone;
  const canNavigate = place.latitude !== undefined && place.longitude !== undefined;

  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={`Voir ${place.name}`}
      style={({ pressed }) => [styles.placeCard, { backgroundColor: palette.card, borderColor: active ? accent : palette.border, borderWidth: active ? 2 : 1 }, pressed ? styles.pressedCard : undefined]}
      onPress={() => {
        haptic.selection();
        onSelect();
      }}
    >
      <View style={styles.placeHeader}>
        <View style={[styles.placeIcon, { backgroundColor: accent }]}> 
          <MaterialIcons name={place.type === "pharmacy" ? "local-pharmacy" : "local-hospital"} size={21} color="#FFFFFF" />
        </View>
        <View style={styles.placeTitleArea}>
          <Text style={[styles.placeTitle, { color: palette.text }]} numberOfLines={1}>{place.name}</Text>
          <Text style={[styles.placeSubtitle, { color: palette.muted }]} numberOfLines={1}>{place.address ?? place.city ?? "Adresse non renseignée"}</Text>
        </View>
        <Pressable
          accessibilityRole="button"
          accessibilityLabel={favorite ? "Retirer des favoris" : "Ajouter aux favoris"}
          hitSlop={10}
          style={({ pressed }) => [styles.favoriteButton, pressed ? styles.pressedScale : undefined]}
          onPress={() => {
            haptic.light();
            onToggleFavorite();
          }}
        >
          <MaterialIcons name={favorite ? "favorite" : "favorite-border"} size={23} color={favorite ? palette.danger : palette.muted} />
        </Pressable>
      </View>

      <View style={styles.metaRow}>
        <View style={[styles.metaPill, { backgroundColor: palette.cardMuted }]}> 
          <MaterialIcons name="near-me" size={14} color={accent} />
          <Text style={[styles.metaText, { color: palette.text }]}>{place.distanceKm !== undefined ? `${place.distanceKm.toFixed(1)} km` : "Distance inconnue"}</Text>
        </View>
        <View style={[styles.metaPill, { backgroundColor: place.isOpen === false ? "rgba(225, 29, 72, 0.1)" : palette.softGreen }]}> 
          <MaterialIcons name={place.isOpen === false ? "schedule" : "verified"} size={14} color={place.isOpen === false ? palette.danger : palette.success} />
          <Text style={[styles.metaText, { color: place.isOpen === false ? palette.danger : palette.success }]}>{place.isOpen === true ? "Ouvert" : place.isOpen === false ? "Fermé" : place.type === "pharmacy" ? "Garde à vérifier" : "Service disponible"}</Text>
        </View>
      </View>

      <View style={styles.actionRow}>
        <Pressable
          accessibilityRole="button"
          disabled={!canCall}
          style={({ pressed }) => [styles.actionButton, { backgroundColor: palette.cardMuted, opacity: canCall ? 1 : 0.46 }, pressed && canCall ? styles.pressedScale : undefined]}
          onPress={() => {
            haptic.light();
            callPhone(place.phone);
          }}
        >
          <MaterialIcons name="call" size={18} color={canCall ? accent : palette.muted} />
          <Text style={[styles.actionText, { color: canCall ? palette.text : palette.muted }]}>Appel</Text>
        </Pressable>
        <Pressable
          accessibilityRole="button"
          disabled={!canNavigate}
          style={({ pressed }) => [styles.actionButton, { backgroundColor: palette.cardMuted, opacity: canNavigate ? 1 : 0.46 }, pressed && canNavigate ? styles.pressedScale : undefined]}
          onPress={() => {
            haptic.medium();
            openDirections(place);
          }}
        >
          <MaterialIcons name="directions" size={18} color={canNavigate ? accent : palette.muted} />
          <Text style={[styles.actionText, { color: canNavigate ? palette.text : palette.muted }]}>Itinéraire</Text>
        </Pressable>
      </View>
    </Pressable>
  );
}
'''
new_map = '''function MapPlaceCard({ place, active, favorite, onSelect, onToggleFavorite }: { place: HealthPlace; active: boolean; favorite: boolean; onSelect: () => void; onToggleFavorite: () => void }) {
  const palette = usePremiumPalette();
  const [expanded, setExpanded] = useState(false);
  const accent = place.type === "pharmacy" ? palette.brand : palette.clinic;
  const canCall = !!place.phone;
  const canNavigate = place.latitude !== undefined && place.longitude !== undefined;
  const ratingLabel = place.rating !== undefined ? `${place.rating.toFixed(1)}/5` : "Note inconnue";
  const phoneLabel = place.phone ?? "Téléphone indisponible";

  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={`${place.name}. Appuyer pour ${expanded ? "masquer" : "afficher"} les actions.`}
      style={({ pressed }) => [styles.placeCard, { backgroundColor: palette.card, borderColor: active ? accent : palette.border, borderWidth: active ? 2 : 1 }, pressed ? styles.pressedCard : undefined]}
      onPress={() => {
        haptic.selection();
        onSelect();
        setExpanded((current) => !current);
      }}
    >
      <View style={styles.placeHeader}>
        <View style={[styles.placeIcon, { backgroundColor: accent }]}> 
          <MaterialIcons name={place.type === "pharmacy" ? "local-pharmacy" : "local-hospital"} size={21} color="#FFFFFF" />
        </View>
        <View style={styles.placeTitleArea}>
          <Text style={[styles.placeTitle, { color: palette.text }]} numberOfLines={1}>{place.name}</Text>
          <Text style={[styles.placeSubtitle, { color: palette.muted }]} numberOfLines={1}>{place.address ?? place.city ?? "Adresse non renseignée"}</Text>
        </View>
      </View>

      <View style={styles.metaRow}>
        <View style={[styles.metaPill, { backgroundColor: palette.cardMuted }]}> 
          <MaterialIcons name="near-me" size={14} color={accent} />
          <Text style={[styles.metaText, { color: palette.text }]}>{place.distanceKm !== undefined ? `${place.distanceKm.toFixed(1)} km` : "Distance inconnue"}</Text>
        </View>
        <View style={[styles.metaPill, { backgroundColor: place.isOpen === false ? "rgba(225, 29, 72, 0.1)" : palette.softGreen }]}> 
          <MaterialIcons name={place.isOpen === false ? "schedule" : "verified"} size={14} color={place.isOpen === false ? palette.danger : palette.success} />
          <Text style={[styles.metaText, { color: place.isOpen === false ? palette.danger : palette.success }]}>{place.isOpen === true ? "Ouvert" : place.isOpen === false ? "Fermé" : place.type === "pharmacy" ? "Garde à vérifier" : "Service disponible"}</Text>
        </View>
      </View>

      {expanded ? (
        <View style={styles.placeExpandableContent}>
          <View style={styles.placeInfoRow}>
            <Pressable
              accessibilityRole="button"
              accessibilityLabel={favorite ? "Retirer des favoris" : "Ajouter aux favoris"}
              hitSlop={10}
              style={({ pressed }) => [styles.favoriteButton, pressed ? styles.pressedScale : undefined]}
              onPress={(event) => {
                event.stopPropagation();
                haptic.light();
                onToggleFavorite();
              }}
            >
              <MaterialIcons name={favorite ? "favorite" : "favorite-border"} size={23} color={favorite ? palette.danger : palette.muted} />
            </Pressable>
            <View style={[styles.compactInfoPill, { backgroundColor: palette.cardMuted }]}> 
              <MaterialIcons name="star" size={15} color={place.rating !== undefined ? "#F59E0B" : palette.muted} />
              <Text style={[styles.compactInfoText, { color: palette.text }]}>{ratingLabel}</Text>
            </View>
            <View style={[styles.compactInfoPill, styles.phoneInfoPill, { backgroundColor: palette.cardMuted }]}> 
              <MaterialIcons name="phone" size={15} color={canCall ? accent : palette.muted} />
              <Text numberOfLines={1} style={[styles.compactInfoText, { color: canCall ? palette.text : palette.muted }]}>{phoneLabel}</Text>
            </View>
          </View>
          <View style={styles.actionRow}>
            <Pressable
              accessibilityRole="button"
              disabled={!canCall}
              style={({ pressed }) => [styles.actionButton, { backgroundColor: palette.cardMuted, opacity: canCall ? 1 : 0.46 }, pressed && canCall ? styles.pressedScale : undefined]}
              onPress={(event) => {
                event.stopPropagation();
                haptic.light();
                callPhone(place.phone);
              }}
            >
              <MaterialIcons name="call" size={18} color={canCall ? accent : palette.muted} />
              <Text style={[styles.actionText, { color: canCall ? palette.text : palette.muted }]}>Appel</Text>
            </Pressable>
            <Pressable
              accessibilityRole="button"
              disabled={!canNavigate}
              style={({ pressed }) => [styles.actionButton, { backgroundColor: palette.cardMuted, opacity: canNavigate ? 1 : 0.46 }, pressed && canNavigate ? styles.pressedScale : undefined]}
              onPress={(event) => {
                event.stopPropagation();
                haptic.medium();
                openDirections(place);
              }}
            >
              <MaterialIcons name="directions" size={18} color={canNavigate ? accent : palette.muted} />
              <Text style={[styles.actionText, { color: canNavigate ? palette.text : palette.muted }]}>Itinéraire</Text>
            </Pressable>
          </View>
        </View>
      ) : null}
    </Pressable>
  );
}
'''
if old_map not in carte:
    raise SystemExit('MapPlaceCard block not found')
carte = carte.replace(old_map, new_map)
carte = carte.replace('  actionRow: { flexDirection: "row", gap: 9, marginTop: 12 },\n', '  placeExpandableContent: { marginTop: 2 },\n  placeInfoRow: { flexDirection: "row", alignItems: "center", gap: 8, marginTop: 12 },\n  compactInfoPill: { minHeight: 34, borderRadius: 17, paddingHorizontal: 10, flexDirection: "row", alignItems: "center", justifyContent: "center", gap: 5 },\n  phoneInfoPill: { flex: 1, justifyContent: "flex-start" },\n  compactInfoText: { fontSize: 12, lineHeight: 15, fontWeight: "900" },\n  actionRow: { flexDirection: "row", gap: 9, marginTop: 12 },\n')
carte_path.write_text(carte)

print('Mise à jour terminée')
