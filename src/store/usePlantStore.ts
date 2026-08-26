import { create } from "zustand";
import { persist, createJSONStorage } from "zustand/middleware";
import AsyncStorage from "@react-native-async-storage/async-storage";
import * as FileSystem from "expo-file-system";
import { supabase } from "@/lib/supabase";
import {
  clearAllLocalData,
  countMyPlants,
  deletePlantById,
  getMyPlants,
  insertPlant,
  InsertPlantInput,
  markWateredAt,
  snoozeWateringAt,
  saveHealthCheck,
  updatePlantRecord,
  UpdatePlantInput,
  insertJournalEntry,
  getJournalEntriesForPlant,
  deleteJournalEntry
} from "@/database/db";
import { authService } from "@/services/authService";
import { plantService } from "@/services/plantService";
import { subscriptionService } from "@/services/subscriptionService";
import { notificationService } from "@/services/notificationService";
import { AppUser, HealthAssessmentResponse, PlantRecord, JournalEntry } from "@/types/plant";
import { performFullSync } from "@/services/SyncService";
import { FREE_PLANT_LIMIT } from "@/utils/constants";

interface PlantStoreState {
  plants: PlantRecord[];
  isLoading: boolean;
  hasLoaded: boolean;
  isPremium: boolean;
  user: AppUser | null;
  isAuthenticated: boolean;
  lastSyncedAt: Date | null;
  totalFreeScansUsed: number;
  monthlyPremiumScansUsed: number;

  loadPlants: (options?: { showLoading?: boolean }) => Promise<void>;
  addPlant: (payload: InsertPlantInput) => Promise<boolean>;
  deletePlant: (plantId: string) => Promise<void>;
  waterPlant: (plantId: string) => Promise<void>;
  snoozePlant: (plantId: string) => Promise<void>;
  updatePlant: (plantId: string, data: UpdatePlantInput) => Promise<void>;
  checkHealth: (
    plantId: string,
    imageUris: string[]
  ) => Promise<HealthAssessmentResponse | null>;

  addJournalEntry: (plantId: string, imageUri: string, note?: string) => Promise<void>;
  deleteJournalEntry: (id: string) => Promise<void>;
  getJournalForPlant: (plantId: string) => Promise<JournalEntry[]>;

  setPremium: (value: boolean) => void;
  setUser: (user: AppUser | null) => void;
  signOut: () => Promise<void>;
  /** Clears in-memory garden state (plants, hydration flag, last sync). */
  clearGarden: () => void;
  /** Clears the local SQLite garden + in-memory state. Used on logout. */
  resetGarden: () => Promise<void>;

  /** Lê o status atual do RevenueCat e hidrata `isPremium`. */
  syncSubscription: () => Promise<void>;

  /**
   * Stub de sincronização com o Supabase. Hoje só loga no console — a
   * implementação real (merge local-first) vai entrar aqui.
   */
  syncDataWithSupabase: () => Promise<void>;
}

export const usePlantStore = create<PlantStoreState>()(
  persist(
    (set, get) => ({
      plants: [],
  isLoading: false,
  hasLoaded: false,
  isPremium: false,
  user: null,
  isAuthenticated: false,
  lastSyncedAt: null,
  totalFreeScansUsed: 0,
  monthlyPremiumScansUsed: 0,

  loadPlants: async (options) => {
    const showLoading = options?.showLoading ?? true;
    if (showLoading) set({ isLoading: true });

    try {
      const plants = await getMyPlants();
      set({ plants, hasLoaded: true });
    } finally {
      if (showLoading) set({ isLoading: false });
    }
  },

  addPlant: async (payload) => {
    // Ticket 2: Removed FREE_PLANT_LIMIT for manual additions
    await insertPlant(payload);
    await get().loadPlants({ showLoading: false });
    await get().syncDataWithSupabase();
    return true;
  },

  deletePlant: async (plantId) => {
    // A) Remote Delete: Trigger Supabase remote deletion FIRST
    try {
      await supabase.from("plants").delete().eq("id", plantId);
    } catch (e) {
      console.warn("[deletePlant] Failed remote delete:", e);
    }

    // B) SQLite deletion: Hard delete locally
    await deletePlantById(plantId);

    // C) FileSystem local image deletion
    const plant = get().plants.find((p) => p.id === plantId);
    if (plant?.image_uri && plant.image_uri.startsWith("file://")) {
      try {
        await FileSystem.deleteAsync(plant.image_uri, { idempotent: true });
      } catch (e) {
        console.warn("[deletePlant] Falha ao deletar imagem local:", e);
      }
    }

    // D) State Eradication: Update local state array to reflect the UI
    set((state) => ({
      plants: state.plants.filter((p) => p.id !== plantId),
    }));

    // Trigger sync
    await get().syncDataWithSupabase();
  },

  waterPlant: async (plantId) => {
    await markWateredAt(plantId, new Date());
    await get().loadPlants({ showLoading: false });
    await get().syncDataWithSupabase();
  },

  snoozePlant: async (plantId) => {
    await snoozeWateringAt(plantId, 2);
    await get().loadPlants({ showLoading: false });
    await get().syncDataWithSupabase();
  },

  updatePlant: async (plantId, data) => {
    await updatePlantRecord(plantId, data);
    await get().loadPlants({ showLoading: false });
    await get().syncDataWithSupabase();
  },

  checkHealth: async (plantId, imageUris) => {
    const { isPremium } = get();
    if (!isPremium) return null;
    if (!imageUris || imageUris.length === 0) return null;

    try {
      const result = await plantService.assessPlantHealth(imageUris);
      await saveHealthCheck(plantId, result, new Date());
      await get().loadPlants({ showLoading: false });
      await get().syncDataWithSupabase();
      return result;
    } catch (error) {
      console.error("[usePlantStore] checkHealth falhou.", error);
      return null;
    }
  },

  addJournalEntry: async (plantId, imageUri, note) => {
    await insertJournalEntry(plantId, imageUri, note || null);
    await get().syncDataWithSupabase();
  },

  deleteJournalEntry: async (id) => {
    await deleteJournalEntry(id);
    await get().syncDataWithSupabase();
  },

  getJournalForPlant: async (plantId) => {
    return await getJournalEntriesForPlant(plantId);
  },

  // Setter puro. O RevenueCat é a fonte da verdade — o listener global em
  // `app/_layout.tsx` chama este setter sempre que o CustomerInfo muda.
  setPremium: (value) => set({ isPremium: value }),

  setUser: (user) => set({ user, isAuthenticated: Boolean(user) }),

  signOut: async () => {
    try {
      await authService.signOut();
    } catch (error) {
      console.warn("[usePlantStore.signOut] Falha ao encerrar sessão.", error);
    }
    // The useAuth listener (onAuthStateChange -> SIGNED_OUT) also clears the
    // user, but we reset here immediately so the UI reacts without waiting.
    // Premium also goes back to false: without a session there is no active
    // entitlement. Local plants are wiped so a different account logging in
    // does not inherit the previous user's offline garden.
    await get().resetGarden();
    await notificationService.cancelAllScheduledNotifications();
    set({ user: null, isAuthenticated: false, isPremium: false });
  },

  clearGarden: () => {
    set({ plants: [], hasLoaded: false, lastSyncedAt: null });
  },

  resetGarden: async () => {
    try {
      await clearAllLocalData();
    } catch (error) {
      console.warn(
        "[usePlantStore.resetGarden] Falha ao limpar dados locais.",
        error
      );
    }
    get().clearGarden();
  },

  syncSubscription: async () => {
    const { isActive } = await subscriptionService.checkSubscription();
    set({ isPremium: isActive });
  },

  syncDataWithSupabase: async () => {
    const { user } = get();
    if (!user) {
      console.log(
        "[syncDataWithSupabase] Nenhum usuário logado. Sincronização ignorada."
      );
      return;
    }

    // Skip sync for anonymous users — they have no Supabase row-level
    // security entitlement. Only real accounts sync to the cloud.
    if (user.isAnonymous) {
      console.log(
        "[syncDataWithSupabase] Usuário anônimo. Sincronização ignorada."
      );
      return;
    }

    console.log(
      `[syncDataWithSupabase] Iniciando sincronização para o usuário ${user.id}...`
    );

    try {
      const lastSyncedAtIso = get().lastSyncedAt?.toISOString() || null;
      const newSyncTime = await performFullSync(user.id, lastSyncedAtIso);
      set({ lastSyncedAt: new Date(newSyncTime) });

      // Reload plants from SQLite to reflect any remote changes pulled down.
      await get().loadPlants({ showLoading: false });
    } catch (error) {
      console.error("[usePlantStore] syncDataWithSupabase failed:", error);
    }
  },
    }),
    {
      name: "plant-store",
      storage: createJSONStorage(() => AsyncStorage),
      partialize: (state) => ({
        isPremium: state.isPremium,
        user: state.user,
        isAuthenticated: state.isAuthenticated,
        lastSyncedAt: state.lastSyncedAt,
        totalFreeScansUsed: state.totalFreeScansUsed,
        monthlyPremiumScansUsed: state.monthlyPremiumScansUsed,
      }),
    }
  )
);
