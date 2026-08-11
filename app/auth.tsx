import { LinearGradient } from "expo-linear-gradient";
import { useLocalSearchParams, useRouter } from "expo-router";
import { ArrowLeft, Leaf, Lock, Mail } from "lucide-react-native";
import { type ComponentType, useState } from "react";
import { useTranslation } from "react-i18next";
import {
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { authService } from "../src/services/authService";
import { usePlantStore } from "../src/store/usePlantStore";
import {
  shadowCastEmerald,
  shadowLayering,
} from "../src/utils/shadows";
import {
  showErrorToast,
  showInfoToast,
  showSuccessToast,
} from "../src/utils/showToasts";

type Mode = "signIn" | "signUp";

const LeafIcon = Leaf as unknown as ComponentType<{
  color?: string;
  size?: number;
  strokeWidth?: number;
}>;
const MailIcon = Mail as unknown as ComponentType<{ color?: string; size?: number }>;
const LockIcon = Lock as unknown as ComponentType<{ color?: string; size?: number }>;
const BackIcon = ArrowLeft as unknown as ComponentType<{ color?: string; size?: number }>;

export default function AuthRoute() {
  const { t } = useTranslation();
  const router = useRouter();
  const params = useLocalSearchParams<{ returnTo?: string }>();
  const setUser = usePlantStore((s) => s.setUser);

  const [mode, setMode] = useState<Mode>("signIn");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  const isSignIn = mode === "signIn";
  const emailTrimmed = email.trim();
  const canSubmit =
    emailTrimmed.length > 0 && password.length >= 6 && !isSubmitting;

  const dismiss = () => {
    if (router.canGoBack()) {
      router.back();
    } else {
      router.replace("/");
    }
  };

  const handleSubmit = async () => {
    if (!canSubmit) return;
    setIsSubmitting(true);
    try {
      if (isSignIn) {
        const user = await authService.signIn({
          email: emailTrimmed,
          password,
        });
        setUser(user);
        showSuccessToast(t("auth.welcomeBackTitle"), user?.email ?? undefined);
        dismiss();
        return;
      }

      const user = await authService.signUp({
        email: emailTrimmed,
        password,
      });

      if (!user) {
        showInfoToast(
          t("auth.checkEmailTitle"),
          t("auth.checkEmailBody")
        );
        setMode("signIn");
        return;
      }

      setUser(user);
      showSuccessToast(t("auth.accountCreatedTitle"), user.email ?? undefined);
      dismiss();
    } catch (error) {
      const message =
        error instanceof Error ? error.message : t("auth.unableToContinue");
      showErrorToast(
        isSignIn ? t("auth.loginFailed") : t("auth.signUpFailed"),
        message
      );
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleGuest = () => {
    showInfoToast(t("auth.localModeTitle"), t("auth.localModeBody"));
    dismiss();
  };

  return (
    <SafeAreaView edges={["top", "bottom"]} className="flex-1 bg-[#f7f8f5]">
      <KeyboardAvoidingView
        behavior={Platform.OS === "ios" ? "padding" : undefined}
        className="flex-1"
      >
        <ScrollView
          contentContainerStyle={styles.scrollContent}
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={false}
        >
          <View className="flex-row justify-start">
            <Pressable
              className="h-10 w-10 items-center justify-center rounded-full bg-white"
              style={shadowLayering.core}
              onPress={dismiss}
            >
              <BackIcon color="#0f172a" size={18} />
            </Pressable>
          </View>

          <View className="mt-8 items-center">
            <View style={shadowCastEmerald}>
              <LinearGradient
                colors={["#022c22", "#064e3b", "#0f766e"]}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 1 }}
                style={styles.badge}
              >
                <LeafIcon color="#ffffff" size={30} strokeWidth={1.6} />
              </LinearGradient>
            </View>

            <Text className="mt-4 text-xs font-semibold uppercase tracking-[3px] text-emerald-700">
              PlantHelper
            </Text>
            <Text className="mt-3 text-center text-3xl font-bold tracking-tight text-slate-900">
              {isSignIn ? t("auth.welcomeBackTitle") : t("auth.createAccountTitle")}
            </Text>
            <Text className="mt-2 text-center text-base leading-6 text-slate-500">
              {isSignIn
                ? t("auth.signInDesc")
                : t("auth.signUpDesc")}
            </Text>
          </View>

          <View className="mt-10" style={shadowLayering.cast}>
            <View
              className="rounded-[28px] border border-slate-100 bg-white p-6"
              style={shadowLayering.core}
            >
              <Text className="text-xs font-semibold uppercase tracking-[2px] text-slate-400">
                {t("common.emailLabel")}
              </Text>
              <View className="mt-2 flex-row items-center rounded-2xl bg-slate-50 px-4">
                <MailIcon color="#64748b" size={18} />
                <TextInput
                  value={email}
                  onChangeText={setEmail}
                  autoCapitalize="none"
                  autoCorrect={false}
                  autoComplete="email"
                  keyboardType="email-address"
                  placeholder={t("common.emailPlaceholder")}
                  placeholderTextColor="#94a3b8"
                  className="ml-3 flex-1 py-4 text-base text-slate-900"
                />
              </View>

              <Text className="mt-5 text-xs font-semibold uppercase tracking-[2px] text-slate-400">
                {t("common.passwordLabel")}
              </Text>
              <View className="mt-2 flex-row items-center rounded-2xl bg-slate-50 px-4">
                <LockIcon color="#64748b" size={18} />
                <TextInput
                  value={password}
                  onChangeText={setPassword}
                  secureTextEntry
                  autoCapitalize="none"
                  autoComplete={isSignIn ? "current-password" : "new-password"}
                  placeholder={t("common.passwordPlaceholder")}
                  placeholderTextColor="#94a3b8"
                  className="ml-3 flex-1 py-4 text-base text-slate-900"
                />
              </View>
            </View>
          </View>

          <TouchableOpacity
            disabled={!canSubmit}
            onPress={() => void handleSubmit()}
            className="mt-6 overflow-hidden rounded-2xl"
            activeOpacity={0.9}
            style={[shadowCastEmerald, !canSubmit && { opacity: 0.5 }]}
          >
            <LinearGradient
              colors={["#064e3b", "#0f766e"]}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 1 }}
              style={{ borderRadius: 16 }}
            >
              <View className="flex-row items-center justify-center gap-2 p-5">
                {isSubmitting ? <ActivityIndicator color="#ffffff" /> : null}
                <Text className="text-center text-base font-bold tracking-tight text-white">
                  {isSubmitting
                    ? t("common.pleaseWait")
                    : isSignIn
                      ? t("auth.signInBtn")
                      : t("auth.signUpBtn")}
                </Text>
              </View>
            </LinearGradient>
          </TouchableOpacity>

          <Pressable
            className="mt-4 items-center py-3"
            onPress={() => setMode(isSignIn ? "signUp" : "signIn")}
          >
            <Text className="text-sm text-slate-500">
              {isSignIn ? t("auth.noAccountPrompt") : t("auth.hasAccountPrompt")}
              <Text className="font-semibold text-emerald-700">
                {isSignIn ? t("auth.createNow") : t("auth.signInBtn")}
              </Text>
            </Text>
          </Pressable>

          {params.returnTo ? null : (
            <Pressable
              className="mt-2 items-center py-3"
              onPress={handleGuest}
            >
              <Text className="text-xs font-medium text-slate-400 underline">
                {t("auth.continueWithoutAccount")}
              </Text>
            </Pressable>
          )}
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  scrollContent: {
    paddingHorizontal: 24,
    paddingTop: 16,
    paddingBottom: 48,
  },
  badge: {
    height: 88,
    width: 88,
    borderRadius: 44,
    alignItems: "center",
    justifyContent: "center",
  },
});
