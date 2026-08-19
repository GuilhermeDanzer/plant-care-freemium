import axios from 'axios';
import { WeatherData } from '@/types/weather';

const OPENWEATHER_API_KEY = process.env.EXPO_PUBLIC_OPENWEATHER_API_KEY;
const BASE_URL = 'https://api.openweathermap.org/data/2.5';

interface OpenWeatherResponse {
  main: {
    temp: number;
  };
  rain?: {
    '1h'?: number;
    '3h'?: number;
  };
}

export const weatherService = {
  /**
   * Fetches current weather data from OpenWeatherMap API.
   * Note: The free tier /weather endpoint provides rain volume for the last 1h or 3h.
   */
  getCurrentWeather: async (lat: number, lon: number): Promise<WeatherData> => {
    if (!OPENWEATHER_API_KEY) {
      throw new Error("OpenWeather API key (EXPO_PUBLIC_OPENWEATHER_API_KEY) is not configured.");
    }

    const response = await axios.get<OpenWeatherResponse>(`${BASE_URL}/weather`, {
      params: {
        lat,
        lon,
        appid: OPENWEATHER_API_KEY,
        units: 'metric',
      },
      timeout: 10000,
    });

    const data = response.data;
    
    // Check if rain volume is > 5mm
    const rainVol = data.rain?.['1h'] || data.rain?.['3h'] || 0;

    return {
      temperatureC: data.main.temp,
      hasRainedOver5mm: rainVol > 5,
    };
  }
};
