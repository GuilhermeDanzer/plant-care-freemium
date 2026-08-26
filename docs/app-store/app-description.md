# App Description (functions & target audience)

## What the app is

PlantHelper is an offline-first plant-care companion for houseplant owners. It
combines AI plant identification, AI health diagnosis, and a watering habit
loop with local notifications, so users know **what** their plant is, **how
healthy** it is, and **when** to water it — even without an internet
connection.

## Core functions

1. **AI plant identification** — take a photo and the app identifies the
   species and suggests an ideal watering frequency (Kindwise / Plant.id).
2. **AI health assessment** — analyze a leaf/plant photo to detect diseases
   and receive treatment and prevention guidance.
3. **Offline-first plant collection** — the garden is stored in a local SQLite
   database, so it loads instantly and works without connectivity.
4. **Watering reminders & habit loop** — set a per-plant schedule; the app
   schedules local notifications and tracks a care streak (gamified).
5. **Weather-aware watering** — location and current weather adjust the ideal
   next-watering date (less water after rain, longer intervals when cold).
6. **Plant encyclopedia (lexicon)** — search 10,000+ plants for care tips,
   taxonomy, propagation and watering guidance.
7. **Account & cloud sync** — optional account to sync the garden across
   devices (Supabase), with a guest mode for instant use.
8. **Account deletion** — full in-app account deletion (server-side hard delete
   via a Supabase Edge Function).

## Problem it solves

People buy houseplants but struggle with three things: identifying them,
knowing how to care for them, and remembering to water them on the right
schedule. PlantHelper removes the guesswork by turning a photo into a concrete
care plan and then nudging the user at the right time.

## Value provided

- Saves plants from over/under-watering via AI-driven, weather-adjusted
  schedules and reminders.
- Reduces barrier to entry: no sign-up required (guest mode).
- Works offline, so care tracking is reliable in any environment.

## Target audience

- Casual houseplant owners (primary).
- Hobbyist gardeners and plant collectors who want disease diagnosis and care
  history.
- Users on iOS (and Android), localized in **English** and **Brazilian
  Portuguese (pt-BR)**.

## Age rating & suitability

- No user-generated public content, no social features, no chat.
- Content is educational/gardening only — suitable for all ages (4+).
