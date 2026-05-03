# Correctif frontend : distances basées prioritairement sur le GPS

Ce dossier archive le correctif appliqué à l’application mobile PharmaGarde BF afin de séparer définitivement le filtrage par ville du calcul des distances.

## Règle métier corrigée

`selectedCity` sert uniquement à filtrer les pharmacies, cliniques et médicaments par ville. `userLocation` reste la source prioritaire pour calculer les distances. Le centre de la ville sélectionnée n’est utilisé qu’en fallback lorsqu’aucune position GPS valide n’est disponible.

## Fichiers mobiles concernés

Le patch `frontend-patches/2026-05-03-gps-priority-distance-fix.patch` contient les modifications des fichiers mobiles suivants :

- `lib/pharmagarde/reference-location.ts`
- `lib/pharmagarde/app-state.tsx`
- `tests/reference-location.test.ts`
- `tests/pharmagarde-premium-ui-contract.test.ts`
- `app/pharmagarde/ville.tsx`
- `todo.md`

## Validations effectuées côté application mobile

La correction a été validée avant archivage avec :

- tests ciblés `tests/reference-location.test.ts` et `tests/pharmagarde-premium-ui-contract.test.ts` : 15 tests réussis ;
- `pnpm check` : TypeScript sans erreur ;
- `pnpm vitest run` : 41 tests réussis et 1 test ignoré ;
- `pnpm lint` : réussi ;
- état Expo : serveur actif, LSP sans erreur et TypeScript sans erreur.
