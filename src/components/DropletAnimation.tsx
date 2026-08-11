import React, { useEffect, useMemo, useRef } from "react";
import { Animated, StyleSheet, View } from "react-native";

export interface DropletAnimationProps {
  /** Trigger the animation when set to true */
  isAnimating: boolean;
  /** Number of droplets to render */
  quantity?: number;
  /** Callback fired when the entire staggered animation completes */
  onAnimationComplete?: () => void;
}

const DROPLET_COLORS = ["#93c5fd", "#bfdbfe", "#60a5fa", "#3b82f6"];

export function DropletAnimation({
  isAnimating,
  quantity = 7,
  onAnimationComplete,
}: DropletAnimationProps) {
  // Keep an array of Animated Values based on quantity. 
  // We use useMemo to create them so they scale properly.
  const anims = useMemo(
    () => Array.from({ length: quantity }, () => new Animated.Value(0)),
    [quantity]
  );

  // Generate random properties (positions, sizes, colors) once per quantity change
  const droplets = useMemo(() => {
    return Array.from({ length: quantity }, (_, i) => {
      // Avoid placing them too close to the edges (between 10% and 90%)
      const left = Math.floor(Math.random() * 80) + 10;
      // Size between 10 and 18
      const size = Math.floor(Math.random() * 8) + 10;
      const color =
        DROPLET_COLORS[Math.floor(Math.random() * DROPLET_COLORS.length)];
      // Random animation duration between 500ms and 800ms
      const duration = Math.floor(Math.random() * 300) + 500;

      return { id: i, left: `${left}%`, size, color, duration };
    });
  }, [quantity]);

  const onCompleteRef = useRef(onAnimationComplete);
  onCompleteRef.current = onAnimationComplete;

  useEffect(() => {
    if (isAnimating) {
      // Reset all animations
      anims.forEach((anim) => anim.setValue(0));

      const animations = droplets.map((drop, index) =>
        Animated.timing(anims[index], {
          toValue: 1,
          duration: drop.duration,
          useNativeDriver: true,
        })
      );

      Animated.stagger(100, animations).start(({ finished }) => {
        if (finished) {
          onCompleteRef.current?.();
        }
      });
    }
  }, [isAnimating, anims, droplets]);

  const createDropletStyle = (anim: Animated.Value) => {
    return {
      opacity: anim.interpolate({
        inputRange: [0, 0.1, 0.8, 1],
        outputRange: [0, 1, 1, 0],
      }),
      transform: [
        { translateY: anim.interpolate({ inputRange: [0, 1], outputRange: [0, 60] }) },
        { scaleY: anim.interpolate({ inputRange: [0, 0.5, 1], outputRange: [0.8, 1.5, 2] }) },
        { scaleX: anim.interpolate({ inputRange: [0, 0.5, 1], outputRange: [1, 0.8, 0.4] }) },
      ],
    };
  };

  return (
    <View
      style={[StyleSheet.absoluteFill, { overflow: "hidden", zIndex: 0 }]}
      pointerEvents="none"
    >
      {droplets.map((drop, i) => (
        <Animated.View
          key={drop.id}
          style={[
            createDropletStyle(anims[i]),
            {
              position: "absolute",
              top: -20,
              left: drop.left as any, // React Native accepts string percentages
              width: drop.size,
              height: drop.size,
              borderRadius: drop.size / 2,
              backgroundColor: drop.color,
            },
          ]}
        />
      ))}
    </View>
  );
}
