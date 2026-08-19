import i18n from 'i18next';
import { initReactI18next } from 'react-i18next';
import * as Localization from 'expo-localization';
import AsyncStorage from '@react-native-async-storage/async-storage';
import ptBR from '@/i18n/locales/pt-BR.json';
import en from '@/i18n/locales/en.json';

const LANGUAGE_KEY = '@app_language';
const resources = { 'pt-BR': { translation: ptBR }, 'en': { translation: en } };

const getDeviceLanguage = (): string => {
  const deviceLocale = Localization.getLocales()[0]?.languageCode;
  return deviceLocale === 'pt' ? 'pt-BR' : 'en';
};

const languageDetector = {
  type: 'languageDetector' as const,
  async: true,
  detect: async (callback: (lng: string) => void) => {
    try {
      const savedLanguage = await AsyncStorage.getItem(LANGUAGE_KEY);
      if (savedLanguage) return callback(savedLanguage);
    } catch (e) {}
    return callback(getDeviceLanguage());
  },
  init: () => {},
  cacheUserLanguage: async (lng: string) => {
    try { await AsyncStorage.setItem(LANGUAGE_KEY, lng); } catch (e) {}
  },
};

i18n
  .use(languageDetector)
  .use(initReactI18next)
  .init({
    resources,
    fallbackLng: 'en',
    compatibilityJSON: 'v4',
    interpolation: { escapeValue: false },
    react: { useSuspense: false },
  });

export default i18n;
