import { Modal, Pressable, Text, TouchableOpacity, View } from "react-native";
import { CameraIcon, GalleryIcon } from "@/components/icons";
import { shadowLayering } from "@/utils/shadows";
import { useTranslation } from "react-i18next";

export interface PhotoSourceSheetProps {
  visible: boolean;
  hasCurrentPhoto: boolean;
  hideCurrentPhoto?: boolean;
  onUseCurrent: () => void;
  onNewPhoto: () => void;
  onGalleryUpload: () => void;
  onClose: () => void;
}

/**
 * Bottom sheet modal that lets the user choose between using the plant's
 * existing saved photo or taking a new one for the health diagnosis.
 */
export function PhotoSourceSheet({
  visible,
  hasCurrentPhoto,
  hideCurrentPhoto,
  onUseCurrent,
  onNewPhoto,
  onGalleryUpload,
  onClose,
}: PhotoSourceSheetProps) {
  const { t } = useTranslation();
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
                {t("plantDetail.photoSheetTitle")}
              </Text>
              <Text className="mt-1 text-xs text-slate-500">
                {t("plantDetail.photoSheetSubtitle")}
              </Text>

              {!hideCurrentPhoto && (
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
                      {t("plantDetail.photoSheetUseCurrentBtn")}
                    </Text>
                    <Text className="mt-0.5 text-xs text-slate-500">
                      {hasCurrentPhoto
                        ? t("plantDetail.photoSheetCurrentDescHas")
                        : t("plantDetail.photoSheetCurrentDescNo")}
                    </Text>
                  </View>
                </Pressable>
              )}

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
                    {t("plantDetail.photoSheetNewPhotoBtn")}
                  </Text>
                  <Text className="mt-0.5 text-xs text-slate-500">
                    {t("plantDetail.photoSheetNewPhotoDesc")}
                  </Text>
                </View>
              </Pressable>

              <Pressable
                onPress={onGalleryUpload}
                className="mt-3 flex-row items-center rounded-2xl border border-slate-100 bg-white p-4"
                style={shadowLayering.core}
              >
                <View className="mr-3 rounded-full bg-blue-500 p-2.5">
                  <GalleryIcon color="#ffffff" size={18} />
                </View>
                <View className="flex-1">
                  <Text className="text-sm font-bold tracking-tight text-slate-900">
                    {t("identify.galleryBtn")}
                  </Text>
                  <Text className="mt-0.5 text-xs text-slate-500">
                    {t("identify.subtitle")}
                  </Text>
                </View>
              </Pressable>

              <Pressable
                onPress={onClose}
                className="mt-4 items-center py-3"
              >
                <Text className="text-xs font-medium text-slate-500">
                  {t("plantDetail.photoSheetCancelBtn")}
                </Text>
              </Pressable>
            </View>
          </Pressable>
        </View>
      </Pressable>
    </Modal>
  );
}
