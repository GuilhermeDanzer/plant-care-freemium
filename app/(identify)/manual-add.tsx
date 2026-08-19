import { useRouter } from "expo-router";
import React from "react";
import * as Notifications from "expo-notifications";
import { useTranslation } from "react-i18next";
import { ManualAddScreen, Plant } from "@/components/ManualAddScreen";
import { usePlantStore } from "@/store/usePlantStore";
import { calculateNextWateringAt } from "@/utils/dateUtils";

export default function ManualAddRoute() {
  const router = useRouter();
  const { t } = useTranslation();
  const addPlant = usePlantStore((state) => state.addPlant);

  const scheduleWateringNotification = async (plantName: string, nextWateringDate: Date) => {
    const { status } = await Notifications.requestPermissionsAsync();
    if (status !== 'granted') return;

    const secondsUntilWatering = Math.floor((nextWateringDate.getTime() - Date.now()) / 1000);
    if (secondsUntilWatering > 0) {
      await Notifications.scheduleNotificationAsync({
        content: {
          title: t("manualAdd.notificationTitle"),
          body: t("manualAdd.notificationBody", { plantName }),
        },
        trigger: { 
          type: Notifications.SchedulableTriggerInputTypes.TIME_INTERVAL,
          seconds: secondsUntilWatering 
        } as Notifications.TimeIntervalTriggerInput,
      });
    }
  };

  const handleSave = async (plant: Plant) => {
    const lastWateredAtIso = new Date().toISOString();
    const nextWateringAt = calculateNextWateringAt(
      lastWateredAtIso,
      plant.wateringFrequencyDays
    );

    const added = await addPlant({
      originalName: plant.speciesName,
      scientificName: t("manualAdd.scientificNameDefault"),
      wateringFrequencyDays: plant.wateringFrequencyDays,
      lastWateredAt: lastWateredAtIso,
      nextWateringAt,
      imageUri: plant.localImageUri,
    });

    if (added) {
      await scheduleWateringNotification(plant.speciesName, new Date(nextWateringAt));
      router.replace("/(main)");
    }
  };

  const handleCancel = () => {
    router.back();
  };

  return <ManualAddScreen onSave={handleSave} onCancel={handleCancel} />;
}
