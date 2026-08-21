import React, { useState, useRef, useMemo, useEffect, useCallback } from "react";
import { 
  View, 
  Text, 
  TouchableOpacity, 
  Image,
  Platform,
  Modal,
  ScrollView,
  KeyboardAvoidingView
} from "react-native";
import * as ImagePicker from "expo-image-picker";
import { Camera, Image as ImageIcon } from "lucide-react-native";
import { useTranslation } from "react-i18next";
import { Input } from "@/components/ui/Input";

export interface Plant {
  id?: string;
  speciesName: string;
  nickname?: string;
  wateringFrequencyDays: number;
  localImageUri: string | null;
}

interface ManualAddScreenProps {
  onSave: (plant: Plant) => void;
  onCancel: () => void;
}

export function ManualAddScreen({ onSave, onCancel }: ManualAddScreenProps) {
  const { t } = useTranslation();
  const [speciesName, setSpeciesName] = useState("");
  const [nickname, setNickname] = useState("");
  const [wateringFrequencyDays, setWateringFrequencyDays] = useState("7");
  const [localImageUri, setLocalImageUri] = useState<string | null>(null);
  const [errors, setErrors] = useState<{ species?: string; watering?: string }>({});

  const handlePickImage = async () => {
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ["images"],
      quality: 0.8,
      allowsEditing: true,
    });

    if (!result.canceled && result.assets[0]?.uri) {
      setLocalImageUri(result.assets[0].uri);
    }
  };

  const handleTakeImage = async () => {
    const permission = await ImagePicker.requestCameraPermissionsAsync();
    if (!permission.granted) return;

    const result = await ImagePicker.launchCameraAsync({
      mediaTypes: ["images"],
      quality: 0.8,
      allowsEditing: true,
    });

    if (!result.canceled && result.assets[0]?.uri) {
      setLocalImageUri(result.assets[0].uri);
    }
  };

  const validateAndSave = () => {
    const newErrors: { species?: string; watering?: string } = {};
    if (!speciesName.trim()) {
      newErrors.species = t("manualAdd.errorSpecies", "A espécie ou nome comum é obrigatório.");
    }
    
    const days = parseInt(wateringFrequencyDays, 10);
    if (isNaN(days) || days <= 0) {
      newErrors.watering = t("manualAdd.errorWatering", "Frequência de rega inválida.");
    }

    if (Object.keys(newErrors).length > 0) {
      setErrors(newErrors);
      return;
    }

    onSave({
      speciesName: speciesName.trim(),
      nickname: nickname.trim() || undefined,
      wateringFrequencyDays: days,
      localImageUri,
    });
  };

  return (
    <Modal
      visible={true}
      animationType="slide"
      transparent={true}
      onRequestClose={onCancel}
    >
      <KeyboardAvoidingView 
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        style={{ flex: 1 }}
      >
        <View className="flex-1 justify-end bg-black/50">
          <TouchableOpacity 
            className="flex-1" 
            activeOpacity={1} 
            onPress={onCancel} 
          />
          <View className="bg-[#f8fafc] rounded-t-3xl max-h-[90%] w-full">
            <View className="items-center mt-3 mb-2">
              <View className="w-12 h-1.5 bg-slate-300 rounded-full" />
            </View>
            <ScrollView className="p-6" contentContainerStyle={{ paddingBottom: 40 }}>
        
        {/* Image Selection */}
        <View className="items-center mb-8">
          {localImageUri ? (
            <TouchableOpacity onPress={handlePickImage} className="w-40 h-40 rounded-full overflow-hidden mb-4 border-4 border-emerald-100">
              <Image source={{ uri: localImageUri }} className="w-full h-full" />
            </TouchableOpacity>
          ) : (
            <View className="w-40 h-40 rounded-full bg-slate-200 items-center justify-center mb-4 border-4 border-slate-100">
              <ImageIcon color="#94a3b8" size={40} />
            </View>
          )}

          <View className="flex-row gap-4">
            <TouchableOpacity 
              className="bg-emerald-100 px-4 py-2 rounded-full flex-row items-center gap-2"
              onPress={handleTakeImage}
            >
              <Camera color="#059669" size={16} />
              <Text className="text-emerald-700 font-semibold text-sm">{t("manualAdd.camera", "Câmera")}</Text>
            </TouchableOpacity>
            
            <TouchableOpacity 
              className="bg-slate-200 px-4 py-2 rounded-full flex-row items-center gap-2"
              onPress={handlePickImage}
            >
              <ImageIcon color="#475569" size={16} />
              <Text className="text-slate-700 font-semibold text-sm">{t("manualAdd.gallery", "Galeria")}</Text>
            </TouchableOpacity>
          </View>
        </View>

        {/* Form Inputs */}
        <View className="mb-4">
          <Input
            label={t("manualAdd.speciesLabel", "Espécie / Nome da Planta *")}
            placeholder={t("manualAdd.speciesPlaceholder", "Ex: Costela de Adão, Zamioculca...")}
            value={speciesName}
            onChangeText={(text) => { setSpeciesName(text); setErrors(prev => ({...prev, species: undefined})); }}
            error={errors.species}
          />
        </View>

        <View className="mb-4">
          <Input
            label={t("manualAdd.nicknameLabel", "Apelido (Opcional)")}
            placeholder={t("manualAdd.nicknamePlaceholder", "Ex: Plantinha da Sala")}
            value={nickname}
            onChangeText={setNickname}
          />
        </View>

        <View className="mb-8">
          <Input
            label={t("manualAdd.wateringLabel", "Regar a cada X dias *")}
            placeholder={t("manualAdd.wateringPlaceholder", "Ex: 7")}
            keyboardType="numeric"
            value={wateringFrequencyDays}
            onChangeText={(text) => { setWateringFrequencyDays(text); setErrors(prev => ({...prev, watering: undefined})); }}
            error={errors.watering}
          />
        </View>

        {/* Actions */}
        <TouchableOpacity
          className="w-full bg-emerald-600 py-4 rounded-2xl items-center mb-3 shadow-sm"
          onPress={validateAndSave}
        >
          <Text className="text-white font-bold text-lg">{t("manualAdd.saveBtn", "Salvar Planta")}</Text>
        </TouchableOpacity>
        
        <TouchableOpacity
          className="w-full py-4 rounded-2xl items-center"
          onPress={onCancel}
        >
          <Text className="text-slate-500 font-semibold text-base">{t("manualAdd.cancelBtn", "Cancelar")}</Text>
        </TouchableOpacity>

            </ScrollView>
          </View>
        </View>
      </KeyboardAvoidingView>
    </Modal>
  );
}
