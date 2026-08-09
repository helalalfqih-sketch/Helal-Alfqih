import React from "react";

export const OperationCard = ({ children }: { children?: React.ReactNode }) => {
  return <div className="border border-white/10 bg-black/40 rounded-lg p-3">{children}</div>;
};
