import { createInstance } from "i18next";

const i18n = createInstance();
import { initReactI18next } from "react-i18next";
import LanguageDetector from "i18next-browser-languagedetector";
import ICU from "i18next-icu";

import enCommon from "./locales/en/common.json";
import enCommands from "./locales/en/commands.json";
import enSettings from "./locales/en/settings.json";
import enTasks from "./locales/en/tasks.json";
import enProjects from "./locales/en/projects.json";
import enSync from "./locales/en/sync.json";
import enMenu from "./locales/en/menu.json";

import plCommon from "./locales/pl/common.json";
import plCommands from "./locales/pl/commands.json";
import plSettings from "./locales/pl/settings.json";
import plTasks from "./locales/pl/tasks.json";
import plProjects from "./locales/pl/projects.json";
import plSync from "./locales/pl/sync.json";
import plMenu from "./locales/pl/menu.json";

i18n
  .use(ICU)
  .use(LanguageDetector)
  .use(initReactI18next)
  .init({
    resources: {
      en: {
        common: enCommon,
        commands: enCommands,
        settings: enSettings,
        tasks: enTasks,
        projects: enProjects,
        sync: enSync,
        menu: enMenu,
      },
      pl: {
        common: plCommon,
        commands: plCommands,
        settings: plSettings,
        tasks: plTasks,
        projects: plProjects,
        sync: plSync,
        menu: plMenu,
      },
    },
    fallbackLng: "en",
    defaultNS: "common",
    interpolation: {
      escapeValue: false,
    },
    detection: {
      order: ["localStorage", "navigator"],
      lookupLocalStorage: "app-language",
    },
  });

export default i18n;
