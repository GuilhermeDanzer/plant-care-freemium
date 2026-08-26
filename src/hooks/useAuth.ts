import { useEffect, useState } from "react";
import Purchases from "react-native-purchases";
import { authService } from "@/services/authService";
import { usePlantStore } from "@/store/usePlantStore";
import { AppUser } from "@/types/plant";
import { subscriptionService, PREMIUM_ENTITLEMENT_ID } from "@/services/subscriptionService";
import { supabase } from "@/lib/supabase";

export interface UseAuthResult {
  user: AppUser | null;
  isAuthenticated: boolean;
  isReady: boolean;
}

/**
 * Sincroniza a sessão do Supabase com o Zustand e mantém a identidade do
 * RevenueCat alinhada ao `user.id`.
 *
 * - Ao montar: lê a sessão atual. Se não houver nenhuma, dispara
 *   `signInAnonymously()` para garantir um UUID estável no RevenueCat
 *   desde o primeiro boot.
 * - Em seguida: assina `onAuthStateChange` e reage a SIGNED_IN /
 *   SIGNED_OUT / USER_UPDATED / TOKEN_REFRESHED.
 *
 * Monte este hook uma única vez (em `app/_layout.tsx`).
 */
export function useAuth(): UseAuthResult {
  const user = usePlantStore((s) => s.user);
  const isAuthenticated = usePlantStore((s) => s.isAuthenticated);
  const setUser = usePlantStore((s) => s.setUser);

  const [isReady, setIsReady] = useState(false);

  useEffect(() => {
    let isMounted = true;

    (async () => {
      try {
        const current = await authService.getCurrentUser();
        if (!isMounted) return;

        if (current) {
          setUser(current);
          
          // Garante que o RC conhece este UUID, mesmo em boots subsequentes.
          await subscriptionService.loginUser(current.id);
          
          // Fetch the absolute source of truth from RevenueCat
          const customerInfo = await Purchases.getCustomerInfo();
          const isPremium = Boolean(customerInfo.entitlements.active[PREMIUM_ENTITLEMENT_ID]);
          
          // Immediately update the `isPremium` state in Zustand
          usePlantStore.getState().setPremium(isPremium);

          // Execute an update to the Supabase profiles table to ensure is_premium is synced
          if (!current.isAnonymous) {
            try {
              await supabase
                .from("profiles")
                .update({ is_premium: isPremium })
                .eq("id", current.id);
            } catch (e) {
              console.warn("[useAuth] Failed to sync is_premium to Supabase:", e);
            }
            usePlantStore.getState().syncDataWithSupabase();
          }
        } else {
          // Sem sessão: cria um Guest anônimo no Supabase. O próprio
          // `signInAnonymously` do authService já chama Purchases.logIn
          // com o user.id recém-criado.
          const anon = await authService.signInAnonymously();
          if (isMounted && anon) setUser(anon);
        }
      } catch (error) {
        console.warn("[useAuth] Falha ao hidratar sessão inicial.", error);
      } finally {
        if (isMounted) setIsReady(true);
      }
    })();

    const { unsubscribe } = authService.onAuthStateChange((event, nextUser) => {
      if (!isMounted) return;

      switch (event) {
        case "SIGNED_IN":
        case "TOKEN_REFRESHED":
        case "USER_UPDATED":
          setUser(nextUser);
          if (nextUser && !nextUser.isAnonymous) {
            subscriptionService.loginUser(nextUser.id).then(async () => {
              const customerInfo = await Purchases.getCustomerInfo();
              const isPremium = Boolean(customerInfo.entitlements.active[PREMIUM_ENTITLEMENT_ID]);
              usePlantStore.getState().setPremium(isPremium);
              
              try {
                await supabase
                  .from("profiles")
                  .update({ is_premium: isPremium })
                  .eq("id", nextUser.id);
              } catch (e) {
                console.warn("[useAuth] Failed to sync is_premium to Supabase:", e);
              }
            });
            usePlantStore.getState().syncDataWithSupabase();
          }
          break;
        case "SIGNED_OUT":
          setUser(null);
          // Memory-only reset: do NOT wipe SQLite here. This event can fire
          // transiently when an anonymous session is upgraded to a real
          // account, and the guest's plants must survive to be pushed.
          usePlantStore.getState().clearGarden();
          break;
        default:
          break;
      }
    });

    return () => {
      isMounted = false;
      unsubscribe();
    };
  }, [setUser]);

  return { user, isAuthenticated, isReady };
}
