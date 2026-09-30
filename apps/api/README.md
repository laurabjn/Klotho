# @klotho/api

NestJS API of Klotho, organised in Clean Architecture layers.

```
src/
  domain/          Entities, ports (interfaces), business errors. No NestJS, no Prisma.
  application/     Use cases. Depend on domain ports only.
  infrastructure/  Adapters implementing the ports: Prisma repositories, bcrypt, JWT, mail…
                   infrastructure.module.ts binds every port to its adapter.
  interfaces/http/ NestJS controllers, guards, validation pipe, error filter.
  config/          Environment validation (zod).
  testing/         In-memory fakes of the ports, for use case tests.
  generated/       Prisma client (generated, git-ignored).
```

Dependencies only point inwards. The rule is enforced by ESLint
(`no-restricted-imports` in `eslint.config.mjs`): the domain cannot import
NestJS, Prisma or outer layers, and the application layer cannot import
Prisma or outer layers.

Request bodies are validated with the zod schemas of `@klotho/shared`, the same
ones the mobile forms use. Errors always have the shape
`{ statusCode, code, issues? }`; `code` is stable and used as an i18n key.

## Local setup

```sh
cp .env.example .env       # then set JWT_ACCESS_SECRET (openssl rand -base64 48)
npm run db:up              # from the repo root: PostgreSQL 15 via Docker (port 5433)
npm run db:deploy          # apply migrations
npm run dev                # http://localhost:3100/health
```

## Endpoints

Every route requires `Authorization: Bearer <accessToken>` unless marked public.

| Method | Route                                | Public | Result                                                    |
| ------ | ------------------------------------ | ------ | --------------------------------------------------------- |
| GET    | `/health`                            | yes    | `{ status: 'ok' }`                                        |
| POST   | `/auth/register`                     | yes    | 201 `AuthSession` · 409 email already used                |
| POST   | `/auth/login`                        | yes    | 200 `AuthSession` · 401 invalid credentials               |
| POST   | `/auth/refresh`                      | yes    | 200 `AuthTokens` (rotated) · 401                          |
| POST   | `/auth/logout`                       | yes    | 204 (idempotent)                                          |
| POST   | `/auth/forgot-password`              | yes    | 202, whether or not the email exists                      |
| POST   | `/auth/reset-password`               | yes    | 204 · 400 invalid or expired token                        |
| GET    | `/users/me`                          | no     | `UserProfile`                                             |
| PATCH  | `/users/me`                          | no     | `UserProfile` (only `firstName`, `avatarUrl`)             |
| GET    | `/wardrobe`                          | no     | `Page<WardrobeItem>`, filters and pagination below        |
| POST   | `/wardrobe`                          | no     | 201 `WardrobeItem` (owner = authenticated user)           |
| GET    | `/wardrobe/:id`                      | no     | `WardrobeItem` · 404 if missing or not mine               |
| PATCH  | `/wardrobe/:id`                      | no     | `WardrobeItem` (partial update) · 404                     |
| DELETE | `/wardrobe/:id`                      | no     | 204 · 404                                                 |
| POST   | `/uploads/wardrobe`                  | no     | 201 `UploadedPhoto` (multipart, field `file`) · 413 · 415 |
| POST   | `/wardrobe/:id/photos`               | no     | 201 item · 400 unknown upload · 409 limit (5)             |
| PATCH  | `/wardrobe/:id/photos/:photoId/main` | no     | item (this photo becomes the main one)                    |
| DELETE | `/wardrobe/:id/photos/:photoId`      | no     | item (next photo becomes main)                            |

### Wardrobe list

`GET /wardrobe?page=1&pageSize=24&category=TOP,BOTTOM&color=gold&season=summer&style=chic&status=AVAILABLE&q=levis&sort=recent`

- Every filter is optional; lists are comma separated (OR inside a filter, AND between filters).
- `color` matches the main colour or a secondary one; `q` searches name, brand and sub-category.
- `sort`: `recent` (default), `mostWorn`, `leastWorn`, `alphabetical`. `pageSize` is capped at 100.
- Values (categories, colours, styles…) are the keys of `packages/shared/src/wardrobe/taxonomy.ts`.

### Photos

1. `POST /uploads/wardrobe` receives the picture. The server checks the real
   format (JPEG, PNG or WEBP, whatever the file name), applies the camera
   orientation, bounds it to 1600 px, re-encodes it as JPEG and **drops every
   metadata (EXIF, GPS position)**. It returns a key owned by the user.
2. `POST /wardrobe/:id/photos` attaches that key to an item. A key can only be
   attached by its owner, once.

Files live in a **private** S3-compatible bucket (Cloudflare R2 in production,
the RustFS container locally). Items expose their photos through signed URLs
valid `PHOTO_URL_TTL_SECONDS` (1 hour); the app caches them by photo id.
Deleting a photo or an item deletes the files.

Local storage: `npm run db:up` also starts RustFS on port 9010
(credentials in `.env.example`); the bucket is created at start-up when
`STORAGE_CREATE_BUCKET=true`. On a phone, set `STORAGE_PUBLIC_ENDPOINT` to
`http://<your-PC-IP>:9010` so that photo links are reachable.

### Security notes

- Passwords: bcrypt (cost 12). Policy shared with the app: 8+ characters,
  upper and lower case, digit, special character, 72 bytes max.
- Access token: JWT HS256, 15 minutes, kept in memory by the app.
- Refresh token: 256-bit random, 30 days, single-use. Only its SHA-256 is
  stored. Replaying a used token revokes the whole session (theft detection).
- Password reset: single-use token valid 1 hour; a reset signs out every device.
- Login and forgot-password never reveal whether an account exists.

### Password reset emails

With `MAIL_DRIVER=console` (the only driver for now, refused in production),
the reset link is written to the API logs. To open it on a phone running
**Expo Go**, set `RESET_PASSWORD_URL=exp://<your-LAN-IP>:8081/--/reset-password`;
in a development or store build the default `klotho://reset-password` works.

## Scripts

| Script        | Purpose                                                          |
| ------------- | ---------------------------------------------------------------- |
| `dev`         | Start in watch mode                                              |
| `test`        | Unit tests (`*.spec.ts`)                                         |
| `test:e2e`    | HTTP tests on a real database `klotho_test` (created if missing) |
| `db:generate` | Generate the Prisma client                                       |
| `db:migrate`  | Create and apply a migration (development)                       |
| `db:deploy`   | Apply pending migrations (CI / production)                       |
| `db:studio`   | Browse the database                                              |

Environment files are loaded in this order: `.env.<NODE_ENV>`, then `.env`.
Only `.env.example` is committed.
