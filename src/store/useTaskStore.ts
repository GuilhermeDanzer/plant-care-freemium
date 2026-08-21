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
  milestonePlantId: string | null;
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
        let shouldIncrementStreak = false;

        const plantStore = usePlantStore.getState();
        const plant = plantStore.plants.find(p => p.id === plantId);
        
        let needsWatering = false;
        if (plant) {
          needsWatering = now >= new Date(plant.next_watering_at);
        }

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
            // Yesterday. Increment streak ONLY if the plant actually needs watering 
            // (or if it's not a watering task, but for this context it's primarily watering)
            if (taskType === "REGAR" && actionType === "WATERED" && !needsWatering) {
               // Premature watering: keep streak as is
               shouldIncrementStreak = false;
            } else {
               shouldIncrementStreak = true;
            }
          } else if (diffDays > 1) {
            // Missed a day, reset to 1 (or 0 if they watered prematurely on a reset day? 
            // Usually missed a day means streak is lost. Let's just start a new streak.)
            newStreak = 1;
            shouldIncrementStreak = false; // Already reset to 1
          }
          // if diffDays === 0, already acted today, streak stays the same
        } else {
          // First action ever
          shouldIncrementStreak = true;
        }

        if (shouldIncrementStreak) {
          newStreak += 1;
        }

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
