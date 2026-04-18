import axios from "axios";

export const plantIdApi = axios.create({
  baseURL: "https://plant.id/api/v3",
  headers: {
    "Api-Key": process.env.EXPO_PUBLIC_PLANT_ID_API_KEY ?? "YOUR_PLANT_ID_API_KEY",
    "Content-Type": "application/json",
  },
  timeout: 15000,
});
