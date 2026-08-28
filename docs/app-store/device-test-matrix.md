# Device & OS test matrix

## Recommended minimum coverage

| Device                        | OS              | Status |
| ----------------------------- | --------------- | ------ |
| iPhone 16 Pro (or latest)     | iOS 26 (latest) | x      |
| iPhone 14 / 13 (previous gen) | iOS 18          | x      |

## Automated smoke checks (run on each device)

For each device/OS row above, run and tick off:

- [x] `onboarding.yaml` — launch + 3-step onboarding + empty dashboard
- [x] `add-plant-manual.yaml` — manual plant addition (offline path)
- [x] `water-plant.yaml` — plant detail + watering (habit loop)
- [x] `paywall.yaml` — paywall renders + restore
- [x] `signup.yaml` — account creation flow
- [x] `delete-account.yaml` — account deletion flow (use a throwaway account)

Also verify manually (physical device only — these need real hardware):

- [x] Camera permission prompt → take a photo → AI identification
- [x] Gallery permission prompt → pick a photo
- [x] Location permission prompt → weather-aware schedule
- [x] Notification permission prompt → local reminder fires
- [x] Sandbox subscription purchase + restore (App Store Connect sandbox tester)

## Notes

- The automated flows assume the app runs in **English**. On a pt-BR device,
  swap the text selectors to the pt-BR labels.
- Record the results in this file (or a copy) before submitting.
