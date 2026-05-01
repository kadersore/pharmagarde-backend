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

## Variables d’environnement

Le fichier `.env.example` liste les variables attendues. Les fichiers `.env` réels sont exclus du dépôt pour éviter toute exposition de secrets.

## Structure

| Dossier | Contenu |
|---|---|
| `server/` | Point d’entrée Express, routes tRPC et services backend. |
| `drizzle/` | Schéma, relations et migrations de base de données. |
| `shared/` | Types et constantes partagés côté serveur. |

## Notes de sécurité

Ce dépôt ne doit pas contenir de clés API, de mots de passe, de jetons OAuth ou d’URL de base de données réelles. Utilisez les variables d’environnement de votre plateforme d’hébergement pour les valeurs sensibles.
