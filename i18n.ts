import i18next from 'i18next';
import { initReactI18next } from 'react-i18next';
import AsyncStorage from '@react-native-async-storage/async-storage';
import en from './locales/en';
import zh from './locales/zh';

const LANGUAGE_KEY = 'user_language';

const initI18n = async () => {
  const savedLang = await AsyncStorage.getItem(LANGUAGE_KEY);

  await i18next.use(initReactI18next).init({
    compatibilityJSON: 'v4',
    lng: savedLang ?? 'en',
    fallbackLng: 'en',
    resources: {
      en: { translation: en },
      zh: { translation: zh },
    },
  });
};

initI18n();

export default i18next;