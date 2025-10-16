import React, {
  createContext,
  useContext,
  useEffect,
  useLayoutEffect,
  useState,
  useCallback,
  useMemo,
} from "react";
import * as SecureStore from "expo-secure-store";
import { translations, TranslationKey } from "@/locales";

export type LanguageEnum = "en" | "hy" | "ru";

interface LanguageState {
  language: LanguageEnum;
}

interface LanguageContext {
  language: LanguageEnum;
  setLanguage: (language: LanguageEnum) => void;
  getLocalizedText: <T extends { en?: string; hy?: string }>(
    text: T | undefined
  ) => string;
  t: (key: TranslationKey) => string;
}

const LanguageStore = createContext<LanguageContext | null>(null);

interface Props {
  children: React.ReactNode;
}

export function LanguageProvider({ children }: Props) {
  const [state, setState] = useState<LanguageState>({ language: "en" });

  useLayoutEffect(() => {
    async function init() {
      const language = await fromStorage();
      if (language) {
        setState({ language });
      }
    }
    init();
  }, []);

  useEffect(() => {
    localSave();
  }, [state]);

  const localStorageKey = "languageState";

  async function localSave(): Promise<boolean> {
    try {
      // Directly store the language string, no need for JSON stringification for a simple string
      await SecureStore.setItemAsync(localStorageKey, state.language);
      return true;
    } catch {
      return false;
    }
  }

  async function fromStorage(): Promise<LanguageEnum | undefined> {
    try {
      let res = await SecureStore.getItemAsync(localStorageKey);
      if (res) {
        // The stored value is just a string, so no JSON parsing is needed
        return res as LanguageEnum;
      }
    } catch (error) {
      console.warn("Cannot get language from local storage", error);
    }
  }

  const setLanguage = useCallback((language: LanguageEnum) => {
    setState({ language });
  }, []);

  const getLocalizedText = useCallback(
    <T extends { en?: string; hy?: string }>(
      text: T | undefined
    ): string => {
      if (!text) return "";

      // Use nullish coalescing operator for a concise and correct fallback logic
      return text[state.language] ?? text.en ?? "";
    },
    [state.language]
  );

  /**
   * Translation function for static UI strings
   * Supports dot notation for nested keys: t('auth.login')
   * Falls back to English if translation not found
   */
  const t = useCallback(
    (key: TranslationKey): string => {
      const keys = key.split(".");
      let value: any = translations[state.language];

      // Navigate through nested object using dot notation
      for (const k of keys) {
        value = value?.[k];
      }

      // If translation not found, fall back to English
      if (!value || typeof value !== "string") {
        let fallbackValue: any = translations.en;
        for (const k of keys) {
          fallbackValue = fallbackValue?.[k];
        }
        return fallbackValue || key;
      }

      return value;
    },
    [state.language]
  );

  const contextValue = useMemo(
    () => ({
      language: state.language,
      setLanguage,
      getLocalizedText,
      t,
    }),
    [state.language, setLanguage, getLocalizedText, t]
  );

  return (
    <LanguageStore.Provider value={contextValue}>
      {children}
    </LanguageStore.Provider>
  );
}

export function useLanguage() {
  const context = useContext(LanguageStore);
  if (!context)
    throw Error("useLanguage() must be inside the LanguageProvider.");
  return context;
}