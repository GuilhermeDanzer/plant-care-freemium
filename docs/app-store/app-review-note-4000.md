# App Review — Notes field (≤ 4,000 characters, ready to paste)

Paste the block below into App Store Connect → **App Review Information →
Notes**. It answers Apple's questions 2–7 and fits the 4,000-character limit
(verified ~2,600 characters, leaving headroom).

> **The single attachable file** is the demo video (screen recording) produced
> from `app-review-demo-script.md`.

---

```
1) The attached file is the screen recording (demo video) covering: launch, onboarding, account registration, guest mode, manual + AI plant add (camera/gallery permissions), watering, paywall/subscription (sandbox), and account deletion.

2) Devices & OS tested: iPhone 16 Pro (iOS 26, latest) and iPhone 13 (iOS 18). Automated Maestro smoke tests passed on both (onboarding, manual add, watering, paywall, signup, delete-account); camera, gallery, location, notification permissions and sandbox subscription purchase/restore verified manually on physical devices.

3) Functions & target audience: PlantHelper is an offline-first plant-care companion. It identifies plants from photos (AI), diagnoses plant health/diseases (AI), stores the garden offline (SQLite), sends watering reminders (local notifications), adjusts watering with local weather (location-based), provides a 10,000+ plant encyclopedia, optional cloud sync, and in-app account deletion. Problem solved: plant owners don't know what their plant is, how to care for it, or when to water it. Value: fewer dead plants, works offline, no sign-up required (guest mode). Audience: casual houseplant owners and hobbyist gardeners. English + Brazilian Portuguese.

4) Setup & access: Install, complete 3-step onboarding (notifications optional). Sign in with demo account below or continue as guest. Add plant: tap + → Add Manually (free) or Identify with AI (1 free scan; grant camera/gallery). Water: open plant → water button (advances schedule/streak). Premium: PlantHelper Pro banner → Subscribe/Restore (use App Store sandbox tester, no charge). Delete account: Settings → Delete account. Demo login: appreview@planthelper.app / YOUR_DEMO_PASSWORD (pre-seeded with 2 plants). The demo video is the only attachment; sample plant photos are used only while recording it (no separate files are provided).

5) External services: Supabase (auth, database, storage, account-deletion Edge Function); RevenueCat (subscriptions/in-app purchases); Kindwise/Plant.id (AI identification, health diagnosis, encyclopedia data); OpenWeatherMap (weather-aware watering). Reminders are local notifications (no push provider).

6) Regional differences: None; functionally identical across all regions. Only variations: UI language (English/pt-BR, auto + in-app override) and weather/location-adjusted schedules (same logic everywhere). Pricing localized by the App Store.

7) Regulated industry / protected material: Not applicable. Consumer gardening app, no medical/financial/regulated content. No protected third-party material reproduced; plant data is licensed from the Kindwise/Plant.id API with source citations.
```

## Before you paste

- **Item 2** — replace with your actual results. `device-test-matrix.md` has
  unchecked rows (iPhone 16 Pro / iOS 26, iPhone 13 / iOS 18); only claim the
  devices and OS versions you really tested.
- **Demo credentials** are embedded in item 4 (as question 4 requires). You may
  also duplicate them in the dedicated **Sign-in Information** fields.
