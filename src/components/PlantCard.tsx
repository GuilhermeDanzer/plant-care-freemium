import { memo, type ComponentType, useEffect, useRef } from "react";
import { Sprout, X } from "lucide-react-native";
import { Animated, Pressable, Text, View } from "react-native";
import { PlantRecord } from "@/types/plant";
import { getWateringCountdownLabel } from "@/utils/dateUtils";
import { getPlantDisplayName } from "@/utils/plantUtils";
import { shadowLayering } from "@/utils/shadows";

const SproutIcon = Sprout as unknown as ComponentType<{ color?: string; size?: number }>;
const CloseIcon = X as unknown as ComponentType<{ color?: string; size?: number }>;

export interface PlantCardProps {
  plant: PlantRecord;
  isEditing: boolean;
  onDelete: (plantId: string, plantName: string) => void;
  onPress?: (plantId: string) => void;
}

export const PlantCard = memo(function PlantCard({
  plant,
  isEditing,
  onDelete,
  onPress,
}: PlantCardProps) {
  const scale = useRef(new Animated.Value(1)).current;
  const opacity = useRef(new Animated.Value(1)).current;

  const displayName = getPlantDisplayName(plant);

  useEffect(() => {
    Animated.parallel([
      Animated.timing(scale, {
        toValue: isEditing ? 0.97 : 1,
        duration: 180,
        useNativeDriver: true,
      }),
      Animated.timing(opacity, {
        toValue: isEditing ? 0.9 : 1,
        duration: 180,
        useNativeDriver: true,
      }),
    ]).start();
  }, [isEditing, opacity, scale]);

  return (
    <View className="max-w-[50%] flex-1 p-2.5">
      {/* CAST shadow layer: sem background, só projeção */}
      <Animated.View
        style={[
          shadowLayering.cast,
          {
            opacity,
            transform: [{ scale }],
            borderRadius: 32,
          },
        ]}
      >
        {/* CORE shadow layer: com background, borda fina, sombra sutil */}
        <Pressable
          disabled={isEditing || !onPress}
          onPress={() => onPress?.(plant.id)}
          style={[shadowLayering.core, { borderRadius: 32, backgroundColor: "#ffffff" }]}
          className="relative aspect-square rounded-[32px] border border-slate-100 p-4 active:opacity-90"
        >
          {isEditing ? (
            <Pressable
              className="absolute right-2 top-2 z-10 h-7 w-7 items-center justify-center rounded-full bg-rose-500"
              onPress={() => onDelete(plant.id, displayName)}
            >
              <CloseIcon color="#ffffff" size={16} />
            </Pressable>
          ) : null}

          <View className="flex-1 items-center justify-between">
            <View className="items-center">
              <Text className="text-center text-base font-bold tracking-tight text-slate-800" numberOfLines={2}>
                {displayName}
              </Text>
              <Text className="mt-1 text-center text-[10px] text-slate-400" numberOfLines={1}>
                {plant.scientific_name}
              </Text>
            </View>

            <View className="rounded-full bg-emerald-50 p-3">
              <SproutIcon color="#10b981" size={30} />
            </View>

            <View className="overflow-hidden rounded-full bg-slate-50 px-3 py-1">
              <Text className="text-center text-[11px] text-slate-500">
                {getWateringCountdownLabel(plant.next_watering_at)}
              </Text>
            </View>
          </View>
        </Pressable>
      </Animated.View>
    </View>
  );
});
