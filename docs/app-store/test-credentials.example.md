# Setup instructions & test credentials (template)

> ⚠️ This is a template. **Do not commit real credentials.** Copy it to
> `test-credentials.md` (gitignored) and fill in your own values only when
> submitting to App Review.

## Demo account (pre-seeded)

Use these credentials to review the app with a populated garden:

| Field | Value |
|---|---|
| Email | `appreview@yourdomain.example` |
| Password | `CHANGE_ME_STRONG_PASSWORD` |
| Seeded data | 2 plants (Monstera "Living Room", Golden Pothos "Kitchen Buddy") + a profile |

Create / reset the account and its seed data with:

```bash
DEMO_PASSWORD='CHANGE_ME_STRONG_PASSWORD' node scripts/create-demo-account.mjs
```

The script signs up (or signs in) via Supabase Auth and seeds the plants
through RLS as the demo user themselves.

## How to access the main features

1. **Install the app** (TestFlight build or a development build).
2. **Launch** → complete the 3-step onboarding (or tap "Skip for now" on the
   notification step).
3. **Sign in** (optional) → tap the user icon in the top-right → enter the demo
   credentials above. Guest mode also works without an account.
4. **Add a plant:**
   - *Manual (free):* tap `+` → "Add Manually" → species / nickname / watering
     frequency → "Save Plant".
   - *AI identify (uses 1 free scan):* tap `+` → "Identify with AI" → grant
     camera/gallery permission → take/choose a photo → confirm.
5. **AI health diagnosis (Premium):** open a plant → "Check health" → capture a
   photo. If not premium, the paywall is shown.
6. **Watering:** a plant card shows "Water TODAY"/"Overdue". Open it → tap the
   water button to mark watered and advance the streak.
7. **Premium / paywall:** tap the "PlantHelper Pro" banner (or trigger a scan
   limit) → "Subscribe now" / "Restore purchases". Use a **sandbox** tester for
   a test purchase (no real charge).
8. **Account deletion:** Settings → "Delete account" → confirm (hard-deletes
   server-side).

## Sample files

- Sample plant photos for the recording live in `assets/sample-plants/`
  (`healthy-monstera.jpg`, `diseased-leaf.jpg`). See the README there.
