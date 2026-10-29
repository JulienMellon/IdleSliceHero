

export const INK = '#3B1F14';
export const SCENE_W = 393;
export const SCENE_H = 680;
/** y (scene units) of the street curb; the sidewalk runs from the shop front down to here. */
export const CURB_Y = 590;

/** How the 393×680 scene maps onto a w×h area (cover, bottom-anchored). */
export function sceneFit(w: number, h: number) {
  const s = Math.max(w / SCENE_W, h / SCENE_H);
  return { s, ox: (w - SCENE_W * s) / 2, oy: h - SCENE_H * s };
}

// ---------- projection ----------
// Room coordinates: x across (scene units), y = depth (0 = front edge of the floor, 110 = back wall,
// negative = out on the sidewalk), z = height. One-point perspective, then a fixed fit into the scene.
export const D = 110;
export const WH = 300;
// v2.1 (critic D71): the shop fills the screen — sky band above the back wall is ~95 units.
export const SC = 0.98;
export const TX = 196.5 * (1 - SC);
export const TY = -20;
/** Height of the side walls / front fascia at the street edge. */
export const FRONT_TOP = WH + 40;
export function P(x: number, y: number, z = 0): [number, number] {
  const f = 1 - y / 520;
  return [TX + (196.5 + (x - 196.5) * f) * SC, TY + (492 - y * 1.25 - z * f) * SC];
}
export const kAt = (y: number) => (1 - y / 520) * SC;
export const pts = (list: [number, number][]) => list.map((p) => `${p[0].toFixed(1)},${p[1].toFixed(1)}`).join(' ');

export function shade(hex: string, k: number) {
  const n = parseInt(hex.slice(1), 16);
  const ch = [n >> 16, (n >> 8) & 255, n & 255].map((c) => Math.max(0, Math.min(255, Math.round(k > 0 ? c + (255 - c) * k : c * (1 + k)))));
  return '#' + ch.map((c) => c.toString(16).padStart(2, '0')).join('');
}
