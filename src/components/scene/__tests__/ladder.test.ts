/// <reference types="jest" />
// The visual ladder's budgets (v5.11, D2): at every footprint no ladder prop covers a badge, a head, the doorway, the
// mat, the doorway plank, the menu, the window, the oven bank or a pickup spot, and none sits in another station's tap area.
// Checked here from the pure modules (layout, stations, projection) only, independently of ladder.ts's own placement test.
import { FOOTPRINTS, HEADS, NEIGHBORHOODS, TUNING } from '../../../content/tuning';
import { levelCap } from '../../../engine/game';
import {
  BOUNCE_SECONDS, BOUNCE_STEPS, CONFETTI, CONFETTI_FRAMES, CONFETTI_N, CONFETTI_OPACITY, CONFETTI_SECONDS, LADDER_LEVELS, MILESTONE_LINES, STEPS,
  bounceStep, bounceTransforms, candidates, clearPillX, confettiStep, crossedMilestone, ladderProps, ladderStep, milestoneSpeaker, wallRects,
  type LadderInput, type Placed, type PropId,
} from '../ladder';
import { ladderInput, furnitureInputs, furnitureDeps, type FurnitureSource } from '../furniture-inputs';
import { SEAT, layout, type Layout } from '../layout';
import { D, P, kAt } from '../projection';
import { BADGE_R, badgeRowY, badgeXs, doorwaySignRect, stationRects, type Rect } from '../stations';

const DRIVER_SLOTS = [2, 2, 3, 3, 4];
type Box = Rect;
const hit = (a: Box, b: Box) => a.x0 < b.x1 && a.x1 > b.x0 && a.y0 < b.y1 && a.y1 > b.y0;

/** A busy shop at footprint fp, with the crew its levels bring: 3 cooks, 2 cashiers, the footprint's ovens, a full dining room. */
function shop(fp: number) {
  return layout(fp, FOOTPRINTS[fp].ovenSlots, 3, 2, 8, DRIVER_SLOTS[fp], 1);
}
/** What each footprint can reach: levels up to the cap (25 per tier). */
const capStep = (fp: number) => ladderStep(levelCap({ footprint: fp } as never));
const IDS = ['downtown', 'waterfront', 'uptown'] as const;
const input = (fp: number, over: Partial<LadderInput> = {}): LadderInput => ({ id: 'downtown', prepStep: capStep(fp), counterStep: capStep(fp), driverStep: capStep(fp), pins: 12, vehicle: 2, outside: true, ...over });
/** Every step on (also levels no footprint reaches, to check the budget holds even for a save that is past its cap). */
const FULL: Partial<LadderInput> = { prepStep: 8, counterStep: 8, driverStep: 8 };

const person = (x: number, y: number, h = 52): { y: number; head: Box } => {
  const [sx, sy] = P(x, y);
  const k = kAt(y) * 1.14;
  return { y, head: { x0: sx - 11 * k, x1: sx + 11 * k, y0: sy - h * k, y1: sy - h * k + h * k * 0.4 } };
};
const fullBox = (x: number, y: number): Box => {
  const [sx, sy] = P(x, y);
  const k = kAt(y) * 1.14;
  return { x0: sx - 11 * k, x1: sx + 11 * k, y0: sy - 52 * k, y1: sy };
};

/** Everything a prop breaks if it lands on it, listed by name; empty when it fits. Built from layout / stations / projection only. */
function violations(p: Placed, lay: Layout, id: string = 'downtown'): string[] {
  const out: string[] = [];
  const r = p.rect;
  const xs = badgeXs(lay);
  const by = badgeRowY();
  if (hit(r, { x0: xs.prep - BADGE_R - 8, y0: by - 15, x1: xs.counter + BADGE_R + 40, y1: by + 15 })) out.push('badge band');
  if (hit(r, doorwaySignRect(lay))) out.push('doorway plank');
  // the entrance on the front plane: jambs to the right pilaster, shop window (z 196) to the floor
  if (hit(r, { x0: P(lay.door.x0 - 8, 0)[0], x1: P(lay.R - 8, 0)[0], y0: P(0, 0, 196)[1], y1: P(0, 0)[1] })) out.push('door');
  const mat = [P(lay.door.x0 + 2, -8), P(lay.door.x1 - 2, -8), P(lay.door.x1 + 1, -22), P(lay.door.x0 - 1, -22)];
  if (hit(r, { x0: Math.min(...mat.map((m) => m[0])), x1: Math.max(...mat.map((m) => m[0])), y0: Math.min(...mat.map((m) => m[1])), y1: Math.max(...mat.map((m) => m[1])) })) out.push('mat');
  lay.spots.forEach((s, i) => {
    if (hit(r, fullBox(s.x, s.y))) out.push(`pickup spot ${i}`);
  });
  const rects = stationRects(lay, 44);
  const own = p.station === 'drivers' ? null : p.station;
  for (const st of ['prep', 'oven', 'counter'] as const) if (st !== own && hit(r, rects[st])) out.push(`${st} tap area`);
  // heads of everyone standing deeper than the prop (they would be covered by it)
  if (p.mount !== 'wall' && p.mount !== 'street') {
    const cookY = lay.cooks.length === 1 ? 74 : 92;
    const people = [
      ...lay.cooks.map((x, i) => person(x, cookY + (i % 2) * 8, 56)),
      ...lay.bakers.map((b) => person(b.x, b.y, 56)),
      ...lay.staff.map((x) => person(x, 92)),
      ...lay.orderSpots.map(([x, y]) => person(x, y)),
      ...lay.tables.flatMap((t) => [person(t.x - SEAT, t.y, 40), person(t.x + SEAT, t.y, 40)]),
    ];
    for (const q of people) if (q.y > p.sortY && hit(r, q.head)) out.push('a head');
  }
  if (p.mount === 'wall') {
    const [wx, wy] = P(lay.counter.x1 - 50, D, 132);
    if (hit(r, { x0: wx - 3, y0: wy - 6, x1: wx + 43, y1: wy + (id === 'waterfront' ? 78 : id === 'uptown' ? 61.5 : 38) })) out.push('window');
    // the menu board (room.tsx): between the oven hood and the brick pier, 40 × 56 scaled
    if (lay.fp >= 1) {
      const [mx0, my] = P(lay.counter.x0 + 4, D, 180);
      const hoodRight = P(lay.ovenCols[lay.ovenCols.length - 1].x1 + 6, D - 6)[0];
      const pierLeft = P(lay.door.x0 - 8, 0)[0];
      const mw = Math.max(40, Math.min(56, pierLeft - 6 - (hoodRight + 6)));
      const mx = Math.min(Math.max(mx0 - 24, hoodRight + 6), pierLeft - 6 - mw);
      if (hit(r, { x0: mx, y0: my, x1: mx + mw, y1: my + (40 * mw) / 56 })) out.push('menu');
    }
    const ov0 = P(lay.ovenCols[0].x0, D - 6)[0];
    const ov1 = P(lay.ovenCols[lay.ovenCols.length - 1].x1, D - 6)[0];
    if (r.x1 > ov0 && r.x0 < ov1) out.push('oven bank');
    // heads are never below a wall prop's bottom edge by less than a few units (station rects start at 295)
    if (r.y1 > 296.5) out.push('into the staff');
  }
  return out;
}

describe('ladder budget', () => {
  test('at every footprint, with every step on, no prop breaks a budget', () => {
    const bad: string[] = [];
    for (let fp = 0; fp < 5; fp++) {
      const lay = shop(fp);
      for (const id of IDS)
        for (const p of ladderProps(lay, input(fp, { ...FULL, id }))) {
          const v = violations(p, lay, id);
          if (v.length) bad.push(`fp${fp} ${id} ${p.id}: ${v.join(', ')}`);
        }
    }
    expect(bad).toEqual([]);
  });

  test('also with one cook and one cashier, and the reachable steps only', () => {
    const bad: string[] = [];
    for (let fp = 0; fp < 5; fp++) {
      for (const [cooks, staff] of [[1, 1], [2, 2], [3, 2]]) {
        const lay = layout(fp, 1, cooks, staff, 1, DRIVER_SLOTS[fp], 0);
        for (const id of IDS)
          for (const p of ladderProps(lay, input(fp, { id }))) {
            const v = violations(p, lay, id);
            if (v.length) bad.push(`fp${fp} c${cooks}s${staff} ${id} ${p.id}: ${v.join(', ')}`);
          }
      }
    }
    expect(bad).toEqual([]);
  });

  test('the checker can fail: a prop on the badge rail, on the door or on a pickup spot is caught', () => {
    const lay = shop(2);
    const [spot] = lay.spots;
    const [sx, sy] = P(spot.x, spot.y);
    const base: Placed = { id: 'board', station: 'drivers', mount: 'wall', ax: 0, ay: 0, k: 1, sortY: D + 1, n: 0, rect: { x0: 0, y0: 0, x1: 10, y1: 10 } };
    expect(violations({ ...base, rect: { x0: badgeXs(lay).oven - 5, y0: badgeRowY() - 5, x1: badgeXs(lay).oven + 5, y1: badgeRowY() + 5 } }, lay)).toContain('badge band');
    expect(violations({ ...base, rect: { x0: P(lay.door.cx, 0)[0] - 5, y0: 400, x1: P(lay.door.cx, 0)[0] + 5, y1: 420 } }, lay)).toContain('door');
    expect(violations({ ...base, rect: { x0: sx - 5, y0: sy - 20, x1: sx + 5, y1: sy - 10 } }, lay)).toContain('pickup spot 0');
  });

  // each footprint's reachable levels decide which steps can show; where the room is too tight a prop is skipped
  // Waterfront: the porthole's net hangs to the staff's heads, so the belt along the counter wall (Lv 120) is skipped there.
  const SKIPPED: Record<string, PropId[]> = { 'waterfront:4': ['passBelt'] };
  test('every reachable step shows at its footprint, except the listed skips', () => {
    const missing: Record<string, PropId[]> = {};
    for (let fp = 0; fp < 5; fp++) {
      const lay = shop(fp);
      for (const id of IDS) {
        const inp = input(fp, { id });
        const want = STEPS.filter((s) => s.mount !== 'street' || inp.outside).filter((s) => {
          const st = s.station === 'prep' ? inp.prepStep : s.station === 'counter' ? inp.counterStep : inp.driverStep;
          return st > LADDER_LEVELS.indexOf(s.level as (typeof LADDER_LEVELS)[number]);
        });
        const got = new Set(ladderProps(lay, inp).map((p) => p.id));
        const lost = want.filter((s) => !got.has(s.id)).map((s) => s.id);
        if (lost.length) missing[`${id}:${fp}`] = lost;
      }
    }
    expect(missing).toEqual(SKIPPED);
  });

  test('no two candidates overlap each other', () => {
    for (let fp = 0; fp < 5; fp++) {
      const cs = candidates(shop(fp), { id: 'downtown', pins: 12, outside: true }).filter((c) => c.ok && c.id !== 'wrap');
      for (let i = 0; i < cs.length; i++)
        for (let j = i + 1; j < cs.length; j++) expect([fp, cs[i].id, cs[j].id, hit(cs[i].rect, cs[j].rect)]).toEqual([fp, cs[i].id, cs[j].id, false]);
    }
  });

  test('a step shows from its level and not before; idle shops keep the street clear', () => {
    const lay = shop(3);
    const ids = (prepStep: number, over: Partial<LadderInput> = {}) => ladderProps(lay, { ...input(3), prepStep, counterStep: 0, driverStep: 0, ...over }).map((p) => p.id);
    expect(ids(0)).toEqual([]);
    expect(ids(ladderStep(9))).toEqual([]);
    expect(ids(ladderStep(10))).toEqual(['pin2']);
    expect(ids(ladderStep(20))).toEqual(['pin2', 'sacks']);
    expect(ids(ladderStep(60))).toEqual(['pin2', 'sacks', 'sheeter', 'mixer']);
    expect(ids(0, { driverStep: 8, outside: false })).not.toContain('vehicle2');
    expect(ids(0, { driverStep: 8, outside: true })).toEqual(expect.arrayContaining(['vehicle2', 'wrap']));
  });

  test('the dispatch board carries one pin per driver, up to twelve', () => {
    const lay = shop(3);
    const pins = (n: number) => ladderProps(lay, { ...input(3), pins: n }).find((p) => p.id === 'board')!.n;
    expect(pins(1)).toBe(1);
    expect(pins(12)).toBe(12);
  });

  test('the ladder uses the existing steps: 3rd cook, 2nd cashier, gold hats are not drawn again', () => {
    const levels = (st: 'prep' | 'counter') => STEPS.filter((s) => s.station === st).map((s) => s.level);
    expect(levels('prep')).not.toContain(30);
    expect(levels('prep')).not.toContain(100);
    expect(levels('counter')).not.toContain(20);
  });

  test('wall rects are returned for pill clearance', () => {
    const placed = ladderProps(shop(3), input(3, FULL));
    expect(wallRects(placed).length).toBe(placed.filter((p) => p.mount === 'wall').length);
  });
});

describe('pill clearance (D406)', () => {
  const menu: Rect = { x0: 200, y0: 188, x1: 256, y1: 228 };
  test('a pill that would cross the menu moves clear of it, and stays on screen', () => {
    const x = clearPillX(228, 100, 196, 214, [menu]);
    expect(x - 50 >= menu.x1 || x + 50 <= menu.x0).toBe(true);
    expect(x - 50).toBeGreaterThanOrEqual(4);
  });
  test('a pill in the clear stays where it was', () => {
    expect(clearPillX(120, 90, 196, 214, [menu])).toBe(120);
  });
  test('a pill is kept inside the screen', () => {
    expect(clearPillX(-30, 100, 196, 214, [])).toBe(54);
    expect(clearPillX(900, 100, 196, 214, [])).toBe(393 - 54);
  });
});

describe('per-buy bounce', () => {
  test('lasts 0.6 s, 1 → 1.06 → 1', () => {
    expect(bounceStep(-0.1)).toBe(-1);
    expect(bounceStep(0)).toBe(0);
    expect(bounceStep(BOUNCE_SECONDS - 0.01)).toBe(BOUNCE_STEPS - 1);
    expect(bounceStep(BOUNCE_SECONDS)).toBe(-1);
    const t = bounceTransforms([100, 200]);
    expect(t).toHaveLength(BOUNCE_STEPS);
    const scales = t.map((s) => Number(/scale\(([\d.]+)\)/.exec(s)![1]));
    expect(Math.max(...scales)).toBeLessThanOrEqual(1.06);
    expect(Math.max(...scales)).toBeGreaterThan(1.055);
    expect(scales[0]).toBeLessThan(1.03);
    expect(scales[BOUNCE_STEPS - 1]).toBeLessThan(1.03);
  });
});

describe('milestone moments', () => {
  test('every station has a line per milestone, at most 30 characters, none repeated', () => {
    const all: string[] = [];
    for (const st of ['prep', 'oven', 'counter'] as const)
      for (const m of TUNING.milestones) {
        const line = MILESTONE_LINES[st][m];
        expect(line).toBeTruthy();
        expect(line.length).toBeLessThanOrEqual(30);
        all.push(line);
      }
    expect(new Set(all).size).toBe(all.length);
  });
  test('with the head’s name in front, the bubble still fits a line', () => {
    for (const id of NEIGHBORHOODS.map((n) => n.id))
      for (const st of ['prep', 'oven', 'counter'] as const)
        for (const m of TUNING.milestones) expect(`${HEADS[id][st]}: ${MILESTONE_LINES[st][m]}`.length).toBeLessThanOrEqual(42);
  });
  test('the speaker is the head if hired, Nonna in Downtown otherwise, nobody elsewhere', () => {
    expect(milestoneSpeaker(true, 'Marco', true)).toBe('Marco');
    expect(milestoneSpeaker(false, 'Finn', true)).toBe('Nonna');
    expect(milestoneSpeaker(false, 'Finn', false)).toBeNull();
  });
  test('only a level that crosses 25 / 50 / 100 is a milestone; a jump reports the highest', () => {
    expect(crossedMilestone(24, 25)).toBe(25);
    expect(crossedMilestone(25, 26)).toBeNull();
    expect(crossedMilestone(20, 60)).toBe(50);
    expect(crossedMilestone(1, 120)).toBe(100);
  });
  test('the confetti is 14 seeded pieces over 1.5 s, precomputed per step', () => {
    expect(CONFETTI).toHaveLength(CONFETTI_N);
    expect(CONFETTI_N).toBe(14);
    expect(CONFETTI_FRAMES.every((f) => f.length === CONFETTI_N)).toBe(true);
    expect(CONFETTI_OPACITY).toHaveLength(CONFETTI_FRAMES.length);
    expect(confettiStep(-0.1)).toBe(-1);
    expect(confettiStep(0)).toBe(0);
    expect(confettiStep(CONFETTI_SECONDS)).toBe(-1);
    expect(CONFETTI_OPACITY[CONFETTI_OPACITY.length - 1]).toBeLessThan(0.5);
  });
});

describe('ladder inputs on the furniture memo', () => {
  const src = (over: Partial<FurnitureSource['shop']> = {}): FurnitureSource => ({
    id: 'suburbs', name: 'Suburbs', running: true, rate: 4, vehicle: 1,
    shop: { footprint: 2, prep: 1, counter: 1, drivers: 1, managed: true, line: { prepped: 0 }, decor: { plants: 0, tables: 0, signage: 0 }, ...over },
  });
  const deps = (o: Partial<FurnitureSource['shop']>) => JSON.stringify(furnitureDeps(furnitureInputs(src(o))));
  test('a level that crosses a ladder step changes the memo; one inside a step does not', () => {
    expect(deps({ counter: 10 })).not.toBe(deps({ counter: 9 }));
    expect(deps({ drivers: 20 })).not.toBe(deps({ drivers: 19 }));
    expect(deps({ prep: 40 })).not.toBe(deps({ prep: 39 }));
    expect(deps({ counter: 12, prep: 1 })).toBe(deps({ counter: 11, prep: 1 }));
  });
  test('the dispatch board gets one pin per driver, capped at twelve; idle shops keep the street clear', () => {
    expect(furnitureInputs(src({ drivers: 30 })).pins).toBe(12);
    expect(furnitureInputs(src({ drivers: 5 })).pins).toBe(5);
    expect(ladderInput(furnitureInputs(src())).outside).toBe(true);
    expect(ladderInput(furnitureInputs(src({ managed: false }))).outside).toBe(false);
  });
});
