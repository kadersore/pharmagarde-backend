# Correction frontend — distances basées sur une `referenceLocation` valide

Ce dépôt est désormais la cible GitHub demandée pour conserver les corrections PharmaGarde. La correction Expo/mobile du calcul des distances a été déposée ici sous forme de patch traçable dans `frontend-patches/2026-05-03-reference-location-distance.patch`.

La correction introduit une `referenceLocation` cohérente : lorsque `isManualCitySelection` vaut `true`, les distances utilisent les coordonnées de la ville sélectionnée ; sinon, elles utilisent la position GPS utilisateur. Les coordonnées des 13 villes burkinabè supportées sont centralisées et les coordonnées absentes ou invalides ne sont jamais utilisées pour calculer une distance. Dans ce cas, l’interface affiche `Distance indisponible`.

Le patch provient du commit Expo `ad4acf02f9709c89149c6bf520fa7969ecc4ebc9`, précédemment validé par TypeScript, Vitest et lint côté application mobile.
