import React from "react";
import { useRouter, Stack } from "expo-router";
import { LexiconSearchScreen } from "@/components/lexicon/LexiconSearchScreen";

export default function LexiconIndexRoute() {
  const router = useRouter();

  const handleSelectPlant = (accessToken: string, name: string) => {
    router.push(`/lexicon/${accessToken}?name=${encodeURIComponent(name)}`);
  };

  return (
    <>
      <Stack.Screen options={{ headerShown: false }} />
      <LexiconSearchScreen onSelectPlant={handleSelectPlant} />
    </>
  );
}
