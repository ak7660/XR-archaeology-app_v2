/**
 * Translation Type Definitions
 * 
 * Provides type safety for translation keys throughout the app.
 * Generates types based on the English translation structure.
 */

import { en } from './en';

/**
 * Recursively generates dot-notation paths for nested translation objects
 * Example: "auth.login", "common.search", "ar.welcome"
 */
type RecursiveKeyOf<TObj extends object> = {
  [TKey in keyof TObj & string]: TObj[TKey] extends object
    ? `${TKey}` | `${TKey}.${RecursiveKeyOf<TObj[TKey]>}`
    : `${TKey}`;
}[keyof TObj & string];

/**
 * All possible translation keys in dot notation
 * Used for type-safe translation key access
 */
export type TranslationKey = RecursiveKeyOf<typeof en>;

/**
 * Type for the complete translation object structure
 * Ensures all language files have the same shape
 */
export type TranslationStructure = {
  [K in keyof typeof en]: {
    [SK in keyof typeof en[K]]: string;
  };
};

/**
 * Helper type to ensure translation objects match the structure
 */
export type Translations = TranslationStructure;
