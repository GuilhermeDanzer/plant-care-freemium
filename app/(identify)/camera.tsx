import * as ImagePicker from "expo-image-picker";
import { useRouter } from "expo-router";
import { type ComponentType, useState } from "react";
import { ArrowLeft, Camera, Image as ImageIcon, X, Sparkles, Plus } from "lucide-react-native";
import { useTranslation } from "react-i18next";
import {
  ActivityIndicator,
  Dimensions,
  Image,
  Modal,
  Pressable,
  ScrollView,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useIdentifyPlant } from "@/hooks/useIdentifyPlant";
import { usePlantStore } from "@/store/usePlantStore";
import { checkScanBalance } from "@/utils/checkScanBalance";
import { showErrorToast, showInfoToast } from "@/utils/showToasts";

const CameraIcon = Camera as unknown as ComponentType<{ color?: string; size?: number }>;
const GalleryIcon = ImageIcon as unknown as ComponentType<{ color?: string; size?: number }>;
const SparklesIcon = Sparkles as unknown as ComponentType<{ color?: string; size?: number }>;
const PlusIcon = Plus as unknown as ComponentType<{ color?: string; size?: number }>;

const MAX_PHOTOS = 5;
const THUMB_SIZE = (Dimensions.get("window").width - 48 - 12 * 4) / 4; // 4 thumbs per row with padding

export default function CameraRoute() {
  const { t } = useTranslation();
  const router = useRouter();
  const identifyMutation = useIdentifyPlant();

  const isPremium = usePlantStore((s) => s.isPremium);
  const totalFreeScansUsed = usePlantStore((s) => s.totalFreeScansUsed);
  const monthlyPremiumScansUsed = usePlantStore((s) => s.monthlyPremiumScansUsed);

  const [photos, setPhotos] = useState<string[]>([]);
  const [showPaywallModal, setShowPaywallModal] = useState(false);
  const [paywallReason, setPaywallReason] = useState<string>("");

  const checkBalance = (): boolean => {
    const balance = checkScanBalance({ isPremium, totalFreeScansUsed, monthlyPremiumScansUsed });
    if (!balance.hasBalance) {
      setPaywallReason(balance.reason || "OUT_OF_FREE_SCANS");
      setShowPaywallModal(true);
      return false;
    }
    return true;
  };

  const addFromCamera = async () => {
    if (photos.length >= MAX_PHOTOS) {
      showInfoToast(t("identify.maxPhotosTitle", "Limit reached"), t("identify.maxPhotosBody", `You can add up to ${MAX_PHOTOS} photos.`));
      return;
    }
    try {
      const permission = await ImagePicker.requestCameraPermissionsAsync();
      if (!permission.granted) {
        showInfoToast(t("identify.permissionNeededTitle"), t("identify.permissionCameraBody"));
        return;
      }
      // IMPORTANT: Do NOT show/hide any Modal before this call.
      // iOS cannot present a native camera modal while a React Modal is animating out.
      const result = await ImagePicker.launchCameraAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.Images,
        quality: 0.6,
        allowsEditing: false,
      });
      if (result.canceled || !result.assets[0]?.uri) return;
      setPhotos((prev) => [...prev, result.assets[0].uri].slice(0, MAX_PHOTOS));
    } catch (error) {
      console.error("[camera] addFromCamera failed:", error);
      showErrorToast(t("identify.errorTitle"), t("identify.errorCameraBody"));
    }
  };

  const addFromGallery = async () => {
    if (photos.length >= MAX_PHOTOS) {
      showInfoToast(t("identify.maxPhotosTitle", "Limit reached"), t("identify.maxPhotosBody", `You can add up to ${MAX_PHOTOS} photos.`));
      return;
    }
    try {
      const permission = await ImagePicker.requestMediaLibraryPermissionsAsync();
      if (!permission.granted) {
        showInfoToast(t("identify.permissionNeededTitle"), t("identify.permissionGalleryBody"));
        return;
      }
      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.Images,
        quality: 0.6,
        allowsMultipleSelection: true,
        selectionLimit: MAX_PHOTOS - photos.length,
      });
      if (result.canceled || result.assets.length === 0) return;
      setPhotos((prev) => [...prev, ...result.assets.map((a) => a.uri)].slice(0, MAX_PHOTOS));
    } catch (error) {
      console.error("[camera] addFromGallery failed:", error);
      showErrorToast(t("identify.errorTitle"), t("identify.errorGalleryBody"));
    }
  };

  const removePhoto = (index: number) => {
    setPhotos((prev) => prev.filter((_, i) => i !== index));
  };

  const handleIdentify = async () => {
    if (photos.length === 0) {
      showInfoToast(t("identify.noPhotosTitle", "No photos"), t("identify.noPhotosBody", "Add at least one photo to identify."));
      return;
    }
    if (!checkBalance()) return;

    try {
      const scanData = await identifyMutation.mutateAsync(photos);
      router.push({
        pathname: "/(identify)/scan-result",
        params: { scanData: JSON.stringify(scanData), imageUri: photos[0] },
      });
    } catch (error) {
      console.error("[camera] handleIdentify failed:", error);
      showErrorToast(t("identify.errorTitle"), t("identify.errorCameraBody"));
    }
  };

  return (
    <SafeAreaView edges={["top", "bottom"]} className="flex-1 bg-slate-50">
      {/* Header */}
      <View className="flex-row items-center px-6 pt-2 pb-4">
        <TouchableOpacity
          onPress={() => router.back()}
          className="h-10 w-10 items-center justify-center rounded-full bg-white shadow-sm"
          style={{ elevation: 4 }}
          testID="camera-back-btn"
        >
          <ArrowLeft color="#0f172a" size={20} />
        </TouchableOpacity>
        <Text className="ml-4 text-lg font-bold text-slate-900">{t("identify.title")}</Text>
      </View>

      <ScrollView className="flex-1" contentContainerStyle={{ paddingHorizontal: 24, paddingBottom: 32 }} showsVerticalScrollIndicator={false}>
        {/* Tip banner */}
        <View className="mb-5 flex-row items-start rounded-2xl bg-amber-50 border border-amber-100 p-4">
          <SparklesIcon color="#d97706" size={16} />
          <Text className="ml-2 flex-1 text-xs leading-5 text-amber-700">
            {t("identify.tipGoodLighting", "Good lighting, simple background, focus on one leaf or flower. The more angles, the better!")}
          </Text>
        </View>

        {/* Photos grid */}
        {photos.length > 0 && (
          <View className="mb-5">
            <Text className="mb-3 text-sm font-semibold text-slate-600">
              {t("identify.photosLabel", "Photos")} ({photos.length}/{MAX_PHOTOS})
            </Text>
            <View className="flex-row flex-wrap gap-3">
              {photos.map((uri, index) => (
                <View key={`${uri}-${index}`} style={{ width: THUMB_SIZE, height: THUMB_SIZE }}>
                  <Image
                    source={{ uri }}
                    style={{ width: THUMB_SIZE, height: THUMB_SIZE, borderRadius: 12 }}
                    resizeMode="cover"
                  />
                  {/* Remove button */}
                  <Pressable
                    onPress={() => removePhoto(index)}
                    style={{
                      position: "absolute",
                      top: -6,
                      right: -6,
                      width: 22,
                      height: 22,
                      borderRadius: 11,
                      backgroundColor: "#ef4444",
                      alignItems: "center",
                      justifyContent: "center",
                    }}
                    testID={`camera-remove-photo-${index}`}
                  >
                    <X color="#ffffff" size={12} />
                  </Pressable>
                </View>
              ))}

              {/* Add more placeholder */}
              {photos.length < MAX_PHOTOS && (
                <TouchableOpacity
                  onPress={() => void addFromCamera()}
                  style={{ width: THUMB_SIZE, height: THUMB_SIZE }}
                  className="items-center justify-center rounded-xl border-2 border-dashed border-slate-200 bg-slate-50"
                  testID="camera-add-more-btn"
                >
                  <PlusIcon color="#94a3b8" size={22} />
                </TouchableOpacity>
              )}
            </View>
          </View>
        )}

        {/* Empty state when no photos */}
        {photos.length === 0 && (
          <View className="mb-5 items-center rounded-3xl border-2 border-dashed border-slate-200 bg-white py-12">
            <CameraIcon color="#94a3b8" size={40} />
            <Text className="mt-4 text-base font-semibold text-slate-400">
              {t("identify.noPhotosPlaceholder", "No photos yet")}
            </Text>
            <Text className="mt-1 text-xs text-slate-300">
              {t("identify.noPhotosPlaceholderSub", `Add up to ${MAX_PHOTOS} photos below`)}
            </Text>
          </View>
        )}

        {/* Add photo buttons */}
        <View className="gap-3">
          <TouchableOpacity
            className={`w-full flex-row items-center justify-center gap-2 rounded-2xl p-4 ${photos.length >= MAX_PHOTOS ? "bg-slate-200" : "bg-emerald-600"}`}
            onPress={() => void addFromCamera()}
            disabled={photos.length >= MAX_PHOTOS || identifyMutation.isPending}
            testID="camera-take-photo-btn"
          >
            <CameraIcon color={photos.length >= MAX_PHOTOS ? "#94a3b8" : "#ffffff"} size={18} />
            <Text className={`text-base font-semibold ${photos.length >= MAX_PHOTOS ? "text-slate-400" : "text-white"}`}>
              {t("identify.takePhotoBtn")}
            </Text>
          </TouchableOpacity>

          <TouchableOpacity
            className={`w-full flex-row items-center justify-center gap-2 rounded-2xl border p-4 ${photos.length >= MAX_PHOTOS ? "border-slate-100 bg-slate-50" : "border-emerald-200 bg-emerald-50"}`}
            onPress={() => void addFromGallery()}
            disabled={photos.length >= MAX_PHOTOS || identifyMutation.isPending}
            testID="camera-gallery-btn"
          >
            <GalleryIcon color={photos.length >= MAX_PHOTOS ? "#94a3b8" : "#10b981"} size={18} />
            <Text className={`text-base font-semibold ${photos.length >= MAX_PHOTOS ? "text-slate-400" : "text-emerald-700"}`}>
              {t("identify.galleryBtn")}
            </Text>
          </TouchableOpacity>
        </View>

        {/* Identify button — only shown when at least 1 photo is ready */}
        {photos.length > 0 && (
          <TouchableOpacity
            className={`mt-6 w-full flex-row items-center justify-center gap-2 rounded-2xl p-5 shadow-lg ${identifyMutation.isPending ? "bg-emerald-400" : "bg-slate-900"}`}
            onPress={() => void handleIdentify()}
            disabled={identifyMutation.isPending}
            testID="camera-identify-btn"
          >
            {identifyMutation.isPending ? (
              <ActivityIndicator color="#ffffff" size="small" />
            ) : (
              <SparklesIcon color="#ffffff" size={18} />
            )}
            <Text className="text-base font-bold text-white">
              {identifyMutation.isPending
                ? t("identify.identifying")
                : t("identify.identifyBtn", `Identify ${photos.length === 1 ? "1 Photo" : `${photos.length} Photos`}`)}
            </Text>
          </TouchableOpacity>
        )}
      </ScrollView>

      {/* Paywall Modal */}
      <Modal visible={showPaywallModal} transparent animationType="slide" onRequestClose={() => setShowPaywallModal(false)}>
        <View className="flex-1 bg-black/50 justify-end">
          <View className="bg-white p-6 rounded-t-3xl items-center">
            <Text className="text-2xl font-bold text-slate-800 mb-2">
              {t("identify.scanLimitTitle", "Scan Limit Reached")}
            </Text>
            <Text className="text-center text-slate-500 mb-8 px-4">
              {paywallReason === "OUT_OF_FREE_SCANS"
                ? t("identify.scanLimitFreeBody")
                : t("identify.scanLimitPremiumBody")}
            </Text>
            <TouchableOpacity
              className="w-full bg-emerald-600 py-4 rounded-xl items-center mb-3"
              onPress={() => { setShowPaywallModal(false); router.push("/paywall"); }}
              testID="camera-paywall-upgrade-btn"
            >
              <Text className="text-white font-bold text-lg">{t("identify.viewPremiumBtn")}</Text>
            </TouchableOpacity>
            <TouchableOpacity onPress={() => setShowPaywallModal(false)} testID="camera-paywall-cancel-btn">
              <Text className="text-slate-400 font-semibold mt-2">{t("common.cancel")}</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>
    </SafeAreaView>
  );
}
