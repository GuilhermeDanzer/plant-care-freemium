import { useCallback, useEffect, useMemo, useState } from "react";
import * as ImagePicker from "expo-image-picker";
import { useRouter } from "expo-router";
import { useTranslation } from "react-i18next";
import { usePlantStore } from "@/store/usePlantStore";
import { permissionService } from "@/services/permissionService";
import { PlantRecord, JournalEntry } from "@/types/plant";
import {
  getDaysSince,
  getWateringCountdownDetail,
  type WateringCountdownDetail,
} from "@/utils/dateUtils";
import { getPlantDisplayName } from "@/utils/plantUtils";
import {
  showErrorToast,
  showInfoToast,
  showPremiumToast,
  showSuccessToast,
} from "@/utils/showToasts";

export type PhotoSheetMode = "diagnosis" | "journal" | null;

/**
 * Orquestra todo o estado e a lógica de negócio da tela de detalhes da planta
 * (edição de apelido, diagnóstico por IA, captura de foto/câmera/galeria e
 * diário), deixando a rota `plant/[id].tsx` puramente presentacional.
 */
export function usePlantDetail(plantId: string | undefined) {
  const { t } = useTranslation();
  const router = useRouter();

  const plants = usePlantStore((s) => s.plants);
  const isPremium = usePlantStore((s) => s.isPremium);
  const updatePlant = usePlantStore((s) => s.updatePlant);
  const checkHealth = usePlantStore((s) => s.checkHealth);
  const loadPlants = usePlantStore((s) => s.loadPlants);
  const hasLoaded = usePlantStore((s) => s.hasLoaded);
  const addJournalEntry = usePlantStore((s) => s.addJournalEntry);
  const getJournalForPlant = usePlantStore((s) => s.getJournalForPlant);

  const plant = useMemo<PlantRecord | undefined>(
    () => plants.find((p) => p.id === plantId),
    [plants, plantId]
  );

  const [isEditingName, setIsEditingName] = useState(false);
  const [nicknameDraft, setNicknameDraft] = useState("");
  const [isChecking, setIsChecking] = useState(false);
  const [photoSheetMode, setPhotoSheetMode] = useState<PhotoSheetMode>(null);

  const [journalEntries, setJournalEntries] = useState<JournalEntry[]>([]);
  const [isAddingJournal, setIsAddingJournal] = useState(false);

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

  const displayName = plant ? getPlantDisplayName(plant) : "";
  const countdown: WateringCountdownDetail | null = plant
    ? getWateringCountdownDetail(plant.next_watering_at)
    : null;
  const daysSinceLastWatering = plant ? getDaysSince(plant.last_watered_at) : 0;

  const handleSaveNickname = async () => {
    if (!plant) return;
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
      trimmed.length === 0
        ? t("plantDetail.toastUpdatedOriginal")
        : t("plantDetail.toastUpdatedNickname", { nickname: trimmed })
    );
  };

  const handleCancelEdit = () => {
    if (!plant) return;
    setNicknameDraft(plant.nickname ?? "");
    setIsEditingName(false);
  };

  const startEditingName = () => setIsEditingName(true);

  const runDiagnosis = async (imageUris: string[]) => {
    if (!plant) return;
    setIsChecking(true);
    try {
      const result = await checkHealth(plant.id, imageUris);
      if (result) {
        showSuccessToast(
          t("plantDetail.toastDiagDoneTitle"),
          t("plantDetail.toastDiagDoneBody")
        );
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
    if (!plant) return;
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

  // Commits the picked photo(s) to the store according to the sheet mode:
  // "diagnosis" updates the plant photo and runs the AI check, "journal"
  // appends one journal entry per photo.
  const commitPhotos = async (mode: PhotoSheetMode, uris: string[]) => {
    if (!plant) return;
    if (mode === "diagnosis") {
      await updatePlant(plant.id, { imageUri: uris[0] });
      await runDiagnosis(uris);
    } else if (mode === "journal") {
      setIsAddingJournal(true);
      for (const uri of uris) {
        await addJournalEntry(plant.id, uri, undefined);
      }
      await loadJournal();
      setIsAddingJournal(false);
      showSuccessToast(
        t("plantDetail.journalSuccessTitle"),
        t("plantDetail.journalSuccessBody")
      );
    }
  };

  const handleNewPhoto = async () => {
    if (!plant) return;
    const mode = photoSheetMode;
    setPhotoSheetMode(null);
    try {
      const permission = await permissionService.ensureCameraPermission();
      if (permission !== "granted") {
        if (permission === "denied") {
          showInfoToast(
            t("plantDetail.toastPermNeededTitle"),
            t("plantDetail.toastPermCamBody")
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
      await commitPhotos(mode, [result.assets[0].uri]);
    } catch (error) {
      console.error("[plant/details] Falha ao obter nova foto.", error);
      setIsAddingJournal(false);
      showErrorToast(t("common.error"), t("plantDetail.toastCamErrorBody"));
    }
  };

  const handleGalleryUpload = async () => {
    if (!plant) return;
    const mode = photoSheetMode;
    setPhotoSheetMode(null);
    try {
      const permission = await permissionService.ensureMediaLibraryPermission();
      if (permission !== "granted") {
        if (permission === "denied") {
          showInfoToast(
            t("plantDetail.toastPermNeededTitle"),
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
      await commitPhotos(mode, result.assets.map((a) => a.uri));
    } catch (error) {
      console.error(
        "[plant/details] Falha ao selecionar imagem da galeria.",
        error
      );
      setIsAddingJournal(false);
      showErrorToast(t("common.error"), t("identify.errorGalleryBody"));
    }
  };

  const handleAddJournalEntry = () => {
    setPhotoSheetMode("journal");
  };

  return {
    plant,
    displayName,
    countdown,
    daysSinceLastWatering,
    isPremium,
    isEditingName,
    nicknameDraft,
    setNicknameDraft,
    startEditingName,
    handleSaveNickname,
    handleCancelEdit,
    isChecking,
    handleRequestDiagnosis,
    photoSheetMode,
    setPhotoSheetMode,
    handleUseCurrentPhoto,
    handleNewPhoto,
    handleGalleryUpload,
    journalEntries,
    isAddingJournal,
    handleAddJournalEntry,
  };
}
