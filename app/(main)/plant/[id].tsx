import { useLocalSearchParams, useRouter } from "expo-router";
import { useTranslation } from "react-i18next";
import { ScrollView, StyleSheet, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { PremiumBanner } from "@/components/PremiumBanner";
import {
  JournalTimeline,
  PhotoSourceSheet,
  PlantDetailHeader,
  PlantHealthSection,
  PlantNameSection,
  PlantNotFound,
  WateringHeroCard,
} from "@/components/plant-detail";
import { WateringButton } from "@/components/WateringButton";
import { usePlantDetail } from "@/hooks/usePlantDetail";

export default function PlantDetailsRoute() {
  const { t } = useTranslation();
  const router = useRouter();
  const { id } = useLocalSearchParams<{ id: string }>();

  const {
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
  } = usePlantDetail(id);

  if (!plant || !countdown) {
    return <PlantNotFound onBack={() => router.back()} />;
  }

  return (
    <SafeAreaView edges={["top", "bottom"]} className="flex-1 bg-slate-50">
      <ScrollView
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        <PlantDetailHeader
          isEditing={isEditingName}
          onBack={() => router.back()}
          onEdit={startEditingName}
        />

        <PlantNameSection
          isEditing={isEditingName}
          displayName={displayName}
          scientificName={plant.scientific_name}
          originalName={plant.original_name}
          nickname={plant.nickname}
          draft={nicknameDraft}
          onChangeDraft={setNicknameDraft}
          onStartEdit={startEditingName}
          onCancelEdit={handleCancelEdit}
          onSave={() => void handleSaveNickname()}
        />

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
        <PlantHealthSection
          isPremium={isPremium}
          health={plant.health_data}
          lastCheckedAt={plant.last_health_check_at}
          isChecking={isChecking}
          onRequestDiagnosis={handleRequestDiagnosis}
          onUnlockPremium={() => router.push("/paywall")}
        />

        {!isPremium ? (
          <View className="mt-8 px-2">
            <PremiumBanner
              title={t("plantDetail.bannerPremiumTitle")}
              subtitle={t("plantDetail.bannerPremiumSubtitle")}
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
});
