import { supabase } from "@/lib/supabase";
import { uploadImageToSupabase } from "@/services/StorageService";
import { useTaskStore } from "@/store/useTaskStore";
import { 
  getPlantsForSync, 
  getJournalEntriesForSync, 
  upsertPlantRecordRaw, 
  upsertJournalEntryRaw 
} from "@/database/db";
import { PlantRecord, JournalEntry } from "@/types/plant";

/**
 * Best-effort image upload. Never throws — if the bucket is missing or upload
 * fails for any reason, returns null so the plant still syncs without an image.
 */
const tryUploadImage = async (
  localUri: string,
  folder: string
): Promise<string | null> => {
  if (!localUri.startsWith("file://")) return localUri; // already a remote URL
  try {
    return await uploadImageToSupabase(localUri, folder);
  } catch {
    return null;
  }
};

export const pushLocalChanges = async (userId: string, lastSyncedAt: string) => {
  try {
    const plantsToSync = await getPlantsForSync(lastSyncedAt);
    if (plantsToSync.length > 0) {
      // Best-effort: try to upload images but never block plant data sync on failure.
      for (const p of plantsToSync) {
        if (p.image_uri && p.image_uri.startsWith("file://")) {
          const publicUrl = await tryUploadImage(p.image_uri, "plants");
          if (publicUrl && publicUrl !== p.image_uri) {
            p.image_uri = publicUrl;
            await upsertPlantRecordRaw(p);
          }
        }
      }

      // UUID v4 pattern — filter out legacy integer-ID records that can never
      // sync to Supabase's uuid primary key column.
      const UUID_REGEX = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
      const syncable = plantsToSync.filter(p => {
        if (!UUID_REGEX.test(p.id)) {
          console.warn(
            `[SyncService] Skipping plant "${p.original_name}" (id="${p.id}") — ` +
            `not a valid UUID. Legacy record from before UUID IDs were used. ` +
            `Delete and re-add the plant to sync it to the cloud.`
          );
          return false;
        }
        return true;
      });

      if (syncable.length === 0) {
        console.log("[SyncService] No valid UUID plants to sync.");
      } else {
        const now = new Date().toISOString();
        const payload = syncable.map(p => ({
          id: p.id,
          user_id: userId,
          nickname: p.nickname ?? null,
          original_name: p.original_name,
          scientific_name: p.scientific_name,
          watering_freq_days: p.watering_freq_days,
          last_watered_at: p.last_watered_at,
          next_watering_at: p.next_watering_at,
          image_uri: (p.image_uri && !p.image_uri.startsWith("file://")) ? p.image_uri : null,
          last_health_check_at: p.last_health_check_at ?? null,
          health_data: (() => {
            if (!p.health_data) return null;
            try { return typeof p.health_data === "string" ? JSON.parse(p.health_data) : p.health_data; }
            catch { return null; }
          })(),
          created_at: p.created_at ?? p.updated_at ?? now,
          updated_at: p.updated_at ?? now,
          deleted_at: p.deleted_at ?? null,
        }));

        const { error } = await supabase.from("plants").upsert(payload, { onConflict: "id" });
        if (error) console.error("[SyncService] Error pushing plants:", error);
        else console.log(`[SyncService] ✅ Pushed ${payload.length} plant(s) to Supabase.`);
      }
    }

    const journalToSync = await getJournalEntriesForSync(lastSyncedAt);
    if (journalToSync.length > 0) {
      for (const j of journalToSync) {
        if (j.image_uri && j.image_uri.startsWith("file://")) {
          const publicUrl = await tryUploadImage(j.image_uri, "journal");
          if (publicUrl && publicUrl !== j.image_uri) {
            j.image_uri = publicUrl;
            await upsertJournalEntryRaw(j);
          }
        }
      }

      const journalPayload = journalToSync.map(j => ({
        id: j.id,
        user_id: userId,
        plant_id: j.plant_id,
        image_url: (j.image_uri && !j.image_uri.startsWith("file://")) ? j.image_uri : null,
        note: j.note ?? null,
        created_at: j.created_at,
        updated_at: j.updated_at,
        deleted_at: j.deleted_at ?? null,
      }));

      const { error } = await supabase.from("journal_entries").upsert(journalPayload, { onConflict: "id" });
      if (error) console.error("[SyncService] Error pushing journal:", error);
    }
  } catch (error) {
    console.error("[SyncService] Push failed", error);
  }
};

export const pullRemoteChanges = async (userId: string, lastSyncedAt: string) => {
  try {
    // 1. Pull Plants
    const { data: remotePlants, error: plantsErr } = await supabase
      .from("plants")
      .select("*")
      .eq("user_id", userId)
      .gt("updated_at", lastSyncedAt);

    if (plantsErr) {
      console.error("[SyncService] Error pulling plants:", plantsErr);
    } else if (remotePlants && remotePlants.length > 0) {
      for (const rp of remotePlants) {
        // Remote column names match local SQLite for plants — upsert directly.
        await upsertPlantRecordRaw(rp as PlantRecord);
      }
    }

    // 2. Pull Journal Entries — skip gracefully if table doesn't exist yet
    const { data: remoteJournal, error: journalErr } = await supabase
      .from("journal_entries")
      .select("*")
      .eq("user_id", userId)
      .gt("updated_at", lastSyncedAt);

    if (journalErr) {
      if (journalErr.code !== "PGRST205") { // PGRST205 = table not found
        console.error("[SyncService] Error pulling journal:", journalErr);
      }
    } else if (remoteJournal && remoteJournal.length > 0) {
      for (const rj of remoteJournal) {
        const localEntry: JournalEntry = {
          ...(rj as JournalEntry),
          image_uri: (rj as any).image_url ?? null,
        };
        await upsertJournalEntryRaw(localEntry);
      }
    }
  } catch (error) {
    console.error("[SyncService] Pull failed", error);
  }
};

export const pullProfile = async (userId: string) => {
  try {
    const { data, error } = await supabase
      .from("profiles")
      .select("*")
      .eq("id", userId)
      .single();

    if (error) {
      // PGRST116 = no rows (first use), PGRST205 = table missing (migration not run)
      if (error.code !== "PGRST116" && error.code !== "PGRST205") {
        console.error("[SyncService] Error pulling profile:", error);
      }
      return;
    }

    if (data) {
      useTaskStore.getState().setProfileData(data.care_streak, data.last_action_date);
    }
  } catch (err) {
    console.error("[SyncService] Pull profile failed", err);
  }
};

export const pushProfile = async (userId: string, careStreak: number, lastActionDate: string | null) => {
  try {
    const { error } = await supabase.from("profiles").upsert({
      id: userId,
      care_streak: careStreak,
      last_action_date: lastActionDate,
      updated_at: new Date().toISOString(),
    });
    // PGRST205 = table doesn't exist yet — not a fatal error, skip silently
    if (error && error.code !== "PGRST205") {
      console.error("[SyncService] Error pushing profile:", error);
    }
  } catch (err) {
    console.error("[SyncService] Push profile failed", err);
  }
};

export const performFullSync = async (userId: string, lastSyncedAt: string | null): Promise<string> => {
  const syncStartTime = new Date().toISOString();
  
  const safeLastSyncedAt = lastSyncedAt || new Date(0).toISOString();
  
  await pushLocalChanges(userId, safeLastSyncedAt);
  await pullRemoteChanges(userId, safeLastSyncedAt);
  
  const state = useTaskStore.getState();
  await pushProfile(userId, state.careStreak, state.lastActionDate);
  await pullProfile(userId);

  return syncStartTime;
};
