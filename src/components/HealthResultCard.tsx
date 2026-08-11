import { type ComponentType, useEffect, useRef } from "react";
import { useTranslation } from "react-i18next";
import {
  AlertTriangle,
  Droplets,
  Heart,
  Sparkles,
  Sprout,
  Sun,
} from "lucide-react-native";
import {
  Animated,
  LayoutAnimation,
  Platform,
  StyleSheet,
  Text,
  UIManager,
  View,
} from "react-native";
import Svg, { Circle } from "react-native-svg";
import {
  DiseaseSuggestion,
  HealthAssessmentResponse,
} from "../types/plant";
import { formatFriendlyDate } from "../utils/dateUtils";
import { shadowLayering } from "../utils/shadows";
import { HealthInsightCard, type InsightTone } from "./HealthInsightCard";

type IconComponent = ComponentType<{ color?: string; size?: number }>;

const HeartIcon = Heart as unknown as IconComponent;
const AlertIcon = AlertTriangle as unknown as IconComponent;
const SparklesIcon = Sparkles as unknown as IconComponent;
const DropletsIcon = Droplets as unknown as IconComponent;
const SproutIcon = Sprout as unknown as IconComponent;
const SunIcon = Sun as unknown as IconComponent;

if (
  Platform.OS === "android" &&
  UIManager.setLayoutAnimationEnabledExperimental
) {
  UIManager.setLayoutAnimationEnabledExperimental(true);
}

/* -------------------------------------------------------------------------- */
/*  Interpretação do payload                                                  */
/* -------------------------------------------------------------------------- */

// Threshold usado para DECIDIR o estado (perfect vs optimization).
const DECISION_THRESHOLD = 0.15;
// Threshold usado para EXIBIR cards (mais permissivo — mesmo sugestões fracas
// são úteis para um usuário Premium que quer chegar aos 100%).
const DISPLAY_THRESHOLD = 0.05;
const PERFECT_SCORE_THRESHOLD = 90;

export type HealthState = "perfect" | "optimization" | "critical";

interface InterpretedHealth {
  state: HealthState;
  score: number;
  relevantSuggestions: DiseaseSuggestion[];
  hadSuggestions: boolean;
}

const interpretResponse = (
  response: HealthAssessmentResponse
): InterpretedHealth => {
  const result = response.result;
  const isHealthyBinary = Boolean(result.is_healthy.binary);
  const score = Math.round(Number(result.is_healthy.probability ?? 0) * 100);

  const suggestions = result.disease?.suggestions ?? [];
  const hadSuggestions = suggestions.length > 0;
  const sorted = [...suggestions].sort(
    (a, b) => Number(b.probability ?? 0) - Number(a.probability ?? 0)
  );

  const decisionRelevant = sorted.filter(
    (s) => Number(s.probability ?? 0) > DECISION_THRESHOLD
  );
  const displayRelevant = sorted
    .filter((s) => Number(s.probability ?? 0) > DISPLAY_THRESHOLD)
    .slice(0, 4);

  if (!isHealthyBinary) {
    return {
      state: "critical",
      score,
      relevantSuggestions: displayRelevant,
      hadSuggestions,
    };
  }

  if (score > PERFECT_SCORE_THRESHOLD && decisionRelevant.length === 0) {
    return {
      state: "perfect",
      score,
      relevantSuggestions: [],
      hadSuggestions,
    };
  }

  return {
    state: "optimization",
    score,
    relevantSuggestions: displayRelevant,
    hadSuggestions,
  };
};

/* -------------------------------------------------------------------------- */
/*  Paleta por estado                                                         */
/* -------------------------------------------------------------------------- */

interface StatePalette {
  tint: string;
  trackTint: string;
  bg: string;
  eyebrow: string;
  eyebrowLabel: string;
  title: string;
  subtitle: string;
  icon: IconComponent;
}

const getStatePalette = (t: any): Record<HealthState, StatePalette> => ({
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

/* -------------------------------------------------------------------------- */
/*  Health Gauge (SVG)                                                         */
/* -------------------------------------------------------------------------- */

interface HealthGaugeProps {
  score: number;
  palette: StatePalette;
  t: any;
}

function HealthGauge({ score, palette, t }: HealthGaugeProps) {
  const size = 96;
  const stroke = 9;
  const radius = (size - stroke) / 2;
  const circumference = 2 * Math.PI * radius;
  const clamped = Math.max(0, Math.min(100, score));
  const dashOffset = circumference * (1 - clamped / 100);

  return (
    <View style={{ width: size, height: size }} className="items-center justify-center">
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

/* -------------------------------------------------------------------------- */
/*  Fade-in wrapper                                                            */
/* -------------------------------------------------------------------------- */

interface FadeInProps {
  delay?: number;
  children: React.ReactNode;
}

function FadeIn({ delay = 0, children }: FadeInProps) {
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

/* -------------------------------------------------------------------------- */
/*  Card principal                                                             */
/* -------------------------------------------------------------------------- */

export interface HealthResultCardProps {
  response: HealthAssessmentResponse;
  lastCheckedAt: string | null;
}

export function HealthResultCard({
  response,
  lastCheckedAt,
}: HealthResultCardProps) {
  const { t } = useTranslation();
  const result = response?.result;

  // Fallback defensivo: payload malformado ou legado chegou até aqui.
  useEffect(() => {
    LayoutAnimation.configureNext(LayoutAnimation.Presets.easeInEaseOut);
  }, [response]);

  if (!result || !result.is_healthy) {
    return (
      <View style={shadowLayering.cast}>
        <View
          className="rounded-[28px] border border-slate-100 bg-white p-5"
          style={shadowLayering.core}
        >
          <Text className="text-center text-sm text-slate-500">
            {t("health.noDataTitle")}
          </Text>
          <Text className="mt-2 text-center text-xs text-slate-400">
            {t("health.noDataSubtitle")}
          </Text>
        </View>
      </View>
    );
  }

  const { state, score, relevantSuggestions, hadSuggestions } =
    interpretResponse(response);
  const STATE_PALETTE = getStatePalette(t);
  const palette = STATE_PALETTE[state];
  const insightTone: InsightTone =
    state === "critical" ? "critical" : "optimization";

  const showInsights = relevantSuggestions.length > 0;
  const showGeneralTips = !showInsights && state !== "perfect";

  return (
    <View className="gap-3">
      {/* HERO — Gauge + estado */}
      <FadeIn>
        <View style={shadowLayering.cast}>
          <View
            className="rounded-[28px] border border-slate-100 bg-white p-5"
            style={shadowLayering.core}
          >
            <View className="flex-row items-center">
              <HealthGauge score={score} palette={palette} t={t} />

              <View className="ml-5 flex-1">
                <View className="flex-row items-center">
                  <View className={`rounded-full ${palette.bg} p-2`}>
                    <palette.icon color={palette.tint} size={14} />
                  </View>
                  <Text
                    className={`ml-2 text-[10px] font-semibold uppercase tracking-[2px] ${palette.eyebrow}`}
                  >
                    {palette.eyebrowLabel}
                  </Text>
                </View>

                <Text className="mt-2 text-base font-bold tracking-tight text-slate-900">
                  {palette.title}
                </Text>
                <Text className="mt-1 text-xs leading-4 text-slate-500">
                  {palette.subtitle}
                </Text>
              </View>
            </View>
          </View>
        </View>
      </FadeIn>

      {/* INSIGHTS — oportunidades / doenças */}
      {showInsights ? (
        <View className="gap-3">
          {relevantSuggestions.map((suggestion, idx) => (
            <FadeIn key={suggestion.id ?? idx} delay={120 + idx * 90}>
              <HealthInsightCard suggestion={suggestion} tone={insightTone} />
            </FadeIn>
          ))}
        </View>
      ) : null}

      {/* FALLBACK — dicas gerais quando API não devolveu sugestões fortes */}
      {showGeneralTips ? (
        <FadeIn delay={140}>
          <GeneralTipsCard
            palette={palette}
            score={score}
            hadNoisySuggestions={hadSuggestions}
            t={t}
          />
        </FadeIn>
      ) : null}

      <Text className="mt-1 text-[11px] text-slate-400">
        {t("health.lastChecked", { date: formatFriendlyDate(lastCheckedAt) })}
      </Text>
    </View>
  );
}

/* -------------------------------------------------------------------------- */
/*  General tips — quando API não devolveu sugestões acionáveis               */
/* -------------------------------------------------------------------------- */

const getGeneralTips = (t: any): { icon: IconComponent; tint: string; title: string; body: string }[] => [
  {
    icon: DropletsIcon,
    tint: "#0ea5e9",
    title: t("health.tipsWaterTitle"),
    body: t("health.tipsWaterBody"),
  },
  {
    icon: SunIcon,
    tint: "#d97706",
    title: t("health.tipsLightTitle"),
    body: t("health.tipsLightBody"),
  },
  {
    icon: SproutIcon,
    tint: "#059669",
    title: t("health.tipsSoilTitle"),
    body: t("health.tipsSoilBody"),
  },
];

interface GeneralTipsCardProps {
  palette: StatePalette;
  score: number;
  hadNoisySuggestions: boolean;
  t: any;
}

function GeneralTipsCard({
  palette,
  score,
  hadNoisySuggestions,
  t,
}: GeneralTipsCardProps) {
  const headline =
    score >= 70
      ? t("health.tipsHeadlineGood")
      : t("health.tipsHeadlineGrow");

  const subline = hadNoisySuggestions
    ? t("health.tipsSublineNoisy")
    : t("health.tipsSublineClean");

  return (
    <View style={shadowLayering.cast}>
      <View
        className="rounded-[24px] border border-slate-100 bg-white p-5"
        style={shadowLayering.core}
      >
        <View className="flex-row items-start">
          <View className={`rounded-full ${palette.bg} p-2.5`}>
            <SparklesIcon color={palette.tint} size={16} />
          </View>
          <View className="ml-3 flex-1">
            <Text
              className={`text-[10px] font-semibold uppercase tracking-[2px] ${palette.eyebrow}`}
            >
              {t("health.checklistEyebrow")}
            </Text>
            <Text className="mt-1 text-base font-bold tracking-tight text-slate-900">
              {headline}
            </Text>
            <Text className="mt-1 text-xs leading-4 text-slate-500">
              {subline}
            </Text>
          </View>
        </View>

        <View className="mt-4 gap-3">
          {getGeneralTips(t).map((tip) => (
            <View
              key={tip.title}
              className="flex-row items-start rounded-2xl border border-slate-100 bg-slate-50/60 p-3"
            >
              <View
                className="mr-3 items-center justify-center rounded-full"
                style={{
                  height: 28,
                  width: 28,
                  backgroundColor: `${tip.tint}14`,
                }}
              >
                <tip.icon color={tip.tint} size={14} />
              </View>
              <View className="flex-1">
                <Text className="text-sm font-bold tracking-tight text-slate-900">
                  {tip.title}
                </Text>
                <Text className="mt-0.5 text-xs leading-4 text-slate-600">
                  {tip.body}
                </Text>
              </View>
            </View>
          ))}
        </View>
      </View>
    </View>
  );
}
