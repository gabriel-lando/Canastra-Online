import React from 'react';
import { useTranslation } from '../i18n';
import type { Language } from '../i18n';

interface LangOption {
  code: Language;
  flag: string;
  label: string;
}

const LANGUAGES: LangOption[] = [
  { code: 'en', flag: '🇺🇸', label: 'English' },
  { code: 'pt-BR', flag: '🇧🇷', label: 'Português' },
];

export const LanguageSwitcher: React.FC = () => {
  const { language, setLanguage } = useTranslation();

  const next = LANGUAGES.find((l) => l.code !== language) ?? LANGUAGES[0];
  const current = LANGUAGES.find((l) => l.code === language) ?? LANGUAGES[0];

  return (
    <button className="lang-switcher" onClick={() => setLanguage(next.code)} title={`${current.flag} ${current.label} → ${next.flag} ${next.label}`} aria-label={`Switch to ${next.label}`}>
      <span className="lang-switcher-flag">{current.flag}</span>
      <span className="lang-switcher-label">{current.label}</span>
    </button>
  );
};
