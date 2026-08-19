import React from "react";
import {
  Dimensions,
  ScrollView,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useTranslation } from "react-i18next";
import { KindwiseIdentificationResponse, KindwiseSuggestion } from "@/types/kindwise";

interface ScanResultScreenProps {
  data: KindwiseIdentificationResponse;
  onConfirm: (plant: KindwiseSuggestion) => void;
  onCancel: () => void;
}

const { width } = Dimensions.get("window");

export function ScanResultScreen({ data, onConfirm, onCancel }: ScanResultScreenProps) {
  const { t } = useTranslation();

  const topSuggestions = [...data.suggestions]
    .sort((a, b) => b.probability - a.probability)
    .slice(0, 3);

  const topMatch = topSuggestions[0];
  const isHighConfidence = topMatch && topMatch.probability > 0.9;

  return (
    <SafeAreaView edges={["top", "bottom"]} className="flex-1 bg-slate-50">
      <ScrollView
        className="flex-1"
        contentContainerStyle={{ padding: 20, paddingBottom: 40 }}
        showsVerticalScrollIndicator={false}
      >
        {/* Header */}
        <View className="mb-6 items-center">
          <View
            className={`flex-row items-center justify-center rounded-full px-5 py-2 shadow-sm ${
              isHighConfidence ? "bg-emerald-100" : "bg-amber-100"
            }`}
          >
            <Text
              className={`text-sm font-bold ${
                isHighConfidence ? "text-emerald-700" : "text-amber-700"
              }`}
            >
              {isHighConfidence
                ? t("scanResult.highConfidence", "✓ High Confidence Match")
                : t("scanResult.lowConfidence", "⚠️ Low Confidence — Check Alternatives")}
            </Text>
          </View>
          <Text className="mt-4 text-2xl font-bold tracking-tight text-slate-900">
            {t("scanResult.title", "Top Matches")}
          </Text>
          <Text className="mt-1 text-sm text-slate-500">
            {t("scanResult.subtitle", "Choose the one that matches your plant")}
          </Text>
        </View>

        {/* Cards */}
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          snapToInterval={width * 0.78 + 16}
          decelerationRate="fast"
          contentContainerStyle={{ paddingHorizontal: 2 }}
          className="mb-6"
        >
          {topSuggestions.map((suggestion, index) => (
            <View
              key={index}
              className="mr-4 rounded-3xl border border-slate-100 bg-white p-5 shadow-sm"
              style={{ width: width * 0.78 }}
            >
              {/* Rank badge */}
              <View className="mb-4 flex-row items-center justify-between">
                <View className={`rounded-full px-3 py-1 ${index === 0 ? "bg-emerald-100" : "bg-slate-100"}`}>
                  <Text className={`text-xs font-bold ${index === 0 ? "text-emerald-700" : "text-slate-500"}`}>
                    {index === 0 ? `#1 ${t("scanResult.bestMatch", "Best Match")}` : `#${index + 1}`}
                  </Text>
                </View>
                <View className="rounded-full bg-slate-50 px-3 py-1">
                  <Text className="text-xs font-bold text-emerald-600">
                    {Math.round(suggestion.probability * 100)}%
                  </Text>
                </View>
              </View>

              <Text className="text-xl font-bold tracking-tight text-slate-900">
                {suggestion.plant_name}
              </Text>
              {suggestion.plant_details?.common_names && suggestion.plant_details.common_names.length > 0 && (
                <Text className="mt-1 text-sm italic text-slate-400">
                  {suggestion.plant_details.common_names.slice(0, 2).join(", ")}
                </Text>
              )}

              {/* Confidence bar */}
              <View className="mt-4 mb-6">
                <View className="h-2 w-full rounded-full bg-slate-100">
                  <View
                    className={`h-2 rounded-full ${suggestion.probability > 0.8 ? "bg-emerald-500" : suggestion.probability > 0.5 ? "bg-amber-400" : "bg-red-400"}`}
                    style={{ width: `${Math.round(suggestion.probability * 100)}%` }}
                  />
                </View>
              </View>

              <TouchableOpacity
                className="w-full items-center rounded-2xl bg-emerald-600 py-3.5"
                onPress={() => onConfirm(suggestion)}
                testID={`scan-confirm-btn-${index}`}
              >
                <Text className="text-base font-bold text-white">
                  {t("scanResult.confirmBtn", "This is my plant ✓")}
                </Text>
              </TouchableOpacity>
            </View>
          ))}
        </ScrollView>

        {/* Health assessment */}
        {data.health_assessment && (
          <View className="mb-6 rounded-3xl border border-slate-100 bg-white p-5 shadow-sm">
            <Text className="mb-3 text-base font-bold text-slate-900">
              {t("scanResult.healthTitle", "Health Assessment")}
            </Text>
            {data.health_assessment.is_healthy.binary ? (
              <View className="flex-row items-center gap-2">
                <Text className="text-2xl">🌿</Text>
                <Text className="text-sm font-semibold text-emerald-600">
                  {t("scanResult.healthyMsg", "Plant appears healthy!")}
                </Text>
              </View>
            ) : (
              <View>
                <View className="mb-3 flex-row items-center gap-2">
                  <Text className="text-2xl">⚠️</Text>
                  <Text className="text-sm font-semibold text-rose-600">
                    {t("scanResult.issuesMsg", "Potential issues detected")}
                  </Text>
                </View>
                {data.health_assessment.diseases.slice(0, 2).map((disease, idx) => (
                  <View key={idx} className="mb-2 flex-row items-center justify-between rounded-xl bg-rose-50 px-3 py-2">
                    <Text className="text-sm text-slate-700">{disease.name}</Text>
                    <Text className="text-xs font-bold text-rose-500">
                      {Math.round(disease.probability * 100)}%
                    </Text>
                  </View>
                ))}
              </View>
            )}
            <View className="mt-3 rounded-xl border border-amber-100 bg-amber-50 p-3">
              <Text className="text-xs leading-5 text-amber-700">
                {t("scanResult.healthDisclaimer", "⚠️ Always check soil and environment before applying any treatment.")}
              </Text>
            </View>
          </View>
        )}

        {/* Cancel button */}
        <TouchableOpacity
          className="items-center py-3"
          onPress={onCancel}
          testID="scan-cancel-btn"
        >
          <Text className="text-sm font-semibold text-slate-400">
            {t("scanResult.cancelBtn", "← Try again with different photos")}
          </Text>
        </TouchableOpacity>
      </ScrollView>
    </SafeAreaView>
  );
}
