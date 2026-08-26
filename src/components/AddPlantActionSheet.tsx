import React from "react";
import { View, Text, TouchableOpacity, Modal } from "react-native";
import { Camera, Edit3, X } from "lucide-react-native";
import { useTranslation } from "react-i18next";

interface AddPlantActionSheetProps {
  visible: boolean;
  onClose: () => void;
  onSelectAI: () => void;
  onSelectManual: () => void;
}

export function AddPlantActionSheet({
  visible,
  onClose,
  onSelectAI,
  onSelectManual,
}: AddPlantActionSheetProps) {
  const { t } = useTranslation();

  return (
    <Modal visible={visible} transparent animationType="slide" onRequestClose={onClose}>
      <View className="flex-1 justify-end bg-black/50">
        <View className="bg-white rounded-t-3xl p-6 shadow-xl">
          <View className="flex-row justify-between items-center mb-6">
            <Text className="text-xl font-bold text-slate-800">{t("addPlant.title")}</Text>
            <TouchableOpacity onPress={onClose} className="p-2 bg-slate-100 rounded-full">
              <X color="#64748b" size={20} />
            </TouchableOpacity>
          </View>

          <TouchableOpacity
            className="w-full bg-emerald-50 border border-emerald-200 rounded-2xl p-5 mb-4 flex-row items-center"
            onPress={onSelectAI}
          >
            <View className="bg-emerald-100 p-3 rounded-full mr-4">
              <Camera color="#10b981" size={24} />
            </View>
            <View className="flex-1">
              <Text className="text-lg font-bold text-emerald-800 mb-1">
                {t("addPlant.aiOption")}
              </Text>
              <Text className="text-sm text-emerald-600 font-medium">
                {t("addPlant.aiCost")}
              </Text>
            </View>
          </TouchableOpacity>

          <TouchableOpacity
            className="w-full bg-white border border-slate-200 rounded-2xl p-5 mb-8 flex-row items-center"
            onPress={onSelectManual}
          >
            <View className="bg-slate-100 p-3 rounded-full mr-4">
              <Edit3 color="#64748b" size={24} />
            </View>
            <View className="flex-1">
              <Text className="text-lg font-bold text-slate-800 mb-1">
                {t("addPlant.manualOption")}
              </Text>
              <Text className="text-sm text-slate-500 font-medium">
                {t("addPlant.manualCost")}
              </Text>
            </View>
          </TouchableOpacity>
        </View>
      </View>
    </Modal>
  );
}
