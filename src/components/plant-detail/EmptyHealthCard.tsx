import { View, Text } from "react-native";
import { SparklesIcon } from "@/components/icons";
import { shadowLayering } from "@/utils/shadows";
import { useTranslation } from "react-i18next";

/**
 * Shown when a plant has Premium access but has no health diagnosis yet.
 */
export function EmptyHealthCard() {
  const { t } = useTranslation();
  return (
    <View style={shadowLayering.cast}>
      <View
        className="rounded-[28px] border border-slate-100 bg-white p-5"
        style={shadowLayering.core}
      >
        <View className="items-center py-4">
          <View className="rounded-full bg-emerald-50 p-4">
            <SparklesIcon color="#10b981" size={22} />
          </View>
          <Text className="mt-4 text-center text-base font-bold tracking-tight text-slate-900">
            {t("plantDetail.emptyHealthTitle")}
          </Text>
          <Text className="mt-1 text-center text-sm text-slate-500">
            {t("plantDetail.emptyHealthSubtitle")}
          </Text>
        </View>
      </View>
    </View>
  );
}
