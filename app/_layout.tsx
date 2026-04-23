import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { Stack } from "expo-router";
import { StatusBar } from "expo-status-bar";
import { useEffect } from "react";
import { Platform } from "react-native";
import Purchases, { LOG_LEVEL } from "react-native-purchases";
import { SafeAreaProvider } from "react-native-safe-area-context";
import Toast from "react-native-toast-message";
import { toastConfig } from "../src/components/ToastConfig";
import { initDatabase } from "../src/database/db";
import { useAuth } from "../src/hooks/useAuth";
import { PREMIUM_ENTITLEMENT_ID } from "../src/services/subscriptionService";
import { usePlantStore } from "../src/store/usePlantStore";
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

    // Fonte da verdade reativa: qualquer mudança no CustomerInfo (compra,
    // renovação, refund, expiração, restauração) reflete direto no store.
    const listener = Purchases.addCustomerInfoUpdateListener((info) => {
      const isActive = Boolean(info.entitlements.active[PREMIUM_ENTITLEMENT_ID]);
      usePlantStore.getState().setPremium(isActive);
    });

    // Hidratação inicial — não espera o primeiro evento do listener.
    void usePlantStore.getState().syncSubscription();

    return () => {
      listener.remove();
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
