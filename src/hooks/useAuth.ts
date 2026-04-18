import { useEffect, useState } from "react";
import { authService } from "../services/authService";
import { usePlantStore } from "../store/usePlantStore";
import { AppUser } from "../types/plant";

export interface UseAuthResult {
  user: AppUser | null;
  isAuthenticated: boolean;
  isReady: boolean;
}

/**
 * Sincroniza a sessão do Supabase com o Zustand.
 *
 * - Ao montar: lê a sessão atual via `authService.getCurrentUser()`.
 * - Em seguida: assina `supabase.auth.onAuthStateChange` via
 *   `authService.onAuthStateChange` e atualiza o store em SIGNED_IN,
 *   SIGNED_OUT, USER_UPDATED e TOKEN_REFRESHED.
 *
 * Monte este hook uma única vez (em `app/_layout.tsx`) para manter
 * o store em sincronia durante todo o ciclo de vida do app.
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
        if (isMounted) setUser(current);
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
