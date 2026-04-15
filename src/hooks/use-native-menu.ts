import { useEffect } from "react";
import { useTranslation } from "react-i18next";
import { buildAppMenu } from "@/lib/native-menu";
import { useManager } from "@/stores/manager-context";

export function useNativeMenu() {
  const { i18n } = useTranslation();
  const manager = useManager();

  useEffect(() => {
    buildAppMenu(manager);
  }, [i18n.language, manager]);
}
