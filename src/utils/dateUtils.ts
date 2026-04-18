import { WateringLevel } from "../types/plant";

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
    return "Regar HOJE";
  }

  return `Regar em ${diffDays} dia${diffDays > 1 ? "s" : ""}`;
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
      label: `Atrasado ${Math.abs(diffDays)} dia${Math.abs(diffDays) > 1 ? "s" : ""}`,
      helper: "Sua planta precisa de água agora",
    };
  }

  if (diffDays === 0) {
    return {
      diffDays,
      isOverdue: false,
      isToday: true,
      label: "Regar hoje",
      helper: "Dia de molhar as raízes",
    };
  }

  return {
    diffDays,
    isOverdue: false,
    isToday: false,
    label: `Em ${diffDays} dia${diffDays > 1 ? "s" : ""}`,
    helper: "Próxima rega programada",
  };
};

export const formatFriendlyDate = (iso: string | null | undefined): string => {
  if (!iso) return "—";
  const date = new Date(iso);
  return date.toLocaleDateString("pt-BR", {
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
