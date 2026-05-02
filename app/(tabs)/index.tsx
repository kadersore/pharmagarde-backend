import { PremiumMapExperience } from "@/components/pharmagarde/premium-map-experience";
import { usePharmaGarde } from "@/lib/pharmagarde/app-state";

export default function HomeScreen() {
  const { pharmacies } = usePharmaGarde();

  return (
    <PremiumMapExperience
      places={pharmacies}
      filter="pharmacy"
      title="Pharmacies de garde proches"
      subtitle="Carte active, liste fluide et actions rapides"
      emptyTitle="Aucune pharmacie chargée"
      emptyMessage="La version testable attend une API réelle. Ouvrez le menu pour renseigner l’URL du backend puis actualisez."
    />
  );
}
