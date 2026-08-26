import { useLocalSearchParams, useRouter } from "expo-router";
import React, { useMemo } from "react";
import { View, Text } from "react-native";
import { useTranslation } from "react-i18next";
import { ScanResultScreen } from "@/components/ScanResultScreen";
import { plantService } from "@/services/plantService";
import { KindwiseIdentificationResponse, KindwiseSuggestion } from "@/types/kindwise";

export default function ScanResultRoute() {
  const router = useRouter();
  const { t } = useTranslation();
  const { scanData: rawScanData, imageUri } = useLocalSearchParams<{
    scanData?: string;
    imageUri?: string;
  }>();

  const scanData = useMemo<KindwiseIdentificationResponse | null>(() => {
    if (!rawScanData) return null;
    try {
      return JSON.parse(rawScanData);
    } catch {
      return null;
    }
  }, [rawScanData]);

  const handleConfirm = (suggestion: KindwiseSuggestion) => {
    // Parse suggestion into IdentifiedPlant structure for setup screen
    const identifiedPlant = plantService.parseSuggestion({
      name: suggestion.plant_name,
      details: suggestion.plant_details
    });

    router.replace({
      pathname: "/(identify)/setup",
      params: { 
        identifiedPlant: JSON.stringify(identifiedPlant),
        imageUri: imageUri 
      },
    });
  };

  const handleCancel = () => {
    router.back();
  };

  if (!scanData) {
    return (
      <View className="flex-1 items-center justify-center bg-slate-50">
        <Text className="text-slate-500">{t("scanResult.notFound")}</Text>
      </View>
    );
  }

  return (
    <ScanResultScreen 
      data={scanData} 
      onConfirm={handleConfirm} 
      onCancel={handleCancel} 
    />
  );
}
