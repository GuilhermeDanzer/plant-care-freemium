# PlantHelper - Senior Architecture & Technical Specification

Welcome to the **PlantHelper** codebase. This document serves as the canonical technical reference for senior engineers joining the project. It outlines the foundational architecture, data flow, state management, and critical infrastructure decisions governing the application.

---

## 1. System Architecture Overview

The application follows a decoupled, modular monolith architecture within the React Native environment, optimized for offline-first capabilities and strict cost gating on external APIs.

### 1.1 Tech Stack Deep Dive
- **Core Engine:** React Native (`0.74.x` / Expo SDK `51+`) running on the **Hermes engine**.
- **Routing:** **Expo Router** (File-based routing). The router creates an innate boundary between navigation (`/app`) and business logic (`/src`).
- **State Management (Client):** **Zustand** is utilized for synchronous, global client state (e.g., Settings, Local SQLite synchronization, Scan Balances).
- **State Management (Server):** **TanStack React Query** manages asynchronous network state, cache invalidation, and retry logic for all external endpoints (e.g., Kindwise API).
- **Styling Pipeline:** **NativeWind** (Tailwind CSS for React Native). Utility classes are compiled via Babel at build time. Complex animations use `react-native-reanimated`.
- **Database:** **Expo SQLite** (next-gen asynchronous driver) serving as the single source of truth for the offline-first garden data.
- **Path Aliasing:** Absolute imports are strictly enforced via the `@/` prefix, which points directly to the `./src/` directory.

---

## 2. Directory & Module Structure

The boundary between presentation (UI) and domain logic is strictly enforced.

```text
/
├── app/                      # EXPO ROUTER: Presentational Layer & Routing
│   ├── (identify)/           # Sub-graph: The AI Plant Identification & Addition Flow
│   │   ├── camera.tsx        # Camera UI and Cost Gating Gateway
│   │   ├── scan-result.tsx   # Results interpretation UI
│   │   └── setup.tsx         # Habit Loop configuration (watering schedules)
│   ├── (main)/               # Sub-graph: Authenticated Dashboard
│   │   ├── index.tsx         # SQLite hydration & list rendering
│   │   ├── settings.tsx      # Auth & Subscription entry points
│   │   └── plant/[id].tsx    # Dynamic routing for detailed domain views
│   ├── _layout.tsx           # Providers (QueryClient, Auth, i18n, Zustand Hydration)
│   └── paywall.tsx           # Global interception route for RevenueCat
│
├── src/                      # DOMAIN LOGIC: Core Business Rules
│   ├── api/                  # Axios instances with auth/token interceptors
│   ├── components/           # Dumb/Presentational UI components (NativeWind styled)
│   ├── database/             # SQLite migrations, schema (db.ts), and raw SQL repositories
│   ├── hooks/                # Complex UI/Domain orchestration (e.g., useIdentifyPlant)
│   ├── i18n/                 # Localization dictionaries and init logic
│   ├── lib/                  # 3rd party SDK initializations (Supabase, RevenueCat)
│   ├── services/             # Stateless Singleton Services (Orchestrators)
│   ├── store/                # Zustand stores
│   ├── types/                # Strict TS Schemas and Interfaces
│   └── utils/                # Pure functions (Date math, formatting)
```

---

## 3. Data Flow & Storage Architecture

The application implements an **Offline-First Data Strategy** with a fallback local persistence layer.

### 3.1 Local SQLite Schema (`src/database/db.ts`)
The `my_plants` table is the primary domain aggregate.
- `id` (INTEGER PRIMARY KEY)
- `nickname` (TEXT)
- `original_name` (TEXT NOT NULL)
- `scientific_name` (TEXT NOT NULL)
- `watering_freq_days` (INTEGER NOT NULL)
- `last_watered_at` (TEXT NOT NULL) - ISO8601 string
- `next_watering_at` (TEXT NOT NULL) - ISO8601 string
- `image_uri` (TEXT) - Local filesystem path cache
- `last_health_check_at` (TEXT)
- `health_data` (TEXT) - Stringified JSON payload from Kindwise `HealthAssessmentResponse`.

**Hydration Lifecycle:**
1. App launches -> `_layout.tsx` triggers SQLite database initialization and migrations via `initDatabase()`.
2. The Dashboard (`index.tsx`) invokes `usePlantStore().loadPlants()`.
3. The Zustand store executes `getMyPlants()` (raw SQL query) and hydrates the in-memory React state.

### 3.2 Kindwise API Orchestration & Cost Control (`plantService.ts`)
The most expensive operation in the app is computer vision analysis. To prevent runaway costs:
1. **Request Merging:** The `/identification` endpoint is invoked with `health: "all"`. This collapses two standard API calls into a single round-trip, yielding both taxonomy and disease data simultaneously.
2. **Deterministic Caching:** Before hitting Axios, the local image is converted to base64. A lightweight hashing function creates a unique key for this payload.
3. **AsyncStorage Cache Hit:** The hash is checked against `@react-native-async-storage/async-storage`. If a duplicate request was made within a 24-hour TTL, the cached JSON response is returned, halting the network request entirely.

### 3.3 The Habit Loop (Event Sourcing)
Watering schedules are **not** managed by a remote backend cron job.
- When a plant is saved (`setup.tsx`), the delta between `Date.now()` and `next_watering_at` is calculated.
- `expo-notifications` registers a `TimeIntervalTrigger` strictly mapped to the local device.
- This creates zero-latency, zero-cost retention triggers.

---

## 4. State Management (Zustand)

Global state is divided into domain-specific slices:

1. **`usePlantStore`**: Manages the loaded SQLite models and strict **Cost Gating**. It tracks `totalFreeScansUsed` (persisted to `AsyncStorage`) and determines if a user has hit the paywall threshold.
2. **`useSettingsStore`**: Manages user preferences (Theme, language overrides).

---

## 5. Integrations & 3rd Party SDKs

- **Authentication (Supabase):** Configured in `src/lib/supabase.ts`. Employs standard JWT flow. Note: Many features are currently stubbed for local-first execution.
- **Monetization (RevenueCat):** Global subscription state. The `paywall.tsx` route serves as an interceptor. If `isPremium` is false, cost-gating logic in the Camera route will force the user to this screen upon credit exhaustion.
- **Internationalization (i18n):** `react-i18next`. **Strict Requirement:** No hardcoded strings are permitted in `.tsx` files. All components must invoke the `useTranslation()` hook.

---

## 6. Testing & CI/CD Pipeline

- **Snapshot Testing:** Utilizing **Fastlane** (`ios/Fastfile`).
- **XCUITest Setup:** `SnapshotHelper.swift` bridges Fastlane with the native iOS UI Testing framework.
- **Testability:** All interactive components (Buttons, Nav tabs) MUST implement the `testID` prop to allow deterministic interactions from the Swift driver.
- **Execution:** Running `fastlane snapshot` compiles the app via `xcodebuild`, boots the target simulator, runs the XCTest suite, and extracts screenshots to `ios/screenshots` for App Store Connect distribution.

---

## 7. Immediate Onboarding Tasks

1. **Environment Config:** Duplicate `.env.example` to `.env` and inject the `EXPO_PUBLIC_KINDWISE_API_KEY`.
2. **Build the Native Client:** The project relies on custom native code (SQLite, Notifications, Reanimated). You must run `npx expo prebuild` or use `npm run ios` (which triggers `xcodebuild`). You cannot use Expo Go.
3. **Explore the Core Flow:** Walk through the manual addition flow (`app/(identify)/manual-add.tsx`) to understand local DB inserts, then test the Camera route (`app/(identify)/camera.tsx`) to trace the React Query mutations and `plantService.ts` cache logic.

---

## 8. Permission Re-asking & Session Data Clearing

### 8.1 Centralized Permission Flow
- `src/services/permissionService.ts` centralizes camera, gallery, location and
  notification permission handling with an "Open Settings" fallback.
- When a permission is revoked in the system Settings, iOS/Android will not show
  the native prompt again. `ensure*Permission()` detects this (Android
  `canAskAgain === false`, iOS `status !== "undetermined"`) and surfaces a
  translated `Alert` that deep-links to `Linking.openSettings()`.
- Returns `"granted" | "denied" | "revoked"` so callers can distinguish a fresh
  denial from a revoked permission.

### 8.2 Logout & Guest-to-Account Carryover
- `usePlantStore.signOut()` wipes the local SQLite garden (`clearAllLocalData()`),
  clears in-memory plants and `lastSyncedAt`, cancels scheduled watering
  notifications, and clears user/premium state.
- The `SIGNED_OUT` auth event only resets in-memory garden state (`clearGarden()`),
  never SQLite, so a transient sign-out during anonymous-to-account login does
  not destroy guest plants. Guest plants are then pushed to the new account via
  `SIGNED_IN -> syncDataWithSupabase()` (with `lastSyncedAt === null` forcing a
  full push).

### 8.3 Health Result Component Decomposition
- `HealthResultCard` was split into `src/components/health/` (HealthGauge,
  GeneralTipsCard, BulletSection, healthPalette), `src/components/ui/FadeIn`,
  and shared types in `src/types/health.ts`. Interpretation logic lives in
  `src/utils/healthUtils.ts` (no longer duplicated).

### 8.4 Account Deletion (Supabase Edge Function)
- `authService.deleteAccount()` invokes the `delete-account` Edge Function via
  `supabase.functions.invoke`, then clears the local session and RevenueCat
  identity. Settings (`app/(main)/settings.tsx`) follows up by wiping the
  SQLite garden (`resetGarden()`), cancelling scheduled notifications, and
  resetting the global user state.
- The Edge Function (`supabase/functions/delete-account/index.ts`) uses
  `@supabase/server`'s `withSupabase({ auth: "user" })` so the caller's JWT is
  verified before any work runs (`verify_jwt = true`). It then:
  1. Recursively removes the user's objects under `plant-images/{userId}/...`.
  2. Hard-deletes the auth user via `ctx.supabaseAdmin.auth.admin.deleteUser`,
     which cascades to `profiles`, `plants` and `journal_entries` through their
     `ON DELETE CASCADE` foreign keys on `auth.users(id)`.
- The service-role key never leaves the server; only the caller's own account
  (derived from their verified JWT, never a client-supplied ID) can be deleted.

### 8.5 Plant Detail Screen Decomposition
- `app/(main)/plant/[id].tsx` was reduced from a 481-line god-component to a
  thin (~137-line) presentational route. All business logic (nickname editing,
  AI diagnosis, camera/gallery photo capture, journal) now lives in
  `src/hooks/usePlantDetail.ts`, which the screen consumes via a single
  destructure.
- The remaining inline JSX was extracted into reusable `src/components/plant-detail/`
  components: `PlantDetailHeader`, `PlantNameSection`, `PlantHealthSection`, and
  `PlantNotFound` (exported from the barrel `index.ts`), alongside the existing
  `WateringHeroCard`, `PhotoSourceSheet`, `JournalTimeline`, etc.
- This follows the same screen → hook + presentational-components pattern used
  by the Health Result decomposition (§8.3).

---

## 9. Testing Infrastructure

### 9.1 Test stack
- **Unit/component tests:** Jest with the `jest-expo` preset (SDK 54) +
  `@testing-library/react-native`. Config lives in `jest.config.js` with global
  setup in `jest.setup.js` (Reanimated v4 mock, AsyncStorage mock, `EXPO_PUBLIC_*`
  test env values).
- **Static analysis:** `npm run typecheck` runs `tsc --noEmit` (strict mode).
- **E2E:** Maestro YAML flows in `maestro/flows/` drive a dev-client build on a
  simulator or physical device.

### 9.2 Coverage strategy
Tests target the highest-risk domain logic rather than snapshot-testing every
view:

- `src/utils/` — `healthUtils` (interpretation thresholds), `checkScanBalance`
  (free/premium gating), `calculateNextWateringDate` (weather rules),
  `dateUtils`, `plantUtils`, and i18n locale parity.
- `src/services/` — `subscriptionService` (RevenueCat entitlement mapping +
  cancellation), `kindwiseService`, `weatherService`, `authService` (incl.
  account deletion).
- `src/store/` — `usePlantStore` (premium gating, guest carryover, sign-out
  wipe, sync), `useTaskStore` (streak rules), `useSettingsStore`.
- `src/components/` — lightweight render tests (e.g. `PlantCard`).

### 9.3 CI
- `.github/workflows/ci.yml` — typecheck + unit tests on every push/PR.
- `.github/workflows/e2e-ios.yml` — Maestro on an iOS simulator (on-demand/weekly).
