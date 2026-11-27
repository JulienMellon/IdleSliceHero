/// <reference types="jest" />
// The v5.24 looks (cards S4 and S5): all six sets and the generic small looks. Every look has art, every worn look reaches the furniture memo, and the new props
// (the tip jar, the door chime, the table cloths) stand clear of the stations, the heads, the badges, the WELCOME mat and the coach targets in every city, neighbourhood,
// footprint and plan. The jar and the chime are also fixed covers in protected.ts, so the protected-element test guards them against the mat, the door and the faces too.
import { CITIES, hoodIds } from '../../../content/cities';
import { LOOKS as CATALOG, SETS, setLooks } from '../../../content/catalog';
import * as G from '../../../engine/game';
import { dressFor } from '../../../engine/vanity';
import { coachRects } from '../coach-rects';
import { SKINS, dressOf, dressedLook, isDressed, scooterKey } from '../cosmetics';
import { furnitureDeps, furnitureInputs, type FurnitureSource } from '../furniture-inputs';
import { LOOKS } from '../identity';
import { badgeBand, candidates, doorRect, fixedPeople, hits, matRect, spotBoxes } from '../ladder';
import { CALM_MAX, pileRect, pileSpots } from '../piles';
import {
  APRONS,
  AWNING_LOOKS,
  CHIMES,
  CHIME_H,
  CHIME_Z,
  CHIME_W,
  CLOTHS,
  COUNTERS,
  FACADE_THEMES,
  JARS,
  JAR_H,
  JAR_W,
  MENUS,
  OVEN_LOOKS,
  S4_LOOKS,
  S5_LOOKS,
  SIGN_BOARDS,
  chimeSpot,
  hasArt,
  signShapeOf,
  tipJarSpot,
  variantOfLook,
} from '../look-art';
import { GENERIC, SET_BRICK, SET_CLASSIC, SET_DINER, SET_DOCKSIDE, SET_DORM, SET_MARBLE } from '../palette';
import { COVER_MAX, coveredShare } from '../protected';
import { P, kAt } from '../projection';
import { shopLayout } from '../shop-layout';
import { doorwaySignRect, stationRects, type Rect } from '../stations';
import { plaqueRect } from '../cosmetics';
import { SEAT } from '../layout';
import { flipRect, plainOf } from '../layout-space';

const MINE = ['classic', 'diner', 'dockside'];
const mineSet = CATALOG.filter((l) => l.set === null || MINE.includes(l.set));

describe('every look of the card has art', () => {
  test('the sets and the generic small looks are all drawn: 12 set pieces and the 11 new generic looks', () => {
    const sets = MINE.flatMap((s) => setLooks(s as (typeof SETS)[number]['id']).map((l) => l.id));
    expect(sets).toHaveLength(12);
    for (const id of sets) expect(hasArt(id)).toBe(true);
    const generic = CATALOG.filter(
      (l) =>
        l.set === null && !['oven-gold', 'storefront-skin', 'oven-woodfired', 'scooter-mint', 'neon-counter', 'awning-gold', 'plaque-master'].includes(l.id),
    );
    expect(generic).toHaveLength(11);
    for (const l of generic) expect(hasArt(l.id)).toBe(true);
    expect(S4_LOOKS).toHaveLength(23);
  });
  test('the University, Industrial and Uptown sets are drawn too (card S5): 12 pieces, none claimed twice', () => {
    const theirs = CATALOG.filter((x) => x.set && !MINE.includes(x.set));
    expect(theirs).toHaveLength(12);
    for (const l of theirs) expect(hasArt(l.id)).toBe(true);
    expect([...S5_LOOKS].sort()).toEqual(theirs.map((l) => l.id).sort());
    expect(S4_LOOKS.some((id) => S5_LOOKS.includes(id))).toBe(false);
  });
  test('the oven set piece is its own dress field and wins nothing over a skin', () => {
    expect(dressOf(['oven-brick']).ovenSet).toBe('brick');
    expect(dressOf(['oven-brick']).ovenSkin).toBe(0);
    expect(Object.keys(OVEN_LOOKS)).toEqual(['brick']);
  });
  test('worn, each look dresses exactly one thing, and unknown variants dress nothing', () => {
    for (const id of [...S4_LOOKS, ...S5_LOOKS]) {
      const d = dressOf([id]);
      expect(isDressed(d)).toBe(true);
      const part = CATALOG.find((l) => l.id === id)!.part;
      const set = Object.entries(d).filter(([, v]) => v === variantOfLook(id));
      expect(set.length).toBe(1);
      expect(part).toBeTruthy();
    }
    expect(isDressed(dressOf(['awning-nonesuch']))).toBe(false);
  });
  test('a theme paints the facade, the fascia and the sign; the three themes differ from each other and from the neighbourhoods', () => {
    const themes = Object.values(FACADE_THEMES);
    expect(themes).toHaveLength(6);
    expect(new Set(themes.map((t) => t.fascia)).size).toBe(6);
    expect(new Set(themes.map((t) => t.pilaster)).size).toBe(6);
    expect(new Set(themes.map((t) => t.sign)).size).toBe(6);
    for (const t of themes) {
      expect(Object.values(LOOKS).some((l) => l.pilaster === t.pilaster)).toBe(false);
      expect(SKINS.some((s) => s.pilaster === t.pilaster)).toBe(false);
    }
    for (const [id, k] of [
      ['facade-classic', 'classic'],
      ['facade-diner', 'diner'],
      ['facade-dockside', 'dockside'],
      ['facade-dorm', 'dorm'],
      ['facade-brick', 'brick'],
      ['facade-marble', 'marble'],
    ] as const) {
      const look = dressedLook(LOOKS.downtown, dressOf([id]));
      expect(look.pilaster).toBe(FACADE_THEMES[k].pilaster);
      expect(look.fascia).toBe(FACADE_THEMES[k].fascia);
      expect(look.theme).toBe(FACADE_THEMES[k]);
    }
    expect(dressedLook(LOOKS.downtown, dressOf([])).theme).toBeNull();
  });
  test('an awning look repaints the stripes over the theme and the gold one; the neighbourhood keeps its shape', () => {
    const base = LOOKS.suburbs;
    for (const k of Object.keys(AWNING_LOOKS)) {
      const l = dressedLook(base, dressOf([`awning-${k}`, 'awning-gold']));
      expect(l.awning).toEqual([AWNING_LOOKS[k].main, AWNING_LOOKS[k].alt]);
      expect(l.piping).toBe(AWNING_LOOKS[k].piping);
      expect(l.shape).toBe(base.shape);
    }
  });
  test("the sign takes the Dockside plank, else its storefront theme's shape, else the plain board", () => {
    expect(signShapeOf('', '')).toBe('board');
    expect(signShapeOf('classic', '')).toBe('cartouche');
    expect(signShapeOf('diner', '')).toBe('pill');
    expect(signShapeOf('dockside', '')).toBe('rope');
    expect(signShapeOf('dockside', 'dockside')).toBe('plank');
    expect(signShapeOf('', 'dockside')).toBe('plank');
    expect(signShapeOf('dorm', '')).toBe('pennant');
    expect(signShapeOf('brick', '')).toBe('plate');
    expect(signShapeOf('marble', '')).toBe('engraved');
    expect(Object.keys(SIGN_BOARDS).sort()).toEqual(['cartouche', 'engraved', 'pennant', 'pill', 'plank', 'plate', 'rope']);
  });
  test('the red scooter and the mint one are different paints; mint wins when both are on', () => {
    expect(scooterKey(dressOf([]))).toBe('');
    expect(scooterKey(dressOf(['scooter-red']))).toBe('red');
    expect(scooterKey(dressOf(['scooter-mint']))).toBe('mint');
    expect(scooterKey(dressOf(['scooter-dorm']))).toBe('dorm');
    expect(scooterKey({ scooterMint: true, scooterSet: 'dorm' })).toBe('mint');
    expect(scooterKey({ scooterMint: false, scooterSet: 'nonesuch' })).toBe('');
    expect(scooterKey({ scooterMint: true, scooterSet: 'red' })).toBe('mint');
  });
  test('the tables hold every variant the catalog names, and each set reads as one family of colours', () => {
    expect(Object.keys(APRONS)).toEqual(expect.arrayContaining(['classic', 'checkered', 'striped', 'brick']));
    expect(Object.keys(CLOTHS).sort()).toEqual(['diner', 'dorm', 'gingham', 'linen', 'marble']);
    expect(Object.keys(JARS).sort()).toEqual(['brass', 'diner', 'dockside', 'glass', 'marble']);
    expect(Object.keys(CHIMES).sort()).toEqual(['bell', 'brick', 'dockside', 'wind']);
    expect(Object.keys(MENUS).sort()).toEqual(['chalkboard', 'classic', 'dorm']);
    expect(Object.keys(COUNTERS)).toEqual(['diner']);
    expect(FACADE_THEMES.classic.plinth).toBe(SET_CLASSIC.green);
    expect(FACADE_THEMES.diner.fascia).toBe(SET_DINER.redDark);
    expect(FACADE_THEMES.dockside.fascia).toBe(SET_DOCKSIDE.deep);
    expect(FACADE_THEMES.dorm.plinth).toBe(SET_DORM.ivy);
    expect(FACADE_THEMES.brick.fascia).toBe(SET_BRICK.steelDark);
    expect(FACADE_THEMES.marble.fascia).toBe(SET_MARBLE.black);
    expect(AWNING_LOOKS.marble.piping).toBe(SET_MARBLE.gilt);
    expect(OVEN_LOOKS.brick.base).toBe(SET_BRICK.oven);
    expect(GENERIC.scooterRed).not.toBe('#FFC531');
  });
});

describe('shops dress from dressFor', () => {
  const g = (worn: string[]) => {
    const base = G.newGame(0);
    return { rewards: { ...base.rewards, cosmetics: worn, worn } };
  };
  test('a set piece shows in its own shop only, and beats the generic look of its part there', () => {
    const worn = ['awning-classic', 'awning-candy', 'apron-striped', 'tipjar-dockside'];
    expect(dressOf(dressFor(g(worn), 'downtown')).awningSet).toBe('classic');
    expect(dressOf(dressFor(g(worn), 'suburbs')).awningSet).toBe('candy');
    expect(dressOf(dressFor(g(worn), 'downtown')).apron).toBe('striped');
    expect(dressOf(dressFor(g(worn), 'downtown')).tipjar).toBe('');
    expect(dressOf(dressFor(g(worn), 'waterfront')).tipjar).toBe('dockside');
  });
});

describe('the furniture memo sees every look', () => {
  const src = (worn: string[]): FurnitureSource => ({
    id: 'downtown',
    name: 'Downtown',
    shop: { footprint: 1, prep: 24, counter: 1, drivers: 1, managed: true, line: { prepped: 0 }, decor: { plants: 1, tables: 1, signage: 1 } },
    running: true,
    rate: 4,
    vehicle: 1,
    worn,
    first: true,
  });
  const deps = (worn: string[]) => JSON.stringify(furnitureDeps(furnitureInputs(src(worn))));
  test('each look changes the deps; the deps keep their length', () => {
    const d0 = deps([]);
    for (const id of [...S4_LOOKS, ...S5_LOOKS]) expect(deps([id])).not.toBe(d0);
    expect(furnitureDeps(furnitureInputs(src([])))).toHaveLength(furnitureDeps(furnitureInputs(src([...S4_LOOKS, ...S5_LOOKS]))).length);
    // the Starter Pack's awning is absent from the dress until worn, yet the deps keep their length (React warns when a memo's deps change size)
    expect(furnitureDeps(furnitureInputs(src([])))).toHaveLength(furnitureDeps(furnitureInputs(src(['awning-founder']))).length);
  });
});

// ---------- the budget ----------

const shopAt = (footprint: number): G.Shop => ({ ...G.newShop(true), footprint, ovens: 100, prep: 100, counter: 100, tables: 100 });
interface Case {
  name: string;
  id: string;
  lay: ReturnType<typeof shopLayout>['draw'];
}
const cases: Case[] = [];
for (const city of Object.values(CITIES))
  for (const id of hoodIds(city))
    for (let fp = 0; fp < city.fit.footprints.length; fp++) {
      const { room, draw } = shopLayout(id, shopAt(fp), city);
      cases.push({ name: `${city.id} ${id} footprint ${fp}${room.mirrored ? ' mirrored' : ''}`, id, lay: draw });
    }

/** What a new prop must clear: the badges, the mat, the doorway plank, every standing head (cooks, bakers, counter staff, order spots, seated diners), the pickup spots' drivers, the other stations and the coach targets. */
function clearOf(lay: Case['lay'], id: string, r: Rect, own: 'counter' | 'door', depth: number): string[] {
  const bad: string[] = [];
  const check = (name: string, o: Rect) => hits(r, o) && bad.push(name);
  check('badges', badgeBand(lay));
  check('mat', matRect(lay));
  // (the chime's hook is behind the plank and the lintel: they are drawn over it)
  if (own !== 'door') check('doorway plank', doorwaySignRect(lay));
  // a prop is drawn at depth `depth`: the people standing nearer than that are drawn over it (an order spot in front of the counter), the ones deeper are what it must not cover
  fixedPeople(lay).forEach((p, i) => p.y > depth && check(`head ${i}`, p.head));
  spotBoxes(lay).forEach((b, i) => check(`pickup spot ${i}`, b));
  const st = stationRects(lay, 44);
  check('prep station', st.prep);
  check('oven station', st.oven);
  if (own !== 'counter') check('counter station', st.counter);
  const coach = coachRects(lay, { s: 1, ox: 0, oy: 0 }, 0, { x: lay.frame.x0, y: 0 });
  for (const [k, c] of Object.entries(coach)) {
    if (own === 'counter' && (k === 'station:counter' || k === 'dial:counter')) continue;
    check(`coach ${k}`, c);
  }
  void id;
  return bad;
}

describe('the tip jar stands clear (budget)', () => {
  test.each(cases.map((c) => [c.name, c] as const))('%s', (_n, c) => {
    const { rect: r, x } = tipJarSpot(c.lay);
    expect(r.x1 - r.x0).toBeCloseTo(JAR_W);
    expect(r.y1 - r.y0).toBeGreaterThanOrEqual(JAR_H);
    // on the counter's front panel, on screen
    const x0 = P(c.lay.counter.x0, 64)[0];
    const x1 = P(c.lay.counter.x1, 64)[0];
    expect(x).toBeGreaterThan(x0);
    expect(x).toBeLessThan(x1);
    expect(r.x0).toBeGreaterThanOrEqual(c.lay.frame.x0);
    // at the counter's far end from the door
    const door = (P(c.lay.door.x0, 0)[0] + P(c.lay.door.x1, 0)[0]) / 2;
    expect(Math.abs(x - door)).toBeGreaterThan(Math.abs((x0 + x1) / 2 - door));
    expect(clearOf(c.lay, c.id, r, 'counter', 64)).toEqual([]);
    // and it is seen: nobody who stands in a fixed place (the order spots in front of the counter, the cooks, the staff, the diners) is drawn over any of it (the staff behind the counter are hidden by it to the chest anyway)
    fixedPeople(c.lay).forEach((p, i) => p.y < 64 && expect([i, hits(r, p.box)]).toEqual([i, false]));
  });
  test('it clears the register, the counter gear of the ladder and the boxes; the pickup bags (a symptom, drawn over it) leave most of it showing', () => {
    for (const c of cases) {
      const jar = tipJarSpot(c.lay).rect;
      // the register stands on the counter's top at the first cashier's place
      const [rx, ry] = P(c.lay.staff[0] + 12, 70, 38);
      const k = kAt(70) * 1.1;
      expect([c.name, 'register', hits(jar, { x0: rx - 11 * k, x1: rx + 11 * k, y0: ry - 22 * k, y1: ry })]).toEqual([c.name, 'register', false]);
      // (the ladder places by the plain plan and flips the mirrored one's places)
      for (const p of candidates(plainOf(c.lay), { id: c.id as never, pins: 12, outside: true, vehicle: 1 }).filter((x) => x.mount === 'counter'))
        expect([c.name, p.id, hits(jar, c.lay.mirrored ? flipRect(p.rect, 2 * c.lay.frame.vanishX) : p.rect)]).toEqual([c.name, p.id, false]);
      const spots = pileSpots(c.lay, c.id as never);
      // the calm piles (up to CALM_MAX): the boxes never touch the jar, the bags cover less than 70% of it
      if (spots.boxes) expect([c.name, 'boxes', coveredShare(jar, pileRect(spots.boxes, CALM_MAX))]).toEqual([c.name, 'boxes', 0]);
      if (spots.bags) expect(coveredShare(jar, pileRect(spots.bags, CALM_MAX))).toBeLessThan(0.7);
    }
  });
});

describe('the door chime stands clear (budget)', () => {
  test.each(cases.map((c) => [c.name, c] as const))('%s', (_n, c) => {
    const { rect: r } = chimeSpot(c.lay);
    expect(r.x1 - r.x0).toBeCloseTo(CHIME_W);
    expect(r.y1 - r.y0).toBeCloseTo(CHIME_H);
    const bad = clearOf(c.lay, c.id, r, 'door', 0);
    expect(bad).toEqual([]);
    // it hangs in the doorway: a sliver of the entrance (the door's protected rect), never a tenth of it, and clear of the plaque on the header
    expect(coveredShare(doorRect(c.lay), r)).toBeLessThan(COVER_MAX);
    expect(hits(r, plaqueRect(c.lay))).toBe(false);
    // above head height: under the lintel (108 up), over the people who walk in (heads 60 up at most)
    expect(r.y0).toBeCloseTo(P(0, 0, CHIME_Z)[1], 0);
    // and its foot is 8 pt or more above where it hung before (D579: it sat on the cap of the driver at the door)
    expect(r.y1).toBeLessThanOrEqual(P(0, 0, 108)[1] + 14);
  });
});

describe('the table cloths stay inside the table (budget)', () => {
  test.each(cases.map((c) => [c.name, c] as const))('%s', (_n, c) => {
    for (const tb of c.lay.tables) {
      const [cx, cy] = P(tb.x, tb.y);
      const k = kAt(tb.y) * 1.1;
      const cloth: Rect = { x0: cx - 14.6 * k, x1: cx + 14.6 * k, y0: cy - 21.2 * k, y1: cy - 6 * k };
      for (const side of [-1, 1]) {
        const seat = fixedPeople(c.lay).find((p) => Math.abs((p.box.x0 + p.box.x1) / 2 - P(tb.x + side * SEAT, tb.y)[0]) < 0.01 && p.y === tb.y);
        expect(seat).toBeDefined();
        expect(hits(cloth, seat!.head)).toBe(false);
      }
    }
  });
});
