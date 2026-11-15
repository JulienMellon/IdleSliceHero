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

/**
 * The `cheer` pulse (D444): something worth a cheer happened (a streak, a reward): the scene's cooks raise both arms for CHEER_SECONDS.
 * Anyone may `emitCheer()`; the storefront listens and turns it into a flag on the cooks (`cast.ts` `cheer`).
 */
export const CHEER_SECONDS = 1.2;
const cheerListeners = new Set<Listener>();

export function onCheer(fn: Listener) {
  cheerListeners.add(fn);
  return () => {
    cheerListeners.delete(fn);
  };
}

export function emitCheer() {
  cheerListeners.forEach((fn) => fn());
}

/**
 * The `gameday` pulse (v5.16 S2a): the final whistle of a Mudhens game, a Game Day rush begins. The audio lane listens; the HUD's layer stack
 * emits it when the Suburbs rush starts.
 */
const gameDayListeners = new Set<Listener>();

export function onGameDay(fn: Listener) {
  gameDayListeners.add(fn);
  return () => {
    gameDayListeners.delete(fn);
  };
}

export function emitGameDay() {
  gameDayListeners.forEach((fn) => fn());
}

/** The shop report's pulses (`service-up` when a shop starts tipping, `service-down` when its line goes cold), relayed here so the audio lane hears every pulse from one bus. */
export { onServicePulse, type ServicePulse } from '../engine/features/service';
