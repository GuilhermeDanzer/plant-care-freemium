import { BlurView } from "expo-blur";
import * as Haptics from "expo-haptics";
import * as ImagePicker from "expo-image-picker";
import { LinearGradient } from "expo-linear-gradient";
import { useLocalSearchParams, useRouter } from "expo-router";
import {
  type ComponentType,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";
import {
  ArrowLeft,
  Camera as CameraLucide,
  Check,
  Droplet,
  Gem,
  Image as ImageLucide,
  Lock,
  Pencil,
  Sparkles,
  Sprout,
  X,
} from "lucide-react-native";
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
import { HealthResultCard } from "../../../src/components/HealthResultCard";
import { PremiumBanner } from "../../../src/components/PremiumBanner";
import { usePlantStore } from "../../../src/store/usePlantStore";
import { PlantRecord } from "../../../src/types/plant";
import {
  formatFriendlyDate,
  getDaysSince,
  getWateringCountdownDetail,
} from "../../../src/utils/dateUtils";
import { getPlantDisplayName } from "../../../src/utils/plantUtils";
import { shadowLayering } from "../../../src/utils/shadows";
import {
  showErrorToast,
  showInfoToast,
  showPremiumToast,
  showSuccessToast,
} from "../../../src/utils/showToasts";

const BackIcon = ArrowLeft as unknown as ComponentType<{ color?: string; size?: number }>;
const EditIcon = Pencil as unknown as ComponentType<{ color?: string; size?: number }>;
const CheckIcon = Check as unknown as ComponentType<{ color?: string; size?: number }>;
const CloseIcon = X as unknown as ComponentType<{ color?: string; size?: number }>;
const DropletIcon = Droplet as unknown as ComponentType<{ color?: string; size?: number }>;
const SproutIcon = Sprout as unknown as ComponentType<{ color?: string; size?: number }>;
const LockIcon = Lock as unknown as ComponentType<{ color?: string; size?: number }>;
const GemIcon = Gem as unknown as ComponentType<{
  color?: string;
  size?: number;
  strokeWidth?: number;
}>;
const SparklesIcon = Sparkles as unknown as ComponentType<{ color?: string; size?: number }>;
const CameraIcon = CameraLucide as unknown as ComponentType<{ color?: string; size?: number }>;
const GalleryIcon = ImageLucide as unknown as ComponentType<{ color?: string; size?: number }>;

export default function PlantDetailsRoute() {
  const router = useRouter();
  const { id } = useLocalSearchParams<{ id: string }>();
  const plantId = Number(id);

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
  const [isWatering, setIsWatering] = useState(false);
  const [isChecking, setIsChecking] = useState(false);
  const [photoSheetOpen, setPhotoSheetOpen] = useState(false);

  const wateringScale = useRef(new Animated.Value(1)).current;

  useEffect(() => {
    if (!hasLoaded) void loadPlants();
  }, [hasLoaded, loadPlants]);

  useEffect(() => {
    if (plant) {
      setNicknameDraft(plant.nickname ?? "");
    }
  }, [plant?.id]);

  if (!plant) {
    return (
      <SafeAreaView edges={["top", "bottom"]} className="flex-1 bg-slate-50">
        <View className="flex-1 items-center justify-center px-6">
          <Text className="text-base text-slate-500">Planta não encontrada.</Text>
          <TouchableOpacity
            className="mt-6 rounded-2xl bg-emerald-600 px-6 py-3"
            onPress={() => router.back()}
          >
            <Text className="text-sm font-semibold text-white">Voltar</Text>
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
      "Planta atualizada",
      trimmed.length === 0 ? "Voltamos ao nome original." : `Apelido: ${trimmed}`
    );
  };

  const handleCancelEdit = () => {
    setNicknameDraft(plant.nickname ?? "");
    setIsEditingName(false);
  };

  const handleWater = async () => {
    if (isWatering) return;
    setIsWatering(true);

    void Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium).catch(() => {});

    Animated.sequence([
      Animated.timing(wateringScale, {
        toValue: 0.96,
        duration: 90,
        useNativeDriver: true,
      }),
      Animated.spring(wateringScale, {
        toValue: 1,
        useNativeDriver: true,
        friction: 4,
      }),
    ]).start();

    try {
      await waterPlant(plant.id);
      showSuccessToast(
        "Planta hidratada com sucesso! 💧",
        `Próxima rega em ${plant.watering_freq_days} dia${
          plant.watering_freq_days > 1 ? "s" : ""
        }.`
      );
    } finally {
      setIsWatering(false);
    }
  };

  const runDiagnosis = async (imageUri: string) => {
    setIsChecking(true);
    try {
      const result = await checkHealth(plant.id, imageUri);
      if (result) {
        showSuccessToast("Diagnóstico concluído", "Novos insights disponíveis.");
      } else {
        showInfoToast(
          "Não foi possível diagnosticar",
          "Tente novamente em instantes."
        );
      }
    } finally {
      setIsChecking(false);
    }
  };

  const handleRequestDiagnosis = () => {
    if (!isPremium) {
      showPremiumToast(
        "Recurso Premium",
        "O diagnóstico por IA faz parte do Premium."
      );
      router.push("/paywall");
      return;
    }
    if (isChecking) return;
    setPhotoSheetOpen(true);
  };

  const handleUseCurrentPhoto = async () => {
    setPhotoSheetOpen(false);
    if (!plant.image_uri) {
      showInfoToast(
        "Sem foto atual",
        "Esta planta não tem foto salva. Escolha 'Nova foto'."
      );
      return;
    }
    await runDiagnosis(plant.image_uri);
  };

  const handleNewPhoto = async () => {
    setPhotoSheetOpen(false);
    try {
      const permission = await ImagePicker.requestCameraPermissionsAsync();
      if (!permission.granted) {
        showInfoToast(
          "Permissão necessária",
          "Precisamos de acesso à câmera para tirar a foto."
        );
        return;
      }

      const result = await ImagePicker.launchCameraAsync({
        mediaTypes: ["images"],
        quality: 0.6,
        allowsEditing: true,
      });

      if (result.canceled) return;
      const uri = result.assets[0]?.uri;
      if (!uri) return;

      // Persiste a nova foto como foto "atual" para futuras consultas.
      await updatePlant(plant.id, { imageUri: uri });
      await runDiagnosis(uri);
    } catch (error) {
      console.error("[plant/details] Falha ao obter nova foto.", error);
      showErrorToast("Erro", "Não foi possível abrir a câmera.");
    }
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
          <View style={shadowLayering.cast}>
            <LinearGradient
              colors={
                countdown.isOverdue
                  ? ["#0284c7", "#0ea5e9"]
                  : countdown.isToday
                  ? ["#0891b2", "#06b6d4"]
                  : ["#065f46", "#0f766e"]
              }
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 1 }}
              style={styles.heroGradient}
            >
              <View className="p-6">
                <View className="flex-row items-center">
                  <View className="rounded-full border border-white/25 bg-white/10 p-3">
                    <DropletIcon color="#ffffff" size={22} />
                  </View>
                  <View className="ml-4 flex-1">
                    <Text className="text-xs font-semibold uppercase tracking-[2px] text-white/80">
                      Próxima rega
                    </Text>
                    <Text className="mt-1 text-2xl font-bold tracking-tight text-white">
                      {countdown.label}
                    </Text>
                  </View>
                </View>

                <Text className="mt-3 text-sm text-white/90">
                  {countdown.helper}
                </Text>

                <View className="mt-5 flex-row items-center justify-between">
                  <View>
                    <Text className="text-[10px] uppercase tracking-widest text-white/70">
                      Última rega
                    </Text>
                    <Text className="mt-1 text-sm font-semibold text-white">
                      {formatFriendlyDate(plant.last_watered_at)}
                    </Text>
                    <Text className="mt-0.5 text-[11px] text-white/75">
                      {daysSinceLastWatering === 0
                        ? "hoje"
                        : `há ${daysSinceLastWatering} dia${
                            daysSinceLastWatering > 1 ? "s" : ""
                          }`}
                    </Text>
                  </View>
                  <View>
                    <Text className="text-[10px] uppercase tracking-widest text-white/70">
                      Frequência
                    </Text>
                    <Text className="mt-1 text-sm font-semibold text-white">
                      A cada {plant.watering_freq_days} dia
                      {plant.watering_freq_days > 1 ? "s" : ""}
                    </Text>
                  </View>
                  <View className="rounded-full bg-white/10 p-3">
                    <SproutIcon color="#ffffff" size={22} />
                  </View>
                </View>
              </View>
            </LinearGradient>
          </View>

          <Animated.View
            style={{ transform: [{ scale: wateringScale }] }}
            className="mt-4"
          >
            <TouchableOpacity
              activeOpacity={0.9}
              onPress={() => void handleWater()}
              disabled={isWatering}
              className={`rounded-2xl p-5 ${
                isWatering ? "bg-emerald-500/70" : "bg-emerald-600"
              }`}
              style={shadowLayering.core}
            >
              <View className="flex-row items-center justify-center gap-2">
                <DropletIcon color="#ffffff" size={18} />
                <Text className="text-center text-base font-bold tracking-tight text-white">
                  {isWatering ? "Registrando..." : "Já reguei"}
                </Text>
              </View>
            </TouchableOpacity>
          </Animated.View>
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
      </ScrollView>

      {/* PHOTO SOURCE SHEET */}
      <PhotoSourceSheet
        visible={photoSheetOpen}
        hasCurrentPhoto={Boolean(plant.image_uri)}
        onUseCurrent={() => void handleUseCurrentPhoto()}
        onNewPhoto={() => void handleNewPhoto()}
        onClose={() => setPhotoSheetOpen(false)}
      />
    </SafeAreaView>
  );
}

/* -----------------------------------------------------------------------------
 * Empty + locked cards
 * ---------------------------------------------------------------------------- */

function EmptyHealthCard() {
  return (
    <View style={shadowLayering.cast}>
      <View
        className="rounded-[28px] border border-slate-100 bg-white p-5"
        style={shadowLayering.core}
      >
        <View className="items-center py-4">
          <View className="rounded-full bg-emerald-50 p-4">
            <SparklesIcon color="#10b981" size={22} />
          </View>
          <Text className="mt-4 text-center text-base font-bold tracking-tight text-slate-900">
            Nenhum diagnóstico ainda
          </Text>
          <Text className="mt-1 text-center text-sm text-slate-500">
            Faça uma consulta de saúde por IA agora.
          </Text>
        </View>
      </View>
    </View>
  );
}

interface BlurredHealthCardProps {
  onUnlock: () => void;
}

function BlurredHealthCard({ onUnlock }: BlurredHealthCardProps) {
  return (
    <View style={shadowLayering.cast}>
      <View
        className="h-[220px] overflow-hidden rounded-[28px] border border-slate-100 bg-white"
        style={shadowLayering.core}
      >
        <View className="p-5">
          <View className="flex-row items-center opacity-80">
            <View className="rounded-full bg-emerald-50 p-3">
              <SparklesIcon color="#10b981" size={20} />
            </View>
            <View className="ml-3 flex-1">
              <View className="h-3 w-24 rounded-full bg-slate-200" />
              <View className="mt-2 h-4 w-48 rounded-full bg-slate-300" />
            </View>
          </View>

          <View className="mt-4 gap-2 opacity-80">
            <View className="h-3 w-full rounded-full bg-slate-200" />
            <View className="h-3 w-11/12 rounded-full bg-slate-200" />
            <View className="h-3 w-10/12 rounded-full bg-slate-200" />
          </View>
        </View>

        <BlurView intensity={40} tint="light" style={StyleSheet.absoluteFill}>
          <View className="flex-1 items-center justify-center px-6">
            <View className="rounded-full border border-emerald-100 bg-white/80 p-4">
              <LockIcon color="#047857" size={22} />
            </View>
            <Text className="mt-4 text-center text-base font-bold tracking-tight text-slate-900">
              Diagnóstico IA bloqueado
            </Text>
            <Text className="mt-1 text-center text-xs text-slate-600">
              Identifique doenças e receba recomendações sob medida.
            </Text>

            <TouchableOpacity
              activeOpacity={0.9}
              onPress={onUnlock}
              className="mt-4 overflow-hidden rounded-2xl"
              style={shadowLayering.core}
            >
              <LinearGradient
                colors={["#059669", "#0f766e"]}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 1 }}
                style={{ borderRadius: 16 }}
              >
                <View className="flex-row items-center gap-2 px-5 py-3">
                  <GemIcon color="#ffffff" size={14} strokeWidth={1.8} />
                  <Text className="text-sm font-bold tracking-tight text-white">
                    Desbloquear Premium
                  </Text>
                </View>
              </LinearGradient>
            </TouchableOpacity>
          </View>
        </BlurView>
      </View>
    </View>
  );
}

/* -----------------------------------------------------------------------------
 * Photo Source Sheet
 * ---------------------------------------------------------------------------- */

interface PhotoSourceSheetProps {
  visible: boolean;
  hasCurrentPhoto: boolean;
  onUseCurrent: () => void;
  onNewPhoto: () => void;
  onClose: () => void;
}

function PhotoSourceSheet({
  visible,
  hasCurrentPhoto,
  onUseCurrent,
  onNewPhoto,
  onClose,
}: PhotoSourceSheetProps) {
  return (
    <Modal
      visible={visible}
      transparent
      animationType="fade"
      onRequestClose={onClose}
    >
      <Pressable
        className="flex-1 bg-black/40"
        onPress={onClose}
      >
        <View className="flex-1 justify-end">
          <Pressable onPress={(e) => e.stopPropagation()}>
            <View
              className="rounded-t-[32px] border-t border-slate-100 bg-white px-5 pb-10 pt-4"
              style={shadowLayering.cast}
            >
              <View className="mb-4 h-1.5 w-10 self-center rounded-full bg-slate-200" />

              <Text className="text-base font-bold tracking-tight text-slate-900">
                Escolha a foto para o diagnóstico
              </Text>
              <Text className="mt-1 text-xs text-slate-500">
                Usamos a imagem para identificar possíveis doenças.
              </Text>

              <Pressable
                onPress={onUseCurrent}
                disabled={!hasCurrentPhoto}
                className={`mt-5 flex-row items-center rounded-2xl border p-4 ${
                  hasCurrentPhoto
                    ? "border-emerald-100 bg-emerald-50/50"
                    : "border-slate-100 bg-slate-50 opacity-60"
                }`}
              >
                <View className="mr-3 rounded-full bg-white p-2.5">
                  <GalleryIcon color="#10b981" size={18} />
                </View>
                <View className="flex-1">
                  <Text className="text-sm font-bold tracking-tight text-slate-900">
                    Usar foto atual
                  </Text>
                  <Text className="mt-0.5 text-xs text-slate-500">
                    {hasCurrentPhoto
                      ? "Última foto cadastrada desta planta."
                      : "Esta planta ainda não tem foto salva."}
                  </Text>
                </View>
              </Pressable>

              <Pressable
                onPress={onNewPhoto}
                className="mt-3 flex-row items-center rounded-2xl border border-slate-100 bg-white p-4"
                style={shadowLayering.core}
              >
                <View className="mr-3 rounded-full bg-emerald-600 p-2.5">
                  <CameraIcon color="#ffffff" size={18} />
                </View>
                <View className="flex-1">
                  <Text className="text-sm font-bold tracking-tight text-slate-900">
                    Nova foto
                  </Text>
                  <Text className="mt-0.5 text-xs text-slate-500">
                    Abrir a câmera e capturar agora.
                  </Text>
                </View>
              </Pressable>

              <Pressable
                onPress={onClose}
                className="mt-4 items-center py-3"
              >
                <Text className="text-xs font-medium text-slate-500">
                  Cancelar
                </Text>
              </Pressable>
            </View>
          </Pressable>
        </View>
      </Pressable>
    </Modal>
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
