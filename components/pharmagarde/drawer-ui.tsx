import MaterialIcons from "@expo/vector-icons/MaterialIcons";
import { PropsWithChildren } from "react";
import { FlatList, Modal, Pressable, StyleSheet, Switch, Text, View } from "react-native";

const BRAND_GREEN = "#03C04A";
const DARK_GREEN = "#02983B";
const BACKGROUND = "#F6FBF8";
const FOREGROUND = "#102016";
const MUTED = "#667085";
const BORDER = "#D6EBDD";
const SURFACE = "#FFFFFF";

export type DrawerIconName = keyof typeof MaterialIcons.glyphMap;

export function DrawerHero({ onClose }: { onClose: () => void }) {
  return (
    <View style={styles.hero}>
      <View style={styles.heroIcon}>
        <MaterialIcons name="local-pharmacy" size={25} color="#FFFFFF" />
      </View>
      <View style={styles.heroText}>
        <Text style={styles.kicker}>Menu</Text>
        <Text style={styles.heroTitle}>PharmaGarde BF</Text>
      </View>
      <Pressable
        accessibilityRole="button"
        accessibilityLabel="Fermer le menu"
        android_ripple={{ color: "rgba(3,192,74,0.16)", borderless: false }}
        style={({ pressed }) => [styles.closeButton, pressed && styles.pressed]}
        onPress={onClose}
      >
        <MaterialIcons name="close" size={22} color={BRAND_GREEN} />
      </Pressable>
    </View>
  );
}

export function DrawerSection({ title, children }: PropsWithChildren<{ title: string }>) {
  return (
    <View style={styles.sectionWrap}>
      <Text style={styles.sectionTitle}>{title}</Text>
      <View style={styles.sectionCard}>{children}</View>
    </View>
  );
}

export function DrawerActionRow({
  icon,
  title,
  value,
  active,
  onPress,
}: {
  icon: DrawerIconName;
  title: string;
  value?: string;
  active?: boolean;
  onPress: () => void;
}) {
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityState={{ selected: !!active }}
      android_ripple={{ color: "rgba(3,192,74,0.12)", borderless: false }}
      style={({ pressed }) => [styles.row, active && styles.activeRow, pressed && styles.pressed]}
      onPress={onPress}
    >
      <View style={[styles.rowIcon, active && styles.activeRowIcon]}>
        <MaterialIcons name={icon} size={21} color={active ? "#FFFFFF" : BRAND_GREEN} />
      </View>
      <Text style={[styles.rowTitle, active && styles.activeRowTitle]} numberOfLines={1}>{title}</Text>
      {value ? <Text style={styles.rowValue} numberOfLines={1}>{value}</Text> : null}
      <MaterialIcons name="chevron-right" size={22} color={active ? BRAND_GREEN : MUTED} />
    </Pressable>
  );
}

export function DrawerSelectRow({
  icon,
  title,
  value,
  onPress,
}: {
  icon: DrawerIconName;
  title: string;
  value: string;
  onPress: () => void;
}) {
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={`${title} : ${value}`}
      android_ripple={{ color: "rgba(3,192,74,0.12)", borderless: false }}
      style={({ pressed }) => [styles.row, pressed && styles.pressed]}
      onPress={onPress}
    >
      <View style={styles.rowIcon}>
        <MaterialIcons name={icon} size={21} color={BRAND_GREEN} />
      </View>
      <Text style={styles.rowTitle} numberOfLines={1}>{title}</Text>
      <Text style={styles.rowValue} numberOfLines={1}>{value}</Text>
      <MaterialIcons name="expand-more" size={22} color={MUTED} />
    </Pressable>
  );
}

export function DrawerSwitchRow({
  icon,
  title,
  value,
  onValueChange,
}: {
  icon: DrawerIconName;
  title: string;
  value: boolean;
  onValueChange: (next: boolean) => void;
}) {
  return (
    <View style={styles.row}>
      <View style={styles.rowIcon}>
        <MaterialIcons name={icon} size={21} color={BRAND_GREEN} />
      </View>
      <Text style={styles.rowTitle} numberOfLines={1}>{title}</Text>
      <Switch
        accessibilityRole="switch"
        accessibilityLabel={title}
        value={value}
        onValueChange={onValueChange}
        trackColor={{ false: "#D6EBDD", true: "rgba(3,192,74,0.36)" }}
        thumbColor={value ? BRAND_GREEN : "#FFFFFF"}
        ios_backgroundColor="#D6EBDD"
      />
    </View>
  );
}

export function DrawerSelectionModal<T extends string>({
  visible,
  title,
  options,
  value,
  onSelect,
  onClose,
}: {
  visible: boolean;
  title: string;
  options: readonly T[];
  value: T;
  onSelect: (next: T) => void;
  onClose: () => void;
}) {
  return (
    <Modal visible={visible} transparent animationType="fade" statusBarTranslucent onRequestClose={onClose}>
      <View style={styles.modalRoot}>
        <Pressable accessibilityRole="button" accessibilityLabel="Fermer la sélection" style={StyleSheet.absoluteFill} onPress={onClose} />
        <View style={styles.sheet}>
          <View style={styles.sheetHandle} />
          <View style={styles.sheetHeader}>
            <Text style={styles.sheetTitle}>{title}</Text>
            <Pressable accessibilityRole="button" accessibilityLabel="Fermer" style={({ pressed }) => [styles.sheetClose, pressed && styles.pressed]} onPress={onClose}>
              <MaterialIcons name="close" size={20} color={MUTED} />
            </Pressable>
          </View>
          <FlatList
            data={[...options]}
            keyExtractor={(item) => item}
            scrollEnabled={options.length > 6}
            contentContainerStyle={styles.sheetList}
            renderItem={({ item }) => {
              const selected = item === value;
              return (
                <Pressable
                  accessibilityRole="button"
                  accessibilityState={{ selected }}
                  android_ripple={{ color: "rgba(3,192,74,0.12)", borderless: false }}
                  style={({ pressed }) => [styles.optionRow, selected && styles.selectedOptionRow, pressed && styles.pressed]}
                  onPress={() => onSelect(item)}
                >
                  <Text style={[styles.optionText, selected && styles.selectedOptionText]}>{item}</Text>
                  {selected ? <MaterialIcons name="check-circle" size={22} color={BRAND_GREEN} /> : null}
                </Pressable>
              );
            }}
          />
        </View>
      </View>
    </Modal>
  );
}

export function DrawerFooter() {
  return (
    <View style={styles.footer}>
      <Text style={styles.footerText}>Version communautaire · Burkina Faso</Text>
      <View style={styles.footerBadge}>
        <MaterialIcons name="verified" size={15} color={DARK_GREEN} />
        <Text style={styles.footerBadgeText}>#03C04A</Text>
      </View>
    </View>
  );
}

export const drawerColors = {
  brandGreen: BRAND_GREEN,
  darkGreen: DARK_GREEN,
  background: BACKGROUND,
  foreground: FOREGROUND,
  muted: MUTED,
  border: BORDER,
  surface: SURFACE,
};

const styles = StyleSheet.create({
  hero: { width: "100%", minHeight: 92, paddingHorizontal: 18, paddingTop: 18, paddingBottom: 16, backgroundColor: BRAND_GREEN, flexDirection: "row", alignItems: "center", gap: 12, shadowColor: "#062F16", shadowOpacity: 0.12, shadowRadius: 10, shadowOffset: { width: 0, height: 4 }, elevation: 3 },
  heroIcon: { width: 50, height: 50, borderRadius: 12, alignItems: "center", justifyContent: "center", backgroundColor: "rgba(255,255,255,0.2)", borderWidth: 1, borderColor: "rgba(255,255,255,0.35)" },
  heroText: { flex: 1, paddingRight: 48 },
  kicker: { color: "#E8FFF0", fontSize: 11, lineHeight: 15, fontWeight: "900", letterSpacing: 0.8, textTransform: "uppercase" },
  heroTitle: { color: "#FFFFFF", fontSize: 23, lineHeight: 29, fontWeight: "900", marginTop: 2 },
  closeButton: { position: "absolute", top: 18, right: 16, width: 42, height: 42, borderRadius: 10, alignItems: "center", justifyContent: "center", backgroundColor: "#FFFFFF" },
  sectionWrap: { marginHorizontal: 16, marginTop: 16 },
  sectionTitle: { color: FOREGROUND, fontSize: 14, lineHeight: 20, fontWeight: "900", letterSpacing: 0.4, textTransform: "uppercase", marginBottom: 8 },
  sectionCard: { borderRadius: 12, backgroundColor: SURFACE, borderWidth: 1, borderColor: BORDER, overflow: "hidden", shadowColor: "#092A13", shadowOpacity: 0.06, shadowRadius: 10, shadowOffset: { width: 0, height: 4 }, elevation: 2 },
  row: { minHeight: 58, paddingHorizontal: 14, paddingVertical: 8, flexDirection: "row", alignItems: "center", gap: 12, borderBottomWidth: StyleSheet.hairlineWidth, borderBottomColor: BORDER, backgroundColor: SURFACE },
  activeRow: { backgroundColor: "#F0FFF5" },
  pressed: { opacity: 0.78, transform: [{ scale: 0.995 }] },
  rowIcon: { width: 38, height: 38, borderRadius: 10, alignItems: "center", justifyContent: "center", backgroundColor: "#EAF8EF" },
  activeRowIcon: { backgroundColor: BRAND_GREEN },
  rowTitle: { flex: 1, color: FOREGROUND, fontSize: 15, lineHeight: 20, fontWeight: "900" },
  activeRowTitle: { color: DARK_GREEN },
  rowValue: { maxWidth: 120, color: DARK_GREEN, fontSize: 12, lineHeight: 17, fontWeight: "900", textAlign: "right" },
  modalRoot: { flex: 1, justifyContent: "flex-end", backgroundColor: "rgba(16, 32, 22, 0.38)" },
  sheet: { maxHeight: "78%", marginHorizontal: 10, marginBottom: 10, borderRadius: 16, backgroundColor: SURFACE, borderWidth: 1, borderColor: BORDER, overflow: "hidden", shadowColor: "#102016", shadowOpacity: 0.18, shadowRadius: 18, shadowOffset: { width: 0, height: -4 }, elevation: 16 },
  sheetHandle: { alignSelf: "center", width: 42, height: 4, borderRadius: 2, marginTop: 10, marginBottom: 4, backgroundColor: "#D6EBDD" },
  sheetHeader: { minHeight: 54, paddingHorizontal: 16, flexDirection: "row", alignItems: "center", justifyContent: "space-between", borderBottomWidth: StyleSheet.hairlineWidth, borderBottomColor: BORDER },
  sheetTitle: { color: FOREGROUND, fontSize: 18, lineHeight: 24, fontWeight: "900" },
  sheetClose: { width: 38, height: 38, borderRadius: 10, alignItems: "center", justifyContent: "center", backgroundColor: "#F6FBF8" },
  sheetList: { padding: 12, gap: 8 },
  optionRow: { minHeight: 52, borderRadius: 12, borderWidth: 1, borderColor: BORDER, backgroundColor: "#FFFFFF", paddingHorizontal: 14, flexDirection: "row", alignItems: "center", justifyContent: "space-between", gap: 12 },
  selectedOptionRow: { backgroundColor: "#F0FFF5", borderColor: BRAND_GREEN },
  optionText: { flex: 1, color: FOREGROUND, fontSize: 15, lineHeight: 21, fontWeight: "800" },
  selectedOptionText: { color: DARK_GREEN, fontWeight: "900" },
  footer: { margin: 16, marginTop: 16, padding: 14, borderRadius: 12, backgroundColor: "#EAF8EF", borderWidth: 1, borderColor: BORDER, flexDirection: "row", alignItems: "center", justifyContent: "space-between", gap: 10 },
  footerText: { flex: 1, color: MUTED, fontSize: 12, lineHeight: 17, fontWeight: "700" },
  footerBadge: { flexDirection: "row", alignItems: "center", gap: 5, paddingHorizontal: 10, paddingVertical: 7, borderRadius: 8, backgroundColor: "#FFFFFF" },
  footerBadgeText: { color: DARK_GREEN, fontSize: 12, fontWeight: "900" },
});
