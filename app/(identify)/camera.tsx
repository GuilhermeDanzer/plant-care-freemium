import * as ImagePicker from "expo-image-picker";
import { useRouter } from "expo-router";
import { type ComponentType, useState, useEffect } from "react";
import { Camera, Image as ImageIcon } from "lucide-react-native";
import { Text, TouchableOpacity, View, Modal } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useIdentifyPlant } from "../../src/hooks/useIdentifyPlant";
import { usePlantStore } from "../../src/store/usePlantStore";
import { checkScanBalance } from "../../src/utils/checkScanBalance";
import { showErrorToast, showInfoToast } from "../../src/utils/showToasts";

const CameraIcon = Camera as unknown as ComponentType<{ color?: string; size?: number }>;
const ImageHintIcon = ImageIcon as unknown as ComponentType<{ color?: string; size?: number }>;

export default function CameraRoute() {
  const router = useRouter();
  const identifyMutation = useIdentifyPlant();
  
  const isPremium = usePlantStore((s) => s.isPremium);
  const totalFreeScansUsed = usePlantStore((s) => s.totalFreeScansUsed);
  const monthlyPremiumScansUsed = usePlantStore((s) => s.monthlyPremiumScansUsed);
  
  const [showOverlay, setShowOverlay] = useState(false);
  const [showPaywallModal, setShowPaywallModal] = useState(false);
  const [paywallReason, setPaywallReason] = useState<string>("");

  const handleIdentify = async () => {
    // Ticket 2: Check AI Scan Balance
    const balance = checkScanBalance({
      isPremium,
      totalFreeScansUsed,
      monthlyPremiumScansUsed,
    });
    
    if (!balance.hasBalance) {
      setPaywallReason(balance.reason || "OUT_OF_FREE_SCANS");
      setShowPaywallModal(true);
      return;
    }

    const permission = await ImagePicker.requestCameraPermissionsAsync();
    if (!permission.granted) {
      showInfoToast(
        "Permissão necessária",
        "Precisamos de acesso à câmera para tirar a foto."
      );
      return;
    }

    // Ticket 1: 3-second overlay before camera
    setShowOverlay(true);
    await new Promise((resolve) => setTimeout(resolve, 3000));
    setShowOverlay(false);

    const result = await ImagePicker.launchCameraAsync({
      mediaTypes: ["images"],
      quality: 0.6,
      allowsEditing: true,
    });

    if (result.canceled) return;

    const selectedImageUri = result.assets[0]?.uri;
    if (!selectedImageUri) return;

    const scanData = await identifyMutation.mutateAsync([selectedImageUri]);
    
    // Ticket 1: Route to Scan Result UX
    router.push({
      pathname: "/(identify)/scan-result",
      params: { 
        scanData: JSON.stringify(scanData),
        imageUri: selectedImageUri
      },
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
        
        {/* Ticket 1: 3-second Overlay */}
        <Modal visible={showOverlay} transparent animationType="fade">
          <View className="flex-1 bg-black/80 items-center justify-center p-8">
            <View className="bg-white p-6 rounded-2xl w-full items-center shadow-xl">
              <CameraIcon color="#10b981" size={40} />
              <Text className="text-xl font-bold text-slate-800 mt-4 mb-2 text-center">
                For best results
              </Text>
              <Text className="text-center text-slate-600 text-base">
                Good lighting, simple background, focus on one leaf/flower.
              </Text>
            </View>
          </View>
        </Modal>

        {/* Ticket 2: Paywall Modal */}
        <Modal visible={showPaywallModal} transparent animationType="slide">
          <View className="flex-1 bg-black/50 justify-end">
            <View className="bg-white p-6 rounded-t-3xl h-1/2 justify-center items-center shadow-xl">
              <Text className="text-2xl font-bold text-slate-800 mb-2">Scan Limit Reached</Text>
              <Text className="text-center text-slate-500 mb-8 px-4">
                {paywallReason === "OUT_OF_FREE_SCANS" 
                  ? "You have used your free Golden Ticket scan! Upgrade to Premium for 10 scans per month." 
                  : "You have reached your 10 monthly AI scans. Wait until next month!"}
              </Text>
              
              <TouchableOpacity 
                className="w-full bg-emerald-600 py-4 rounded-xl items-center mb-3"
                onPress={() => {
                  setShowPaywallModal(false);
                  router.push("/paywall");
                }}
              >
                <Text className="text-white font-bold text-lg">View Premium Plans</Text>
              </TouchableOpacity>
              
              <TouchableOpacity onPress={() => setShowPaywallModal(false)}>
                <Text className="text-slate-400 font-semibold mt-2">Cancel</Text>
              </TouchableOpacity>
            </View>
          </View>
        </Modal>

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
            className="mt-8 w-full rounded-2xl p-4 bg-emerald-600"
            onPress={() => void openCamera()}
            disabled={identifyMutation.isPending}
          >
            <View className="flex-row items-center justify-center gap-2">
              <CameraIcon color="#ffffff" size={18} />
              <Text className="text-center text-base font-semibold text-white">
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
