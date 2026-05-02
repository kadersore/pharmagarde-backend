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

- [x] Identifier précisément le backend PharmaGarde BF à publier sur GitHub
- [x] Vérifier et exclure tout fichier sensible avant publication publique
- [x] Préparer le dépôt Git local backend pour GitHub
- [x] Créer un repository GitHub public et pousser le backend après confirmation
- [x] Fournir le lien du repository GitHub public

- [x] Publier le backend dans un repository GitHub public nommé `pharmagarde-backend`

- [x] Créer et livrer une archive ZIP propre du backend `pharmagarde-backend`, sans fichiers sensibles ni `node_modules`

- [x] Adapter le backend `pharmagarde-backend` pour Render avec scripts `build` et `start`
- [x] Générer un dossier `dist` exécutable avec `node dist/index.js`
- [x] Ajouter les routes GET `/` et GET `/health` au backend
- [x] Valider localement le build et les endpoints Render du backend
- [x] Livrer une archive ZIP finale prête pour Render

- [x] Publier le backend prêt pour Render sur un dépôt GitHub public et fournir le lien public

- [ ] Ajouter une route REST publique `GET /pharmacies` retournant les pharmacies en JSON simple
- [ ] Ajouter une route REST publique `GET /pharmacies/nearby?lat=...&lng=...` retournant les pharmacies proches
- [ ] Ajouter une route REST publique `GET /clinics` retournant les cliniques en JSON simple
- [ ] Valider que les routes REST fonctionnent sans tRPC et que le build Render reste opérationnel
- [ ] Mettre à jour la version backend livrable prête pour Render avec les routes REST

- [x] Envoyer à l’utilisateur la version Expo actuelle de l’application PharmaGarde BF.

- [x] Remplacer le contenu actuel du menu latéral par les éléments de navigation, préférences locales et actions rapides demandés.
- [x] Créer les fonctionnalités nécessaires pour changer le mode, la langue, le type de carte et la ville.
- [x] Nettoyer la page d’accueil en supprimant tous les éléments situés au-dessus de « Pharmacies proches ».
- [x] Remplacer le premier bloc de la page Cliniques par le titre « Cliniques et Centres de soins ».
- [x] Générer et afficher une liste de médicaments essentiels courants au Burkina Faso avec image, nom, catégorie, type et prix approximatif en FCFA.
- [x] Remplacer le premier bloc de la page Carte par un titre de page et supprimer les éléments situés en bas de la carte.
- [x] Appliquer la couleur verte au header de l’application.
- [x] Améliorer les éléments visuels et logiques utiles tout en conservant les flux principaux.

- [x] Refactoriser le drawer PharmaGarde en sections Références, Contribution, Informations et Services.
- [x] Ajouter une icône, un effet de clic, un état actif et un espacement clair pour chaque élément du menu latéral.
- [x] Rendre fonctionnels le mode clair/sombre, la langue FR/EN, le type de carte et le changement de ville depuis le drawer.
- [x] Créer ou relier les écrans Nouvelle Pharmacie, Signaler un problème, pages informations et Abonnement.
- [x] Ajouter une animation d’ouverture fluide du drawer sans casser la navigation mobile.
- [x] Valider TypeScript et tests après refactorisation du drawer.

- [x] Refactoriser l’application avec un layout global persistant qui encapsule toutes les pages.
- [x] Rendre le header global persistant avec menu à gauche, titre centré, favoris et recherche à droite.
- [x] Rendre le footer global persistant avec navigation Accueil, Cliniques, Médicaments et Cartes sans duplication de code.
- [x] Modifier le drawer pour limiter sa largeur à environ 75–85% sur mobile.
- [x] Ajouter un overlay sombre, une fermeture au clic extérieur et une animation fluide d’ouverture/fermeture du drawer.
- [x] Harmoniser les arrondis des cartes, sections et conteneurs avec un style plus discret et professionnel.
- [x] Ajouter des ombres légères et transitions douces aux éléments visuels clés.
- [x] Valider TypeScript, tests et état Expo après la refonte globale UI/UX.

- [x] Supprimer les textes descriptifs sous les liens du drawer et ne garder que l’icône et le titre.
- [x] Remplacer les choix Ville, Langue et Type de carte du drawer par des popups de sélection fluides avec retour visuel.
- [x] Remplacer le choix Clair/Sombre du drawer par un switch unique « Mode sombre » persistant et indépendant du thème téléphone.
- [x] Augmenter la largeur du drawer de 20px sans dépasser environ 85% de l’écran.
- [x] Modifier le header du drawer en bloc plein collé en haut, sans espace supérieur ni arrondis inférieurs.
- [x] Déplacer le bouton de fermeture en haut à droite du drawer et le garder accessible.
- [x] Valider TypeScript, tests et état Expo après correction du drawer.

- [x] Corriger le mode sombre pour qu’il utilise uniquement un thème interne global sans modifier le thème du téléphone.
- [x] Sauvegarder et restaurer le choix clair/sombre depuis le stockage persistant de l’application.
- [x] Vérifier que le thème interne s’applique aux backgrounds, textes, cartes, header, footer et drawer.
- [x] Remplacer les popups de sélection par des modals centrés horizontalement et verticalement.
- [x] Ajouter overlay sombre, bouton X, fermeture au clic extérieur, retour visuel de sélection et animation fade/scale aux modals.
- [x] Valider TypeScript, tests et état Expo après correction du thème interne et des modals centrés.

- [x] Implémenter un cache serveur global persistant pour pharmacies avec TTL 24h
- [x] Implémenter un cache serveur global persistant pour healthcare avec TTL 7 jours
- [x] Charger les données locales au démarrage du serveur comme source principale
- [x] Ajouter des mises à jour planifiées serveur pour pharmacies toutes les 24h et healthcare tous les 7 jours
- [x] Empêcher les endpoints publics de déclencher des appels directs à Google API
- [x] Optimiser GET /pharmacies et GET /healthcare pour lire uniquement le cache/local storage
- [x] Ajouter un fallback retournant les dernières données disponibles si Google API échoue
- [x] Ajouter POST /admin/update-data pour forcer la mise à jour manuelle
- [x] Ajouter ou adapter le cache côté client mobile pour limiter les appels au serveur
- [x] Valider TypeScript, tests et état Expo après optimisation backend
- [x] Sauvegarder un checkpoint de livraison après optimisation backend

- [x] Refactoriser l’interface vers une architecture premium map-first inspirée de Google Maps et Uber
- [x] Transformer la page Carte en carte plein écran entre header et footer avec overlays dynamiques
- [x] Implémenter un bottom sheet draggable avec états minimisé, intermédiaire et plein écran
- [x] Afficher pharmacies et cliniques dans le bottom sheet avec cartes modernes, scroll fluide et actions appel/itinéraire/favori
- [x] Ajouter des marqueurs personnalisés, un marqueur actif sélectionné et des interactions de zoom/press fluides
- [x] Remplacer le header par une barre de recherche premium avec bouton menu et favori
- [x] Moderniser le menu latéral avec slide, overlay sombre, blur léger, icônes et espacements premium
- [x] Appliquer un dark mode professionnel global avec palette sombre élégante et transition cohérente
- [x] Ajouter micro-interactions globales : fade, scale, slide, feedback tactile et transitions rapides
- [x] Ajouter skeleton loading, états de chargement et feedback d’erreur utilisateur
- [x] Harmoniser typographie, espacements, arrondis, ombres et couleur principale #03C04A dans toute l’application
- [x] Valider TypeScript, Vitest et état Expo après refonte UI/UX premium
- [x] Sauvegarder un checkpoint de livraison après refonte UI/UX premium

- [x] Corriger la duplication du header et du footer visible à l’ouverture de l’application
- [x] Vérifier qu’un seul shell global est rendu sur l’écran d’accueil et les onglets
- [x] Valider TypeScript, Vitest et état Expo après correction du double header/footer
- [x] Sauvegarder un checkpoint de livraison après correction du double header/footer
- [x] Corriger l’erreur fatale déclenchée dans Expo au clic sur l’icône menu
- [x] Vérifier la compatibilité mobile du drawer premium, notamment blur, animations et overlay
- [x] Ajouter un test anti-régression couvrant le menu latéral et l’absence d’import natif instable
- [x] Valider TypeScript, Vitest et état Expo après correction du crash menu
- [x] Sauvegarder un checkpoint de livraison après correction du crash menu

- [x] Simplifier l’effet de sélection des éléments sur la page Carte avec uniquement une bordure verte pour les pharmacies et bleue pour les cliniques
- [x] Simplifier les marqueurs de la carte avec un symbole traditionnel de lieu vert pour les pharmacies et bleu pour les cliniques
- [x] Supprimer les titres de pages sur l’accueil et la page Cliniques
- [x] Utiliser la géolocalisation au démarrage pour déterminer la ville utilisateur et filtrer les éléments selon cette ville
- [x] Mettre à jour automatiquement la ville et les éléments affichés lorsque l’utilisateur change de lieu
- [x] Faire en sorte que le bouton Ma position sur la carte synchronise automatiquement la ville dans les paramètres et recharge les éléments du lieu détecté
- [x] Valider TypeScript, Vitest et état Expo après les ajustements carte, titres et géolocalisation
- [x] Sauvegarder un checkpoint de livraison après les ajustements carte, titres et géolocalisation

- [x] Appliquer la couleur verte de marque au header global de l’application
- [x] Valider TypeScript et état Expo après modification de la couleur du header
- [x] Sauvegarder un checkpoint de livraison après modification de la couleur du header

- [x] Appliquer un vert plus clair que le header aux boutons et à la barre de recherche du header
- [x] Valider TypeScript, Vitest et état Expo après ajustement des éléments du header
- [x] Sauvegarder un checkpoint de livraison après ajustement vert clair des éléments du header

- [x] Supprimer les sous-sections « références » et « prix indicatif » de la première section de la page Médicaments
- [x] Supprimer la section erreur API de la page Médicaments
- [x] Inverser les positions du bouton favoris et du prix dans les éléments de liste de la page Médicaments
- [x] Valider TypeScript, Vitest et état Expo après modifications de la page Médicaments
- [x] Sauvegarder un checkpoint de livraison après modifications de la page Médicaments

- [x] Corriger les prix de la liste des médicaments pour afficher systématiquement la devise FCFA
- [x] Masquer par défaut la partie inférieure des cartes médicaments contenant type, forme, favoris et détails
- [x] Afficher ou masquer la partie inférieure de chaque carte médicament au clic
- [x] Ajouter ou adapter les tests de non-régression pour le format FCFA et le comportement dépliable des cartes médicaments
- [x] Valider TypeScript, Vitest et état Expo après correction des cartes médicaments
- [x] Sauvegarder un checkpoint de livraison après correction des cartes médicaments

- [x] Inverser la position de la distance et du bouton favoris dans les cartes pharmacies
- [x] Placer le statut sous la nouvelle position de la distance dans les cartes pharmacies
- [x] Inverser la position de la distance et du bouton favoris dans les cartes cliniques
- [x] Placer le statut sous la nouvelle position de la distance dans les cartes cliniques
- [x] Ajouter ou adapter les tests de non-régression pour la disposition distance, favoris et statut
- [x] Valider TypeScript, Vitest et état Expo après réorganisation des cartes pharmacies et cliniques
- [x] Sauvegarder un checkpoint de livraison après réorganisation des cartes pharmacies et cliniques

- [x] Diagnostiquer l’erreur ExpoAsset.downloadAsync liée aux URLs d’assets invalides de type http://8081
- [x] Corriger la configuration de base URL des assets pour utiliser un host valide dans l’environnement Manus
- [x] Forcer le chargement local des assets Expo lorsque l’URL distante est invalide
- [x] Vérifier et corriger les imports @expo/vector-icons pour garantir l’affichage des icônes
- [x] Nettoyer et reconfigurer le bundler Expo après correction des assets
- [x] Ajouter ou adapter les tests de non-régression pour la configuration assets et icônes
- [x] Valider TypeScript, Vitest et état Expo après correction du chargement des assets
- [x] Sauvegarder un checkpoint de livraison après correction des assets Expo

- [x] Ajouter la note Google Maps sur la même ligne que le favori dans les cartes pharmacies
- [x] Ajouter le numéro de téléphone sur la même ligne que le favori dans les cartes pharmacies
- [x] Ajouter la note Google Maps sur la même ligne que le favori dans les cartes cliniques
- [x] Ajouter le numéro de téléphone sur la même ligne que le favori dans les cartes cliniques
- [x] Masquer par défaut la partie inférieure des cartes pharmacies contenant favori, note, téléphone et boutons
- [x] Masquer par défaut la partie inférieure des cartes cliniques contenant favori, note, téléphone et boutons
- [x] Afficher ou masquer la partie inférieure des cartes pharmacies et cliniques au clic
- [x] Ajouter ou adapter les tests de non-régression pour les cartes pharmacies et cliniques repliables
- [x] Valider TypeScript, Vitest et état Expo après modification des cartes pharmacies et cliniques
- [x] Sauvegarder un checkpoint de livraison après modification des cartes pharmacies et cliniques repliables

- [x] Aligner la position de la distance dans les cartes pharmacies de la page Carte avec les autres pages de liste
- [x] Aligner la position du statut dans les cartes pharmacies de la page Carte avec les autres pages de liste
- [x] Aligner la position de la distance dans les cartes cliniques de la page Carte avec les autres pages de liste
- [x] Aligner la position du statut dans les cartes cliniques de la page Carte avec les autres pages de liste
- [x] Ajouter ou adapter les tests de non-régression pour la disposition distance/statut sur la page Carte
- [x] Valider TypeScript, Vitest et état Expo après ajustement des cartes de la page Carte
- [x] Sauvegarder un checkpoint de livraison après alignement distance/statut sur la page Carte

- [x] Remplacer la liste actuelle des villes par Ouagadougou, Bobo-Dioulasso, Koudougou, Ouahigouya, Kaya, Tenkodogo, Fada N'gourma, Dori, Gaoua, Banfora, Ziniaré, Dédougou et Manga
- [x] Vérifier que les sélecteurs et filtres de ville utilisent uniquement la nouvelle liste de 13 villes
- [x] Adapter les tests de non-régression liés aux villes et filtres géographiques
- [x] Valider TypeScript, Vitest et état Expo après remplacement de la liste des villes
- [x] Sauvegarder un checkpoint de livraison après remplacement de la liste des villes

- [x] Implémenter un accordion exclusif sur les listes de pharmacies et cliniques afin qu’une seule carte soit ouverte à la fois
- [x] Synchroniser le comportement exclusif des cartes repliables sur la page Carte si applicable
- [x] Ajouter ou adapter les tests UI pour vérifier la fermeture automatique de la carte précédemment ouverte
- [x] Valider TypeScript, Vitest et état Expo après l’accordion exclusif
- [x] Sauvegarder un checkpoint de livraison pour l’accordion exclusif

- [x] Lire la documentation backend avant modification du serveur PharmaGarde
- [x] Définir côté backend les 13 villes burkinabè supportées avec leurs coordonnées
- [x] Étendre la collecte Google Places pour récupérer pharmacies et structures de santé pour chaque ville
- [x] Stocker et exposer le champ city dans les résultats backend mis en cache
- [x] Modifier GET /pharmacies?city=... pour filtrer par ville sans casser le comportement existant
- [x] Modifier GET /healthcare?city=... pour filtrer par ville sans casser le comportement existant
- [x] Mettre en cache les données multi-villes afin d’éviter les appels Google répétés à chaque requête
- [x] Ajouter une mise à jour planifiée du cache Google Places multi-villes
- [x] Ajouter ou adapter les tests backend pour la collecte, le cache, le filtrage par ville et la compatibilité existante
- [x] Valider TypeScript, Vitest et état serveur après correction backend multi-villes
- [x] Sauvegarder un checkpoint de livraison pour le backend multi-villes

- [x] Identifier la logique de tri actuelle des listes d’établissements PharmaGarde
- [x] Afficher les établissements ouverts avant les établissements fermés ou au statut inconnu
- [x] Trier chaque groupe d’établissements par distance croissante, du plus proche au plus loin
- [x] Ajouter ou adapter les tests pour vérifier le tri ouvert puis distance
- [x] Valider TypeScript, Vitest et état serveur après modification du tri
- [x] Sauvegarder un checkpoint de livraison pour le tri ouvert puis proximité

- [x] Diagnostiquer pourquoi `GET /pharmacies?city=Koudougou` retourne des données d’autres villes
- [x] Garantir l’ajout du champ `city` sur chaque pharmacie lors du stockage cache/backend
- [x] Associer strictement chaque résultat Google Places à la ville collectée lors de la récupération
- [x] Corriger `GET /pharmacies` pour filtrer par `req.query.city` avec comparaison insensible à la casse
- [x] Conserver le retour de toutes les pharmacies uniquement lorsqu’aucune ville n’est fournie
- [x] Ajouter des logs backend indiquant la ville demandée et le nombre de pharmacies retournées
- [x] Ajouter ou adapter les tests pour vérifier que chaque ville retourne uniquement ses pharmacies
- [x] Valider TypeScript, Vitest et état serveur après correction du filtrage par ville
- [x] Sauvegarder un checkpoint de livraison pour la correction du filtrage pharmacies par ville

- [x] Repenser le stockage backend pour organiser les pharmacies par clé de ville normalisée
- [x] Repenser le stockage backend pour organiser les structures de santé par clé de ville normalisée
- [x] Supprimer la dépendance à l’ancien cache global plat pour les endpoints publics
- [x] Lors de la récupération Google, utiliser les coordonnées de chaque ville et stocker les résultats sous la clé de ville correspondante
- [x] Modifier `GET /pharmacies` pour retourner uniquement `pharmaciesByCity[city]` quand `city` est fourni
- [x] Modifier `GET /healthcare` pour retourner uniquement `healthcareByCity[city]` quand `city` est fourni
- [x] Conserver le retour de toutes les villes uniquement lorsque `city` est absent
- [x] Ajouter les logs ville demandée et nombre de résultats retournés pour pharmacies et structures de santé
- [x] Ajouter des tests vérifiant que Koudougou, Kaya, Ziniaré et autres villes ne retournent pas Ouagadougou/Bobo
- [x] Valider TypeScript, Vitest et état serveur après refactorisation cache par ville
- [x] Sauvegarder un checkpoint de livraison pour la correction définitive du filtrage par ville

- [x] Corriger l’état vide client qui affiche “API réelle attendue” pour les villes secondaires ayant des données backend
- [x] Vérifier que le changement de ville déclenche un chargement backend `GET /pharmacies?city=<ville>` et `GET /healthcare?city=<ville>`
- [x] Remplacer le message générique par un état vide précis uniquement lorsque le backend renvoie réellement zéro résultat
- [x] Ajouter des tests anti-régression côté client pour l’état vide des villes secondaires
- [x] Valider TypeScript, Vitest et état serveur après correction de l’état vide par ville
- [x] Sauvegarder un checkpoint de livraison pour la correction de l’affichage des villes secondaires

- [x] Vérifier l’état Git local et le dépôt distant GitHub de l’application Expo
- [x] Commiter la version corrigée des villes secondaires et de l’état vide client
- [x] Pousser la version Expo corrigée sur GitHub
- [x] Vérifier le lien GitHub et confirmer le push à l’utilisateur

- [x] Corriger l’erreur `Cannot GET /healthcare` sur le serveur Express réellement exécuté
- [x] Ajouter ou vérifier la route REST publique `GET /healthcare`
- [x] Ajouter ou vérifier la route REST publique `GET /pharmacies`
- [x] Confirmer que les routes REST sont déclarées avant tout middleware susceptible de les masquer
- [x] Vérifier que le fichier principal exécuté contient bien ces routes
- [x] Vérifier que le build génère `dist/index.js` avec les routes `/healthcare` et `/pharmacies`
- [x] Tester localement les endpoints `/healthcare` et `/pharmacies` après build
- [x] Sauvegarder, pousser et confirmer la correction des routes REST publiques
