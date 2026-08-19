import 'i18next';
import ptBR from '@/i18n/locales/pt-BR.json';

declare module 'i18next' {
  interface CustomTypeOptions {
    defaultNS: 'translation';
    resources: {
      translation: typeof ptBR;
    };
  }
}
