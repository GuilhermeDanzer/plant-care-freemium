# Regional differences

**The app functions consistently across all regions where it is available.**

- **Languages:** the UI is fully localized in **English** and **Brazilian
  Portuguese (pt-BR)**. The app automatically selects the device language and
  also allows an in-app language override (Settings → Language).
- **AI/lexicon content language:** the Kindwise/Plant.id requests are made with
  `language: pt` for botanical content (common names, descriptions), which is
  then surfaced consistently regardless of the user's region. Content is
  educational plant data, not region-gated.
- **Weather-driven behavior:** watering schedules are the one area that adapts
  to the user's **location** (temperature and rainfall). This is a functional
  behavior (the same logic runs everywhere), not a regional content difference.
- **Currency/price:** subscription pricing is localized by the App Store /
  RevenueCat; there is no hardcoded regional price difference in the app.

**Conclusion:** No region-specific feature toggles, no region-restricted
content, and no geo-gating. The app can be confirmed as functionally identical
across all regions, with localization as the only per-locale variation.
