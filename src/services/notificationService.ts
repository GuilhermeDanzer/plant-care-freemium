import * as Notifications from "expo-notifications";
import i18n from "@/i18n";
import { permissionService } from "@/services/permissionService";
import type { PermissionCheck } from "@/services/permissionService";
import { useSettingsStore } from "@/store/useSettingsStore";
import { PlantRecord } from "@/types/plant";

export const notificationService = {
  requestPermissions: (): Promise<PermissionCheck> =>
    permissionService.ensureNotificationPermission(),

  cancelAllScheduledNotifications: async (): Promise<void> => {
    try {
      await Notifications.cancelAllScheduledNotificationsAsync();
    } catch (error) {
      console.warn(
        "[notificationService] Failed to cancel scheduled notifications.",
        error
      );
    }
  },

  syncWateringNotifications: async (plants: PlantRecord[]): Promise<void> => {
    // Sempre cancela as notificações agendadas para recriá-las de acordo com o estado mais atualizado
    await Notifications.cancelAllScheduledNotificationsAsync();

    const { notificationsEnabled, notificationTime } = useSettingsStore.getState();

    if (!notificationsEnabled) {
      return; // Usuário desativou as notificações
    }

    const [hourStr, minuteStr] = notificationTime.split(":");
    const targetHour = parseInt(hourStr, 10);
    const targetMinute = parseInt(minuteStr, 10);

    const now = new Date();

    // Filtra e prepara as datas de rega
    const upcomingEvents = plants
      .map((plant) => {
        const nextWateringDate = new Date(plant.next_watering_at);
        // Ajusta a hora para o tempo preferido do usuário
        nextWateringDate.setHours(targetHour, targetMinute, 0, 0);

        return {
          plant,
          triggerDate: nextWateringDate,
        };
      })
      // Só queremos agendar para o futuro
      .filter((event) => event.triggerDate > now)
      // Ordena pelas mais próximas
      .sort((a, b) => a.triggerDate.getTime() - b.triggerDate.getTime())
      // iOS tem limite de 64 notificações locais. Agendamos as 60 mais próximas.
      .slice(0, 60);

    for (const event of upcomingEvents) {
      const plantName = event.plant.nickname || event.plant.original_name;
      
      await Notifications.scheduleNotificationAsync({
        content: {
          title: i18n.t("manualAdd.notificationTitle"),
          body: i18n.t("manualAdd.notificationBody", { plantName }),
          sound: true,
        },
        trigger: {
          type: Notifications.SchedulableTriggerInputTypes.DATE,
          date: event.triggerDate,
        },
      });
    }
  },
};
