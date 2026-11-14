// Whether the shop report's sheet is open: a tiny external store, so the strip (in the scene area) can open the sheet (in the SHEETS slot,
// over the whole screen) without props, and neither repaints the game screen.
import { useSyncExternalStore } from 'react';

let open = false;
const listeners = new Set<() => void>();
const set = (v: boolean) => {
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

export const openReport = () => set(true);
export const closeReport = () => set(false);
export const reportIsOpen = () => open;
export const useReportOpen = (): boolean => useSyncExternalStore(subscribe, () => open, () => false);
