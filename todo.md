# Project TODO

- [x] Reproduire la navigation principale avec quatre onglets : Accueil, Cliniques, Médicaments, Carte.
- [x] Ajouter une barre supérieure globale avec menu, titre centré, favoris et recherche.
- [x] Ajouter un menu latéral avec tous les écrans demandés.
- [x] Intégrer les appels API externes sans données fictives locales.
- [x] Intégrer la géolocalisation Expo avec état de permission et fallback test web.
- [x] Afficher pharmacies et cliniques proches avec distance, appel, itinéraire et favoris.
- [x] Afficher les médicaments essentiels avec image distante, catégorie, type et favoris.
- [x] Ajouter une carte ou vue cartographique testable compatible web et Expo.
- [x] Ajouter la recherche globale sur pharmacies, cliniques et médicaments.
- [x] Persister les favoris localement avec AsyncStorage.
- [x] Créer le branding et l’icône personnalisée de PharmaGarde BF.
- [x] Valider TypeScript, tests ou vérifications disponibles, puis sauvegarder un checkpoint final.
- [x] Intégrer Google Maps API avec clé configurable, carte Web Google et préparation mobile Expo.

- [x] Diagnostiquer et corriger les erreurs Expo Go et Web

- [ ] Implémenter un mode démo avec données fictives locales pour tester sans API réelle
- [ ] Ajouter des filtres avancés : pharmacies de garde, heures d'ouverture, catégories de médicaments
- [ ] Intégrer le calcul d'itinéraire Google Maps avec directions
- [ ] Implémenter les notifications push pour les pharmacies de garde
- [ ] Ajouter un écran de détail enrichi pour chaque pharmacie/clinique
- [ ] Optimiser la performance de la carte avec clustering de marqueurs
- [ ] Tester sur Expo Go avec QR code
- [ ] Générer APK Android pour installation directe

- [x] Corriger dans Flutter la localisation pour utiliser Ouagadougou par défaut si la permission GPS est refusée ou si le service est désactivé
- [x] Ajouter dans Flutter un message utilisateur non bloquant : "Localisation refusée. Résultats basés sur Ouagadougou."
- [x] Ajouter dans Flutter un bouton "Activer la localisation" pour réessayer la permission GPS
- [x] Valider la compilation Flutter après correction de la localisation


- [x] Comparer l’APK Flutter initial et la version Expo/React Native pour identifier les différences de fonctionnalités, d’interface et de livraison
- [x] Définir quelle version doit devenir la référence officielle de PharmaGarde BF

- [x] Définir Expo / React Native comme version officielle de référence pour PharmaGarde BF
- [x] Aligner la gestion de localisation Expo avec le comportement attendu : position réelle si autorisée, sinon Ouagadougou par défaut
- [x] Afficher dans Expo le message exact : "Localisation refusée. Résultats basés sur Ouagadougou."
- [x] Ajouter ou harmoniser dans Expo le bouton "Activer la localisation" pour relancer la demande GPS
- [x] Valider TypeScript et sauvegarder un checkpoint Expo après alignement
