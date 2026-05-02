import { PremiumMapExperience } from "@/components/pharmagarde/premium-map-experience";
import { usePharmaGarde } from "@/lib/pharmagarde/app-state";

export default function MapScreen() {
  const { pharmacies, clinics } = usePharmaGarde();
  const places = [...pharmacies, ...clinics];

  return (
    <PremiumMapExperience
      places={places}
      title="Carte santé autour de vous"
      subtitle="Pharmacies et cliniques synchronisées en temps réel"
      emptyTitle="Aucun point de santé disponible"
      emptyMessage="Les pharmacies et cliniques apparaîtront ici dès que l’API renverra des données exploitables."
    />
  );
}
