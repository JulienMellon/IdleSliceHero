// Whether the attack banner is open in full (not collapsed to its badge), for the screen: the golden pizza waits while it is (G95), so it
// never covers the banner's words or its Defend button. A tiny external store, so the banner and the screen share it without props.
import { useSyncExternalStore } from 'react';

/** The banner shows in full for this long when an attack first appears (ms), then collapses to a badge; a tap on the badge opens it again. */
export const BANNER_OPEN_MS = 10_000;

let open = false;
const listeners = new Set<() => void>();

export function setBannerOpen(next: boolean): void {
  if (open === next) return;
  open = next;
  listeners.forEach((fn) => fn());
}
export const getBannerOpen = (): boolean => open;

const subscribe = (fn: () => void) => {
  listeners.add(fn);
  return () => {
    listeners.delete(fn);
  };
};
export const useBannerOpen = (): boolean => useSyncExternalStore(subscribe, getBannerOpen, getBannerOpen);
