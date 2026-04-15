import { Search } from "lucide-react";
import { cn } from "@/lib/utils/tailwind-utils.ts";

interface TextFilterInputProps {
  value: string;
  onChange: (value: string) => void;
  className?: string;
  placeholder?: string;
}

export function TextFilterInput({
  value,
  onChange,
  className,
  placeholder = "Search...",
}: TextFilterInputProps) {
  return (
    <div
      className={cn(
        "flex items-center gap-2 flex-1 min-w-0 py-3 max-w-[400px] input rounded-lg semi-transparent-input no-focus-outline",
        className
      )}
    >
      <Search size={14} className="shrink-0 text-[var(--text-muted)]" />
      <input
        className="flex-1 min-w-0 border-none bg-transparent text-inherit text-sm outline-0 placeholder:text-[var(--text-placeholder)]"
        type="text"
        placeholder={placeholder}
        value={value}
        onChange={(e) => onChange(e.target.value)}
      />
    </div>
  );
}

