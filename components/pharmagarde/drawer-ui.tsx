import MaterialIcons from "@expo/vector-icons/MaterialIcons";
import { PropsWithChildren } from "react";
import { StyleSheet, Text, Pressable, View } from "react-native";

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
        <Text style={styles.heroSubtitle}>Préférences, contribution et services</Text>
      </View>
      <Pressable
        accessibilityRole="button"
        accessibilityLabel="Fermer le menu"
        android_ripple={{ color: "rgba(3,192,74,0.16)", borderless: false }}
        style={({ pressed }) => [styles.closeButton, pressed && styles.pressed]}
        onPress={onClose}
      >
        <MaterialIcons name="close" size={21} color={BRAND_GREEN} />
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
  description,
  value,
  active,
  onPress,
}: {
  icon: DrawerIconName;
  title: string;
  description?: string;
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
      <View style={styles.rowText}>
        <Text style={[styles.rowTitle, active && styles.activeRowTitle]}>{title}</Text>
        {description ? <Text style={styles.rowDescription}>{description}</Text> : null}
      </View>
      {value ? <Text style={styles.rowValue}>{value}</Text> : null}
      <MaterialIcons name="chevron-right" size={22} color={active ? BRAND_GREEN : MUTED} />
    </Pressable>
  );
}

export function DrawerChoiceRow<T extends string>({
  icon,
  title,
  description,
  options,
  value,
  onChange,
}: {
  icon: DrawerIconName;
  title: string;
  description?: string;
  options: readonly T[];
  value: T;
  onChange: (next: T) => void;
}) {
  return (
    <View style={styles.choiceRow}>
      <View style={styles.choiceHeader}>
        <View style={styles.rowIcon}>
          <MaterialIcons name={icon} size={21} color={BRAND_GREEN} />
        </View>
        <View style={styles.rowText}>
          <Text style={styles.rowTitle}>{title}</Text>
          {description ? <Text style={styles.rowDescription}>{description}</Text> : null}
        </View>
      </View>
      <View style={styles.segmented}>
        {options.map((option) => {
          const selected = value === option;
          return (
            <Pressable
              key={option}
              accessibilityRole="button"
              accessibilityState={{ selected }}
              android_ripple={{ color: "rgba(255,255,255,0.25)", borderless: false }}
              style={({ pressed }) => [styles.segment, selected && styles.activeSegment, pressed && styles.pressed]}
              onPress={() => onChange(option)}
            >
              <Text style={[styles.segmentText, selected && styles.activeSegmentText]}>{option}</Text>
            </Pressable>
          );
        })}
      </View>
    </View>
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
  hero: { margin: 16, marginBottom: 10, padding: 16, borderRadius: 14, backgroundColor: BRAND_GREEN, flexDirection: "row", alignItems: "center", gap: 12, shadowColor: "#062F16", shadowOpacity: 0.14, shadowRadius: 14, shadowOffset: { width: 0, height: 6 }, elevation: 4 },
  heroIcon: { width: 50, height: 50, borderRadius: 12, alignItems: "center", justifyContent: "center", backgroundColor: "rgba(255,255,255,0.2)", borderWidth: 1, borderColor: "rgba(255,255,255,0.35)" },
  heroText: { flex: 1 },
  kicker: { color: "#E8FFF0", fontSize: 11, lineHeight: 15, fontWeight: "900", letterSpacing: 0.8, textTransform: "uppercase" },
  heroTitle: { color: "#FFFFFF", fontSize: 23, lineHeight: 29, fontWeight: "900", marginTop: 2 },
  heroSubtitle: { color: "#E8FFF0", fontSize: 12, lineHeight: 17, fontWeight: "700", marginTop: 3 },
  closeButton: { width: 42, height: 42, borderRadius: 10, alignItems: "center", justifyContent: "center", backgroundColor: "#FFFFFF" },
  sectionWrap: { marginHorizontal: 16, marginTop: 18 },
  sectionTitle: { color: FOREGROUND, fontSize: 16, lineHeight: 22, fontWeight: "900", letterSpacing: 0.4, textTransform: "uppercase", marginBottom: 9 },
  sectionCard: { borderRadius: 12, backgroundColor: SURFACE, borderWidth: 1, borderColor: BORDER, overflow: "hidden", shadowColor: "#092A13", shadowOpacity: 0.06, shadowRadius: 10, shadowOffset: { width: 0, height: 4 }, elevation: 2 },
  row: { minHeight: 70, paddingHorizontal: 14, paddingVertical: 11, flexDirection: "row", alignItems: "center", gap: 12, borderBottomWidth: StyleSheet.hairlineWidth, borderBottomColor: BORDER, backgroundColor: SURFACE },
  activeRow: { backgroundColor: "#F0FFF5" },
  pressed: { opacity: 0.78, transform: [{ scale: 0.995 }] },
  rowIcon: { width: 42, height: 42, borderRadius: 10, alignItems: "center", justifyContent: "center", backgroundColor: "#EAF8EF" },
  activeRowIcon: { backgroundColor: BRAND_GREEN },
  rowText: { flex: 1 },
  rowTitle: { color: FOREGROUND, fontSize: 15, lineHeight: 20, fontWeight: "900" },
  activeRowTitle: { color: DARK_GREEN },
  rowDescription: { color: MUTED, fontSize: 12, lineHeight: 17, marginTop: 2, fontWeight: "600" },
  rowValue: { maxWidth: 92, color: DARK_GREEN, fontSize: 12, lineHeight: 17, fontWeight: "900", textAlign: "right" },
  choiceRow: { paddingHorizontal: 14, paddingVertical: 14, borderBottomWidth: StyleSheet.hairlineWidth, borderBottomColor: BORDER, backgroundColor: SURFACE },
  choiceHeader: { flexDirection: "row", alignItems: "center", gap: 12 },
  segmented: { flexDirection: "row", flexWrap: "wrap", gap: 8, marginTop: 12, marginLeft: 54 },
  segment: { minHeight: 36, minWidth: 78, paddingHorizontal: 13, borderRadius: 9, alignItems: "center", justifyContent: "center", backgroundColor: "#F6FBF8", borderWidth: 1, borderColor: BORDER },
  activeSegment: { backgroundColor: BRAND_GREEN, borderColor: BRAND_GREEN },
  segmentText: { color: FOREGROUND, fontSize: 12, lineHeight: 16, fontWeight: "900" },
  activeSegmentText: { color: "#FFFFFF" },
  footer: { margin: 16, marginTop: 18, padding: 16, borderRadius: 12, backgroundColor: "#EAF8EF", borderWidth: 1, borderColor: BORDER, flexDirection: "row", alignItems: "center", justifyContent: "space-between", gap: 10 },
  footerText: { flex: 1, color: MUTED, fontSize: 12, lineHeight: 17, fontWeight: "700" },
  footerBadge: { flexDirection: "row", alignItems: "center", gap: 5, paddingHorizontal: 10, paddingVertical: 7, borderRadius: 8, backgroundColor: "#FFFFFF" },
  footerBadgeText: { color: DARK_GREEN, fontSize: 12, fontWeight: "900" },
});
