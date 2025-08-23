import i18n from 'i18next';
import { initReactI18next } from 'react-i18next';
import LanguageDetector from 'i18next-browser-languagedetector';

import translationEN from './locales/en.json';
import translationES from './locales/es.json';
import translationCA from './locales/ca.json';

const resources = {
  en: { translation: translationEN },
  es: { translation: translationES },
  ca: { translation: translationCA },
};

i18n
  .use(LanguageDetector)
  .use(initReactI18next)
  .init({
    resources,
  fallbackLng: 'ca',
    interpolation: { escapeValue: false },
    detection: {
      order: ['localStorage', 'navigator', 'htmlTag'],
      caches: ['localStorage'],
    },
  });

export default i18n;
