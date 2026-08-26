import { Pressable, Text, TextInput, View } from "react-native";
import { useTranslation } from "react-i18next";
import { CheckIcon, CloseIcon } from "@/components/icons";

export interface PlantNameSectionProps {
  isEditing: boolean;
  displayName: string;
  scientificName: string;
  originalName: string;
  nickname: string | null;
  draft: string;
  onChangeDraft: (value: string) => void;
  onStartEdit: () => void;
  onCancelEdit: () => void;
  onSave: () => void;
}

/**
 * Bloco de nome da planta: mostra nome/scientific e o "nome original" quando há
 * apelido, ou o editor de apelido (TextInput + cancelar/salvar) quando em modo
 * de edição.
 */
export function PlantNameSection({
  isEditing,
  displayName,
  scientificName,
  originalName,
  nickname,
  draft,
  onChangeDraft,
  onStartEdit,
  onCancelEdit,
  onSave,
}: PlantNameSectionProps) {
  const { t } = useTranslation();

  if (!isEditing) {
    return (
      <View className="mt-6 px-2">
        <Pressable onPress={onStartEdit}>
          <Text className="text-3xl font-bold tracking-tight text-slate-900">
            {displayName}
          </Text>
          <Text className="mt-1 text-sm italic text-slate-500">
            {scientificName}
          </Text>
          {nickname && nickname.trim().length > 0 ? (
            <Text className="mt-1 text-xs text-slate-400">
              {t("plantDetail.originalName", { name: originalName })}
            </Text>
          ) : null}
        </Pressable>
      </View>
    );
  }

  return (
    <View className="mt-6 px-2">
      <View className="rounded-2xl border border-emerald-200 bg-white p-4">
        <Text className="mb-2 text-xs font-semibold uppercase tracking-widest text-emerald-700">
          {t("plantDetail.nicknameLabel")}
        </Text>
        <TextInput
          value={draft}
          onChangeText={onChangeDraft}
          placeholder={originalName}
          autoFocus
          className="text-2xl font-bold tracking-tight text-slate-900"
          returnKeyType="done"
          onSubmitEditing={onSave}
        />
        <View className="mt-4 flex-row justify-end gap-2">
          <Pressable
            onPress={onCancelEdit}
            className="h-10 w-10 items-center justify-center rounded-full bg-slate-100"
          >
            <CloseIcon color="#475569" size={16} />
          </Pressable>
          <Pressable
            onPress={onSave}
            className="h-10 w-10 items-center justify-center rounded-full bg-emerald-600"
          >
            <CheckIcon color="#ffffff" size={16} />
          </Pressable>
        </View>
      </View>
    </View>
  );
}
