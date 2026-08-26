import Purchases from "react-native-purchases";
import { supabase } from "@/lib/supabase";
import { authService } from "@/services/authService";

jest.mock("@/lib/supabase", () => ({
  supabase: {
    auth: {
      getUser: jest.fn(),
      signInAnonymously: jest.fn(),
      signInWithPassword: jest.fn(),
      signUp: jest.fn(),
      signOut: jest.fn(),
      onAuthStateChange: jest.fn(),
    },
    functions: {
      invoke: jest.fn(),
    },
  },
}));

jest.mock("react-native-purchases", () => ({
  __esModule: true,
  default: {
    logIn: jest.fn(),
    logOut: jest.fn(),
  },
}));

const mockedAuth = supabase.auth as jest.Mocked<typeof supabase.auth>;
const mockedPurchases = Purchases as jest.Mocked<typeof Purchases>;

const supabaseUser = {
  id: "uuid-1",
  email: "joao@example.com",
  is_anonymous: false,
  user_metadata: { displayName: "João" },
};

describe("authService", () => {
  beforeEach(() => jest.clearAllMocks());

  it("getCurrentUser maps a Supabase user to an AppUser", async () => {
    mockedAuth.getUser.mockResolvedValue({ data: { user: supabaseUser }, error: null } as any);
    const user = await authService.getCurrentUser();
    expect(user).toEqual({
      id: "uuid-1",
      email: "joao@example.com",
      displayName: "João",
      isAnonymous: false,
    });
  });

  it("getCurrentUser returns null on a missing session", async () => {
    mockedAuth.getUser.mockResolvedValue({
      data: { user: null },
      error: { name: "AuthSessionMissingError", message: "x" },
    } as any);
    await expect(authService.getCurrentUser()).resolves.toBeNull();
  });

  it("signInAnonymously syncs the RevenueCat identity", async () => {
    mockedAuth.signInAnonymously.mockResolvedValue({
      data: { user: { ...supabaseUser, email: null, is_anonymous: true } },
      error: null,
    } as any);
    const user = await authService.signInAnonymously();
    expect(user?.isAnonymous).toBe(true);
    expect(mockedPurchases.logIn).toHaveBeenCalledWith("uuid-1");
  });

  it("signIn throws the underlying error", async () => {
    mockedAuth.signInWithPassword.mockResolvedValue({
      data: { user: null },
      error: Object.assign(new Error("bad credentials"), { name: "AuthApiError" }),
    } as any);
    await expect(
      authService.signIn({ email: "a@b.c", password: "nope" })
    ).rejects.toThrow("bad credentials");
  });

  it("signUp passes the displayName through user metadata", async () => {
    mockedAuth.signUp.mockResolvedValue({ data: { user: supabaseUser }, error: null } as any);
    await authService.signUp({ email: "a@b.c", password: "123456", displayName: "Ana" });
    expect(mockedAuth.signUp).toHaveBeenCalledWith({
      email: "a@b.c",
      password: "123456",
      options: { data: { displayName: "Ana" } },
    });
  });

  it("signOut clears the RevenueCat identity", async () => {
    mockedAuth.signOut.mockResolvedValue({ error: null } as any);
    await authService.signOut();
    expect(mockedPurchases.logOut).toHaveBeenCalled();
  });

  it("deleteAccount invokes the edge function and clears session", async () => {
    mockedAuth.signOut.mockResolvedValue({ error: null } as any);
    supabase.functions.invoke = jest.fn().mockResolvedValue({ error: null });
    await authService.deleteAccount();
    expect(supabase.functions.invoke).toHaveBeenCalledWith("delete-account", {});
    expect(mockedAuth.signOut).toHaveBeenCalled();
    expect(mockedPurchases.logOut).toHaveBeenCalled();
  });

  it("deleteAccount surfaces the server error message", async () => {
    supabase.functions.invoke = jest.fn().mockResolvedValue({
      error: { message: "fallback", context: { json: async () => ({ error: "Server says no" }) } },
    });
    await expect(authService.deleteAccount()).rejects.toThrow("Server says no");
  });

  it("onAuthStateChange forwards mapped users to the callback", () => {
    const callback = jest.fn();
    (mockedAuth.onAuthStateChange as unknown as jest.Mock).mockImplementation((cb: any) => {
      cb("SIGNED_IN", { user: supabaseUser });
      return { data: { subscription: { unsubscribe: jest.fn() } } };
    });
    const handle = authService.onAuthStateChange(callback);
    expect(callback).toHaveBeenCalledWith(
      "SIGNED_IN",
      expect.objectContaining({ id: "uuid-1" }),
      expect.anything()
    );
    expect(handle.unsubscribe).toBeDefined();
  });
});
