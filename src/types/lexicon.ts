export interface LexiconSearchResult {
  access_token: string;
  entity_name: string;
  matched_in: string;
  matched_in_type: string;
  match_position: number;
  match_length: number;
}

export interface LexiconPlantDetails {
  access_token?: string;
  name: string;
  entity_id: string;
  language: string;
  description: {
    value: string;
    citation?: string;
    license_name?: string;
    license_url?: string;
  };
  image?: {
    value: string;
    citation?: string;
    license_name?: string;
    license_url?: string;
  };
  common_names?: string[];
  synonyms?: string[];
  watering?: {
    min?: number;
    max?: number;
  };
  edible_parts?: string[];
  propagation_methods?: string[];
  taxonomy?: {
    class?: string;
    genus?: string;
    order?: string;
    family?: string;
    phylum?: string;
    kingdom?: string;
  };
}

export interface LexiconSearchResponse {
  entities: LexiconSearchResult[];
  entities_trimmed: boolean;
  limit: number;
}
