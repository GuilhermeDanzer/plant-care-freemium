import * as Haptics from "expo-haptics";
import React, { memo } from "react";
import { useTranslation } from "react-i18next";
import { Pressable, Text, View } from "react-native";
import { useTaskStore } from "@/store/useTaskStore";
import { AppTask, TaskAction } from "@/types/plant";
import { shadowLayering } from "@/utils/shadows";

interface TaskCardProps {
  task: AppTask;
}

export const TaskCard = memo(function TaskCard({ task }: TaskCardProps) {
  const { t } = useTranslation();
  const { completeTask } = useTaskStore();

  const handleAction = async (actionType: TaskAction) => {
    await Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    await completeTask(task.plantId, task.type, actionType);
  };

  return (
    <View className="mb-4 w-full">
      <View
        style={[
          shadowLayering.cast,
          {
            borderRadius: 24,
          },
        ]}
      >
        <View
          style={[
            shadowLayering.core,
            { borderRadius: 24, backgroundColor: "#ffffff" },
          ]}
          className="p-5 border border-slate-100"
        >
          <Text className="text-lg font-bold text-slate-800 mb-1">
            {task.plantName}
          </Text>
          <Text className="text-sm text-slate-500 mb-4">
            {task.type === "REGAR" && t("tasks.waterTaskDescription")}
            {task.type === "GIRAR" && t("tasks.rotateTaskDescription")}
            {task.type === "LIMPAR" && t("tasks.cleanTaskDescription")}
          </Text>

          {task.type === "REGAR" ? (
            <View className="flex-row gap-3 mt-2">
              <Pressable
                onPress={() => handleAction("WATERED")}
                className="flex-1 items-center justify-center rounded-xl bg-emerald-500 py-3 active:opacity-80"
              >
                <Text className="font-bold text-white text-base">
                  {t("tasks.watered")}
                </Text>
              </Pressable>

              <Pressable
                onPress={() => handleAction("SOIL_WET")}
                className="flex-1 items-center justify-center rounded-xl border border-blue-400 bg-blue-50 py-3 active:opacity-80"
              >
                <Text className="font-bold text-blue-500 text-base">
                  {t("tasks.soilWet")}
                </Text>
              </Pressable>
            </View>
          ) : (
            <View className="mt-2">
              <Pressable
                onPress={() => handleAction("DONE")}
                className="w-full items-center justify-center rounded-xl bg-emerald-500 py-3 active:opacity-80"
              >
                <Text className="font-bold text-white text-base">
                  {t("tasks.done")}
                </Text>
              </Pressable>
            </View>
          )}
        </View>
      </View>
    </View>
  );
});
