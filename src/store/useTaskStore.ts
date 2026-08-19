import AsyncStorage from "@react-native-async-storage/async-storage";
import { create } from "zustand";
import { createJSONStorage, persist } from "zustand/middleware";
import { TaskAction, TaskType } from "@/types/plant";
import { usePlantStore } from "@/store/usePlantStore";

export interface TaskStoreState {
  careStreak: number;
  lastActionDate: string | null;

  completeTask: (
    plantId: string,
    taskType: TaskType,
    actionType: TaskAction
  ) => Promise<void>;

  showMilestoneModal: boolean;
  milestonePlantId: number | null;
  milestoneValue: number | null;
  closeMilestoneModal: () => void;
  setProfileData: (careStreak: number, lastActionDate: string | null) => void;
}

export const useTaskStore = create<TaskStoreState>()(
  persist(
    (set, get) => ({
      careStreak: 0,
      lastActionDate: null,
      showMilestoneModal: false,
      milestonePlantId: null,
      milestoneValue: null,

      closeMilestoneModal: () => set({ showMilestoneModal: false, milestonePlantId: null, milestoneValue: null }),
      setProfileData: (careStreak, lastActionDate) => set({ careStreak, lastActionDate }),

      completeTask: async (plantId, taskType, actionType) => {
        const state = get();
        const now = new Date();

        // Normalize to midnight UTC for easier date math
        const todayUtc = Date.UTC(now.getFullYear(), now.getMonth(), now.getDate());

        let newStreak = state.careStreak;

        if (state.lastActionDate) {
          const lastAction = new Date(state.lastActionDate);
          const lastActionUtc = Date.UTC(
            lastAction.getFullYear(),
            lastAction.getMonth(),
            lastAction.getDate()
          );

          const diffDays = Math.round(
            (todayUtc - lastActionUtc) / (1000 * 60 * 60 * 24)
          );

          if (diffDays === 1) {
            // Yesterday, increment streak
            newStreak += 1;
          } else if (diffDays > 1) {
            // Missed a day, reset to 1
            newStreak = 1;
          }
          // if diffDays === 0, already acted today, streak stays the same
        } else {
          // First action ever
          newStreak = 1;
        }

        // Perform the plant action via usePlantStore
        const plantStore = usePlantStore.getState();

        if (taskType === "REGAR") {
          if (actionType === "WATERED") {
            await plantStore.waterPlant(plantId);
          } else if (actionType === "SOIL_WET") {
            await plantStore.snoozePlant(plantId);
          }
        }
        // If taskType is 'GIRAR' or 'LIMPAR', we might just record it without DB update for now.

        // Check for milestones
        if (newStreak === 14 || newStreak === 30) {
          set({
            showMilestoneModal: true,
            milestonePlantId: plantId,
            milestoneValue: newStreak,
          });
        }

        // Update streak store
        set({
          careStreak: newStreak,
          lastActionDate: now.toISOString(),
        });
      },
    }),
    {
      name: "task-storage",
      storage: createJSONStorage(() => AsyncStorage),
    }
  )
);
