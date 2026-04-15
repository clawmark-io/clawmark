import "i18next";

import type common from "../locales/en/common.json";
import type commands from "../locales/en/commands.json";
import type settings from "../locales/en/settings.json";
import type tasks from "../locales/en/tasks.json";
import type projects from "../locales/en/projects.json";
import type sync from "../locales/en/sync.json";
import type menu from "../locales/en/menu.json";

declare module "i18next" {
  interface CustomTypeOptions {
    defaultNS: "common";
    resources: {
      common: typeof common;
      commands: typeof commands;
      settings: typeof settings;
      tasks: typeof tasks;
      projects: typeof projects;
      sync: typeof sync;
      menu: typeof menu;
    };
  }
}
