import * as ImagePicker from "expo-image-picker";
import * as Location from "expo-location";
import * as Notifications from "expo-notifications";
import { Alert, Linking, Platform } from "react-native";
import i18n from "@/i18n";

/**
 * @file src/services/permissionService.ts
 * Centralized native permission flow (camera, gallery, location,
 * notifications) with an "Open Settings" fallback.
 *
 * When the user REVOKES a permission in the system Settings, iOS/Android will
 * NOT show the native prompt again - request*PermissionsAsync() resolves to
 * "denied" immediately. In that case the only path forward is to guide the
 * user back to the system settings via Linking.openSettings().
 */

export type PermissionCheck = "granted" | "denied" | "revoked";

interface PermissionHandlers {
  get: () => Promise<{
    granted: boolean;
    status?: string;
    canAskAgain?: boolean;
  }>;
  request: () => Promise<{
    granted: boolean;
    status?: string;
    canAskAgain?: boolean;
  }>;
  titleKey: string;
  bodyKey: string;
}

const openSettingsAlert = (titleKey: string, bodyKey: string): void => {
  Alert.alert(i18n.t(titleKey, titleKey), i18n.t(bodyKey, bodyKey), [
    { text: i18n.t("common.cancel"), style: "cancel" },
    {
      text: i18n.t("permissions.openSettings"),
      onPress: () => {
        Linking.openSettings().catch(() => {
          // openSettings rarely fails; if it does, we just ignore it.
        });
      },
    },
  ]);
};

/**
 * If the OS can still show the native prompt, request the permission now.
 * Otherwise (revoked / permanently denied), show an alert with a shortcut to
 * the system Settings - the only way to re-grant a revoked permission.
 */
const ensurePermission = async ({
  get,
  request,
  titleKey,
  bodyKey,
}: PermissionHandlers): Promise<PermissionCheck> => {
  const current = await get();
  if (current.granted) return "granted";

  const canAsk =
    Platform.OS === "android"
      ? current.canAskAgain !== false
      : current.status === "undetermined";

  if (canAsk) {
    const requested = await request();
    if (requested.granted) return "granted";
    return "denied";
  }

  openSettingsAlert(titleKey, bodyKey);
  return "revoked";
};

export const permissionService = {
  ensureCameraPermission: (): Promise<PermissionCheck> =>
    ensurePermission({
      get: () => ImagePicker.getCameraPermissionsAsync(),
      request: () => ImagePicker.requestCameraPermissionsAsync(),
      titleKey: "permissions.cameraTitle",
      bodyKey: "permissions.cameraBody",
    }),

  ensureMediaLibraryPermission: (): Promise<PermissionCheck> =>
    ensurePermission({
      get: () => ImagePicker.getMediaLibraryPermissionsAsync(),
      request: () => ImagePicker.requestMediaLibraryPermissionsAsync(),
      titleKey: "permissions.mediaLibraryTitle",
      bodyKey: "permissions.mediaLibraryBody",
    }),

  ensureLocationPermission: (): Promise<PermissionCheck> =>
    ensurePermission({
      get: () => Location.getForegroundPermissionsAsync(),
      request: () => Location.requestForegroundPermissionsAsync(),
      titleKey: "permissions.locationTitle",
      bodyKey: "permissions.locationBody",
    }),

  ensureNotificationPermission: (): Promise<PermissionCheck> =>
    ensurePermission({
      get: () => Notifications.getPermissionsAsync(),
      request: () => Notifications.requestPermissionsAsync(),
      titleKey: "permissions.notificationsTitle",
      bodyKey: "permissions.notificationsBody",
    }),
};
