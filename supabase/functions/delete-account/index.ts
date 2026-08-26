// Setup type definitions for built-in Supabase Runtime APIs
import "@supabase/functions-js/edge-runtime.d.ts"
import { withSupabase } from "@supabase/server"

/**
 * Deletes the authenticated caller's account and all associated data.
 *
 * - `withSupabase({ auth: "user" })` verifies the caller's JWT before this
 *   handler runs (and the platform `verify_jwt` default is also enabled), so
 *   an unauthenticated request never reaches the deletion logic.
 * - The user's rows in `profiles`, `plants` and `journal_entries` are removed
 *   automatically by the `ON DELETE CASCADE` foreign keys on `auth.users(id)`.
 * - Their media objects under `user_media/{userId}/...` are removed explicitly
 *   (storage does not cascade).
 */
export default {
  fetch: withSupabase({ auth: "user" }, async (_req, ctx) => {
    const userId = ctx.userClaims?.id
    if (!userId) {
      return Response.json({ error: "unauthorized" }, { status: 401 })
    }

    const bucket = ctx.supabaseAdmin.storage.from("user_media")

    /**
     * Recursively collects the object keys under `user_media/{userId}/...` so
     * they can be removed in a single `remove(paths)` call.
     */
    const collectPaths = async (prefix: string): Promise<string[]> => {
      const paths: string[] = []
      const folder = prefix ? `${userId}/${prefix}` : userId

      const { data, error } = await bucket.list(folder, { limit: 1000 })
      if (error || !data) return paths

      for (const item of data) {
        if (!item?.name) continue
        const key = prefix ? `${prefix}/${item.name}` : item.name
        // Folder entries are marker objects whose id ends with "/".
        if (item.id?.endsWith("/")) {
          paths.push(...(await collectPaths(key)))
        } else {
          paths.push(`${userId}/${key}`)
        }
      }

      return paths
    }

    // 1) Remove the user's media from storage (best effort, non-fatal).
    try {
      const paths = await collectPaths("")
      if (paths.length > 0) {
        const { error: storageError } = await bucket.remove(paths)
        if (storageError) {
          console.warn("[delete-account] storage.remove failed", storageError)
        }
      }
    } catch (err) {
      // Do not fail the account deletion if storage cleanup hiccups.
      console.warn("[delete-account] storage cleanup failed", err)
    }

    // 2) Hard-delete the auth user. FK cascades clean the DB rows.
    const { error: deleteError } = await ctx.supabaseAdmin.auth.admin.deleteUser(
      userId,
      false
    )
    if (deleteError) {
      console.error("[delete-account] deleteUser failed", deleteError)
      return Response.json({ error: deleteError.message }, { status: 400 })
    }

    return Response.json({ ok: true })
  }),
}

