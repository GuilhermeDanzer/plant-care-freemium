import { plantIdApi } from "@/api/axiosClient";
import { LexiconPlantDetails, LexiconSearchResponse, LexiconSearchResult } from "@/types/lexicon";
import { AxiosError } from "axios";

const logAxiosError = (scope: string, error: unknown): void => {
  if (error instanceof AxiosError && error.response) {
    const { status, data } = error.response;
    console.error(`[${scope}] Plant.id returned ${status}.`, data);
  } else {
    console.error(`[${scope}] Failed to process request.`, error);
  }
};

export const kindwiseService = {
  /**
   * Free KB Search Endpoint.
   * Costs 0 credits.
   */
  searchPlantsByName: async (query: string): Promise<LexiconSearchResult[]> => {
    if (!query || query.trim().length === 0) return [];

    try {
      const response = await plantIdApi.get<LexiconSearchResponse>("/kb/plants/name_search", {
        params: {
          q: query.trim(),
          language: "pt",
        },
      });

      return response.data.entities || [];
    } catch (error) {
      logAxiosError("kindwiseService.searchPlantsByName", error);
      return [];
    }
  },

  /**
   * Paid KB Details Endpoint.
   * Costs 0.5 credits.
   */
  getPlantDetails: async (accessToken: string): Promise<LexiconPlantDetails | null> => {
    if (!accessToken) return null;

    try {
      // The Kindwise API accepts details parameters to return specific fields.
      const response = await plantIdApi.get<LexiconPlantDetails>(`/kb/plants/${accessToken}`, {
        params: {
          details: "common_names,url,description,taxonomy,rank,gbif_id,inaturalist_id,image,synonyms,edible_parts,watering,propagation_methods",
          language: "pt",
        },
      });

      return response.data;
    } catch (error) {
      logAxiosError("kindwiseService.getPlantDetails", error);
      return null;
    }
  },
};
