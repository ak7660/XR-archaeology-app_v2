import { useCallback } from "react";
import { useLanguage } from "@/providers/language_provider";
import { MultilingualText } from "@/models/attraction";

/**
 * A hook to get a memoized function for translating multilingual text.
 * This helps prevent re-renders in components that use translated text.
 *
 * @returns A function that takes a `MultilingualText` object and returns the
 * localized string based on the current language.
 */
export function useLocalizedText() {
  const { getLocalizedText } = useLanguage();

  // The hook now returns a memoized function that can be used to translate text.
  // useCallback ensures this function has a stable identity across re-renders,
  // which is good for performance in child components.
  return useCallback(
    (text: MultilingualText | undefined) => {
      return getLocalizedText(text);
    },
    [getLocalizedText]
  );
}