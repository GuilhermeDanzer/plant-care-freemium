import AsyncStorage from "@react-native-async-storage/async-storage";
import type { AppUser } from "../types/plant";

const LOCAL_GUEST_ID_KEY = "plant_care_local_guest_id";

function createGuestId(): string {
  return "xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx".replace(/[xy]/g, (char) => {
    const random = (Math.random() * 16) | 0;
    const value = char === "x" ? random : (random & 0x3) | 0x8;
    return value.toString(16);
  });
}

/** UUID estável no dispositivo quando o Supabase não está disponível. */
export async function getOrCreateLocalGuestId(): Promise<string> {
  const existing = await AsyncStorage.getItem(LOCAL_GUEST_ID_KEY);
  if (existing) return existing;

  const id = createGuestId();
  await AsyncStorage.setItem(LOCAL_GUEST_ID_KEY, id);
  return id;
}

export function toLocalGuestUser(id: string): AppUser {
  return {
    id,
    email: "",
    displayName: "",
    isAnonymous: true,
  };
}
