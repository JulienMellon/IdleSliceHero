// Tiny event bus so the scene can tell the HUD "a delivery just paid out" (and launch a coin at it) without
// re-rendering the screen.
type Listener = () => void;
const listeners = new Set<Listener>();

export function onPayout(fn: Listener) {
  listeners.add(fn);
  return () => {
    listeners.delete(fn);
  };
}

export function emitPayout() {
  listeners.forEach((fn) => fn());
}

/** A coin leaving the scene at a window point, timed to land on the HUD cash in `ms` (when the engine pays). */
export interface CoinLaunch {
  x: number;
  y: number;
  ms: number;
}
type CoinListener = (c: CoinLaunch) => void;
const coinListeners = new Set<CoinListener>();

export function onCoin(fn: CoinListener) {
  coinListeners.add(fn);
  return () => {
    coinListeners.delete(fn);
  };
}

export function emitCoin(c: CoinLaunch) {
  coinListeners.forEach((fn) => fn(c));
}

/** Where coins land: the HUD cash text's centre in window coordinates (measured by the HUD, C81). */
let target = { x: 196, y: 80 };
export const coinTarget = () => target;
export function setCoinTarget(x: number, y: number) {
  target = { x, y };
}
