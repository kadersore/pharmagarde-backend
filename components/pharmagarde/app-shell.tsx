import MaterialIcons from "@expo/vector-icons/MaterialIcons";
import { usePathname, useRouter } from "expo-router";
import { PropsWithChildren, ReactNode, useEffect, useMemo, useRef, useState } from "react";
import { ActivityIndicator, Animated, Platform, Pressable, StyleSheet, Text, View, useWindowDimensions } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import { ScreenContainer } from "@/components/screen-container";
import { MenuContent } from "@/components/pharmagarde/menu-content";
import { usePharmaGarde } from "@/lib/pharmagarde/app-state";

const BRAND_GREEN = "#03C04A";
const BACKGROUND = "#F6FBF8";
const FOREGROUND = "#102016";
const MUTED = "#667085";
const BORDER = "#D6EBDD";
const SURFACE = "#FFFFFF";
const OVERLAY = "rgba(16, 32, 22, 0.46)";

const FOOTER_ITEMS = [
  { key: "index", href: "/", label: "Accueil", icon: "home" },
  { key: "cliniques", href: "/cliniques", label: "Cliniques", icon: "local-hospital" },
  { key: "medicaments", href: "/medicaments", label: "Médicaments", icon: "medication" },
  { key: "carte", href: "/carte", label: "Cartes", icon: "map" },
] as const;

type FooterItem = (typeof FOOTER_ITEMS)[number];

type ShellProps = PropsWithChildren<{
  subtitle?: string;
  showFooter?: boolean;
  rightAccessory?: ReactNode;
}>;

function titleForPath(pathname: string, subtitle?: string) {
  if (subtitle) return subtitle;
  if (pathname.includes("cliniques")) return "Cliniques";
  if (pathname.includes("medicaments")) return "Médicaments";
  if (pathname.includes("carte")) return "Carte";
  if (pathname.includes("favoris")) return "Favoris";
  if (pathname.includes("search")) return "Recherche";
  if (pathname.includes("abonnement")) return "Abonnement";
  if (pathname.includes("contribution")) return "Contribution";
  if (pathname.includes("info")) return "Informations";
  if (pathname.includes("ville")) return "Ville";
  return "PharmaGarde BF";
}

function isFooterActive(item: FooterItem, pathname: string) {
  if (item.key === "index") return pathname === "/" || pathname.endsWith("/(tabs)") || pathname.endsWith("/index");
  return pathname.includes(item.key);
}

function AppHeader({ title, onOpenMenu, rightAccessory }: { title: string; onOpenMenu: () => void; rightAccessory?: ReactNode }) {
  const router = useRouter();
  const { loading } = usePharmaGarde();

  return (
    <View style={styles.header}>
      <Pressable
        accessibilityRole="button"
        accessibilityLabel="Ouvrir le menu"
        android_ripple={{ color: "rgba(255,255,255,0.24)", borderless: true }}
        style={({ pressed }) => [styles.headerButton, pressed ? styles.headerButtonPressed : undefined]}
        onPress={onOpenMenu}
      >
        <MaterialIcons name="menu" size={25} color="#FFFFFF" />
      </Pressable>

      <View style={styles.headerTitleWrap} pointerEvents="none">
        <Text style={styles.headerTitle} numberOfLines={1}>{title}</Text>
      </View>

      <View style={styles.headerActions}>
        {loading ? <ActivityIndicator color="#FFFFFF" size="small" /> : null}
        {rightAccessory ?? null}
        <Pressable
          accessibilityRole="button"
          accessibilityLabel="Ouvrir les favoris"
          android_ripple={{ color: "rgba(255,255,255,0.24)", borderless: true }}
          style={({ pressed }) => [styles.headerButton, pressed ? styles.headerButtonPressed : undefined]}
          onPress={() => router.push("/pharmagarde/favoris" as never)}
        >
          <MaterialIcons name="favorite-border" size={23} color="#FFFFFF" />
        </Pressable>
        <Pressable
          accessibilityRole="button"
          accessibilityLabel="Ouvrir la recherche"
          android_ripple={{ color: "rgba(255,255,255,0.24)", borderless: true }}
          style={({ pressed }) => [styles.headerButton, pressed ? styles.headerButtonPressed : undefined]}
          onPress={() => router.push("/pharmagarde/search" as never)}
        >
          <MaterialIcons name="search" size={24} color="#FFFFFF" />
        </Pressable>
      </View>
    </View>
  );
}

function AppFooter() {
  const router = useRouter();
  const pathname = usePathname();
  const insets = useSafeAreaInsets();
  const bottomPadding = Platform.OS === "web" ? 10 : Math.max(insets.bottom, 8);

  return (
    <View style={[styles.footer, { paddingBottom: bottomPadding }]}> 
      {FOOTER_ITEMS.map((item) => {
        const active = isFooterActive(item, pathname);
        return (
          <Pressable
            key={item.key}
            accessibilityRole="tab"
            accessibilityState={{ selected: active }}
            android_ripple={{ color: "rgba(3,192,74,0.12)", borderless: false }}
            style={({ pressed }) => [styles.footerItem, active ? styles.footerItemActive : undefined, pressed ? styles.footerItemPressed : undefined]}
            onPress={() => router.replace(item.href as never)}
          >
            <MaterialIcons name={item.icon} size={23} color={active ? BRAND_GREEN : MUTED} />
            <Text style={[styles.footerLabel, active ? styles.footerLabelActive : undefined]} numberOfLines={1}>{item.label}</Text>
          </Pressable>
        );
      })}
    </View>
  );
}

function DrawerOverlay({ visible, onClose }: { visible: boolean; onClose: () => void }) {
  const { width } = useWindowDimensions();
  const progress = useRef(new Animated.Value(0)).current;
  const [mounted, setMounted] = useState(visible);
  const drawerWidth = Math.min(Math.max(width * 0.8 + 20, 308), width * 0.85, 412);

  useEffect(() => {
    if (visible) {
      setMounted(true);
      Animated.timing(progress, { toValue: 1, duration: 250, useNativeDriver: true }).start();
      return;
    }
    Animated.timing(progress, { toValue: 0, duration: 210, useNativeDriver: true }).start(({ finished }) => {
      if (finished) setMounted(false);
    });
  }, [progress, visible]);

  const overlayOpacity = progress.interpolate({ inputRange: [0, 1], outputRange: [0, 1] });
  const translateX = progress.interpolate({ inputRange: [0, 1], outputRange: [-drawerWidth, 0] });

  if (!mounted) return null;

  return (
    <View style={StyleSheet.absoluteFill} pointerEvents="box-none">
      <Animated.View style={[styles.overlay, { opacity: overlayOpacity }]}> 
        <Pressable accessibilityRole="button" accessibilityLabel="Fermer le menu" style={StyleSheet.absoluteFill} onPress={onClose} />
      </Animated.View>
      <Animated.View style={[styles.drawerPanel, { width: drawerWidth, transform: [{ translateX }] }]}> 
        <MenuContent onClose={onClose} />
      </Animated.View>
    </View>
  );
}

export function GlobalAppShell({ children, subtitle, showFooter = true, rightAccessory }: ShellProps) {
  const pathname = usePathname();
  const [drawerVisible, setDrawerVisible] = useState(false);
  const title = useMemo(() => titleForPath(pathname, subtitle), [pathname, subtitle]);

  return (
    <ScreenContainer edges={["top", "left", "right", "bottom"]} className="" containerClassName="">
      <View style={styles.shell}>
        <AppHeader title={title} onOpenMenu={() => setDrawerVisible(true)} rightAccessory={rightAccessory} />
        <View style={styles.content}>{children}</View>
        {showFooter ? <AppFooter /> : null}
        <DrawerOverlay visible={drawerVisible} onClose={() => setDrawerVisible(false)} />
      </View>
    </ScreenContainer>
  );
}

export function AppChrome({ children, subtitle }: PropsWithChildren<{ subtitle?: string }>) {
  return <GlobalAppShell subtitle={subtitle}>{children}</GlobalAppShell>;
}

const styles = StyleSheet.create({
  shell: { flex: 1, backgroundColor: BACKGROUND, overflow: "hidden" },
  header: {
    minHeight: 62,
    paddingHorizontal: 14,
    paddingVertical: 10,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    backgroundColor: BRAND_GREEN,
    borderBottomWidth: 1,
    borderBottomColor: "rgba(255,255,255,0.22)",
  },
  headerButton: {
    width: 40,
    height: 40,
    borderRadius: 12,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "rgba(255,255,255,0.18)",
  },
  headerButtonPressed: { opacity: 0.82, transform: [{ scale: 0.97 }] },
  headerTitleWrap: { position: "absolute", left: 118, right: 118, alignItems: "center" },
  headerTitle: { color: "#FFFFFF", fontSize: 18, lineHeight: 23, fontWeight: "800", textAlign: "center" },
  headerActions: { minWidth: 88, flexDirection: "row", alignItems: "center", justifyContent: "flex-end", gap: 8 },
  content: { flex: 1, backgroundColor: BACKGROUND },
  footer: {
    minHeight: 64,
    paddingTop: 8,
    paddingHorizontal: 10,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    backgroundColor: SURFACE,
    borderTopWidth: 1,
    borderTopColor: BORDER,
    shadowColor: "#092A13",
    shadowOpacity: 0.07,
    shadowRadius: 10,
    shadowOffset: { width: 0, height: -3 },
    elevation: 8,
  },
  footerItem: {
    flex: 1,
    minHeight: 48,
    borderRadius: 12,
    alignItems: "center",
    justifyContent: "center",
    gap: 2,
  },
  footerItemActive: { backgroundColor: "#EAF8EF" },
  footerItemPressed: { opacity: 0.78, transform: [{ scale: 0.98 }] },
  footerLabel: { color: MUTED, fontSize: 11, lineHeight: 14, fontWeight: "700" },
  footerLabelActive: { color: BRAND_GREEN, fontWeight: "900" },
  overlay: { ...StyleSheet.absoluteFillObject, backgroundColor: OVERLAY },
  drawerPanel: {
    position: "absolute",
    left: 0,
    top: 0,
    bottom: 0,
    backgroundColor: BACKGROUND,
    borderTopRightRadius: 14,
    borderBottomRightRadius: 14,
    overflow: "hidden",
    shadowColor: FOREGROUND,
    shadowOpacity: 0.18,
    shadowRadius: 18,
    shadowOffset: { width: 4, height: 0 },
    elevation: 14,
  },
});
