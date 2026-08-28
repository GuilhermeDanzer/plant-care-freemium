/**
 * Jest configuration for PlantHelper.
 *
 * Uses the canonical `jest-expo` preset for Expo SDK 54 / React Native 0.81,
 * which also wires up the `@/*` → `./src/*` path alias from tsconfig.json
 * (via its built-in TypeScript mapping support).
 *
 * The `transformIgnorePatterns` whitelist is required so Babel transforms
 * these ESM/TS packages instead of leaving them as untranspiled `import`
 * statements: NativeWind + css-interop, Reanimated + worklets, Supabase,
 * TanStack Query, i18next and the RevenueCat SDK.
 */
module.exports = {
  preset: "jest-expo",

  // The app logs expected network/database failures via console.warn/error
  // (that logging is correct in production). Silence it during tests so the
  // `npm test` output shows only the pass/fail summary.
  silent: true,

  // Global environment setup (Reanimated/AsyncStorage mocks etc.).
  setupFiles: ["<rootDir>/jest.setup.js"],

  // Allow ESM/TS-first dependencies to be transformed by babel-jest.
  transformIgnorePatterns: [
    "node_modules/(?!((jest-)?react-native|@react-native(-community)?)|expo(nent)?|@expo(nent)?/.*|@expo-google-fonts/.*|react-navigation|@react-navigation/.*|@sentry/react-native|native-base|react-native-svg|react-native-reanimated|react-native-worklets|nativewind|react-native-css-interop|@supabase|supabase-js|@tanstack|react-i18next|i18next|react-native-purchases|@react-native-async-storage/async-storage)",
  ],

  moduleNameMapper: {
    // NativeWind's `global.css` import only lives in the root layout; unit
    // tests never render it, so map it to a harmless stub.
    "\\.css$": "<rootDir>/jest.css-stub.js",
  },

  // Ignore native build output.
  testPathIgnorePatterns: ["/node_modules/", "/android/", "/ios/"],
};
