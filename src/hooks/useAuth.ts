import { useEffect, useState } from "react";
import Purchases from "react-native-purchases";
import { authService } from "@/services/authService";
import { usePlantStore } from "@/store/usePlantStore";
import { AppUser } from "@/types/plant";
import { subscriptionService } from "@/services/subscriptionService";

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
          const subStatus = await subscriptionService.loginUser(current.id);
          usePlantStore.getState().setPremium(subStatus.isActive);

          // Sincroniza dados pendentes com o Supabase ao retomar sessão.
          if (!current.isAnonymous) {
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
            subscriptionService.loginUser(nextUser.id).then((subStatus) => {
              usePlantStore.getState().setPremium(subStatus.isActive);
            });
            usePlantStore.getState().syncDataWithSupabase();
          }
          break;
        case "SIGNED_OUT":
          setUser(null);
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
