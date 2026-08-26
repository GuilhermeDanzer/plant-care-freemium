import { checkScanBalance } from "@/utils/checkScanBalance";

describe("checkScanBalance", () => {
  it("allows the first free scan", () => {
    expect(
      checkScanBalance({ isPremium: false, totalFreeScansUsed: 0, monthlyPremiumScansUsed: 0 })
    ).toEqual({ hasBalance: true });
  });

  it("blocks free users after the single free scan", () => {
    const result = checkScanBalance({
      isPremium: false,
      totalFreeScansUsed: 1,
      monthlyPremiumScansUsed: 0,
    });
    expect(result.hasBalance).toBe(false);
    expect(result.reason).toBe("OUT_OF_FREE_SCANS");
  });

  it("allows premium users regardless of free scans used", () => {
    expect(
      checkScanBalance({ isPremium: true, totalFreeScansUsed: 5, monthlyPremiumScansUsed: 0 })
    ).toEqual({ hasBalance: true });
  });

  it("blocks premium users past the monthly premium cap", () => {
    const result = checkScanBalance({
      isPremium: true,
      totalFreeScansUsed: 0,
      monthlyPremiumScansUsed: 10,
    });
    expect(result.hasBalance).toBe(false);
    expect(result.reason).toBe("OUT_OF_PREMIUM_SCANS");
  });

  it("allows premium users just under the monthly cap", () => {
    expect(
      checkScanBalance({ isPremium: true, totalFreeScansUsed: 0, monthlyPremiumScansUsed: 9 })
    ).toEqual({ hasBalance: true });
  });
});
