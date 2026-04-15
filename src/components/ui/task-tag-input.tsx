import { useState, useRef, useEffect, useCallback } from "react";
import type { Tag } from "@/types/data-model";
import { TagBadge } from "@/components/ui/tag-badge";
import { TagSuggestionDropdown } from "./tag-filter-input";

type TaskTagInputProps = {
  projectTags: Tag[];
  placeholder?: string;
  onSubmit: (title: string, tagIds: string[]) => void;
  formClassName?: string;
  inputClassName?: string;
  icon?: React.ReactNode;
};

function getTextWithoutTagQuery(val: string, hashIndex: number) {
  return val.slice(0, hashIndex).trimEnd();
}

export function TaskTagInput({
  projectTags,
  placeholder = "Add a task...",
  onSubmit,
  formClassName,
  inputClassName,
  icon,
}: TaskTagInputProps) {
  const [title, setTitle] = useState("");
  const [selectedTagIds, setSelectedTagIds] = useState<string[]>([]);
  const [isTagMode, setIsTagMode] = useState(false);
  const [tagQuery, setTagQuery] = useState("");
  const [highlightIndex, setHighlightIndex] = useState(0);
  const [rawInput, setRawInput] = useState("");
  const inputRef = useRef<HTMLInputElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!isTagMode) {
      setRawInput(title);
    }
  }, [title, isTagMode]);

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
      setSelectedTagIds((prev) => [...prev, tag.id]);
      setIsTagMode(false);
      setTagQuery("");
      setHighlightIndex(0);
      setRawInput(title);
      inputRef.current?.focus();
    },
    [title],
  );

  const removeTag = useCallback((tagId: string) => {
    setSelectedTagIds((prev) => prev.filter((id) => id !== tagId));
  }, []);

  const exitTagMode = useCallback(() => {
    setIsTagMode(false);
    setTagQuery("");
    setHighlightIndex(0);
    setRawInput(title);
  }, [title]);

  const clearAll = useCallback(() => {
    setTitle("");
    setSelectedTagIds([]);
    setIsTagMode(false);
    setTagQuery("");
    setHighlightIndex(0);
    setRawInput("");
  }, []);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = e.target.value;
    setRawInput(val);

    if (isTagMode) {
      const hashIndex = val.lastIndexOf("#");
      if (hashIndex === -1) {
        setIsTagMode(false);
        setTagQuery("");
        setHighlightIndex(0);
        setTitle(val);
      } else {
        const query = val.slice(hashIndex + 1);
        if (query.includes(" ")) {
          setIsTagMode(false);
          setTagQuery("");
          setHighlightIndex(0);
          setTitle(val);
        } else {
          setTagQuery(query);
          setHighlightIndex(0);
          setTitle(getTextWithoutTagQuery(val, hashIndex));
        }
      }
    } else {
      const lastChar = val.length > rawInput.length ? val[val.length - 1] : null;
      if (lastChar === "#" && availableTags.length > 0) {
        setIsTagMode(true);
        setTagQuery("");
        setHighlightIndex(0);
        setTitle(val.slice(0, -1).trimEnd());
      } else {
        setTitle(val);
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

    if (e.key === "Escape" && !isTagMode) {
      clearAll();
      return;
    }

    if (e.key === "Backspace" && title === "" && selectedTags.length > 0) {
      removeTag(selectedTags[selectedTags.length - 1].id);
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (isTagMode) return;
    const trimmed = title.trim();
    if (!trimmed) return;
    onSubmit(trimmed, selectedTagIds);
    clearAll();
  };

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

  return (
    <div ref={containerRef} className="relative">
      {selectedTags.length > 0 ? (
        <div className="flex items-center gap-1 flex-wrap px-3 pt-1.5 pb-0.5 task-tag-input-chips">
          {selectedTags.map((tag) => (
            <TagBadge key={tag.id} tag={tag} onRemove={() => removeTag(tag.id)} />
          ))}
        </div>
      ) : null}
      <form className={formClassName} onSubmit={handleSubmit}>
        {icon}
        <input
          ref={inputRef}
          className={inputClassName}
          type="text"
          placeholder={selectedTags.length > 0 ? "" : placeholder}
          value={isTagMode ? rawInput : title}
          onChange={handleInputChange}
          onKeyDown={handleKeyDown}
          onMouseDown={(e) => e.stopPropagation()}
        />
      </form>
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
