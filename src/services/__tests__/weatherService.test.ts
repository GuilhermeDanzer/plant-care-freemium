import axios from "axios";
import { weatherService } from "@/services/weatherService";

jest.mock("axios", () => ({
  __esModule: true,
  default: { get: jest.fn() },
}));

const mockedGet = axios.get as jest.Mock;

describe("weatherService.getCurrentWeather", () => {
  beforeEach(() => jest.clearAllMocks());

  it("returns temperature and rain flag when rain is over 5mm", async () => {
    mockedGet.mockResolvedValue({
      data: { main: { temp: 22.4 }, rain: { "1h": 7.2 } },
    });

    const result = await weatherService.getCurrentWeather(1, 2);
    expect(result.temperatureC).toBe(22.4);
    expect(result.hasRainedOver5mm).toBe(true);
  });

  it("returns false when rain is below the 5mm threshold", async () => {
    mockedGet.mockResolvedValue({
      data: { main: { temp: 22.4 }, rain: { "3h": 3 } },
    });

    const result = await weatherService.getCurrentWeather(1, 2);
    expect(result.hasRainedOver5mm).toBe(false);
  });

  it("returns false when there is no rain key", async () => {
    mockedGet.mockResolvedValue({ data: { main: { temp: 22.4 } } });
    const result = await weatherService.getCurrentWeather(1, 2);
    expect(result.hasRainedOver5mm).toBe(false);
  });

  it("passes metric units and coordinates to the API", async () => {
    mockedGet.mockResolvedValue({ data: { main: { temp: 22.4 } } });
    await weatherService.getCurrentWeather(-23.5, -46.6);
    expect(mockedGet).toHaveBeenCalledWith(
      "https://api.openweathermap.org/data/2.5/weather",
      expect.objectContaining({
        params: expect.objectContaining({ lat: -23.5, lon: -46.6, units: "metric" }),
      })
    );
  });
});
