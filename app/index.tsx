import { Redirect } from "expo-router";
import { useSettingsStore } from "@/store/useSettingsStore";
import { resolveInitialRoute } from "@/utils/onboarding";

export default function Index() {
  const isHydrated = useSettingsStore((s) => s.isHydrated);
  const hasSeenOnboarding = useSettingsStore((s) => s.hasSeenOnboarding);

  const route = resolveInitialRoute(isHydrated, hasSeenOnboarding);

  if (route === "loading") return null;

  return <Redirect href={route === "onboarding" ? "/onboarding" : "/(main)"} />;
}
