import { useRouter } from "expo-router";
import { StyleSheet, View } from "react-native";

import { drawerColors } from "@/components/pharmagarde/drawer-ui";
import { MenuContent } from "@/components/pharmagarde/menu-content";

export default function PharmaGardeMenuScreen() {
  const router = useRouter();

  return (
    <View style={styles.screen}>
      <View style={styles.panel}>
        <MenuContent onClose={() => router.back()} />
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  screen: {
    flex: 1,
    backgroundColor: "rgba(16, 32, 22, 0.46)",
  },
  panel: {
    width: "82%",
    maxWidth: 392,
    flex: 1,
    backgroundColor: drawerColors.background,
    borderTopRightRadius: 14,
    borderBottomRightRadius: 14,
    overflow: "hidden",
  },
});
