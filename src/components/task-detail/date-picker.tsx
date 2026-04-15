import { useState, useRef, useEffect } from "react";
import { Calendar } from "lucide-react";
import i18n from "@/i18n";

type DatePickerProps = {
  value: number | null;
  onChange: (value: number | null) => void;
};

function addDays(date: Date, days: number): Date {
  const result = new Date(date);
  result.setDate(result.getDate() + days);
  return result;
}

function setToEndOfDay(date: Date): Date {
  const result = new Date(date);
  result.setHours(23, 59, 59, 999);
  return result;
}

function formatForInput(date: Date): string {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
}

export function DatePicker({ value, onChange }: DatePickerProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [customDate, setCustomDate] = useState<string>("");
  const [focusedIndex, setFocusedIndex] = useState<number>(0);
  const triggerRef = useRef<HTMLButtonElement>(null);
  const dropdownRef = useRef<HTMLDivElement>(null);
  const dateInputRef = useRef<HTMLInputElement>(null);

  // Define selectable options
  const presetOptions = [
    { label: "Today", days: 0 },
    { label: "Tomorrow", days: 1 },
    { label: "In 1 week", days: 7 },
    { label: "In 2 weeks", days: 14 },
    { label: "In 1 month", days: 30 },
  ];

  // Total options: presets + custom date input + (clear button if date is set)
  const customDateIndex = presetOptions.length;
  const clearButtonIndex = presetOptions.length + 1;
  const totalOptions = value ? presetOptions.length + 2 : presetOptions.length + 1;

  useEffect(() => {
    if (isOpen) {
      setFocusedIndex(0);
      // Focus the dropdown immediately so keyboard navigation works
      dropdownRef.current?.focus();
    }
  }, [isOpen]);

  const handlePreset = (days: number) => {
    const date = setToEndOfDay(addDays(new Date(), days));
    onChange(date.getTime());
    setIsOpen(false);
    triggerRef.current?.focus();
  };

  const handleCustomDate = (dateString: string) => {
    setCustomDate(dateString);
    if (dateString) {
      const date = setToEndOfDay(new Date(dateString));
      onChange(date.getTime());
    }
  };

  const handleClear = () => {
    onChange(null);
    setCustomDate("");
    setIsOpen(false);
    triggerRef.current?.focus();
  };

  const handleTriggerKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" || e.key === " ") {
      e.preventDefault();
      setIsOpen(!isOpen);
    }
  };

  const handleDropdownKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "ArrowDown") {
      e.preventDefault();
      // If we're at the last option, close the dropdown instead of wrapping
      if (focusedIndex === totalOptions - 1) {
        setIsOpen(false);
        triggerRef.current?.focus();
      } else {
        setFocusedIndex((prev) => prev + 1);
      }
      return;
    }

    if (e.key === "ArrowUp") {
      e.preventDefault();
      // If we're at the first option, close the dropdown instead of wrapping
      if (focusedIndex === 0) {
        setIsOpen(false);
        triggerRef.current?.focus();
      } else {
        setFocusedIndex((prev) => prev - 1);
      }
      return;
    }

    if (e.key === "Enter" || e.key === " ") {
      e.preventDefault();
      if (focusedIndex < presetOptions.length) {
        // Preset option
        handlePreset(presetOptions[focusedIndex].days);
      } else if (focusedIndex === customDateIndex) {
        // Custom date input - focus it so user can type
        dateInputRef.current?.focus();
        dateInputRef.current?.showPicker?.();
      } else {
        // Clear button
        handleClear();
      }
    }
  };

  const formattedValue = value
    ? new Intl.DateTimeFormat(i18n.language, {
        month: "short",
        day: "numeric",
        year: "numeric",
      }).format(new Date(value))
    : null;

  return (
    <div className="relative">
      <button
        ref={triggerRef}
        type="button"
        className={`flex items-center gap-2 py-2 px-3 rounded-md border border-[var(--border-default)] bg-[var(--surface-overlay)] text-sm cursor-pointer transition-all duration-150 w-full ${value ? "" : "text-[var(--text-placeholder)]"}`}
        onClick={() => setIsOpen(!isOpen)}
        onKeyDown={handleTriggerKeyDown}
      >
        <Calendar size={14} />
        <span>{formattedValue || "Set due date"}</span>
      </button>

      {isOpen && (
        <>
          <div className="fixed inset-0 z-40" role="presentation" onClick={() => setIsOpen(false)} />
          <div
            ref={dropdownRef}
            role="listbox"
            className="absolute top-[calc(100%+0.25rem)] left-0 z-50 min-w-[200px] p-2 rounded-lg border border-base-300 bg-base-100 shadow-lg outline-none"
            onKeyDown={handleDropdownKeyDown}
            tabIndex={-1}
          >
            <div className="flex flex-col gap-0.5">
              {presetOptions.map((option, index) => (
                <button
                  key={option.label}
                  type="button"
                  className="py-2 px-3 rounded border-none bg-transparent text-base-content text-sm text-left cursor-pointer transition-colors duration-150 hover:bg-base-200 data-[focused=true]:bg-base-200"
                  data-focused={focusedIndex === index}
                  onClick={() => handlePreset(option.days)}
                >
                  {option.label}
                </button>
              ))}
            </div>

            <div className="h-px my-2 bg-base-300" />

            <div className="py-1">
              <input
                ref={dateInputRef}
                type="date"
                className="input input-bordered input-sm w-full data-[focused=true]:input-primary"
                data-focused={focusedIndex === customDateIndex}
                value={customDate || (value ? formatForInput(new Date(value)) : "")}
                onChange={(e) => handleCustomDate(e.target.value)}
              />
            </div>

            {value && (
              <>
                <div className="h-px my-2 bg-base-300" />
                <button
                  type="button"
                  className="w-full py-2 px-3 rounded border-none bg-transparent text-error text-sm text-left cursor-pointer transition-all duration-150 hover:bg-error hover:text-error-content data-[focused=true]:bg-error data-[focused=true]:text-error-content"
                  data-focused={focusedIndex === clearButtonIndex}
                  onClick={handleClear}
                >
                  Clear due date
                </button>
              </>
            )}
          </div>
        </>
      )}
    </div>
  );
}
