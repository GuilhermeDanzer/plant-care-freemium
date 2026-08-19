import { useMutation } from "@tanstack/react-query";
import { plantService } from "@/services/plantService";

export const useIdentifyPlant = () => {
  return useMutation({
    mutationFn: (imageUris: string[]) => plantService.identifyPlant(imageUris),
  });
};
