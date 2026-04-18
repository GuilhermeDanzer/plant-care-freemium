import { useMutation } from "@tanstack/react-query";
import { plantService } from "../services/plantService";

export const useIdentifyPlant = () => {
  return useMutation({
    mutationFn: (imageUri: string) => plantService.identifyPlant(imageUri),
  });
};
