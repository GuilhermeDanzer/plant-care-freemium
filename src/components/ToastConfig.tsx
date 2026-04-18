import { type ComponentType } from "react";
import { AlertCircle, CheckCircle2, Crown, Info } from "lucide-react-native";
import { StyleSheet, Text, View } from "react-native";
import type { ToastConfig as RNToastConfig } from "react-native-toast-message";

type ToastIconComponent = ComponentType<{
  color?: string;
  size?: number;
  strokeWidth?: number;
}>;

const SuccessIcon = CheckCircle2 as unknown as ToastIconComponent;
const ErrorIcon = AlertCircle as unknown as ToastIconComponent;
const PremiumIcon = Crown as unknown as ToastIconComponent;
const InfoIcon = Info as unknown as ToastIconComponent;

interface PillProps {
  iconTint: string;
  borderClass: string;
  icon: ToastIconComponent;
  text1?: string;
  text2?: string;
}

/**
 * Pílula branca (~95% opaca) com borda sutil colorida por tipo e shadow-lg
 * camada única. Tipografia `tracking-tight` no título para alinhar ao resto
 * do app.
 */
function ToastPill({ iconTint, borderClass, icon: Icon, text1, text2 }: PillProps) {
  return (
    <View
      style={styles.shadow}
      className={`mx-5 flex-row items-center rounded-full border ${borderClass} bg-white/95 pl-3 pr-5 py-3`}
    >
      <View
        className="mr-3 items-center justify-center rounded-full"
        style={[styles.iconBubble, { backgroundColor: `${iconTint}14` }]}
      >
        <Icon color={iconTint} size={20} strokeWidth={2} />
      </View>
      <View className="flex-1">
        {text1 ? (
          <Text
            className="text-sm font-bold tracking-tight text-slate-900"
            numberOfLines={1}
          >
            {text1}
          </Text>
        ) : null}
        {text2 ? (
          <Text className="mt-0.5 text-xs text-slate-500" numberOfLines={2}>
            {text2}
          </Text>
        ) : null}
      </View>
    </View>
  );
}

export const toastConfig: RNToastConfig = {
  customSuccess: ({ text1, text2 }) => (
    <ToastPill
      icon={SuccessIcon}
      iconTint="#059669"
      borderClass="border-emerald-100"
      text1={text1}
      text2={text2}
    />
  ),
  customError: ({ text1, text2 }) => (
    <ToastPill
      icon={ErrorIcon}
      iconTint="#e11d48"
      borderClass="border-rose-100"
      text1={text1}
      text2={text2}
    />
  ),
  customPremium: ({ text1, text2 }) => (
    <ToastPill
      icon={PremiumIcon}
      iconTint="#d97706"
      borderClass="border-amber-200"
      text1={text1}
      text2={text2}
    />
  ),
  customInfo: ({ text1, text2 }) => (
    <ToastPill
      icon={InfoIcon}
      iconTint="#2563eb"
      borderClass="border-blue-100"
      text1={text1}
      text2={text2}
    />
  ),
};

const styles = StyleSheet.create({
  shadow: {
    shadowColor: "#0f172a",
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.16,
    shadowRadius: 18,
    elevation: 10,
  },
  iconBubble: {
    height: 32,
    width: 32,
  },
});
