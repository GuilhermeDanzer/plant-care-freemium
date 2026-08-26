import { useEffect, useRef } from "react";
import { Animated } from "react-native";
import type { FadeInProps } from "@/types/health";

/**
 * Generic animation wrapper: fade-in + slide-up. Reusable for any card or row
 * that should enter the screen smoothly.
 */
export function FadeIn({ delay = 0, children }: FadeInProps) {
  const opacity = useRef(new Animated.Value(0)).current;
  const translateY = useRef(new Animated.Value(10)).current;

  useEffect(() => {
    Animated.parallel([
      Animated.timing(opacity, {
        toValue: 1,
        duration: 380,
        delay,
        useNativeDriver: true,
      }),
      Animated.timing(translateY, {
        toValue: 0,
        duration: 380,
        delay,
        useNativeDriver: true,
      }),
    ]).start();
  }, [delay, opacity, translateY]);

  return (
    <Animated.View style={{ opacity, transform: [{ translateY }] }}>
      {children}
    </Animated.View>
  );
}
