import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { Stack } from "expo-router";
import { StatusBar } from "expo-status-bar";
import { useEffect } from "react";
import { SafeAreaProvider } from "react-native-safe-area-context";
import Toast from "react-native-toast-message";
import { toastConfig } from "../src/components/ToastConfig";
import { initDatabase } from "../src/database/db";
import { useAuth } from "../src/hooks/useAuth";
import { usePlantStore } from "../src/store/usePlantStore";
import "../global.css";

const queryClient = new QueryClient();

export default function RootLayout() {
  useAuth();

  useEffect(() => {
    void initDatabase();
    void usePlantStore.getState().syncSubscription();
  }, []);

  return (
    <>
      <SafeAreaProvider>
        <QueryClientProvider client={queryClient}>
          <StatusBar style="dark" />
          <Stack screenOptions={{ headerShown: false }}>
            <Stack.Screen name="paywall" options={{ presentation: "modal" }} />
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
