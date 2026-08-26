import { ActivityIndicator, Text, TouchableOpacity, View } from "react-native";
import { useTranslation } from "react-i18next";
import { GemIcon, SparklesIcon } from "@/components/icons";
import { HealthResultCard } from "@/components/HealthResultCard";
import { BlurredHealthCard } from "@/components/plant-detail/BlurredHealthCard";
import { EmptyHealthCard } from "@/components/plant-detail/EmptyHealthCard";
import { shadowLayering } from "@/utils/shadows";
import type { HealthAssessmentResponse } from "@/types/plant";

export interface PlantHealthSectionProps {
  isPremium: boolean;
  health: HealthAssessmentResponse | null;
  lastCheckedAt: string | null;
  isChecking: boolean;
  onRequestDiagnosis: () => void;
  onUnlockPremium: () => void;
}

/**
 * Seção de saúde da planta: título + badge Premium. Para usuários premium mostra
 * o resultado (ou o estado vazio) e o botão de novo diagnóstico; para o plano
 * free mostra o card desfocado com CTA de desbloqueio.
 */
export function PlantHealthSection({
  isPremium,
  health,
  lastCheckedAt,
  isChecking,
  onRequestDiagnosis,
  onUnlockPremium,
}: PlantHealthSectionProps) {
  const { t } = useTranslation();

  return (
    <View className="mt-8 px-2">
      <View className="mb-3 flex-row items-center justify-between">
        <Text className="text-base font-bold tracking-tight text-slate-900">
          {t("plantDetail.healthSectionTitle")}
        </Text>
        {!isPremium ? (
          <View className="flex-row items-center gap-1 rounded-full bg-emerald-50 px-2.5 py-1">
            <GemIcon color="#059669" size={12} strokeWidth={1.8} />
            <Text className="text-[10px] font-semibold uppercase tracking-widest text-emerald-700">
              {t("plantDetail.premiumBadge")}
            </Text>
          </View>
        ) : null}
      </View>

      {isPremium ? (
        <>
          {health ? (
            <HealthResultCard response={health} lastCheckedAt={lastCheckedAt} />
          ) : (
            <EmptyHealthCard />
          )}

          <TouchableOpacity
            activeOpacity={0.9}
            onPress={onRequestDiagnosis}
            disabled={isChecking}
            className="mt-4 flex-row items-center justify-center gap-2 rounded-2xl bg-slate-900 p-4"
            style={shadowLayering.core}
          >
            {isChecking ? (
              <ActivityIndicator color="#ffffff" size="small" />
            ) : (
              <SparklesIcon color="#ffffff" size={16} />
            )}
            <Text className="text-center text-sm font-semibold text-white">
              {isChecking
                ? t("plantDetail.btnAnalyzing")
                : health
                  ? t("plantDetail.btnNewConsultation")
                  : t("plantDetail.btnDiagnoseNow")}
            </Text>
          </TouchableOpacity>
        </>
      ) : (
        <BlurredHealthCard onUnlock={onUnlockPremium} />
      )}
    </View>
  );
}
