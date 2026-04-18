import type {
  AuthChangeEvent,
  Session,
  Subscription,
} from "@supabase/supabase-js";
import { supabase } from "../lib/supabase";
import { AppUser } from "../types/plant";

export interface SignInInput {
  email: string;
  password: string;
}

export interface SignUpInput extends SignInInput {
  displayName?: string;
}

/**
 * Normaliza o `User` do Supabase para o shape `AppUser` usado pelo Zustand.
 * Tudo que não for crítico para a UI é ignorado.
 */
const toAppUser = (
  user: { id: string; email?: string | null; user_metadata?: Record<string, unknown> } | null
): AppUser | null => {
  if (!user) return null;

  const metadata = user.user_metadata ?? {};
  const displayName =
    (typeof metadata.displayName === "string" && metadata.displayName) ||
    (typeof metadata.full_name === "string" && metadata.full_name) ||
    user.email?.split("@")[0] ||
    "";

  return {
    id: user.id,
    email: user.email ?? "",
    displayName,
  };
};

export const authService = {
  getCurrentUser: async (): Promise<AppUser | null> => {
    const { data, error } = await supabase.auth.getUser();
    if (error) {
      // "AuthSessionMissingError" não é um erro: só significa "sem sessão".
      if (error.name !== "AuthSessionMissingError") {
        console.warn("[authService.getCurrentUser]", error.message);
      }
      return null;
    }
    return toAppUser(data.user);
  },

  signIn: async ({ email, password }: SignInInput): Promise<AppUser | null> => {
    const { data, error } = await supabase.auth.signInWithPassword({
      email,
      password,
    });
    if (error) throw error;
    return toAppUser(data.user);
  },

  signUp: async ({
    email,
    password,
    displayName,
  }: SignUpInput): Promise<AppUser | null> => {
    const { data, error } = await supabase.auth.signUp({
      email,
      password,
      options: displayName ? { data: { displayName } } : undefined,
    });
    if (error) throw error;
    return toAppUser(data.user);
  },

  signOut: async (): Promise<void> => {
    const { error } = await supabase.auth.signOut();
    if (error) throw error;
  },

  /**
   * Assina mudanças de sessão (login, logout, refresh). Retorna o handle
   * para unsubscribe.
   */
  onAuthStateChange: (
    callback: (event: AuthChangeEvent, user: AppUser | null, session: Session | null) => void
  ): { unsubscribe: () => void } => {
    const { data } = supabase.auth.onAuthStateChange((event, session) => {
      callback(event, toAppUser(session?.user ?? null), session);
    });
    const subscription: Subscription = data.subscription;
    return { unsubscribe: () => subscription.unsubscribe() };
  },
};
