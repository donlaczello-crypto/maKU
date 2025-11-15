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

  // FIX: Updated the `t` function to handle interpolation for dynamic values.
  const t = (key: string, options?: { [key: string]: string | number }): string => {
    const translation = getNestedTranslation(translations[language], key);

    if (typeof translation !== 'string') {
        return key; // Return key if translation not found or is not a string
    }

    if (options) {
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