/**
 * Global Jest setup — runs before every test file.
 *
 * 1. Reanimated v4 (and its `react-native-worklets` runtime) have no Node
 *    implementation, so we swap in the official mock.
 * 2. AsyncStorage uses the official in-memory jest mock so Zustand `persist`
 *    hydration works without a native bridge.
 */
/* eslint-disable no-undef */
global.__reanimatedWorkletInit = () => {};

// Expo inlines EXPO_PUBLIC_* vars only during Metro bundling, not in Jest.
// Provide test values so services that read them at module scope don't throw.
process.env.EXPO_PUBLIC_OPENWEATHER_API_KEY =
  process.env.EXPO_PUBLIC_OPENWEATHER_API_KEY || "test-openweather-key";
process.env.EXPO_PUBLIC_PLANT_ID_API_KEY =
  process.env.EXPO_PUBLIC_PLANT_ID_API_KEY || "test-plantid-key";

jest.mock("react-native-reanimated", () =>
  require("react-native-reanimated/mock")
);

jest.mock("@react-native-async-storage/async-storage", () =>
  require("@react-native-async-storage/async-storage/jest/async-storage-mock")
);

