import { useState, useMemo, useRef, useEffect } from "react";
import { Search } from "lucide-react";
import { useTranslation } from "react-i18next";
import { Popover as PopoverPrimitive } from "radix-ui";
import { emojiCategories, searchEmojis } from "@/lib/emoji-data";
import { useEmojiUsageStore } from "@/stores/emoji-usage";
import { cn } from "@/lib/utils/tailwind-utils.ts";

type EmojiPickerProps = {
  selectedEmojis: string[];
  onSelect: (emoji: string) => void;
  onRemove: (emoji: string) => void;
  children: React.ReactNode;
};

export function EmojiPicker({
  selectedEmojis,
  onSelect,
  onRemove,
  children,
}: EmojiPickerProps) {
  const [open, setOpen] = useState(false);

  return (
    <PopoverPrimitive.Root open={open} onOpenChange={setOpen}>
      <PopoverPrimitive.Trigger asChild>{children}</PopoverPrimitive.Trigger>
      <PopoverPrimitive.Content
        side="bottom"
        align="start"
        sideOffset={4}
        className="z-50 w-[320px] rounded-md border border-base-300 bg-base-100 shadow-md data-[state=open]:animate-in data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0 data-[state=closed]:zoom-out-95 data-[state=open]:zoom-in-95"
      >
        <EmojiPickerContent
          selectedEmojis={selectedEmojis}
          onSelect={onSelect}
          onRemove={onRemove}
        />
      </PopoverPrimitive.Content>
    </PopoverPrimitive.Root>
  );
}

type EmojiPickerContentProps = {
  selectedEmojis: string[];
  onSelect: (emoji: string) => void;
  onRemove: (emoji: string) => void;
};

function EmojiPickerContent({
  selectedEmojis,
  onSelect,
  onRemove,
}: EmojiPickerContentProps) {
  const { t } = useTranslation();
  const [query, setQuery] = useState("");
  const inputRef = useRef<HTMLInputElement>(null);
  const usage = useEmojiUsageStore((s) => s.usage);
  const frequent = useMemo(
    () =>
      Object.entries(usage)
        .toSorted((a, b) => b[1] - a[1])
        .slice(0, 16)
        .map(([emoji]) => emoji),
    [usage]
  );

  useEffect(() => {
    inputRef.current?.focus();
  }, []);

  const searchResults = useMemo(
    () => (query ? searchEmojis(query) : null),
    [query]
  );

  const selectedSet = useMemo(() => new Set(selectedEmojis), [selectedEmojis]);

  const handleClick = (emoji: string) => {
    if (selectedSet.has(emoji)) {
      onRemove(emoji);
    } else {
      onSelect(emoji);
    }
  };

  return (
    <div className="flex flex-col">
      <div className="flex items-center gap-2 border-b border-base-300 px-3 py-2">
        <Search size={14} className="shrink-0 text-[var(--text-muted)]" />
        <input
          ref={inputRef}
          type="text"
          className="flex-1 bg-transparent text-sm outline-none placeholder:text-[var(--text-muted)]"
          placeholder={t("searchEmojisPlaceholder")}
          value={query}
          onChange={(e) => setQuery(e.target.value)}
        />
      </div>

      <div className="max-h-[280px] overflow-y-auto p-2">
        {searchResults ? (
          searchResults.length > 0 ? (
            <EmojiGrid
              emojis={searchResults.map((e) => e.emoji)}
              selectedSet={selectedSet}
              onClick={handleClick}
            />
          ) : (
            <p className="py-4 text-center text-sm text-[var(--text-muted)]">
              {t("noEmojisFound")}
            </p>
          )
        ) : (
          <>
            {frequent.length > 0 ? (
              <EmojiSection
                label={t("frequentlyUsed")}
                emojis={frequent}
                selectedSet={selectedSet}
                onClick={handleClick}
              />
            ) : null}
            {emojiCategories.map((cat) => (
              <EmojiSection
                key={cat.name}
                label={cat.name}
                emojis={cat.emojis.map((e) => e.emoji)}
                selectedSet={selectedSet}
                onClick={handleClick}
              />
            ))}
          </>
        )}
      </div>
    </div>
  );
}

type EmojiSectionProps = {
  label: string;
  emojis: string[];
  selectedSet: Set<string>;
  onClick: (emoji: string) => void;
};

function EmojiSection({
  label,
  emojis,
  selectedSet,
  onClick,
}: EmojiSectionProps) {
  return (
    <div className="mb-2">
      <p className="mb-1 px-1 text-xs font-medium text-[var(--text-muted)]">
        {label}
      </p>
      <EmojiGrid emojis={emojis} selectedSet={selectedSet} onClick={onClick} />
    </div>
  );
}

type EmojiGridProps = {
  emojis: string[];
  selectedSet: Set<string>;
  onClick: (emoji: string) => void;
};

function EmojiGrid({ emojis, selectedSet, onClick }: EmojiGridProps) {
  const { t } = useTranslation();
  return (
    <div className="grid grid-cols-8 gap-0.5">
      {emojis.map((emoji) => (
        <button
          key={emoji}
          type="button"
          className={cn(
            "flex h-8 w-8 cursor-pointer items-center justify-center rounded text-lg hover:bg-base-200",
            selectedSet.has(emoji) && "bg-base-200 ring-1 ring-base-300"
          )}
          onClick={() => onClick(emoji)}
          title={selectedSet.has(emoji) ? t("remove") : t("addButton")}
        >
          {emoji}
        </button>
      ))}
    </div>
  );
}
