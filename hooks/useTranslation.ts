/**
 * useTranslation Hook
 * 
 * Provides convenient access to static string translations.
 * Use this hook in components that need localized UI text.
 * 
 * @example
 * ```tsx
 * import { useTranslation } from '@/hooks/useTranslation';
 * 
 * function MyComponent() {
 *   const { t } = useTranslation();
 *   
 *   return (
 *     <>
 *       <Button>{t('auth.login')}</Button>
 *       <Text>{t('common.loading')}</Text>
 *     </>
 *   );
 * }
 * ```
 */

import { useCallback } from "react";
import { useLanguage } from "@/providers/language_provider";
import { TranslationKey } from "@/locales";

export function useTranslation() {
  const { t: translate } = useLanguage();

  // Memoize the translation function for performance
  const t = useCallback(
    (key: TranslationKey) => translate(key),
    [translate]
  );

  return { t };
}
