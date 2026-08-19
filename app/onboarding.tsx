import { useRouter } from "expo-router";
import { Bell, Camera, ChevronRight, Sprout } from "lucide-react-native";
import { useState } from "react";
import { Text, TouchableOpacity, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { notificationService } from "@/services/notificationService";
import { useSettingsStore } from "@/store/useSettingsStore";
import { useTranslation } from "react-i18next";

export default function OnboardingRoute() {
  const { t } = useTranslation();
  const router = useRouter();
  const completeOnboarding = useSettingsStore((s) => s.completeOnboarding);
  const setNotificationsEnabled = useSettingsStore((s) => s.setNotificationsEnabled);
  const [step, setStep] = useState(0);

  const handleNext = () => {
    if (step < 2) {
      setStep(step + 1);
    } else {
      completeOnboarding();
      router.replace("/(main)");
    }
  };

  const requestNotifications = async () => {
    const granted = await notificationService.requestPermissions();
    if (granted) {
      setNotificationsEnabled(true);
    }
    handleNext(); // Move to the next step regardless of outcome
  };

  const skipNotifications = () => {
    setNotificationsEnabled(false);
    handleNext();
  };

  return (
    <SafeAreaView edges={["top", "bottom"]} className="flex-1 bg-emerald-50">
      <View className="flex-1 justify-center px-8">
        
        {step === 0 && (
          <View className="items-center">
            <View className="mb-8 rounded-full bg-emerald-100 p-6">
              <Camera color="#059669" size={48} />
            </View>
            <Text className="mb-4 text-center text-3xl font-bold text-slate-800">
              {t("onboarding.step1Title")}
            </Text>
            <Text className="mb-12 text-center text-base text-slate-600">
              {t("onboarding.step1Body")}
            </Text>
            <TouchableOpacity
              testID="onboarding-step1-btn"
              onPress={handleNext}
              className="w-full flex-row items-center justify-center rounded-2xl bg-emerald-600 p-4 shadow-sm"
            >
              <Text className="text-base font-bold text-white">{t("onboarding.step1Btn")}</Text>
              <ChevronRight color="#ffffff" size={20} className="ml-2" />
            </TouchableOpacity>
          </View>
        )}

        {step === 1 && (
          <View className="items-center">
            <View className="mb-8 rounded-full bg-indigo-100 p-6">
              <Bell color="#4f46e5" size={48} />
            </View>
            <Text className="mb-4 text-center text-3xl font-bold text-slate-800">
              {t("onboarding.step2Title")}
            </Text>
            <Text className="mb-8 text-center text-base text-slate-600">
              {t("onboarding.step2Body")}
            </Text>
            
            <TouchableOpacity
              onPress={() => void requestNotifications()}
              className="mb-4 w-full flex-row items-center justify-center rounded-2xl bg-indigo-600 p-4 shadow-sm"
            >
              <Bell color="#ffffff" size={20} className="mr-2" />
              <Text className="text-base font-bold text-white">{t("onboarding.step2Btn")}</Text>
            </TouchableOpacity>

            <TouchableOpacity testID="onboarding-step2-skip-btn" onPress={skipNotifications} className="p-4">
              <Text className="font-medium text-slate-500">{t("onboarding.step2Skip")}</Text>
            </TouchableOpacity>
          </View>
        )}

        {step === 2 && (
          <View className="items-center">
            <View className="mb-8 rounded-full bg-emerald-100 p-6">
              <Sprout color="#059669" size={48} />
            </View>
            <Text className="mb-4 text-center text-3xl font-bold text-slate-800">
              {t("onboarding.step3Title")}
            </Text>
            <Text className="mb-8 text-center text-base text-slate-600">
              {t("onboarding.step3Body")}
            </Text>
            
            <TouchableOpacity
              testID="onboarding-step3-btn"
              onPress={handleNext}
              className="w-full flex-row items-center justify-center rounded-2xl bg-emerald-600 p-4 shadow-sm"
            >
              <Text className="text-base font-bold text-white">{t("onboarding.step3Btn")}</Text>
            </TouchableOpacity>
          </View>
        )}

        {/* Progress Dots */}
        <View className="absolute bottom-10 left-0 right-0 flex-row justify-center space-x-2">
          {[0, 1, 2].map((dot) => (
            <View
              key={dot}
              className={`h-2 w-2 rounded-full mx-1 ${step === dot ? "bg-emerald-600" : "bg-emerald-200"}`}
            />
          ))}
        </View>

      </View>
    </SafeAreaView>
  );
}