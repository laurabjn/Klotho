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

| Method | Route                                        | Public | Result                                                                                                                  |
| ------ | -------------------------------------------- | ------ | ----------------------------------------------------------------------------------------------------------------------- |
| GET    | `/health`                                    | yes    | `{ status: 'ok' }`                                                                                                      |
| POST   | `/auth/register`                             | yes    | 201 `AuthSession` · 409 email already used                                                                              |
| POST   | `/auth/login`                                | yes    | 200 `AuthSession` · 401 invalid credentials                                                                             |
| POST   | `/auth/refresh`                              | yes    | 200 `AuthTokens` (rotated) · 401                                                                                        |
| POST   | `/auth/logout`                               | yes    | 204 (idempotent)                                                                                                        |
| POST   | `/auth/forgot-password`                      | yes    | 202, whether or not the email exists                                                                                    |
| POST   | `/auth/reset-password`                       | yes    | 204 · 400 invalid or expired token                                                                                      |
| POST   | `/auth/confirm-email`                        | yes    | 200 `{ email }`: `{ token }` from the link · 400 `auth.invalidEmailToken` · 409 `auth.emailAlreadyUsed`                 |
| GET    | `/users/me`                                  | no     | `UserProfile`                                                                                                           |
| PATCH  | `/users/me`                                  | no     | `UserProfile` (only `firstName`, `bio`; `''` or `null` removes the bio)                                                 |
| DELETE | `/users/me`                                  | no     | 204: `{ password }`, deletes the account, its data and its photos · 403 `users.invalidPassword`                         |
| PUT    | `/users/me/avatar`                           | no     | `UserProfile`: `{ key }` of an upload of mine, the previous photo is deleted · 400 `users.invalidAvatar`                |
| DELETE | `/users/me/avatar`                           | no     | `UserProfile` with `avatarUrl: null` (idempotent, deletes the file)                                                     |
| POST   | `/users/me/password`                         | no     | 200 `AuthSession`: `{ currentPassword, newPassword }`, signs out every device · 403 `users.invalidPassword`             |
| POST   | `/users/me/email`                            | no     | 202 `{ pendingEmail }`: `{ newEmail, password }` · 400 `users.sameEmail` · 403 `users.invalidPassword` · 409            |
| GET    | `/preferences/me`                            | no     | `StyleProfile` (empty + `onboardingCompleted: false` for a new account)                                                 |
| PUT    | `/preferences/me`                            | no     | `StyleProfile` (replaces it; completes the onboarding)                                                                  |
| GET    | `/weather/current?latitude=&longitude=`      | no     | `CurrentWeather` (position rounded to ~1 km, never stored; without it: saved city, else 422)                            |
| GET    | `/weather/cities?q=&lang=`                   | no     | `City[]` (city search, for users who do not share their position)                                                       |
| GET    | `/weather/settings`                          | no     | `WeatherSettings` (location mode, saved city, °C/°F)                                                                    |
| PUT    | `/weather/settings`                          | no     | `WeatherSettings` (replaces them)                                                                                       |
| POST   | `/outfits/generate`                          | no     | `Outfit[]`: 5 saved looks (style, occasion, temperature, condition, mandatoryItemId, exclusions, excludeOutfitIds)      |
| GET    | `/outfits?filter=&page=&pageSize=`           | no     | `Page<Outfit>`: `generated` (default, most recent first), `favorites` (last favourited first), `worn` (last worn first) |
| GET    | `/outfits/history?from=&to=&page=&pageSize=` | no     | `Page<OutfitWear>`, last worn first; `from` / `to` are inclusive days (YYYY-MM-DD)                                      |
| DELETE | `/outfits/history/:wearId`                   | no     | 204: undoes a wear and the usage it added to the pieces · 404 `outfits.wearNotFound`                                    |
| DELETE | `/outfits/:id`                               | no     | 204: "Supprimer de mes tenues", with its plans and opinion · 404 `outfits.notFound` · 409 `outfits.worn` (worn once)    |
| GET    | `/outfits/:id`                               | no     | `Outfit` (pieces with photos, highlights, `isFavorite`, `feedback`, `lastWornOn`; never the raw score)                  |
| GET    | `/outfits/:id/alternatives?role=`            | no     | `OutfitAlternative[]`: pieces for that role, best first (30 max), `compatible`                                          |
| POST   | `/outfits/:id/replace-item`                  | no     | `Outfit` with the piece swapped and scored again (saved)                                                                |
| POST   | `/outfits/:id/variant`                       | no     | new `Outfit` keeping `lockedItemIds`, never a look already seen or disliked                                             |
| POST   | `/outfits/:id/feedback`                      | no     | 200 `Outfit`: `{ rating: like\|dislike, reasons?, note? }`, one per look (the last wins; a like keeps no reason)        |
| DELETE | `/outfits/:id/feedback`                      | no     | 200 `Outfit` with `feedback: null` (idempotent)                                                                         |
| POST   | `/outfits/:id/favorite`                      | no     | 200 `Outfit` (idempotent); DELETE removes it                                                                            |
| DELETE | `/outfits/:id/favorite`                      | no     | 200 `Outfit` (idempotent)                                                                                               |
| POST   | `/outfits/:id/wear`                          | no     | 200 `OutfitWear`: `{ wornOn: 'YYYY-MM-DD' }`, once per look and day; counts a wear for every piece                      |
| GET    | `/plans?from=&to=`                           | no     | `OutfitPlan[]` by day; `from` / `to` are inclusive days, 62 days at most                                                |
| PUT    | `/plans/:day`                                | no     | 200 `OutfitPlan`: `{ outfitId }`, creates or replaces the day's plan · 400 invalid day · 404 `outfits.notFound`         |
| DELETE | `/plans/:day`                                | no     | 204 (idempotent; the look stays)                                                                                        |
| POST   | `/plans/:day/move`                           | no     | 200 `OutfitPlan[]`: `{ toDay }`, the moved plan then the swapped one · 404 `plans.notFound`                             |
| POST   | `/plans/:day/regenerate`                     | no     | 200 `OutfitPlan`: one new look for that day · 404 `plans.notFound` · 422 `outfits.noOutfitPossible`                     |
| POST   | `/plans/week`                                | no     | 200 `OutfitPlan[]` created: `{ from, style?, occasion? }` · 400 `plans.pastDay` · 422 `outfits.noOutfitPossible`        |
| GET    | `/days/:day/note`                            | no     | `DayNote` (`text: null` when none)                                                                                      |
| PUT    | `/days/:day/note`                            | no     | 200 `DayNote`: `{ text }` (500 max; empty removes it)                                                                   |
| GET    | `/wardrobe`                                  | no     | `Page<WardrobeItem>`, filters and pagination below                                                                      |
| POST   | `/wardrobe`                                  | no     | 201 `WardrobeItem` (owner = authenticated user)                                                                         |
| GET    | `/wardrobe/:id`                              | no     | `WardrobeItem` · 404 if missing or not mine                                                                             |
| PATCH  | `/wardrobe/:id`                              | no     | `WardrobeItem` (partial update) · 404                                                                                   |
| DELETE | `/wardrobe/:id`                              | no     | 204 · 404                                                                                                               |
| PUT    | `/wardrobe/:id/favorite`                     | no     | `WardrobeItem` with `isFavorite: true` (idempotent) · 404                                                               |
| DELETE | `/wardrobe/:id/favorite`                     | no     | `WardrobeItem` with `isFavorite: false` (idempotent) · 404                                                              |
| POST   | `/uploads/wardrobe`                          | no     | 201 `UploadedPhoto` (multipart, field `file`) · 413 · 415                                                               |
| POST   | `/wardrobe/:id/photos`                       | no     | 201 item · 400 unknown upload · 409 limit (5)                                                                           |
| PATCH  | `/wardrobe/:id/photos/:photoId/main`         | no     | item (this photo becomes the main one)                                                                                  |
| DELETE | `/wardrobe/:id/photos/:photoId`              | no     | item (next photo becomes main)                                                                                          |

### Wardrobe list

`GET /wardrobe?page=1&pageSize=24&category=TOP,BOTTOM&color=gold&season=summer&style=chic&status=AVAILABLE&q=levis&favorite=true&sort=recent`

- Every filter is optional; lists are comma separated (OR inside a filter, AND between filters).
- `color` matches the main colour or a secondary one; `q` searches name, brand and sub-category.
- `favorite=true` keeps "Mes pièces favorites" only (`false`: the others).
- `sort`: `recent` (default), `mostWorn`, `leastWorn`, `alphabetical`. `pageSize` is capped at 100.
- Values (categories, colours, styles…) are the keys of `packages/shared/src/wardrobe/taxonomy.ts`.

### Feedback, favourites and wear history

- An opinion on a look feeds the next generations: pieces liked together
  score a bit higher, pieces disliked together lower (a dislike weighs more),
  favourite pieces get a small bonus, and a disliked look is never proposed
  again (generation and variants).
- Wearing a look (`POST /outfits/:id/wear`) is idempotent per look and day.
  In one transaction it saves the day, adds one wear to every piece and moves
  their `lastWornAt` to that day (noon UTC) unless it is already later.
  Undoing it (`DELETE /outfits/history/:wearId`) removes that wear, never
  counts below 0, and recomputes `lastWornAt` from the remaining wears.
- Days (`wornOn`, `from`, `to`) are the user's calendar days, sent by the app.

### Outfit planning

- One look per day and user (`OutfitPlan`), on the user's calendar days
  (`YYYY-MM-DD`, sent by the app, like the wears). A `:day` that is not a
  real day answers 400 `validation.failed`. The home screen reads today's
  plan with `GET /plans?from=<today>&to=<today>`.
- Each plan keeps the forecast it was planned with (`forecast`, or `null`).
  It comes from the city saved in the weather settings (the phone position
  is never stored, so without a city there is none), with the 5-day /
  3-hour OpenWeatherMap forecast (`/data/2.5/forecast`): the slots are
  grouped by local day (`city.timezone`), the temperature is the warmest
  slot of the day, rounded, and the condition the most frequent one of the
  8:00–20:00 slots (on a tie, the one that matters most: storm, snow, rain,
  fog, cloudy, clear). It is cached like the current weather. Beyond 5 days,
  or when the provider fails, the forecast is `null` and planning still works.
- Moving a plan onto a planned day swaps both looks; each day keeps its
  forecast. "Changer la tenue" (`regenerate`) saves one new look with the
  style and occasion of the planned one and the day's forecast, never the
  same look nor a disliked one.
- "Planifier ma semaine" (`POST /plans/week`) plans every free day from
  `from` (yesterday at the earliest, for time zones; else 400
  `plans.pastDay`) to the Sunday of its week; planned days are kept. Each
  look is generated with the day's forecast (else the current weather of the
  city, not stored), the given style (else the first preferred one) and
  occasion. The week stays varied: a look is never planned twice, and the
  pieces of the other days count as just worn, so the engine's
  anti-repetition prefers other ones. Days without a possible look stay
  free; 422 `outfits.noOutfitPossible` only when no day could be planned.
- Deleting a look (`DELETE /outfits/:id`) removes its plans and its opinion;
  a look worn at least once is kept (409 `outfits.worn`) so that the history
  and the wear counts of its pieces stay true.

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

### Account settings

- `UserProfile` = `{ id, email, firstName, bio, avatarUrl, pendingEmail,
createdAt }`, also in the `AuthSession` of login and register.
- Profile photo: the app uploads the picture with `POST /uploads/wardrobe`
  (same checks, metadata dropped), then sends its key to
  `PUT /users/me/avatar`. The key must be an upload of the user, still
  stored, and not the photo of a piece. `avatarUrl` is a signed link valid
  `PHOTO_URL_TTL_SECONDS`, like the photos of the pieces. Replacing or
  removing the photo deletes the previous file (best effort, logged without
  the key). The former external `avatarUrl` of `PATCH /users/me` is ignored.
- Password change: checks the current password, revokes every refresh token
  of the user (other devices are signed out) and pending reset links, and
  answers a fresh `AuthSession` for the device that made the change.
  Already issued access tokens stay valid until they expire (15 min).
- E-mail change: `POST /users/me/email` checks the password and sends a
  single-use link to the NEW address (`CONFIRM_EMAIL_URL?token=…`, valid
  `EMAIL_CHANGE_TTL_MINUTES`); only the SHA-256 of the token is stored, one
  request per user (a new one replaces the previous link). The address
  changes when the link is opened (`POST /auth/confirm-email`, public: it
  may be opened signed out). Until then, `pendingEmail` shows it.

### Security notes

- Passwords: bcrypt (cost 12). Policy shared with the app: 8+ characters,
  upper and lower case, digit, special character, 72 bytes max.
- Access token: JWT HS256, 15 minutes, kept in memory by the app.
- Refresh token: 256-bit random, 30 days, single-use. Only its SHA-256 is
  stored. Replaying a used token revokes the whole session (theft detection).
- Password reset: single-use token valid 1 hour; a reset signs out every device.
  So does a password change (`POST /users/me/password`).
- E-mail change: confirmed from the new address, single-use token valid 1 hour.
- Login and forgot-password never reveal whether an account exists.
- Every route requires a token unless listed as public above; a token of a
  deleted account is refused (401). `test/routes-auth.e2e-spec.ts` walks
  every registered route and checks it.

### Account deletion (RGPD)

`DELETE /users/me` with `{ password }` (403 `users.invalidPassword` when
wrong; 401 is kept for expired sessions). The database cascade removes the
sessions, reset tokens, pieces, photo rows, style profile, weather settings,
looks, opinions, wears, plans, day notes and pending e-mail change. Then every file of the user is removed from the
storage: the photos of her pieces, her profile photo and her uploads never
attached (`users/<id>/` prefix). The storage step is best effort: a failure is logged
(error name only, no key or URL) and never keeps the data in the database.

### Rate limiting

Per client IP, in memory (one API instance; several would need a shared
store such as Redis). Beyond the limit: 429
`{ statusCode: 429, code: 'request.rateLimited' }` and a `Retry-After`
header (seconds).

| Route(s)                                                                                  | Variable                     | Default             |
| ----------------------------------------------------------------------------------------- | ---------------------------- | ------------------- |
| `POST /auth/login`, `DELETE /users/me`, `POST /users/me/password`, `POST /users/me/email` | `RATE_LIMIT_LOGIN`           | `10/60` (10 a min.) |
| `POST /auth/register`                                                                     | `RATE_LIMIT_REGISTER`        | `5/60`              |
| `POST /auth/forgot-password`, `POST /users/me/email` (sends an e-mail)                    | `RATE_LIMIT_FORGOT_PASSWORD` | `5/900` (15 min.)   |
| `POST /auth/reset-password`, `POST /auth/confirm-email`                                   | `RATE_LIMIT_RESET_PASSWORD`  | `10/900`            |
| `POST /auth/refresh`                                                                      | `RATE_LIMIT_REFRESH`         | `30/60`             |
| `POST /uploads/wardrobe` (per IP and per account)                                         | `RATE_LIMIT_UPLOADS`         | `30/60`             |

Values are `<requests>/<seconds>`. `RATE_LIMIT_ENABLED=false` turns it off
(e2e tests do, except `rate-limit.e2e-spec.ts`). Behind a reverse proxy, set
`TRUST_PROXY` to the number of proxies so that the client IP is read from
`X-Forwarded-For`.

### Logs

- `LOG_FORMAT=json` (default in production): one JSON object per line
  (`level`, `timestamp`, `context`, `message` and structured fields).
  `pretty` (default elsewhere): Nest's readable output.
- One line per HTTP request (`LOG_HTTP_REQUESTS`, on by default): method,
  route pattern (`/outfits/:id`, never ids or query strings), status,
  duration and a request id, also sent back as `X-Request-Id` (an incoming
  well-formed `X-Request-Id` is kept). Headers, cookies and bodies are never
  logged; unhandled errors are logged with the request id.
- Every message, field and stack trace goes through a redaction
  (`src/infrastructure/logging/redaction.ts`): passwords, tokens, secrets,
  authorization, cookies, API keys, `Bearer` values, JWTs and signed URL
  parameters become `[REDACTED]`.
- Exception: the development `ConsoleMailer` prints reset and e-mail
  confirmation links on stdout (refused in production).

### Pagination and bounds

Lists are paginated: `/wardrobe` (100 max a page), `/outfits` (50),
`/outfits/history` (100); `/plans` covers 62 days at most. Other answers are bounded: 5 looks a generation,
30 alternatives, 5 cities. The engine reads the whole wardrobe and the
user's opinions (indexed by user). Indexes cover every list query: wardrobe
by user + category/status, creation date, last worn date and wear count;
looks by user + creation date and favourites; wears by user + day; opinions
by user; plans and day notes by user + day.

### Outfit engine performance

`npm run profile:generation -w @klotho/api` times `OutfitGeneratorService`
on deterministic synthetic wardrobes (with 60 past opinions). Measured on a
development laptop (Node 24, 20 runs after warm-up):

| Pieces | Median (plain day / styled, rain) | p95 (plain / styled) |
| ------ | --------------------------------- | -------------------- |
| 100    | 39 ms / 36 ms                     | 47 ms / 39 ms        |
| 300    | 104 ms / 112 ms                   | 146 ms / 137 ms      |
| 1000   | 112 ms / 112 ms                   | 122 ms / 128 ms      |

The work is bounded by `maxPerRole` (10 best pieces per role before
combining), so it barely grows past 300 pieces. Sprint 9 made it about 2.5×
faster (before: 73 / 231 / 261 ms) by ranking each role once and computing
the diversity distances incrementally; results are unchanged.

### KPIs

`npm run kpis -w @klotho/api [-- --json]` prints aggregates only (no email,
name or id): users, users with a first look and the median time from
sign-up to it, looks generated, like rate (likes / rated looks), looks worn
(total, last 7 and 30 days), favourite looks and pieces.

### Password reset and e-mail confirmation emails

With `MAIL_DRIVER=console` (refused in production; `brevo` sends them), the
reset and e-mail change links are written to the API logs. To open them on a
phone running **Expo Go**, set
`RESET_PASSWORD_URL=exp://<your-LAN-IP>:8081/--/reset-password` and
`CONFIRM_EMAIL_URL=exp://<your-LAN-IP>:8081/--/confirm-email`; in a
development or store build the defaults `klotho://reset-password` and
`klotho://confirm-email` work. `EMAIL_CHANGE_TTL_MINUTES` (60) bounds the
e-mail change link.

## Scripts

| Script               | Purpose                                                                         |
| -------------------- | ------------------------------------------------------------------------------- |
| `dev`                | Start in watch mode                                                             |
| `test`               | Unit tests (`*.spec.ts`)                                                        |
| `test:e2e`           | HTTP tests on a real database `klotho_test` (created if missing)                |
| `db:generate`        | Generate the Prisma client                                                      |
| `db:migrate`         | Create and apply a migration (development)                                      |
| `db:deploy`          | Apply pending migrations (CI / production)                                      |
| `db:studio`          | Browse the database                                                             |
| `db:seed:demo`       | (Re)create the demo account `demo@klotho.fr` / `Klotho2026!` (development only) |
| `outfits:demo`       | Run the outfit engine for an account and print the looks                        |
| `profile:generation` | Time the outfit engine on 100, 300 and 1000 pieces (`--runs`, `--sizes`)        |
| `kpis`               | Print the beta KPIs (aggregates only; `--json`)                                 |

### Demo data

`npm run db:seed:demo -w @klotho/api` recreates a demo account: 36 varied
pieces (every category, pieces in the wash, lent, archived, favourites, a
wear history), 8 looks (favourites, a like, a dislike with reasons, 8 days
worn over the last 5 weeks, today included), a style profile and Paris for
the weather. Run it again to start from scratch.

`npm run outfits:demo -w @klotho/api -- [options]` prints the 5 looks of the
outfit engine with their detailed score. Options: `--temperature 12`,
`--occasion work` (walk, everyday, date, restaurant, work, evening, ceremony),
`--style romantic`, `--impose "Jupe midi"`, `--rain`, `--no-heels`,
`--no-color black`, `--email other@example.com`.

Environment files are loaded in this order: `.env.<NODE_ENV>`, then `.env`.
Only `.env.example` is committed.
