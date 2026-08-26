import { useSettingsStore } from "@/store/useSettingsStore";

describe("useSettingsStore", () => {
  beforeEach(() => {
    useSettingsStore.setState({
      hasSeenOnboarding: false,
      notificationsEnabled: false,
      notificationTime: "09:00",
      isHydrated: false,
    });
  });

  it("starts with sensible defaults", () => {
    const s = useSettingsStore.getState();
    expect(s.hasSeenOnboarding).toBe(false);
    expect(s.notificationsEnabled).toBe(false);
    expect(s.notificationTime).toBe("09:00");
  });

  it("completeOnboarding flips the flag", () => {
    useSettingsStore.getState().completeOnboarding();
    expect(useSettingsStore.getState().hasSeenOnboarding).toBe(true);
  });

  it("setNotificationsEnabled updates the flag", () => {
    useSettingsStore.getState().setNotificationsEnabled(true);
    expect(useSettingsStore.getState().notificationsEnabled).toBe(true);
  });

  it("setNotificationTime updates the time", () => {
    useSettingsStore.getState().setNotificationTime("18:30");
    expect(useSettingsStore.getState().notificationTime).toBe("18:30");
  });

  it("setHasHydrated updates the hydration flag", () => {
    useSettingsStore.getState().setHasHydrated(true);
    expect(useSettingsStore.getState().isHydrated).toBe(true);
  });
});
