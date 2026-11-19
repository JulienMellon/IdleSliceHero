// Which layer info sheet is open ('gameday', 'boat', 'auction', 'rival') or none: a tiny external store, so a HUD chip (in the goal row) can
// open the sheet (in the SHEETS slot, over the whole screen) without props, and neither repaints the game screen.
import { useSyncExternalStore } from 'react';

export type SheetKind = 'gameday' | 'boat' | 'auction' | 'rival';

let open: SheetKind | null = null;
const listeners = new Set<() => void>();
const set = (v: SheetKind | null) => {
  if (open === v) return;
  open = v;
  listeners.forEach((fn) => fn());
};
const subscribe = (fn: () => void) => {
  listeners.add(fn);
  return () => {
    listeners.delete(fn);
  };
};

export const openLayerSheet = (kind: SheetKind) => set(kind);
export const closeLayerSheet = () => set(null);
export const openLayerSheetKind = (): SheetKind | null => open;
export const useLayerSheet = (): SheetKind | null =>
  useSyncExternalStore(
    subscribe,
    () => open,
    () => null,
  );
