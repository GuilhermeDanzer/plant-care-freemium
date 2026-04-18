import AsyncStorage from "@react-native-async-storage/async-storage";

/**
 * MOCK de Monetização.
 * Persiste o estado Premium em AsyncStorage para que sobreviva ao refresh do
 * app enquanto o RevenueCat / Stripe não está conectado.
 *
 * TODO: Substituir por RevenueCat (Purchases SDK) quando a conta estiver
 * configurada.
 */

export const PREMIUM_STORAGE_KEY = "@planthelper:isPremium";
export const PREMIUM_ENTITLEMENT_ID = "PlantHelper Pro";

const simulateLatency = (ms = 500): Promise<void> =>
  new Promise((resolve) => setTimeout(resolve, ms));

export interface SubscriptionStatus {
  isActive: boolean;
  productId: string | null;
  expiresAt: string | null;
}

const readStoredFlag = async (): Promise<boolean> => {
  try {
    const raw = await AsyncStorage.getItem(PREMIUM_STORAGE_KEY);
    return raw === "true";
  } catch (error) {
    console.warn("[subscriptionService] Falha ao ler storage.", error);
    return false;
  }
};

const writeStoredFlag = async (value: boolean): Promise<void> => {
  try {
    await AsyncStorage.setItem(PREMIUM_STORAGE_KEY, value ? "true" : "false");
  } catch (error) {
    console.warn("[subscriptionService] Falha ao gravar storage.", error);
  }
};

export const subscriptionService = {
  /**
   * Lê o estado atual do "entitlement" a partir do AsyncStorage.
   */
  checkSubscription: async (): Promise<SubscriptionStatus> => {
    const isActive = await readStoredFlag();
    return {
      isActive,
      productId: isActive ? PREMIUM_ENTITLEMENT_ID : null,
      expiresAt: null,
    };
  },

  /**
   * Mock do fluxo de compra. Simula latência e grava o flag Premium.
   */
  purchasePackage: async (): Promise<SubscriptionStatus> => {
    await simulateLatency(700);
    await writeStoredFlag(true);
    return {
      isActive: true,
      productId: PREMIUM_ENTITLEMENT_ID,
      expiresAt: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString(),
    };
  },

  /**
   * Mock de restauração. Apenas relê o storage — em produção vai consultar
   * o serviço do RevenueCat.
   */
  restorePurchases: async (): Promise<SubscriptionStatus> => {
    await simulateLatency(500);
    const isActive = await readStoredFlag();
    return {
      isActive,
      productId: isActive ? PREMIUM_ENTITLEMENT_ID : null,
      expiresAt: null,
    };
  },

  /**
   * Utilitário para os testes/stores resetarem o estado.
   */
  resetMock: async (): Promise<void> => {
    await writeStoredFlag(false);
  },
};
