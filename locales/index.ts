/**
 * Locales Index
 * 
 * Central export point for all translation resources.
 * Import translations from here throughout the app.
 */

import { en } from './en';
import { hy } from './hy';
import { ru } from './ru';
import { LanguageEnum } from '@/providers/language_provider';

/**
 * Translation dictionary mapping language codes to translation objects
 */
export const translations = {
  en,
  hy,
  ru,
};

/**
 * Get translation object for a specific language
 */
export const getTranslations = (language: LanguageEnum) => {
  return translations[language] || translations.en;
};

// Export types for use throughout the app
export type { TranslationKey, Translations, TranslationStructure } from './types';
