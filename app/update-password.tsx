import { LinearGradient } from "expo-linear-gradient";
import * as Linking from "expo-linking";
import { useRouter } from "expo-router";
import { Eye, EyeOff, Lock } from "lucide-react-native";
import { type ComponentType, useEffect, useState } from "react";
import {
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { supabase } from "../src/lib/supabase";
import { shadowCastEmerald, shadowLayering } from "../src/utils/shadows";
import { showErrorToast, showSuccessToast } from "../src/utils/showToasts";
import { useTranslation } from "react-i18next";

const LockIcon = Lock as unknown as ComponentType<{ color?: string; size?: number }>;
const EyeIcon = Eye as unknown as ComponentType<{ color?: string; size?: number }>;
const EyeOffIcon = EyeOff as unknown as ComponentType<{ color?: string; size?: number }>;

export default function UpdatePasswordRoute() {
  const { t } = useTranslation();
  const router = useRouter();
  const url = Linking.useURL();
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isReady, setIsReady] = useState(false);

  useEffect(() => {
    if (!url) return;
    
    // Supabase appends the tokens in the URL hash fragment (#access_token=...)
    const hash = url.split("#")[1];
    if (hash) {
      // URLSearchParams isn't always available in RN without polyfills, so we parse manually
      const params = hash.split("&").reduce((acc, current) => {
        const [key, value] = current.split("=");
        acc[key] = value;
        return acc;
      }, {} as Record<string, string>);

      const { access_token, refresh_token } = params;
      if (access_token && refresh_token) {
        supabase?.auth
          .setSession({ access_token, refresh_token })
          .then(({ error }) => {
            if (error) {
              showErrorToast(t("auth.invalidLinkTitle"), t("auth.invalidLinkBody"));
              router.replace("/");
            } else {
              setIsReady(true);
            }
          });
      }
    }
  }, [url]);

  const handleSubmit = async () => {
    if (password.length < 6 || isSubmitting) return;
    
    setIsSubmitting(true);
    try {
      const { error } = await supabase!.auth.updateUser({ password });
      if (error) throw error;
      
      showSuccessToast(t("auth.passwordChangedTitle"), t("auth.passwordChangedBody"));
      router.replace("/");
    } catch (error) {
      const message = error instanceof Error ? error.message : t("common.unknownError");
      showErrorToast(t("auth.failureTitle"), message);
    } finally {
      setIsSubmitting(false);
    }
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
          bounces={false}
        >
          <View className="mt-12 items-center">
            <Text className="text-center text-3xl font-bold tracking-tight text-slate-900">
              {t("auth.newPasswordTitle")}
            </Text>
            <Text className="mt-2 text-center text-base leading-6 text-slate-500">
              {t("auth.newPasswordDesc")}
            </Text>
          </View>

          <View className="mt-10" style={shadowLayering.cast}>
            <View
              className="rounded-[28px] border border-slate-100 bg-white p-6"
              style={shadowLayering.core}
            >
              <Text className="text-xs font-semibold uppercase tracking-[2px] text-slate-400">
                {t("auth.newPasswordTitle")}
              </Text>
              <View className="mt-2 flex-row items-center rounded-2xl bg-slate-50 px-4 h-14">
                <LockIcon color="#64748b" size={18} />
                <TextInput
                  value={password}
                  onChangeText={setPassword}
                  secureTextEntry={!showPassword}
                  autoCapitalize="none"
                  placeholder={t("common.passwordPlaceholder")}
                  placeholderTextColor="#94a3b8"
                  className="ml-3 flex-1 h-full text-base text-slate-900"
                  style={{ paddingVertical: 0 }}
                />
                <TouchableOpacity
                  onPress={() => setShowPassword(!showPassword)}
                  hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
                  className="ml-2"
                >
                  {showPassword ? (
                    <EyeOffIcon color="#64748b" size={18} />
                  ) : (
                    <EyeIcon color="#64748b" size={18} />
                  )}
                </TouchableOpacity>
              </View>
            </View>
          </View>

          <TouchableOpacity
            disabled={password.length < 6 || !isReady || isSubmitting}
            onPress={() => void handleSubmit()}
            className="mt-6 overflow-hidden rounded-2xl"
            activeOpacity={0.9}
            style={[
              shadowCastEmerald,
              (password.length < 6 || !isReady) && { opacity: 0.5 },
            ]}
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
                  {isSubmitting ? t("common.pleaseWait") : t("auth.resetPasswordBtn")}
                </Text>
              </View>
            </LinearGradient>
          </TouchableOpacity>
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
    flexGrow: 1,
  },
});