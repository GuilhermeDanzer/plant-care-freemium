import { getPlantDisplayName } from "@/utils/plantUtils";

describe("getPlantDisplayName", () => {
  it("prefers a non-empty nickname", () => {
    expect(
      getPlantDisplayName({ nickname: "Rex", original_name: "Monstera" })
    ).toBe("Rex");
  });

  it("trims whitespace from the nickname", () => {
    expect(
      getPlantDisplayName({ nickname: "  Rex  ", original_name: "Monstera" })
    ).toBe("Rex");
  });

  it("falls back to the original name when the nickname is empty", () => {
    expect(getPlantDisplayName({ nickname: "", original_name: "Monstera" })).toBe(
      "Monstera"
    );
  });

  it("falls back when the nickname is null", () => {
    expect(
      getPlantDisplayName({ nickname: null, original_name: "Monstera" })
    ).toBe("Monstera");
  });

  it("falls back when the nickname is only whitespace", () => {
    expect(
      getPlantDisplayName({ nickname: "   ", original_name: "Monstera" })
    ).toBe("Monstera");
  });
});
