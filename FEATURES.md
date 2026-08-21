# PlantHelper Features

This document outlines the features currently implemented in the PlantHelper application, along with their status and relevant components.

## 1. Authentication & Onboarding
- **Description:** User authentication flow using Supabase, including email/password login, signup, password reset, and an onboarding tutorial for new users.
- **Status:** Done
- **Main Files:**
  - `app/auth.tsx`
  - `app/update-password.tsx`
  - `app/onboarding.tsx`
  - `src/hooks/useAuth.ts`
  - `src/lib/supabase.ts`

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
