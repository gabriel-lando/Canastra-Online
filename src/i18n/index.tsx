import React, { createContext, useContext, useState, useCallback } from 'react';
import { en } from './locales/en';
import { ptBR } from './locales/pt_BR';
import type { Translations } from './locales/en';

export type Language = 'en' | 'pt-BR';

const STORAGE_KEY = 'canastra-lang';

const locales: Record<Language, Translations> = {
  en,
  'pt-BR': ptBR,
};

function getInitialLanguage(): Language {
  const stored = localStorage.getItem(STORAGE_KEY);
  if (stored === 'en' || stored === 'pt-BR') return stored;
  // Browser language detection
  const browserLang = navigator.language;
  if (browserLang.startsWith('pt')) return 'pt-BR';
  return 'pt-BR'; // default to pt-BR as this is a Brazilian game
}

interface LanguageContextValue {
  language: Language;
  setLanguage: (lang: Language) => void;
  t: Translations;
  /** Interpolate a string: replace {key} placeholders with provided values */
  interpolate: (str: string, params: Record<string, string | number>) => string;
}

const LanguageContext = createContext<LanguageContextValue | null>(null);

export const LanguageProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [language, setLanguageState] = useState<Language>(getInitialLanguage);

  const setLanguage = useCallback((lang: Language) => {
    localStorage.setItem(STORAGE_KEY, lang);
    setLanguageState(lang);
  }, []);

  const interpolate = useCallback((str: string, params: Record<string, string | number>): string => {
    return str.replace(/\{(\w+)\}/g, (_, key) => {
      const val = params[key];
      return val !== undefined ? String(val) : `{${key}}`;
    });
  }, []);

  return <LanguageContext.Provider value={{ language, setLanguage, t: locales[language], interpolate }}>{children}</LanguageContext.Provider>;
};

export function useTranslation() {
  const ctx = useContext(LanguageContext);
  if (!ctx) throw new Error('useTranslation must be used within a LanguageProvider');
  return ctx;
}
