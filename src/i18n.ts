import i18n from 'i18next';
import { initReactI18next } from 'react-i18next';
import LanguageDetector from 'i18next-browser-languagedetector';

import en from './locales/en/translation.json';
import hi from './locales/hi/translation.json';
import mr from './locales/mr/translation.json';
import bn from './locales/bn/translation.json';
import ta from './locales/ta/translation.json';
import te from './locales/te/translation.json';
import gu from './locales/gu/translation.json';
import kn from './locales/kn/translation.json';
import ml from './locales/ml/translation.json';
import pa from './locales/pa/translation.json';
import or from './locales/or/translation.json';
import as from './locales/as/translation.json';
import ur from './locales/ur/translation.json';
import sa from './locales/sa/translation.json';

i18n
    .use(LanguageDetector)
    .use(initReactI18next)
    .init({
        resources: {
            en: { translation: en },
            hi: { translation: hi },
            mr: { translation: mr },
            bn: { translation: bn },
            ta: { translation: ta },
            te: { translation: te },
            gu: { translation: gu },
            kn: { translation: kn },
            ml: { translation: ml },
            pa: { translation: pa },
            or: { translation: or },
            as: { translation: as },
            ur: { translation: ur },
            sa: { translation: sa },
        },
        fallbackLng: 'en',
        interpolation: {
            escapeValue: false,
        },
        detection: {
            order: ['localStorage', 'navigator'],
            caches: ['localStorage'],
        }
    });

export default i18n;
