import { useContext } from 'react';
import { LanguageContext } from '../context/LanguageContext';
import pl from '../locales/pl';
import en from '../locales/en';

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

  // FIX: Updated the `t` function to handle non-string return types (like arrays of objects) and interpolation for strings.
  const t = (key: string, options?: { [key: string]: string | number }): any => {
    const translation = getNestedTranslation(translations[language], key);

    if (translation === undefined) {
        return key; // Return key if translation not found
    }

    if (typeof translation === 'string' && options) {
        let result = translation;
        for (const [optionKey, value] of Object.entries(options)) {
            const regex = new RegExp(`{${optionKey}}`, 'g');
            result = result.replace(regex, String(value));
        }
        return result;
    }

    return translation;
  };

  return { t, setLanguage, currentLanguage: language };
};