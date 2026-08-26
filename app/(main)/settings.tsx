import DateTimePicker, { DateTimePickerEvent } from "@react-native-community/datetimepicker";
import * as Notifications from "expo-notifications";
import { Stack, useRouter } from "expo-router";
import { useState } from "react";
import { Alert, Platform, Pressable, StyleSheet, Switch, Text, TouchableOpacity, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { BackIcon, BellIcon, BellOffIcon } from "@/components/icons";
import { notificationService } from "@/services/notificationService";
import { usePlantStore } from "@/store/usePlantStore";
import { useSettingsStore } from "@/store/useSettingsStore";
import { shadowLayering, shadowBackButton } from "@/utils/shadows";
import { showInfoToast, showSuccessToast, showErrorToast } from "@/utils/showToasts";
import { useLanguage } from "@/hooks/useLanguage";
import { authService } from "@/services/authService";
import { LogOut, Globe } from "lucide-react-native";

export default function SettingsRoute() {
  const router = useRouter();
  const { notificationsEnabled, notificationTime, setNotificationsEnabled, setNotificationTime } = useSettingsStore();
  const plants = usePlantStore((s) => s.plants);
  const isAuthenticated = usePlantStore((s) => s.isAuthenticated);
  const { currentLanguage, changeLanguage, t } = useLanguage();

  // Parse current time for the picker
  const [hourStr, minuteStr] = notificationTime.split(":");
  const initialDate = new Date();
  initialDate.setHours(parseInt(hourStr, 10), parseInt(minuteStr, 10), 0, 0);

  const [date, setDate] = useState(initialDate);
  const [showPicker, setShowPicker] = useState(false);

  const handleToggleNotifications = async (value: boolean) => {
    if (value) {
      const result = await notificationService.requestPermissions();
      if (result !== "granted") {
        setNotificationsEnabled(false);
        if (result === "denied") {
          showInfoToast(t("settings.permissionDeniedTitle"), t("settings.permissionDeniedBody"));
        }
        return;
      }
    }
    setNotificationsEnabled(value);
    
    // Resync immediately — the action already persists the value to the store
    await notificationService.syncWateringNotifications(plants);
    
    if (value) {
      showSuccessToast(t("settings.notificationsEnabled"));
    }
  };

  const onChangeTime = async (event: DateTimePickerEvent, selectedDate?: Date) => {
    if (Platform.OS === "android") {
      setShowPicker(false);
    }
    
    if (selectedDate) {
      setDate(selectedDate);
      const hours = selectedDate.getHours().toString().padStart(2, "0");
      const minutes = selectedDate.getMinutes().toString().padStart(2, "0");
      const newTime = `${hours}:${minutes}`;
      
      setNotificationTime(newTime);
      // setNotificationTime already persists to the store — no direct setState needed
      
      if (notificationsEnabled) {
        await notificationService.syncWateringNotifications(plants);
      }
    }
  };

  const handleTestNotification = async () => {
    const result = await notificationService.requestPermissions();
    if (result !== "granted") {
      if (result === "denied") {
        showInfoToast(t("settings.permissionDeniedTitle"));
      }
      return;
    }
    await Notifications.scheduleNotificationAsync({
      content: {
        title: t("settings.testNotificationTitle"),
        body: t("settings.testNotificationBody"),
        sound: true,
      },
      trigger: {
        type: Notifications.SchedulableTriggerInputTypes.TIME_INTERVAL,
        seconds: 5,
      },
    });
    showSuccessToast(t("settings.scheduledTitle"), t("settings.scheduledBody"));
  };

  const handleDeleteAccount = () => {
    Alert.alert(
      t("settings.deleteAccountPromptTitle"),
      t("settings.deleteAccountPromptBody"),
      [
        { text: t("common.cancel"), style: "cancel" },
        {
          text: t("settings.deleteAccountConfirm"),
          style: "destructive",
          onPress: async () => {
            try {
              await authService.deleteAccount();
              // Remove os dados locais (SQLite + notificações) e reseta o
              // estado global — a conta já não existe mais no servidor.
              await usePlantStore.getState().resetGarden();
              await notificationService.cancelAllScheduledNotifications();
              usePlantStore.getState().setUser(null);
              showSuccessToast(t("settings.deleteAccountSuccess"));
              router.replace("/");
            } catch (error: any) {
              const message = error?.message || error?.details || t("common.unknownError");
              showErrorToast(t("settings.deleteAccountFailure"), message);
            }
          },
        },
      ]
    );
  };

  return (
    <SafeAreaView testID="settings-screen-container" className="flex-1 bg-slate-50" edges={["top", "bottom"]}>
      <Stack.Screen
        options={{ headerShown: false }}
      />
      
      <View className="flex-row items-center px-4 pt-4 pb-4">
        <Pressable
          testID="settings-back-button"
          onPress={() => router.back()}
          className="h-10 w-10 items-center justify-center rounded-full bg-white shadow-sm"
          style={shadowBackButton}
        >
          <BackIcon color="#0f172a" size={18} />
        </Pressable>
        <Text className="ml-4 text-2xl font-bold tracking-tight text-slate-900">{t("settings.title")}</Text>
      </View>

      <View className="flex-1 p-4 pt-0">
        <Text className="mb-4 ml-2 text-sm font-semibold uppercase tracking-wider text-slate-500">
          {t('settings.language')}
        </Text>
        <View style={styles.card} className="rounded-2xl bg-white px-4 py-2 mb-8">
          <View className="flex-row items-center justify-between py-4">
            <View className="flex-row items-center">
              <View className="mr-3 rounded-full bg-blue-50 p-2">
                <Globe color="#3b82f6" size={20} />
              </View>
              <View>
                <Text className="text-base font-semibold text-slate-800">
                  {currentLanguage === 'pt-BR' ? 'Português' : 'English'}
                </Text>
                <Text className="text-sm text-slate-500">{t("settings.changeLanguage")}</Text>
              </View>
            </View>
            <Switch
              value={currentLanguage === 'en'}
              onValueChange={(val) => void changeLanguage(val ? 'en' : 'pt-BR')}
              trackColor={{ false: "#cbd5e1", true: "#3b82f6" }}
              thumbColor="#ffffff"
            />
          </View>
        </View>

        <Text className="mb-4 ml-2 text-sm font-semibold uppercase tracking-wider text-slate-500">
          {t("settings.wateringReminders")}
        </Text>
        
        <View style={styles.card} className="rounded-2xl bg-white px-4 py-2">
          <View className="flex-row items-center justify-between border-b border-slate-100 py-4">
            <View className="flex-row items-center">
              <View className={`mr-3 rounded-full p-2 ${notificationsEnabled ? "bg-emerald-100" : "bg-slate-100"}`}>
                {notificationsEnabled ? (
                  <BellIcon color="#059669" size={20} />
                ) : (
                  <BellOffIcon color="#94a3b8" size={20} />
                )}
              </View>
              <View>
                <Text className="text-base font-semibold text-slate-800">{t("settings.enableReminders")}</Text>
                <Text className="text-sm text-slate-500">{t("settings.receiveAlertsDesc")}</Text>
              </View>
            </View>
            <Switch
              value={notificationsEnabled}
              onValueChange={(val) => void handleToggleNotifications(val)}
              trackColor={{ false: "#cbd5e1", true: "#34d399" }}
              thumbColor="#ffffff"
            />
          </View>

          <View className="flex-row items-center justify-between py-4">
            <View>
              <Text className="text-base font-semibold text-slate-800">{t("settings.preferredTime")}</Text>
              <Text className="text-sm text-slate-500">{t("settings.preferredTimeDesc")}</Text>
            </View>
            
            {Platform.OS === "android" ? (
              <TouchableOpacity 
                disabled={!notificationsEnabled}
                onPress={() => setShowPicker(true)}
                className={`rounded-lg px-4 py-2 ${notificationsEnabled ? "bg-emerald-50" : "bg-slate-50"}`}
              >
                <Text className={`font-semibold ${notificationsEnabled ? "text-emerald-700" : "text-slate-400"}`}>
                  {notificationTime}
                </Text>
              </TouchableOpacity>
            ) : null}

            {(Platform.OS === "ios" || showPicker) && (
              <DateTimePicker
                value={date}
                mode="time"
                display="default"
                disabled={!notificationsEnabled}
                onChange={(e, d) => void onChangeTime(e, d)}
                themeVariant="light"
              />
            )}
          </View>
        </View>

        {__DEV__ && (
          <View className="mt-8">
            <Text className="mb-4 ml-2 text-sm font-semibold uppercase tracking-wider text-slate-500">
              {t("settings.developerMenu")}
            </Text>
            <View style={styles.card} className="rounded-2xl bg-white px-4 py-2">
              <TouchableOpacity
                onPress={() => void handleTestNotification()}
                className="flex-row items-center py-4"
              >
                <View className="mr-3 rounded-full bg-indigo-100 p-2">
                  <BellIcon color="#4f46e5" size={20} />
                </View>
                <View>
                  <Text className="text-base font-semibold text-slate-800">{t("settings.testNotification")}</Text>
                  <Text className="text-sm text-slate-500">{t("settings.testNotificationDesc")}</Text>
                </View>
              </TouchableOpacity>
            </View>
          </View>
        )}

        {isAuthenticated && (
          <View className="mt-8">
            <Text className="mb-4 ml-2 text-sm font-semibold uppercase tracking-wider text-slate-500">
              {t("settings.myAccount")}
            </Text>
            <View style={styles.card} className="rounded-2xl bg-white px-4 py-2">
              <TouchableOpacity
                onPress={handleDeleteAccount}
                className="flex-row items-center py-4"
              >
                <View className="mr-3 rounded-full bg-red-50 p-2">
                  <LogOut color="#ef4444" size={20} />
                </View>
                <View>
                  <Text className="text-base font-semibold text-red-600">{t("settings.deleteAccount")}</Text>
                  <Text className="text-sm text-slate-500">{t("settings.deleteAccountDesc")}</Text>
                </View>
              </TouchableOpacity>
            </View>
          </View>
        )}
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  card: {
    shadowColor: "#0f172a",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 2,
  },
});