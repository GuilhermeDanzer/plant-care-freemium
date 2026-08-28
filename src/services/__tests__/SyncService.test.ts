import { supabase } from "@/lib/supabase";
import { useTaskStore } from "@/store/useTaskStore";
import {
  pushLocalChanges,
  pullRemoteChanges,
  pullProfile,
  pushProfile,
} from "@/services/SyncService";
import * as db from "@/database/db";
import { uploadImageToSupabase } from "@/services/StorageService";

jest.mock("@/lib/supabase", () => ({
  supabase: { from: jest.fn() },
}));

jest.mock("@/services/StorageService", () => ({
  uploadImageToSupabase: jest.fn(),
}));

jest.mock("@/store/useTaskStore", () => {
  const setProfileData = jest.fn();
  const getState = jest.fn(() => ({
    careStreak: 1,
    lastActionDate: null,
    setProfileData,
  }));
  return { useTaskStore: { getState, setProfileData } };
});

jest.mock("@/database/db", () => ({
  getPlantsForSync: jest.fn(),
  getJournalEntriesForSync: jest.fn(),
  upsertPlantRecordRaw: jest.fn(),
  upsertJournalEntryRaw: jest.fn(),
}));

const UUID = "11111111-1111-4111-8111-111111111111";

/** A chainable PostgREST query-builder mock (awaitable at the end). */
const builder = (result: { data?: unknown; error?: unknown }) => {
  const b: any = {};
  b.upsert = jest.fn(async () => result);
  b.select = jest.fn(() => b);
  b.eq = jest.fn(() => b);
  b.gt = jest.fn(() => b);
  b.single = jest.fn(async () => result);
  b.then = (resolve: any, reject: any) => Promise.resolve(result).then(resolve, reject);
  return b;
};

const tables: Record<string, ReturnType<typeof builder>> = {};

const mockTable = (table: string, result: { data?: unknown; error?: unknown }) => {
  const b = builder(result);
  tables[table] = b;
  (supabase.from as jest.Mock).mockImplementation(
    (t: string) => tables[t] ?? builder({ data: null, error: null })
  );
  return b;
};

const plant = (overrides: Partial<any> = {}) => ({
  id: UUID,
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

describe("pushLocalChanges", () => {
  beforeEach(() => {
    jest.clearAllMocks();
    (db.getJournalEntriesForSync as jest.Mock).mockResolvedValue([]);
  });

  it("upserts valid UUID plants and does not throw", async () => {
    (db.getPlantsForSync as jest.Mock).mockResolvedValue([plant()]);
    const plantsBuilder = mockTable("plants", { error: null });

    await expect(pushLocalChanges("u1", "2026-01-01T00:00:00.000Z")).resolves.toBeUndefined();
    expect(plantsBuilder.upsert).toHaveBeenCalled();
    expect(plantsBuilder.upsert.mock.calls[0][0][0]).toMatchObject({
      user_id: "u1",
      image_uri: null,
    });
  });

  it("skips legacy non-UUID ids instead of throwing", async () => {
    (db.getPlantsForSync as jest.Mock).mockResolvedValue([plant({ id: "legacy-123" })]);
    const plantsBuilder = mockTable("plants", { error: null });

    await expect(pushLocalChanges("u1", "2026-01-01T00:00:00.000Z")).resolves.toBeUndefined();
    expect(plantsBuilder.upsert).not.toHaveBeenCalled();
  });

  it("survives a Supabase push error without throwing", async () => {
    (db.getPlantsForSync as jest.Mock).mockResolvedValue([plant()]);
    mockTable("plants", { error: { message: "network down" } });
    await expect(pushLocalChanges("u1", "2026-01-01T00:00:00.000Z")).resolves.toBeUndefined();
  });
});

describe("pullRemoteChanges", () => {
  beforeEach(() => jest.clearAllMocks());

  it("upserts remote plants into SQLite on success", async () => {
    const remote = plant({ nickname: "Cloud" });
    mockTable("plants", { data: [remote], error: null });
    mockTable("journal_entries", { data: [], error: null });

    await pullRemoteChanges("u1", "2026-01-01T00:00:00.000Z");
    expect(db.upsertPlantRecordRaw).toHaveBeenCalledWith(remote);
  });

  it("does not throw when the remote query fails", async () => {
    mockTable("plants", { data: null, error: { message: "boom", code: "42" } });
    mockTable("journal_entries", { data: null, error: { message: "boom", code: "42" } });

    await expect(pullRemoteChanges("u1", "2026-01-01T00:00:00.000Z")).resolves.toBeUndefined();
    expect(db.upsertPlantRecordRaw).not.toHaveBeenCalled();
  });
});

describe("pullProfile", () => {
  beforeEach(() => jest.clearAllMocks());

  it("hydrates the task store from the profile on success", async () => {
    mockTable("profiles", {
      data: { care_streak: 5, last_action_date: "2026-01-05T00:00:00Z" },
      error: null,
    });
    await pullProfile("u1");
    expect((useTaskStore.getState() as any).setProfileData).toHaveBeenCalledWith(
      5,
      "2026-01-05T00:00:00Z"
    );
  });

  it("ignores 'no rows' (PGRST116) without throwing", async () => {
    mockTable("profiles", { data: null, error: { code: "PGRST116" } });
    await expect(pullProfile("u1")).resolves.toBeUndefined();
    expect((useTaskStore.getState() as any).setProfileData).not.toHaveBeenCalled();
  });
});

describe("pushProfile", () => {
  beforeEach(() => jest.clearAllMocks());

  it("ignores a missing-table error (PGRST205) without throwing", async () => {
    mockTable("profiles", { error: { code: "PGRST205" } });
    await expect(pushProfile("u1", 2, null)).resolves.toBeUndefined();
  });
});
