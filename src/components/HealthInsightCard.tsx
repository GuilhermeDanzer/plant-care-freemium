import { type ComponentType } from "react";
import {
  Droplets,
  Leaf,
  ShieldCheck,
  Sparkles,
  Sprout,
  Sun,
} from "lucide-react-native";
import { Text, View } from "react-native";
import { DiseaseSuggestion } from "../types/plant";
import { shadowLayering } from "../utils/shadows";

type IconComponent = ComponentType<{ color?: string; size?: number }>;

const DropletsIcon = Droplets as unknown as IconComponent;
const LeafIcon = Leaf as unknown as IconComponent;
const ShieldIcon = ShieldCheck as unknown as IconComponent;
const SparklesIcon = Sparkles as unknown as IconComponent;
const SproutIcon = Sprout as unknown as IconComponent;
const SunIcon = Sun as unknown as IconComponent;

const pickBulletIcon = (text: string): IconComponent => {
  const t = text.toLowerCase();
  if (/(água|agua|water|rega|molha|umid|hidra)/.test(t)) return DropletsIcon;
  if (/(luz|sol\b|sun|ilumin|shade|sombra)/.test(t)) return SunIcon;
  if (/(solo|soil|nutrient|adub|fertil|repot|vaso|drena)/.test(t)) return SproutIcon;
  return LeafIcon;
};

export type InsightTone = "optimization" | "critical";

const TONE: Record<
  InsightTone,
  {
    chipBg: string;
    chipText: string;
    eyebrow: string;
    label: string;
    sectionTint: string;
  }
> = {
  optimization: {
    chipBg: "bg-amber-50",
    chipText: "text-amber-700",
    eyebrow: "text-amber-700",
    label: "Oportunidade de melhoria",
    sectionTint: "#d97706",
  },
  critical: {
    chipBg: "bg-rose-50",
    chipText: "text-rose-700",
    eyebrow: "text-rose-700",
    label: "Doença detectada",
    sectionTint: "#e11d48",
  },
};

interface BulletRow {
  text: string;
  kind: "prevention" | "biological";
}

const buildBullets = (suggestion: DiseaseSuggestion): BulletRow[] => {
  const prevention = suggestion.details?.treatment?.prevention ?? [];
  const biological = suggestion.details?.treatment?.biological ?? [];
  return [
    ...prevention.slice(0, 4).map((text) => ({
      text,
      kind: "prevention" as const,
    })),
    ...biological.slice(0, 4).map((text) => ({
      text,
      kind: "biological" as const,
    })),
  ];
};

export interface HealthInsightCardProps {
  suggestion: DiseaseSuggestion;
  tone?: InsightTone;
}

export function HealthInsightCard({
  suggestion,
  tone = "optimization",
}: HealthInsightCardProps) {
  const palette = TONE[tone];
  const probability = Math.round(Number(suggestion.probability ?? 0) * 100);
  const title =
    suggestion.details?.local_name ?? suggestion.name ?? "Possível causa";
  const description = suggestion.details?.description?.trim();
  const cause = suggestion.details?.cause?.trim();
  const bullets = buildBullets(suggestion);

  return (
    <View style={shadowLayering.cast}>
      <View
        className="rounded-[24px] border border-slate-100 bg-white p-5"
        style={shadowLayering.core}
      >
        {/* Header */}
        <View className="flex-row items-start justify-between">
          <View className="flex-1 pr-3">
            <Text
              className={`text-[10px] font-semibold uppercase tracking-[2px] ${palette.eyebrow}`}
            >
              {palette.label}
            </Text>
            <Text className="mt-1 text-base font-bold tracking-tight text-slate-900">
              {title}
            </Text>
            {cause ? (
              <Text
                className="mt-1 text-xs text-slate-500"
                numberOfLines={2}
              >
                Causa provável: {cause}
              </Text>
            ) : null}
          </View>

          <View className={`rounded-full ${palette.chipBg} px-3 py-1`}>
            <Text
              className={`text-[11px] font-bold tracking-tight ${palette.chipText}`}
            >
              {probability}%
            </Text>
          </View>
        </View>

        {description ? (
          <Text
            className="mt-3 text-sm leading-5 text-slate-600"
            numberOfLines={4}
          >
            {description}
          </Text>
        ) : null}

        {bullets.length > 0 ? (
          <View className="mt-4 gap-3">
            <BulletSection
              icon={ShieldIcon}
              tint="#059669"
              label="Ações imediatas"
              items={bullets.filter((b) => b.kind === "prevention").map((b) => b.text)}
            />
            <BulletSection
              icon={SparklesIcon}
              tint="#0ea5e9"
              label="Cuidados naturais"
              items={bullets
                .filter((b) => b.kind === "biological")
                .map((b) => b.text)}
            />
          </View>
        ) : null}
      </View>
    </View>
  );
}

interface BulletSectionProps {
  icon: IconComponent;
  tint: string;
  label: string;
  items: string[];
}

function BulletSection({ icon: SectionIcon, tint, label, items }: BulletSectionProps) {
  if (items.length === 0) return null;

  return (
    <View className="rounded-2xl border border-slate-100 bg-slate-50/60 p-3">
      <View className="flex-row items-center">
        <View
          className="mr-2 items-center justify-center rounded-full"
          style={{
            height: 22,
            width: 22,
            backgroundColor: `${tint}14`,
          }}
        >
          <SectionIcon color={tint} size={12} />
        </View>
        <Text className="text-[11px] font-semibold uppercase tracking-widest text-slate-500">
          {label}
        </Text>
      </View>

      <View className="mt-2 gap-2">
        {items.map((text, idx) => {
          const BulletIcon = pickBulletIcon(text);
          return (
            <View key={`${label}-${idx}`} className="flex-row items-start">
              <View
                className="mr-2.5 mt-0.5 items-center justify-center rounded-full"
                style={{
                  height: 22,
                  width: 22,
                  backgroundColor: `${tint}12`,
                }}
              >
                <BulletIcon color={tint} size={12} />
              </View>
              <Text className="flex-1 text-sm leading-5 text-slate-700">
                {text}
              </Text>
            </View>
          );
        })}
      </View>
    </View>
  );
}
