import { usePlantStore } from "@/store/usePlantStore";
import * as db from "@/database/db";
import { supabase } from "@/lib/supabase";
import { authService } from "@/services/authService";
import { plantService } from "@/services/plantService";
import { subscriptionService } from "@/services/subscriptionService";
import { notificationService } from "@/services/notificationService";
import { performFullSync } from "@/services/SyncService";
import type { PlantRecord } from "@/types/plant";

jest.mock("@/database/db", () => ({
  clearAllLocalData: jest.fn(),
  countMyPlants: jest.fn(),
  deletePlantById: jest.fn(),
  getMyPlants: jest.fn(),
  insertPlant: jest.fn(),
  markWateredAt: jest.fn(),
  snoozeWateringAt: jest.fn(),
  saveHealthCheck: jest.fn(),
  updatePlantRecord: jest.fn(),
  insertJournalEntry: jest.fn(),
  getJournalEntriesForPlant: jest.fn(),
  deleteJournalEntry: jest.fn(),
}));

jest.mock("@/lib/supabase", () => ({
  supabase: {
    from: jest.fn(() => ({
      delete: jest.fn(() => ({ eq: jest.fn().mockResolvedValue({}) })),
    })),
  },
}));

jest.mock("@/services/authService", () => ({
  authService: { signOut: jest.fn().mockResolvedValue(undefined) },
}));

jest.mock("@/services/plantService", () => ({
  plantService: { assessPlantHealth: jest.fn() },
}));

jest.mock("@/services/subscriptionService", () => ({
  subscriptionService: { checkSubscription: jest.fn() },
}));

jest.mock("@/services/notificationService", () => ({
  notificationService: { cancelAllScheduledNotifications: jest.fn().mockResolvedValue(undefined) },
}));

jest.mock("@/services/SyncService", () => ({
  performFullSync: jest.fn().mockResolvedValue(new Date(2026, 0, 10).toISOString()),
}));

jest.mock("expo-file-system", () => ({
  deleteAsync: jest.fn().mockResolvedValue(undefined),
}));

const resetState = () =>
  usePlantStore.setState({
    plants: [],
    isLoading: false,
    hasLoaded: false,
    isPremium: false,
    user: null,
    isAuthenticated: false,
    lastSyncedAt: null,
    totalFreeScansUsed: 0,
    monthlyPremiumScansUsed: 0,
    error: null,
  });

const samplePlant = (overrides: Partial<PlantRecord> = {}): PlantRecord => ({
  id: "11111111-1111-4111-8111-111111111111",
  nickname: null,
  original_name: "Monstera",
  scientific_name: "Monstera deliciosa",
  watering_freq_days: 7,
  last_watered_at: "2026-01-01T10:00:00.000Z",
  next_watering_at: "2026-01-08T10:00:00.000Z",
  image_uri: null,
  last_health_check_at: null,
  health_data: null,
  created_at: "2026-01-01T10:00:00.000Z",
  updated_at: "2026-01-01T10:00:00.000Z",
  deleted_at: null,
  ...overrides,
});

describe("usePlantStore", () => {
  beforeEach(() => {
    jest.clearAllMocks();
    resetState();
  });

  it("loadPlants hydrates plants from SQLite", async () => {
    (db.getMyPlants as jest.Mock).mockResolvedValue([samplePlant()]);
    await usePlantStore.getState().loadPlants();
    const s = usePlantStore.getState();
    expect(s.plants).toHaveLength(1);
    expect(s.hasLoaded).toBe(true);
    expect(s.isLoading).toBe(false);
  });

  it("addPlant inserts, reloads and returns true", async () => {
    (db.insertPlant as jest.Mock).mockResolvedValue(undefined);
    (db.getMyPlants as jest.Mock).mockResolvedValue([samplePlant()]);

    const result = await usePlantStore.getState().addPlant({
      nickname: "Rex",
      original_name: "Monstera",
      scientific_name: "Monstera deliciosa",
      watering_freq_days: 7,
    } as any);

    expect(db.insertPlant).toHaveBeenCalled();
    expect(result).toBe(true);
  });

  it("checkHealth returns null for free (non-premium) users", async () => {
    usePlantStore.setState({ isPremium: false });
    const result = await usePlantStore.getState().checkHealth("p1", ["file://x.jpg"]);
    expect(result).toBeNull();
    expect(plantService.assessPlantHealth).not.toHaveBeenCalled();
  });

  it("checkHealth runs the health assessment for premium users", async () => {
    usePlantStore.setState({ isPremium: true });
    const response = {
      result: {
        is_healthy: { binary: true, probability: 0.9 },
        disease: { suggestions: [] },
        is_plant: { binary: true, probability: 1 },
      },
      status: "completed",
    } as any;
    (plantService.assessPlantHealth as jest.Mock).mockResolvedValue(response);
    (db.saveHealthCheck as jest.Mock).mockResolvedValue(undefined);
    (db.getMyPlants as jest.Mock).mockResolvedValue([]);

    const result = await usePlantStore.getState().checkHealth("p1", ["file://x.jpg"]);
    expect(result).toEqual(response);
    expect(db.saveHealthCheck).toHaveBeenCalled();
  });

  it("signOut wipes local data, cancels notifications and clears the user", async () => {
    usePlantStore.setState({
      user: { id: "u1", email: "a@b.c", displayName: "A", isAnonymous: false },
      isAuthenticated: true,
      isPremium: true,
    });

    await usePlantStore.getState().signOut();

    expect(authService.signOut).toHaveBeenCalled();
    expect(db.clearAllLocalData).toHaveBeenCalled();
    expect(notificationService.cancelAllScheduledNotifications).toHaveBeenCalled();
    const s = usePlantStore.getState();
    expect(s.user).toBeNull();
    expect(s.isAuthenticated).toBe(false);
    expect(s.isPremium).toBe(false);
  });

  it("syncSubscription hydrates isPremium from RevenueCat", async () => {
    (subscriptionService.checkSubscription as jest.Mock).mockResolvedValue({ isActive: true });
    await usePlantStore.getState().syncSubscription();
    expect(usePlantStore.getState().isPremium).toBe(true);
  });

  it("syncDataWithSupabase skips anonymous users", async () => {
    usePlantStore.setState({
      user: { id: "u1", email: "", displayName: "", isAnonymous: true },
    });
    await usePlantStore.getState().syncDataWithSupabase();
    expect(performFullSync).not.toHaveBeenCalled();
  });

  it("syncDataWithSupabase performs a full sync for logged-in users", async () => {
    (db.getMyPlants as jest.Mock).mockResolvedValue([]);
    usePlantStore.setState({
      user: { id: "u1", email: "a@b.c", displayName: "A", isAnonymous: false },
      lastSyncedAt: null,
    });
    await usePlantStore.getState().syncDataWithSupabase();
    expect(performFullSync).toHaveBeenCalledWith("u1", null);
    expect(usePlantStore.getState().lastSyncedAt).toBeInstanceOf(Date);
  });

  it("clearGarden only resets in-memory state, not SQLite", async () => {
    usePlantStore.setState({ plants: [samplePlant()], hasLoaded: true });
    usePlantStore.getState().clearGarden();
    expect(usePlantStore.getState().plants).toEqual([]);
    expect(db.clearAllLocalData).not.toHaveBeenCalled();
  });

  it("loadPlants does not throw on a SQLite failure and surfaces an error", async () => {
    (db.getMyPlants as jest.Mock).mockRejectedValue(new Error("disk I/O error"));
    await expect(usePlantStore.getState().loadPlants()).resolves.toBeUndefined();
    const s = usePlantStore.getState();
    expect(s.hasLoaded).toBe(true);
    expect(s.isLoading).toBe(false);
    expect(s.error).toBe("disk I/O error");
  });

  it("addPlant returns false (no throw) when the insert fails", async () => {
    (db.insertPlant as jest.Mock).mockRejectedValue(new Error("db locked"));
    await expect(
      usePlantStore.getState().addPlant({
        nickname: "Rex",
        original_name: "Monstera",
        scientific_name: "Monstera deliciosa",
        watering_freq_days: 7,
      } as any)
    ).resolves.toBe(false);
  });

  it("waterPlant returns false (no throw) when marking watered fails", async () => {
    (db.markWateredAt as jest.Mock).mockRejectedValue(new Error("db failure"));
    await expect(usePlantStore.getState().waterPlant("p1")).resolves.toBe(false);
  });

  it("deletePlant returns false (no throw) when the local delete fails", async () => {
    usePlantStore.setState({ plants: [samplePlant()] });
    (db.deletePlantById as jest.Mock).mockRejectedValue(new Error("db failure"));
    await expect(usePlantStore.getState().deletePlant("p1")).resolves.toBe(false);
  });

  it("checkHealth returns null when the AI assessment fails", async () => {
    usePlantStore.setState({ isPremium: true });
    (plantService.assessPlantHealth as jest.Mock).mockRejectedValue(new Error("network"));
    await expect(
      usePlantStore.getState().checkHealth("p1", ["file://x.jpg"])
    ).resolves.toBeNull();
  });

  it("getJournalForPlant returns [] when the journal query fails", async () => {
    (db.getJournalEntriesForPlant as jest.Mock).mockRejectedValue(new Error("db failure"));
    await expect(
      usePlantStore.getState().getJournalForPlant("p1")
    ).resolves.toEqual([]);
  });
});
