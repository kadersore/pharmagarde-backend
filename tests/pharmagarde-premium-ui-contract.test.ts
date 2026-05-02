import { describe, expect, it } from "vitest";
import { readFileSync } from "node:fs";
import { join } from "node:path";

const root = process.cwd();
const read = (relativePath: string) => readFileSync(join(root, relativePath), "utf8");

describe("premium ui contract", () => {
  it("conserve une page Carte map-first avec bottom sheet, filtres et skeleton loading", () => {
    const carte = read("app/(tabs)/carte.tsx");

    expect(carte).toContain("<PharmaMap");
    expect(carte).toContain("PanResponder.create");
    expect(carte).toContain("snap.full");
    expect(carte).toContain("snap.mid");
    expect(carte).toContain("snap.min");
    expect(carte).toContain("SkeletonCard");
    expect(carte).toContain("local-pharmacy");
    expect(carte).toContain("local-hospital");
    expect(carte).toContain("directions");
    expect(carte).toContain("favorite");
  });

  it("applique un shell premium global avec drawer animé, blur et transitions", () => {
    const shell = read("components/pharmagarde/app-shell.tsx");

    expect(shell).toContain("BlurView");
    expect(shell).toContain("DrawerOverlay");
    expect(shell).toContain("DrawerBackdrop");
    expect(shell).toContain('Platform.OS === "android"');
    expect(shell).toContain("Animated.timing");
    expect(shell).toContain("contentOpacity");
    expect(shell).toContain("usePremiumPalette");
    expect(shell).toContain("haptic.light");
  });

  it("évite l’imbrication du shell global dans le layout des onglets", () => {
    const tabsLayout = read("app/(tabs)/_layout.tsx");
    const appUi = read("components/pharmagarde/app-ui.tsx");

    expect(tabsLayout).not.toContain("GlobalAppShell");
    expect(appUi).toContain("return <GlobalAppShell subtitle={subtitle}>{children}</GlobalAppShell>;");
  });

  it("centralise la palette et les haptics premium autour du vert PharmaGarde", () => {
    const premiumUi = read("lib/pharmagarde/premium-ui.ts");
    const theme = read("theme.config.js");

    expect(premiumUi).toContain("#03C04A");
    expect(premiumUi).toContain("usePremiumPalette");
    expect(premiumUi).toContain("ImpactFeedbackStyle.Light");
    expect(premiumUi).toContain("selectionAsync");
    expect(theme).toContain("#03C04A");
    expect(theme).toContain("#101512");
  });
});

describe("cartes médicaments", () => {
  it("force le format FCFA et masque les détails jusqu’au clic", () => {
    const appUi = read("components/pharmagarde/app-ui.tsx");

    expect(appUi).toContain("export function formatMedicinePrice");
    expect(appUi).toContain("toLocaleString(\"fr-FR\")} FCFA");
    expect(appUi).toContain("const [expanded, setExpanded] = useState(false)");
    expect(appUi).toContain("setExpanded((current) => !current)");
    expect(appUi).toContain("{expanded ? (");
    expect(appUi).toContain("styles.medicineDetails");
  });
});
