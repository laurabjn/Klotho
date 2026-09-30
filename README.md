# Klotho

Dressing intelligent : numériser sa garde-robe et générer des tenues à partir des pièces qu'on possède réellement.

## Monorepo

| Workspace                | Rôle                                                 |
| ------------------------ | ---------------------------------------------------- |
| `apps/api`               | API NestJS + Prisma (PostgreSQL), Clean Architecture |
| `apps/mobile`            | App Expo (iOS / Android), Expo Router                |
| `packages/shared`        | Types et validateurs partagés API / mobile           |
| `packages/i18n`          | Traductions fr / en                                  |
| `packages/eslint-config` | Configuration ESLint commune (Node / TypeScript)     |

Les tâches sont orchestrées par Turborepo.

## Prérequis

- Node.js 24+
- Docker Desktop (PostgreSQL local)
- Expo Go ou un émulateur Android / iOS

## Démarrage

```sh
npm install
cp apps/api/.env.example apps/api/.env
npm run db:up                         # PostgreSQL 15
npm run db:deploy -w @klotho/api      # migrations
```

Puis, dans **deux terminaux séparés** :

```sh
npm run dev      # terminal 1 : API (http://localhost:3100) + packages en watch
npm run mobile   # terminal 2 : Expo, avec le QR code à scanner dans Expo Go
```

Expo tourne dans son propre terminal : lancé via Turborepo, il n'est pas
interactif et n'affiche pas le QR code.

## Commandes

```sh
npm run lint        # ESLint sur tous les workspaces
npm run typecheck   # tsc --noEmit
npm run test        # tests unitaires (Jest, RNTL)
npm run test:e2e    # tests HTTP de l'API (Supertest)
npm run build
npm run format      # Prettier
```

La CI GitHub Actions exécute format, lint, typecheck, tests, build, migrations sur base vierge et smoke test API à chaque pull request.
