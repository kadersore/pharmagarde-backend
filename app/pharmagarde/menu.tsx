import MaterialIcons from "@expo/vector-icons/MaterialIcons";
import { useRouter } from "expo-router";
import { FlatList, StyleSheet, Text, TextInput, TouchableOpacity, View } from "react-native";

import { MenuRow, StatusNotice } from "@/components/pharmagarde/app-ui";
import { ScreenContainer } from "@/components/screen-container";
import { usePharmaGarde } from "@/lib/pharmagarde/app-state";

type MenuItem = {
  id: string;
  icon: keyof typeof MaterialIcons.glyphMap;
  title: string;
  description: string;
  action: () => void;
};

export default function MenuScreen() {
  const router = useRouter();
  const { apiBaseUrl, updateApiBaseUrl, refreshData, requestLocation, isApiConfigured, locationMessage } = usePharmaGarde();

  const items: MenuItem[] = [
    { id: "home", icon: "home", title: "Accueil", description: "Retourner au tableau de bord", action: () => router.replace("/" as never) },
    { id: "clinics", icon: "local-hospital", title: "Cliniques", description: "Consulter les structures sanitaires", action: () => router.replace("/(tabs)/cliniques" as never) },
    { id: "medicines", icon: "medication", title: "Médicaments", description: "Voir le référentiel API", action: () => router.replace("/(tabs)/medicaments" as never) },
    { id: "map", icon: "map", title: "Carte", description: "Visualiser les points disponibles", action: () => router.replace("/(tabs)/carte" as never) },
    { id: "favorites", icon: "favorite", title: "Favoris", description: "Retrouver les éléments sauvegardés", action: () => router.push("/pharmagarde/favoris" as never) },
    { id: "search", icon: "search", title: "Recherche", description: "Lancer une recherche globale", action: () => router.push("/pharmagarde/search" as never) },
  ];

  const header = (
    <View>
      <View style={styles.topRow}>
        <View>
          <Text style={styles.kicker}>Menu</Text>
          <Text style={styles.title}>PharmaGarde BF</Text>
        </View>
        <TouchableOpacity style={styles.closeButton} onPress={() => router.back()}>
          <Text style={styles.closeText}>Fermer</Text>
        </TouchableOpacity>
      </View>
      <View style={styles.configCard}>
        <Text style={styles.configTitle}>Backend API</Text>
        <Text style={styles.configText}>Saisissez l’URL publique de votre API. La version testable ne contient pas de données fictives locales et consomme uniquement vos endpoints réels.</Text>
        <TextInput
          value={apiBaseUrl}
          onChangeText={updateApiBaseUrl}
          placeholder="https://votre-api.example.com"
          placeholderTextColor="#98A2B3"
          autoCapitalize="none"
          autoCorrect={false}
          style={styles.input}
        />
        <View style={styles.actionsRow}>
          <TouchableOpacity style={styles.primaryButton} onPress={refreshData}>
            <Text style={styles.primaryText}>Charger les données</Text>
          </TouchableOpacity>
          <TouchableOpacity style={styles.secondaryButton} onPress={requestLocation}>
            <Text style={styles.secondaryText}>Activer la localisation</Text>
          </TouchableOpacity>
        </View>
      </View>
      <StatusNotice message={isApiConfigured ? "API configurée. Les prochains chargements utiliseront cette URL." : "API non configurée : renseignez une URL pour tester avec vos données."} />
      <StatusNotice message={locationMessage} tone="success" />
    </View>
  );

  return (
    <ScreenContainer>
      <FlatList<MenuItem>
        style={styles.page}
        data={items}
        keyExtractor={(item) => item.id}
        renderItem={({ item }) => <MenuRow icon={item.icon} title={item.title} description={item.description} onPress={item.action} />}
        ListHeaderComponent={header}
        contentContainerStyle={styles.content}
      />
    </ScreenContainer>
  );
}

const styles = StyleSheet.create({
  page: { flex: 1, backgroundColor: "#F6FBF8" },
  content: { paddingBottom: 30 },
  topRow: { paddingHorizontal: 16, paddingTop: 14, paddingBottom: 10, flexDirection: "row", alignItems: "center", justifyContent: "space-between" },
  kicker: { color: "#03A63F", fontSize: 12, lineHeight: 17, fontWeight: "900", textTransform: "uppercase", letterSpacing: 0.8 },
  title: { color: "#102016", fontSize: 26, lineHeight: 32, fontWeight: "900", marginTop: 2 },
  closeButton: { minHeight: 40, paddingHorizontal: 16, borderRadius: 20, backgroundColor: "#FFFFFF", borderWidth: 1, borderColor: "#D6EBDD", alignItems: "center", justifyContent: "center" },
  closeText: { color: "#03A63F", fontWeight: "900" },
  configCard: { margin: 16, padding: 16, borderRadius: 24, backgroundColor: "#FFFFFF", borderWidth: 1, borderColor: "#D6EBDD" },
  configTitle: { color: "#102016", fontSize: 18, lineHeight: 24, fontWeight: "900" },
  configText: { color: "#667085", fontSize: 13, lineHeight: 19, marginTop: 6 },
  input: { marginTop: 14, minHeight: 48, borderRadius: 16, borderWidth: 1, borderColor: "#D6EBDD", paddingHorizontal: 14, color: "#102016", backgroundColor: "#F6FBF8", fontWeight: "700" },
  actionsRow: { flexDirection: "row", gap: 10, marginTop: 14 },
  primaryButton: { flex: 1, minHeight: 46, borderRadius: 23, backgroundColor: "#03C04A", alignItems: "center", justifyContent: "center" },
  primaryText: { color: "#FFFFFF", fontWeight: "900", fontSize: 13 },
  secondaryButton: { flex: 1, minHeight: 46, borderRadius: 23, backgroundColor: "#EAF8EF", alignItems: "center", justifyContent: "center" },
  secondaryText: { color: "#03A63F", fontWeight: "900", fontSize: 13 },
});
