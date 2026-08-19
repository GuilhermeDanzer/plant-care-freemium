import * as Sharing from "expo-sharing";
import React, { useMemo, useRef } from "react";
import { useTranslation } from "react-i18next";
import { Alert, Modal, Pressable, Text, View } from "react-native";
import ViewShot from "react-native-view-shot";
import { usePlantStore } from "@/store/usePlantStore";
import { useTaskStore } from "@/store/useTaskStore";
import { MilestoneCard } from "@/components/domain/MilestoneCard";

export const MilestoneModal = () => {
  const { t } = useTranslation();
  const { showMilestoneModal, milestonePlantId, milestoneValue, closeMilestoneModal } =
    useTaskStore();
  const { plants } = usePlantStore();

  const viewShotRef = useRef<ViewShot>(null);

  const plant = useMemo(
    () => plants.find((p) => p.id === milestonePlantId),
    [plants, milestonePlantId]
  );

  if (!showMilestoneModal || !plant) {
    return null;
  }

  const handleShare = async () => {
    try {
      if (!viewShotRef.current?.capture) {
        throw new Error("ViewShot capture method not available");
      }

      const uri = await viewShotRef.current.capture();

      const isAvailable = await Sharing.isAvailableAsync();
      if (!isAvailable) {
        Alert.alert(
          t("milestones.shareUnavailableTitle", "Erro"),
          t(
            "milestones.shareUnavailableBody",
            "O compartilhamento não está disponível no seu dispositivo."
          )
        );
        return;
      }

      await Sharing.shareAsync(uri, {
        dialogTitle: t("milestones.shareTitle", "Compartilhe sua conquista!"),
        mimeType: "image/png",
      });
      
      closeMilestoneModal();
    } catch (error) {
      console.error("Failed to share milestone image:", error);
      Alert.alert(
        t("milestones.shareErrorTitle", "Erro"),
        t(
          "milestones.shareErrorBody",
          "Não foi possível gerar a imagem para compartilhamento."
        )
      );
    }
  };

  const plantName = plant.nickname || plant.original_name;
  const milestoneText = t("milestones.streak", {
    count: milestoneValue,
    defaultValue: `${milestoneValue} Dias de Sequência!`,
  });

  return (
    <Modal
      visible={showMilestoneModal}
      animationType="slide"
      transparent={true}
      onRequestClose={closeMilestoneModal}
    >
      <View className="flex-1 bg-black/80 justify-center items-center px-6">
        {/* The Card */}
        <MilestoneCard
          ref={viewShotRef}
          plantName={plantName}
          imageUri={plant.image_uri}
          milestoneText={milestoneText}
        />

        {/* Buttons */}
        <View className="w-full mt-8 gap-4">
          <Pressable
            onPress={handleShare}
            className="w-full items-center justify-center rounded-2xl bg-indigo-500 py-4 active:opacity-80 shadow-md"
          >
            <Text className="font-bold text-white text-lg">
              {t("milestones.shareBtn", "Compartilhar no Instagram")}
            </Text>
          </Pressable>

          <Pressable
            onPress={closeMilestoneModal}
            className="w-full items-center justify-center rounded-2xl bg-slate-800 py-4 active:opacity-80"
          >
            <Text className="font-bold text-slate-300 text-lg">
              {t("milestones.closeBtn", "Fechar")}
            </Text>
          </Pressable>
        </View>
      </View>
    </Modal>
  );
};
