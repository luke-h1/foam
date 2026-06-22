import { getLocales } from 'expo-localization';
import i18next from 'i18next';
import { initReactI18next } from 'react-i18next';
import en from './locales/en';

export const resources = { en } as const;
export const defaultNS = 'common';

export const fallbackLanguage = 'en';
export const supportedLanguages = ['en'] as const;

const supported = supportedLanguages as unknown as string[];

function detectFromDevice(): string {
  const deviceLanguage = getLocales()[0]?.languageCode;
  if (deviceLanguage && supported.includes(deviceLanguage)) {
    return deviceLanguage;
  }
  return fallbackLanguage;
}

void i18next.use(initReactI18next).init({
  resources,
  fallbackLng: fallbackLanguage,
  defaultNS,
  supportedLngs: supported,
  lng: detectFromDevice(),
  interpolation: {
    escapeValue: false,
  },
});

export default i18next;
