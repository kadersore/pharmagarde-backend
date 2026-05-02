# PharmaGarde BF Backend

Ce dépôt contient le backend **Express/TypeScript** de PharmaGarde BF. Il expose des routes REST publiques directes pour les pharmacies, les structures de santé, les cliniques et la recherche de proximité, tout en conservant les routes serveur historiques du projet.

## Démarrage local

Installez les dépendances avec `pnpm install`, puis démarrez le serveur de développement avec `pnpm dev`. Le serveur expose par défaut l’API sur le port `3000`.

| Commande | Rôle |
|---|---|
| `pnpm dev` | Lance le backend en mode développement. |
| `pnpm build` | Compile le backend TypeScript dans `dist/index.js` avec esbuild. |
| `pnpm start` | Lance le backend compilé. |
| `pnpm check` | Vérifie TypeScript sans générer de fichiers. |
| `pnpm db:push` | Génère et applique les migrations Drizzle si la base de données est activée. |

## Routes REST publiques

Les routes publiques sont déclarées directement avec Express avant les middlewares historiques du projet. Elles ne nécessitent aucun préfixe caché comme `/api`.

| Route | Réponse |
|---|---|
| `GET /` | Texte brut `API OK` |
| `GET /health` | `{ "status": "ok" }` |
| `GET /pharmacies?city=Koudougou` | Objet JSON contenant `pharmacies`, `data` et `meta`, filtré strictement par ville si `city` ou `ville` est fourni. |
| `GET /pharmacies/nearby?lat=12.3714&lng=-1.5197&limit=10` | Objet JSON contenant les pharmacies issues du cache PharmaGarde public. |
| `GET /healthcare?city=Koudougou` | Objet JSON contenant `healthcare`, `data` et `meta`, filtré strictement par ville si `city` ou `ville` est fourni. |
| `GET /clinics` | Tableau JSON de cliniques et hôpitaux, vide si `GOOGLE_MAPS_API_KEY` n’est pas configurée. |
| `GET /clinics/nearby?lat=12.3714&lng=-1.5197&limit=10` | Tableau JSON de cliniques triées par distance croissante. |
| `GET /cliniques` | Alias francophone de `GET /clinics`. |
| `GET /cliniques/nearby?lat=12.3714&lng=-1.5197&limit=10` | Alias francophone de `GET /clinics/nearby`. |

## Intégration Google Places

L’archive `pharmagarde-backend-render-final.zip` a été intégrée dans la structure TypeScript existante du dépôt. Le service `server/services/googlePlacesService.ts` reprend la logique Google Places de l’archive avec recherche Nearby Search, enrichissement Place Details pour le téléphone, cache mémoire et rafraîchissement automatique.

| Élément | Configuration |
|---|---|
| Source pharmacies | Google Places `type=pharmacy` |
| Source cliniques | Google Places `type=hospital` |
| Villes couvertes par le cache PharmaGarde | Ouagadougou, Bobo-Dioulasso, Koudougou, Ouahigouya, Kaya, Tenkodogo, Fada N'gourma, Dori, Gaoua, Banfora, Ziniaré, Dédougou et Manga |
| Villes couvertes par l’ancien service `/clinics` | Ouagadougou et Bobo-Dioulasso |
| Cache mémoire | TTL configuré par `CACHE_TTL_HOURS`, 24 heures par défaut |
| Recherche nearby | Distance calculée en kilomètres avec tri croissant |
| Repli sans clé API | Réponse tableau vide afin que Render et les tests restent disponibles |

## Variables d’environnement

Les fichiers `.env` réels sont exclus du dépôt pour éviter toute exposition de secrets. Sur Render, renseignez les valeurs sensibles dans l’onglet **Environment** du service.

| Variable | Obligatoire | Valeur par défaut | Rôle |
|---|---:|---|---|
| `NODE_ENV` | Non | `production` sur Render | Mode d’exécution. |
| `PORT` | Non | `3000` | Port HTTP du serveur. |
| `GOOGLE_MAPS_API_KEY` | Oui pour les données réelles | Aucune | Clé Google Maps/Places utilisée par Nearby Search et Place Details. |
| `GOOGLE_PLACES_API_KEY` | Non | `GOOGLE_MAPS_API_KEY` | Alias accepté par le cache public PharmaGarde. |
| `PHARMAGARDE_CACHE_DIR` | Non | `server/.cache` | Répertoire local des caches JSON par ville. |
| `PHARMAGARDE_GOOGLE_RADIUS_METERS` | Non | `15000` | Rayon de recherche du cache public PharmaGarde. |
| `PHARMAGARDE_ADMIN_TOKEN` | Recommandé en production | Aucune | Jeton d’accès pour `POST /admin/update-data`. |
| `CACHE_TTL_HOURS` | Non | `24` | Durée de validité du cache mémoire. |
| `GOOGLE_PLACES_RADIUS_METERS` | Non | `25000` | Rayon de recherche autour des villes configurées. |
| `GOOGLE_PLACES_MAX_PAGES` | Non | `1` | Nombre maximal de pages Nearby Search, limité à 3. |
| `GOOGLE_DETAILS_CONCURRENCY` | Non | `3` | Nombre d’appels Place Details exécutés en parallèle. |
| `CORS_ORIGIN` | Non | Origine de la requête | Origine CORS autorisée. |

## Déploiement Render

Ce backend est prêt pour Render avec une compilation TypeScript via **esbuild**. La commande de build génère `dist/index.js`, puis `pnpm start` lance le serveur compilé.

| Paramètre Render | Valeur recommandée |
|---|---|
| Build Command | `pnpm install --frozen-lockfile && pnpm build` |
| Start Command | `pnpm start` |
| Health Check Path | `/health` |
| Runtime | Node.js |

Le fichier `render.yaml` peut être utilisé comme blueprint Render. La variable `GOOGLE_MAPS_API_KEY` est déclarée avec `sync: false`, ce qui signifie qu’elle doit être renseignée manuellement dans Render.

## Structure

| Dossier | Contenu |
|---|---|
| `server/_core/` | Point d’entrée Express et services serveur historiques. |
| `server/services/` | Services applicatifs, dont l’intégration Google Places. |
| `drizzle/` | Schéma, relations et migrations de base de données. |
| `shared/` | Types et constantes partagés côté serveur. |
| `scripts/` | Scripts de validation locale des endpoints REST compilés. |

## Notes de sécurité

Ce dépôt ne doit pas contenir de clés API, de mots de passe, de jetons OAuth ou d’URL de base de données réelles. Utilisez les variables d’environnement de Render ou de votre plateforme d’hébergement pour les valeurs sensibles.
