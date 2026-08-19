import * as SQLite from "expo-sqlite";
import * as Crypto from "expo-crypto";
import { HealthAssessmentResponse, PlantRecord, JournalEntry } from "@/types/plant";
import { calculateNextWateringAt } from "@/utils/dateUtils";

const DB_NAME = "plant_care.db";
const TABLE_NAME = "my_plants";
const JOURNAL_TABLE = "journal_entries";

let databasePromise: Promise<SQLite.SQLiteDatabase> | null = null;

const getDatabase = async (): Promise<SQLite.SQLiteDatabase> => {
  if (!databasePromise) {
    databasePromise = (async () => {
      const db = await SQLite.openDatabaseAsync(DB_NAME);
      await runMigrations(db);
      return db;
    })();
  }
  return databasePromise;
};

interface TableInfoRow {
  name: string;
}

const columnExists = async (
  db: SQLite.SQLiteDatabase,
  tableName: string,
  column: string
): Promise<boolean> => {
  try {
    const rows = await db.getAllAsync<TableInfoRow>(
      `PRAGMA table_info(${tableName});`
    );
    return rows.some((row) => row.name === column);
  } catch {
    return false;
  }
};

const runMigrations = async (db: SQLite.SQLiteDatabase): Promise<void> => {
  // We need to check if the old `my_plants` table exists and has INTEGER id.
  // SQLite doesn't easily alter primary keys, so if it's the old version without updated_at,
  // we might want to do a full table migration or just handle it. 
  // To keep it simple, we create the table if not exists with TEXT id. If the user
  // is doing a fresh install, they get TEXT. 
  // For safety against old users, we will attempt to create a new table and copy data if needed.
  
  await db.execAsync(`
    CREATE TABLE IF NOT EXISTS ${TABLE_NAME}_v2 (
      id TEXT PRIMARY KEY,
      nickname TEXT,
      original_name TEXT NOT NULL,
      scientific_name TEXT NOT NULL,
      watering_freq_days INTEGER NOT NULL,
      last_watered_at TEXT NOT NULL,
      next_watering_at TEXT NOT NULL,
      image_uri TEXT,
      last_health_check_at TEXT,
      health_data TEXT,
      updated_at TEXT NOT NULL,
      deleted_at TEXT
    );
  `);

  // Migrate old data if old table exists
  const oldTableExists = await db.getFirstAsync<{name: string}>(`SELECT name FROM sqlite_master WHERE type='table' AND name='${TABLE_NAME}';`);
  if (oldTableExists) {
    // Copy data over if not copied
    const hasData = await db.getFirstAsync<{count: number}>(`SELECT COUNT(*) as count FROM ${TABLE_NAME}_v2`);
    if (hasData && hasData.count === 0) {
      await db.execAsync(`
        INSERT INTO ${TABLE_NAME}_v2 (id, nickname, original_name, scientific_name, watering_freq_days, last_watered_at, next_watering_at, image_uri, last_health_check_at, health_data, updated_at)
        SELECT CAST(id AS TEXT), nickname, original_name, scientific_name, watering_freq_days, last_watered_at, next_watering_at, image_uri, last_health_check_at, health_data, CURRENT_TIMESTAMP
        FROM ${TABLE_NAME};
      `);
    }
    // Drop the old table
    await db.execAsync(`DROP TABLE ${TABLE_NAME};`);
  }
  
  // Rename v2 to final name if we just dropped it
  const currentTable = await db.getFirstAsync<{name: string}>(`SELECT name FROM sqlite_master WHERE type='table' AND name='${TABLE_NAME}';`);
  if (!currentTable) {
    await db.execAsync(`ALTER TABLE ${TABLE_NAME}_v2 RENAME TO ${TABLE_NAME};`);
  }

  await db.execAsync(`
    CREATE TABLE IF NOT EXISTS ${JOURNAL_TABLE} (
      id TEXT PRIMARY KEY,
      plant_id TEXT NOT NULL,
      image_uri TEXT,
      note TEXT,
      created_at TEXT NOT NULL,
      updated_at TEXT NOT NULL,
      deleted_at TEXT
    );
  `);
};

export const initDatabase = async (): Promise<void> => {
  await getDatabase();
};

interface RawPlantRow {
  id: string;
  nickname: string | null;
  original_name: string;
  scientific_name: string;
  watering_freq_days: number;
  last_watered_at: string;
  next_watering_at: string;
  image_uri: string | null;
  last_health_check_at: string | null;
  health_data: string | null;
  created_at: string;
  updated_at: string;
  deleted_at: string | null;
}

const hydratePlant = (row: RawPlantRow): PlantRecord => {
  let healthData: HealthAssessmentResponse | null = null;
  if (row.health_data) {
    try {
      healthData = JSON.parse(row.health_data) as HealthAssessmentResponse;
    } catch {
      healthData = null;
    }
  }

  return {
    id: row.id,
    nickname: row.nickname,
    original_name: row.original_name,
    scientific_name: row.scientific_name,
    watering_freq_days: row.watering_freq_days,
    last_watered_at: row.last_watered_at,
    next_watering_at: row.next_watering_at,
    image_uri: row.image_uri,
    last_health_check_at: row.last_health_check_at,
    health_data: healthData,
    created_at: row.created_at,
    updated_at: row.updated_at,
    deleted_at: row.deleted_at,
  };
};

export interface InsertPlantInput {
  id?: string;
  originalName: string;
  scientificName: string;
  wateringFrequencyDays: number;
  lastWateredAt: string;
  nextWateringAt: string;
  imageUri?: string | null;
}

export const insertPlant = async (payload: InsertPlantInput): Promise<string> => {
  const db = await getDatabase();
  const plantId = payload.id ?? Crypto.randomUUID();
  const now = new Date().toISOString();

  await db.runAsync(
    `INSERT INTO ${TABLE_NAME}
      (id, nickname, original_name, scientific_name, watering_freq_days, last_watered_at, next_watering_at, image_uri, updated_at)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`,
    [
      plantId,
      null,
      payload.originalName,
      payload.scientificName,
      payload.wateringFrequencyDays,
      payload.lastWateredAt,
      payload.nextWateringAt,
      payload.imageUri ?? null,
      now,
    ]
  );
  return plantId;
};

// Only get non-deleted plants
export const getMyPlants = async (): Promise<PlantRecord[]> => {
  const db = await getDatabase();
  const rows = await db.getAllAsync<RawPlantRow>(
    `SELECT *
     FROM ${TABLE_NAME}
     WHERE deleted_at IS NULL
     ORDER BY next_watering_at ASC`
  );
  return rows.map(hydratePlant);
};

export const countMyPlants = async (): Promise<number> => {
  const db = await getDatabase();
  const row = await db.getFirstAsync<{ count: number }>(
    `SELECT COUNT(*) as count FROM ${TABLE_NAME} WHERE deleted_at IS NULL`
  );
  return row?.count ?? 0;
};

export const getPlantById = async (id: string): Promise<PlantRecord | null> => {
  const db = await getDatabase();
  const row = await db.getFirstAsync<RawPlantRow>(
    `SELECT * FROM ${TABLE_NAME} WHERE id = ? AND deleted_at IS NULL`,
    [id]
  );
  return row ? hydratePlant(row) : null;
};

export const deletePlantById = async (plantId: string): Promise<void> => {
  const db = await getDatabase();
  const now = new Date().toISOString();
  await db.runAsync(`UPDATE ${TABLE_NAME} SET deleted_at = ?, updated_at = ? WHERE id = ?`, [now, now, plantId]);
};

export const markWateredAt = async (
  plantId: string,
  wateredAt: Date = new Date()
): Promise<void> => {
  const plant = await getPlantById(plantId);
  if (!plant) return;

  const lastWateredAt = wateredAt.toISOString();
  const nextWateringAt = calculateNextWateringAt(lastWateredAt, plant.watering_freq_days);
  const now = new Date().toISOString();

  const db = await getDatabase();
  await db.runAsync(
    `UPDATE ${TABLE_NAME}
     SET last_watered_at = ?, next_watering_at = ?, updated_at = ?
     WHERE id = ?`,
    [lastWateredAt, nextWateringAt, now, plantId]
  );
};

export const snoozeWateringAt = async (
  plantId: string,
  days: number = 2
): Promise<void> => {
  const plant = await getPlantById(plantId);
  if (!plant) return;

  const today = new Date();
  today.setDate(today.getDate() + days);
  const nextWateringAt = today.toISOString();
  const now = new Date().toISOString();

  const db = await getDatabase();
  await db.runAsync(
    `UPDATE ${TABLE_NAME}
     SET next_watering_at = ?, updated_at = ?
     WHERE id = ?`,
    [nextWateringAt, now, plantId]
  );
};

export interface UpdatePlantInput {
  nickname?: string | null;
  imageUri?: string | null;
  nextWateringAt?: string;
  updatedAt?: string;
}

export const updatePlantRecord = async (
  plantId: string,
  payload: UpdatePlantInput
): Promise<void> => {
  const fields: string[] = [];
  const values: (string | number | null)[] = [];

  if (payload.nickname !== undefined) {
    fields.push("nickname = ?");
    values.push(payload.nickname?.trim() || null);
  }
  if (payload.imageUri !== undefined) {
    fields.push("image_uri = ?");
    values.push(payload.imageUri ?? null);
  }
  if (payload.nextWateringAt !== undefined) {
    fields.push("next_watering_at = ?");
    values.push(payload.nextWateringAt);
  }

  if (fields.length === 0) return;

  fields.push("updated_at = ?");
  values.push(payload.updatedAt ?? new Date().toISOString());

  values.push(plantId);
  const db = await getDatabase();
  await db.runAsync(
    `UPDATE ${TABLE_NAME} SET ${fields.join(", ")} WHERE id = ?`,
    values
  );
};

export const saveHealthCheck = async (
  plantId: string,
  data: HealthAssessmentResponse,
  checkedAt: Date = new Date()
): Promise<void> => {
  const db = await getDatabase();
  const now = new Date().toISOString();
  await db.runAsync(
    `UPDATE ${TABLE_NAME}
     SET last_health_check_at = ?, health_data = ?, updated_at = ?
     WHERE id = ?`,
    [checkedAt.toISOString(), JSON.stringify(data), now, plantId]
  );
};

/* =========================================================================
 * Journal Methods
 * ========================================================================= */

export const insertJournalEntry = async (
  plantId: string,
  imageUri: string,
  note: string | null = null,
  id: string = Crypto.randomUUID()
): Promise<string> => {
  const db = await getDatabase();
  const now = new Date().toISOString();

  await db.runAsync(
    `INSERT INTO ${JOURNAL_TABLE} (id, plant_id, image_uri, note, created_at, updated_at) VALUES (?, ?, ?, ?, ?, ?)`,
    [id, plantId, imageUri, note, now, now]
  );
  return id;
};

export const getJournalEntriesForPlant = async (plantId: string): Promise<JournalEntry[]> => {
  const db = await getDatabase();
  const rows = await db.getAllAsync<JournalEntry>(
    `SELECT * FROM ${JOURNAL_TABLE} WHERE plant_id = ? AND deleted_at IS NULL ORDER BY created_at DESC`,
    [plantId]
  );
  return rows;
};

export const deleteJournalEntry = async (id: string): Promise<void> => {
  const db = await getDatabase();
  const now = new Date().toISOString();
  await db.runAsync(`UPDATE ${JOURNAL_TABLE} SET deleted_at = ?, updated_at = ? WHERE id = ?`, [now, now, id]);
};

/* =========================================================================
 * Sync Queries
 * ========================================================================= */

export const getPlantsForSync = async (since: string): Promise<PlantRecord[]> => {
  const db = await getDatabase();
  const rows = await db.getAllAsync<RawPlantRow>(
    `SELECT * FROM ${TABLE_NAME} WHERE updated_at > ?`,
    [since]
  );
  return rows.map(hydratePlant);
};

export const getJournalEntriesForSync = async (since: string): Promise<JournalEntry[]> => {
  const db = await getDatabase();
  return db.getAllAsync<JournalEntry>(
    `SELECT * FROM ${JOURNAL_TABLE} WHERE updated_at > ?`,
    [since]
  );
};

// Raw upsert for sync (preserves ID, created_at, deleted_at, etc.)
export const upsertPlantRecordRaw = async (plant: PlantRecord): Promise<void> => {
  const db = await getDatabase();
  await db.runAsync(
    `INSERT OR REPLACE INTO ${TABLE_NAME}
      (id, nickname, original_name, scientific_name, watering_freq_days, last_watered_at, next_watering_at, image_uri, last_health_check_at, health_data, updated_at, deleted_at)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
    [
      plant.id,
      plant.nickname,
      plant.original_name,
      plant.scientific_name,
      plant.watering_freq_days,
      plant.last_watered_at,
      plant.next_watering_at,
      plant.image_uri,
      plant.last_health_check_at,
      plant.health_data ? JSON.stringify(plant.health_data) : null,
      plant.updated_at,
      plant.deleted_at
    ]
  );
};

export const upsertJournalEntryRaw = async (entry: JournalEntry): Promise<void> => {
  const db = await getDatabase();
  await db.runAsync(
    `INSERT OR REPLACE INTO ${JOURNAL_TABLE}
      (id, plant_id, image_uri, note, created_at, updated_at, deleted_at)
     VALUES (?, ?, ?, ?, ?, ?, ?)`,
    [entry.id, entry.plant_id, entry.image_uri, entry.note, entry.created_at, entry.updated_at, entry.deleted_at]
  );
};
