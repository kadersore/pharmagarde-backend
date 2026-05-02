# Design mobile — PharmaGarde BF Expo

## Orientation générale

La version Expo de **PharmaGarde BF** est pensée pour une utilisation mobile en **portrait 9:16**, avec des actions accessibles à une main et une hiérarchie visuelle adaptée aux situations d’urgence. L’interface doit rester directe : aucun écran de connexion, aucune étape bloquante, et un accès immédiat aux pharmacies, cliniques, médicaments et à la carte.

| Élément de design | Décision |
|---|---|
| Style | Mobile moderne inspiré des interfaces iOS : surfaces claires, cartes arrondies, typographie lisible, actions immédiates. |
| Couleur principale | **#03C04A**, vert santé demandé pour les actions prioritaires et les éléments actifs. |
| Couleur secondaire | **#0B74DE**, bleu clinique utilisé pour distinguer les cliniques et les repères médicaux non pharmaceutiques. |
| Fond | **#F6FBF8**, fond vert très pâle pour réduire la fatigue visuelle. |
| Texte principal | **#102016**, contraste fort sur fond clair. |
| Alerte / erreur | **#D92D20**, utilisé uniquement pour les messages d’échec API ou de permission. |

## Liste des écrans

| Écran | Contenu principal | Fonctionnalités |
|---|---|---|
| Accueil / Pharmacies | Cartes de pharmacies proches provenant de l’API, distance, téléphone éventuel, adresse éventuelle. | Rechargement, favori, appel, itinéraire, recherche globale. |
| Cliniques | Cartes de cliniques proches provenant de l’API. | Rechargement, favori, appel, itinéraire. |
| Médicaments | Liste des médicaments essentiels provenant de l’API, image distante si fournie, catégorie, type. | Favori, recherche globale. |
| Carte | Zone de carte testable sur web avec représentation des points pharmacie/clinique et coordonnées. | Ouverture d’itinéraire, différenciation pharmacie/clinique. |
| Favoris | Vue consolidée des favoris enregistrés localement. | Retrait rapide des favoris et rappel du type d’élément. |
| Recherche | Résultats fusionnés pharmacies, cliniques et médicaments. | Recherche textuelle sans authentification. |
| Menu latéral | Paramètres et écrans d’information demandés : mode, langue, type de carte, ville, nouvelle pharmacie, confidentialité, conditions, aide, contact, à propos, signalement, abonnement. | Navigation vers des contenus informatifs et actions non bloquantes. |

## AppBar et navigation

La première version utilisait une barre supérieure fixe et une navigation par onglets en bas. La refonte premium remplace cette structure rigide par une composition **stacked UI** : les actions principales deviennent flottantes, la carte occupe tout l’arrière-plan et les listes sont déplacées dans un panneau bas dynamique. Les onglets restent disponibles pour ne pas casser la navigation existante, mais ils sont visuellement intégrés comme une barre flottante compacte au-dessus du bord inférieur.

## Flux utilisateur clés

| Flux | Étapes |
|---|---|
| Trouver une pharmacie | L’utilisateur ouvre l’application → autorise ou refuse la position → l’application appelle `/pharmacies/nearby` → la carte et la liste synchronisée s’affichent → l’utilisateur appelle ou ouvre l’itinéraire. |
| Trouver une clinique | L’utilisateur touche l’onglet Cliniques ou consulte la carte → les cliniques proches sont chargées depuis `/cliniques/nearby` → l’utilisateur sélectionne un marker ou une carte → l’utilisateur appelle ou ouvre l’itinéraire. |
| Consulter un médicament | L’utilisateur touche Médicaments → l’application charge `/medicaments` → l’utilisateur filtre avec la recherche ou ajoute en favori. |
| Utiliser les favoris | L’utilisateur touche l’icône cœur → l’écran favoris liste les éléments enregistrés localement → l’utilisateur peut les retirer. |
| Tester sans backend configuré | L’application affiche un message clair indiquant que l’URL API doit être configurée, sans afficher de données fictives. |

## Refonte UI/UX premium map-first — Mai 2026

La nouvelle direction d’interface de **PharmaGarde BF** adopte une composition **map-first** en orientation portrait 9:16, pensée pour une utilisation à une main. La carte devient le fond fonctionnel permanent des écrans d’accueil, de carte et de proximité, tandis que les contrôles, listes et détails deviennent des couches flottantes hiérarchisées. Cette approche remplace les pages verticales rigides par une expérience proche de Google Maps et Uber, avec une priorité donnée à la localisation, aux actions rapides et à la compréhension immédiate de l’état des pharmacies et cliniques.

| Écran | Contenu principal | Fonctionnalité premium attendue |
|---|---|---|
| Accueil / Carte | Carte plein écran, markers pharmacies et cliniques, header flottant, bottom sheet des lieux proches | Recherche, ouverture du menu, favoris/filtres, sélection carte-liste synchronisée, changement d’état du bottom sheet |
| Cliniques | Liste des cliniques dans le même langage visuel de cartes premium | Cartes avec statut, distance, appel, itinéraire et favori, feedback tactile |
| Médicaments | Catalogue conservé, harmonisé par la nouvelle palette et cartes plus propres | Lecture claire, surfaces premium et dark mode cohérent |
| Menu latéral | Drawer glissant avec overlay sombre et effet verre/blur léger | Préférences, contribution, informations, abonnement, fermeture fluide |
| Recherche / Favoris | Modaux utilitaires | Accès rapide depuis le header flottant et cohérence typographique |

Les flux principaux sont les suivants. L’utilisateur ouvre l’application, voit immédiatement la carte et les points de santé proches, puis peut tirer le panneau bas vers le haut pour parcourir la liste. Un appui sur une carte focalise la carte sur le marker correspondant et met le marker en état actif. Un appui sur un marker met à son tour l’item correspondant en évidence dans la liste. Les actions **Appeler**, **Itinéraire** et **Favori** restent disponibles directement dans chaque carte, avec micro-interactions de scale et retour haptique léger lorsque la plateforme le permet.

La palette garde la couleur principale **#03C04A**, utilisée pour les pharmacies, les actions positives, les badges actifs et les états sélectionnés. Le bleu **#0B74DE** distingue les cliniques. Le mode clair utilise des surfaces blanches légèrement translucides, un fond de carte clair et des ombres vert profond très faibles. Le mode sombre évite le noir pur et privilégie **#101815** pour le fond, **#1B2520** pour les panneaux, **#F2F7F3** pour les textes principaux et **#A9B8AE** pour les textes secondaires. Les transitions visuelles doivent rester rapides, entre 200 et 300 ms, afin de donner une impression de fluidité sans ralentir les actions urgentes.

## Contraintes de données

L’application ne doit pas embarquer de données métier fictives. En l’absence d’API configurée, les écrans affichent des états vides ou des messages de configuration. Les favoris peuvent être testés lorsque des données réelles arrivent de l’API, car l’état local conserve uniquement des identifiants et métadonnées issues de l’API.
