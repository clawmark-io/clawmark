import type { ReactNode } from "react";

export function ContentArea({ children, className = "" }: { children: ReactNode; className?: string }) {
  return (
    <div className={`p-3 sm:p-8 flex flex-col flex-1 ${className}`}>
      {children}
    </div>
  );
}
