import { useEffect } from "react";
import { useTranslation } from "react-i18next";
import {
  LayoutAnimation,
  Platform,
  Text,
  UIManager,
  View,
} from "react-native";
import { GeneralTipsCard } from "@/components/health/GeneralTipsCard";
import { getStatePalette } from "@/components/health/healthPalette";
import { HealthGauge } from "@/components/health/HealthGauge";
import { FadeIn } from "@/components/ui/FadeIn";
import { HealthInsightCard } from "@/components/HealthInsightCard";
import { formatFriendlyDate } from "@/utils/dateUtils";
import { interpretResponse } from "@/utils/healthUtils";
import { shadowLayering } from "@/utils/shadows";
import type { HealthResultCardProps, InsightTone } from "@/types/health";

export type { HealthResultCardProps } from "@/types/health";

if (
  Platform.OS === "android" &&
  UIManager.setLayoutAnimationEnabledExperimental
) {
  UIManager.setLayoutAnimationEnabledExperimental(true);
}

/**
 * Main health result card: hero gauge + state, followed by either actionable
 * insight cards or a generic optimization checklist.
 */
export function HealthResultCard({
  response,
  lastCheckedAt,
}: HealthResultCardProps) {
  const { t } = useTranslation();
  const result = response?.result;

  // Defensive fallback: malformed or legacy payload reached this point.
  useEffect(() => {
    LayoutAnimation.configureNext(LayoutAnimation.Presets.easeInEaseOut);
  }, [response]);

  if (!result || !result.is_healthy) {
    return (
      <View style={shadowLayering.cast}>
        <View
          className="rounded-[28px] border border-slate-100 bg-white p-5"
          style={shadowLayering.core}
        >
          <Text className="text-center text-sm text-slate-500">
            {t("health.noDataTitle")}
          </Text>
          <Text className="mt-2 text-center text-xs text-slate-400">
            {t("health.noDataSubtitle")}
          </Text>
        </View>
      </View>
    );
  }

  const { state, score, relevantSuggestions, hadSuggestions } =
    interpretResponse(response);
  const palette = getStatePalette(t)[state];
  const insightTone: InsightTone =
    state === "critical" ? "critical" : "optimization";

  const showInsights = relevantSuggestions.length > 0;
  const showGeneralTips = !showInsights && state !== "perfect";

  return (
    <View className="gap-3">
      {/* HERO - Gauge + state */}
      <FadeIn>
        <View style={shadowLayering.cast}>
          <View
            className="rounded-[28px] border border-slate-100 bg-white p-5"
            style={shadowLayering.core}
          >
            <View className="flex-row items-center">
              <HealthGauge score={score} palette={palette} />

              <View className="ml-5 flex-1">
                <View className="flex-row items-center">
                  <View className={`rounded-full ${palette.bg} p-2`}>
                    <palette.icon color={palette.tint} size={14} />
                  </View>
                  <Text
                    className={`ml-2 text-[10px] font-semibold uppercase tracking-[2px] ${palette.eyebrow}`}
                  >
                    {palette.eyebrowLabel}
                  </Text>
                </View>

                <Text className="mt-2 text-base font-bold tracking-tight text-slate-900">
                  {palette.title}
                </Text>
                <Text className="mt-1 text-xs leading-4 text-slate-500">
                  {palette.subtitle}
                </Text>
              </View>
            </View>
          </View>
        </View>
      </FadeIn>

      {/* INSIGHTS - opportunities / diseases */}
      {showInsights ? (
        <View className="gap-3">
          {relevantSuggestions.map((suggestion, idx) => (
            <FadeIn key={suggestion.id ?? idx} delay={120 + idx * 90}>
              <HealthInsightCard suggestion={suggestion} tone={insightTone} />
            </FadeIn>
          ))}
        </View>
      ) : null}

      {/* FALLBACK - general tips when API returned no strong suggestions */}
      {showGeneralTips ? (
        <FadeIn delay={140}>
          <GeneralTipsCard
            palette={palette}
            score={score}
            hadNoisySuggestions={hadSuggestions}
          />
        </FadeIn>
      ) : null}

      <Text className="mt-1 text-[11px] text-slate-400">
        {t("health.lastChecked", { date: formatFriendlyDate(lastCheckedAt) })}
      </Text>
    </View>
  );
}
