// Whether a layer's sheet is open: a tiny external store per sheet, so a HUD chip or a scene strip can open the sheet (in the SHEETS slot, over
// the whole screen) without props, and neither repaints the game screen. The three layers of card S2b each make one; this is the only place.
import { useSyncExternalStore } from 'react';

export interface SheetState {
  open: () => void;
  close: () => void;
  isOpen: () => boolean;
  /** The hook: true while the sheet is open. */
  use: () => boolean;
  subscribe: (fn: () => void) => () => void;
}

export function createSheetState(): SheetState {
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
  const get = () => open;
  return { open: () => set(true), close: () => set(false), isOpen: get, subscribe, use: () => useSyncExternalStore(subscribe, get, () => false) };
}
