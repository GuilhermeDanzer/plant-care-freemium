# PlantHelper — Roadmap

Work in progress is tracked here and in GitHub issues.

## Security & compliance

- [ ] Move the Plant.id API key off the client into a Supabase Edge Function
      (the current `EXPO_PUBLIC_PLANT_ID_API_KEY` is a client-side key).
- [ ] Rotate the OpenWeatherMap key and proxy it the same way.
- [ ] Add rate limiting / quotas per user for AI scans.

## Features

- [ ] Offline queue: retry failed AI scans once connectivity returns.
- [ ] Garden backup/export (JSON + share sheet).
- [ ] Social sharing of plant cards.
- [ ] Push notifications (move reminders from local to server push).
- [ ] More locales beyond EN / pt-BR.

## Platform & reliability

- [ ] Keep the Jest + Maestro suites green in CI (already wired in
      `.github/workflows/ci.yml` and `e2e-ios.yml`).
- [ ] Reduce app binary size (icons/sprites, `*.ipa` artifacts stay out of git).
- [ ] Document a reproducible release pipeline (`eas build` + TestFlight/Play).

## App Store

- [ ] Automate the App Review note generation from
      `docs/app-store/PROMPT-generate-review-note.md`.
