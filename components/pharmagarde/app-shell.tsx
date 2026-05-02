import MaterialIcons from "@expo/vector-icons/MaterialIcons";
import { BlurView } from "expo-blur";
import { usePathname, useRouter } from "expo-router";
import { PropsWithChildren, ReactNode, useEffect, useMemo, useRef, useState } from "react";
import { ActivityIndicator, Animated, Platform, Pressable, StyleSheet, Text, View, useWindowDimensions } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import { ScreenContainer } from "@/components/screen-container";
import { MenuContent } from "@/components/pharmagarde/menu-content";
import { useColors } from "@/hooks/use-colors";
import { usePharmaGarde } from "@/lib/pharmagarde/app-state";

const BRAND_GREEN = "#03C04A";
const BACKGROUND = "#F6FBF8";
const FOREGROUND = "#102016";
const MUTED = "#667085";
const BORDER = "#D6EBDD";
const SURFACE = "#FFFFFF";
const OVERLAY = "rgba(6, 18, 12, 0.56)";

const FOOTER_ITEMS = [
  { key: "index", href: "/", label: "Accueil", icon: "home" },
  { key: "cliniques", href: "/cliniques", label: "Cliniques", icon: "local-hospital" },
  { key: "medicaments", href: "/medicaments", label: "Médicaments", icon: "medication" },
  { key: "carte", href: "/carte", label: "Carte", icon: "map" },
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
  const colors = useColors();
  const { loading } = usePharmaGarde();

  return (
    <View style={styles.headerFloating} pointerEvents="box-none">
      <View style={[styles.headerGlass, { backgroundColor: `${colors.surface}F4`, borderColor: colors.border, shadowColor: colors.text }]}> 
        <Pressable
          accessibilityRole="button"
          accessibilityLabel="Ouvrir le menu"
          android_ripple={{ color: "rgba(3,192,74,0.14)", borderless: true }}
          style={({ pressed }) => [styles.headerButton, { backgroundColor: `${BRAND_GREEN}14` }, pressed ? styles.headerButtonPressed : undefined]}
          onPress={onOpenMenu}
        >
          <MaterialIcons name="menu" size={24} color={BRAND_GREEN} />
        </Pressable>

        <Pressable
          accessibilityRole="search"
          accessibilityLabel="Ouvrir la recherche"
          onPress={() => router.push("/pharmagarde/search" as never)}
          style={({ pressed }) => [styles.searchPill, { backgroundColor: `${colors.background}E8`, borderColor: colors.border }, pressed ? styles.searchPillPressed : undefined]}
        >
          <MaterialIcons name="search" size={20} color={BRAND_GREEN} />
          <View style={styles.searchCopy}>
            <Text style={[styles.searchTitle, { color: colors.text }]} numberOfLines={1}>PharmaGarde BF</Text>
            <Text style={[styles.searchSubtitle, { color: colors.muted }]} numberOfLines={1}>{title === "PharmaGarde BF" ? "Rechercher pharmacie, clinique, médicament" : title}</Text>
          </View>
          {loading ? <ActivityIndicator color={BRAND_GREEN} size="small" /> : null}
        </Pressable>

        <View style={styles.headerActions}>
          {rightAccessory ?? null}
          <Pressable
            accessibilityRole="button"
            accessibilityLabel="Ouvrir les favoris"
            android_ripple={{ color: "rgba(3,192,74,0.14)", borderless: true }}
            style={({ pressed }) => [styles.headerButton, { backgroundColor: `${BRAND_GREEN}14` }, pressed ? styles.headerButtonPressed : undefined]}
            onPress={() => router.push("/pharmagarde/favoris" as never)}
          >
            <MaterialIcons name="tune" size={22} color={BRAND_GREEN} />
          </Pressable>
        </View>
      </View>
    </View>
  );
}

function AppFooter() {
  const router = useRouter();
  const pathname = usePathname();
  const colors = useColors();
  const insets = useSafeAreaInsets();
  const bottomOffset = Platform.OS === "web" ? 14 : Math.max(insets.bottom, 10);

  return (
    <View style={[styles.footerFloating, { bottom: bottomOffset }]} pointerEvents="box-none">
      <View style={[styles.footer, { backgroundColor: `${colors.surface}F4`, borderColor: colors.border, shadowColor: colors.text }]}> 
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
              <MaterialIcons name={item.icon} size={22} color={active ? BRAND_GREEN : colors.muted} />
              <Text style={[styles.footerLabel, { color: active ? BRAND_GREEN : colors.muted }, active ? styles.footerLabelActive : undefined]} numberOfLines={1}>{item.label}</Text>
            </Pressable>
          );
        })}
      </View>
    </View>
  );
}

function DrawerOverlay({ visible, onClose }: { visible: boolean; onClose: () => void }) {
  const { width } = useWindowDimensions();
  const colors = useColors();
  const progress = useRef(new Animated.Value(0)).current;
  const [mounted, setMounted] = useState(visible);
  const drawerWidth = Math.min(Math.max(width * 0.8 + 20, 308), width * 0.86, 418);

  useEffect(() => {
    if (visible) {
      setMounted(true);
      Animated.timing(progress, { toValue: 1, duration: 260, useNativeDriver: true }).start();
      return;
    }
    Animated.timing(progress, { toValue: 0, duration: 220, useNativeDriver: true }).start(({ finished }) => {
      if (finished) setMounted(false);
    });
  }, [progress, visible]);

  const overlayOpacity = progress.interpolate({ inputRange: [0, 1], outputRange: [0, 1] });
  const translateX = progress.interpolate({ inputRange: [0, 1], outputRange: [-drawerWidth, 0] });
  const drawerScale = progress.interpolate({ inputRange: [0, 1], outputRange: [0.985, 1] });

  if (!mounted) return null;

  return (
    <View style={StyleSheet.absoluteFill} pointerEvents="box-none">
      <Animated.View style={[styles.overlay, { opacity: overlayOpacity }]}> 
        <BlurView intensity={Platform.OS === "web" ? 18 : 24} tint="dark" style={StyleSheet.absoluteFill} />
        <Pressable accessibilityRole="button" accessibilityLabel="Fermer le menu" style={StyleSheet.absoluteFill} onPress={onClose} />
      </Animated.View>
      <Animated.View style={[styles.drawerPanel, { width: drawerWidth, backgroundColor: colors.background, shadowColor: colors.text, transform: [{ translateX }, { scale: drawerScale }] }]}> 
        <View style={[styles.drawerGlow, { backgroundColor: `${BRAND_GREEN}20` }]} />
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
        <View style={styles.content}>{children}</View>
        <AppHeader title={title} onOpenMenu={() => setDrawerVisible(true)} rightAccessory={rightAccessory} />
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
  content: { flex: 1, backgroundColor: BACKGROUND },
  headerFloating: { position: "absolute", left: 14, right: 14, top: 12, zIndex: 20 },
  headerGlass: {
    minHeight: 62,
    paddingHorizontal: 10,
    paddingVertical: 9,
    borderRadius: 24,
    borderWidth: 1,
    flexDirection: "row",
    alignItems: "center",
    gap: 9,
    shadowOpacity: 0.14,
    shadowRadius: 18,
    shadowOffset: { width: 0, height: 8 },
    elevation: 12,
  },
  headerButton: { width: 44, height: 44, borderRadius: 16, alignItems: "center", justifyContent: "center" },
  headerButtonPressed: { opacity: 0.82, transform: [{ scale: 0.96 }] },
  searchPill: { flex: 1, minHeight: 44, borderRadius: 17, borderWidth: 1, paddingHorizontal: 12, flexDirection: "row", alignItems: "center", gap: 9 },
  searchPillPressed: { opacity: 0.88, transform: [{ scale: 0.985 }] },
  searchCopy: { flex: 1 },
  searchTitle: { fontSize: 13, lineHeight: 16, fontWeight: "900" },
  searchSubtitle: { marginTop: 1, fontSize: 11, lineHeight: 14, fontWeight: "700" },
  headerActions: { flexDirection: "row", alignItems: "center", gap: 6 },
  footerFloating: { position: "absolute", left: 14, right: 14, zIndex: 18 },
  footer: {
    minHeight: 62,
    padding: 7,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    borderRadius: 23,
    borderWidth: 1,
    shadowOpacity: 0.13,
    shadowRadius: 18,
    shadowOffset: { width: 0, height: 8 },
    elevation: 12,
  },
  footerItem: { flex: 1, minHeight: 48, borderRadius: 17, alignItems: "center", justifyContent: "center", gap: 2 },
  footerItemActive: { backgroundColor: "rgba(3,192,74,0.12)" },
  footerItemPressed: { opacity: 0.78, transform: [{ scale: 0.97 }] },
  footerLabel: { fontSize: 10.5, lineHeight: 13, fontWeight: "800" },
  footerLabelActive: { fontWeight: "900" },
  overlay: { ...StyleSheet.absoluteFillObject, backgroundColor: OVERLAY },
  drawerPanel: {
    position: "absolute",
    left: 0,
    top: 0,
    bottom: 0,
    borderTopRightRadius: 28,
    borderBottomRightRadius: 28,
    overflow: "hidden",
    shadowOpacity: 0.22,
    shadowRadius: 22,
    shadowOffset: { width: 6, height: 0 },
    elevation: 18,
  },
  drawerGlow: { position: "absolute", right: -78, top: 52, width: 180, height: 180, borderRadius: 90 },
});
