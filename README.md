# PharmaGarde BF Backend

Ce dépôt contient le backend **Express/tRPC** de PharmaGarde BF. Il expose le serveur API, les routes tRPC, les helpers de base de données Drizzle et les services serveur associés.

## Démarrage local

Installez les dépendances avec `pnpm install`, copiez `.env.example` vers `.env`, puis renseignez les variables nécessaires. Le serveur de développement démarre avec `pnpm dev` et expose par défaut l’API sur le port `3000`.

| Commande | Rôle |
|---|---|
| `pnpm dev` | Lance le backend en mode développement. |
| `pnpm build` | Compile le backend dans `dist/`. |
| `pnpm start` | Lance le backend compilé. |
| `pnpm check` | Vérifie TypeScript. |
| `pnpm db:push` | Génère et applique les migrations Drizzle. |

## Déploiement Render

Ce backend est prêt pour Render avec une compilation TypeScript via **esbuild**. La commande de build génère le fichier exécutable `dist/index.js`, et la commande de démarrage lance exactement `node dist/index.js` via `pnpm start`.

| Paramètre Render | Valeur recommandée |
|---|---|
| Build Command | `pnpm install --frozen-lockfile && pnpm build` |
| Start Command | `pnpm start` |
| Health Check Path | `/health` |
| Runtime | Node.js |

Les routes de vérification suivantes sont disponibles après démarrage du serveur.

| Route | Réponse |
|---|---|
| `GET /` | `API OK` |
| `GET /health` | `{ "status": "ok" }` |
| `GET /api/health` | Réponse historique avec `ok` et `timestamp` |

Le fichier `render.yaml` peut être utilisé comme blueprint Render. Si vous configurez le service manuellement dans Render, gardez les mêmes commandes afin que le dossier `dist/` soit généré avant le démarrage.

## Variables d’environnement

Le fichier `.env.example` liste les variables attendues. Les fichiers `.env` réels sont exclus du dépôt pour éviter toute exposition de secrets. Sur Render, renseignez les valeurs sensibles dans l’onglet **Environment** du service, notamment les variables de base de données si vous activez PostgreSQL ou MySQL.

## Structure

| Dossier | Contenu |
|---|---|
| `server/` | Point d’entrée Express, routes tRPC et services backend. |
| `drizzle/` | Schéma, relations et migrations de base de données. |
| `shared/` | Types et constantes partagés côté serveur. |

## Notes de sécurité

Ce dépôt ne doit pas contenir de clés API, de mots de passe, de jetons OAuth ou d’URL de base de données réelles. Utilisez les variables d’environnement de votre plateforme d’hébergement pour les valeurs sensibles.
