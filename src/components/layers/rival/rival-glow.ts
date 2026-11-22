// D547: "Go" on a "Beat MegaSlice" row lands on the shop with the rival's pavement band glowing for 2 s, so the eye finds the challenge. Pure module state:
// the screen emits the glow for a shop, the rival scene (mounted for that shop, maybe a moment later) reads how long is left.
type Listener = () => void;

export const RIVAL_GLOW_MS = 2000;
/** The glow breathes: a full pulse takes this long (ms). */
export const RIVAL_GLOW_PULSE_MS = 700;

let glow: { shop: string; until: number } | null = null;
const listeners = new Set<Listener>();

/** Start the glow on `shop`'s rival band; it runs `ms` from `now`. */
export function emitRivalGlow(shop: string, now: number = Date.now(), ms: number = RIVAL_GLOW_MS): void {
  glow = { shop, until: now + ms };
  listeners.forEach((fn) => fn());
}

/** Milliseconds of glow left on `shop` at `now`; 0 for another shop, or once it is over. */
export const rivalGlowLeft = (shop: string, now: number = Date.now()): number => (glow && glow.shop === shop ? Math.max(0, glow.until - now) : 0);

/** Listen for a glow starting; returns the unsubscribe. */
export function onRivalGlow(fn: Listener): () => void {
  listeners.add(fn);
  return () => {
    listeners.delete(fn);
  };
}

/** Forget any glow (tests, a franchise's fresh screen). */
export function resetRivalGlow(): void {
  glow = null;
  listeners.clear();
}

/** How bright the glow is, 0..1, `left` ms before it ends: a breathing pulse that fades out over the last half second. Zero once over. */
export function rivalGlowLevel(left: number, total: number = RIVAL_GLOW_MS): number {
  if (!(left > 0)) return 0;
  const elapsed = Math.max(0, total - left);
  const breath = 0.65 + 0.35 * Math.sin((elapsed / RIVAL_GLOW_PULSE_MS) * 2 * Math.PI);
  return breath * Math.min(1, left / 500);
}
