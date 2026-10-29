# App Review — Screen Recording Script

Record this on a **physical iPhone running the latest iOS** (Apple requires a
physical device, not a simulator). Start the recording **before** launching the
app so the launch is captured. Total target: ~3–5 minutes.

A drop-in rehearsal is available as a Maestro flow:
`maestro/flows/app-review-demo.yaml`.

## What Apple requires in the video

- [x] Launch the app
- [x] Typical user flow through core features
- [x] Account registration, login, and deletion
- [x] Accessing paid content (purchase/subscription flow)
- [x] Sensitive-data permission prompts (camera, gallery, location,
      notifications)

> ⚠️ Set the device to **English** and enable a **clean install** (delete the
> app first) so onboarding and permission prompts appear.

---

## Script (frame by frame)

### 0. Before recording
1. Airplane-mode OFF, Wi-Fi ON (AI identification + sync need network).
2. Delete the app, then reinstall (TestFlight or dev build) for a clean state.
3. Prepare `assets/sample-plants/healthy-monstera.jpg` in Photos, or keep a
   real plant nearby.
4. In App Store Connect, have a **sandbox tester** ready for the subscription
   step (Settings → App Store → Sandbox Account, on the device).

### 1. Launch (0:00)
- Tap the PlantHelper icon. Show the splash → onboarding.

### 2. Onboarding (0:05)
- "Welcome to Plant Care" → **Continue**
- "Never forget to water" → grant **notifications** when prompted (shows the
  *sensitive permission* flow) → **Enable Notifications** (or Skip for now if
  the prompt is dismissed).
- "All set!" → **Start using**

### 3. Guest dashboard (0:25)
- Show the empty "No plants registered" state — this proves the app works
  without an account (guest mode).

### 4. Account registration (0:35)
- Tap the user icon (top-right) → switch to **Create account**.
- Enter a new email + password → **Create account**.
- This demonstrates the **registration** flow.

### 5. Add a plant — manual (free) (1:00)
- Tap the floating `+` → **Add Manually**.
- Species: `Monstera` → Nickname: `Living Room` → Water every `7` days → **Save
  Plant**.
- The plant appears on the dashboard.

### 6. Add a plant — AI identification (1:30) (camera + gallery permission)
- Tap `+` → **Identify with AI**.
- Grant **camera** permission (sensitive prompt) → tap **Take photo** → shoot a
  plant (or use `Choose from gallery` to show the **gallery** permission).
- The app shows the identification result → **Save plant** (uses the 1 free
  scan).

### 7. Watering & habit loop (2:20)
- Open the plant → tap the **water** button → the schedule advances and the
  streak updates.

### 8. Paid content / subscription (2:45)
- Return to the dashboard → tap the **PlantHelper Pro** banner (or trigger the
  scan-limit paywall).
- Show the paywall: **Subscribe now** → the App Store sandbox sheet appears →
  complete (or cancel) the **sandbox** purchase. Also tap **Restore purchases**
  to demonstrate restore.
- This covers "accessing paid content / purchase & subscription flow".

### 9. Account deletion (3:30)
- Settings → **Delete account** → confirm.
- Show the "Account deleted successfully" confirmation (this demonstrates the
  **account deletion** flow required by Apple).

### 10. Login (optional, if deletion ended the session) (3:50)
- Sign in again with the demo account (`appreview@planthelper.app` /
  `YOUR_DEMO_PASSWORD`) to show the **login** flow and the synced garden.

---

## Notes for the reviewer
- Use the demo account (see `test-credentials.example.md` — fill in your own
  values) for login/restore demos.
- Subscription: use an App Store Connect **sandbox tester** so no real charge
  occurs; note this in `apple-review-notes.md`.
