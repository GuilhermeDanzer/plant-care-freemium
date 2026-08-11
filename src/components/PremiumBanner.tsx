import { BlurView } from "expo-blur";
import { LinearGradient } from "expo-linear-gradient";
import { type ComponentType } from "react";
import { useTranslation } from "react-i18next";
import { ChevronRight, Gem } from "lucide-react-native";
import { Pressable, StyleSheet, Text, View } from "react-native";
import { shadowCastEmerald } from "../utils/shadows";

const GemIcon = Gem as unknown as ComponentType<{
  color?: string;
  size?: number;
  strokeWidth?: number;
}>;
const ChevronIcon = ChevronRight as unknown as ComponentType<{ color?: string; size?: number }>;

export interface PremiumBannerProps {
  title?: string;
  subtitle?: string;
  onPress: () => void;
}

export function PremiumBanner({
  title,
  subtitle,
  onPress,
}: PremiumBannerProps) {
  const { t } = useTranslation();
  
  const displayTitle = title ?? t("components.premiumTitle");
  const displaySubtitle = subtitle ?? t("components.premiumSubtitle");
  return (
    <Pressable onPress={onPress} style={shadowCastEmerald}>
      <LinearGradient
        colors={["#022c22", "#064e3b", "#0f766e"]}
        locations={[0, 0.55, 1]}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={styles.gradient}
      >
        {/* Realce sutil no topo para dar a sensação "vidro fosco" */}
        <LinearGradient
          colors={["rgba(255,255,255,0.12)", "rgba(255,255,255,0)"]}
          start={{ x: 0, y: 0 }}
          end={{ x: 0, y: 1 }}
          style={StyleSheet.absoluteFill}
        />

        <View className="flex-row items-center px-5 py-4">
          <View style={styles.iconShell}>
            <BlurView intensity={24} tint="dark" style={StyleSheet.absoluteFill} />
            <GemIcon color="#ffffff" size={18} strokeWidth={1.4} />
          </View>

          <View className="flex-1 pr-3">
            <Text className="text-[11px] font-semibold uppercase tracking-[3px] text-emerald-200/80">
              {t("components.premiumBadge")}
            </Text>
            <Text className="mt-0.5 text-base font-bold tracking-tight text-white">
              {displayTitle}
            </Text>
            <Text className="mt-0.5 text-xs text-emerald-50/80">
              {displaySubtitle}
            </Text>
          </View>

          <ChevronIcon color="#ffffff" size={18} />
        </View>
      </LinearGradient>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  gradient: {
    borderRadius: 22,
    overflow: "hidden",
  },
  iconShell: {
    height: 40,
    width: 40,
    marginRight: 14,
    borderRadius: 999,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: "rgba(255,255,255,0.35)",
    alignItems: "center",
    justifyContent: "center",
    overflow: "hidden",
    backgroundColor: "rgba(255,255,255,0.08)",
  },
});
