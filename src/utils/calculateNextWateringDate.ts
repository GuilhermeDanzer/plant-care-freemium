import { WeatherData, WeatherPlant } from '@/types/weather';

/**
 * Calculates the dynamically adjusted next watering date based on weather conditions.
 */
export const calculateNextWateringDate = (
  plant: WeatherPlant,
  lastWateredDate: Date,
  weather: WeatherData
): Date => {
  let adjustedInterval = plant.baseWateringIntervalDays;

  // Rule B: Winter logic. If temperature < 15°C, multiply interval by 1.5
  if (weather.temperatureC < 15) {
    adjustedInterval = adjustedInterval * 1.5;
  }

  // Rule A: Outdoors and Rain. If outdoors and rained > 5mm, add 3 days
  if (plant.isOutdoors && weather.hasRainedOver5mm) {
    adjustedInterval = adjustedInterval + 3;
  }

  const nextDate = new Date(lastWateredDate.getTime());
  nextDate.setDate(nextDate.getDate() + Math.round(adjustedInterval));

  return nextDate;
};
