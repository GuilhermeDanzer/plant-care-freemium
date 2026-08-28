# App Store Review — Deliverables Overview

This bundle contains everything Apple asks for in the App Review submission
(resolution center / App Review Information). It maps 1:1 to the questions
Apple asks for apps with accounts, subscriptions, user content and sensitive
permissions.

| # | Apple requirement | File |
|---|---|---|
| 1 | Screen recording on a physical device | `app-review-demo-script.md` (+ `../../maestro/flows/app-review-demo.yaml` for rehearsal) |
| 2 | Devices & OS tested | `device-test-matrix.md` |
| 3 | Functions & target audience | `app-description.md` |
| 4 | Setup instructions, credentials, samples | `test-credentials.md` |
| 5 | External services / tools / platforms | `external-services.md` |
| 6 | Regional differences | `regional-support.md` |
| 7 | Regulated industry / protected material | `regulated-industry.md` |
| — | Ready-to-paste App Review Information | `apple-review-notes.md` |
| — | Single-field Notes (≤ 4,000 chars, Q2–7) | `app-review-note-4000.md` |
| — | Reusable prompt to regenerate the Notes text | `PROMPT-generate-review-note.md` |

## Quick facts

- **Product name:** PlantHelper
- **Bundle ID:** `com.danzer.planticare`
- **Category:** Lifestyle / Gardening
- **Demo account:** `appreview@planthelper.app` / `YOUR_DEMO_PASSWORD`
- **Monetization:** Freemium — one free AI scan, then a `PlantHelper Pro`
  subscription (RevenueCat), manual plant addition is always free.
