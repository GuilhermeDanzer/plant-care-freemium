import { BlurView } from "expo-blur";
import { LinearGradient } from "expo-linear-gradient";
import { StyleSheet, Text, TouchableOpacity, View } from "react-native";
import { GemIcon, LockIcon, SparklesIcon } from "@/components/icons";
import { shadowLayering } from "@/utils/shadows";
import { useTranslation } from "react-i18next";

export interface BlurredHealthCardProps {
  onUnlock: () => void;
}

/**
 * Shown when the plant is in free tier — shows a blurred placeholder with
 * an unlock CTA to the paywall.
 */
export function BlurredHealthCard({ onUnlock }: BlurredHealthCardProps) {
  const { t } = useTranslation();
  return (
    <View style={shadowLayering.cast}>
      <View
        className="h-[220px] overflow-hidden rounded-[28px] border border-slate-100 bg-white"
        style={shadowLayering.core}
      >
        <View className="p-5">
          <View className="flex-row items-center opacity-80">
            <View className="rounded-full bg-emerald-50 p-3">
              <SparklesIcon color="#10b981" size={20} />
            </View>
            <View className="ml-3 flex-1">
              <View className="h-3 w-24 rounded-full bg-slate-200" />
              <View className="mt-2 h-4 w-48 rounded-full bg-slate-300" />
            </View>
          </View>

          <View className="mt-4 gap-2 opacity-80">
            <View className="h-3 w-full rounded-full bg-slate-200" />
            <View className="h-3 w-11/12 rounded-full bg-slate-200" />
            <View className="h-3 w-10/12 rounded-full bg-slate-200" />
          </View>
        </View>

        <BlurView intensity={40} tint="light" style={StyleSheet.absoluteFill}>
          <View className="flex-1 items-center justify-center px-6">
            <View className="rounded-full border border-emerald-100 bg-white/80 p-4">
              <LockIcon color="#047857" size={22} />
            </View>
            <Text className="mt-4 text-center text-base font-bold tracking-tight text-slate-900">
              {t("plantDetail.blurredHealthTitle")}
            </Text>
            <Text className="mt-1 text-center text-xs text-slate-600">
              {t("plantDetail.blurredHealthSubtitle")}
            </Text>

            <TouchableOpacity
              activeOpacity={0.9}
              onPress={onUnlock}
              className="mt-4 overflow-hidden rounded-2xl"
              style={shadowLayering.core}
            >
              <LinearGradient
                colors={["#059669", "#0f766e"]}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 1 }}
                style={{ borderRadius: 16 }}
              >
                <View className="flex-row items-center gap-2 px-5 py-3">
                  <GemIcon color="#ffffff" size={14} strokeWidth={1.8} />
                  <Text className="text-sm font-bold tracking-tight text-white">
                    {t("plantDetail.blurredHealthUnlockBtn")}
                  </Text>
                </View>
              </LinearGradient>
            </TouchableOpacity>
          </View>
        </BlurView>
      </View>
    </View>
  );
}
