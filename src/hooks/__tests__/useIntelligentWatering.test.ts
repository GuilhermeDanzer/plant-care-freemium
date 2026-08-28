import { renderHook, act } from "@testing-library/react-native";
import { useIntelligentWatering } from "@/hooks/useIntelligentWatering";
import { weatherService } from "@/services/weatherService";
import { permissionService } from "@/services/permissionService";

jest.mock("@/i18n", () => ({
  __esModule: true,
  default: { t: (key: string) => key },
}));

jest.mock("expo-location", () => ({
  getCurrentPositionAsync: jest.fn(),
  Accuracy: { Balanced: 1 },
}));

jest.mock("@/services/weatherService", () => ({
  weatherService: { getCurrentWeather: jest.fn() },
}));

jest.mock("@/services/permissionService", () => ({
  permissionService: { ensureLocationPermission: jest.fn() },
}));

const Location = require("expo-location");

const plant = {
  id: "p1",
  baseWateringIntervalDays: 10,
  isOutdoors: true,
  lastWateredDate: new Date(2026, 0, 1),
};

describe("useIntelligentWatering.calculateAdjustedSchedules", () => {
  beforeEach(() => jest.clearAllMocks());

  it("returns adjusted plants on success", async () => {
    (permissionService.ensureLocationPermission as jest.Mock).mockResolvedValue("granted");
    Location.getCurrentPositionAsync.mockResolvedValue({
      coords: { latitude: -23.5, longitude: -46.6 },
    });
    (weatherService.getCurrentWeather as jest.Mock).mockResolvedValue({
      temperatureC: 22,
      hasRainedOver5mm: false,
    });

    const { result } = renderHook(() => useIntelligentWatering());
    let adjusted: any[] = [];
    await act(async () => {
      adjusted = await result.current.calculateAdjustedSchedules([plant]);
    });

    expect(adjusted).toHaveLength(1);
    expect(adjusted[0].adjustedNextWateringDate).toBeInstanceOf(Date);
    expect(result.current.error).toBeNull();
    expect(result.current.isLoading).toBe(false);
  });

  it("returns [] and sets an error when location permission is denied", async () => {
    (permissionService.ensureLocationPermission as jest.Mock).mockResolvedValue("denied");

    const { result } = renderHook(() => useIntelligentWatering());
    let adjusted: any[] = [];
    await act(async () => {
      adjusted = await result.current.calculateAdjustedSchedules([plant]);
    });

    expect(adjusted).toEqual([]);
    expect(result.current.error).toBe("permissions.locationDeniedMessage");
    expect(weatherService.getCurrentWeather).not.toHaveBeenCalled();
  });

  it("returns [] and sets an error when the weather call fails", async () => {
    (permissionService.ensureLocationPermission as jest.Mock).mockResolvedValue("granted");
    Location.getCurrentPositionAsync.mockResolvedValue({
      coords: { latitude: -23.5, longitude: -46.6 },
    });
    (weatherService.getCurrentWeather as jest.Mock).mockRejectedValue(new Error("offline"));

    const { result } = renderHook(() => useIntelligentWatering());
    let adjusted: any[] = [];
    await act(async () => {
      adjusted = await result.current.calculateAdjustedSchedules([plant]);
    });

    expect(adjusted).toEqual([]);
    expect(result.current.error).toBe("offline");
    expect(result.current.isLoading).toBe(false);
  });
});
