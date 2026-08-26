import { LinearGradient } from "expo-linear-gradient";
import { useLocalSearchParams, useRouter } from "expo-router";
import { ArrowLeft, Leaf, Lock, Mail } from "lucide-react-native";
import { type ComponentType, useState } from "react";
import { useTranslation } from "react-i18next";
import {
  ActivityIndicator,
  Keyboard,
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
import { authService } from "@/services/authService";
import { usePlantStore } from "@/store/usePlantStore";
import { Input } from "@/components/ui/Input";
import {
  shadowCastEmerald,
  shadowLayering,
} from "@/utils/shadows";
import {
  showErrorToast,
  showInfoToast,
  showSuccessToast,
} from "@/utils/showToasts";

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
    Keyboard.dismiss()
    if (isSubmitting) return;

    if (emailTrimmed.length === 0) {
      showErrorToast(t("auth.error"), t("auth.missingEmail"));
      return;
    }

    if (password.length < 6) {
      showErrorToast(t("auth.error"), t("auth.passwordTooShort"));
      return;
    }

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
    } catch (error: any) {
      console.warn("Auth Error:", error);
      let message = error?.message || t("auth.unableToContinue");

      // Traduz os erros do Supabase para PT-BR
      if (message.toLowerCase().includes("already registered")) {
        message = t("auth.userAlreadyRegistered");
      } else if (message.toLowerCase().includes("invalid login credentials")) {
        message = t("auth.invalidCredentials");
      }

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
              <Input
                label={t("common.emailLabel")}
                icon={MailIcon}
                value={email}
                onChangeText={setEmail}
                autoCapitalize="none"
                autoCorrect={false}
                autoComplete="email"
                keyboardType="email-address"
                placeholder={t("common.emailPlaceholder")}
              />

              <View className="mt-6">
                <Input
                  label={t("common.passwordLabel")}
                  icon={LockIcon}
                  value={password}
                  onChangeText={setPassword}
                  secureTextEntry
                  autoCapitalize="none"
                  autoComplete={isSignIn ? "current-password" : "new-password"}
                  placeholder={t("common.passwordPlaceholder")}
                />
              </View>
            </View>
          </View>

          <TouchableOpacity
            onPress={() => void handleSubmit()}
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
