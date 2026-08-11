const supabaseUrl = process.env.EXPO_PUBLIC_SUPABASE_URL?.trim() ?? "";
const supabasePublishableKey =
  process.env.EXPO_PUBLIC_SUPABASE_PUBLISHABLE_KEY?.trim() ?? "";

/** `true` quando URL e chave publishable estão definidas no bundle (dev ou EAS). */
export const isSupabaseConfigured =
  supabaseUrl.length > 0 && supabasePublishableKey.length > 0;

export const supabaseConfig = {
  url: supabaseUrl,
  publishableKey: supabasePublishableKey,
} as const;

if (!isSupabaseConfigured) {
  console.warn(
    "[supabase] EXPO_PUBLIC_SUPABASE_URL / EXPO_PUBLIC_SUPABASE_PUBLISHABLE_KEY ausentes no bundle. " +
      "Em builds EAS/TestFlight, configure essas variáveis em Project → Environment variables (ou `eas env:create`)."
  );
}
