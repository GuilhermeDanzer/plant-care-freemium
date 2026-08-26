# Device & OS test matrix

> Fill this in as you run the automated smoke suite (`maestro test
> maestro/flows/`) on each device. Apple expects a real list of the devices and
> OS versions tested before submission.

## Recommended minimum coverage

| Device | OS | Status |
|---|---|---|
| iPhone 16 Pro (or latest) | iOS 26 (latest) | ☐ |
| iPhone 14 / 13 (previous gen) | iOS 18 | ☐ |
| iPad (if `supportsTablet: true`) | iPadOS 18 | ☐ |

## Automated smoke checks (run on each device)

For each device/OS row above, run and tick off:

- [ ] `onboarding.yaml` — launch + 3-step onboarding + empty dashboard
- [ ] `add-plant-manual.yaml` — manual plant addition (offline path)
- [ ] `water-plant.yaml` — plant detail + watering (habit loop)
- [ ] `paywall.yaml` — paywall renders + restore
- [ ] `signup.yaml` — account creation flow
- [ ] `delete-account.yaml` — account deletion flow (use a throwaway account)

Also verify manually (physical device only — these need real hardware):

- [ ] Camera permission prompt → take a photo → AI identification
- [ ] Gallery permission prompt → pick a photo
- [ ] Location permission prompt → weather-aware schedule
- [ ] Notification permission prompt → local reminder fires
- [ ] Sandbox subscription purchase + restore (App Store Connect sandbox tester)

## Notes

- The automated flows assume the app runs in **English**. On a pt-BR device,
  swap the text selectors to the pt-BR labels.
- Record the results in this file (or a copy) before submitting.
