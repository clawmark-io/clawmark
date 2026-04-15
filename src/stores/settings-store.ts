import { create } from "zustand";
import { persist } from "zustand/middleware";
import i18n from "@/i18n";

type SettingsState = {
  backgroundIntervalMinutes: number;
  setBackgroundIntervalMinutes: (minutes: number) => void;
  language: string;
  setLanguage: (lang: string) => void;
};

export const useSettingsStore = create<SettingsState>()(
  persist(
    (set) => ({
      backgroundIntervalMinutes: 15,
      setBackgroundIntervalMinutes: (minutes) =>
        set({ backgroundIntervalMinutes: Math.max(1, minutes) }),
      language: "en",
      setLanguage: (lang) => {
        i18n.changeLanguage(lang);
        localStorage.setItem("app-language", lang);
        set({ language: lang });
      },
    }),
    { name: "kanri-settings" }
  )
);
