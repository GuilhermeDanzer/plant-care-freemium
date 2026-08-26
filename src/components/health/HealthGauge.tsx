import { useTranslation } from "react-i18next";
import { StyleSheet, Text, View } from "react-native";
import Svg, { Circle } from "react-native-svg";
import type { HealthGaugeProps } from "@/types/health";

/**
 * Circular SVG gauge that renders a 0-100 health score with the state palette.
 * Presentational only - no business logic.
 */
export function HealthGauge({ score, palette }: HealthGaugeProps) {
  const { t } = useTranslation();
  const size = 96;
  const stroke = 9;
  const radius = (size - stroke) / 2;
  const circumference = 2 * Math.PI * radius;
  const clamped = Math.max(0, Math.min(100, score));
  const dashOffset = circumference * (1 - clamped / 100);

  return (
    <View
      style={{ width: size, height: size }}
      className="items-center justify-center"
    >
      <Svg width={size} height={size} style={StyleSheet.absoluteFill}>
        <Circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          stroke={palette.trackTint}
          strokeWidth={stroke}
          fill="none"
        />
        <Circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          stroke={palette.tint}
          strokeWidth={stroke}
          fill="none"
          strokeDasharray={`${circumference} ${circumference}`}
          strokeDashoffset={dashOffset}
          strokeLinecap="round"
          transform={`rotate(-90 ${size / 2} ${size / 2})`}
        />
      </Svg>
      <Text className="text-[26px] font-bold leading-none tracking-tight text-slate-900">
        {clamped}
      </Text>
      <Text className="mt-0.5 text-[9px] font-semibold uppercase tracking-widest text-slate-400">
        {t("health.healthLabel")}
      </Text>
    </View>
  );
}
