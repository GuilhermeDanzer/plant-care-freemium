import React from "react";
import { View, Text, ScrollView, TouchableOpacity, SafeAreaView, Dimensions } from "react-native";
import { KindwiseIdentificationResponse, KindwiseSuggestion } from "../types/kindwise";

interface ScanResultScreenProps {
  data: KindwiseIdentificationResponse;
  onConfirm: (plant: KindwiseSuggestion) => void;
  onCancel: () => void;
}

const { width } = Dimensions.get("window");

export function ScanResultScreen({ data, onConfirm, onCancel }: ScanResultScreenProps) {
  // Sort suggestions by probability descending and take top 3
  const topSuggestions = [...data.suggestions]
    .sort((a, b) => b.probability - a.probability)
    .slice(0, 3);

  const topMatch = topSuggestions[0];
  const isHighConfidence = topMatch && topMatch.probability > 0.9;

  return (
    <SafeAreaView className="flex-1 bg-slate-50">
      <ScrollView className="flex-1 p-4">
        
        {/* Confidence Badge */}
        <View className="items-center mb-6 mt-2">
          <View
            className={`px-4 py-2 rounded-full flex-row items-center justify-center shadow-sm ${
              isHighConfidence ? "bg-emerald-100" : "bg-amber-100"
            }`}
          >
            <Text
              className={`text-sm font-bold ${
                isHighConfidence ? "text-emerald-700" : "text-amber-700"
              }`}
            >
              {isHighConfidence
                ? "✓ High Confidence"
                : "⚠️ Low Confidence - Check Alternatives"}
            </Text>
          </View>
        </View>

        <Text className="text-xl font-bold text-slate-800 mb-4 px-2">Top 3 Matches</Text>

        {/* Top 3 Swipeable List */}
        <ScrollView 
          horizontal 
          showsHorizontalScrollIndicator={false}
          className="mb-8"
          snapToInterval={width * 0.8 + 16} // 80% width + 16px gap
          decelerationRate="fast"
          contentContainerStyle={{ paddingHorizontal: 8 }}
        >
          {topSuggestions.map((suggestion, index) => (
            <View
              key={index}
              className="bg-white rounded-2xl p-5 mr-4 border border-slate-100 shadow-sm"
              style={{ width: width * 0.8 }}
            >
              <Text className="text-lg font-bold text-slate-900 mb-1">
                {suggestion.plant_name}
              </Text>
              {suggestion.plant_details?.common_names && (
                <Text className="text-sm text-slate-500 mb-4">
                  {suggestion.plant_details.common_names.join(", ")}
                </Text>
              )}
              
              <View className="flex-row justify-between items-center mb-6">
                <Text className="text-sm font-medium text-slate-400">Match Probability</Text>
                <Text className="text-sm font-bold text-emerald-600">
                  {Math.round(suggestion.probability * 100)}%
                </Text>
              </View>

              <TouchableOpacity
                className="w-full bg-emerald-600 py-3 rounded-xl items-center"
                onPress={() => onConfirm(suggestion)}
              >
                <Text className="text-white font-semibold">Confirm this is my plant</Text>
              </TouchableOpacity>
            </View>
          ))}
        </ScrollView>

        {/* Health Assessment Card */}
        {data.health_assessment && (
          <View className="bg-white rounded-2xl p-5 mx-2 mb-8 shadow-sm border border-slate-100">
            <Text className="text-lg font-bold text-slate-800 mb-2">Health Assessment</Text>
            
            <View className="mb-4">
              {data.health_assessment.is_healthy.binary ? (
                <Text className="text-emerald-600 font-medium">✓ Plant appears healthy</Text>
              ) : (
                <View>
                  <Text className="text-rose-600 font-medium mb-2">
                    ⚠️ Potential issues detected
                  </Text>
                  {data.health_assessment.diseases.slice(0, 2).map((disease, idx) => (
                    <Text key={idx} className="text-slate-600 text-sm mb-1">
                      • {disease.name} ({Math.round(disease.probability * 100)}%)
                    </Text>
                  ))}
                </View>
              )}
            </View>

            <View className="bg-amber-50 rounded-xl p-3 border border-amber-200">
              <Text className="text-amber-800 text-xs leading-5">
                ⚠️ Always manually check soil and environment before applying treatments.
              </Text>
            </View>
          </View>
        )}

      </ScrollView>
    </SafeAreaView>
  );
}
