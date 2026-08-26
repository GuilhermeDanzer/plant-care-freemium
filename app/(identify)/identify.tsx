import * as ImagePicker from "expo-image-picker";
import { useRouter } from "expo-router";
import { type ComponentType } from "react";
import { useTranslation } from "react-i18next";
import { ArrowLeft, Camera, Image as ImageIcon } from "lucide-react-native";
import { Text, TouchableOpacity, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useIdentifyPlant } from "@/hooks/useIdentifyPlant";
import { usePlantStore } from "@/store/usePlantStore";
import { FREE_PLANT_LIMIT } from "@/utils/constants";
import { permissionService } from "@/services/permissionService";
import { showErrorToast, showInfoToast } from "@/utils/showToasts";

const CameraIcon = Camera as unknown as ComponentType<{ color?: string; size?: number }>;
const GalleryIcon = ImageIcon as unknown as ComponentType<{ color?: string; size?: number }>;

export default function IdentifyRoute() {
  const { t } = useTranslation();
  const router = useRouter();
  const identifyMutation = useIdentifyPlant();
  const plants = usePlantStore((s) => s.plants);
  const isPremium = usePlantStore((s) => s.isPremium);
  const atFreeLimit = !isPremium && plants.length >= FREE_PLANT_LIMIT;

  const identifyFromUris = async (imageUris?: string[]) => {
    if (!imageUris || imageUris.length === 0) return;

    const identifiedPlant = await identifyMutation.mutateAsync(imageUris);
    router.push({
      pathname: "/(identify)/setup",
      params: {
        identifiedPlant: JSON.stringify(identifiedPlant),
        imageUri: imageUris[0],
      },
    });
  };

  const handleCamera = async () => {
    if (atFreeLimit) return;

    try {
      const permission = await permissionService.ensureCameraPermission();
      if (permission !== "granted") {
        if (permission === "denied") {
          showInfoToast(
            t("identify.permissionNeededTitle"),
            t("identify.permissionCameraBody")
          );
        }
        return;
      }

      const result = await ImagePicker.launchCameraAsync({
        mediaTypes: ["images"],
        quality: 0.6,
        allowsEditing: false,
      });

      if (result.canceled || !result.assets[0]?.uri) return;
      await identifyFromUris([result.assets[0].uri]);
    } catch (error) {
      console.error("[identify] Falha ao capturar imagem.", error);
      showErrorToast(t("identify.errorTitle"), t("identify.errorCameraBody"));
    }
  };

  const handleGalleryUpload = async () => {
    if (atFreeLimit) return;

    try {
      const permission = await permissionService.ensureMediaLibraryPermission();
      if (permission !== "granted") {
        if (permission === "denied") {
          showInfoToast(
            t("identify.permissionNeededTitle"),
            t("identify.permissionGalleryBody")
          );
        }
        return;
      }

      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ["images"],
        quality: 0.6,
        allowsMultipleSelection: true,
      });

      if (result.canceled) return;
      const uris = result.assets.map((a) => a.uri);
      await identifyFromUris(uris);
    } catch (error) {
      console.error("[identify] Falha ao selecionar imagem da galeria.", error);
      showErrorToast(t("identify.errorTitle"), t("identify.errorGalleryBody"));
    }
  };

  return (
    <SafeAreaView edges={["top", "bottom"]} className="flex-1 bg-slate-50">
      <View className="flex-row items-center px-6 pt-4">
        <TouchableOpacity
          onPress={() => router.back()}
          className="h-10 w-10 items-center justify-center rounded-full bg-white shadow-sm"
          style={{ elevation: 4 }}
        >
          <ArrowLeft color="#0f172a" size={20} />
        </TouchableOpacity>
      </View>
      <View className="flex-1 justify-center p-6">
        <View className="rounded-3xl bg-white p-6 shadow-lg" style={{ elevation: 8 }}>
          <View className="items-center">
            <Text className="text-center text-2xl font-bold text-slate-800">
              {t("identify.title")}
            </Text>
            <Text className="mt-3 text-center text-sm text-slate-500">
              {t("identify.subtitle")}
            </Text>
          </View>

          <TouchableOpacity
            className={`mt-8 w-full rounded-2xl p-4 ${atFreeLimit ? "bg-slate-300" : "bg-emerald-600"}`}
            onPress={() => void handleCamera()}
            disabled={identifyMutation.isPending || atFreeLimit}
          >
            <View className="flex-row items-center justify-center gap-2">
              <CameraIcon color={atFreeLimit ? "#475569" : "#ffffff"} size={18} />
              <Text
                className={`text-center text-base font-semibold ${atFreeLimit ? "text-slate-600" : "text-white"}`}
              >
                {identifyMutation.isPending ? t("identify.identifying") : t("identify.takePhotoBtn")}
              </Text>
            </View>
          </TouchableOpacity>

          <TouchableOpacity
            className="mt-4 w-full rounded-2xl border border-emerald-200 bg-emerald-50 p-4"
            onPress={() => void handleGalleryUpload()}
            disabled={identifyMutation.isPending || atFreeLimit}
          >
            <View className="flex-row items-center justify-center gap-2">
              <GalleryIcon color="#10b981" size={18} />
              <Text className="text-center text-base font-semibold text-emerald-700">
                {t("identify.galleryBtn")}
              </Text>
            </View>
          </TouchableOpacity>

          {atFreeLimit ? (
            <Text className="mt-4 text-center text-sm text-slate-500">
              {t("identify.limitReached")}
            </Text>
          ) : null}
        </View>
      </View>
    </SafeAreaView>
  );
}
