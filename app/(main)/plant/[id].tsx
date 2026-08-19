import { BlurView } from "expo-blur";
import * as Haptics from "expo-haptics";
import * as ImagePicker from "expo-image-picker";
import { LinearGradient } from "expo-linear-gradient";
import { useLocalSearchParams, useRouter } from "expo-router";
import { useTranslation } from "react-i18next";
import {
  type ComponentType,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";
import {
  ActivityIndicator,
  Animated,
  Modal,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { HealthResultCard } from "@/components/HealthResultCard";
import { PremiumBanner } from "@/components/PremiumBanner";
import {
  BlurredHealthCard,
  EmptyHealthCard,
  PhotoSourceSheet,
  WateringHeroCard,
  JournalTimeline,
} from "@/components/plant-detail";
import { WateringButton } from "@/components/WateringButton";
import {
  BackIcon,
  CameraIcon,
  CheckIcon,
  CloseIcon,
  DropletIcon,
  EditIcon,
  GalleryIcon,
  GemIcon,
  LockIcon,
  SparklesIcon,
  SproutIcon,
} from "@/components/icons";
import { usePlantStore } from "@/store/usePlantStore";
import { PlantRecord, JournalEntry } from "@/types/plant";
import {
  formatFriendlyDate,
  getDaysSince,
  getWateringCountdownDetail,
} from "@/utils/dateUtils";
import { getPlantDisplayName } from "@/utils/plantUtils";
import { shadowLayering } from "@/utils/shadows";
import {
  showErrorToast,
  showInfoToast,
  showPremiumToast,
  showSuccessToast,
} from "@/utils/showToasts";

export default function PlantDetailsRoute() {
  const { t } = useTranslation();
  const router = useRouter();
  const { id } = useLocalSearchParams<{ id: string }>();
  const plantId = id;

  const plants = usePlantStore((s) => s.plants);
  const isPremium = usePlantStore((s) => s.isPremium);
  const waterPlant = usePlantStore((s) => s.waterPlant);
  const updatePlant = usePlantStore((s) => s.updatePlant);
  const checkHealth = usePlantStore((s) => s.checkHealth);
  const loadPlants = usePlantStore((s) => s.loadPlants);
  const hasLoaded = usePlantStore((s) => s.hasLoaded);

  const plant = useMemo<PlantRecord | undefined>(
    () => plants.find((p) => p.id === plantId),
    [plants, plantId]
  );

  const [isEditingName, setIsEditingName] = useState(false);
  const [nicknameDraft, setNicknameDraft] = useState("");
  const [isChecking, setIsChecking] = useState(false);
  const [photoSheetMode, setPhotoSheetMode] = useState<"diagnosis" | "journal" | null>(null);

  const [journalEntries, setJournalEntries] = useState<JournalEntry[]>([]);
  const [isAddingJournal, setIsAddingJournal] = useState(false);
  const addJournalEntry = usePlantStore((s) => s.addJournalEntry);
  const getJournalForPlant = usePlantStore((s) => s.getJournalForPlant);

  const loadJournal = useCallback(async () => {
    if (plantId) {
      const entries = await getJournalForPlant(plantId);
      setJournalEntries(entries);
    }
  }, [plantId, getJournalForPlant]);

  useEffect(() => {
    if (!hasLoaded) void loadPlants();
    void loadJournal();
  }, [hasLoaded, loadPlants, loadJournal]);

  useEffect(() => {
    if (plant) {
      setNicknameDraft(plant.nickname ?? "");
    }
  }, [plant?.id]);

  if (!plant) {
    return (
      <SafeAreaView edges={["top", "bottom"]} className="flex-1 bg-slate-50">
        <View className="flex-1 items-center justify-center px-6">
          <Text className="text-base text-slate-500">{t("plantDetail.plantNotFound")}</Text>
          <TouchableOpacity
            className="mt-6 rounded-2xl bg-emerald-600 px-6 py-3"
            onPress={() => router.back()}
          >
            <Text className="text-sm font-semibold text-white">{t("plantDetail.btnBack")}</Text>
          </TouchableOpacity>
        </View>
      </SafeAreaView>
    );
  }

  const displayName = getPlantDisplayName(plant);
  const countdown = getWateringCountdownDetail(plant.next_watering_at);
  const daysSinceLastWatering = getDaysSince(plant.last_watered_at);

  const handleSaveNickname = async () => {
    const trimmed = nicknameDraft.trim();
    const currentNickname = plant.nickname ?? "";
    if (trimmed === currentNickname) {
      setIsEditingName(false);
      return;
    }

    await updatePlant(plant.id, {
      nickname: trimmed.length === 0 ? null : trimmed,
    });
    setIsEditingName(false);
    showSuccessToast(
      t("plantDetail.toastUpdatedTitle"),
      trimmed.length === 0 ? t("plantDetail.toastUpdatedOriginal") : t("plantDetail.toastUpdatedNickname", { nickname: trimmed })
    );
  };

  const handleCancelEdit = () => {
    setNicknameDraft(plant.nickname ?? "");
    setIsEditingName(false);
  };



  const runDiagnosis = async (imageUris: string[]) => {
    setIsChecking(true);
    try {
      const result = await checkHealth(plant.id, imageUris);
      if (result) {
        showSuccessToast(t("plantDetail.toastDiagDoneTitle"), t("plantDetail.toastDiagDoneBody"));
      } else {
        showInfoToast(
          t("plantDetail.toastDiagFailTitle"),
          t("plantDetail.toastDiagFailBody")
        );
      }
    } finally {
      setIsChecking(false);
    }
  };

  const handleRequestDiagnosis = () => {
    if (!isPremium) {
      showPremiumToast(
        t("plantDetail.premiumFeatureTitle"),
        t("plantDetail.premiumFeatureBody")
      );
      router.push("/paywall");
      return;
    }
    if (isChecking) return;
    setPhotoSheetMode("diagnosis");
  };

  const handleUseCurrentPhoto = async () => {
    setPhotoSheetMode(null);
    if (!plant.image_uri) {
      showInfoToast(
        t("plantDetail.toastNoPhotoTitle"),
        t("plantDetail.toastNoPhotoBody")
      );
      return;
    }
    await runDiagnosis([plant.image_uri]);
  };

  const handleNewPhoto = async () => {
    const mode = photoSheetMode;
    setPhotoSheetMode(null);
    try {
      const permission = await ImagePicker.requestCameraPermissionsAsync();
      if (!permission.granted) {
        showInfoToast(
          t("plantDetail.toastPermNeededTitle"),
          t("plantDetail.toastPermCamBody")
        );
        return;
      }

      const result = await ImagePicker.launchCameraAsync({
        mediaTypes: ["images"],
        quality: 0.6,
        allowsEditing: false,
      });

      if (result.canceled || !result.assets[0]?.uri) return;
      const uri = result.assets[0].uri;

      if (mode === "diagnosis") {
        await updatePlant(plant.id, { imageUri: uri });
        await runDiagnosis([uri]);
      } else if (mode === "journal") {
        setIsAddingJournal(true);
        await addJournalEntry(plant.id, uri, null);
        await loadJournal();
        setIsAddingJournal(false);
        showSuccessToast(t("plantDetail.journalSuccessTitle", "Salvo!"), t("plantDetail.journalSuccessBody", "Sua foto foi adicionada ao diário."));
      }
    } catch (error) {
      console.error("[plant/details] Falha ao obter nova foto.", error);
      setIsAddingJournal(false);
      showErrorToast(t("common.error"), t("plantDetail.toastCamErrorBody"));
    }
  };

  const handleGalleryUpload = async () => {
    const mode = photoSheetMode;
    setPhotoSheetMode(null);
    try {
      const permission = await ImagePicker.requestMediaLibraryPermissionsAsync();
      if (!permission.granted) {
        showInfoToast(
          t("plantDetail.toastPermNeededTitle"),
          t("identify.permissionGalleryBody")
        );
        return;
      }

      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ["images"],
        quality: 0.6,
        allowsMultipleSelection: true,
      });

      if (result.canceled) return;
      const uris = result.assets.map((a) => a.uri);

      if (mode === "diagnosis") {
        await updatePlant(plant.id, { imageUri: uris[0] });
        await runDiagnosis(uris);
      } else if (mode === "journal") {
        setIsAddingJournal(true);
        for (const uri of uris) {
          await addJournalEntry(plant.id, uri, null);
        }
        await loadJournal();
        setIsAddingJournal(false);
        showSuccessToast(t("plantDetail.journalSuccessTitle", "Salvo!"), t("plantDetail.journalSuccessBody", "Sua foto foi adicionada ao diário."));
      }
    } catch (error) {
      console.error("[plant/details] Falha ao selecionar imagem da galeria.", error);
      setIsAddingJournal(false);
      showErrorToast(t("common.error"), t("identify.errorGalleryBody"));
    }
  };

  const handleAddJournalEntry = () => {
    setPhotoSheetMode("journal");
  };

  const health = plant.health_data;

  return (
    <SafeAreaView edges={["top", "bottom"]} className="flex-1 bg-slate-50">
      <ScrollView
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        {/* HEADER */}
        <View className="flex-row items-center justify-between px-2">
          <Pressable
            onPress={() => router.back()}
            className="h-10 w-10 items-center justify-center rounded-full bg-white"
            style={shadowLayering.core}
          >
            <BackIcon color="#0f172a" size={18} />
          </Pressable>

          {!isEditingName ? (
            <Pressable
              onPress={() => setIsEditingName(true)}
              className="h-10 w-10 items-center justify-center rounded-full bg-white"
              style={shadowLayering.core}
            >
              <EditIcon color="#0f172a" size={16} />
            </Pressable>
          ) : (
            <View className="h-10 w-10" />
          )}
        </View>

        {/* NAME + SCIENTIFIC */}
        <View className="mt-6 px-2">
          {!isEditingName ? (
            <Pressable onPress={() => setIsEditingName(true)}>
              <Text className="text-3xl font-bold tracking-tight text-slate-900">
                {displayName}
              </Text>
              <Text className="mt-1 text-sm italic text-slate-500">
                {plant.scientific_name}
              </Text>
              {plant.nickname && plant.nickname.trim().length > 0 ? (
                <Text className="mt-1 text-xs text-slate-400">
                  Nome original: {plant.original_name}
                </Text>
              ) : null}
            </Pressable>
          ) : (
            <View className="rounded-2xl border border-emerald-200 bg-white p-4">
              <Text className="mb-2 text-xs font-semibold uppercase tracking-widest text-emerald-700">
                Apelido
              </Text>
              <TextInput
                value={nicknameDraft}
                onChangeText={setNicknameDraft}
                placeholder={plant.original_name}
                autoFocus
                className="text-2xl font-bold tracking-tight text-slate-900"
                returnKeyType="done"
                onSubmitEditing={() => void handleSaveNickname()}
              />
              <View className="mt-4 flex-row justify-end gap-2">
                <Pressable
                  onPress={handleCancelEdit}
                  className="h-10 w-10 items-center justify-center rounded-full bg-slate-100"
                >
                  <CloseIcon color="#475569" size={16} />
                </Pressable>
                <Pressable
                  onPress={() => void handleSaveNickname()}
                  className="h-10 w-10 items-center justify-center rounded-full bg-emerald-600"
                >
                  <CheckIcon color="#ffffff" size={16} />
                </Pressable>
              </View>
            </View>
          )}
        </View>

        {/* HERO / WATERING STATUS */}
        <View className="mt-6 px-2">
          <WateringHeroCard
            countdown={countdown}
            lastWateredAt={plant.last_watered_at}
            wateringFreqDays={plant.watering_freq_days}
            daysSinceLastWatering={daysSinceLastWatering}
          />

          <WateringButton
            plantId={plant.id}
            wateringFreqDays={plant.watering_freq_days}
            quantity={24}
          />
        </View>

        {/* HEALTH SECTION */}
        <View className="mt-8 px-2">
          <View className="mb-3 flex-row items-center justify-between">
            <Text className="text-base font-bold tracking-tight text-slate-900">
              Saúde da planta
            </Text>
            {!isPremium ? (
              <View className="flex-row items-center gap-1 rounded-full bg-emerald-50 px-2.5 py-1">
                <GemIcon color="#059669" size={12} strokeWidth={1.8} />
                <Text className="text-[10px] font-semibold uppercase tracking-widest text-emerald-700">
                  Premium
                </Text>
              </View>
            ) : null}
          </View>

          {isPremium ? (
            <>
              {health ? (
                <HealthResultCard
                  response={health}
                  lastCheckedAt={plant.last_health_check_at}
                />
              ) : (
                <EmptyHealthCard />
              )}

              <TouchableOpacity
                activeOpacity={0.9}
                onPress={handleRequestDiagnosis}
                disabled={isChecking}
                className="mt-4 flex-row items-center justify-center gap-2 rounded-2xl bg-slate-900 p-4"
                style={shadowLayering.core}
              >
                {isChecking ? (
                  <ActivityIndicator color="#ffffff" size="small" />
                ) : (
                  <SparklesIcon color="#ffffff" size={16} />
                )}
                <Text className="text-center text-sm font-semibold text-white">
                  {isChecking
                    ? "Analisando..."
                    : health
                      ? "Nova consulta"
                      : "Diagnosticar agora"}
                </Text>
              </TouchableOpacity>
            </>
          ) : (
            <BlurredHealthCard onUnlock={() => router.push("/paywall")} />
          )}
        </View>

        {!isPremium ? (
          <View className="mt-8 px-2">
            <PremiumBanner
              title="Vire membro Premium"
              subtitle="IA de saúde, histórico e slots ilimitados."
              onPress={() => router.push("/paywall")}
            />
          </View>
        ) : null}


        <JournalTimeline 
          entries={journalEntries} 
          isAddingEntry={isAddingJournal} 
          onAddEntry={() => void handleAddJournalEntry()} 
        />
      </ScrollView>

      {/* PHOTO SOURCE SHEET */}
      <PhotoSourceSheet
        visible={photoSheetMode !== null}
        hasCurrentPhoto={Boolean(plant.image_uri)}
        hideCurrentPhoto={photoSheetMode === "journal"}
        onUseCurrent={() => void handleUseCurrentPhoto()}
        onNewPhoto={() => void handleNewPhoto()}
        onGalleryUpload={() => void handleGalleryUpload()}
        onClose={() => setPhotoSheetMode(null)}
      />
    </SafeAreaView>
  );
}



const styles = StyleSheet.create({
  scrollContent: {
    padding: 16,
    paddingBottom: 48,
  },
  heroGradient: {
    borderRadius: 28,
    overflow: "hidden",
  },
});
