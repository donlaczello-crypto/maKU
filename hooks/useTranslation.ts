import { useContext } from 'react';
import { LanguageContext } from '../context/LanguageContext';
import pl from '../locales/pl.ts';
import en from '../locales/en.ts';

const translations = { pl, en };

// Helper to access nested keys like 'dashboard.title'
const getNestedTranslation = (obj: any, key: string) => {
    try {
        return key.split('.').reduce((o, i) => (o ? o[i] : undefined), obj);
    } catch (e) {
        return undefined;
    }
};

export const useTranslation = () => {  
  const context = useContext(LanguageContext);

  if (context === undefined) {
    throw new Error('useTranslation must be used within a LanguageProvider');
  }

  const { language, setLanguage } = context;

  const t = (key: string): string => {
    const translation = getNestedTranslation(translations[language], key);
    return translation || key; // Return key if translation not found
  };

  return { t, setLanguage, currentLanguage: language };
};