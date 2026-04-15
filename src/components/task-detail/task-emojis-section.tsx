import { SmilePlus } from "lucide-react";
import { useTranslation } from "react-i18next";
import { EmojiPicker } from "@/components/ui/emoji-picker";
import { splitEmojis } from "@/lib/emoji-data";
import { useEmojiUsageStore } from "@/stores/emoji-usage";

type TaskEmojisSectionProps = {
  emoji: string | null;
  onUpdate: (emoji: string | null) => void;
};

export function TaskEmojisSection({ emoji, onUpdate }: TaskEmojisSectionProps) {
  const { t } = useTranslation();
  const incrementUsage = useEmojiUsageStore((s) => s.incrementUsage);
  const emojis = splitEmojis(emoji ?? "");

  const handleSelect = (selected: string) => {
    incrementUsage(selected);
    const updated = emoji ? emoji + selected : selected;
    onUpdate(updated);
  };

  const handleRemove = (removed: string) => {
    const updated = emojis.filter((e) => e !== removed).join("");
    onUpdate(updated || null);
  };

  return (
    <div className="flex flex-wrap items-center gap-1.5 py-3 border-b border-[var(--border-subtle)]">
      {/* eslint-disable react/no-array-index-key -- emojis can repeat; no stable unique ID */}
      {emojis.map((e, i) => (
        <button
          key={`${e}-${i}`}
          type="button"
          className="cursor-pointer text-xl hover:opacity-70"
          onClick={() => handleRemove(e)}
          title={t("remove")}
        >
          {e}
        </button>
      ))}
      {/* eslint-enable react/no-array-index-key */}
      <EmojiPicker
        selectedEmojis={emojis}
        onSelect={handleSelect}
        onRemove={handleRemove}
      >
        <button type="button" className="btn btn-ghost btn-xs gap-1">
          <SmilePlus size={14} />
        </button>
      </EmojiPicker>
    </div>
  );
}
