import Purchases from "react-native-purchases";
import {
  INACTIVE_STATUS,
  PREMIUM_ENTITLEMENT_ID,
  subscriptionService,
} from "@/services/subscriptionService";

jest.mock("react-native-purchases", () => ({
  __esModule: true,
  default: {
    getCustomerInfo: jest.fn(),
    logIn: jest.fn(),
    logOut: jest.fn(),
    getOfferings: jest.fn(),
    purchasePackage: jest.fn(),
    restorePurchases: jest.fn(),
  },
  PURCHASES_ERROR_CODE: {
    PURCHASE_CANCELLED_ERROR: 1,
  },
}));

const mockedPurchases = Purchases as jest.Mocked<typeof Purchases>;

const customerInfo = (active: boolean) => ({
  entitlements: {
    active: active
      ? { [PREMIUM_ENTITLEMENT_ID]: { productIdentifier: "pro_monthly", expirationDate: "2026-02-01T00:00:00Z" } }
      : {},
  },
});

describe("subscriptionService", () => {
  beforeEach(() => jest.clearAllMocks());

  it("maps an active entitlement to an active status", async () => {
    mockedPurchases.getCustomerInfo.mockResolvedValue(customerInfo(true) as any);
    const status = await subscriptionService.checkSubscription();
    expect(status.isActive).toBe(true);
    expect(status.productId).toBe("pro_monthly");
    expect(status.expiresAt).toBe("2026-02-01T00:00:00Z");
  });

  it("returns INACTIVE_STATUS when no entitlement is active", async () => {
    mockedPurchases.getCustomerInfo.mockResolvedValue(customerInfo(false) as any);
    await expect(subscriptionService.checkSubscription()).resolves.toEqual(
      INACTIVE_STATUS
    );
  });

  it("swallows getCustomerInfo failures and returns inactive", async () => {
    mockedPurchases.getCustomerInfo.mockRejectedValue(new Error("boom"));
    await expect(subscriptionService.checkSubscription()).resolves.toEqual(
      INACTIVE_STATUS
    );
  });

  it("loginUser returns the mapped status", async () => {
    mockedPurchases.logIn.mockResolvedValue({ customerInfo: customerInfo(true) } as any);
    const status = await subscriptionService.loginUser("user-1");
    expect(mockedPurchases.logIn).toHaveBeenCalledWith("user-1");
    expect(status.isActive).toBe(true);
  });

  it("purchasePackage resolves the monthly package and maps the result", async () => {
    mockedPurchases.getOfferings.mockResolvedValue({
      current: { monthly: { product: { priceString: "US$ 9.99" } } },
    } as any);
    mockedPurchases.purchasePackage.mockResolvedValue({
      customerInfo: customerInfo(true),
    } as any);

    const status = await subscriptionService.purchasePackage();
    expect(status.isActive).toBe(true);
  });

  it("purchasePackage treats user cancellation as the current status", async () => {
    mockedPurchases.getOfferings.mockResolvedValue({
      current: { monthly: {} },
    } as any);
    mockedPurchases.purchasePackage.mockRejectedValue({
      userCancelled: true,
      code: 1,
    });
    mockedPurchases.getCustomerInfo.mockResolvedValue(customerInfo(false) as any);

    const status = await subscriptionService.purchasePackage();
    expect(status.isActive).toBe(false);
  });

  it("purchasePackage rethrows non-cancellation errors", async () => {
    mockedPurchases.getOfferings.mockResolvedValue({
      current: { monthly: {} },
    } as any);
    mockedPurchases.purchasePackage.mockRejectedValue(new Error("billing unavailable"));

    await expect(subscriptionService.purchasePackage()).rejects.toThrow("billing unavailable");
  });

  it("getMonthlyPriceString returns the package price", async () => {
    mockedPurchases.getOfferings.mockResolvedValue({
      current: { monthly: { product: { priceString: "US$ 9.99" } } },
    } as any);
    await expect(subscriptionService.getMonthlyPriceString()).resolves.toBe(
      "US$ 9.99"
    );
  });

  it("getMonthlyPriceString returns null when no offering exists", async () => {
    mockedPurchases.getOfferings.mockResolvedValue({ current: null } as any);
    await expect(subscriptionService.getMonthlyPriceString()).resolves.toBeNull();
  });
});
