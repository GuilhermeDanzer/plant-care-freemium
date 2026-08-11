import AsyncStorage from "@react-native-async-storage/async-storage";
import { create } from "zustand";
import { createJSONStorage, persist } from "zustand/middleware";

export interface SettingsState {
  hasSeenOnboarding: boolean;
  notificationsEnabled: boolean;
  notificationTime: string; // Formato "HH:mm" ex: "09:00"
  isHydrated: boolean;
  
  completeOnboarding: () => void;
  setNotificationsEnabled: (enabled: boolean) => void;
  setNotificationTime: (time: string) => void;
  setHasHydrated: (state: boolean) => void;
}

export const useSettingsStore = create<SettingsState>()(
  persist(
    (set) => ({
      hasSeenOnboarding: false,
      notificationsEnabled: false,
      notificationTime: "09:00",
      isHydrated: false,
      
      completeOnboarding: () => set({ hasSeenOnboarding: true }),
      setNotificationsEnabled: (enabled) => set({ notificationsEnabled: enabled }),
      setNotificationTime: (time) => set({ notificationTime: time }),
      setHasHydrated: (state) => set({ isHydrated: state }),
    }),
    {
      name: "settings-storage",
      storage: createJSONStorage(() => AsyncStorage),
      onRehydrateStorage: () => (state) => {
        state?.setHasHydrated(true);
      },
    }
  )
);
