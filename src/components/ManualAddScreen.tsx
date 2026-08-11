import React, { useState } from "react";
import { 
  View, 
  Text, 
  TextInput, 
  TouchableOpacity, 
  ScrollView, 
  Image, 
  KeyboardAvoidingView, 
  Platform 
} from "react-native";
import * as ImagePicker from "expo-image-picker";
import { Camera, Image as ImageIcon } from "lucide-react-native";

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
      newErrors.species = "A espécie ou nome comum é obrigatório.";
    }
    
    const days = parseInt(wateringFrequencyDays, 10);
    if (isNaN(days) || days <= 0) {
      newErrors.watering = "Frequência de rega inválida.";
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
    <KeyboardAvoidingView 
      behavior={Platform.OS === "ios" ? "padding" : "height"} 
      className="flex-1 bg-slate-50"
    >
      <ScrollView className="flex-1 p-6" contentContainerStyle={{ paddingBottom: 40 }}>
        
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
              <Text className="text-emerald-700 font-semibold text-sm">Câmera</Text>
            </TouchableOpacity>
            
            <TouchableOpacity 
              className="bg-slate-200 px-4 py-2 rounded-full flex-row items-center gap-2"
              onPress={handlePickImage}
            >
              <ImageIcon color="#475569" size={16} />
              <Text className="text-slate-700 font-semibold text-sm">Galeria</Text>
            </TouchableOpacity>
          </View>
        </View>

        {/* Form Inputs */}
        <View className="mb-4">
          <Text className="text-slate-700 font-bold mb-2 ml-1">Espécie / Nome da Planta *</Text>
          <TextInput
            className={`bg-white border ${errors.species ? 'border-red-400' : 'border-slate-200'} rounded-2xl p-4 text-base text-slate-800`}
            placeholder="Ex: Costela de Adão, Zamioculca..."
            placeholderTextColor="#94a3b8"
            value={speciesName}
            onChangeText={(text) => { setSpeciesName(text); setErrors(prev => ({...prev, species: undefined})); }}
          />
          {errors.species && <Text className="text-red-500 text-xs mt-1 ml-1">{errors.species}</Text>}
        </View>

        <View className="mb-4">
          <Text className="text-slate-700 font-bold mb-2 ml-1">Apelido (Opcional)</Text>
          <TextInput
            className="bg-white border border-slate-200 rounded-2xl p-4 text-base text-slate-800"
            placeholder="Ex: Plantinha da Sala"
            placeholderTextColor="#94a3b8"
            value={nickname}
            onChangeText={setNickname}
          />
        </View>

        <View className="mb-8">
          <Text className="text-slate-700 font-bold mb-2 ml-1">Regar a cada X dias *</Text>
          <TextInput
            className={`bg-white border ${errors.watering ? 'border-red-400' : 'border-slate-200'} rounded-2xl p-4 text-base text-slate-800`}
            placeholder="Ex: 7"
            placeholderTextColor="#94a3b8"
            keyboardType="numeric"
            value={wateringFrequencyDays}
            onChangeText={(text) => { setWateringFrequencyDays(text); setErrors(prev => ({...prev, watering: undefined})); }}
          />
          {errors.watering && <Text className="text-red-500 text-xs mt-1 ml-1">{errors.watering}</Text>}
        </View>

        {/* Actions */}
        <TouchableOpacity
          className="w-full bg-emerald-600 py-4 rounded-2xl items-center mb-3 shadow-sm"
          onPress={validateAndSave}
        >
          <Text className="text-white font-bold text-lg">Salvar Planta</Text>
        </TouchableOpacity>
        
        <TouchableOpacity
          className="w-full py-4 rounded-2xl items-center"
          onPress={onCancel}
        >
          <Text className="text-slate-500 font-semibold text-base">Cancelar</Text>
        </TouchableOpacity>

      </ScrollView>
    </KeyboardAvoidingView>
  );
}
