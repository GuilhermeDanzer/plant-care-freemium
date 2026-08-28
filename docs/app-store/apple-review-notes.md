# App Review Information (ready to paste)

Use the text below in App Store Connect → **App Review Information** (and the
resolution center, if asked).

---

**Sign-in / demo account**

- Email: `appreview@planthelper.app`
- Password: `YOUR_DEMO_PASSWORD`
- The account is pre-seeded with sample plants so the reviewer can explore
  immediately. A guest mode is also available (no sign-in required).

**Contact information**

- Name / role: Guilherme Danzer de Oliveira / Owner
- Email: developer@example.com
- Phone: +1 (555) 000-0000

**Testing notes**

1. Install and launch the app. Complete the 3-step onboarding.
2. Add a plant via the `+` button ("Add Manually" is free; "Identify with AI"
   uses 1 free scan).
3. Watering reminders are **local notifications** — enable notifications in
   onboarding or Settings.
4. **Subscription:** the `PlantHelper Pro` paywall is reachable via the premium
   banner on the home screen. Use an **App Store Connect sandbox tester** to
   complete a test purchase (no real charge). Restore purchases is available on
   the paywall.
5. **Account deletion:** Settings → "Delete account" (hard-deletes the account
   server-side).

**Permissions requested (and why)**

- **Camera** — to photograph plants for AI identification and health diagnosis.
- **Photo library** — to pick plant photos from the gallery.
- **Location** — to fetch local weather and adjust the watering schedule.
- **Notifications** — to deliver watering reminders.

**Tracking**

- The app does **not** use the App Tracking Transparency (ATT) framework and
  does not collect the IDFA. No tracking prompt is shown.

**Sensitive APIs / compliance**

- No HealthKit, no financial/medical data, no user-generated public content.
- The app is not in a regulated industry; no protected third-party material is
  reproduced (plant data is licensed from the Kindwise/Plant.id API).
