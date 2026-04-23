import Purchases, {
  type CustomerInfo,
  PURCHASES_ERROR_CODE,
  type PurchasesError,
} from "react-native-purchases";

/**
 * RevenueCat é a fonte única da verdade do status Premium.
 * Este serviço encapsula o SDK e devolve um `SubscriptionStatus` estável
 * pro Zustand/UI — a interface pública é idêntica à do mock anterior para
 * preservar os consumidores (store, PaywallModal).
 */

export const PREMIUM_ENTITLEMENT_ID = "PlantHelper Pro";

export interface SubscriptionStatus {
  isActive: boolean;
  productId: string | null;
  expiresAt: string | null;
}

export const INACTIVE_STATUS: SubscriptionStatus = {
  isActive: false,
  productId: null,
  expiresAt: null,
};

const toStatus = (info: CustomerInfo): SubscriptionStatus => {
  const entitlement = info.entitlements.active[PREMIUM_ENTITLEMENT_ID];
  if (!entitlement) return INACTIVE_STATUS;
  return {
    isActive: true,
    productId: entitlement.productIdentifier ?? null,
    expiresAt: entitlement.expirationDate ?? null,
  };
};

const isUserCancelledError = (error: unknown): boolean => {
  const e = error as Partial<PurchasesError> | undefined;
  if (!e) return false;
  if (e.userCancelled === true) return true;
  if (e.code === PURCHASES_ERROR_CODE.PURCHASE_CANCELLED_ERROR) return true;
  return false;
};

export const subscriptionService = {
  checkSubscription: async (): Promise<SubscriptionStatus> => {
    try {
      const info = await Purchases.getCustomerInfo();
      return toStatus(info);
    } catch (error) {
      console.warn("[subscriptionService.checkSubscription]", error);
      return INACTIVE_STATUS;
    }
  },

  /**
   * Dispara a compra do pacote mensal da offering corrente.
   * Cancelamento do usuário é tratado silenciosamente — devolvemos o status
   * atual (sem throw), pro PaywallModal não piscar um toast de erro.
   */
  purchasePackage: async (): Promise<SubscriptionStatus> => {
    const offerings = await Purchases.getOfferings();
    const current = offerings.current;
    if (!current) {
      throw new Error(
        "Nenhuma offering ativa configurada no RevenueCat. Verifique o dashboard."
      );
    }

    // Preferimos o slot mágico `monthly` ($rc_monthly). Caímos em fallbacks
    // se o projeto usar identifiers customizados.
    const pkg =
      current.monthly ??
      current.availablePackages.find((p) => p.identifier === "$rc_monthly") ??
      current.availablePackages.find((p) => p.identifier === "Monthly");

    if (!pkg) {
      throw new Error(
        "Nenhum package mensal encontrado na offering atual do RevenueCat."
      );
    }

    try {
      const { customerInfo } = await Purchases.purchasePackage(pkg);
      return toStatus(customerInfo);
    } catch (error) {
      if (isUserCancelledError(error)) {
        // Fluxo esperado — usuário fechou o sheet. Devolve o estado vigente.
        return subscriptionService.checkSubscription();
      }
      throw error;
    }
  },

  restorePurchases: async (): Promise<SubscriptionStatus> => {
    const info = await Purchases.restorePurchases();
    return toStatus(info);
  },
};
