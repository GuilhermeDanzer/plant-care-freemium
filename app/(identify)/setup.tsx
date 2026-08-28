import DateTimePicker, {
  DateTimePickerEvent,
} from "@react-native-community/datetimepicker";
import { useLocalSearchParams, useRouter } from "expo-router";
import { useMemo, useState } from "react";
import { useTranslation } from "react-i18next";
import { Platform, Text, TouchableOpacity, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import * as Notifications from "expo-notifications";
import { Droplet } from "lucide-react-native";
import { permissionService } from "@/services/permissionService";
import { usePlantStore } from "@/store/usePlantStore";
import { IdentifiedPlant } from "@/types/plant";
import {
  calculateNextWateringAt,
  mapWateringLevelToDays,
} from "@/utils/dateUtils";
import { showErrorToast } from "@/utils/showToasts";

// Configure notifications to show alert when app is in foreground
Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowAlert: true,
    shouldPlaySound: true,
    shouldSetBadge: false,
    shouldShowBanner: true,
    shouldShowList: true,
  }),
});

const getFallbackPlant = (t: any): IdentifiedPlant => ({
  name: t("identify.defaultPlantName"),
  scientificName: t("identify.defaultScientificName"),
  wateringLevel: 2,
});

const parseIdentifiedPlant = (raw: string | string[] | undefined, t: any): IdentifiedPlant => {
  if (!raw || Array.isArray(raw)) return getFallbackPlant(t);

  try {
    return JSON.parse(raw) as IdentifiedPlant;
  } catch {
    return getFallbackPlant(t);
  }
};

export default function SetupRoute() {
  const { t } = useTranslation();
  const router = useRouter();
  const { identifiedPlant: rawIdentifiedPlant, imageUri } = useLocalSearchParams<{
    identifiedPlant?: string;
    imageUri?: string;
  }>();
  const identifiedPlant = parseIdentifiedPlant(rawIdentifiedPlant, t);
  const [lastWateredAt, setLastWateredAt] = useState<Date>(new Date());
  const [showPicker, setShowPicker] = useState(false);
  const addPlant = usePlantStore((state) => state.addPlant);

  const wateringFrequencyDays = useMemo(
    () => mapWateringLevelToDays(identifiedPlant.wateringLevel),
    [identifiedPlant.wateringLevel]
  );

  const onDateChange = (event: DateTimePickerEvent, selectedDate?: Date) => {
    if (Platform.OS !== "ios") {
      setShowPicker(false);
    }
    if (event.type === "set" && selectedDate) {
      setLastWateredAt(selectedDate);
    }
  };

  const scheduleWateringNotification = async (plantName: string, nextWateringDate: Date) => {
    const permission = await permissionService.ensureNotificationPermission();
    if (permission !== 'granted') return;

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

  const savePlant = async () => {
    const lastWateredAtIso = lastWateredAt.toISOString();
    const nextWateringAt = calculateNextWateringAt(
      lastWateredAtIso,
      wateringFrequencyDays
    );

    const added = await addPlant({
      originalName: identifiedPlant.name,
      scientificName: identifiedPlant.scientificName,
      wateringFrequencyDays,
      lastWateredAt: lastWateredAtIso,
      nextWateringAt,
      imageUri: imageUri ?? null,
    });

    if (added) {
      await scheduleWateringNotification(identifiedPlant.name, new Date(nextWateringAt));
      router.replace("/(main)");
    } else {
      showErrorToast(t("common.error"), t("common.unknownError"));
    }
  };

  return (
    <SafeAreaView edges={["top", "bottom"]} className="flex-1 bg-slate-50">
      <View className="flex-1 p-6">
        <View className="rounded-2xl bg-emerald-50 p-6 shadow-sm border border-emerald-100">
          <Text className="text-2xl font-bold text-slate-800">{identifiedPlant.name}</Text>
          <Text className="mt-1 text-base text-slate-500 italic">{identifiedPlant.scientificName}</Text>
        </View>

        <View className="mt-10 items-center">
          <View className="bg-blue-50 p-4 rounded-full mb-4">
            {/* @ts-ignore */}
            <Droplet color="#3b82f6" size={32} />
          </View>
          <Text className="text-xl font-bold text-slate-800 text-center">
            {t('setup.title')}
          </Text>
          <Text className="text-center text-slate-500 mt-2 px-4">
            {t('setup.subtitle', { days: wateringFrequencyDays })}
          </Text>
        </View>

        <TouchableOpacity
          className="mt-6 rounded-2xl border-2 border-blue-200 bg-white p-5 flex-row justify-between items-center shadow-sm"
          onPress={() => setShowPicker(true)}
        >
          <Text className="text-slate-500 font-medium text-lg">{t('setup.lastWateredLabel')}</Text>
          <Text className="text-blue-600 font-bold text-lg">{lastWateredAt.toLocaleDateString("pt-BR")}</Text>
        </TouchableOpacity>

        {showPicker && (
          <DateTimePicker
            value={lastWateredAt}
            mode="date"
            display={Platform.OS === "ios" ? "spinner" : "default"}
            onChange={onDateChange}
          />
        )}

        <View className="flex-1 justify-end pb-4">
          <TouchableOpacity
            className="rounded-2xl bg-blue-600 p-5 shadow-lg"
            onPress={() => void savePlant()}
          >
            <Text className="text-center text-lg font-bold text-white">
              {t('setup.saveBtn')}
            </Text>
          </TouchableOpacity>
        </View>
      </View>
    </SafeAreaView>
  );
}
