import axios from "axios";

const plantIdApiKey = process.env.EXPO_PUBLIC_PLANT_ID_API_KEY;

if (!plantIdApiKey) {
  throw new Error(
    "EXPO_PUBLIC_PLANT_ID_API_KEY is not set. Add it to .env (see .env.example) or your EAS environment.",
  );
}

export const plantIdApi = axios.create({
  baseURL: "https://plant.id/api/v3",
  headers: {
    "Api-Key": plantIdApiKey,
    "Content-Type": "application/json",
  },
  timeout: 15000,
});
