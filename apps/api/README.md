# @klotho/api

NestJS API of Klotho, organised in Clean Architecture layers.

```
src/
  domain/          Entities, value objects, ports (interfaces). No NestJS, no Prisma.
  application/     Use cases. Depend on domain ports only.
  infrastructure/  Adapters implementing the ports: Prisma repositories, storage, providers.
  interfaces/http/ NestJS controllers and DTOs.
  config/          Environment validation (zod).
  generated/       Prisma client (generated, git-ignored).
```

Dependencies only point inwards. The rule is enforced by ESLint
(`no-restricted-imports` in `eslint.config.mjs`): the domain cannot import
NestJS, Prisma or outer layers, and the application layer cannot import
Prisma or outer layers.

## Local setup

```sh
cp .env.example .env
npm run db:up              # from the repo root: PostgreSQL 15 via Docker
npm run db:deploy          # apply migrations
npm run dev                # http://localhost:3100/health
```

## Scripts

| Script        | Purpose                                          |
| ------------- | ------------------------------------------------ |
| `dev`         | Start in watch mode                              |
| `test`        | Unit tests (`*.spec.ts`)                         |
| `test:e2e`    | HTTP tests with Supertest (`test/*.e2e-spec.ts`) |
| `db:generate` | Generate the Prisma client                       |
| `db:migrate`  | Create and apply a migration (development)       |
| `db:deploy`   | Apply pending migrations (CI / production)       |
| `db:studio`   | Browse the database                              |

Environment files are loaded in this order: `.env.<NODE_ENV>`, then `.env`.
Only `.env.example` is committed.
