import MaterialIcons from "@expo/vector-icons/MaterialIcons";
import { Tabs } from "expo-router";
import { Platform } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import { HapticTab } from "@/components/haptic-tab";

const ACTIVE = "#03C04A";
const INACTIVE = "#667085";

export default function TabLayout() {
  const insets = useSafeAreaInsets();
  const bottomPadding = Platform.OS === "web" ? 10 : Math.max(insets.bottom, 8);

  return (
    <Tabs
      screenOptions={{
        headerShown: false,
        tabBarActiveTintColor: ACTIVE,
        tabBarInactiveTintColor: INACTIVE,
        tabBarButton: HapticTab,
        tabBarStyle: {
          height: 58 + bottomPadding,
          paddingTop: 7,
          paddingBottom: bottomPadding,
          backgroundColor: "#FFFFFF",
          borderTopColor: "#D6EBDD",
          borderTopWidth: 1,
        },
        tabBarLabelStyle: { fontSize: 11, fontWeight: "700" },
      }}
    >
      <Tabs.Screen name="index" options={{ title: "Accueil", tabBarIcon: ({ color }) => <MaterialIcons name="home" size={25} color={color} /> }} />
      <Tabs.Screen name="cliniques" options={{ title: "Cliniques", tabBarIcon: ({ color }) => <MaterialIcons name="local-hospital" size={24} color={color} /> }} />
      <Tabs.Screen name="medicaments" options={{ title: "Médicaments", tabBarIcon: ({ color }) => <MaterialIcons name="medication" size={24} color={color} /> }} />
      <Tabs.Screen name="carte" options={{ title: "Carte", tabBarIcon: ({ color }) => <MaterialIcons name="map" size={24} color={color} /> }} />
    </Tabs>
  );
}
