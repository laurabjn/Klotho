# @klotho/mobile

Expo (SDK 57) app, with Expo Router.

```
src/
  app/            Routes only (Expo Router). Each file re-exports a screen.
    (auth)/       Signed-out screens: login, register, forgot-password
    (app)/        Signed-in screens
    reset-password.tsx, password-changed.tsx   reachable in both states (email link)
  features/<name>/ screens, components, api, store… of one feature
  components/     Shared UI (ui/) and brand (logo, generated from the SVGs)
  lib/api/        HTTP client: JSON, errors, access token and automatic refresh
  theme/          Design tokens (colours, fonts, spacing) taken from the mockups
  i18n/           i18next setup; translations live in packages/i18n
```

## Run it

1. Start the API (see `apps/api/README.md`).
2. `npm run dev` from this folder (or the repo root), then open the app in
   Expo Go or an emulator.

The app calls the API on the machine running the Expo dev server, port 3100,
so it works from a phone on the same Wi-Fi. To target another API, set
`EXPO_PUBLIC_API_URL` (see `.env.example`). On Windows, allow Node.js through
the firewall on private networks if the phone cannot reach the API.

## Session

- The refresh token is stored in the OS keychain (`expo-secure-store`); the
  access token is only kept in memory.
- On a 401, the client refreshes once (a single shared request) and replays.
- At start-up the native splash stays visible until fonts are loaded and the
  session is restored.

## Tests

`npm test`: Jest + React Native Testing Library. Native modules (secure store,
safe area) are mocked in `jest.setup.ts`. With RNTL 14, `render` and
`fireEvent` are async: always `await` them.
