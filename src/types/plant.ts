export type WateringLevel = 1 | 2 | 3;

export interface IdentifiedPlant {
  name: string;
  scientificName: string;
  wateringLevel: WateringLevel;
  commonNames?: string[];
  bestWatering?: string;
  bestLightCondition?: string;
}

export interface AppUser {
  id: string;
  email: string;
  displayName: string;
  isAnonymous: boolean;
}

/* =========================================================================
 * Plant.id v3 — Health assessment typings
 * ========================================================================= */

export interface DiseaseTreatment {
  biological?: string[];
  prevention?: string[];
  chemical?: string[];
}

export interface DiseaseSuggestion {
  id: string;
  name: string;
  probability: number;
  details: {
    local_name?: string;
    description?: string;
    treatment?: DiseaseTreatment;
    cause?: string;
    url?: string;
    classification?: string[];
    common_names?: string[];
  };
}

export interface HealthAssessmentResult {
  is_healthy: { binary: boolean; probability: number };
  disease: { suggestions: DiseaseSuggestion[] };
  is_plant: { binary: boolean; probability: number };
}

export interface HealthAssessmentResponse {
  result: HealthAssessmentResult;
  status: string;
}

/* =========================================================================
 * SQLite record
 * ========================================================================= */

export interface PlantRecord {
  id: number;
  nickname: string | null;
  original_name: string;
  scientific_name: string;
  watering_freq_days: number;
  last_watered_at: string;
  next_watering_at: string;
  image_uri: string | null;
  last_health_check_at: string | null;
  /**
   * Diagnóstico persistido pela API v3. Aceitamos `unknown` no lado do SQL e
   * desserializamos para este shape.
   */
  health_data: HealthAssessmentResponse | null;
}
