# Prompt — "Generate Apple App Review Notes text (Questions 2–7, ≤4,000 chars)"

Reusable prompt. Paste this into an AI coding agent to regenerate the Apple App
Review **Notes** field for any app. A worked example of the expected output is
[`app-review-note-4000.md`](app-review-note-4000.md).

---

I'm preparing an Apple App Store submission for **[APP NAME]** (an app in this
repo). Apple's App Review Information form only allows **ONE file attachment** —
the screen-recording demo video — so every written requirement must fit in the
**Notes text field, which has a 4,000-character limit**.

Investigate this codebase and generate a single paste-ready Notes block that
answers Apple's numbered questions 2–7 (plus item 1 describing the attached
video). Use only facts found in the repo (README, FEATURES/ARCHITECTURE docs,
code, `docs/app-store/` if present). Never invent test devices, credentials, or
services.xq

**Gather these facts first:**
- App name, what it does, category, platform (iOS/Android), target audience
- Core features and flows (read FEATURES.md / README / app screens)
- External services, APIs, SDKs (search for supabase, firebase, revenuecat,
  stripe, openai, aws, etc.)
- Auth: sign-in methods, demo/test credentials, account deletion
- Localization languages and any region-specific behavior
- Any regulated-industry concerns or licensed third-party content

**Output exactly this structure:**

```
1) The attached file is the screen recording (demo video) covering: [launch, onboarding, account registration/login, guest mode, core features, sensitive permission prompts, paid content (sandbox purchase + restore), account deletion — list what applies]

2) Devices & OS tested: [real devices + OS versions from your actual test matrix — only claim what was really tested]

3) Functions & target audience: [2–4 sentences: what the app does, the problem it solves, the value it provides, target audience, languages]

4) Setup & access: [step-by-step: install, onboarding, sign in with demo account or guest, how to access main features, paid/premium flow + restore, account deletion]. Demo login: [email / password]. [State explicitly that the demo video is the only attachment and any sample files are used only during recording — no separate files are provided.]

5) External services: [list each with its purpose in parentheses, e.g. "Supabase (auth, database, storage)"]. [Note if notifications are local vs. a push provider.]

6) Regional differences: [Confirm "none — functionally identical across all regions" OR describe actual differences: languages, region-gated features, pricing localization.]

7) Regulated industry / protected material: [Confirm "not applicable" with a one-line justification OR describe documentation/credentials provided.]
```

**Rules:**
- Total text must be **≤ 4,000 characters** — count it and report the exact
  number.
- Answer every numbered item; if something doesn't apply (no account, no
  subscriptions, no location), say so briefly instead of omitting it.
- If the app operates in a regulated industry (health/medical, finance,
  gambling, alcohol) or reproduces licensed/protected content, flag it and tell
  me what credentials or documentation I need to attach/provide.
- Plain text only (no markdown headings, no tables) — it's pasted into a plain
  text field.
