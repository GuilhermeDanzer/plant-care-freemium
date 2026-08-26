import { Text, View } from "react-native";
import { useTranslation } from "react-i18next";
import { BulletSection } from "@/components/health/BulletSection";
import { ShieldIcon, SparklesIcon } from "@/components/icons";
import { shadowLayering } from "@/utils/shadows";
import type { DiseaseSuggestion } from "@/types/plant";
import type { InsightTone } from "@/types/health";

export type { InsightTone } from "@/types/health";

const TONE: Record<
  InsightTone,
  {
    chipBg: string;
    chipText: string;
    eyebrow: string;
    label: "health.optimizationLabel" | "health.criticalLabel";
    sectionTint: string;
  }
> = {
  optimization: {
    chipBg: "bg-amber-50",
    chipText: "text-amber-700",
    eyebrow: "text-amber-700",
    label: "health.optimizationLabel",
    sectionTint: "#d97706",
  },
  critical: {
    chipBg: "bg-rose-50",
    chipText: "text-rose-700",
    eyebrow: "text-rose-700",
    label: "health.criticalLabel",
    sectionTint: "#e11d48",
  },
};

export interface HealthInsightCardProps {
  suggestion: DiseaseSuggestion;
  tone?: InsightTone;
}

/**
 * Card for a single disease/optimization suggestion: header with probability
 * chip, description, probable cause, and bullet sections for treatment steps.
 */
export function HealthInsightCard({
  suggestion,
  tone = "optimization",
}: HealthInsightCardProps) {
  const { t } = useTranslation();
  const palette = TONE[tone];
  const probability = Math.round(Number(suggestion.probability ?? 0) * 100);
  const title =
    suggestion.details?.local_name ??
    suggestion.name ??
    t("health.possibleCause");
  const description = suggestion.details?.description?.trim();
  const cause = suggestion.details?.cause?.trim();
  const prevention = suggestion.details?.treatment?.prevention ?? [];
  const biological = suggestion.details?.treatment?.biological ?? [];

  return (
    <View style={shadowLayering.cast}>
      <View
        className="rounded-[24px] border border-slate-100 bg-white p-5"
        style={shadowLayering.core}
      >
        {/* Header */}
        <View className="flex-row items-start justify-between">
          <View className="flex-1 pr-3">
            <Text
              className={`text-[10px] font-semibold uppercase tracking-[2px] ${palette.eyebrow}`}
            >
              {t(palette.label)}
            </Text>
            <Text className="mt-1 text-base font-bold tracking-tight text-slate-900">
              {title}
            </Text>
            {cause ? (
              <Text
                className="mt-1 text-xs text-slate-500"
                numberOfLines={2}
              >
                {t("health.probableCause", { cause })}
              </Text>
            ) : null}
          </View>

          <View className={`rounded-full ${palette.chipBg} px-3 py-1`}>
            <Text
              className={`text-[11px] font-bold tracking-tight ${palette.chipText}`}
            >
              {probability}%
            </Text>
          </View>
        </View>

        {description ? (
          <Text
            className="mt-3 text-sm leading-5 text-slate-600"
            numberOfLines={4}
          >
            {description}
          </Text>
        ) : null}

        {prevention.length > 0 || biological.length > 0 ? (
          <View className="mt-4 gap-3">
            <BulletSection
              icon={ShieldIcon}
              tint="#059669"
              label={t("health.immediateActions")}
              items={prevention.slice(0, 4)}
            />
            <BulletSection
              icon={SparklesIcon}
              tint="#0ea5e9"
              label={t("health.naturalCare")}
              items={biological.slice(0, 4)}
            />
          </View>
        ) : null}
      </View>
    </View>
  );
}
