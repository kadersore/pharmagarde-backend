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

describe("cartes pharmacies et cliniques", () => {
  it("place la distance en haut à droite et replie favori, note, téléphone et boutons jusqu’au clic", () => {
    const appUi = read("components/pharmagarde/app-ui.tsx");
    const carte = read("app/(tabs)/carte.tsx");
    const placeCard = appUi.slice(appUi.indexOf("export function PlaceCard"), appUi.indexOf("export function MedicineCard"));
    const mapPlaceCard = carte.slice(carte.indexOf("function MapPlaceCard"), carte.indexOf("export default function CarteScreen"));

    expect(placeCard).toContain("styles.placeHeaderMeta");
    expect(placeCard.indexOf("styles.placeHeaderMeta")).toBeLessThan(placeCard.indexOf("{isExpanded ? ("));
    expect(placeCard).toContain("isExpanded: boolean");
    expect(placeCard).toContain("onToggle: () => void");
    expect(placeCard).toContain("onPress={() => { haptic.selection(); onToggle(); }}");
    expect(placeCard).not.toContain("const [expanded, setExpanded] = useState(false)");
    expect(placeCard).toContain("styles.placeInfoRow");
    expect(placeCard).toContain("ratingLabel");
    expect(placeCard).toContain("phoneLabel");
    expect(placeCard.indexOf("favorite-border")).toBeGreaterThan(placeCard.indexOf("{isExpanded ? ("));
    expect(mapPlaceCard).toContain("styles.placeHeaderMeta");
    expect(mapPlaceCard.indexOf("styles.placeHeaderMeta")).toBeLessThan(mapPlaceCard.indexOf("{isExpanded ? ("));
    expect(mapPlaceCard).toContain("Distance inconnue");
    expect(mapPlaceCard).toContain("Statut inconnu");
    expect(mapPlaceCard).toContain("isExpanded: boolean");
    expect(mapPlaceCard).toContain("onToggle: () => void");
    expect(mapPlaceCard).not.toContain("const [expanded, setExpanded] = useState(false)");
    expect(mapPlaceCard).toContain("styles.placeInfoRow");
    expect(mapPlaceCard).toContain("ratingLabel");
    expect(mapPlaceCard).toContain("phoneLabel");
    expect(appUi).toContain("placeHeaderMeta: { alignItems: \"flex-end\", gap: 6, flexShrink: 0 }");
    expect(carte).toContain("placeHeaderMeta: { alignItems: \"flex-end\", gap: 6, maxWidth: 132 }");
  });

  it("contrôle l’ouverture depuis le parent pour garantir un accordion exclusif", () => {
    const index = read("app/(tabs)/index.tsx");
    const clinics = read("app/(tabs)/cliniques.tsx");
    const carte = read("app/(tabs)/carte.tsx");

    for (const source of [index, clinics, carte]) {
      expect(source).toContain("const [expandedPlaceId, setExpandedPlaceId] = useState<string | undefined>();");
      expect(source).toContain("isExpanded={expandedPlaceId === itemKey}");
      expect(source).toContain("setExpandedPlaceId((current) => current === itemKey ? undefined : itemKey)");
    }
  });

  it("affiche toutes les pharmacies disponibles sur l’accueil sans limitation artificielle", () => {
    const index = read("app/(tabs)/index.tsx");

    expect(index).toContain("data={pharmacies}");
    expect(index).not.toContain("pharmacies.slice(");
  });
});

describe("assets Expo et icônes locales", () => {
  it("normalise les URL d’assets invalides et précharge localement MaterialIcons", () => {
    const expoAssets = read("lib/pharmagarde/expo-assets.ts");
    const rootLayout = read("app/_layout.tsx");
    const metroConfig = read("metro.config.js");
    const packageJson = read("package.json");

    expect(expoAssets).toContain("normalizeExpoAssetUri");
    expect(expoAssets).toContain("parsed.hostname === \"8081\"");
    expect(expoAssets).toContain("Asset.prototype.downloadAsync");
    expect(expoAssets).toContain("Font.loadAsync(MaterialIcons.font)");
    expect(expoAssets).toContain("getBrowserOrigin");
    expect(rootLayout).toContain("preloadLocalIconAssets");
    expect(rootLayout).toContain("installExpoAssetUriFix");
    expect(metroConfig).toContain("config.resolver.assetExts");
    expect(metroConfig).toContain("\"ttf\"");
    expect(packageJson).toContain("dev:metro:clean");
  });
});
