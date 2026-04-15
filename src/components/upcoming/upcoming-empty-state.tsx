import { useMemo } from "react";
import { useTranslation } from "react-i18next";
import { PartyPopper } from "lucide-react";

const EMPTY_STATE_KEYS = [
  "emptyState1", "emptyState2", "emptyState3", "emptyState4",
  "emptyState5", "emptyState6", "emptyState7", "emptyState8",
] as const;

export function UpcomingEmptyState() {
  const { t } = useTranslation("tasks");

  const key = useMemo(() => {
    const index = Math.floor(Math.random() * EMPTY_STATE_KEYS.length);
    return EMPTY_STATE_KEYS[index];
  }, []);

  return (
    <div className="flex flex-col items-center justify-center py-20 gap-3 text-[var(--text-subtle)]">
      <PartyPopper size={32} className="text-[var(--text-placeholder)]" />
      <p className="text-sm text-center max-w-[300px]">{t(key)}</p>
    </div>
  );
}
