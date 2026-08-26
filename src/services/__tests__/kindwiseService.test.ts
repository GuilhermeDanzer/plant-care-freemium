import { plantIdApi } from "@/api/axiosClient";
import { kindwiseService } from "@/services/kindwiseService";

jest.mock("@/api/axiosClient", () => ({
  plantIdApi: {
    get: jest.fn(),
  },
}));

const mockedGet = plantIdApi.get as jest.Mock;

describe("kindwiseService.searchPlantsByName", () => {
  beforeEach(() => jest.clearAllMocks());

  it("returns an empty array for a blank query without calling the API", async () => {
    await expect(kindwiseService.searchPlantsByName("   ")).resolves.toEqual([]);
    expect(mockedGet).not.toHaveBeenCalled();
  });

  it("returns the entities from a successful search", async () => {
    mockedGet.mockResolvedValue({
      data: { entities: [{ access_token: "abc" }], entities_trimmed: false, limit: 10 },
    });
    const result = await kindwiseService.searchPlantsByName("monstera");
    expect(mockedGet).toHaveBeenCalledWith(
      "/kb/plants/name_search",
      expect.objectContaining({ params: expect.objectContaining({ q: "monstera" }) })
    );
    expect(result).toHaveLength(1);
    expect(result[0].access_token).toBe("abc");
  });

  it("returns an empty array when the API errors", async () => {
    mockedGet.mockRejectedValue(new Error("network"));
    await expect(kindwiseService.searchPlantsByName("rose")).resolves.toEqual([]);
  });
});

describe("kindwiseService.getPlantDetails", () => {
  beforeEach(() => jest.clearAllMocks());

  it("returns null for a missing access token", async () => {
    await expect(kindwiseService.getPlantDetails("")).resolves.toBeNull();
    expect(mockedGet).not.toHaveBeenCalled();
  });

  it("returns the details object on success", async () => {
    mockedGet.mockResolvedValue({ data: { name: "Monstera" } });
    const result = await kindwiseService.getPlantDetails("token-1");
    expect(mockedGet).toHaveBeenCalledWith(
      "/kb/plants/token-1",
      expect.objectContaining({ params: expect.objectContaining({ language: "pt" }) })
    );
    expect(result).toEqual({ name: "Monstera" });
  });

  it("returns null on error", async () => {
    mockedGet.mockRejectedValue(new Error("boom"));
    await expect(kindwiseService.getPlantDetails("token-1")).resolves.toBeNull();
  });
});
