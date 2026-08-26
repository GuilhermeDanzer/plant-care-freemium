import { Text, TouchableOpacity, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useTranslation } from "react-i18next";

export interface PlantNotFoundProps {
  onBack: () => void;
}

/**
 * Estado vazio exibido quando o `id` da rota não corresponde a nenhuma planta
 * carregada (ex.: registro excluído ou ainda não hidratado).
 */
export function PlantNotFound({ onBack }: PlantNotFoundProps) {
  const { t } = useTranslation();
  return (
    <SafeAreaView edges={["top", "bottom"]} className="flex-1 bg-slate-50">
      <View className="flex-1 items-center justify-center px-6">
        <Text className="text-base text-slate-500">
          {t("plantDetail.plantNotFound")}
        </Text>
        <TouchableOpacity
          className="mt-6 rounded-2xl bg-emerald-600 px-6 py-3"
          onPress={onBack}
        >
          <Text className="text-sm font-semibold text-white">
            {t("plantDetail.btnBack")}
          </Text>
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  );
}
