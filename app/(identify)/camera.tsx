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
const ImageHintIcon = ImageIcon as unknown as ComponentType<{ color?: string; size?: number }>;

export default function CameraRoute() {
  const router = useRouter();
  const identifyMutation = useIdentifyPlant();
  const plants = usePlantStore((s) => s.plants);
  const atFreeLimit = plants.length >= FREE_PLANT_LIMIT;

  const handleIdentify = async () => {
    if (atFreeLimit) return;

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

    const selectedImageUri = result.assets[0]?.uri;
    if (!selectedImageUri) return;

    const identifiedPlant = await identifyMutation.mutateAsync(selectedImageUri);
    router.push({
      pathname: "/(identify)/setup",
      params: { identifiedPlant: JSON.stringify(identifiedPlant) },
    });
  };

  const openCamera = async () => {
    try {
      await handleIdentify();
    } catch (error) {
      console.error("[camera] Falha ao capturar ou identificar imagem.", error);
      showErrorToast("Erro", "Não foi possível tirar a foto e identificar a planta.");
    }
  };

  return (
    <SafeAreaView edges={["top", "bottom"]} className="flex-1 bg-slate-50">
      <View className="flex-1 justify-center p-6">
        <View className="rounded-3xl bg-white p-6 shadow-lg" style={{ elevation: 8 }}>
          <View className="items-center">
            <View className="mb-5 rounded-full bg-emerald-50 p-4">
              <CameraIcon color="#10b981" size={28} />
            </View>
            <Text className="text-center text-2xl font-bold text-slate-800">
              Tire uma foto da sua planta
            </Text>
            <Text className="mt-3 text-center text-sm text-slate-500">
              Use a camera do app para capturar a planta e identificar cuidados em segundos.
            </Text>
          </View>

          <TouchableOpacity
            className={`mt-8 w-full rounded-2xl p-4 ${atFreeLimit ? "bg-slate-300" : "bg-emerald-600"}`}
            onPress={() => void openCamera()}
            disabled={identifyMutation.isPending || atFreeLimit}
          >
            <View className="flex-row items-center justify-center gap-2">
              <CameraIcon color={atFreeLimit ? "#475569" : "#ffffff"} size={18} />
              <Text
                className={`text-center text-base font-semibold ${atFreeLimit ? "text-slate-600" : "text-white"}`}
              >
                {identifyMutation.isPending ? "Identificando..." : "Abrir camera"}
              </Text>
            </View>
          </TouchableOpacity>

          <View className="mt-4 flex-row items-center justify-center">
            <ImageHintIcon color="#64748b" size={16} />
            <Text className="ml-2 text-xs text-slate-500">
              Enquadre folhas e caule para obter melhor resultado.
            </Text>
          </View>
        </View>
      </View>
    </SafeAreaView>
  );
}
