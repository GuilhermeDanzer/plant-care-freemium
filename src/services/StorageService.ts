import { supabase } from "@/lib/supabase";
import * as FileSystem from "expo-file-system/legacy";
import * as Crypto from "expo-crypto";
import { decode } from "base64-arraybuffer";

export const uploadImageToSupabase = async (
  localUri: string,
  folder: string = "plants"
): Promise<string | null> => {
  try {
    const { data: userData } = await supabase.auth.getUser();
    if (!userData.user) {
      console.warn("[StorageService] Cannot upload image, no user logged in");
      return null;
    }
    const userId = userData.user.id;

    // We can't always rely on fetch(uri).blob() in all React Native environments,
    // reading as base64 and converting to ArrayBuffer is highly reliable.
    const base64 = await FileSystem.readAsStringAsync(localUri, {
      encoding: FileSystem.EncodingType.Base64,
    });
    
    // Extract file extension
    const ext = localUri.split(".").pop() || "jpg";
    const fileName = `${userId}/${folder}/${Crypto.randomUUID()}.${ext}`;

    const { data, error } = await supabase.storage
      .from("plant-images")
      .upload(fileName, decode(base64), {
        contentType: `image/${ext === 'png' ? 'png' : 'jpeg'}`,
      });

    if (error) {
      console.error("[StorageService] Failed to upload image:", error);
      return null;
    }

    const { data: publicUrlData } = supabase.storage
      .from("plant-images")
      .getPublicUrl(data.path);

    return publicUrlData.publicUrl;
  } catch (err) {
    console.error("[StorageService] Error uploading image:", err);
    return null;
  }
};
