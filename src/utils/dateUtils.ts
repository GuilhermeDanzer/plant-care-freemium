import { WateringLevel } from "../types/plant";
import i18n from "../i18n";

const WATERING_LEVEL_TO_DAYS: Record<WateringLevel, number> = {
  1: 10,
  2: 5,
  3: 2,
};

export const mapWateringLevelToDays = (level: WateringLevel): number => {
  return WATERING_LEVEL_TO_DAYS[level];
};

export const calculateNextWateringAt = (
  lastWateredAtIso: string,
  wateringFrequencyDays: number
): string => {
  const nextDate = new Date(lastWateredAtIso);
  nextDate.setDate(nextDate.getDate() + wateringFrequencyDays);
  return nextDate.toISOString();
};

export const getWateringCountdownLabel = (nextWateringAtIso: string): string => {
  const today = new Date();
  const nextWateringDate = new Date(nextWateringAtIso);

  const todayUtc = Date.UTC(today.getFullYear(), today.getMonth(), today.getDate());
  const nextUtc = Date.UTC(
    nextWateringDate.getFullYear(),
    nextWateringDate.getMonth(),
    nextWateringDate.getDate()
  );
  const diffDays = Math.ceil((nextUtc - todayUtc) / (1000 * 60 * 60 * 24));

  if (diffDays <= 0) {
    return i18n.t("dateUtils.waterToday");
  }

  return i18n.t("dateUtils.waterInDays", { count: diffDays });
};

export interface WateringCountdownDetail {
  diffDays: number;
  isOverdue: boolean;
  isToday: boolean;
  label: string;
  helper: string;
}

export const getWateringCountdownDetail = (
  nextWateringAtIso: string
): WateringCountdownDetail => {
  const today = new Date();
  const nextWateringDate = new Date(nextWateringAtIso);

  const todayUtc = Date.UTC(today.getFullYear(), today.getMonth(), today.getDate());
  const nextUtc = Date.UTC(
    nextWateringDate.getFullYear(),
    nextWateringDate.getMonth(),
    nextWateringDate.getDate()
  );
  const diffDays = Math.round((nextUtc - todayUtc) / (1000 * 60 * 60 * 24));

  if (diffDays < 0) {
    return {
      diffDays,
      isOverdue: true,
      isToday: false,
      label: i18n.t("dateUtils.overdueDays", { count: Math.abs(diffDays) }),
      helper: i18n.t("dateUtils.overdueHelper"),
    };
  }

  if (diffDays === 0) {
    return {
      diffDays,
      isOverdue: false,
      isToday: true,
      label: i18n.t("dateUtils.waterTodayNormal"),
      helper: i18n.t("dateUtils.waterTodayHelper"),
    };
  }

  return {
    diffDays,
    isOverdue: false,
    isToday: false,
    label: i18n.t("dateUtils.inDays", { count: diffDays }),
    helper: i18n.t("dateUtils.inDaysHelper"),
  };
};

export const formatFriendlyDate = (iso: string | null | undefined): string => {
  if (!iso) return "—";
  const date = new Date(iso);
  const locale = i18n.language === "pt-BR" ? "pt-BR" : "en-US";
  return date.toLocaleDateString(locale, {
    day: "2-digit",
    month: "short",
    year: "numeric",
  });
};

export const getDaysSince = (iso: string): number => {
  const today = new Date();
  const target = new Date(iso);
  const todayUtc = Date.UTC(today.getFullYear(), today.getMonth(), today.getDate());
  const targetUtc = Date.UTC(
    target.getFullYear(),
    target.getMonth(),
    target.getDate()
  );
  return Math.max(0, Math.round((todayUtc - targetUtc) / (1000 * 60 * 60 * 24)));
};
