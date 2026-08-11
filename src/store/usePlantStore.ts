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
import { authService } from "../services/authService";
import { plantService } from "../services/plantService";
import { subscriptionService } from "../services/subscriptionService";
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
  totalFreeScansUsed: number;
  monthlyPremiumScansUsed: number;

  loadPlants: (options?: { showLoading?: boolean }) => Promise<void>;
  addPlant: (payload: InsertPlantInput) => Promise<boolean>;
  deletePlant: (plantId: number) => Promise<void>;
  waterPlant: (plantId: number) => Promise<void>;
  updatePlant: (plantId: number, data: UpdatePlantInput) => Promise<void>;
  checkHealth: (
    plantId: number,
    imageUri: string
  ) => Promise<HealthAssessmentResponse | null>;

  setPremium: (value: boolean) => void;
  setUser: (user: AppUser | null) => void;
  signOut: () => Promise<void>;

  /** Lê o status atual do RevenueCat e hidrata `isPremium`. */
  syncSubscription: () => Promise<void>;

  /**
   * Stub de sincronização com o Supabase. Hoje só loga no console — a
   * implementação real (merge local-first) vai entrar aqui.
   */
  syncDataWithSupabase: () => Promise<void>;
}

export const usePlantStore = create<PlantStoreState>((set, get) => ({
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
    // O listener em useAuth (onAuthStateChange → SIGNED_OUT) também zera o
    // user, mas limpamos aqui imediatamente para a UI reagir sem esperar.
    // Premium também volta a false: sem sessão, não há entitlement ativo.
    set({ user: null, isAuthenticated: false, isPremium: false });
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
