
import { SCENE_WIDTH } from '../../content/shop-layout';

export const INK = '#3B1F14';
export const SCENE_W = 393;
export const SCENE_H = 680;
/** y (scene units) of the street curb; the sidewalk runs from the shop front down to here. */
export const CURB_Y = 590;

// ---------- the frame (v5.18, card V1) ----------
/** The shop's drawing as data: how wide it is, how tall, and where the perspective's vanishing point stands. The first three footprints ask for one screen's width; the Restaurant and the Flagship are wider (content/shop-layout.ts). */
export interface SceneFrame {
  readonly width: number;
  readonly height: number;
  /** x (scene units) of the perspective's vanishing point and of the room's centre: half the width. */
  readonly vanishX: number;
  /**
   * x of the drawing's left edge, in the space the frame's own coordinates are in: 0 for a real frame; negative for the frame of the draw space
   * (`drawFrame`: the same drawing seen from the one-screen vanishing point, so the drawing code's default `P` stands on the right place).
   */
  readonly x0: number;
}
const frames = new Map<number, SceneFrame>();
/** The frame `width` units wide (one shared object per width, so memo deps and `===` hold). */
export function makeFrame(width: number): SceneFrame {
  let f = frames.get(width);
  if (!f) {
    f = Object.freeze({ width, height: SCENE_H, vanishX: width / 2, x0: 0 });
    frames.set(width, f);
  }
  return f;
}
/** The one-screen frame: what the first three footprints are drawn in. */
export const ONE_SCREEN = makeFrame(SCENE_W);
/** Frame width by footprint (0 = starter … 4 = flagship): content/shop-layout.ts (one screen for the first three, wider for the Restaurant and the Flagship). */
export const FRAME_WIDTH: readonly number[] = SCENE_WIDTH;
export const sceneFrame = (footprint: number): SceneFrame => makeFrame(FRAME_WIDTH[Math.max(0, Math.min(FRAME_WIDTH.length - 1, footprint))]);
/** The frame is wider than one screen, so its drawing sits in a horizontal scroll view. */
export const isWide = (frame: SceneFrame): boolean => frame.width > ONE_SCREEN.width;
/** How far the frame's vanishing point is right of the one-screen one: the shift between the frame's space and the draw space. 0 for a one-screen frame. */
export const drawShift = (frame: SceneFrame): number => frame.vanishX - ONE_SCREEN.vanishX;
const draws = new Map<SceneFrame, SceneFrame>();
/**
 * The frame of the draw space: the room and everything in it, in the coordinates the drawing code's default `P` expects (the vanishing point at
 * the one-screen 196.5), so the drawing code never has to be told the frame. `Svg` draws that space inside a group moved right by `drawShift`.
 * A one-screen frame is its own draw space. Everything in a draw-space frame is `x - drawShift` of the frame's own space; its edges are x0 and x0 + width.
 */
export function drawFrame(frame: SceneFrame): SceneFrame {
  if (drawShift(frame) === 0) return frame;
  let f = draws.get(frame);
  if (!f) {
    f = Object.freeze({ width: frame.width, height: frame.height, vanishX: ONE_SCREEN.vanishX, x0: -drawShift(frame) });
    draws.set(frame, f);
  }
  return f;
}
/** The drawing's right edge, in the frame's own space. */
export const frameRight = (frame: SceneFrame): number => frame.x0 + frame.width;

export interface SceneFit {
  s: number;
  ox: number;
  oy: number;
}
/** How the frame maps onto a w×h area (cover, bottom-anchored, centred across). Pass the area the frame is drawn in: the screen for a one-screen frame, the scroll content for a wide one. */
export function sceneFit(w: number, h: number, frame: SceneFrame = ONE_SCREEN): SceneFit {
  const s = Math.max(w / frame.width, h / frame.height);
  return { s, ox: (w - frame.width * s) / 2, oy: h - frame.height * s };
}

/**
 * How a frame sits on a w×h screen. A one-screen frame is covered and cropped exactly as before (`fit` = `sceneFit(w, h)`, no scroll). A wider frame
 * is scaled the same way (by one screen's width, or the height) and is `contentW` wide: the area its scroll view holds, in which `fit.ox` is 0.
 */
export function sceneView(w: number, h: number, frame: SceneFrame = ONE_SCREEN): { scrolls: boolean; contentW: number; maxScroll: number; fit: SceneFit } {
  const wide = isWide(frame);
  const s = Math.max(w / ONE_SCREEN.width, h / frame.height);
  const contentW = wide ? frame.width * s : w;
  return { scrolls: wide, contentW, maxScroll: wide ? Math.max(0, contentW - w) : 0, fit: sceneFit(contentW, h, frame) };
}

/**
 * Where a place in the shop is on the screen, across: `x` (scene units) through the content's fit, less how far the view has scrolled.
 * Everything anchored to a place in the shop uses this: station tags and badges, head bubbles, coin origins, and the scene overlays (the harbour's
 * boats, the rival's storefront, the layer props, the cosmetics), which are drawn inside the scrolling content and so move with it.
 * Screen-fixed, and never put through it: the HUD chips, the banners, the order chip, the shop report strip, the sidewalk row, and the golden
 * pizza's lane (floating-bonus.tsx: it flies over the screen, not over the shop).
 */
export const sceneToScreen = (x: number, scrollX: number, fit: Pick<SceneFit, 's' | 'ox'>): number => fit.ox + x * fit.s - scrollX;
/** The inverse of `sceneToScreen`: the scene x under screen x `sx`. */
export const screenToScene = (sx: number, scrollX: number, fit: Pick<SceneFit, 's' | 'ox'>): number => (sx + scrollX - fit.ox) / fit.s;

/** Where a shop opens: the scroll position (px) that puts the scene x `focusX` mid-screen, kept inside the content. 0 for a one-screen frame. */
export function openScroll(focusX: number, s: number, screenW: number, maxScroll: number): number {
  return Math.max(0, Math.min(maxScroll, focusX * s - screenW / 2));
}

// ---------- projection ----------
// Room coordinates: x across (scene units), y = depth (0 = front edge of the floor, 110 = back wall,
// negative = out on the sidewalk), z = height. One-point perspective, then a fixed fit into the scene.
export const D = 110;
export const WH = 300;
// v2.1: the shop fills the screen — sky band above the back wall is ~95 units.
export const SC = 0.98;
export const TY = -20;
/** Height of the side walls / front fascia at the street edge. */
export const FRONT_TOP = WH + 40;
export function P(x: number, y: number, z = 0, frame: SceneFrame = ONE_SCREEN): [number, number] {
  const v = frame.vanishX;
  const f = 1 - y / 520;
  return [v * (1 - SC) + (v + (x - v) * f) * SC, TY + (492 - y * 1.25 - z * f) * SC];
}
/** Inverse of P's x at depth y (z = 0): the room x that lands at screen x `sx`. */
export const unprojectX = (sx: number, y: number, frame: SceneFrame = ONE_SCREEN) => frame.vanishX + ((sx - frame.vanishX * (1 - SC)) / SC - frame.vanishX) / (1 - y / 520);
export const kAt = (y: number) => (1 - y / 520) * SC;
export const pts = (list: [number, number][]) => list.map((p) => `${p[0].toFixed(1)},${p[1].toFixed(1)}`).join(' ');

/** Lighten (k > 0) or darken (k < 0) a #rrggbb colour. Cached: the scene asks for a small fixed set every frame. */
export function shade(hex: string, k: number) {
  const key = hex + k;
  let v = shadeCache.get(key);
  if (v === undefined) {
    v = shadeRaw(hex, k);
    if (shadeCache.size >= 512) shadeCache.clear(); // bounded; real use stays well under this
    shadeCache.set(key, v);
  }
  return v;
}
const shadeCache = new Map<string, string>();

export function shadeRaw(hex: string, k: number) {
  const n = parseInt(hex.slice(1), 16);
  const ch = [n >> 16, (n >> 8) & 255, n & 255].map((c) => Math.max(0, Math.min(255, Math.round(k > 0 ? c + (255 - c) * k : c * (1 + k)))));
  return '#' + ch.map((c) => c.toString(16).padStart(2, '0')).join('');
}
