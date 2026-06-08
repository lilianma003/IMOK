import i18next from 'i18next';
import { initReactI18next } from 'react-i18next';
import AsyncStorage from '@react-native-async-storage/async-storage';
import en from './locales/en';
import zh from './locales/zh';

i18next.use(initReactI18next).init({
  compatibilityJSON: 'v4',
  lng: 'en',
  fallbackLng: 'en',
  resources: {
    en: { translation: en },
    zh: { translation: zh },
  },
});

// Load saved language preference
AsyncStorage.getItem('user_language').then(lang => {
  if (lang) i18next.changeLanguage(lang);
});

export default i18next;