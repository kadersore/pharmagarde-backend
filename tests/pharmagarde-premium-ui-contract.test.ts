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
    expect(shell).toContain("Animated.timing");
    expect(shell).toContain("contentOpacity");
    expect(shell).toContain("usePremiumPalette");
    expect(shell).toContain("haptic.light");
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
