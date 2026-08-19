import React, { useEffect, useState } from "react";
import { View, Text, ScrollView, TouchableOpacity, StyleSheet, Pressable, Image } from "react-native";
import { useTranslation } from "react-i18next";
import { BlurView } from "expo-blur";
import { Lock, Droplet, Sprout, Apple, Leaf } from "lucide-react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { kindwiseService } from "@/services/kindwiseService";
import { LexiconPlantDetails } from "@/types/lexicon";
import { ArrowLeft } from "lucide-react-native";

import { shadowLayering } from "@/utils/shadows";

interface Props {
  accessToken: string;
  name: string;
  isPremium: boolean;
  onBack: () => void;
  onPaywall: () => void;
}

export const LexiconDetailsScreen: React.FC<Props> = ({ accessToken, name, isPremium, onBack, onPaywall }) => {
  const { t } = useTranslation();
  const [details, setDetails] = useState<LexiconPlantDetails | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    if (!isPremium) return;

    const fetchDetails = async () => {
      setIsLoading(true);
      const data = await kindwiseService.getPlantDetails(accessToken);
      setDetails(data);
      setIsLoading(false);
    };

    void fetchDetails();
  }, [accessToken, isPremium]);

  const renderSkeleton = () => (
    <View style={{ marginTop: 24, paddingHorizontal: 16 }}>
      <View style={{ height: 256, width: '100%', backgroundColor: '#e2e8f0', borderRadius: 24, marginBottom: 16 }} />
      <View style={{ height: 32, width: '66%', backgroundColor: '#e2e8f0', borderRadius: 8, marginBottom: 8 }} />
      <View style={{ height: 16, width: '33%', backgroundColor: '#e2e8f0', borderRadius: 8, marginBottom: 24 }} />
      <View style={{ height: 128, width: '100%', backgroundColor: '#e2e8f0', borderRadius: 16, marginBottom: 16 }} />
      <View style={{ height: 128, width: '100%', backgroundColor: '#e2e8f0', borderRadius: 16, marginBottom: 16 }} />
    </View>
  );

  const heroImage = details?.image?.value;

  return (
    <View className="flex-1 bg-slate-50">
      <ScrollView contentContainerStyle={{ paddingBottom: 100 }} showsVerticalScrollIndicator={false} bounces={false}>
        
        {/* HERO SECTION */}
        <View className="relative w-full" style={{ height: 350 }}>
          {heroImage ? (
            <Image source={{ uri: heroImage }} className="absolute h-full w-full" resizeMode="cover" />
          ) : (
            <View className="absolute h-full w-full bg-emerald-900 items-center justify-center">
              <Leaf color="#064e3b" size={100} />
            </View>
          )}
          {/* Gradient Overlay */}
          <View className="absolute w-full bottom-0" style={{ height: '50%', backgroundColor: 'rgba(0, 0, 0, 0.4)' }} />

          {/* Custom Back Button overlaid on hero */}
          <SafeAreaView edges={["top"]} className="absolute w-full px-4 pt-4">
            <Pressable
              onPress={onBack}
              className="h-10 w-10 items-center justify-center rounded-full bg-white"
              style={shadowLayering.core}
            >
              <ArrowLeft color="#0f172a" size={18} />
            </Pressable>
          </SafeAreaView>

          {/* Title pinned to bottom of hero */}
          <View className="absolute bottom-0 w-full p-6 pb-8">
            <Text className="text-4xl font-bold tracking-tight text-white capitalize">
              {name}
            </Text>
            {isPremium && details?.common_names && details.common_names.length > 0 && (
              <Text className="text-emerald-100 text-lg font-medium mt-1">
                {details.common_names.join(", ")}
              </Text>
            )}
          </View>
        </View>

        {/* CONTENT SECTION */}
        <View className="px-4" style={{ marginTop: -16 }}>
          {!isPremium ? (
            <View className="relative overflow-hidden rounded-3xl border border-slate-200 bg-white" style={shadowLayering.core}>
              {/* The Teaser UI (Blurred) */}
              <View className="p-6" style={{ opacity: 0.4 }}>
                <Text className="text-xl font-bold text-slate-800 mb-2">Cuidados com a Água</Text>
                <View className="flex-row items-center mb-6">
                  <Droplet color="#3b82f6" size={24} />
                  <Text className="text-slate-600 text-base ml-2">Regar a cada 7 - 10 dias</Text>
                </View>
                <Text className="text-xl font-bold text-slate-800 mb-2">Taxonomia Botânica</Text>
                <Text className="text-slate-600 leading-6 mb-6">
                  Descubra a família, gênero, ordem e classe botânica completa...
                </Text>
                <Text className="text-xl font-bold text-slate-800 mb-2">Descrição</Text>
                <Text className="text-slate-600 leading-6">
                  A Monstera deliciosa, comumente chamada de costela-de-adão, é uma espécie de planta com flor...
                </Text>
              </View>

              <BlurView intensity={20} tint="light" style={StyleSheet.absoluteFill} className="items-center justify-center p-6">
                <View className="p-6 rounded-3xl items-center w-full" style={{ backgroundColor: 'rgba(255, 255, 255, 0.95)' }}>
                  <View className="h-16 w-16 bg-emerald-100 rounded-full items-center justify-center mb-4">
                    <Lock color="#059669" size={32} />
                  </View>
                  <Text className="text-xl font-bold text-slate-800 text-center mb-2">
                    {t("lexicon.premiumLockTitle", "Guia de Cuidados Premium")}
                  </Text>
                  <Text className="text-slate-600 text-center mb-6 leading-5">
                    {t(
                      "lexicon.premiumLockBody",
                      `Descubra o guia botânico completo da ${name}. Desbloqueie rega, taxonomia, propagação e muito mais.`
                    )}
                  </Text>
                  
                  <TouchableOpacity
                    className="bg-emerald-600 py-4 px-8 rounded-full w-full"
                    onPress={onPaywall}
                  >
                    <Text className="text-white font-bold text-center text-lg">
                      {t("lexicon.unlockButton", "Assinar Premium por R$10/mês")}
                    </Text>
                  </TouchableOpacity>
                </View>
              </BlurView>
            </View>
          ) : (
            <View>
              {isLoading || !details ? (
                renderSkeleton()
              ) : (
                <View style={{ gap: 24 }}>
                  
                  {/* WATERING */}
                  {details.watering && (
                    <View className="bg-white rounded-3xl p-6 border border-slate-100" style={shadowLayering.core}>
                      <Text className="text-xl font-bold text-slate-800 mb-4">
                        {t("lexicon.wateringCare", "Cuidados com a Água")}
                      </Text>
                      <View className="flex-row items-center bg-blue-50 p-4 rounded-2xl border border-blue-100">
                        <View className="h-12 w-12 bg-white rounded-full items-center justify-center mr-4">
                          <Droplet color="#3b82f6" size={24} />
                        </View>
                        <View className="flex-1">
                          <Text className="text-blue-900 font-semibold mb-1">
                            {t("lexicon.wateringInterval", "Frequência Recomendada")}
                          </Text>
                          <Text className="text-blue-700 text-base">
                            {details.watering.min === details.watering.max 
                              ? `A cada ${details.watering.min} dias`
                              : `A cada ${details.watering.min} a ${details.watering.max} dias`}
                          </Text>
                        </View>
                      </View>
                    </View>
                  )}

                  {/* TAXONOMY */}
                  {details.taxonomy && (
                    <View className="bg-white rounded-3xl p-6 border border-slate-100" style={shadowLayering.core}>
                      <Text className="text-xl font-bold text-slate-800 mb-4">
                        {t("lexicon.taxonomy", "Taxonomia")}
                      </Text>
                      <View className="flex-row flex-wrap" style={{ marginHorizontal: -8 }}>
                        {Object.entries(details.taxonomy).map(([key, value]) => {
                          if (!value) return null;
                          return (
                            <View key={key} className="p-2" style={{ width: '50%' }}>
                              <View className="bg-slate-50 p-3 rounded-2xl border border-slate-100">
                                <Text className="text-xs uppercase tracking-widest text-slate-400 font-bold mb-1">{key}</Text>
                                <Text className="text-slate-800 font-semibold">{value}</Text>
                              </View>
                            </View>
                          );
                        })}
                      </View>
                    </View>
                  )}

                  {/* TAGS: PROPAGATION & EDIBLE */}
                  {(details.propagation_methods || details.edible_parts) && (
                    <View className="flex-row" style={{ gap: 12 }}>
                      {details.propagation_methods && details.propagation_methods.length > 0 && (
                        <View className="flex-1 bg-white rounded-3xl p-6 border border-slate-100" style={shadowLayering.core}>
                          <View className="flex-row items-center mb-3">
                            <Sprout color="#059669" size={20} />
                            <Text className="text-lg font-bold text-slate-800 ml-2">Propagação</Text>
                          </View>
                          <View className="flex-row flex-wrap" style={{ gap: 8 }}>
                            {details.propagation_methods.map(method => (
                              <View key={method} className="bg-emerald-50 px-3 rounded-full border border-emerald-100" style={{ paddingVertical: 6 }}>
                                <Text className="text-emerald-700 capitalize font-medium">{method}</Text>
                              </View>
                            ))}
                          </View>
                        </View>
                      )}

                      {details.edible_parts && details.edible_parts.length > 0 && (
                        <View className="flex-1 bg-white rounded-3xl p-6 border border-slate-100" style={shadowLayering.core}>
                          <View className="flex-row items-center mb-3">
                            <Apple color="#ea580c" size={20} />
                            <Text className="text-lg font-bold text-slate-800 ml-2">Comestível</Text>
                          </View>
                          <View className="flex-row flex-wrap" style={{ gap: 8 }}>
                            {details.edible_parts.map(part => (
                              <View key={part} className="bg-orange-50 px-3 rounded-full border border-orange-100" style={{ paddingVertical: 6 }}>
                                <Text className="text-orange-700 capitalize font-medium">{part}</Text>
                              </View>
                            ))}
                          </View>
                        </View>
                      )}
                    </View>
                  )}

                  {/* DESCRIPTION */}
                  {details.description && (
                    <View className="bg-white rounded-3xl p-6 border border-slate-100" style={shadowLayering.core}>
                      <Text className="text-xl font-bold text-slate-800 mb-3">
                        {t("lexicon.description", "Descrição Botânica")}
                      </Text>
                      <Text className="text-slate-600 leading-7 text-base text-justify">
                        {details.description.value}
                      </Text>
                    </View>
                  )}

                  {/* SYNONYMS */}
                  {details.synonyms && details.synonyms.length > 0 && (
                    <View className="bg-white rounded-3xl p-6 border border-slate-100" style={shadowLayering.core}>
                      <Text className="text-xl font-bold text-slate-800 mb-3">
                        {t("lexicon.synonyms", "Sinônimos")}
                      </Text>
                      <View className="flex-row flex-wrap" style={{ gap: 8 }}>
                        {details.synonyms.map(syn => (
                          <View key={syn} className="bg-slate-50 px-3 rounded-full border border-slate-200" style={{ paddingVertical: 6 }}>
                            <Text className="text-slate-600 italic">{syn}</Text>
                          </View>
                        ))}
                      </View>
                    </View>
                  )}

                </View>
              )}
            </View>
          )}
        </View>
      </ScrollView>
    </View>
  );
};
