import { Text, View } from "react-native";
import {
  DropletsIcon,
  LeafIcon,
  SproutIcon,
  SunIcon,
} from "@/components/icons";
import type { IconComponent } from "@/types/health";

const pickBulletIcon = (text: string): IconComponent => {
  const lowered = text.toLowerCase();
  if (/(água|agua|water|rega|molha|umid|hidra)/.test(lowered)) return DropletsIcon;
  if (/(luz|sol\b|sun|ilumin|shade|sombra)/.test(lowered)) return SunIcon;
  if (/(solo|soil|nutrient|adub|fertil|repot|vaso|drena)/.test(lowered)) return SproutIcon;
  return LeafIcon;
};

export interface BulletSectionProps {
  icon: IconComponent;
  tint: string;
  label: string;
  items: string[];
}

/**
 * Presentational list of bullet items (title + icon per row). Generic enough to
 * be reused for treatment steps, natural care tips, etc.
 */
export function BulletSection({
  icon: SectionIcon,
  tint,
  label,
  items,
}: BulletSectionProps) {
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
