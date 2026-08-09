import React from "react";

export interface ResponsiveTableProps {
  children: React.ReactNode;
  className?: string;
}

export function ResponsiveTable({ children, className = "" }: ResponsiveTableProps) {
  return (
    <div
      className={`w-full overflow-x-auto rounded-2xl border border-border bg-surface ${className}`}
    >
      <div className="min-w-full inline-block align-middle">{children}</div>
    </div>
  );
}

export interface MobileCardWrapperProps {
  children: React.ReactNode;
  className?: string;
}

export function MobileCardWrapper({ children, className = "" }: MobileCardWrapperProps) {
  return (
    <div className={`grid grid-cols-1 gap-3 sm:grid-cols-2 md:hidden ${className}`}>{children}</div>
  );
}
