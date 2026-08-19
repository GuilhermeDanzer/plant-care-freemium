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

  if (!apiKey) {
    console.warn(
      "[RevenueCat] API key ausente para esta plataforma. Defina EXPO_PUBLIC_REVENUECAT_APPLE_KEY / _GOOGLE_KEY no .env."
    );
    return false;
  }

  if (__DEV__) Purchases.setLogLevel(LOG_LEVEL.DEBUG);
  Purchases.configure({ apiKey });
  return true;
};

export default function RootLayout() {
  useAuth();

  useEffect(() => {
    void initDatabase();

    const configured = configureRevenueCat();
    if (!configured) return;

    const updateListener = (info: any) => {
      const isActive = Boolean(info.entitlements.active[PREMIUM_ENTITLEMENT_ID]);
      usePlantStore.getState().setPremium(isActive);
    };
    
    Purchases.addCustomerInfoUpdateListener(updateListener);

    // Hidratação inicial — não espera o primeiro evento do listener.
    void usePlantStore.getState().syncSubscription();

    const handleAppStateChange = (nextAppState: AppStateStatus) => {
      if (nextAppState === "active") {
        const state = usePlantStore.getState();
        if (state.user && !state.user.isAnonymous) {
          state.syncDataWithSupabase();
        }
      }
    };
    const subscription = AppState.addEventListener("change", handleAppStateChange);

    return () => {
      Purchases.removeCustomerInfoUpdateListener(updateListener);
      subscription.remove();
    };
  }, []);

  return (
    <>
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
    </>
  );
}
