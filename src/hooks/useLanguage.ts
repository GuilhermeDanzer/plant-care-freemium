import { useTranslation } from 'react-i18next';

export const useLanguage = () => {
  const { i18n, t } = useTranslation();
  const currentLanguage = i18n.language;
  const changeLanguage = async (lng: 'pt-BR' | 'en') => await i18n.changeLanguage(lng);
  
  return { 
    t,
    currentLanguage, 
    changeLanguage, 
    isPT: currentLanguage === 'pt-BR', 
    isEN: currentLanguage === 'en' 
  };
};
