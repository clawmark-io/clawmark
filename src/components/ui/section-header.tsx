import type { ReactNode } from "react";

type SectionHeaderProps = {
  children: ReactNode;
};

export function SectionHeader({ children }: SectionHeaderProps) {
  return <h3 className="text-medium text-lg">{children}</h3>;
}
