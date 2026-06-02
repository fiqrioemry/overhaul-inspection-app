// src/hooks/useLanguage.ts
import { useTranslation } from "react-i18next";

export type Language = "en" | "id";

const LANGUAGE_LABELS: Record<Language, string> = {
  en: "English",
  id: "Bahasa Indonesia",
};

export function useLanguage() {
  const { i18n } = useTranslation();

  const currentLanguage = (i18n.language?.slice(0, 2) as Language) ?? "en";

  function changeLanguage(lang: Language) {
    i18n.changeLanguage(lang);
  }

  function toggleLanguage() {
    changeLanguage(currentLanguage === "en" ? "id" : "en");
  }

  return {
    currentLanguage,
    changeLanguage,
    toggleLanguage,
    isEnglish: currentLanguage === "en",
    label: LANGUAGE_LABELS[currentLanguage],
    LANGUAGE_LABELS,
  };
}
