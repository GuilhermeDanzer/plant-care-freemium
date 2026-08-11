export interface UserScanState {
  isPremium: boolean;
  totalFreeScansUsed: number;
  monthlyPremiumScansUsed: number;
}

const MAX_FREE_SCANS = 1;
const MAX_PREMIUM_SCANS_PER_MONTH = 10;

/**
 * Checks a user's available AI credits before allowing the camera to open.
 * Returns a boolean indicating if the user has balance, and a reason if not.
 */
export function checkScanBalance(userState: UserScanState): {
  hasBalance: boolean;
  reason?: "OUT_OF_FREE_SCANS" | "OUT_OF_PREMIUM_SCANS";
} {
  if (!userState.isPremium) {
    if (userState.totalFreeScansUsed >= MAX_FREE_SCANS) {
      return { hasBalance: false, reason: "OUT_OF_FREE_SCANS" };
    }
    return { hasBalance: true };
  } else {
    if (userState.monthlyPremiumScansUsed >= MAX_PREMIUM_SCANS_PER_MONTH) {
      return { hasBalance: false, reason: "OUT_OF_PREMIUM_SCANS" };
    }
    return { hasBalance: true };
  }
}
