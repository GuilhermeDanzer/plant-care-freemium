import "react-native-url-polyfill/auto";

import AsyncStorage from "@react-native-async-storage/async-storage";
import { createClient } from "@supabase/supabase-js";
import { AppState, type AppStateStatus } from "react-native";

const supabaseUrl = process.env.EXPO_PUBLIC_SUPABASE_URL;
const supabasePublishableKey = process.env.EXPO_PUBLIC_SUPABASE_PUBLISHABLE_KEY;

if (!supabaseUrl || !supabasePublishableKey) {
  console.warn(
    "[supabase] Variáveis EXPO_PUBLIC_SUPABASE_URL / EXPO_PUBLIC_SUPABASE_PUBLISHABLE_KEY ausentes. Chamadas ao Supabase vão falhar até você preenchê-las no .env."
  );
}

export const supabase = createClient(
  supabaseUrl ?? "",
  supabasePublishableKey ?? "",
  {
    auth: {
      storage: AsyncStorage,
      autoRefreshToken: true,
      persistSession: true,
      detectSessionInUrl: false,
    },
    global: {
      fetch: fetch,
    },
  }
);

// Pattern oficial Expo/RN: mantém o refresh de token ativo só quando o app
// está em foreground. Em background o `setTimeout` do JS é suspenso pelo SO,
// então desligamos explicitamente. Registrar apenas uma vez, no módulo.
// Ref: https://supabase.com/docs/guides/getting-started/tutorials/with-expo-react-native
AppState.addEventListener("change", (state: AppStateStatus) => {
  if (state === "active") {
    supabase.auth.startAutoRefresh();
  } else {
    supabase.auth.stopAutoRefresh();
  }
});
