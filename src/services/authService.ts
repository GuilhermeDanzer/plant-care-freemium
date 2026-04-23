import type {
  AuthChangeEvent,
  Session,
  Subscription,
} from "@supabase/supabase-js";
import Purchases from "react-native-purchases";
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
 * `isAnonymous` reflete a claim do JWT — Guest usa `signInAnonymously`
 * para garantir um UUID estável no RevenueCat desde o boot.
 */
const toAppUser = (
  user:
    | {
        id: string;
        email?: string | null;
        is_anonymous?: boolean;
        user_metadata?: Record<string, unknown>;
      }
    | null
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
    isAnonymous: Boolean(user.is_anonymous),
  };
};

/**
 * Identifica o usuário no RevenueCat. Falhas não devem bloquear o fluxo de
 * autenticação — logamos e seguimos.
 */
const syncRevenueCatIdentity = async (userId: string): Promise<void> => {
  try {
    await Purchases.logIn(userId);
  } catch (error) {
    console.warn("[authService.syncRevenueCatIdentity]", error);
  }
};

const clearRevenueCatIdentity = async (): Promise<void> => {
  try {
    await Purchases.logOut();
  } catch (error) {
    console.warn("[authService.clearRevenueCatIdentity]", error);
  }
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

  /**
   * Cria um usuário anônimo no Supabase (`signInAnonymously`) e, em seguida,
   * identifica-o no RevenueCat. Esse é o caminho Guest: o `user.id` gerado é
   * um UUID estável que acompanha o dispositivo até o upgrade para conta
   * permanente (ou o logout explícito).
   *
   * Pré-requisito: "Anonymous Sign-Ins" habilitado no dashboard
   * (Authentication → Providers → Anonymous).
   */
  signInAnonymously: async (): Promise<AppUser | null> => {
    const { data, error } = await supabase.auth.signInAnonymously();
    if (error) {
      console.warn("[authService.signInAnonymously]", error.message);
      return null;
    }
    const appUser = toAppUser(data.user);
    if (appUser) await syncRevenueCatIdentity(appUser.id);
    return appUser;
  },

  signIn: async ({ email, password }: SignInInput): Promise<AppUser | null> => {
    const { data, error } = await supabase.auth.signInWithPassword({
      email,
      password,
    });
    if (error) throw error;
    const appUser = toAppUser(data.user);
    if (appUser) await syncRevenueCatIdentity(appUser.id);
    return appUser;
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
    const appUser = toAppUser(data.user);
    if (appUser) await syncRevenueCatIdentity(appUser.id);
    return appUser;
  },

  signOut: async (): Promise<void> => {
    const { error } = await supabase.auth.signOut();
    if (error) throw error;
    await clearRevenueCatIdentity();
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
