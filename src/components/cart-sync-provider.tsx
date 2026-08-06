/**
 * CartSyncProvider — Pass-through provider for local cart store.
 */
import type { ReactNode } from "react";

export function CartSyncProvider({ children }: { children: ReactNode }) {
  return <>{children}</>;
}
