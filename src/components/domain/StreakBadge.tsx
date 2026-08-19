import { Flame } from "lucide-react-native";
import React, { useEffect } from "react";
import { Text, View } from "react-native";
import Animated, {
  useAnimatedStyle,
  useSharedValue,
  withSequence,
  withSpring,
} from "react-native-reanimated";
import { useTaskStore } from "@/store/useTaskStore";

export const StreakBadge = () => {
  const { careStreak } = useTaskStore();
  const scale = useSharedValue(1);

  useEffect(() => {
    // Trigger bounce effect whenever careStreak increases
    if (careStreak > 0) {
      scale.value = withSequence(
        withSpring(1.3, { damping: 2, stiffness: 150 }),
        withSpring(1, { damping: 4, stiffness: 100 })
      );
    }
  }, [careStreak, scale]);

  const animatedStyle = useAnimatedStyle(() => {
    return {
      transform: [{ scale: scale.value }],
    };
  });

  if (careStreak === 0) {
    return null; // or return a greyed-out badge
  }

  return (
    <Animated.View
      style={animatedStyle}
      className="flex-row items-center gap-1 rounded-full bg-orange-100 px-3 py-1"
    >
      <Flame color="#f97316" size={16} />
      <Text className="font-bold text-orange-500">{careStreak}</Text>
    </Animated.View>
  );
};
