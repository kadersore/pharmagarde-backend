import { describe, expect, it } from "vitest";
import { readFileSync } from "node:fs";
import { join } from "node:path";

const root = process.cwd();
const readProjectFile = (path: string) => readFileSync(join(root, path), "utf8");

describe("drawer PharmaGarde", () => {
  it("présente les quatre sections demandées et les actions principales", () => {
    const menu = readProjectFile("components/pharmagarde/menu-content.tsx");

    for (const section of ["Références", "Contribution", "Informations", "Services"]) {
      expect(menu).toContain(`title=\"${section}\"`);
    }

    for (const label of ["Mode", "Langue", "Type de carte", "Changer de ville", "Nouvelle Pharmacie", "Signaler un problème", "Abonnement"]) {
      expect(menu).toContain(label);
    }
  });

  it("relie le drawer aux écrans et préférences nécessaires", () => {
    const menu = readProjectFile("components/pharmagarde/menu-content.tsx");
    const mapScreen = readProjectFile("app/(tabs)/carte.tsx");

    expect(menu).toContain("updatePreference(\"mode\"");
    expect(menu).toContain("updatePreference(\"language\"");
    expect(menu).toContain("updatePreference(\"mapType\"");
    expect(menu).toContain("/pharmagarde/ville");
    expect(menu).toContain("/pharmagarde/contribution/nouvelle-pharmacie");
    expect(menu).toContain("/pharmagarde/contribution/signaler-probleme");
    expect(menu).toContain("/pharmagarde/info/");
    expect(menu).toContain("/pharmagarde/abonnement");
    expect(mapScreen).toContain("mapType={preferences.mapType}");
  });
});
