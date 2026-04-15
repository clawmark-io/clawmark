import type { LucideIcon } from "lucide-react";
import type { ReactNode } from "react";

type FieldLabelProps = {
  children: ReactNode;
  icon?: LucideIcon;
  htmlFor?: string;
};

export function FieldLabel({ children, icon: Icon, htmlFor }: FieldLabelProps) {
  return (
    <label className="flex items-center gap-1.5 text-normal" htmlFor={htmlFor}>
      {Icon ? <Icon size={16} className="shrink-0" /> : null}
      {children}
    </label>
  );
}
