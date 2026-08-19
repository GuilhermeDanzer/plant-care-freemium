export interface WeatherData {
  temperatureC: number;
  hasRainedOver5mm: boolean;
}

export interface WeatherPlant {
  id: string;
  baseWateringIntervalDays: number;
  isOutdoors: boolean;
  lastWateredDate: Date;
}
