import * as SQLite from "expo-sqlite";
import { HealthAssessmentResponse, PlantRecord } from "../types/plant";
import { calculateNextWateringAt } from "../utils/dateUtils";

const DB_NAME = "plant_care.db";
const TABLE_NAME = "my_plants";

let databasePromise: Promise<SQLite.SQLiteDatabase> | null = null;

/**
 * Garante que o banco só é devolvido após abrir E concluir a migração. Isso
 * previne race conditions entre `initDatabase` e a primeira query do app.
 */
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
  column: string
): Promise<boolean> => {
  const rows = await db.getAllAsync<TableInfoRow>(
    `PRAGMA table_info(${TABLE_NAME});`
  );
  return rows.some((row) => row.name === column);
};

const runMigrations = async (db: SQLite.SQLiteDatabase): Promise<void> => {
  await db.execAsync(`
    CREATE TABLE IF NOT EXISTS ${TABLE_NAME} (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      nickname TEXT,
      original_name TEXT NOT NULL,
      scientific_name TEXT NOT NULL,
      watering_freq_days INTEGER NOT NULL,
      last_watered_at TEXT NOT NULL,
      next_watering_at TEXT NOT NULL,
      image_uri TEXT,
      last_health_check_at TEXT,
      health_data TEXT
    );
  `);

  // Migration path for databases created with the legacy schema (column `name`).
  const hasLegacyName = await columnExists(db, "name");
  const hasOriginalName = await columnExists(db, "original_name");

  if (hasLegacyName && !hasOriginalName) {
    await db.execAsync(`ALTER TABLE ${TABLE_NAME} RENAME COLUMN name TO original_name;`);
  }

  if (!(await columnExists(db, "nickname"))) {
    await db.execAsync(`ALTER TABLE ${TABLE_NAME} ADD COLUMN nickname TEXT;`);
  }

  if (!(await columnExists(db, "image_uri"))) {
    await db.execAsync(`ALTER TABLE ${TABLE_NAME} ADD COLUMN image_uri TEXT;`);
  }

  if (!(await columnExists(db, "last_health_check_at"))) {
    await db.execAsync(
      `ALTER TABLE ${TABLE_NAME} ADD COLUMN last_health_check_at TEXT;`
    );
  }

  if (!(await columnExists(db, "health_data"))) {
    await db.execAsync(`ALTER TABLE ${TABLE_NAME} ADD COLUMN health_data TEXT;`);
  }
};

export const initDatabase = async (): Promise<void> => {
  await getDatabase();
};

interface RawPlantRow {
  id: number;
  nickname: string | null;
  original_name: string;
  scientific_name: string;
  watering_freq_days: number;
  last_watered_at: string;
  next_watering_at: string;
  image_uri: string | null;
  last_health_check_at: string | null;
  health_data: string | null;
}

const SELECT_COLUMNS = `
  id,
  nickname,
  original_name,
  scientific_name,
  watering_freq_days,
  last_watered_at,
  next_watering_at,
  image_uri,
  last_health_check_at,
  health_data
`;

const isValidHealthAssessment = (
  value: unknown
): value is HealthAssessmentResponse => {
  if (!value || typeof value !== "object") return false;
  const candidate = value as Partial<HealthAssessmentResponse>;
  if (!candidate.result || typeof candidate.result !== "object") return false;
  const result = candidate.result;
  return (
    !!result.is_healthy &&
    typeof result.is_healthy === "object" &&
    !!result.disease &&
    typeof result.disease === "object"
  );
};

const hydratePlant = (row: RawPlantRow): PlantRecord => {
  let healthData: HealthAssessmentResponse | null = null;
  if (row.health_data) {
    try {
      const parsed = JSON.parse(row.health_data) as unknown;
      // Registros legados (PlantHealthData v1) não têm `.result`. Descartamos
      // silenciosamente para não crashar a tela de detalhes.
      healthData = isValidHealthAssessment(parsed) ? parsed : null;
    } catch (error) {
      console.warn("[db] Falha ao deserializar health_data.", error);
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
  };
};

export interface InsertPlantInput {
  originalName: string;
  scientificName: string;
  wateringFrequencyDays: number;
  lastWateredAt: string;
  nextWateringAt: string;
  imageUri?: string | null;
}

export const insertPlant = async (payload: InsertPlantInput): Promise<void> => {
  const db = await getDatabase();
  await db.runAsync(
    `INSERT INTO ${TABLE_NAME}
      (nickname, original_name, scientific_name, watering_freq_days, last_watered_at, next_watering_at, image_uri)
      VALUES (?, ?, ?, ?, ?, ?, ?)`,
    [
      null,
      payload.originalName,
      payload.scientificName,
      payload.wateringFrequencyDays,
      payload.lastWateredAt,
      payload.nextWateringAt,
      payload.imageUri ?? null,
    ]
  );
};

export const getMyPlants = async (): Promise<PlantRecord[]> => {
  const db = await getDatabase();
  const rows = await db.getAllAsync<RawPlantRow>(
    `SELECT ${SELECT_COLUMNS}
     FROM ${TABLE_NAME}
     ORDER BY next_watering_at ASC`
  );
  return rows.map(hydratePlant);
};

export const countMyPlants = async (): Promise<number> => {
  const db = await getDatabase();
  const row = await db.getFirstAsync<{ count: number }>(
    `SELECT COUNT(*) as count FROM ${TABLE_NAME}`
  );
  return row?.count ?? 0;
};

export const getPlantById = async (id: number): Promise<PlantRecord | null> => {
  const db = await getDatabase();
  const row = await db.getFirstAsync<RawPlantRow>(
    `SELECT ${SELECT_COLUMNS}
     FROM ${TABLE_NAME} WHERE id = ?`,
    [id]
  );
  return row ? hydratePlant(row) : null;
};

export const deletePlantById = async (plantId: number): Promise<void> => {
  const db = await getDatabase();
  await db.runAsync(`DELETE FROM ${TABLE_NAME} WHERE id = ?`, [plantId]);
};

export const markWateredAt = async (
  plantId: number,
  wateredAt: Date = new Date()
): Promise<void> => {
  const plant = await getPlantById(plantId);
  if (!plant) return;

  const lastWateredAt = wateredAt.toISOString();
  const nextWateringAt = calculateNextWateringAt(
    lastWateredAt,
    plant.watering_freq_days
  );

  const db = await getDatabase();
  await db.runAsync(
    `UPDATE ${TABLE_NAME}
     SET last_watered_at = ?, next_watering_at = ?
     WHERE id = ?`,
    [lastWateredAt, nextWateringAt, plantId]
  );
};

export interface UpdatePlantInput {
  nickname?: string | null;
  imageUri?: string | null;
}

export const updatePlantRecord = async (
  plantId: number,
  payload: UpdatePlantInput
): Promise<void> => {
  const fields: string[] = [];
  const values: (string | number | null)[] = [];

  if (payload.nickname !== undefined) {
    fields.push("nickname = ?");
    values.push(
      payload.nickname && payload.nickname.trim().length > 0
        ? payload.nickname.trim()
        : null
    );
  }

  if (payload.imageUri !== undefined) {
    fields.push("image_uri = ?");
    values.push(payload.imageUri);
  }

  if (fields.length === 0) return;

  values.push(plantId);
  const db = await getDatabase();
  await db.runAsync(
    `UPDATE ${TABLE_NAME} SET ${fields.join(", ")} WHERE id = ?`,
    values
  );
};

export const saveHealthCheck = async (
  plantId: number,
  data: HealthAssessmentResponse,
  checkedAt: Date = new Date()
): Promise<void> => {
  const db = await getDatabase();
  await db.runAsync(
    `UPDATE ${TABLE_NAME}
     SET last_health_check_at = ?, health_data = ?
     WHERE id = ?`,
    [checkedAt.toISOString(), JSON.stringify(data), plantId]
  );
};
