import type { Project } from "@/types/data-model";

export type WizardStep =
  | { type: "choose-path" }
  | { type: "create-new" }
  | { type: "template" }
  | { type: "clone-pick-source" }
  | { type: "clone-options"; sourceProjectId: string }
  | { type: "import-pick-file"; importType: "json" | "kanri" }
  | { type: "import-pick-project"; importType: "json" | "kanri"; projects: Project[] }
  | { type: "import-in-progress"; importType: "json" | "kanri" }
  | { type: "import-error"; importType: "json" | "kanri"; error: string };
