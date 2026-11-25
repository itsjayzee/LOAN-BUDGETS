import { Language, Translations, LanguageOption } from '../../types';
import { en } from './en';
import { ar } from './ar';
import { ku } from './ku';
import { tr } from './tr';
import { fr } from './fr';
import { es } from './es';

export const translations: Record<Language, Translations> = {
  en,
  ar,
  ku,
  tr,
  fr,
  es,
};

export const LANGUAGE_OPTIONS: LanguageOption[] = [
  { code: 'en', name: 'English', nativeName: 'English', flag: '🇺🇸', shortCode: 'EN', isRtl: false },
  { code: 'es', name: 'Spanish', nativeName: 'Español', flag: '🇪🇸', shortCode: 'ES', isRtl: false },
  { code: 'tr', name: 'Turkish', nativeName: 'Türkçe', flag: '🇹🇷', shortCode: 'TR', isRtl: false },
  { code: 'fr', name: 'French', nativeName: 'Français', flag: '🇫🇷', shortCode: 'FR', isRtl: false },
  { code: 'ar', name: 'Arabic', nativeName: 'العربية', flag: '🇸🇦', shortCode: 'AR', isRtl: true },
  { code: 'ku', name: 'Kurdish', nativeName: 'کوردی', flag: '☀️', shortCode: 'KD', isRtl: true },
];

export { en, ar, ku, tr, fr, es };
