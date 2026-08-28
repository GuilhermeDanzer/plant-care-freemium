# External services, tools & platforms

The app uses the following third-party services to deliver its core
functionality. No personal data is sold; each service is used for a specific
product purpose.

## 1. Supabase (backend)

- **Purpose:** authentication, PostgreSQL database, file storage, and Edge
  Functions (account deletion).
- **What it powers:** email/password + anonymous (guest) sign-in, cloud sync of
  the plant garden, and the server-side `delete-account` flow.
- **Data stored:** user accounts, `profiles`, `plants`, `journal_entries`, and
  user-uploaded photos (`plant-images` storage bucket).
- **Docs/links:** https://supabase.com

## 2. RevenueCat (subscriptions / payments)

- **Purpose:** in-app purchase and subscription management for the
  `PlantHelper Pro` entitlement.
- **What it powers:** paywall, monthly subscription purchase, restore
  purchases, and premium-status synchronization across devices.
- **SDK:** `react-native-purchases` (RevenueCat iOS/Android SDK).
- **Docs/links:** https://www.revenuecat.com

## 3. Kindwise / Plant.id API (AI)

- **Purpose:** computer-vision plant identification, plant health/disease
  assessment, and the plant encyclopedia (lexicon) knowledge base.
- **What it powers:** the "Identify with AI" flow, the AI health diagnosis on a
  plant's detail screen, and the plant lexicon search/details.
- **Docs/links:** https://plant.id / https://www.kindwise.com

## 4. OpenWeatherMap (weather data)

- **Purpose:** current weather (temperature and recent rainfall) at the user's
  location to adjust the next-watering date (Rule A: skip/adjust after heavy
  rain; Rule B: longer intervals when cold).
- **Docs/links:** https://openweathermap.org

## 5. Local notifications (no external push provider)

- **Purpose:** watering reminders are **local** notifications scheduled on the
  device via `expo-notifications`. They do **not** rely on a third-party push
  service (APNs/FCM are used only for the standard local notification
  delivery on iOS/Android, with no remote push campaigns).

## Not used

- No advertising SDKs, no analytics SDKs with IDFA collection, no
  App Tracking Transparency (ATT) / tracking frameworks, no crash-reporting
  third parties in the production build.
