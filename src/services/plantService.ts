import { AxiosError } from "axios";
import * as FileSystem from "expo-file-system/legacy";
import * as ImageManipulator from "expo-image-manipulator";
import { plantIdApi } from "@/api/axiosClient";
import {
  HealthAssessmentResponse,
  IdentifiedPlant,
  WateringLevel,
} from "@/types/plant";

/* =========================================================================
 * Helpers
 * ========================================================================= */

const convertToBase64 = async (uri: string): Promise<string> => {
  // Compress and resize the image to ensure it's a valid JPEG and reduce payload size.
  // This also fixes HEIC issues on iOS since Kindwise only supports JPEG, PNG, WEBP.
  const manipResult = await ImageManipulator.manipulateAsync(
    uri,
    [{ resize: { width: 1024 } }],
    { compress: 0.8, format: ImageManipulator.SaveFormat.JPEG, base64: true }
  );

  if (manipResult.base64) {
    // Kindwise Plant.id v3 prefers the raw base64 string without the data URI scheme
    return manipResult.base64;
  }

  // Fallback
  const base64 = await FileSystem.readAsStringAsync(manipResult.uri, {
    encoding: FileSystem.EncodingType.Base64,
  });
  
  return base64;
};

const logAxiosError = (scope: string, error: unknown): void => {
  if (error instanceof AxiosError && error.response) {
    const { status, data } = error.response;
    console.error(`[${scope}] Plant.id retornou ${status}.`, data);
  } else {
    console.error(`[${scope}] Falha ao processar requisição.`, error);
  }
};

/* =========================================================================
 * Identification — v3
 * ========================================================================= */

interface PlantIdSuggestion {
  name?: string;
  details?: {
    common_names?: string[] | null;
    watering?: {
      min?: number;
      max?: number;
    };
    best_watering?: string;
    best_light_condition?: string;
  };
}

interface PlantIdResponse {
  result?: {
    classification?: {
      suggestions?: PlantIdSuggestion[];
    };
  };
}

const mapApiWateringToLevel = (value: number): WateringLevel => {
  if (value <= 1) return 1;
  if (value === 2) return 2;
  return 3;
};

const parseSuggestion = (suggestion: PlantIdSuggestion): IdentifiedPlant => {
  const wateringRaw = suggestion.details?.watering?.max ?? 2;
  const commonNames = suggestion.details?.common_names ?? undefined;
  const displayName = commonNames?.[0] ?? suggestion.name ?? "Planta Identificada";

  return {
    name: displayName,
    scientificName: suggestion.name ?? "N/A",
    wateringLevel: mapApiWateringToLevel(wateringRaw),
    commonNames,
    bestWatering: suggestion.details?.best_watering,
    bestLightCondition: suggestion.details?.best_light_condition,
  };
};

/* =========================================================================
 * Service
 * ========================================================================= */

export const plantService = {
  identifyPlant: async (imageUris: string[]): Promise<any> => { // We will map it in camera or scan-result
    try {
      if (!imageUris || imageUris.length === 0) {
        throw new Error("Nenhuma URI de imagem foi informada para identificação.");
      }

      const base64Strings = await Promise.all(
        imageUris.map((uri) => convertToBase64(uri))
      );
      
      const firstBase64 = base64Strings[0];
      
      // Simple string hash for caching
      let hash = 0;
      for (let i = 0; i < firstBase64.length; i++) {
        const char = firstBase64.charCodeAt(i);
        hash = ((hash << 5) - hash) + char;
        hash = hash & hash; // Convert to 32bit integer
      }
      const cacheKey = `plant_scan_cache_${hash}`;

      // Check cache
      try {
        const { default: AsyncStorage } = await import('@react-native-async-storage/async-storage');
        const cachedStr = await AsyncStorage.getItem(cacheKey);
        if (cachedStr) {
          const cached = JSON.parse(cachedStr);
          const now = Date.now();
          if (now - cached.timestamp < 24 * 60 * 60 * 1000) {
            console.log("[plantService] Retornando JSON do cache!");
            return cached.data;
          }
        }
      } catch (e) {
        console.log("[plantService] Erro ao ler cache", e);
      }

      const payload = { images: base64Strings, health: "all" };

      const response = await plantIdApi.post<any>(
        "/identification",
        payload,
        {
          params: {
            details: "common_names,watering,best_watering,best_light_condition,local_name,description,url,treatment,classification,cause",
            language: "pt",
          },
        }
      );
      
      const responseData = response.data.result;

      // Map to our KindwiseIdentificationResponse interface
      const mappedResponse = {
        is_plant: responseData?.is_plant || { binary: true, probability: 1 },
        suggestions: responseData?.classification?.suggestions?.map((s: any) => ({
          plant_name: s.name || "Unknown",
          probability: s.probability || 0,
          plant_details: s.details
        })) || [],
        health_assessment: responseData?.is_healthy ? {
          is_healthy: responseData.is_healthy,
          diseases: responseData?.disease?.suggestions?.map((d: any) => ({
            name: d.name || "Unknown",
            probability: d.probability || 0,
            treatment: d.details?.treatment
          })) || []
        } : undefined
      };

      // Save to cache
      try {
        const { default: AsyncStorage } = await import('@react-native-async-storage/async-storage');
        await AsyncStorage.setItem(cacheKey, JSON.stringify({
          timestamp: Date.now(),
          data: mappedResponse
        }));
      } catch (e) {
        console.log("[plantService] Erro ao salvar cache", e);
      }

      return mappedResponse;
    } catch (error) {
      logAxiosError("plantService.identifyPlant", error);
      throw error;
    }
  },

  // Export parseSuggestion for converting KindwiseSuggestion to IdentifiedPlant
  parseSuggestion: (suggestion: any): IdentifiedPlant => {
    return parseSuggestion(suggestion);
  },

  /**
   * POST https://plant.id/api/v3/health_assessment
   *
   * Query params (URL):
   *   language=pt
   *   details=local_name,description,url,treatment,classification,common_names,cause
   *
   * Body:
   *   { images: [base64], health: "only", similar_images: true }
   */
  assessPlantHealth: async (
    imageUris: string[]
  ): Promise<HealthAssessmentResponse> => {
    if (!imageUris || imageUris.length === 0) {
      throw new Error("Pelo menos uma URI de imagem é obrigatória para o diagnóstico.");
    }

    const base64Strings = await Promise.all(
      imageUris.map((uri) => convertToBase64(uri))
    );

    console.log(
      "[plantService.assessPlantHealth] → POST /health_assessment",
      { imageUris, count: base64Strings.length }
    );

    try {
      const response = await plantIdApi.post<HealthAssessmentResponse>(
        "/health_assessment",
        {
          images: base64Strings,
          health: "only",
          similar_images: true,
        },
        {
          params: {
            language: "pt",
            details:
              "local_name,description,url,treatment,classification,common_names,cause",
          },
          timeout: 20000,
        }
      );

      // Log verbose da resposta da API. Mantemos dois formatos:
      //  - objeto (inspecionável no devtools Hermes)
      //  - string JSON (útil para copiar do Metro sem truncar)
      console.log(
        "[plantService.assessPlantHealth] ← status",
        response.status
      );
      console.log(
        "[plantService.assessPlantHealth] ← RAW JSON:",
        JSON.stringify(response.data, null, 2)
      );
      console.log("response.data", response.data);
      return response.data;
    } catch (error) {
      logAxiosError("plantService.assessPlantHealth", error);
      throw error;
    }
  },
};
