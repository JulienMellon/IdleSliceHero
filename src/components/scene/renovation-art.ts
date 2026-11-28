// Where a renovated shop's new things stand (v5.25, card S6; the list of looks is docs/build/v5.25/renovation.md). Pure (no React): the drawings are renovation-props.tsx.
//
// A renovation gives a shop a plaque (I, II, III), one fixture upgrade per level (a part of the building changes: awning, oven, name sign, window, counter, rail, floor,
// rooftop) and three decor items per level (props). The fixtures are drawn on their own part (facade.tsx, the oven arch and the counter's apron are pieces of their own),
// and the decor items are placed here, once per layout, by one rule:
//   - each decor item has a MOUNT (the counter top, the back wall, the ceiling, the floor, the sill, the front wall, the pavement) and a region it may stand in;
//   - inside its region the item takes the spot that covers least of what is already there (the ladder's props at their top step, the menu, the window, the oven, the tables
//     and diners, the other new things), and never a spot that covers a head, a badge, the doorway, the WELCOME mat, or more than COVER_MAX of a station (protected.ts).
// The places are found for the shop's nine decor items together, whether or not they are bought, so buying one never moves another. The plain plan is placed and the mirrored
// plan flips the places (the drawings are not turned round), as the ladder does.
import type { NeighborhoodId } from '../../content/types';
import { RENO_ITEMS, RENO_SHOPS, renoShopOf, type RenoShop } from '../../content/renovation';
import { renoLevel, renoOf } from '../../engine/features/renovation';
import type { CityDef } from '../../content/cities';
import type { GameState } from '../../engine/game';
import {
  badgeBand,
  bboxOf,
  doorRect,
  figureBox,
  fixedPeople,
  hits,
  ladderProps,
  matRect,
  menuRect,
  obstacles,
  propRect,
  signRect,
  spotBoxes,
  windowRect,
  type LadderInput,
} from './ladder';
import { D, P, kAt } from './projection';
import { flipRect, plainOf } from './layout-space';
import { TREE_Y, secondVehicleShift, type Layout } from './layout';
import { patioDeck, deckBox } from './patio-deck';
import { stationRects, doorwaySignRect, type Rect } from './stations';
import { domeGeom, ovenFrame } from './geometry';

/** What a shop's renovation puts in the furniture inputs: all primitives, so the furniture memo keys on them. */
export interface RenoDress {
  /** The set of looks this shop wears ('' when it has none or is not renovated). */
  renoSet: RenoShop | '';
  /** 0 to 3: the plaque's numeral and how many fixtures are shown. */
  renoLevel: number;
  /** The bought decor items' things, joined by commas in the list's order (`espresso,wine-rack`): a primitive. */
  renoDecor: string;
}
export const NO_RENO: RenoDress = { renoSet: '', renoLevel: 0, renoDecor: '' };

/** The thing an id names (`reno2-downtown-vespa` -> `vespa`). */
export const thingOf = (id: string): string => id.split('-').slice(2).join('-');

/** A shop's renovation as the scene reads it: through E10's selectors (`renoLevel`, `renoOf`) and the set of looks its position in the city wears. */
export function renoDressOf(g: Pick<GameState, 'renovation'>, shop: NeighborhoodId, city: CityDef): RenoDress {
  const level = renoLevel(g, shop);
  const set = renoShopOf(shop, city);
  if (!set || level === 0) return NO_RENO;
  const bought = new Set(renoOf(g, shop).decor.map(thingOf));
  const order = RENO_ITEMS[set].flatMap((l) => l.decor.map(thingOf));
  return { renoSet: set, renoLevel: level, renoDecor: order.filter((t) => bought.has(t)).join(',') };
}

/** The decor things of a set, in the list's order (the order the places are found in). */
export const decorOf = (set: RenoShop): string[] => RENO_ITEMS[set].flatMap((l) => l.decor.map(thingOf));
/** The fixtures of a set by level (index 0 = level I): `awning`, `oven-arch`, `gold-sign`. */
export const fixturesOf = (set: RenoShop): string[] => RENO_ITEMS[set].map((l) => thingOf(l.fixture));
/** Whether the shop wears fixture `name` of its set: its level has reached it. */
export const hasFixture = (d: Pick<RenoDress, 'renoSet' | 'renoLevel'>, name: string): boolean =>
  d.renoSet !== '' && fixturesOf(d.renoSet).findIndex((f) => f === name) >= 0 && fixturesOf(d.renoSet).findIndex((f) => f === name) < d.renoLevel;

// ---------- the plaque ----------

/** The plaque's box (screen units): 38 x 26 whatever the frame (an oval, a rivetted plate or a porthole ring), numeral at 12 pt. */
export const RENO_PLAQUE_W = 38;
/** The plaque's frame by the shop's place in the city (docs/build/v5.25/renovation.md): an oval with a rope edge, a rivetted plate, a porthole ring. The other shops' (card S7) draw the oval until theirs land. */
export type PlaqueFrame = 'oval' | 'plate' | 'porthole';
const FRAMES: readonly PlaqueFrame[] = ['oval', 'plate', 'porthole'];
export const plaqueFrame = (set: RenoShop | ''): PlaqueFrame => FRAMES[RENO_SHOPS.indexOf(set as RenoShop)] ?? 'oval';
export const RENO_PLAQUE_H = 26;
/**
 * The renovation plaque by the door: on the brick header over the doorway, above the master's plaque (cosmetics.ts `plaqueRect`, 8 lower). Beside the round window of the header
 * and over the door's own glass (the doorway's protected rect starts at the glass, 270).
 */
export function renoPlaqueRect(lay: Pick<Layout, 'door'>): Rect {
  const x0 = P(lay.door.x0 - 8, 0)[0] + 1;
  const y1 = P(0, 0, 196)[1] - 31;
  return { x0, x1: x0 + RENO_PLAQUE_W, y0: y1 - RENO_PLAQUE_H, y1 };
}

// ---------- the decor ----------

export type Mount = 'counter' | 'wall' | 'hang' | 'floor' | 'kitchen' | 'sill' | 'front' | 'street';

interface Def {
  mount: Mount;
  /** The drawing's own box, in its units: x right of the anchor, y down from it (the anchor is the bottom centre; a hung thing's is the top centre). */
  box: Rect;
}

const box = (hw: number, up: number, down = 1): Rect => ({ x0: -hw, x1: hw, y0: -up, y1: down });
const hung = (hw: number, h: number): Rect => ({ x0: -hw, x1: hw, y0: 0, y1: h });

/** All 27 things, by `<set>/<thing>`. */
export const DEFS: Readonly<Record<string, Def>> = {
  'downtown/espresso': { mount: 'counter', box: box(8, 34) },
  'downtown/wine-rack': { mount: 'wall', box: box(13, 34, 0) },
  'downtown/chalkboard': { mount: 'street', box: box(12, 32, 2) },
  'downtown/pendant-lamps': { mount: 'hang', box: hung(24, 25) },
  'downtown/vespa': { mount: 'street', box: box(21, 28, 2) },
  'downtown/herb-box': { mount: 'sill', box: box(24, 16, 2) },
  'downtown/chandelier': { mount: 'hang', box: hung(16, 34) },
  'downtown/medallion': { mount: 'floor', box: { x0: -22, x1: 22, y0: -9, y1: 9 } },
  'downtown/bust': { mount: 'kitchen', box: box(9, 38) },
  'suburbs/jukebox': { mount: 'floor', box: box(14, 46) },
  'suburbs/stools': { mount: 'floor', box: box(30, 20, 2) },
  'suburbs/pie-case': { mount: 'counter', box: box(10, 27) },
  'suburbs/booth': { mount: 'floor', box: box(24, 38, 2) },
  'suburbs/pennants': { mount: 'hang', box: hung(0, 17) },
  'suburbs/gumball': { mount: 'floor', box: box(8, 30) },
  'suburbs/cadillac': { mount: 'street', box: box(30, 26, 3) },
  'suburbs/trophy-case': { mount: 'wall', box: box(14, 42, 0) },
  'suburbs/popcorn-cart': { mount: 'street', box: box(17, 38, 2) },
  'waterfront/crates': { mount: 'street', box: box(12, 30, 2) },
  'waterfront/life-ring': { mount: 'front', box: box(10, 20) },
  'waterfront/anchor': { mount: 'street', box: box(11, 28, 2) },
  'waterfront/net-buoys': { mount: 'hang', box: hung(24, 40) },
  'waterfront/rowboat': { mount: 'street', box: box(22, 16, 2) },
  'waterfront/lantern-post': { mount: 'street', box: { x0: -8, x1: 14, y0: -48, y1: 1 } },
  'waterfront/helm': { mount: 'wall', box: box(15, 31, 0) },
  'waterfront/mast': { mount: 'street', box: box(10, 50) },
  'waterfront/barrel-table': { mount: 'street', box: box(12, 26, 2) },
};

export interface RenoPlaced {
  /** `<set>/<thing>` */
  key: string;
  thing: string;
  /** Screen anchor, scale and the painter's depth. */
  ax: number;
  ay: number;
  k: number;
  sortY: number;
  rect: Rect;
}

/** The pennants' string spans the room: its box is the back wall's width. */
const pennantBox = (lay: Layout): Rect => {
  const [a] = P(lay.L + 4, D);
  const [b] = P(lay.R - 4, D);
  return { x0: -(b - a) / 2, x1: (b - a) / 2, y0: 0, y1: 17 };
};

/** The depth the street things' feet stand at: just above the report strip (lay.floorY), and never lower than this. */
export const STREET_FY = -22;
/** How far past the pavement's feet the front line stands: behind the queue (-6), in front of the shop front. */
const SILL_Y = -1;

const sorted = (r: Rect, ax: number, ay: number, k: number): Rect => ({ x0: ax + r.x0 * k, y0: ay + r.y0 * k, x1: ax + r.x1 * k, y1: ay + r.y1 * k });
const area = (r: Rect) => Math.max(0, r.x1 - r.x0) * Math.max(0, r.y1 - r.y0);
const overlap = (a: Rect, b: Rect) => area({ x0: Math.max(a.x0, b.x0), y0: Math.max(a.y0, b.y0), x1: Math.min(a.x1, b.x1), y1: Math.min(a.y1, b.y1) });
/** The share of `a` that lies under `b` (protected.ts `coveredShare`'s own rule, kept here so this file needs no React-side import). */
const shareOf = (a: Rect, b: Rect) => (area(a) > 0 ? overlap(a, b) / area(a) : 0);
/** The most of a station's rect a decor item may lie over (protected.ts `COVER_MAX`). */
const STATION_MAX = 0.1;

interface Cand {
  ax: number;
  ay: number;
  k: number;
  sortY: number;
  /** Where the thing would like to stand (a screen point): the nearest candidate wins a tie. */
  pref: [number, number];
}

/**
 * Where each of the shop's nine decor things stands in this layout (the plain plan's, flipped for the mirrored plan). An item with no clear spot is left out (the budget in
 * `__tests__/renovation-art.test.ts` asserts none is, for every footprint and every level of the shop).
 */
export function renoSpots(lay: Layout, set: RenoShop, id: NeighborhoodId, vehicle = 1, idleShop = false): RenoPlaced[] {
  if (lay.mirrored) {
    const a = 2 * lay.frame.vanishX;
    return renoSpots(plainOf(lay), set, id, vehicle, idleShop).map((p) => ({ ...p, ax: a - p.ax, rect: flipRect(p.rect, a) }));
  }
  const things = decorOf(set);
  const blockers = obstacles(lay, id);
  const people = fixedPeople(lay);
  const heads = people.map((p) => ({ y: p.y, head: p.head }));
  const stRects = stationRects(lay, 44);
  const ladder: LadderInput = { id, prepStep: 8, counterStep: 8, driverStep: 8, pins: 12, vehicle, outside: !idleShop };
  const placedLadder = ladderProps(lay, ladder);
  const menu = menuRect(lay);
  const left = P(lay.L + 6, D)[0];
  const right = P(lay.R - 6, D)[0];
  const frameL = lay.frame.x0 + 3;
  const frameR = lay.frame.x0 + lay.frame.width - 3;
  const band = badgeBand(lay);
  const fy = Math.max(lay.floorY, STREET_FY);
  const mat = matRect(lay);
  const door = doorRect(lay);
  const dsign = doorwaySignRect(lay);

  // what a decor item may overlap a little, and how much that is worth avoiding
  const soft: { r: Rect; w: number }[] = [
    // what stands on the counter's top gives way a little more easily: a counter thing goes to its end of it whatever stands there (the ladder's box stack and second register)
    ...placedLadder.map((p) => ({ r: p.rect, w: p.id === 'boxStack' || p.id === 'register2' ? 0.15 : 1 })),
    ...blockers.wall.map((r) => ({ r, w: 0.6 })),
    ...people.map((p) => ({ r: p.box, w: 0.7 })),
    // the first register and the boxes on the counter's top
    ...(() => {
      const [rx, ry] = P(lay.staff[0] + 12, 70, 38);
      const [bx0, by] = P(lay.counter.x1 - 24, 74, 38);
      const [bx1] = P(lay.counter.x1 - 6, 74, 38);
      return [
        { r: { x0: rx - 8, y0: ry - 22, x1: rx + 8, y1: ry + 1 }, w: 3 },
        { r: { x0: bx0, y0: by - 14, x1: bx1, y1: by + 1 }, w: 0.15 },
      ];
    })(),
    ...(menu ? [{ r: menu, w: 0.6 }] : []),
    { r: signRect(lay), w: 2 },
    { r: propRect(lay), w: 2 },
    // the potted tree and the parked vehicles (the chalk sign, the neighbourhood prop and the tree stand at the pavement's far depth: a new thing stays off them)
    ...(() => {
      const [tx, ty] = P(lay.tree.x, TREE_Y);
      const [vx, vy] = P(lay.scooter.x, lay.scooter.y);
      const v = bboxOf('wrap');
      const [wx] = P(lay.scooter.x - secondVehicleShift(vehicle), lay.scooter.y);
      return [
        { r: { x0: tx - 16, y0: ty - 62, x1: tx + 16, y1: ty + 3 }, w: 2 },
        { r: { x0: vx + v.x0, y0: vy + v.y0, x1: vx + v.x1, y1: vy + v.y1 }, w: 2 },
        { r: { x0: wx + v.x0, y0: vy + v.y0, x1: wx + v.x1, y1: vy + v.y1 }, w: 1 },
      ];
    })(),
    ...lay.patio.map((t) => ({ r: deckBox(patioDeck(t)), w: 0.6 })),
    // the queue's standing places on the pavement: a street thing keeps off them while a free stretch is left
    ...[...lay.queue, ...lay.driverQueue].map(([qx, qy]) => ({ r: figureBox(qx, qy), w: 0.5 })),
  ];
  const placed: RenoPlaced[] = [];

  // the menu board and the back window are never hidden by a thing hung or hung on the wall
  const wallHard = [...(menu ? [menu] : []), windowRect(lay, id)];
  const peopleBoxes = people.map((p) => p.box);
  const clearOf = (r: Rect, sortY: number, mount: Mount, thing = ''): boolean => {
    if ((mount === 'wall' || mount === 'hang') && wallHard.some((w) => hits(r, w) && !(thing === 'pennants' && w === menu))) return false;
    // the bust stands where it can be seen: not behind the cooks and the bakers
    if (mount === 'kitchen' && peopleBoxes.some((b) => hits(r, b))) return false;
    if (hits(r, band) && mount !== 'front') return false;
    if (shareOf(door, r) > STATION_MAX || shareOf(mat, r) > STATION_MAX || hits(r, dsign)) return false;
    if (hits(r, door)) return false;
    if (r.x0 < frameL || r.x1 > frameR) return false;
    // the stations' rects: only the counter's own things stand on the counter's; nothing else may lie over more than a tenth of one
    for (const st of ['prep', 'oven', 'counter'] as const) {
      if (st === 'counter' && mount === 'counter') continue;
      if (shareOf(stRects[st], r) > STATION_MAX || (mount === 'wall' || mount === 'hang' ? hits(r, stRects[st]) : false)) return false;
    }
    // a thing drawn over people must stay off their heads: only people standing deeper than the thing can be covered
    if (mount !== 'wall' && mount !== 'hang' && mount !== 'kitchen') for (const p of heads) if (p.y > sortY && hits(r, p.head)) return false;
    if (mount === 'kitchen') for (const p of heads) if (p.y > sortY && hits(r, p.head)) return false;
    for (const b of spotBoxes(lay)) if ((mount === 'floor' || mount === 'counter') && shareOf(b, r) > 0.3) return false;
    for (const q of placed) if (hits(q.rect, r)) return false;
    return true;
  };
  const score = (r: Rect, c: Cand): number => {
    let s = 0;
    for (const o of soft) s += o.w * overlap(r, o.r);
    return s + 0.02 * (Math.abs(c.pref[0] - (r.x0 + r.x1) / 2) + Math.abs(c.pref[1] - (r.y0 + r.y1) / 2));
  };
  const put = (thing: string, cands: Cand[]) => {
    const def = DEFS[`${set}/${thing}`];
    const b = thing === 'pennants' ? pennantBox(lay) : def.box;
    let best: { c: Cand; r: Rect; s: number } | null = null;
    for (const c of cands) {
      const r = sorted(b, c.ax, c.ay, c.k);
      if (!clearOf(r, c.sortY, def.mount, thing)) continue;
      const s = score(r, c);
      if (!best || s < best.s - 1e-9) best = { c, r, s };
    }
    if (best) placed.push({ key: `${set}/${thing}`, thing, ax: best.c.ax, ay: best.c.ay, k: best.c.k, sortY: best.c.sortY, rect: best.r });
  };

  const range = (a: number, b: number, step: number): number[] => {
    const out: number[] = [];
    for (let v = a; v <= b + 1e-9; v += step) out.push(v);
    return out;
  };
  const counterLen = lay.counter.x1 - lay.counter.x0;
  const cK = kAt(70);
  const [cx0] = P(lay.counter.x0, 70);
  const [cx1] = P(lay.counter.x1, 70);
  const ovX0 = lay.ovenCols[0].x0;
  const ovX1 = lay.ovenCols[lay.ovenCols.length - 1].x1;
  const mid = (lay.L + lay.R) / 2;

  // the widest things first, so a narrow one takes what room is left (the order only decides who gets the open stretch of pavement; every place is found for all nine)
  const widthOf = (t: string) => (t === 'pennants' ? Infinity : DEFS[`${set}/${t}`] ? DEFS[`${set}/${t}`].box.x1 - DEFS[`${set}/${t}`].box.x0 : 0);
  for (const thing of [...things].sort((a, b) => widthOf(b) - widthOf(a))) {
    // the sets of the other three shops are card S7's: their things have no entry here yet
    if (!DEFS[`${set}/${thing}`]) continue;
    const { mount } = DEFS[`${set}/${thing}`];
    const b = thing === 'pennants' ? pennantBox(lay) : DEFS[`${set}/${thing}`].box;
    const cands: Cand[] = [];
    if (mount === 'counter') {
      // the counter's top: the far end from the door first (the left end of the plain plan)
      for (const dx of range(3, counterLen - 3, 2)) {
        const [ax, ay] = P(lay.counter.x0 + dx, 70, 38);
        if (ax + b.x0 * cK < cx0 || ax + b.x1 * cK > cx1) continue;
        cands.push({ ax, ay, k: cK, sortY: 63.2, pref: [cx0, ay - 12] });
      }
    } else if (mount === 'wall') {
      // the back wall: a band of heights above the heads (which start at ~297) and off the oven bank; wine goes on the door's side, trophies mid-room, the helm beside the ovens
      const prefX = thing === 'wine-rack' ? right : thing === 'trophy-case' ? (left + right) / 2 : left;
      for (const ay of range(232, 296, 4)) for (const ax of range(left + 16, right - 16, 4)) cands.push({ ax, ay, k: 1, sortY: D + 1, pref: [prefX, 270] });
    } else if (mount === 'hang') {
      const ay = band.y1 + 1;
      const w = b.x1 - b.x0;
      const prefX = thing === 'chandelier' ? P(mid, D)[0] : thing === 'pennants' ? (left + right) / 2 : thing === 'net-buoys' ? left + 40 : (left + right) / 2;
      if (thing === 'pennants') cands.push({ ax: (left + right) / 2, ay, k: 1, sortY: D - 2, pref: [prefX, ay + 10] });
      else {
        // the chandelier is drawn at 0.74 so that it ends over the oven bank's rect, not in it
        const k = thing === 'chandelier' ? 0.74 : 1;
        for (const ax of range(left + (w * k) / 2 + 2, right - (w * k) / 2 - 2, 4)) cands.push({ ax, ay, k, sortY: D - 2, pref: [prefX, ay + 20] });
      }
    } else if (mount === 'floor') {
      // the dining floor: the medallion mid-room, the stools in front of the counter, the booth on the window side, the jukebox and the gumball machine toward the door
      const prefX =
        thing === 'medallion'
          ? mid
          : thing === 'stools'
            ? (lay.counter.x0 + lay.counter.x1) / 2
            : thing === 'booth'
              ? lay.L + 30
              : lay.door.x0 - (thing === 'gumball' ? 14 : 36);
      const ys = thing === 'medallion' ? [24, 32, 40, 48] : thing === 'stools' ? [54, 50, 46] : [12, 18, 26, 34, 44, 54];
      for (const y of ys)
        for (const x of range(lay.L + 14, lay.R - 14, 4)) {
          const [ax, ay] = P(x, y, 0);
          const k = kAt(y) * 1.05;
          cands.push({ ax, ay, k: thing === 'medallion' ? kAt(y) : k, sortY: thing === 'medallion' ? 200 : y, pref: [P(prefX, y)[0], ay - 10] });
        }
    } else if (mount === 'kitchen') {
      // beside the oven bank, on the kitchen floor at the back
      for (const y of [76, 84, 92, 100, 106])
        for (const x of range(ovX0 - 30, ovX1 + 30, 3)) {
          const [ax, ay] = P(x, y, 0);
          cands.push({ ax, ay, k: kAt(y) * 1.05, sortY: y, pref: [P(ovX0 - 12, y)[0], ay - 15] });
        }
    } else if (mount === 'sill') {
      // along the front window's sill, left of the door
      const [a] = P(lay.L + 8, 0);
      const [z] = P(lay.door.x0 - 12, 0);
      const [, sy] = P(0, 0, 0);
      for (const ax of range(a + b.x1, z - b.x1, 4)) cands.push({ ax, ay: sy + 6, k: 1, sortY: SILL_Y, pref: [a + 40, sy - 4] });
    } else if (mount === 'front') {
      // the front wall's right pier, beside the doorway
      const [jx] = P(lay.jamb.x1, 0);
      for (const ay of range(316, 350, 4)) cands.push({ ax: jx + b.x1 + 3, ay, k: 1, sortY: SILL_Y - 0.4, pref: [jx + 12, 330] });
    } else if (mount === 'street' && !idleShop) {
      // the pavement at the kerb: feet just above the report strip, anywhere along the front but over the mat; the pavement's open stretches win
      const [fx0] = P(lay.L, fy);
      const [fx1] = P(lay.R, fy);
      const pref = thing === 'cadillac' || thing === 'vespa' ? fx0 + 20 : thing === 'chalkboard' || thing === 'mast' ? fx1 : (fx0 + fx1) / 2;
      const [, ay] = P(0, fy, 0);
      for (const ax of range(frameL + b.x1 + 2, frameR - b.x1 - 2, 3)) cands.push({ ax, ay, k: kAt(fy) * 1.04, sortY: fy, pref: [pref, ay - 12] });
    }
    put(thing, cands);
  }
  return placed;
}

/** Every rect the renovation draws that nothing opaque may lie over a protected element with (the cover budget, protected.ts): the plaque and the decor things' places. */
export function renoCovers(lay: Layout, set: RenoShop, id: NeighborhoodId, vehicle = 1, idleShop = false): { id: string; rect: Rect }[] {
  const out: { id: string; rect: Rect }[] = [{ id: 'reno-plaque', rect: renoPlaqueRect(lay) }];
  for (const p of renoSpots(lay, set, id, vehicle, idleShop)) out.push({ id: `reno-${p.thing}`, rect: p.rect });
  return out;
}

// ---------- the fixtures that are pieces of their own ----------

/** Where the fixture pieces of renovation-props.tsx stand in this layout (draw space; the mirrored plan's, already reflected). */
export interface FixtureSpots {
  /** One brick arch per dome oven (Downtown's oven-arch): the mouth's middle, top, sill and width. */
  arches: { cx: number; top: number; bottom: number; w: number }[];
  /** The counter's front panel (the Suburbs' chrome-counter): screen x range, the chrome band's centre and the panel's foot. */
  counter: { x0: number; x1: number; bandY: number; footY: number };
  /** The rope rail along the front window (the Waterfront's rope-rail): screen x range and the feet's y. */
  rail: { x0: number; x1: number; y: number };
  /** The plank deck's room x range. */
  deck: { x0: number; x1: number };
}

export function fixtureSpots(lay: Layout): FixtureSpots {
  const arches = lay.ovens
    .filter((o) => o.chimney)
    .map((o) => {
      const { cx } = ovenFrame(o);
      const { mTop, pTop, mw } = domeGeom(o);
      return { cx, top: mTop, bottom: pTop, w: mw };
    });
  const [cx0] = P(lay.counter.x0, 64);
  const [cx1] = P(lay.counter.x1, 64);
  // the rail runs along the window left of the door in the plain plan and right of it in the mirrored one: placed by the plain plan and reflected
  const plain = plainOf(lay);
  const a = P(plain.L + 10, 0)[0];
  const b = P(plain.door.x0 - 14, 0)[0];
  const flip = 2 * lay.frame.vanishX;
  const rail = lay.mirrored ? { x0: flip - b, x1: flip - a } : { x0: a, x1: b };
  return {
    arches,
    counter: { x0: cx0, x1: cx1, bandY: P(0, 64, 35)[1], footY: P(0, 64, 0)[1] },
    rail: { ...rail, y: P(0, 0, 0)[1] + 6 },
    deck: { x0: lay.L, x1: lay.R },
  };
}

/** The depth the rope rail's rail and the sill's herb box sort at. */
export const SILL_SORT = SILL_Y - 0.2;
