# Workspace Rules for React Native Project

## 1. Internationalization (i18n) [STRICT]
- **ALWAYS** use `react-i18next` (`useTranslation`) for ANY text rendered on the screen.
- **NEVER** hardcode strings in Portuguese, English, or any language directly into React components.
- Alerts, Toasts, and Error messages must also use translated strings.

## 2. Dynamic & Reusable Components (90% Rule) [PRIORITY]
- Assume that **90% of the UI will be dynamic and reusable**. 
- **NEVER** duplicate UI structures. If a pattern (like a list item with an icon, title, subtitle, and an action) appears more than once, it **MUST** be extracted into a generic, flexible component in `src/components/`.
- Generic components should be agnostic to the business logic. 
  - *Bad:* `<LanguageSettingsItem />`
  - *Good:* `<ListItem icon={Globe} title={...} subtitle={...} rightElement={<Switch />} />`

## 3. Composition Over Configuration
- Use React `children` or specific slot props (e.g., `rightElement`, `leftAccessory`) instead of creating complex conditional rendering inside reusable components.
- Components should accept styling overrides via `style` or `className` (if using NativeWind/Tailwind) so they can adapt to their containers.

## 4. Separation of Concerns (Logic vs. UI)
- **Screens/Routes** (`src/app/` or `src/screens/`) should be as "dumb" as possible. They are responsible for layout composition, not complex logic.
- Complex state management, API calls, and business logic MUST be extracted into **Custom Hooks** (e.g., `useSettingsLogic.ts`).
- **Services** (`src/services/`) handle external APIs, third-party libraries (Notifications, Auth), and local storage.

## 5. File & Folder Structure Strictness
- **`src/components/ui/`**: Dumb, highly reusable generic components (Buttons, Inputs, ListItems, Cards, Modals).
- **`src/components/domain/`** (or feature specific): Components that are tied to business logic (e.g., `<PlantCard />`).
- **`src/hooks/`**: Reusable logic.
- **`src/store/`**: Global state (Zustand, Redux).
- Max lines per file: Keep files under 150-200 lines. If it gets larger, it means it's doing too much. Extract components or logic.

## 6. Styling Best Practices
- Prefer utility classes (Tailwind/NativeWind) for layout and typography.
- Use `StyleSheet.create` ONLY for complex properties that Tailwind cannot handle well (like specific shadow layering, animations, or dynamic dimension calculations).
- Keep consistent spacing, typography, and colors using the theme configuration.

## 7. State Management Separation (Zustand vs. React Query) [STRICT]
- **Zustand:** Must ONLY be used for synchronous, global client state, such as Settings, Local SQLite synchronization, and tracking Scan Balances[cite: 1].
- **TanStack React Query:** Must be used for ALL asynchronous network state, cache invalidation, and retry logic for external endpoints (e.g., Kindwise API)[cite: 1].

## 8. Routing and Architectural Boundaries [PRIORITY]
- **Expo Router:** Use file-based routing within the `/app` directory strictly for presentational layers and navigation[cite: 1].
- **Domain Logic Separation:** Never put core business rules in the `/app` directory[cite: 1]. All business logic, hooks, services, and raw SQL repositories must reside within the `/src` directory to enforce the boundary between UI and domain[cite: 1].

## 9. Offline-First & SQLite Hydration
- **Single Source of Truth:** Expo SQLite (using the asynchronous driver) must be treated as the single source of truth for offline-first garden data[cite: 1].
- **Hydration Flow:** Database initialization and migrations must occur in `_layout.tsx` upon app launch[cite: 1]. The UI components (like the Dashboard) must invoke Zustand actions (e.g., `loadPlants()`), which in turn execute raw SQL queries to hydrate React's in-memory state[cite: 1].

## 10. Cost Control & API Rate Limiting [CRITICAL]
- **Request Merging:** When calling expensive computer vision APIs (like Kindwise), always merge requests (e.g., using `health: "all"`) to yield both taxonomy and disease data in a single round-trip[cite: 1].
- **Deterministic Caching:** Before executing external Axios calls for image analysis, convert the image to base64, hash it, and check for an AsyncStorage cache hit[cite: 1]. You must halt network requests if a duplicate payload was made within a 24-hour TTL[cite: 1].
- **Cost Gating:** The `usePlantStore` must track `totalFreeScansUsed` (persisted to AsyncStorage)[cite: 1]. If `isPremium` is false, force the user to the RevenueCat paywall interceptor (`paywall.tsx`) when the threshold is met[cite: 1].

## 11. End-to-End Testing & UI Interactivity
- **Mandatory testID:** ALL interactive components (Buttons, Navigation tabs, list items) MUST implement the `testID` prop[cite: 1]. This is a strict requirement to allow deterministic interactions from the Swift driver for XCUITest and Fastlane snapshot testing[cite: 1].

## 12. Local Habit Loops (Notifications)
- **No Remote Cron Jobs:** Watering schedules and reminders must NOT be managed by remote backend cron jobs[cite: 1].
- **Local Event Sourcing:** Calculate the delta between current time and next action locally[cite: 1]. Use `expo-notifications` with `TimeIntervalTrigger` to create zero-latency, zero-cost retention triggers mapped strictly to the local device[cite: 1].

## 13. Styling & Animations
- **NativeWind:** Use NativeWind utility classes (compiled via Babel) as the primary styling pipeline[cite: 1].
- **Reanimated:** Use `react-native-reanimated` strictly for complex animations[cite: 1].
## 14. Proactive End-to-End Feature Completion [CRITICAL]
- **No Orphaned Code:** Never build a feature or business logic that just "floats in space". If a feature requires a UI to be usable, proactively build the UI and wire it up to the app's routing and state management.
- **Do Not Ask for Permission to Finish:** Complete features end-to-end automatically. Do not stop after building the backend/hooks to ask the user if they want it integrated into the app. Assume full integration is required unless explicitly instructed otherwise.

## 15. Living Documentation (ARCHITECTURE.md & FEATURES.md) [MANDATORY]
- **Continuous Documentation:** You MUST NOT consider any task, feature implementation, or major refactor complete until you have updated the project's documentation.
- **Check & Create:** Upon completing a task, always check for the existence of `ARCHITECTURE.md` and `FEATURES.md` in the root directory. If either file does not exist, you MUST create it using a standard professional template before proceeding.
- **Update `FEATURES.md`:** 
  - Add or update the list of features. 
  - Briefly describe what the feature does, its current status (e.g., MVP, Work in Progress, Done), and list the main files, components, or routes involved.
- **Update `ARCHITECTURE.md`:** 
  - If the task introduced a new library, changed the database schema, altered the data flow, or established a new design pattern, you MUST append this information to `ARCHITECTURE.md`.
  - Ensure the architecture document strictly reflects the *current* state of the codebase, not an outdated plan.
- **Final Step Validation:** Before generating the final message stating the task is complete, double-check that both markdown files reflect the latest changes.

## 16. Absolute Imports & Path Aliasing (STRICT MODE) [MANDATORY]
- **NEVER** use ANY relative imports for internal modules (e.g., `../services/`, `../../components/`, or even `./types`).
- **ALWAYS** use absolute path aliases defined in the project (e.g., `@/services/authService`, `@/store/usePlantStore`).
- Every internal import MUST start with `@/` to ensure files can be safely moved across directories without breaking paths.
- Third-party packages (node_modules) remain standard (e.g., `import { useState } from "react";`).
## 17. Non-Destructive Editing & Feature Preservation [CRITICAL]
- **NEVER** remove, overwrite, or comment out existing features, UI elements, or logic unless EXPLICITLY instructed to do so by the user.
- **INTEGRATE, DO NOT REPLACE:** When asked to add a new feature (e.g., a new button, a new upload method), you MUST integrate it alongside the existing features. If a component has feature A and the user asks for feature B, the final code MUST contain both A and B.
- **NO LAZY CODING:** Do not use placeholders like `// ... existing code ...` and then accidentally delete code during file writes. You must carefully merge your changes with the current file state.
- **PRE-FLIGHT CHECK:** Before saving any modifications to a file, double-check: "Did I accidentally remove an existing import, function, or UI element that was not mentioned in the prompt?" If yes, revert and fix it.

## 18. Expo Native Permissions & Plugins [CRITICAL]
- **ALWAYS Verify `app.json` Plugins:** When adding or using libraries that require native permissions (e.g., `expo-image-picker`, `expo-location`, `expo-camera`, `expo-notifications`), you MUST check `app.json` to ensure the corresponding plugin is declared.
- **Provide Usage Descriptions:** You must include the proper permission messages (e.g., `cameraPermission`, `photosPermission`) in the plugin config to prevent the app from crashing in production or during local builds.

## 19. Supabase Migrations Workflow [CRITICAL]
- **No Raw SQL in Chat:** NEVER provide raw SQL in the chat for the user to run manually when making database modifications (creating tables, altering columns, adding indexes, updating RLS policies, or inserting seed data).
- **Automated CLI Workflow:** You MUST execute schema changes automatically using the terminal:
  1. Run `supabase migration new <descriptive_name>`.
  2. Locate the newly created timestamped file in `supabase/migrations/` and write the exact SQL DDL/RLS inside it.
  3. Run `supabase db push` to apply it to the remote database.
  4. Verify the terminal output.
- **Single Source of Truth:** The repository's migration history is the single source of truth for the database schema. Do not bypass this workflow.