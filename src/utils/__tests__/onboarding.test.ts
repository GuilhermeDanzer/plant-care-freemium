import { resolveInitialRoute } from "@/utils/onboarding";

describe("resolveInitialRoute", () => {
  it("returns loading while the store is not hydrated", () => {
    expect(resolveInitialRoute(false, false)).toBe("loading");
    expect(resolveInitialRoute(false, true)).toBe("loading");
  });

  it("routes first-time users to onboarding", () => {
    expect(resolveInitialRoute(true, false)).toBe("onboarding");
  });

  it("routes returning users to main", () => {
    expect(resolveInitialRoute(true, true)).toBe("main");
  });
});
