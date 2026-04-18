import AsyncStorage from "@react-native-async-storage/async-storage";
import { create } from "zustand";
import {
  countMyPlants,
  deletePlantById,
  getMyPlants,
  insertPlant,
  InsertPlantInput,
  markWateredAt,
  saveHealthCheck,
  updatePlantRecord,
  UpdatePlantInput,
} from "../database/db";
import { plantService } from "../services/plantService";
import {
  PREMIUM_STORAGE_KEY,
  subscriptionService,
} from "../services/subscriptionService";
import { AppUser, HealthAssessmentResponse, PlantRecord } from "../types/plant";
import { FREE_PLANT_LIMIT } from "../utils/constants";

interface PlantStoreState {
  plants: PlantRecord[];
  isLoading: boolean;
  hasLoaded: boolean;
  isPremium: boolean;
  user: AppUser | null;
  isAuthenticated: boolean;
  lastSyncedAt: Date | null;

  loadPlants: (options?: { showLoading?: boolean }) => Promise<void>;
  addPlant: (payload: InsertPlantInput) => Promise<boolean>;
  deletePlant: (plantId: number) => Promise<void>;
  waterPlant: (plantId: number) => Promise<void>;
  updatePlant: (plantId: number, data: UpdatePlantInput) => Promise<void>;
  checkHealth: (
    plantId: number,
    imageUri: string
  ) => Promise<HealthAssessmentResponse | null>;

  setPremium: (value: boolean) => Promise<void>;
  setUser: (user: AppUser | null) => void;

  /** Lê o isPremium persistido e popula o estado. */
  syncSubscription: () => Promise<void>;

  /**
   * Stub de sincronização com o Supabase. Hoje só loga no console — a
   * implementação real (merge local-first) vai entrar aqui.
   */
  syncDataWithSupabase: () => Promise<void>;
}

const persistPremiumFlag = async (value: boolean): Promise<void> => {
  try {
    await AsyncStorage.setItem(PREMIUM_STORAGE_KEY, value ? "true" : "false");
  } catch (error) {
    console.warn("[usePlantStore] Falha ao persistir Premium.", error);
  }
};

export const usePlantStore = create<PlantStoreState>((set, get) => ({
  plants: [],
  isLoading: false,
  hasLoaded: false,
  isPremium: false,
  user: null,
  isAuthenticated: false,
  lastSyncedAt: null,

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
    const { isPremium } = get();
    if (!isPremium) {
      const count = await countMyPlants();
      if (count >= FREE_PLANT_LIMIT) return false;
    }
    await insertPlant(payload);
    await get().loadPlants({ showLoading: false });
    return true;
  },

  deletePlant: async (plantId) => {
    await deletePlantById(plantId);
    await get().loadPlants({ showLoading: false });
  },

  waterPlant: async (plantId) => {
    await markWateredAt(plantId, new Date());
    await get().loadPlants({ showLoading: false });
  },

  updatePlant: async (plantId, data) => {
    await updatePlantRecord(plantId, data);
    await get().loadPlants({ showLoading: false });
  },

  checkHealth: async (plantId, imageUri) => {
    const { isPremium } = get();
    if (!isPremium) return null;
    if (!imageUri) return null;

    try {
      const result = await plantService.assessPlantHealth(imageUri);
      await saveHealthCheck(plantId, result, new Date());
      await get().loadPlants({ showLoading: false });
      return result;
    } catch (error) {
      console.error("[usePlantStore] checkHealth falhou.", error);
      return null;
    }
  },

  setPremium: async (value) => {
    set({ isPremium: value });
    await persistPremiumFlag(value);
  },

  setUser: (user) => set({ user, isAuthenticated: Boolean(user) }),

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

    console.log(
      `Iniciando sincronização para o usuário ${user.id}...`
    );

    // TODO: Substituir pelo merge local-first:
    //   1. Buscar plants do Supabase (last_synced_at do usuário).
    //   2. Fazer diff com o SQLite local (last_watered_at/updated_at por planta).
    //   3. Resolver conflitos via LWW (last-write-wins).
    //   4. Upload das mudanças locais novas.

    set({ lastSyncedAt: new Date() });
  },
}));
