// Path builders for the cut-scene backdrops. Every texture (brick courses, tile grout, wood grain, window grids)
// is one path string per pattern, built once at module load — a backdrop render only picks strings.
// Art space: 400 wide, ground at the bottom (y 200), up to 110 units of wall/sky above y 0 (the panel shows y -100…200).

import { captionBottom } from './staging';

export const n = (v: number) => Math.round(v * 10) / 10;

export function rect(x: number, y: number, w: number, h: number) {
  return `M${n(x)} ${n(y)}h${n(w)}v${n(h)}h${n(-w)}Z`;
}

export function circle(cx: number, cy: number, r: number, ry = r) {
  return `M${n(cx - r)} ${n(cy)}a${n(r)} ${n(ry)} 0 1 0 ${n(2 * r)} 0a${n(r)} ${n(ry)} 0 1 0 ${n(-2 * r)} 0Z`;
}

/** Brick courses and staggered joints over a rectangle (lines only; stroke it). */
export function bricks(x0: number, y0: number, x1: number, y1: number, ch = 6, bw = 14) {
  let d = '';
  let r = 0;
  for (let y = y0 + ch; y < y1 - 0.5; y += ch, r++) d += `M${n(x0)} ${n(y)}H${n(x1)}`;
  r = 0;
  for (let y = y0; y < y1 - 0.5; y += ch, r++) {
    for (let x = x0 + (r % 2 ? bw / 2 : bw); x < x1 - 1; x += bw) d += `M${n(x)} ${n(y)}v${n(Math.min(ch, y1 - y))}`;
  }
  return d;
}

/** Brick courses that only span a ragged patch (the cartoon "exposed brick" hint). */
export function brickPatch(x: number, y: number, rows: number, widths: number[], ch = 5, bw = 11) {
  let d = '';
  for (let r = 0; r < rows; r++) {
    const w = widths[r % widths.length];
    const yy = y + r * ch;
    const off = r % 2 ? bw / 2 : 0;
    d += `M${n(x + off)} ${n(yy)}h${n(w)}`;
    for (let xx = x + off + bw; xx < x + off + w; xx += bw) d += `M${n(xx)} ${n(yy)}v${ch}`;
  }
  return d;
}

/** Grid lines (tiles, glass curtain walls): verticals every `sx`, horizontals every `sy`. */
export function gridLines(x0: number, y0: number, x1: number, y1: number, sx: number, sy: number) {
  let d = '';
  for (let x = x0 + sx; x < x1 - 0.5; x += sx) d += `M${n(x)} ${n(y0)}V${n(y1)}`;
  for (let y = y0 + sy; y < y1 - 0.5; y += sy) d += `M${n(x0)} ${n(y)}H${n(x1)}`;
  return d;
}

/** Window panes: `cols`×`rows` rectangles of w×h on a pitch of px×py. */
export function windows(x0: number, y0: number, cols: number, rows: number, w: number, h: number, px: number, py: number, skip?: (c: number, r: number) => boolean) {
  let d = '';
  for (let r = 0; r < rows; r++) for (let c = 0; c < cols; c++) if (!skip?.(c, r)) d += rect(x0 + c * px, y0 + r * py, w, h);
  return d;
}

/** Mullions (a cross in each pane) for the same grid. */
export function mullions(x0: number, y0: number, cols: number, rows: number, w: number, h: number, px: number, py: number, skip?: (c: number, r: number) => boolean) {
  let d = '';
  for (let r = 0; r < rows; r++)
    for (let c = 0; c < cols; c++) {
      if (skip?.(c, r)) continue;
      const x = x0 + c * px;
      const y = y0 + r * py;
      d += `M${n(x + w / 2)} ${n(y)}v${n(h)}M${n(x)} ${n(y + h * 0.45)}h${n(w)}`;
    }
  return d;
}

/** Floor boards seen from a little above: rows get deeper toward the viewer; staggered butt joints; grain flicks. */
export function boards(x0: number, x1: number, rowsY: number[]) {
  let lines = '';
  let grain = '';
  rowsY.forEach((y, i) => {
    lines += `M${n(x0)} ${n(y)}H${n(x1)}`;
    const next = rowsY[i + 1];
    if (next === undefined) return;
    const len = 46 + i * 14;
    for (let x = x0 + ((i * 37) % len); x < x1; x += len) {
      lines += `M${n(x)} ${n(y)}V${n(next)}`;
      grain += `M${n(x + 8)} ${n(y + (next - y) * 0.45)}q${n(len * 0.18)} -2 ${n(len * 0.36)} 0`;
    }
  });
  return { lines, grain };
}

/**
 * Floor planks running toward the viewer: board edges converge on a vanishing point above the floor, with
 * staggered butt joints between neighbours and a grain flick on some boards.
 */
export function planks(x0: number, x1: number, y0: number, y1: number, vpX: number, vpY: number, pitch: number) {
  const k = (y1 - vpY) / (y0 - vpY);
  const at = (x: number, y: number) => vpX + (x - vpX) * ((y - vpY) / (y0 - vpY));
  let lines = '';
  let joints = '';
  let grain = '';
  let i = 0;
  for (let x = x0; x <= x1; x += pitch, i++) {
    lines += `M${n(x)} ${y0}L${n(vpX + (x - vpX) * k)} ${y1}`;
    const yj = y0 + ((i * 37) % 100) / 100 * (y1 - y0);
    joints += `M${n(at(x, yj))} ${n(yj)}L${n(at(x + pitch, yj))} ${n(yj)}`;
    if (i % 2 === 0) {
      const yg = y0 + (((i * 53) % 100) / 100) * (y1 - y0) * 0.8 + 3;
      const gx = at(x + pitch * 0.5, yg);
      grain += `M${n(gx)} ${n(yg)}l${n((gx - vpX) * 0.06)} 8`;
    }
  }
  return { lines, joints, grain };
}

/** Points along a quadratic curve (string-light bulbs). */
export function alongQuad(p0: [number, number], c: [number, number], p1: [number, number], count: number) {
  return Array.from({ length: count }, (_, i) => {
    const t = (i + 0.5) / count;
    const u = 1 - t;
    return [u * u * p0[0] + 2 * u * t * c[0] + t * t * p1[0], u * u * p0[1] + 2 * u * t * c[1] + t * t * p1[1]] as [number, number];
  });
}

/** Rain: every streak in one path. */
export function rain(count: number, x0: number, x1: number, y0: number, y1: number, len: number) {
  let d = '';
  for (let i = 0; i < count; i++) {
    const x = x0 + ((i * 53) % (x1 - x0));
    const y = y0 + ((i * 97) % (y1 - y0));
    d += `M${x} ${y}l${n(-len / 3)} ${len}`;
  }
  return d;
}

/** A puffy cloud bank as one outline (circles unioned by the nonzero fill). */
export function cloud(x: number, y: number, k: number) {
  return circle(x, y, 13 * k) + circle(x + 16 * k, y - 7 * k, 18 * k) + circle(x + 35 * k, y - 1 * k, 14 * k) + circle(x + 50 * k, y + 3 * k, 10 * k) + rect(x, y, 50 * k, 13 * k);
}

/** A far skyline: tower outlines (with the odd spire/stepped crown) from the horizon up. */
export function skyline(base: number, towers: [number, number, number][]) {
  return towers
    .map(([x, w, h], i) => {
      const top = base - h;
      if (i % 4 === 1) return `M${x} ${base}V${top + 8}h${n(w * 0.2)}v-8h${n(w * 0.6)}v8h${n(w * 0.2)}V${base}Z`;
      if (i % 5 === 2) return `M${x} ${base}V${top}h${n(w / 2 - 1)}v-14h2v14h${n(w / 2 - 1)}V${base}Z`;
      return rect(x, top, w, h);
    })
    .join('');
}

// ---------------------------------------------------------------------------------------------------------------
// Layout rules shared by the art and its tests: what the panel shows of the 400-wide art space, and where signs may sit.

/** What a w×h px panel shows of the art space (Backdrop's viewBox, sliced to fill, ground at y 200, centred on x 200). */
export function backdropView(width: number, height: number) {
  const vbH = Math.max(200, Math.min(300, (400 * height) / width));
  const scale = Math.max(width / 400, height / vbH);
  const visW = width / scale;
  return { vbH, scale, x0: 200 - visW / 2, x1: 200 + visW / 2, y0: 200 - height / scale, y1: 200 };
}

/** The player's two-line caption box covers this much of the panel top, in pt; no sign may sit under it. */
export const CAPTION_ZONE_PT = captionBottom(2);
/** Signs keep this far from the left and right edges of the panel, in pt, so none runs off or is cut by the frame. */
export const SIGN_INSET_PT = 12;
/** String-light bulbs keep this far in from the panel edges (or are wholly outside it), in pt. */
export const BULB_INSET_PT = 10;

export interface Box {
  x0: number;
  y0: number;
  x1: number;
  y1: number;
}
/** A sign drawn in its own w×h local space at (x, y) scaled by k. */
export interface Placed {
  x: number;
  y: number;
  k: number;
  w: number;
  h: number;
}
export const boxOf = (s: Placed): Box => ({ x0: s.x, y0: s.y, x1: s.x + s.w * s.k, y1: s.y + s.h * s.k });

/** The shop wall, left to right: menu board and PIZZA sign along the top (below the caption zone), the EST. 1974 photo under the sign. */
export const SHOP_SIGNS = {
  menu: { x: 102, y: -46, k: 0.8, w: 70, h: 40 },
  pizza: { x: 164, y: -46, k: 0.8, w: 84, h: 32 },
  frame: { x: 216, y: -12, k: 0.8, w: 66, h: 58 },
} as const satisfies Record<string, Placed>;

/**
 * The MEGASLICE billboards: on two posts standing on the factory's sawtooth ridges in the industrial skyline (the ridges at x 204 and
 * 240, y -6), bolted to the facade uptown. Clear of the left chimney's steam, which drifts up and right to about x 174.
 */
export const INDUSTRIAL_BILLBOARD = { x: 172, y: -47, w: 98, h: 24 } as const;
export const INDUSTRIAL_POSTS = { xs: [204, 240], baseY: -6, color: '#3a2a20' } as const;
export const UPTOWN_BILLBOARD = { x: 196, y: -30, w: 74, h: 30 } as const;
export const PIER_PLAQUE = { x: 232, y: 20, w: 60, h: 26 } as const;
export const HQ_PLATE = { x: 150, y: -46, w: 100, h: 18 } as const;
/** Scale a [cx, cy, r] circle about (146, -14), then shift it by (dx, dy). */
const oakCircle = ([cx, cy, r]: readonly [number, number, number], k: number, dx: number, dy: number): [number, number, number] => [n(146 + (cx - 146) * k + dx), n(-14 + (cy + 14) * k + dy), n(r * k)];
/** The canopy as drawn in the original art (cut-scene 22 round 54): five puffs, three shading puffs, two highlights. */
const OAK_ORIGINAL = {
  canopy: [[146, -40, 34], [116, -10, 28], [176, -6, 30], [144, 14, 30], [170, -54, 22]],
  shade: [[182, 0, 22], [160, 26, 18], [178, -40, 14]],
  light: [[124, -34, 12], [134, -60, 9]],
} as const;
/** D398: the canopy shrunk 15 % and sat 6 units right of, 10 units lower than, the old one so it clears the caption and the left roof's ridge. */
export const OAK_FIT = { k: 0.85, dx: 6, dy: 10, outline: 4 } as const;
const fitOak = (list: readonly (readonly [number, number, number])[]) => list.map((c) => oakCircle(c, OAK_FIT.k, OAK_FIT.dx, OAK_FIT.dy));
const OAK_CANOPY = fitOak(OAK_ORIGINAL.canopy);
/** The suburbs oak: its trunk stands left of the centre line, so a figure's cap never has a tree growing out of it. Canopy bottom in art y (outline included). */
export const OAK = {
  trunkX0: 138,
  trunkX1: 152,
  canopy: OAK_CANOPY,
  shade: fitOak(OAK_ORIGINAL.shade),
  light: fitOak(OAK_ORIGINAL.light),
  canopyTop: Math.min(...OAK_CANOPY.map(([, cy, r]) => cy - r)) - OAK_FIT.outline / 2,
  canopyBottom: Math.max(...OAK_CANOPY.map(([, cy, r]) => cy + r)) + OAK_FIT.outline / 2,
} as const;
/** The left house's roof ridge and its chimney (standing on the ridge's right slope, tall enough to clear the canopy), in art units. */
export const LEFT_HOUSE = { ridge: [116, -40], chimney: { x: 124, w: 12, base: -24, top: -66 } } as const;
/** The sunset sun on the waterfront: low over the bay, clear of the caption. */
export const SUN = { cx: 188, cy: 34, r: 20, glow: 46 } as const;
/** Foreground prop signs. */
export const SOLD_SIGN = { x: 106, y: -44, w: 100, h: 46 } as const;

const rectBox = (r: { x: number; y: number; w: number; h: number }): Box => ({ x0: r.x, y0: r.y, x1: r.x + r.w, y1: r.y + r.h });
/** Every sign-like board per backdrop (and per prop), for the layout tests. */
export const SIGN_BOXES: Record<string, Box> = {
  'shop/menu': boxOf(SHOP_SIGNS.menu),
  'shop/pizza': boxOf(SHOP_SIGNS.pizza),
  'shop/frame': boxOf(SHOP_SIGNS.frame),
  'industrial/billboard': rectBox(INDUSTRIAL_BILLBOARD),
  'uptown/billboard': rectBox(UPTOWN_BILLBOARD),
  'waterfront/pier-9': rectBox(PIER_PLAQUE),
  'megaslice-hq/plate': rectBox(HQ_PLATE),
  'prop/sold-sign': rectBox(SOLD_SIGN),
};

/** A point on a quadratic curve. */
export function quadAt(p0: [number, number], c: [number, number], p1: [number, number], t: number): [number, number] {
  const u = 1 - t;
  return [u * u * p0[0] + 2 * u * t * c[0] + t * t * p1[0], u * u * p0[1] + 2 * u * t * c[1] + t * t * p1[1]];
}

/**
 * The shop's string lights: two swags meeting at x 200. Bulbs sit at fixed spots that every phone and tablet panel either shows
 * whole and well inside its edges (x 104 to 296) or crops out entirely (x < 70 and x > 330, which only a wide web window shows).
 */
export const STRING_LIGHTS = (() => {
  const swags: [[number, number], [number, number], [number, number]][] = [
    [[-10, -102], [100, -66], [200, -96]],
    [[200, -96], [300, -66], [410, -102]],
  ];
  const ts = [0.15, 0.25, 0.35, 0.6, 0.7, 0.8, 0.9];
  const bulbs = swags.flatMap(([p0, c, p1], s) => ts.map((t) => quadAt(p0, c, p1, s === 0 ? t : 1 - t)));
  return { wire: 'M-10 -102 Q100 -66 200 -96 Q300 -66 410 -102', bulbs, radius: 5 };
})();

/**
 * D394: a captioned panel (the player draws its caption bar over the top of the art) hangs no string lights. On the smallest phone the
 * bar plus a 6 pt gap ends below the signs' top row, so there is no clear stretch of wall to hang a bulb in.
 */
export const NO_LIGHTS = { wire: '', bulbs: [] as [number, number][], radius: STRING_LIGHTS.radius };
export const lightsFor = (captioned: boolean) => (captioned ? NO_LIGHTS : STRING_LIGHTS);
/** Gap kept between the caption bar's bottom edge and anything hung under it, in pt. */
export const CAPTION_GAP_PT = 6;
