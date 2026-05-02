import { Tabs } from "expo-router";

import { GlobalAppShell } from "@/components/pharmagarde/app-shell";

export default function TabLayout() {
  return (
    <GlobalAppShell>
      <Tabs
        screenOptions={{
          headerShown: false,
          tabBarStyle: { display: "none" },
        }}
      >
        <Tabs.Screen name="index" options={{ title: "Accueil" }} />
        <Tabs.Screen name="cliniques" options={{ title: "Cliniques" }} />
        <Tabs.Screen name="medicaments" options={{ title: "Médicaments" }} />
        <Tabs.Screen name="carte" options={{ title: "Carte" }} />
      </Tabs>
    </GlobalAppShell>
  );
}
