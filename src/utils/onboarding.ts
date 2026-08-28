/**
 * Resolves where to route on app launch.
 *
 * Returns "loading" until the persisted settings have hydrated (to avoid
 * flashing the wrong screen before AsyncStorage finishes loading), then
 * "onboarding" for first-time users and "main" for everyone else.
 */
export type InitialRoute = "loading" | "onboarding" | "main";

export const resolveInitialRoute = (
  isHydrated: boolean,
  hasSeenOnboarding: boolean
): InitialRoute => {
  if (!isHydrated) return "loading";
  return hasSeenOnboarding ? "main" : "onboarding";
};
