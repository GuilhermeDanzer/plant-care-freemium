import DateTimePicker, {
  DateTimePickerEvent,
} from "@react-native-community/datetimepicker";
import { useLocalSearchParams, useRouter } from "expo-router";
import { useMemo, useState } from "react";
import { Platform, Text, TouchableOpacity, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { usePlantStore } from "../../src/store/usePlantStore";
import { IdentifiedPlant } from "../../src/types/plant";
import {
  calculateNextWateringAt,
  mapWateringLevelToDays,
} from "../../src/utils/dateUtils";

const fallbackPlant: IdentifiedPlant = {
  name: "Planta Identificada",
  scientificName: "N/A",
  wateringLevel: 2,
};

const parseIdentifiedPlant = (raw: string | string[] | undefined): IdentifiedPlant => {
  if (!raw || Array.isArray(raw)) return fallbackPlant;

  try {
    return JSON.parse(raw) as IdentifiedPlant;
  } catch {
    return fallbackPlant;
  }
};

export default function SetupRoute() {
  const router = useRouter();
  const { identifiedPlant: rawIdentifiedPlant, imageUri } = useLocalSearchParams<{
    identifiedPlant?: string;
    imageUri?: string;
  }>();
  const identifiedPlant = parseIdentifiedPlant(rawIdentifiedPlant);
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
      router.replace("/(main)");
    }
  };

  return (
    <SafeAreaView edges={["top", "bottom"]} className="flex-1 bg-slate-50">
      <View className="flex-1 p-6">
        <View className="rounded-2xl bg-emerald-50 p-4">
          <Text className="text-xl font-bold text-slate-800">{identifiedPlant.name}</Text>
          <Text className="mt-1 text-sm text-slate-500">{identifiedPlant.scientificName}</Text>
        </View>

        <Text className="mt-8 text-base font-semibold text-slate-700">
          Quando foi a última vez que você regou esta planta?
        </Text>

        <TouchableOpacity
          className="mt-3 rounded-xl border border-emerald-300 bg-white p-4"
          onPress={() => setShowPicker(true)}
        >
          <Text className="text-slate-700">{lastWateredAt.toLocaleDateString("pt-BR")}</Text>
        </TouchableOpacity>

        {showPicker && (
          <DateTimePicker
            value={lastWateredAt}
            mode="date"
            display={Platform.OS === "ios" ? "spinner" : "default"}
            onChange={onDateChange}
          />
        )}

        <TouchableOpacity
          className="mt-8 rounded-xl bg-emerald-600 p-4"
          onPress={() => void savePlant()}
        >
          <Text className="text-center text-base font-semibold text-white">Salvar planta</Text>
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  );
}
