import * as ImagePicker from "expo-image-picker";
import { useRouter } from "expo-router";
import { type ComponentType } from "react";
import { Camera, Image as ImageIcon } from "lucide-react-native";
import { Text, TouchableOpacity, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useIdentifyPlant } from "../../src/hooks/useIdentifyPlant";
import { usePlantStore } from "../../src/store/usePlantStore";
import { FREE_PLANT_LIMIT } from "../../src/utils/constants";
import { showErrorToast, showInfoToast } from "../../src/utils/showToasts";

const CameraIcon = Camera as unknown as ComponentType<{ color?: string; size?: number }>;
const GalleryIcon = ImageIcon as unknown as ComponentType<{ color?: string; size?: number }>;

export default function IdentifyRoute() {
  const router = useRouter();
  const identifyMutation = useIdentifyPlant();
  const plants = usePlantStore((s) => s.plants);
  const isPremium = usePlantStore((s) => s.isPremium);
  const atFreeLimit = !isPremium && plants.length >= FREE_PLANT_LIMIT;

  const identifyFromUri = async (imageUri?: string) => {
    if (!imageUri) return;

    const identifiedPlant = await identifyMutation.mutateAsync(imageUri);
    router.push({
      pathname: "/(identify)/setup",
      params: {
        identifiedPlant: JSON.stringify(identifiedPlant),
        imageUri,
      },
    });
  };

  const handleCamera = async () => {
    if (atFreeLimit) return;

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
      await identifyFromUri(result.assets[0]?.uri);
    } catch (error) {
      console.error("[identify] Falha ao capturar imagem.", error);
      showErrorToast("Erro", "Não foi possível tirar a foto da planta.");
    }
  };

  const handleGalleryUpload = async () => {
    if (atFreeLimit) return;

    try {
      const permission = await ImagePicker.requestMediaLibraryPermissionsAsync();
      if (!permission.granted) {
        showInfoToast(
          "Permissão necessária",
          "Precisamos de acesso à galeria para escolher a foto."
        );
        return;
      }

      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ["images"],
        quality: 0.6,
        allowsEditing: true,
      });

      if (result.canceled) return;
      await identifyFromUri(result.assets[0]?.uri);
    } catch (error) {
      console.error("[identify] Falha ao selecionar imagem da galeria.", error);
      showErrorToast("Erro", "Não foi possível selecionar a foto da galeria.");
    }
  };

  return (
    <SafeAreaView edges={["top", "bottom"]} className="flex-1 bg-slate-50">
      <View className="flex-1 justify-center p-6">
        <View className="rounded-3xl bg-white p-6 shadow-lg" style={{ elevation: 8 }}>
          <View className="items-center">
            <Text className="text-center text-2xl font-bold text-slate-800">
              Como voce quer identificar?
            </Text>
            <Text className="mt-3 text-center text-sm text-slate-500">
              Tire uma foto agora ou escolha uma imagem salva no celular.
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
                {identifyMutation.isPending ? "Identificando..." : "Tirar foto"}
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
                Escolher da galeria
              </Text>
            </View>
          </TouchableOpacity>

          {atFreeLimit ? (
            <Text className="mt-4 text-center text-sm text-slate-500">
              Limite do plano gratis atingido.
            </Text>
          ) : null}
        </View>
      </View>
    </SafeAreaView>
  );
}
