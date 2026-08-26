import { Pressable, View } from "react-native";
import { BackIcon, EditIcon } from "@/components/icons";
import { shadowLayering } from "@/utils/shadows";

export interface PlantDetailHeaderProps {
  isEditing: boolean;
  onBack: () => void;
  onEdit: () => void;
}

/**
 * Cabeçalho da tela de detalhes: botão de voltar + botão de editar apelido
 * (oculto — substituído por um espaçador — durante a edição).
 */
export function PlantDetailHeader({
  isEditing,
  onBack,
  onEdit,
}: PlantDetailHeaderProps) {
  return (
    <View className="flex-row items-center justify-between px-2">
      <Pressable
        onPress={onBack}
        className="h-10 w-10 items-center justify-center rounded-full bg-white"
        style={shadowLayering.core}
      >
        <BackIcon color="#0f172a" size={18} />
      </Pressable>

      {!isEditing ? (
        <Pressable
          onPress={onEdit}
          className="h-10 w-10 items-center justify-center rounded-full bg-white"
          style={shadowLayering.core}
        >
          <EditIcon color="#0f172a" size={16} />
        </Pressable>
      ) : (
        <View className="h-10 w-10" />
      )}
    </View>
  );
}
