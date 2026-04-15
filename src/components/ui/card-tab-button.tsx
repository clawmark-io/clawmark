import * as React from "react";
import { cn } from "@/lib/utils/tailwind-utils.ts";

export interface CardTabButtonProps extends React.ComponentProps<"button"> {
  isActive?: boolean;
}

export function CardTabButton({
  isActive = false,
  className,
  children,
  ...props
}: CardTabButtonProps) {
  return (
    <button
      className={cn(
        "px-6 py-1.5 font-medium cursor-pointer transition-colors -mb-px border-b-2",
        isActive
          ? "border-[var(--accent-purple)] text-[var(--text-default)]"
          : "border-transparent text-[var(--text-muted)] hover:text-[var(--text-subtle)]",
        className
      )}
      {...props}
    >
      {children}
    </button>
  );
}

