import { useState, useRef, useEffect, useLayoutEffect, useCallback } from "react";
import { Search, X } from "lucide-react";
import { useTranslation } from "react-i18next";
import { cn } from "@/lib/utils/tailwind-utils.ts";
import { TagBadge } from "@/components/ui/tag-badge";
import type { Tag } from "@/types/data-model";

type TagFilterInputProps = {
  textValue: string;
  onTextChange: (value: string) => void;
  selectedTagIds: string[];
  onTagsChange: (tagIds: string[]) => void;
  projectTags: Tag[];
  placeholder?: string;
  className?: string;
};

export type TagSuggestionDropdownProps = {
  tags: Tag[];
  highlightIndex: number;
  onSelect: (tag: Tag) => void;
  onHover: (index: number) => void;
};

export type TagSuggestionItemProps = {
  tag: Tag;
  isHighlighted: boolean;
  onSelect: () => void;
  onHover: () => void;
};

export function TagSuggestionItem({ tag, isHighlighted, onSelect, onHover }: TagSuggestionItemProps) {
  const itemRef = useRef<HTMLButtonElement>(null);

  useEffect(() => {
    if (isHighlighted && itemRef.current) {
      itemRef.current.scrollIntoView({ block: "nearest" });
    }
  }, [isHighlighted]);

  return (
    <button
      ref={itemRef}
      type="button"
      className={cn(
        "flex items-center gap-2 w-full px-2.5 py-1.5 text-sm text-left rounded transition-colors",
        isHighlighted ? "bg-base-200" : "hover:bg-base-200",
      )}
      onClick={onSelect}
      onMouseEnter={onHover}
      onMouseDown={(e) => e.preventDefault()}
    >
      <span
        className={cn("size-3 rounded-full shrink-0 border border-[oklch(0_0_0/10%)]", !tag.color && "bg-base-300")}
        style={tag.color ? { backgroundColor: tag.color } : undefined}
      />
      <span className="truncate">#{tag.label}</span>
    </button>
  );
}

export function TagSuggestionDropdown({ tags, highlightIndex, onSelect, onHover }: TagSuggestionDropdownProps) {
  const { t } = useTranslation();
  const ref = useRef<HTMLDivElement>(null);
  const [dropUp, setDropUp] = useState(false);

  useLayoutEffect(() => {
    const el = ref.current;
    if (!el?.parentElement) return;
    const parentRect = el.parentElement.getBoundingClientRect();
    const dropdownHeight = el.scrollHeight;

    // Find the nearest ancestor with overflow clipping
    let clipBottom = window.innerHeight;
    let ancestor: HTMLElement | null = el.parentElement;
    while (ancestor) {
      const { overflowY } = getComputedStyle(ancestor);
      if (overflowY !== "visible") {
        clipBottom = Math.min(clipBottom, ancestor.getBoundingClientRect().bottom);
      }
      ancestor = ancestor.parentElement;
    }

    const margin = 4;
    const spaceBelow = clipBottom - parentRect.bottom - margin;
    const spaceAbove = parentRect.top - margin;
    setDropUp(spaceBelow < dropdownHeight && spaceAbove > spaceBelow);
  }, [tags.length]);

  const positionClass = dropUp ? "bottom-full mb-1" : "top-full mt-1";

  return (
    <div
      ref={ref}
      className={`absolute ${positionClass} left-0 right-0 z-50 bg-base-100 border border-base-300 rounded-lg shadow-lg ${tags.length === 0 ? "p-2" : "p-1 max-h-[200px] overflow-y-auto"}`}
    >
      {tags.length === 0 ? (
        <div className="px-2.5 py-1.5 text-sm text-[var(--text-muted)]">{t("noMatchingTags")}</div>
      ) : (
        tags.map((tag, index) => (
          <TagSuggestionItem
            key={tag.id}
            tag={tag}
            isHighlighted={index === highlightIndex}
            onSelect={() => onSelect(tag)}
            onHover={() => onHover(index)}
          />
        ))
      )}
    </div>
  );
}

function getTextWithoutTagQuery(val: string, hashIndex: number) {
  return val.slice(0, hashIndex).trimEnd();
}

export function TagFilterInput({
  textValue,
  onTextChange,
  selectedTagIds,
  onTagsChange,
  projectTags,
  placeholder = "Search...",
  className,
}: TagFilterInputProps) {
  const [isTagMode, setIsTagMode] = useState(false);
  const [tagQuery, setTagQuery] = useState("");
  const [highlightIndex, setHighlightIndex] = useState(0);
  const [rawInput, setRawInput] = useState("");
  const inputRef = useRef<HTMLInputElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);

  // Keep rawInput in sync with textValue when not in tag mode
  useEffect(() => {
    if (!isTagMode) {
      setRawInput(textValue);
    }
  }, [textValue, isTagMode]);

  const selectedTags = selectedTagIds
    .map((id) => projectTags.find((t) => t.id === id))
    .filter((t): t is Tag => t !== undefined);

  const availableTags = projectTags.filter((t) => !selectedTagIds.includes(t.id));

  const filteredSuggestions = isTagMode
    ? availableTags.filter((t) =>
        tagQuery ? t.label.toLowerCase().includes(tagQuery.toLowerCase()) : true,
      )
    : [];

  const selectTag = useCallback(
    (tag: Tag) => {
      onTagsChange([...selectedTagIds, tag.id]);
      setIsTagMode(false);
      setTagQuery("");
      setHighlightIndex(0);
      // Reset raw input to the current text value (without the #query part)
      setRawInput(textValue);
      inputRef.current?.focus();
    },
    [selectedTagIds, onTagsChange, textValue],
  );

  const removeTag = useCallback(
    (tagId: string) => {
      onTagsChange(selectedTagIds.filter((id) => id !== tagId));
    },
    [selectedTagIds, onTagsChange],
  );

  const exitTagMode = useCallback(() => {
    setIsTagMode(false);
    setTagQuery("");
    setHighlightIndex(0);
    // Sync raw input back to textValue (strips the #query portion)
    setRawInput(textValue);
  }, [textValue]);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = e.target.value;
    setRawInput(val);

    if (isTagMode) {
      // Find the last # in the value and extract the query after it
      const hashIndex = val.lastIndexOf("#");
      if (hashIndex === -1) {
        // User deleted the #, exit tag mode
        setIsTagMode(false);
        setTagQuery("");
        setHighlightIndex(0);
        onTextChange(val);
      } else {
        const query = val.slice(hashIndex + 1);
        // If there's a space after #query, exit tag mode
        if (query.includes(" ")) {
          setIsTagMode(false);
          setTagQuery("");
          setHighlightIndex(0);
          onTextChange(val);
        } else {
          setTagQuery(query);
          setHighlightIndex(0);
          // Don't include the #query part in the text filter
          onTextChange(getTextWithoutTagQuery(val, hashIndex));
        }
      }
    } else {
      // Check if # was just typed
      const lastChar = val.length > rawInput.length ? val[val.length - 1] : null;
      if (lastChar === "#" && availableTags.length > 0) {
        setIsTagMode(true);
        setTagQuery("");
        setHighlightIndex(0);
        // Don't include the # in the text filter
        onTextChange(val.slice(0, -1).trimEnd());
      } else {
        onTextChange(val);
      }
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (isTagMode) {
      if (e.key === "ArrowDown") {
        e.preventDefault();
        setHighlightIndex((prev) =>
          prev < filteredSuggestions.length - 1 ? prev + 1 : 0,
        );
        return;
      }
      if (e.key === "ArrowUp") {
        e.preventDefault();
        setHighlightIndex((prev) =>
          prev > 0 ? prev - 1 : filteredSuggestions.length - 1,
        );
        return;
      }
      if (e.key === "Enter" && filteredSuggestions.length > 0) {
        e.preventDefault();
        selectTag(filteredSuggestions[highlightIndex]);
        return;
      }
      if (e.key === "Escape") {
        e.preventDefault();
        exitTagMode();
        return;
      }
    }

    // Backspace on empty input removes last chip
    if (e.key === "Backspace" && textValue === "" && selectedTags.length > 0) {
      removeTag(selectedTags[selectedTags.length - 1].id);
    }
  };

  // Close dropdown on outside click
  useEffect(() => {
    if (!isTagMode) return;

    const handleClickOutside = (e: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        exitTagMode();
      }
    };

    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, [isTagMode, exitTagMode]);

  const hasValue = textValue.length > 0 || selectedTagIds.length > 0;

  const handleClear = () => {
    onTextChange("");
    onTagsChange([]);
    setRawInput("");
    setIsTagMode(false);
    setTagQuery("");
    setHighlightIndex(0);
    inputRef.current?.focus();
  };

  return (
    <div ref={containerRef} className="relative w-full lg:w-auto flex-1 min-w-0 lg:max-w-[400px]">
      <div
        role="presentation"
        className={cn(
          "flex items-center gap-2 flex-wrap min-h-[2.5rem] py-1.5 px-3 input w-full rounded-lg semi-transparent-input no-focus-outline cursor-text",
          hasValue && "pr-8",
          className,
        )}
        onClick={() => inputRef.current?.focus()}
      >
        <Search size={14} className="shrink-0 text-[var(--text-muted)]" />
        {selectedTags.map((tag) => (
          <TagBadge key={tag.id} tag={tag} onRemove={() => removeTag(tag.id)} />
        ))}
        <input
          ref={inputRef}
          className="flex-1 min-w-[60px] border-none bg-transparent text-inherit text-sm outline-0 placeholder:text-[var(--text-placeholder)] py-0.5"
          type="text"
          placeholder={selectedTags.length > 0 ? "" : placeholder}
          value={isTagMode ? rawInput : textValue}
          onChange={handleInputChange}
          onKeyDown={handleKeyDown}
        />
      </div>
      {hasValue ? (
        <button
          type="button"
          className="absolute right-2 top-1/2 -translate-y-1/2 inline-flex items-center justify-center size-5 rounded-full hover:bg-[oklch(0_0_0/15%)] transition-colors cursor-pointer text-[var(--text-muted)]"
          onClick={handleClear}
          onMouseDown={(e) => e.preventDefault()}
        >
          <X size={14} />
        </button>
      ) : null}
      {isTagMode ? (
        <TagSuggestionDropdown
          tags={filteredSuggestions}
          highlightIndex={highlightIndex}
          onSelect={selectTag}
          onHover={setHighlightIndex}
        />
      ) : null}
    </div>
  );
}
