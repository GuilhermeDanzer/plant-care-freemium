import { BlurView } from "expo-blur";
import { LinearGradient } from "expo-linear-gradient";
import { type ComponentType, useState } from "react";
import { Check, Gem, X } from "lucide-react-native";
import {
  ActivityIndicator,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { subscriptionService } from "../services/subscriptionService";
import { usePlantStore } from "../store/usePlantStore";
import { PREMIUM_MONTHLY_PRICE } from "../utils/constants";
import { shadowCastEmerald, shadowLayering } from "../utils/shadows";
import {
  showErrorToast,
  showInfoToast,
  showPremiumToast,
} from "../utils/showToasts";

const GemIcon = Gem as unknown as ComponentType<{
  color?: string;
  size?: number;
  strokeWidth?: number;
}>;
const CheckIcon = Check as unknown as ComponentType<{ color?: string; size?: number }>;
const CloseIcon = X as unknown as ComponentType<{ color?: string; size?: number }>;

const premiumBenefits = [
  "Plantas ilimitadas",
  "Guia de solo e luz por especialistas",
  "Histórico completo de cuidados",
  "Diagnóstico de saúde por IA",
];

export interface PaywallModalProps {
  onClose: () => void;
}

export function PaywallModal({ onClose }: PaywallModalProps) {
  const setPremium = usePlantStore((s) => s.setPremium);
  const [isPurchasing, setIsPurchasing] = useState(false);
  const [isRestoring, setIsRestoring] = useState(false);

  const priceLabel = PREMIUM_MONTHLY_PRICE;

  const handleSubscribe = async () => {
    if (isPurchasing) return;

    setIsPurchasing(true);
    try {
      const result = await subscriptionService.purchasePackage();
      if (result.isActive) {
        await setPremium(true);
        showPremiumToast(
          "Assinatura confirmada",
          "Bem-vindo ao PlantHelper Pro."
        );
        onClose();
      } else {
        showErrorToast("Falha na assinatura", "Tente novamente em instantes.");
      }
    } finally {
      setIsPurchasing(false);
    }
  };

  const handleRestore = async () => {
    if (isRestoring) return;
    setIsRestoring(true);
    try {
      const result = await subscriptionService.restorePurchases();
      if (result.isActive) {
        await setPremium(true);
        showPremiumToast(
          "Assinatura restaurada",
          "Acesso Premium reativado."
        );
        onClose();
      } else {
        showInfoToast("Nenhuma assinatura encontrada");
      }
    } finally {
      setIsRestoring(false);
    }
  };

  return (
    <SafeAreaView edges={["top", "bottom"]} className="flex-1 bg-[#f7f8f5]">
      <ScrollView
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        <View className="flex-row justify-end">
          <Pressable
            className="h-10 w-10 items-center justify-center rounded-full bg-white"
            style={shadowLayering.core}
            onPress={onClose}
          >
            <CloseIcon color="#0f172a" size={18} />
          </Pressable>
        </View>

        {/* HEADER — Glassmorphism diamond */}
        <View className="mt-8 items-center">
          <View style={shadowCastEmerald}>
            <LinearGradient
              colors={["#022c22", "#064e3b", "#0f766e"]}
              locations={[0, 0.55, 1]}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 1 }}
              style={styles.diamondRing}
            >
              <View style={styles.diamondInner}>
                <BlurView intensity={30} tint="dark" style={StyleSheet.absoluteFill} />
                <GemIcon color="#ffffff" size={34} strokeWidth={1.4} />
              </View>
            </LinearGradient>
          </View>

          <Text className="mt-3 text-xs font-semibold uppercase tracking-[3px] text-emerald-700">
            PlantHelper Pro
          </Text>
          <Text className="mt-3 text-center text-3xl font-bold tracking-tight text-slate-900">
            Sua selva, sem limites
          </Text>
          <Text className="mt-3 text-center text-base leading-6 text-slate-500">
            Desbloqueie uma experiência premium com mais espaço, contexto e cuidado.
          </Text>
        </View>

        {/* BENEFITS */}
        <View className="mt-10" style={shadowLayering.cast}>
          <View
            className="rounded-[28px] border border-slate-100 bg-white p-6"
            style={shadowLayering.core}
          >
            {premiumBenefits.map((benefit) => (
              <View key={benefit} className="mb-4 flex-row items-center">
                <View className="mr-3 rounded-full bg-emerald-50 p-2">
                  <CheckIcon color="#047857" size={14} />
                </View>
                <Text className="flex-1 text-base tracking-tight text-slate-700">
                  {benefit}
                </Text>
              </View>
            ))}
          </View>
        </View>

        {/* PRICE CARD — objeto de desejo */}
        <View className="mt-6" style={shadowCastEmerald}>
          <LinearGradient
            colors={["#022c22", "#064e3b", "#0f766e"]}
            locations={[0, 0.55, 1]}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
            style={styles.priceCard}
          >
            <LinearGradient
              colors={["rgba(255,255,255,0.14)", "rgba(255,255,255,0)"]}
              start={{ x: 0, y: 0 }}
              end={{ x: 0, y: 1 }}
              style={StyleSheet.absoluteFill}
            />

            <View className="flex-row items-start justify-between">
              <View>
                <Text className="text-[10px] font-semibold uppercase tracking-[3px] text-emerald-200/80">
                  Plano mensal
                </Text>
                <Text className="mt-2 text-[40px] font-bold leading-tight tracking-tight text-white">
                  {priceLabel}
                </Text>
                <Text className="mt-1 text-xs text-emerald-50/80">
                  Cancele quando quiser.
                </Text>
              </View>

              <View style={styles.priceSeal}>
                <GemIcon color="#ffffff" size={18} strokeWidth={1.4} />
              </View>
            </View>
          </LinearGradient>
        </View>

        {/* CTA */}
        <TouchableOpacity
          disabled={isPurchasing}
          onPress={() => void handleSubscribe()}
          className="mt-6 overflow-hidden rounded-2xl"
          activeOpacity={0.9}
          style={shadowCastEmerald}
        >
          <LinearGradient
            colors={["#064e3b", "#0f766e"]}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
            style={{ borderRadius: 16 }}
          >
            <View className="flex-row items-center justify-center gap-2 p-5">
              {isPurchasing ? <ActivityIndicator color="#ffffff" /> : null}
              <Text className="text-center text-base font-bold tracking-tight text-white">
                {isPurchasing ? "Processando..." : "Assinar agora"}
              </Text>
            </View>
          </LinearGradient>
        </TouchableOpacity>

        {/* RESTORE — discreto no rodapé */}
        <Pressable
          className="mt-4 items-center py-3"
          onPress={() => void handleRestore()}
          disabled={isRestoring}
        >
          <Text className="text-xs font-medium text-slate-500 underline">
            {isRestoring ? "Restaurando..." : "Restaurar compras"}
          </Text>
        </Pressable>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  scrollContent: {
    paddingHorizontal: 24,
    paddingTop: 16,
    paddingBottom: 32,
  },
  diamondRing: {
    height: 104,
    width: 104,
    borderRadius: 52,
    alignItems: "center",
    justifyContent: "center",
  },
  diamondInner: {
    height: 84,
    width: 84,
    borderRadius: 42,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: "rgba(255,255,255,0.5)",
    backgroundColor: "rgba(255,255,255,0.1)",
    alignItems: "center",
    justifyContent: "center",
    overflow: "hidden",
  },
  priceCard: {
    borderRadius: 26,
    overflow: "hidden",
    padding: 22,
  },
  priceSeal: {
    height: 38,
    width: 38,
    borderRadius: 999,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: "rgba(255,255,255,0.35)",
    backgroundColor: "rgba(255,255,255,0.1)",
    alignItems: "center",
    justifyContent: "center",
  },
});
