from pathlib import Path

root = Path('/home/ubuntu/pharmagarde_bf_expo')

app_ui = root / 'components/pharmagarde/app-ui.tsx'
text = app_ui.read_text()
text = text.replace(
    'export function PlaceCard({ place }: { place: HealthPlace }) {\n  const { favoriteKeys, toggleFavorite } = usePharmaGarde();\n  const palette = usePremiumPalette();\n  const [expanded, setExpanded] = useState(false);',
    'export function PlaceCard({ place, isExpanded, onToggle }: { place: HealthPlace; isExpanded: boolean; onToggle: () => void }) {\n  const { favoriteKeys, toggleFavorite } = usePharmaGarde();\n  const palette = usePremiumPalette();'
)
text = text.replace(
    'accessibilityLabel={`${place.name}. Appuyer pour ${expanded ? "masquer" : "afficher"} les actions.`}',
    'accessibilityLabel={`${place.name}. Appuyer pour ${isExpanded ? "masquer" : "afficher"} les actions.`}'
)
text = text.replace(
    'onPress={() => { haptic.selection(); setExpanded((current) => !current); }}',
    'onPress={() => { haptic.selection(); onToggle(); }}',
    1
)
text = text.replace('{expanded ? (\n        <View style={styles.placeExpandableContent}>', '{isExpanded ? (\n        <View style={styles.placeExpandableContent}>', 1)
app_ui.write_text(text)

index = root / 'app/(tabs)/index.tsx'
text = index.read_text()
text = text.replace('import { FlatList, StyleSheet } from "react-native";\n', 'import { useState } from "react";\nimport { FlatList, StyleSheet } from "react-native";\n')
text = text.replace(
    'export default function HomeScreen() {\n  const { pharmacies } = usePharmaGarde();',
    'export default function HomeScreen() {\n  const { pharmacies } = usePharmaGarde();\n  const [expandedPlaceId, setExpandedPlaceId] = useState<string | undefined>();'
)
text = text.replace(
    'renderItem={({ item }) => <PlaceCard place={item} />}',
    'renderItem={({ item }) => {\n          const itemKey = `${item.type}-${item.id}`;\n          return (\n            <PlaceCard\n              place={item}\n              isExpanded={expandedPlaceId === itemKey}\n              onToggle={() => setExpandedPlaceId((current) => current === itemKey ? undefined : itemKey)}\n            />\n          );\n        }}'
)
index.write_text(text)

clinics = root / 'app/(tabs)/cliniques.tsx'
text = clinics.read_text()
text = text.replace('import { FlatList, StyleSheet, View } from "react-native";\n', 'import { useState } from "react";\nimport { FlatList, StyleSheet, View } from "react-native";\n')
text = text.replace(
    'export default function ClinicsScreen() {\n  const { clinics, errors, refreshData } = usePharmaGarde();',
    'export default function ClinicsScreen() {\n  const { clinics, errors, refreshData } = usePharmaGarde();\n  const [expandedPlaceId, setExpandedPlaceId] = useState<string | undefined>();'
)
text = text.replace(
    'renderItem={({ item }) => <PlaceCard place={item} />}',
    'renderItem={({ item }) => {\n          const itemKey = `${item.type}-${item.id}`;\n          return (\n            <PlaceCard\n              place={item}\n              isExpanded={expandedPlaceId === itemKey}\n              onToggle={() => setExpandedPlaceId((current) => current === itemKey ? undefined : itemKey)}\n            />\n          );\n        }}'
)
clinics.write_text(text)

carte = root / 'app/(tabs)/carte.tsx'
text = carte.read_text()
text = text.replace(
    'function MapPlaceCard({ place, active, favorite, onSelect, onToggleFavorite }: { place: HealthPlace; active: boolean; favorite: boolean; onSelect: () => void; onToggleFavorite: () => void }) {\n  const palette = usePremiumPalette();\n  const [expanded, setExpanded] = useState(false);',
    'function MapPlaceCard({ place, active, favorite, isExpanded, onSelect, onToggle, onToggleFavorite }: { place: HealthPlace; active: boolean; favorite: boolean; isExpanded: boolean; onSelect: () => void; onToggle: () => void; onToggleFavorite: () => void }) {\n  const palette = usePremiumPalette();'
)
text = text.replace(
    'accessibilityLabel={`${place.name}. Appuyer pour ${expanded ? "masquer" : "afficher"} les actions.`}',
    'accessibilityLabel={`${place.name}. Appuyer pour ${isExpanded ? "masquer" : "afficher"} les actions.`}'
)
text = text.replace(
    '        onSelect();\n        setExpanded((current) => !current);',
    '        onSelect();\n        onToggle();'
)
text = text.replace('{expanded ? (\n        <View style={styles.placeExpandableContent}>', '{isExpanded ? (\n        <View style={styles.placeExpandableContent}>')
text = text.replace(
    'const [selectedId, setSelectedId] = useState<string | undefined>(() => visiblePlaces[0] ? keyFor(visiblePlaces[0]) : undefined);',
    'const [selectedId, setSelectedId] = useState<string | undefined>(() => visiblePlaces[0] ? keyFor(visiblePlaces[0]) : undefined);\n  const [expandedPlaceId, setExpandedPlaceId] = useState<string | undefined>();'
)
text = text.replace(
    'return <MapPlaceCard place={item} active={keyFor(item) === selectedId} favorite={favorite} onSelect={() => selectPlace(item)} onToggleFavorite={() => toggleFavorite(favoriteFromPlace(item))} />;',
    'const itemKey = keyFor(item);\n                return (\n                  <MapPlaceCard\n                    place={item}\n                    active={itemKey === selectedId}\n                    favorite={favorite}\n                    isExpanded={expandedPlaceId === itemKey}\n                    onSelect={() => selectPlace(item)}\n                    onToggle={() => setExpandedPlaceId((current) => current === itemKey ? undefined : itemKey)}\n                    onToggleFavorite={() => toggleFavorite(favoriteFromPlace(item))}\n                  />\n                );'
)
carte.write_text(text)
