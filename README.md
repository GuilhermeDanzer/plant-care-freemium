# PlantHelper 🌿

An offline-first plant-care companion for iOS & Android. Identify plants with
AI, diagnose their health, and never forget to water them — even offline.

Built with Expo SDK 54 / React Native 0.81, TypeScript, Zustand + TanStack
Query, NativeWind, Expo SQLite, Supabase, RevenueCat, and the Kindwise
(Plant.id) + OpenWeatherMap APIs.

## Who it's for

- **Plant owners** who want to identify plants, track watering schedules, and
  get an AI health diagnosis — with the core flow usable offline.
- **Hobbyist gardeners** juggling many plants who need per-plant reminders,
  streaks, and care history.
- **Developers** looking at a production-shaped Expo / React Native app with a
  Supabase backend, RevenueCat paywall, local-first SQLite storage, i18n, and a
  real Jest + Maestro test suite.

## Quick start

Requirements: Node.js 22 (LTS) and npm.

```bash
npm install --legacy-peer-deps
cp .env.example .env   # then fill in your keys
npm start              # Expo dev server
```

## Scripts

| Command | Purpose |
|---|---|
| `npm start` | Start the Expo dev server |
| `npm run ios` / `npm run android` | Run on a simulator/emulator |
| `npm run typecheck` | TypeScript check (`tsc --noEmit`) |
| `npm test` | Run the Jest unit/component suite |
| `npm run test:watch` | Jest in watch mode |
| `npm run test:ci` | Jest with coverage (CI mode) |
| `npm run db:start` / `db:push` / `db:pull` | Supabase local/remote schema |

## Testing

- **Unit & component tests:** Jest (`jest-expo` preset) + React Testing Library
  under `src/**/__tests__/`. Covers the high-risk logic: scan/paywall gating,
  streak rules, sync, auth, subscription mapping, health interpretation,
  weather scheduling and i18n parity.
- **E2E:** Maestro flows under `maestro/flows/` (onboarding, manual add,
  watering, paywall, signup, account deletion, and the full App Review
  rehearsal).
- **CI:** `.github/workflows/ci.yml` runs typecheck + unit tests on every
  push/PR; `.github/workflows/e2e-ios.yml` runs Maestro on an iOS simulator
  (on-demand/weekly).

## App Store submission

Everything Apple asks for lives in [`docs/app-store/`](docs/app-store/00-overview.md)
— screen-recording script, device matrix, app description, credentials, external
services, regional notes, regulated-industry statement, and ready-to-paste
review notes.

## Documentation

- [`ARCHITECTURE.md`](ARCHITECTURE.md) — technical architecture
- [`FEATURES.md`](FEATURES.md) — feature inventory & status
- [`ROADMAP.md`](ROADMAP.md) — planned work and known gaps

## Roadmap

See [`ROADMAP.md`](ROADMAP.md) for the full backlog and the matching GitHub
issues. Highlights: moving the Plant.id key behind a Supabase Edge Function,
offline scan retry queue, garden backup/export, and more locales.

## License

[MIT](LICENSE) © 2026 Guilherme Danzer de Oliveira
