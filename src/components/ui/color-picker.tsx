import { useRef, useCallback } from "react";
import { useTranslation } from "react-i18next";

const COLOR_PRESETS = [
  "#f87171",
  "#fb923c",
  "#fbbf24",
  "#4ade80",
  "#34d399",
  "#60a5fa",
  "#a78bfa",
  "#f472b6",
  "#94a3b8",
];

type ColorPickerProps = {
  value: string | null;
  onChange: (color: string | null) => void;
};

export function ColorPicker({ value, onChange }: ColorPickerProps) {
  const { t } = useTranslation();
  const customColor = value && !COLOR_PRESETS.includes(value) ? value : "";

  // All options: null (none), ...presets, "custom"
  const allOptions = [null, ...COLOR_PRESETS, "custom"];

  // Find current value's index
  const getCurrentIndex = () => {
    if (value === null) return 0;
    const presetIndex = COLOR_PRESETS.indexOf(value);
    if (presetIndex !== -1) return presetIndex + 1;
    return allOptions.length - 1; // custom
  };

  const customInputRef = useRef<HTMLInputElement>(null);
  const debounceTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const handleCustomColorClick = useCallback(() => {
    const currentColor = customColor || "#000000";
    if (debounceTimerRef.current) clearTimeout(debounceTimerRef.current);
    onChange(currentColor);
  }, [customColor, onChange]);

  const handleCustomColorChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const newColor = e.target.value;
    if (debounceTimerRef.current) clearTimeout(debounceTimerRef.current);
    debounceTimerRef.current = setTimeout(() => {
      onChange(newColor);
    }, 100);
  }, [onChange]);

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key !== "ArrowLeft" && e.key !== "ArrowRight" && e.key !== "Enter") {
      return;
    }

    e.preventDefault();

    const currentIndex = getCurrentIndex();

    if (e.key === "ArrowLeft") {
      const newIndex = Math.max(0, currentIndex - 1);
      const option = allOptions[newIndex];
      onChange(option === "custom" ? customColor ?? "#000000" : option);
    } else if (e.key === "ArrowRight") {
      const newIndex = Math.min(allOptions.length - 1, currentIndex + 1);
      const option = allOptions[newIndex];
      onChange(option === "custom" ? customColor ?? "#000000" : option);
    } else if (e.key === "Enter" && customColor) {
      customInputRef.current?.click();
    }
  };

  return (
    <div
      role="radiogroup"
      className="color-picker flex gap-1.5 flex-wrap outline-none"
      tabIndex={0}
      onKeyDown={handleKeyDown}
    >
      <button
        className="w-6 h-6 rounded-full border-2 border-dashed border-[var(--border-default)] cursor-pointer flex items-center justify-center text-xs text-[var(--text-muted)]"
        data-selected={value === null || undefined}
        onClick={() => onChange(null)}
        type="button"
        tabIndex={-1}
      >
        ×
      </button>
      {COLOR_PRESETS.map((c) => (
        <button
          key={c}
          type="button"
          className="w-6 h-6 rounded-full border-2 border-transparent cursor-pointer transition-colors duration-150 hover:border-[var(--border-strong)]"
          style={{ background: c }}
          data-selected={value === c || undefined}
          onClick={() => onChange(c)}
          tabIndex={-1}
        />
      ))}
      <input
        ref={customInputRef}
        type="color"
        className="w-6 h-6 rounded-full border-2 border-[var(--border-default)] cursor-pointer overflow-hidden p-0 transition-colors duration-150 hover:border-[var(--border-strong)]"
        data-selected={customColor ? "" : undefined}
        value={customColor || "#000000"}
        onClick={handleCustomColorClick}
        onChange={handleCustomColorChange}
        title={t("customColor")}
        tabIndex={-1}
      />
    </div>
  );
}
