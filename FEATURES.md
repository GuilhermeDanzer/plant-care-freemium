# PlantHelper Features

This document outlines the features currently implemented in the PlantHelper application, along with their status and relevant components.

## 1. Authentication & Onboarding
- **Description:** User authentication flow using Supabase, including email/password login, signup, password reset, and an onboarding tutorial for new users. On logout the local garden is cleared; plants registered as a guest are pushed to the user's account on login. Account deletion is performed by the `delete-account` Supabase Edge Function, which validates the caller's JWT, hard-deletes the user with the service role (cascading to `profiles`, `plants`, `journal_entries`), removes their `plant-images` storage objects, and then clears the local session, RevenueCat identity, SQLite garden and scheduled notifications.
- **Status:** Done
- **Main Files:**
  - `app/auth.tsx`
  - `app/update-password.tsx`
  - `app/onboarding.tsx`
  - `src/hooks/useAuth.ts`
  - `src/lib/supabase.ts`
  - `src/services/authService.ts` (`deleteAccount`)
  - `app/(main)/settings.tsx`
  - `supabase/functions/delete-account/index.ts`

## 2. Plant Collection Dashboard
- **Description:** The main authenticated view displaying a list of the user's saved plants. It uses an offline-first SQLite database for zero-latency loading and persistence.
- **Status:** Done
- **Main Files:**
  - `app/(main)/index.tsx`
  - `src/database/db.ts`
  - `src/store/usePlantStore.ts`

## 3. AI Plant Identification & Health Assessment
- **Description:** Uses the device camera to take photos of plants and sends them to the Kindwise API. It merges identification (taxonomy) and health assessment (disease detection) into a single request. Results are cached locally via AsyncStorage to prevent redundant expensive API calls.
- **Status:** Done
- **Main Files:**
  - `app/(identify)/camera.tsx`
  - `app/(identify)/identify.tsx`
  - `app/(identify)/scan-result.tsx`
  - `src/services/plantService.ts`
  - `src/components/HealthResultCard.tsx`
  - `src/components/HealthInsightCard.tsx`
  - `src/components/health/` (HealthGauge, GeneralTipsCard, BulletSection, healthPalette)
  - `src/types/health.ts`
  - `src/utils/healthUtils.ts`

## 4. Manual Plant Addition
- **Description:** Allows users to manually add a plant without using the AI identification, bypassing the camera and API flow.
- **Status:** Done
- **Main Files:**
  - `app/(identify)/manual-add.tsx`
  - `app/(identify)/setup.tsx`

## 5. Habit Loop & Watering Reminders
- **Description:** Local event-sourcing system that schedules local notifications for plant watering based on user-configured frequency. Avoids remote cron jobs.
- **Status:** Done
- **Main Files:**
  - `app/(identify)/setup.tsx`
  - `src/hooks/useNotifications.ts` (assuming standard naming)

## 6. Freemium Monetization & Scan Limits
- **Description:** Tracks free scan usage and gates premium features (like unlimited scans). Uses RevenueCat for subscription management and displays a paywall interceptor when limits are reached.
- **Status:** Done
- **Main Files:**
  - `app/paywall.tsx`
  - `src/store/usePlantStore.ts` (tracks `totalFreeScansUsed`)
  - `src/lib/revenuecat.ts` (assuming standard naming)

## 7. Plant Detail Management
- **Description:** Dynamic route for viewing a specific plant's details, including next watering date, health data, and options to edit or hard delete the plant.
- **Status:** Done
- **Main Files:**
  - `app/(main)/plant/[id].tsx`

## 8. Plant Lexicon (Encyclopedia)
- **Description:** A reference section for plant taxonomy and general care information.
- **Status:** Work in Progress
- **Main Files:**
  - `app/(main)/lexicon/index.tsx`
  - `app/(main)/lexicon/[accessToken].tsx`

## 9. User Settings & Internationalization
- **Description:** Global settings for the app, including theme preferences, account management, and language overrides. Uses `react-i18next` for full localization support.
- **Status:** Done
- **Main Files:**
  - `app/(main)/settings.tsx`
  - `src/i18n/`
  - `src/store/useSettingsStore.ts` (assuming standard naming)

## 10. Plant Care Gamification
- **Description:** Gamified "Streak" system to encourage consistent plant care. Users earn a streak point only if they water the plant when it actually needs it, preventing premature watering from artificially inflating the streak.
- **Status:** Done
- **Main Files:**
  - `src/store/useTaskStore.ts`
  - `src/services/SyncService.ts`

## 11. Permission Management & Re-asking
- **Description:** Centralized native permission flow (camera, gallery, location, notifications). When a permission is revoked in the system Settings, the app detects it and shows an "Open Settings" alert to guide the user back instead of silently failing.
- **Status:** Done
- **Main Files:**
  - `src/services/permissionService.ts`
  - `src/services/notificationService.ts`
  - `app/(identify)/camera.tsx`
  - `app/(identify)/identify.tsx`
  - `app/(main)/plant/[id].tsx`
  - `app/(main)/settings.tsx`
  - `src/hooks/useIntelligentWatering.ts`
  - `src/components/ManualAddScreen.tsx`
  - `app/(identify)/setup.tsx`
  - `app/(identify)/manual-add.tsx`

## 12. Automated Testing Pipeline
- **Description:** Jest unit/component tests + TypeScript typecheck + Maestro
  E2E flows + GitHub Actions CI. Covers scan/paywall gating, streak rules,
  sync, auth (incl. account deletion), subscription mapping, health
  interpretation, weather scheduling and i18n parity.
- **Status:** Done
- **Main Files:**
  - `jest.config.js`, `jest.setup.js`
  - `src/**/__tests__/*`
  - `maestro/flows/*`
  - `.github/workflows/ci.yml`, `.github/workflows/e2e-ios.yml`

## 13. App Store Review Compliance Kit
- **Description:** Complete documentation bundle for Apple App Review —
  screen-recording script, device test matrix, app description, demo
  credentials, external services, regional notes, regulated-industry
  statement, and ready-to-paste review notes. Demo account
  (`appreview@planthelper.app`) seeded on the linked Supabase project.
- **Status:** Done
- **Main Files:**
  - `docs/app-store/*`
  - `scripts/create-demo-account.mjs`
  - `assets/sample-plants/README.md`

