import React, { useState, useEffect } from "react";
import { View, Text, TextInput, FlatList, TouchableOpacity, ActivityIndicator, Pressable } from "react-native";
import { useTranslation } from "react-i18next";
import { Search, BookOpen, ArrowLeft } from "lucide-react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useRouter } from "expo-router";
import { kindwiseService } from "@/services/kindwiseService";
import { LexiconSearchResult } from "@/types/lexicon";

import { shadowBackButton } from "@/utils/shadows";
import { BackIcon } from "@/components/icons";
import { Input } from "@/components/ui/Input";

interface Props {
  onSelectPlant: (accessToken: string, name: string) => void;
}

export const LexiconSearchScreen: React.FC<Props> = ({ onSelectPlant }) => {
  const { t } = useTranslation();
  const router = useRouter();
  const [query, setQuery] = useState("");
  const [debouncedQuery, setDebouncedQuery] = useState("");
  const [results, setResults] = useState<LexiconSearchResult[]>([]);
  const [isLoading, setIsLoading] = useState(false);

  // Debounce the search input
  useEffect(() => {
    const handler = setTimeout(() => {
      setDebouncedQuery(query);
    }, 500);
    return () => clearTimeout(handler);
  }, [query]);

  // Execute search when debounced query changes
  useEffect(() => {
    const performSearch = async () => {
      if (!debouncedQuery || debouncedQuery.trim().length === 0) {
        setResults([]);
        return;
      }

      setIsLoading(true);
      const res = await kindwiseService.searchPlantsByName(debouncedQuery);
      setResults(res);
      setIsLoading(false);
    };

    void performSearch();
  }, [debouncedQuery]);

  const renderItem = ({ item }: { item: LexiconSearchResult }) => (
    <TouchableOpacity
      className="bg-white rounded-2xl mb-3 p-4 flex-row items-center border border-slate-100 shadow-sm"
      onPress={() => onSelectPlant(item.access_token, item.entity_name)}
    >
      <View className="h-12 w-12 bg-emerald-50 rounded-xl items-center justify-center mr-4">
        <BookOpen color="#059669" size={24} />
      </View>
      <View className="flex-1">
        <Text className="text-lg font-semibold text-slate-800">{item.entity_name}</Text>
        {item.matched_in && item.matched_in !== item.entity_name && (
          <Text className="text-sm text-slate-500 mt-1 capitalize">
            {item.matched_in_type === "synonym" ? "Sinônimo: " : "Corresponde: "}
            {item.matched_in}
          </Text>
        )}
      </View>
    </TouchableOpacity>
  );

  return (
    <SafeAreaView edges={["top", "bottom"]} className="flex-1 bg-slate-50">
      <View className="p-4 pt-4 pb-4 z-10">
        <View className="flex-row items-center mb-6">
          <Pressable
            onPress={() => router.back()}
            className="h-10 w-10 items-center justify-center rounded-full bg-white shadow-sm"
            style={shadowBackButton}
          >
            <BackIcon color="#0f172a" size={18} />
          </Pressable>
          <Text className="ml-4 text-2xl font-bold tracking-tight text-slate-900">
            {t("lexicon.welcomeTitle", "Plant Lexicon")}
          </Text>
        </View>
        
        <Input
          icon={Search}
          placeholder={t("lexicon.searchPlaceholder", "Buscar plantas...")}
          value={query}
          onChangeText={setQuery}
          autoCapitalize="none"
          autoCorrect={false}
        />
      </View>

      <View className="flex-1 p-4">
        {isLoading ? (
          <View className="mt-10 items-center">
            <ActivityIndicator size="large" color="#10b981" />
            <Text className="mt-4 text-slate-500 font-medium">
              {t("lexicon.searching", "Pesquisando...")}
            </Text>
          </View>
        ) : (
          <FlatList
            data={results}
            keyExtractor={(item) => item.access_token}
            renderItem={renderItem}
            showsVerticalScrollIndicator={false}
            contentContainerStyle={{ paddingBottom: 40 }}
            ListEmptyComponent={
              query.length > 0 && !isLoading ? (
                <View className="mt-20 items-center">
                  <Text className="text-lg font-semibold text-slate-700">
                    {t("lexicon.noResults", "Nenhuma planta encontrada")}
                  </Text>
                  <Text className="text-slate-500 text-center mt-2 px-6">
                    {t("lexicon.tryDifferentName", "Tente pesquisar por outro nome comum ou científico.")}
                  </Text>
                </View>
              ) : (
                <View className="mt-20 items-center">
                  <View className="bg-emerald-50 p-6 rounded-full mb-6">
                    {/* @ts-ignore */}
                    <BookOpen color="#10b981" size={40} />
                  </View>
                  <Text className="text-xl font-bold text-slate-800 text-center">
                    {t("lexicon.welcomeTitle", "Plant Lexicon")}
                  </Text>
                  <Text className="text-slate-500 text-center mt-3 px-6 leading-6">
                    {t(
                      "lexicon.welcomeBody",
                      "Pesquise em nosso banco de dados com mais de 10.000 plantas para descobrir dicas de cuidados e detalhes botânicos."
                    )}
                  </Text>
                </View>
              )
            }
          />
        )}
      </View>
    </SafeAreaView>
  );
};
