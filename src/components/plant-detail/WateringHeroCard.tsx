import { LinearGradient } from "expo-linear-gradient";
import { StyleSheet, Text, View } from "react-native";
import { DropletIcon, SproutIcon } from "@/components/icons";
import { formatFriendlyDate } from "@/utils/dateUtils";
import type { WateringCountdownDetail } from "@/utils/dateUtils";
import { shadowLayering } from "@/utils/shadows";
import { useTranslation } from "react-i18next";

export interface WateringHeroCardProps {
  countdown: WateringCountdownDetail;
  lastWateredAt: string;       // ISO string
  wateringFreqDays: number;
  daysSinceLastWatering: number;
}

/**
 * Presentational card showing the watering status: next watering date,
 * last watering date, and frequency. No callbacks — purely display.
 */
export function WateringHeroCard({
  countdown,
  lastWateredAt,
  wateringFreqDays,
  daysSinceLastWatering,
}: WateringHeroCardProps) {
  const { t } = useTranslation();
  return (
    <View style={shadowLayering.cast}>
      <LinearGradient
        colors={
          countdown.isOverdue
            ? ["#0284c7", "#0ea5e9"]
            : countdown.isToday
              ? ["#0891b2", "#06b6d4"]
              : ["#065f46", "#0f766e"]
        }
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={styles.heroGradient}
      >
        <View className="p-6">
          <View className="flex-row items-center">
            <View className="rounded-full border border-white/25 bg-white/10 p-3">
              <DropletIcon color="#ffffff" size={22} />
            </View>
            <View className="ml-4 flex-1">
              <Text className="text-xs font-semibold uppercase tracking-[2px] text-white/80">
                {t("plantDetail.wateringHeroNext")}
              </Text>
              <Text className="mt-1 text-2xl font-bold tracking-tight text-white">
                {countdown.label}
              </Text>
            </View>
          </View>

          <Text className="mt-3 text-sm text-white/90">
            {countdown.helper}
          </Text>

          <View className="mt-5 flex-row items-center justify-between">
            <View>
              <Text className="text-[10px] uppercase tracking-widest text-white/70">
                {t("plantDetail.wateringHeroLast")}
              </Text>
              <Text className="mt-1 text-sm font-semibold text-white">
                {formatFriendlyDate(lastWateredAt)}
              </Text>
              <Text className="mt-0.5 text-[11px] text-white/75">
                {daysSinceLastWatering === 0
                  ? t("plantDetail.wateringHeroToday")
                  : t("plantDetail.wateringHeroDaysAgo", { count: daysSinceLastWatering })}
              </Text>
            </View>
            <View>
              <Text className="text-[10px] uppercase tracking-widest text-white/70">
                {t("plantDetail.wateringHeroFreq")}
              </Text>
              <Text className="mt-1 text-sm font-semibold text-white">
                {t("plantDetail.wateringHeroEveryDays", { count: wateringFreqDays })}
              </Text>
            </View>
            <View className="rounded-full bg-white/10 p-3">
              <SproutIcon color="#ffffff" size={22} />
            </View>
          </View>
        </View>
      </LinearGradient>
    </View>
  );
}

const styles = StyleSheet.create({
  heroGradient: {
    borderRadius: 28,
    overflow: "hidden",
  },
});
