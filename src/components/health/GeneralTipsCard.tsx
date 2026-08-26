import type { TFunction } from "i18next";
import { useTranslation } from "react-i18next";
import { Text, View } from "react-native";
import {
  DropletsIcon,
  SparklesIcon,
  SproutIcon,
  SunIcon,
} from "@/components/icons";
import type { GeneralTip, GeneralTipsCardProps } from "@/types/health";
import { shadowLayering } from "@/utils/shadows";

const getGeneralTips = (t: TFunction): GeneralTip[] => [
  {
    icon: DropletsIcon,
    tint: "#0ea5e9",
    title: t("health.tipsWaterTitle"),
    body: t("health.tipsWaterBody"),
  },
  {
    icon: SunIcon,
    tint: "#d97706",
    title: t("health.tipsLightTitle"),
    body: t("health.tipsLightBody"),
  },
  {
    icon: SproutIcon,
    tint: "#059669",
    title: t("health.tipsSoilTitle"),
    body: t("health.tipsSoilBody"),
  },
];

/**
 * Fallback card shown when the API returned no actionable disease suggestions,
 * but the score is not perfect. Renders a generic optimization checklist.
 */
export function GeneralTipsCard({
  palette,
  score,
  hadNoisySuggestions,
}: GeneralTipsCardProps) {
  const { t } = useTranslation();
  const headline =
    score >= 70 ? t("health.tipsHeadlineGood") : t("health.tipsHeadlineGrow");
  const subline = hadNoisySuggestions
    ? t("health.tipsSublineNoisy")
    : t("health.tipsSublineClean");

  return (
    <View style={shadowLayering.cast}>
      <View
        className="rounded-[24px] border border-slate-100 bg-white p-5"
        style={shadowLayering.core}
      >
        <View className="flex-row items-start">
          <View className={`rounded-full ${palette.bg} p-2.5`}>
            <SparklesIcon color={palette.tint} size={16} />
          </View>
          <View className="ml-3 flex-1">
            <Text
              className={`text-[10px] font-semibold uppercase tracking-[2px] ${palette.eyebrow}`}
            >
              {t("health.checklistEyebrow")}
            </Text>
            <Text className="mt-1 text-base font-bold tracking-tight text-slate-900">
              {headline}
            </Text>
            <Text className="mt-1 text-xs leading-4 text-slate-500">
              {subline}
            </Text>
          </View>
        </View>

        <View className="mt-4 gap-3">
          {getGeneralTips(t).map((tip) => (
            <View
              key={tip.title}
              className="flex-row items-start rounded-2xl border border-slate-100 bg-slate-50/60 p-3"
            >
              <View
                className="mr-3 items-center justify-center rounded-full"
                style={{
                  height: 28,
                  width: 28,
                  backgroundColor: `${tip.tint}14`,
                }}
              >
                <tip.icon color={tip.tint} size={14} />
              </View>
              <View className="flex-1">
                <Text className="text-sm font-bold tracking-tight text-slate-900">
                  {tip.title}
                </Text>
                <Text className="mt-0.5 text-xs leading-4 text-slate-600">
                  {tip.body}
                </Text>
              </View>
            </View>
          ))}
        </View>
      </View>
    </View>
  );
}
