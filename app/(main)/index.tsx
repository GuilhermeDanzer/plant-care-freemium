import { useRouter } from "expo-router";
import { type ComponentType, useEffect, useState } from "react";
import { useTranslation } from "react-i18next";
import { LogIn, Sprout, UserCircle2, Settings, Sparkles, Book } from "lucide-react-native";
import {
  Alert,
  FlatList,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
  ActivityIndicator,
  type ListRenderItemInfo,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { ActionButton } from "@/components/ActionButton";
import { PlantCard } from "@/components/PlantCard";
import { PremiumBanner } from "@/components/PremiumBanner";
import { AddPlantActionSheet } from "@/components/AddPlantActionSheet";
import { usePlantStore } from "@/store/usePlantStore";
import { PlantRecord } from "@/types/plant";
import { FREE_PLANT_LIMIT } from "@/utils/constants";
import { shadowLayering } from "@/utils/shadows";
import { showInfoToast, showSuccessToast, showErrorToast } from "@/utils/showToasts";
import { useIntelligentWatering } from "@/hooks/useIntelligentWatering";
import { TaskCard } from "@/components/domain/TaskCard";
import { StreakBadge } from "@/components/domain/StreakBadge";
import { AppTask } from "@/types/plant";
import { getWateringCountdownDetail } from "@/utils/dateUtils";
import { getPlantDisplayName } from "@/utils/plantUtils";

const SproutIcon = Sprout as unknown as ComponentType<{ color?: string; size?: number }>;
const LogInIcon = LogIn as unknown as ComponentType<{ color?: string; size?: number }>;
const UserIcon = UserCircle2 as unknown as ComponentType<{ color?: string; size?: number }>;
const SettingsIcon = Settings as unknown as ComponentType<{ color?: string; size?: number }>;
const BookIcon = Book as unknown as ComponentType<{ color?: string; size?: number }>;

export default function MainIndexRoute() {
  const { t } = useTranslation();
  const router = useRouter();
  const plants = usePlantStore((s) => s.plants);
  const loadPlants = usePlantStore((s) => s.loadPlants);
  const isLoading = usePlantStore((s) => s.isLoading);
  const hasLoaded = usePlantStore((s) => s.hasLoaded);
  const deletePlant = usePlantStore((s) => s.deletePlant);
  const updatePlant = usePlantStore((s) => s.updatePlant);
  const isPremium = usePlantStore((s) => s.isPremium);
  const user = usePlantStore((s) => s.user);
  const isAuthenticated = usePlantStore((s) => s.isAuthenticated);
  const signOut = usePlantStore((s) => s.signOut);
  const { calculateAdjustedSchedules, isLoading: isOptimizing } = useIntelligentWatering();

  const [isEditing, setIsEditing] = useState(false);
  const [showAddSheet, setShowAddSheet] = useState(false);
  const atFreeLimit = !isPremium && plants.length >= FREE_PLANT_LIMIT;

  useEffect(() => {
    if (!hasLoaded) {
      void loadPlants();
    }
  }, [hasLoaded, loadPlants]);

  const urgentTasks: AppTask[] = plants
    .filter((p) => getWateringCountdownDetail(p.next_watering_at).diffDays <= 0)
    .map((p) => ({
      id: `water_${p.id}`,
      plantId: p.id,
      plantName: getPlantDisplayName(p),
      type: "REGAR",
      dueDate: p.next_watering_at,
    }));

  const handleDeletePlant = async (plantId: string, plantName: string) => {
    await deletePlant(plantId);
    showSuccessToast(t("home.plantDeletedTitle"), t("home.plantDeletedBody", { plantName }));
  };

  const handleOpenPlant = (plantId: string) => {
    router.push({ pathname: "/plant/[id]", params: { id: String(plantId) } });
  };

  const handleAuthPress = () => {
    if (isAuthenticated) {
      Alert.alert(
        t("home.signOutPromptTitle"),
        user?.email
          ? t("home.signOutPromptBodyUser", { email: user.email })
          : t("home.signOutPromptBodyGeneric"),
        [
          { text: t("common.cancel"), style: "cancel" },
          {
            text: t("home.signOutConfirm"),
            style: "destructive",
            onPress: async () => {
              await signOut();
              showInfoToast(t("home.sessionEnded"));
            },
          },
        ]
      );
      return;
    }
    router.push("/auth");
  };

  const handleOptimizeSchedules = async () => {
    if (plants.length === 0) return;
    
    // Map existing plants to WeatherPlant type
    const weatherPlants = plants.map(p => ({
      id: p.id.toString(),
      baseWateringIntervalDays: p.watering_freq_days,
      isOutdoors: true, // Assuming true for now, can be added to DB later
      lastWateredDate: new Date(p.last_watered_at),
    }));

    const adjustedPlants = await calculateAdjustedSchedules(weatherPlants);
    if (adjustedPlants.length > 0) {
      // Bulk update SQLite via Zustand
      for (const adj of adjustedPlants) {
        await updatePlant(adj.id, {
          nextWateringAt: adj.adjustedNextWateringDate.toISOString()
        });
      }
      showSuccessToast(t("home.scheduleSuccessTitle"), t("home.scheduleSuccessBody"));
    } else {
      showErrorToast(t("home.scheduleFailTitle"), t("home.scheduleFailBody"));
    }
  };

  const renderItem = ({ item }: ListRenderItemInfo<PlantRecord>) => (
    <PlantCard
      plant={item}
      isEditing={isEditing}
      onDelete={(id, name) => void handleDeletePlant(id, name)}
      onPress={handleOpenPlant}
    />
  );

  return (
    <SafeAreaView edges={["top", "bottom"]} className="flex-1 bg-slate-50">
      <View className="flex-1 p-4">
        <View className="mb-6 flex-row items-start justify-between px-2">
          <View className="flex-1 pr-4">
            <Text className="text-3xl font-bold tracking-tight text-slate-900">
              {t("home.title")}
            </Text>
            <Text className="mt-2 text-sm text-slate-500">
              {isAuthenticated && user?.email
                ? t("home.subtitleUser", { email: user.email })
                : t("home.subtitleGeneric")}
            </Text>
          </View>

          <View className="items-end">
            <View className="flex-row gap-2">
              <StreakBadge />
              <TouchableOpacity
                onPress={() => router.push('/lexicon')}
                className="h-10 w-10 items-center justify-center rounded-full bg-white"
                style={shadowLayering.core}
                accessibilityLabel={t("lexicon.accessibilityTitle")}
              >
                <BookIcon color="#047857" size={18} />
              </TouchableOpacity>
              <TouchableOpacity
                onPress={() => router.push('/settings')}
                className="h-10 w-10 items-center justify-center rounded-full bg-white"
                style={shadowLayering.core}
                accessibilityLabel={t("home.accessibilitySettings")}
                testID="settings-button"
              >
                <SettingsIcon color="#0f172a" size={18} />
              </TouchableOpacity>
              <TouchableOpacity
                onPress={handleAuthPress}
                className="h-10 w-10 items-center justify-center rounded-full bg-white"
                style={shadowLayering.core}
                accessibilityLabel={isAuthenticated ? t("home.accessibilitySignOut") : t("home.accessibilitySignIn")}
              >
                {isAuthenticated ? (
                  <UserIcon color="#047857" size={20} />
                ) : (
                  <LogInIcon color="#0f172a" size={18} />
                )}
              </TouchableOpacity>
            </View>

            {plants.length > 0 ? (
              <TouchableOpacity
                onPress={() => setIsEditing((current) => !current)}
                className="mt-3"
              >
                <Text className="text-sm font-semibold text-emerald-700">
                  {isEditing ? t("home.editModeDone") : t("home.editModeEdit")}
                </Text>
              </TouchableOpacity>
            ) : null}
          </View>
        </View>

        {!isPremium ? (
          <View className="mb-5 px-2">
            <PremiumBanner onPress={() => router.push("/paywall")} />
          </View>
        ) : plants.length > 0 ? (
          <TouchableOpacity 
            className="mb-5 mx-2 bg-blue-50 border border-blue-200 rounded-2xl p-4 flex-row items-center justify-center shadow-sm"
            onPress={handleOptimizeSchedules}
            disabled={isOptimizing}
          >
            {isOptimizing ? (
              <ActivityIndicator color="#2563eb" className="mr-2" />
            ) : (
              <Sparkles color="#2563eb" size={18} className="mr-2" />
            )}
            <Text className="text-blue-700 font-bold">
              {isOptimizing ? t("home.optimizing") : t("home.optimizeAI")}
            </Text>
          </TouchableOpacity>
        ) : null}

        {urgentTasks.length > 0 && !isEditing ? (
          <View className="px-2 mb-2">
            <Text className="text-lg font-bold text-slate-800 mb-2">
              {t("home.tasksToday")}
            </Text>
            {urgentTasks.map((task) => (
              <TaskCard key={task.id} task={task} />
            ))}
          </View>
        ) : null}

        <FlatList
          data={plants}
          keyExtractor={(item) => item.id.toString()}
          renderItem={renderItem}
          numColumns={2}
          refreshing={isLoading}
          onRefresh={() => void loadPlants()}
          contentContainerStyle={styles.listContent}
          showsVerticalScrollIndicator={false}
          ListEmptyComponent={
            <View className="mt-24 items-center px-6">
              <View className="rounded-full bg-emerald-50 p-5">
                <SproutIcon color="#10b981" size={30} />
              </View>
              <Text className="mt-4 text-lg font-semibold tracking-tight text-slate-800">
                {t("home.emptyStateTitle")}
              </Text>
              <Text className="mt-2 text-center text-sm text-slate-500">
                {t("home.emptyStateBody")}
              </Text>
            </View>
          }
        />

        <ActionButton disabled={false} onPress={() => setShowAddSheet(true)} />

        <AddPlantActionSheet 
          visible={showAddSheet}
          onClose={() => setShowAddSheet(false)}
          onSelectAI={() => {
            setShowAddSheet(false);
            router.push("/(identify)/camera");
          }}
          onSelectManual={() => {
            setShowAddSheet(false);
            router.push("/(identify)/manual-add");
          }}
        />
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  listContent: {
    paddingBottom: 96,
    paddingHorizontal: 2,
  },
});
