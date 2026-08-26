import { useState, useCallback } from 'react';
import * as Location from 'expo-location';
import i18n from '@/i18n';
import { weatherService } from '@/services/weatherService';
import { permissionService } from '@/services/permissionService';
import { calculateNextWateringDate } from '@/utils/calculateNextWateringDate';
import { WeatherPlant, WeatherData } from '@/types/weather';

export interface AdjustedPlant extends WeatherPlant {
  adjustedNextWateringDate: Date;
}

export const useIntelligentWatering = () => {
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const calculateAdjustedSchedules = useCallback(
    async (plants: WeatherPlant[]): Promise<AdjustedPlant[]> => {
      setIsLoading(true);
      setError(null);

      try {
        const permission = await permissionService.ensureLocationPermission();
        if (permission !== 'granted') {
          throw new Error(i18n.t('permissions.locationDeniedMessage'));
        }

        const location = await Location.getCurrentPositionAsync({
          accuracy: Location.Accuracy.Balanced,
        });
        
        const weatherData = await weatherService.getCurrentWeather(
          location.coords.latitude,
          location.coords.longitude
        );

        const adjustedPlants = plants.map((plant) => ({
          ...plant,
          adjustedNextWateringDate: calculateNextWateringDate(
            plant, 
            plant.lastWateredDate, 
            weatherData
          ),
        }));

        return adjustedPlants;
      } catch (err) {
        const errorMessage = err instanceof Error ? err.message : i18n.t('common.unknownError');
        setError(errorMessage);
        return [];
      } finally {
        setIsLoading(false);
      }
    },
    []
  );

  return {
    calculateAdjustedSchedules,
    isLoading,
    error,
  };
};
