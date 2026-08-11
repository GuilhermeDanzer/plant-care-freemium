export interface KindwiseSuggestion {
  plant_name: string;
  probability: number;
  plant_details?: {
    common_names?: string[];
    scientific_name?: string;
  };
}

export interface KindwiseDiseaseSuggestion {
  name: string;
  probability: number;
  treatment?: {
    biological?: string[];
    prevention?: string[];
    chemical?: string[];
  };
}

export interface KindwiseHealthAssessment {
  is_healthy: {
    binary: boolean;
    probability: number;
  };
  diseases: KindwiseDiseaseSuggestion[];
}

export interface KindwiseIdentificationResponse {
  is_plant: {
    binary: boolean;
    probability: number;
  };
  suggestions: KindwiseSuggestion[];
  health_assessment?: KindwiseHealthAssessment;
}
