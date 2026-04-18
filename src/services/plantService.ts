import { AxiosError } from "axios";
import * as FileSystem from "expo-file-system/legacy";
import { plantIdApi } from "../api/axiosClient";
import {
  HealthAssessmentResponse,
  IdentifiedPlant,
  WateringLevel,
} from "../types/plant";

/* =========================================================================
 * Helpers
 * ========================================================================= */

const DEFAULT_IMAGE_MIME_TYPE = "image/jpeg";

const inferMimeType = (uri: string): string => {
  const normalized = uri.toLowerCase();
  if (normalized.endsWith(".png")) return "image/png";
  if (normalized.endsWith(".webp")) return "image/webp";
  if (normalized.endsWith(".heic")) return "image/heic";
  if (normalized.endsWith(".heif")) return "image/heif";
  return DEFAULT_IMAGE_MIME_TYPE;
};

const convertToBase64 = async (uri: string): Promise<string> => {
  const base64 = await FileSystem.readAsStringAsync(uri, {
    encoding: FileSystem.EncodingType.Base64,
  });
  const mimeType = inferMimeType(uri);
  return `data:${mimeType};base64,${base64}`;
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
  identifyPlant: async (imageUri: string): Promise<IdentifiedPlant> => {
    try {
      if (!imageUri) {
        throw new Error("Nenhuma URI de imagem foi informada para identificação.");
      }

      const base64String = await convertToBase64(imageUri);
      const payload = { images: [base64String] };

      const response = await plantIdApi.post<PlantIdResponse>(
        "/identification",
        payload,
        {
          params: {
            details:
              "common_names,watering,best_watering,best_light_condition",
            language: "pt",
          },
        }
      );
      

      const firstSuggestion =
        response.data.result?.classification?.suggestions?.[0];

      if (!firstSuggestion) {
        return {
          name: "Planta não identificada",
          scientificName: "N/A",
          wateringLevel: 2,
        };
      }

      return parseSuggestion(firstSuggestion);
    } catch (error) {
      logAxiosError("plantService.identifyPlant", error);
      if (error instanceof AxiosError && error.response) {
        return {
          name: "Falha na identificação",
          scientificName: "N/A",
          wateringLevel: 2,
        };
      }
      throw error;
    }
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
    imageUri: string
  ): Promise<HealthAssessmentResponse> => {
    if (!imageUri) {
      throw new Error("URI de imagem é obrigatória para o diagnóstico.");
    }

    const base64String = await convertToBase64(imageUri);

    console.log(
      "[plantService.assessPlantHealth] → POST /health_assessment",
      { imageUri, base64Bytes: base64String.length }
    );

    try {
      const response = await plantIdApi.post<HealthAssessmentResponse>(
        "/health_assessment",
        {
          images: [base64String],
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
