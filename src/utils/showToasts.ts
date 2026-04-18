import Toast from "react-native-toast-message";

const GLOBAL_POSITION = "bottom" as const;
const GLOBAL_BOTTOM_OFFSET = 60;

interface ToastOptions {
  visibilityTime?: number;
}

export const showSuccessToast = (
  title: string,
  message?: string,
  options: ToastOptions = {}
): void => {
  Toast.show({
    type: "customSuccess",
    text1: title,
    text2: message,
    position: GLOBAL_POSITION,
    bottomOffset: GLOBAL_BOTTOM_OFFSET,
    visibilityTime: options.visibilityTime ?? 2200,
  });
};

export const showErrorToast = (
  title: string,
  message?: string,
  options: ToastOptions = {}
): void => {
  Toast.show({
    type: "customError",
    text1: title,
    text2: message,
    position: GLOBAL_POSITION,
    bottomOffset: GLOBAL_BOTTOM_OFFSET,
    visibilityTime: options.visibilityTime ?? 2800,
  });
};

export const showInfoToast = (
  title: string,
  message?: string,
  options: ToastOptions = {}
): void => {
  Toast.show({
    type: "customInfo",
    text1: title,
    text2: message,
    position: GLOBAL_POSITION,
    bottomOffset: GLOBAL_BOTTOM_OFFSET,
    visibilityTime: options.visibilityTime ?? 2600,
  });
};

export const showPremiumToast = (
  title = "Recurso Premium",
  message = "Desbloqueie para liberar este recurso.",
  options: ToastOptions = {}
): void => {
  Toast.show({
    type: "customPremium",
    text1: title,
    text2: message,
    position: GLOBAL_POSITION,
    bottomOffset: GLOBAL_BOTTOM_OFFSET,
    visibilityTime: options.visibilityTime ?? 2800,
  });
};
