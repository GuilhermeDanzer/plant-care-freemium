import React from "react";
import { useLocalSearchParams, useRouter, Stack } from "expo-router";
import { LexiconDetailsScreen } from "@/components/lexicon/LexiconDetailsScreen";
import { usePlantStore } from "@/store/usePlantStore";

export default function LexiconDetailsRoute() {
  const router = useRouter();
  const { accessToken, name } = useLocalSearchParams<{ accessToken: string; name?: string }>();
  const isPremium = usePlantStore((s) => s.isPremium);

  const plantName = name || "Planta Selecionada";

  if (!accessToken) {
    return null;
  }

  return (
    <>
      <Stack.Screen options={{ headerShown: false }} />
      <LexiconDetailsScreen 
        accessToken={accessToken} 
        name={plantName} 
        isPremium={isPremium}
        onBack={() => router.back()}
        onPaywall={() => router.push("/paywall")}
      />
    </>
  );
}
