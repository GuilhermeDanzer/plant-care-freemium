import { useRouter } from "expo-router";
import { type ComponentType, useEffect, useState } from "react";
import { Sprout } from "lucide-react-native";
import {
  FlatList,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
  type ListRenderItemInfo,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { ActionButton } from "../../src/components/ActionButton";
import { PlantCard } from "../../src/components/PlantCard";
import { PremiumBanner } from "../../src/components/PremiumBanner";
import { usePlantStore } from "../../src/store/usePlantStore";
import { PlantRecord } from "../../src/types/plant";
import { FREE_PLANT_LIMIT } from "../../src/utils/constants";
import { showInfoToast, showSuccessToast } from "../../src/utils/showToasts";

const SproutIcon = Sprout as unknown as ComponentType<{ color?: string; size?: number }>;

export default function MainIndexRoute() {
  const router = useRouter();
  const plants = usePlantStore((s) => s.plants);
  const loadPlants = usePlantStore((s) => s.loadPlants);
  const isLoading = usePlantStore((s) => s.isLoading);
  const hasLoaded = usePlantStore((s) => s.hasLoaded);
  const deletePlant = usePlantStore((s) => s.deletePlant);
  const isPremium = usePlantStore((s) => s.isPremium);

  const [isEditing, setIsEditing] = useState(false);
  const atFreeLimit = !isPremium && plants.length >= FREE_PLANT_LIMIT;

  useEffect(() => {
    if (!hasLoaded) {
      void loadPlants();
    }
  }, [hasLoaded, loadPlants]);

  const handleDeletePlant = async (plantId: number, plantName: string) => {
    await deletePlant(plantId);
    showSuccessToast("Planta removida", `${plantName} foi excluída.`);
  };

  const handleOpenPlant = (plantId: number) => {
    router.push({ pathname: "/plant/[id]", params: { id: String(plantId) } });
  };

  const handleAdd = () => {
    if (atFreeLimit) {
      router.push("/paywall");
      return;
    }
    router.push("/(identify)/identify");
  };

  const renderItem = ({ item }: ListRenderItemInfo<PlantRecord>) => (
    <PlantCard
      plant={item}
      isEditing={isEditing}
      onDelete={(id, name) => void handleDeletePlant(id, name)}
      onPress={handleOpenPlant}
    />
  );

  return (
    <SafeAreaView edges={["top", "bottom"]} className="flex-1 bg-slate-50">
      <View className="flex-1 p-4">
        <View className="mb-6 flex-row items-start justify-between px-2">
          <View className="flex-1 pr-4">
            <Text className="text-3xl font-bold tracking-tight text-slate-900">
              Minhas plantinhas
            </Text>
            <Text className="mt-2 text-sm text-slate-500">
              Acompanhe as regas e cuide da sua selva particular.
            </Text>
          </View>

          {plants.length > 0 ? (
            <TouchableOpacity onPress={() => setIsEditing((current) => !current)}>
              <Text className="text-sm font-semibold text-emerald-700">
                {isEditing ? "Concluir" : "Editar"}
              </Text>
            </TouchableOpacity>
          ) : null}
        </View>

        {!isPremium ? (
          <View className="mb-5 px-2">
            <PremiumBanner onPress={() => router.push("/paywall")} />
          </View>
        ) : null}

        <FlatList
          data={plants}
          keyExtractor={(item) => item.id.toString()}
          renderItem={renderItem}
          numColumns={2}
          refreshing={isLoading}
          onRefresh={() => void loadPlants()}
          contentContainerStyle={styles.listContent}
          showsVerticalScrollIndicator={false}
          ListEmptyComponent={
            <View className="mt-24 items-center px-6">
              <View className="rounded-full bg-emerald-50 p-5">
                <SproutIcon color="#10b981" size={30} />
              </View>
              <Text className="mt-4 text-lg font-semibold tracking-tight text-slate-800">
                Nenhuma planta cadastrada
              </Text>
              <Text className="mt-2 text-center text-sm text-slate-500">
                Toque no botão flutuante para adicionar sua primeira planta.
              </Text>
            </View>
          }
        />

        <ActionButton disabled={false} onPress={handleAdd} />
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  listContent: {
    paddingBottom: 96,
    paddingHorizontal: 2,
  },
});
