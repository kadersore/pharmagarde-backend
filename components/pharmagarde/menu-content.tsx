import { usePathname, useRouter } from "expo-router";
import { ScrollView, StyleSheet } from "react-native";

import { DrawerActionRow, DrawerChoiceRow, DrawerFooter, DrawerHero, DrawerSection, drawerColors } from "@/components/pharmagarde/drawer-ui";
import { usePharmaGarde } from "@/lib/pharmagarde/app-state";
import { AppLanguage, AppMode, MapPreference } from "@/lib/pharmagarde/types";

const MODE_OPTIONS: readonly AppMode[] = ["Clair", "Sombre"];
const LANGUAGE_OPTIONS: readonly AppLanguage[] = ["FR", "EN"];
const MAP_OPTIONS: readonly MapPreference[] = ["Standard", "Satellite"];

const INFORMATION_ITEMS = [
  {
    id: "politique-confidentialite",
    icon: "privacy-tip" as const,
    title: "Politique de confidentialité",
    description: "Gestion des données locales et permissions.",
  },
  {
    id: "conditions-utilisation",
    icon: "gavel" as const,
    title: "Conditions d’utilisation",
    description: "Règles d’usage de PharmaGarde BF.",
  },
  {
    id: "aide-assistance",
    icon: "support-agent" as const,
    title: "Aide et assistance",
    description: "Comprendre la recherche, la carte et les favoris.",
  },
  {
    id: "contactez-nous",
    icon: "alternate-email" as const,
    title: "Contactez-nous",
    description: "Canaux de contact pour l’équipe projet.",
  },
  {
    id: "a-propos",
    icon: "info" as const,
    title: "À propos de nous",
    description: "Mission, vision et approche communautaire.",
  },
];

type MenuContentProps = {
  onClose: () => void;
};

export function MenuContent({ onClose }: MenuContentProps) {
  const router = useRouter();
  const pathname = usePathname();
  const { preferences, updatePreference } = usePharmaGarde();

  const navigate = (href: string) => {
    onClose();
    router.push(href as never);
  };

  return (
    <ScrollView style={styles.page} contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
      <DrawerHero onClose={onClose} />

      <DrawerSection title="Références">
        <DrawerChoiceRow
          icon="dark-mode"
          title="Mode"
          description="Bascule immédiate entre thème clair et sombre."
          options={MODE_OPTIONS}
          value={preferences.mode}
          onChange={(value) => updatePreference("mode", value)}
        />
        <DrawerChoiceRow
          icon="translate"
          title="Langue"
          description="Préparé pour l’internationalisation FR / EN."
          options={LANGUAGE_OPTIONS}
          value={preferences.language}
          onChange={(value) => updatePreference("language", value)}
        />
        <DrawerChoiceRow
          icon="map"
          title="Type de carte"
          description="Change l’affichage Google Maps quand la carte est disponible."
          options={MAP_OPTIONS}
          value={preferences.mapType}
          onChange={(value) => updatePreference("mapType", value)}
        />
        <DrawerActionRow
          icon="location-city"
          title="Changer de ville"
          description="Sélectionner la ville de référence des recherches."
          value={preferences.city}
          active={pathname.includes("/pharmagarde/ville")}
          onPress={() => navigate("/pharmagarde/ville")}
        />
      </DrawerSection>

      <DrawerSection title="Contribution">
        <DrawerActionRow
          icon="add-business"
          title="Nouvelle Pharmacie"
          description="Proposer une officine à vérifier et ajouter."
          active={pathname.includes("nouvelle-pharmacie")}
          onPress={() => navigate("/pharmagarde/contribution/nouvelle-pharmacie")}
        />
        <DrawerActionRow
          icon="report-problem"
          title="Signaler un problème"
          description="Adresse, horaire, téléphone ou donnée incorrecte."
          active={pathname.includes("signaler-probleme")}
          onPress={() => navigate("/pharmagarde/contribution/signaler-probleme")}
        />
      </DrawerSection>

      <DrawerSection title="Informations">
        {INFORMATION_ITEMS.map((item) => (
          <DrawerActionRow
            key={item.id}
            icon={item.icon}
            title={item.title}
            description={item.description}
            active={pathname.includes(`/pharmagarde/info/${item.id}`)}
            onPress={() => navigate(`/pharmagarde/info/${item.id}`)}
          />
        ))}
      </DrawerSection>

      <DrawerSection title="Services">
        <DrawerActionRow
          icon="workspace-premium"
          title="Abonnement"
          description="Découvrir les options premium à venir."
          active={pathname.includes("/pharmagarde/abonnement")}
          onPress={() => navigate("/pharmagarde/abonnement")}
        />
      </DrawerSection>

      <DrawerFooter />
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  page: { flex: 1, backgroundColor: drawerColors.background },
  content: { paddingBottom: 28 },
});
