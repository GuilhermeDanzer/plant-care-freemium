import React, { useRef, useState } from "react";
import { Animated, TouchableOpacity, View, Text } from "react-native";
import * as Haptics from "expo-haptics";
import { useTranslation } from "react-i18next";
import { DropletAnimation } from "./DropletAnimation";
import { DropletIcon } from "./icons";
import { shadowLayering } from "../utils/shadows";
import { usePlantStore } from "../store/usePlantStore";
import { showSuccessToast } from "../utils/showToasts";

interface WateringButtonProps {
  plantId: string;
  wateringFreqDays: number;
  quantity?: number;
}

export function WateringButton({ plantId, wateringFreqDays, quantity = 24 }: WateringButtonProps) {
  const { t } = useTranslation();
  const waterPlant = usePlantStore((s) => s.waterPlant);

  const [isWatering, setIsWatering] = useState(false);
  const wateringScale = useRef(new Animated.Value(1)).current;
  const animationResolveRef = useRef<(() => void) | null>(null);

  const handleWater = async () => {
    if (isWatering) return;
    setIsWatering(true);

    void Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium).catch(() => {});

    Animated.sequence([
      Animated.timing(wateringScale, {
        toValue: 0.96,
        duration: 90,
        useNativeDriver: true,
      }),
      Animated.spring(wateringScale, {
        toValue: 1,
        useNativeDriver: true,
        friction: 4,
      }),
    ]).start();

    try {
      await Promise.all([
        waterPlant(plantId),
        new Promise<void>((resolve) => {
          animationResolveRef.current = resolve;
        }),
      ]);
      showSuccessToast(
        t("plantDetail.toastWateredTitle"),
        t("plantDetail.toastWateredBody", { count: wateringFreqDays })
      );
    } finally {
      setIsWatering(false);
    }
  };

  return (
    <Animated.View style={{ transform: [{ scale: wateringScale }] }} className="mt-4">
      <TouchableOpacity
        activeOpacity={0.9}
        onPress={() => void handleWater()}
        disabled={isWatering}
        className={`rounded-2xl p-5 overflow-hidden ${
          isWatering ? "bg-blue-500" : "bg-emerald-600"
        }`}
        style={shadowLayering.core}
      >
        <DropletAnimation
          isAnimating={isWatering}
          quantity={quantity}
          onAnimationComplete={() => {
            if (animationResolveRef.current) {
              animationResolveRef.current();
              animationResolveRef.current = null;
            }
          }}
        />

        <View className="flex-row items-center justify-center gap-2" style={{ zIndex: 1 }}>
          <DropletIcon color="#ffffff" size={18} />
          <Text className="text-center text-base font-bold tracking-tight text-white">
            {isWatering ? "Registrando..." : "Já reguei"}
          </Text>
        </View>
      </TouchableOpacity>
    </Animated.View>
  );
}
