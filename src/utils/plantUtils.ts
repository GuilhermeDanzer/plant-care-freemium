import { PlantRecord } from "../types/plant";

/**
 * Sempre prefere o apelido escolhido pelo usuário. Quando vazio, cai para o
 * nome original retornado pela API.
 */
export const getPlantDisplayName = (plant: Pick<PlantRecord, "nickname" | "original_name">): string => {
  const nickname = plant.nickname?.trim();
  if (nickname && nickname.length > 0) return nickname;
  return plant.original_name;
};
