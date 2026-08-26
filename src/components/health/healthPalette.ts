import type { TFunction } from "i18next";
import { AlertIcon, HeartIcon, SparklesIcon } from "@/components/icons";
import type { HealthState, StatePalette } from "@/types/health";

/**
 * Maps each health state to its visual palette (colors, background classes,
 * eyebrow/title/subtitle labels and the state icon). Kept as a pure function so
 * the card component itself stays presentational.
 */
export const getStatePalette = (
  t: TFunction
): Record<HealthState, StatePalette> => ({
  perfect: {
    tint: "#10b981",
    trackTint: "#d1fae5",
    bg: "bg-emerald-50",
    eyebrow: "text-emerald-700",
    eyebrowLabel: t("health.perfectEyebrow"),
    title: t("health.perfectTitle"),
    subtitle: t("health.perfectSubtitle"),
    icon: HeartIcon,
  },
  optimization: {
    tint: "#d97706",
    trackTint: "#fde68a",
    bg: "bg-amber-50",
    eyebrow: "text-amber-700",
    eyebrowLabel: t("health.optEyebrow"),
    title: t("health.optTitle"),
    subtitle: t("health.optSubtitle"),
    icon: SparklesIcon,
  },
  critical: {
    tint: "#e11d48",
    trackTint: "#fecdd3",
    bg: "bg-rose-50",
    eyebrow: "text-rose-700",
    eyebrowLabel: t("health.criticalEyebrow"),
    title: t("health.criticalTitle"),
    subtitle: t("health.criticalSubtitle"),
    icon: AlertIcon,
  },
});
