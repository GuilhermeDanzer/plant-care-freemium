# Maestro E2E flows for PlantHelper

[Maestro](https://maestro.mobile.dev) drives the real app on a simulator or
physical device by matching on-screen text / accessibility labels.

## Prerequisites

1. Install Maestro:
   ```bash
   curl -fsSL "https://get.maestro.mobile.dev" | bash
   ```
2. Build & install a **development client** (RevenueCat is not available in
   Expo Go, so E2E targets the dev build):
   ```bash
   eas build --platform ios --profile development   # or preview
   # then install the .app on a booted simulator:
   xcrun simctl boot "iPhone 16 Pro"
   xcrun simctl install booted path/to/PlantHelper.app
   ```

## Run a flow

```bash
maestro test maestro/flows/onboarding.yaml
# or the full review rehearsal:
maestro test maestro/flows/app-review-demo.yaml
```

> ⚠️ Selector caveat: flows assume the app is running in **English**. If the
> device locale is `pt-BR` the labels will be translated — swap the selectors
> accordingly. Maestro matches on `text`, `id` (testID) or `label`.
