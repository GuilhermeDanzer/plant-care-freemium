import "react-native-gesture-handler";
import { GestureHandlerRootView } from "react-native-gesture-handler";

import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { Stack } from "expo-router";
import { StatusBar } from "expo-status-bar";
import { useEffect } from "react";
import { Platform, AppState, AppStateStatus } from "react-native";
import Purchases, { LOG_LEVEL } from "react-native-purchases";
import { SafeAreaProvider } from "react-native-safe-area-context";
import Toast from "react-native-toast-message";
import { toastConfig } from "@/components/ToastConfig";
import { initDatabase } from "@/database/db";
import { useAuth } from "@/hooks/useAuth";
import { PREMIUM_ENTITLEMENT_ID } from "@/services/subscriptionService";
import { usePlantStore } from "@/store/usePlantStore";
import "../global.css";

const queryClient = new QueryClient();

const configureRevenueCat = (): boolean => {
  const apiKey = Platform.select({
    ios: process.env.EXPO_PUBLIC_REVENUECAT_APPLE_KEY,
    android: process.env.EXPO_PUBLIC_REVENUECAT_GOOGLE_KEY,
  });

  if (!apiKey || typeof apiKey !== 'string') {
    console.warn(
      "[RevenueCat] API key ausente para esta plataforma. Defina EXPO_PUBLIC_REVENUECAT_APPLE_KEY / _GOOGLE_KEY no .env."
    );
    return false;
  }

  try {
    if (__DEV__) Purchases.setLogLevel(LOG_LEVEL.DEBUG);
    Purchases.configure({ apiKey });
    return true;
  } catch (error) {
    console.error("[RevenueCat] Erro nativo ao configurar:", error);
    return false;
  }
};

export default function RootLayout() {
  useAuth();

  useEffect(() => {
    const initializeApp = async () => {
      try {
        await initDatabase();
      } catch (error) {
        console.error("Erro nativo ao inicializar banco de dados:", error);
      }
    };
    initializeApp();

    const configured = configureRevenueCat();
    if (!configured) return;

    const updateListener = (info: any) => {
      try {
        if (info && info.entitlements && info.entitlements.active) {
          const isActive = Boolean(info.entitlements.active[PREMIUM_ENTITLEMENT_ID]);
          usePlantStore.getState().setPremium(isActive);
        }
      } catch (error) {
        console.error("Erro ao processar informacoes de cliente:", error);
      }
    };
    
    try {
      if (typeof updateListener === 'function') {
        Purchases.addCustomerInfoUpdateListener(updateListener);
      }
    } catch (error) {
      console.error("[RevenueCat] Erro nativo ao adicionar listener:", error);
    }

    // Hidratação inicial — não espera o primeiro evento do listener.
    const runInitialSync = async () => {
      try {
        await usePlantStore.getState().syncSubscription();
      } catch (error) {
        console.error("Erro nativo na sincronizacao inicial:", error);
      }
    };
    runInitialSync();

    const handleAppStateChange = (nextAppState: AppStateStatus) => {
      try {
        if (!nextAppState || typeof nextAppState !== 'string') return;
        
        if (nextAppState === "active") {
          const state = usePlantStore.getState();
          if (state && state.user && !state.user.isAnonymous) {
            if (typeof state.syncDataWithSupabase === 'function') {
              state.syncDataWithSupabase();
            }
          }
        }
      } catch (error) {
        console.error("Erro no listener de AppState:", error);
      }
    };
    
    let subscription: any = null;
    try {
      if (typeof handleAppStateChange === 'function') {
        subscription = AppState.addEventListener("change", handleAppStateChange);
      }
    } catch (error) {
      console.error("Erro nativo ao adicionar AppState listener:", error);
    }

    return () => {
      try {
        if (typeof updateListener === 'function') {
          Purchases.removeCustomerInfoUpdateListener(updateListener);
        }
      } catch (error) {
        console.error("[RevenueCat] Erro nativo ao remover listener:", error);
      }
      
      try {
        if (subscription && typeof subscription.remove === 'function') {
          subscription.remove();
        }
      } catch (error) {
        console.error("Erro nativo ao remover AppState listener:", error);
      }
    };
  }, []);

  return (
    <GestureHandlerRootView style={{ flex: 1 }}>
      <SafeAreaProvider>
        <QueryClientProvider client={queryClient}>
            <StatusBar style="dark" />
            <Stack
              initialRouteName="index"
              screenOptions={{ headerShown: false }}
            >
              <Stack.Screen name="index" />
              <Stack.Screen name="(main)" />
              <Stack.Screen name="(identify)" />
              <Stack.Screen name="paywall" options={{ presentation: "modal" }} />
              <Stack.Screen name="auth" options={{ presentation: "modal" }} />
            </Stack>
        </QueryClientProvider>
      </SafeAreaProvider>

      {/*
        Toast renderizado como último filho do fragmento raiz, FORA do Stack e
        FORA dos providers. Isso o coloca em uma camada nativa acima de
        qualquer tela ou modal apresentado pelo expo-router.
      */}
      <Toast config={toastConfig} />
    </GestureHandlerRootView>
  );
}
