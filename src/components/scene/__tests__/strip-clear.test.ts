/// <reference types="jest" />
// D514: the shop report's strip hides what stands lower on the sidewalk, so the queue is lifted above it in every layout (home, wide, mirrored), at every screen fit.
import { FOOTPRINTS } from '../../../content/tuning';
import { buildCast } from '../cast';
import { emptyCrew, routesFor } from '../crew';
import { frostTint, FROST, seatPalette } from '../palette';
import { layout } from './draw-layout';
import { P, sceneFrame } from '../projection';
import { floorYFor, liftLayout, STRIP_AIR, stripTop } from '../strip-clear';
import { STRIP } from '../../report/report-model';
import { SIDEWALK_ROW } from '../../tap-targets';

const DRIVER_SLOTS = [2, 2, 3, 3, 4];
const BOB = 0.8; // the queue's one-pixel bob (cast.ts)
const plans = [0, 1, 2, 3, 4].flatMap((fp) => [false, true].map((mirrored) => ({ fp, mirrored })));
const build = (fp: number, mirrored: boolean) => layout(fp, Math.min(fp + 1, 6), 3, 2, FOOTPRINTS[fp].maxTables, DRIVER_SLOTS[fp], 1, sceneFrame(fp), mirrored);
const feetY = (y: number) => P(0, y)[1];
// the screens the game runs on: a short or narrow phone (the fit below 1 crops the sky), the usual one, a tall one
const fits = [0.9, 0.95, 1, 1.1];

describe('the strip box (scene units)', () => {
  test('the pill is 28 pt tall over the sidewalk row, and sits lower on a bigger fit', () => {
    expect(stripTop(1, false)).toBe(590 - (SIDEWALK_ROW.raiseManaged + SIDEWALK_ROW.cardHeight + STRIP.above + STRIP.pill));
    expect(stripTop(1.1, false)).toBeGreaterThan(stripTop(0.9, false));
    expect(stripTop(1, true)).toBeLessThan(stripTop(1, false)); // the hire stack is taller
  });
  test('floorYFor inverts the projection', () => {
    for (const top of [430, 460, 490]) expect(feetY(floorYFor(top))).toBeCloseTo(top - STRIP_AIR, 6);
  });
});

describe('no queued guest overlaps the strip (D514)', () => {
  for (const { fp, mirrored } of plans) {
    for (const idle of [false, true]) {
      test(`footprint ${fp}${mirrored ? ' mirrored' : ''}${idle ? ', hire stack' : ''}: diners, drivers and their pills`, () => {
        for (const s of fits) {
          const top = stripTop(s, idle);
          const lay = liftLayout(build(fp, mirrored), floorYFor(top));
          for (const [, y] of [...lay.queue, ...lay.driverQueue]) expect(feetY(y) + BOB).toBeLessThanOrEqual(top);
          expect(feetY(lay.queueTag[1])).toBeLessThanOrEqual(top);
          expect(feetY(lay.waitTag[1])).toBeLessThanOrEqual(top);
        }
      });
    }
    test(`footprint ${fp}${mirrored ? ' mirrored' : ''}: lifting keeps each figure's screen x and the drivers' own heights`, () => {
      const plain = build(fp, mirrored);
      const lay = liftLayout(plain, floorYFor(stripTop(1, true)));
      const sx = (l: typeof plain) => (p: [number, number]) => P(p[0], p[1], 0, l.frame)[0];
      lay.queue.forEach((p, i) => expect(sx(lay)(p)).toBeCloseTo(sx(plain)(plain.queue[i]), 6));
      expect(lay.queue.length).toBe(plain.queue.length);
      lay.driverQueue.forEach((p, i) =>
        expect(P(p[0], p[1], 0, lay.frame)[0]).toBeCloseTo(P(plain.driverQueue[i][0], plain.driverQueue[i][1], 0, plain.frame)[0], 6),
      );
      const gaps = (l: typeof plain) => l.driverQueue.map(([, y]) => feetY(y) - feetY(l.driverQueue[0][1]));
      gaps(lay).forEach((g, i) => expect(g).toBeCloseTo(gaps(plain)[i], 6));
    });
  }
  test('the old layout failed: with the hire stack the standing queue was drawn behind the strip', () => {
    const plain = build(1, false);
    expect(feetY(plain.driverQueue[0][1])).toBeGreaterThan(stripTop(1, true));
    expect(feetY(plain.queue.length ? plain.queue[0][1] : plain.queueTag[1])).toBeGreaterThan(stripTop(1, true));
  });
  test('a layout that needs no lift comes back as it is (the memos on it stay warm)', () => {
    const plain = build(1, false);
    const top = stripTop(1.1, false);
    const same = liftLayout(plain, floorYFor(top));
    expect(same.queue).toBe(plain.queue);
    expect(liftLayout(same, floorYFor(top))).toBe(same);
  });
});

describe("a managed shop's walkers keep above the strip too", () => {
  for (const { fp, mirrored } of plans) {
    test(`footprint ${fp}${mirrored ? ' mirrored' : ''}: every point of every route`, () => {
      for (const s of fits) {
        const top = stripTop(s, false);
        const lay = liftLayout(build(fp, mirrored), floorYFor(top));
        const r = routesFor(lay, lay.frame.width, false, lay.patio.length);
        const pts = [...r.driver.away.pts, ...r.driver.back.pts, ...r.guests.flatMap((g) => [...g.arrive.pts, ...g.leave.pts, ...g.giveUp.pts])];
        // inside the shop the floor is far above the strip (y ≥ 0): only the sidewalk's points, which are at y < 0, are bound by it
        for (const [, y] of pts) expect(y < 0 ? feetY(y) : 0).toBeLessThanOrEqual(top);
      }
    });
  }
  test('an unlifted layout had them walking at depth -42, behind the strip (the old code)', () => {
    const lay = build(1, false);
    const r = routesFor(lay, lay.frame.width, false, 0);
    expect(Math.max(...r.guests[0].arrive.pts.map(([, y]) => feetY(Math.min(0, y))))).toBeGreaterThan(stripTop(1, false));
  });
});

describe('a waiting guest wears frost while the line is cold (D514)', () => {
  const lay = build(2, false);
  const pal = seatPalette(1, 2, 8, 8, lay.tables.length);
  const cast = (cold: boolean) =>
    buildCast({
      lay,
      shop: { drivers: 12, tables: 40, prep: 120 },
      running: true,
      pace: 1,
      clock: 3,
      shopSeed: 7,
      nIdx: 1,
      pal,
      crew: emptyCrew(),
      queue: { diners: 3, drivers: 3 },
      cold,
    }).cast.filter((c) => c.role === 'queue');
  test('the mix is a tint toward ice, and no tint at 0', () => {
    expect(frostTint('#D9443A', 0)).toBe('#d9443a');
    expect(frostTint('#000000', 1)).toBe(FROST.toLowerCase());
    expect(frostTint('#D9443A')).not.toBe('#D9443A');
  });
  test('every queued diner and driver is tinted when cold, none when it is not', () => {
    const cold = cast(true);
    const warm = cast(false);
    expect(cold.length).toBeGreaterThan(0);
    expect(cold.length).toBe(warm.length);
    cold.forEach((c, i) => {
      if (c.props.kind === 'guest') {
        expect(c.props.shirt).toBe(frostTint(warm[i].props.shirt!));
        expect(c.props.hair).toBe(frostTint(warm[i].props.hair!));
      } else expect(c.props.cap).toBe(frostTint(warm[i].props.cap!));
      expect(c.props.cap === warm[i].props.cap && c.props.shirt === warm[i].props.shirt).toBe(false);
    });
  });
});
