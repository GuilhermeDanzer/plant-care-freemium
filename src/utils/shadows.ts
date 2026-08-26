import { StyleSheet, type ViewStyle } from "react-native";

/**
 * Shadow Layering: combine sempre `cast` (View exterior, sem background) +
 * `core` (View interior com background + borderRadius). Isso produz a
 * profundidade "Apple-like" realista, sem halo duplo.
 */
export const shadowLayering = StyleSheet.create({
  cast: {
    shadowColor: "#0f172a",
    shadowOffset: { width: 0, height: 14 },
    shadowOpacity: 0.1,
    shadowRadius: 22,
    elevation: 10,
  },
  core: {
    shadowColor: "#0f172a",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.06,
    shadowRadius: 4,
    elevation: 2,
  },
});

export const shadowCastSoft: ViewStyle = {
  shadowColor: "#0f172a",
  shadowOffset: { width: 0, height: 10 },
  shadowOpacity: 0.08,
  shadowRadius: 16,
  elevation: 6,
};

/** Sombra ligeiramente esverdeada para elementos premium. */
export const shadowCastEmerald: ViewStyle = {
  shadowColor: "#064e3b",
  shadowOffset: { width: 0, height: 14 },
  shadowOpacity: 0.28,
  shadowRadius: 22,
  elevation: 12,
};

/** Sombra suave para botões circulares de "voltar". */
export const shadowBackButton: ViewStyle = {
  shadowColor: "#0f172a",
  shadowOffset: { width: 0, height: 2 },
  shadowOpacity: 0.1,
  shadowRadius: 6,
  elevation: 4,
};
