import { PremiumMapExperience } from "@/components/pharmagarde/premium-map-experience";
import { usePharmaGarde } from "@/lib/pharmagarde/app-state";

export default function ClinicsScreen() {
  const { clinics } = usePharmaGarde();

  return (
    <PremiumMapExperience
      places={clinics}
      filter="clinic"
      title="Cliniques et centres de soins"
      subtitle="Sélectionnez une clinique sur la carte ou dans la liste"
      emptyTitle="Aucune clinique disponible"
      emptyMessage="Configurez un backend réel, puis actualisez depuis le panneau de la carte ou le menu."
    />
  );
}
