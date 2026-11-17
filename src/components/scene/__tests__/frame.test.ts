/// <reference types="jest" />
// v5.18 card V1: the shop's width as data. Every footprint still asks for one screen, so nothing changes today; these tests prove the frame,
// the scroll rules and that a layout built in a wider frame (640) is the same shop, shifted: nothing outside the room, the crowd budgets hold.
import { buildCast, type CastMember } from '../cast';
import { emptyCrew, stepCrew, type CrewState } from '../crew';
import { advanceLine, AUTOMATIC, emptyLine, type Line, type LineRates } from '../../../engine/pipeline';
import { layout, moreTagAt, waitTagAt, QUEUE_PITCH, type Layout } from '../layout';
import { seatPalette } from '../palette';
import { hash32 } from '../looks';
import { FRAME_WIDTH, ONE_SCREEN, P, SCENE_H, SCENE_W, isWide, kAt, makeFrame, openScroll, sceneFit, sceneFrame, sceneToScreen, sceneView, screenToScene, unprojectX } from '../projection';
import { TAP_SLOP, isTap, shopOpenScroll } from '../scroll';

const WIDE = makeFrame(640);
const DX = WIDE.vanishX - ONE_SCREEN.vanishX;
const DRIVER_SLOTS = [2, 2, 3, 3, 4];

describe('the frame', () => {
  test('every footprint asks for one screen today: 393 wide, the vanishing point in the middle', () => {
    for (let fp = 0; fp < 5; fp++) {
      const f = sceneFrame(fp);
      expect(f.width).toBe(393);
      expect(f.height).toBe(SCENE_H);
      expect(f.vanishX).toBe(196.5);
      expect(f).toBe(ONE_SCREEN);
    }
    expect(FRAME_WIDTH).toHaveLength(5);
    expect(isWide(ONE_SCREEN)).toBe(false);
    expect(isWide(WIDE)).toBe(true);
  });
  test('a frame of a width is one shared object (memo deps hold)', () => {
    expect(makeFrame(640)).toBe(makeFrame(640));
    expect(makeFrame(640).vanishX).toBe(320);
  });
  test('P and unprojectX slide with the vanishing point: the same drawing, shifted', () => {
    for (const [x, y, z] of [[30, 0, 0], [196, 40, 12], [350, -30, 0], [100, 110, 80]]) {
      const [a, ay] = P(x, y, z);
      const [b, by] = P(x + DX, y, z, WIDE);
      expect(b).toBeCloseTo(a + DX, 9);
      expect(by).toBeCloseTo(ay, 9);
      expect(unprojectX(b, y, WIDE)).toBeCloseTo(x + DX, 9);
    }
  });
});

describe('the fit and the scroll view', () => {
  const screens: [number, number][] = [[393, 852], [390, 700], [430, 932], [375, 667]];
  test('a one-screen frame is fitted exactly as before and never scrolls', () => {
    for (const [w, h] of screens) {
      const v = sceneView(w, h, ONE_SCREEN);
      expect(v.scrolls).toBe(false);
      expect(v.contentW).toBe(w);
      expect(v.maxScroll).toBe(0);
      expect(v.fit).toEqual(sceneFit(w, h));
      const s = Math.max(w / SCENE_W, h / SCENE_H);
      expect(v.fit).toEqual({ s, ox: (w - SCENE_W * s) / 2, oy: h - SCENE_H * s });
    }
  });
  test('a wide frame scales like one screen and is wider than the screen: its content scrolls, from 0', () => {
    for (const [w, h] of screens) {
      const one = sceneView(w, h, ONE_SCREEN).fit;
      const v = sceneView(w, h, WIDE);
      expect(v.scrolls).toBe(true);
      expect(v.fit.s).toBeCloseTo(one.s, 9);
      expect(v.fit.oy).toBeCloseTo(one.oy, 9);
      expect(v.fit.ox).toBe(0);
      expect(v.contentW).toBeCloseTo(640 * one.s, 6);
      expect(v.contentW).toBeGreaterThan(w);
      expect(v.maxScroll).toBeCloseTo(v.contentW - w, 6);
    }
  });
  test('sceneToScreen and screenToScene round-trip at any scroll', () => {
    for (const [w, h] of screens)
      for (const frame of [ONE_SCREEN, WIDE]) {
        const v = sceneView(w, h, frame);
        for (const scrollX of [0, v.maxScroll / 3, v.maxScroll])
          for (const x of [0, 77, 196.5, 330, frame.width]) {
            const sx = sceneToScreen(x, scrollX, v.fit);
            expect(screenToScene(sx, scrollX, v.fit)).toBeCloseTo(x, 9);
          }
      }
  });
  test('scrolling by d moves every place in the shop d to the left', () => {
    const fit = sceneView(393, 852, WIDE).fit;
    expect(sceneToScreen(300, 50, fit)).toBeCloseTo(sceneToScreen(300, 0, fit) - 50, 9);
  });
  test('a touch that moved under 8 pt is a tap; 8 or more is a scroll', () => {
    expect(TAP_SLOP).toBe(8);
    expect(isTap({ x: 100, y: 100 }, { x: 105, y: 105 })).toBe(true);
    expect(isTap({ x: 100, y: 100 }, { x: 100, y: 100 })).toBe(true);
    expect(isTap({ x: 100, y: 100 }, { x: 108, y: 100 })).toBe(false);
    expect(isTap({ x: 100, y: 100 }, { x: 100, y: 92 })).toBe(false);
    expect(isTap({ x: 100, y: 100 }, { x: 106, y: 106 })).toBe(false);
  });
  test('a shop opens with the counter in view, or where it was left, always inside the content', () => {
    for (const [w, h] of screens) {
      const v = sceneView(w, h, WIDE);
      for (let fp = 0; fp < 5; fp++) {
        const lay = layout(fp, 2, 2, 2, 4, DRIVER_SLOTS[fp], 0, WIDE);
        const cx = P((lay.counter.x0 + lay.counter.x1) / 2, 74, 0, WIDE)[0];
        const at = shopOpenScroll(undefined, cx, v.fit.s, w, v.maxScroll);
        expect(at).toBeGreaterThanOrEqual(0);
        expect(at).toBeLessThanOrEqual(v.maxScroll);
        const onScreen = sceneToScreen(cx, at, v.fit);
        expect(onScreen).toBeGreaterThanOrEqual(0);
        expect(onScreen).toBeLessThanOrEqual(w);
      }
      expect(shopOpenScroll(40, 300, v.fit.s, w, v.maxScroll)).toBe(40);
      expect(shopOpenScroll(1e6, 300, v.fit.s, w, v.maxScroll)).toBe(v.maxScroll);
      expect(shopOpenScroll(-5, 300, v.fit.s, w, v.maxScroll)).toBe(0);
    }
    expect(shopOpenScroll(undefined, 300, 1, 393, 0)).toBe(0);
    expect(openScroll(0, 1, 393, 200)).toBe(0);
  });
});

/** Every x-position field of a layout that stands in the room (room units), with the screen ones after. */
function roomXs(lay: Layout): number[] {
  return [
    lay.L, lay.R, lay.prep.x0, lay.prep.x1, ...lay.cooks, ...lay.ovens.flatMap((o) => [o.x0, o.x1]), lay.bay.x0, lay.bay.x1, lay.counter.x0, lay.counter.x1, ...lay.staff,
    lay.door.x0, lay.door.x1, lay.door.cx, ...lay.spots.map((s) => s.x), ...lay.orderSpots.map((s) => s[0]), ...lay.tables.map((t) => t.x), ...lay.bakers.map((b) => b.x),
    ...(lay.ledge ? [lay.ledge.x0, lay.ledge.x1] : []), lay.scooter.x,
  ];
}
const sidewalkXs = (lay: Layout): number[] => [lay.sign.x, lay.prop.x, ...lay.patio.map((p) => p.x), ...lay.queue.map((q) => q[0]), ...lay.driverQueue.map((q) => q[0]), lay.queueTag[0], lay.waitTag[0]];

function* shops(frame: typeof WIDE) {
  for (let fp = 0; fp < 5; fp++)
    for (const ovens of [1, 3, 6])
      for (const cooks of [1, 3])
        for (const staff of [1, 2])
          for (const tables of [1, 3, 6, 8])
            for (const plants of [0, 1]) {
              if (fp === 0 && cooks === 3) continue;
              yield { name: `fp${fp} o${ovens} c${cooks} s${staff} t${tables} p${plants}`, fp, args: [fp, ovens, cooks, staff, tables, DRIVER_SLOTS[fp], plants] as const, lay: layout(fp, ovens, cooks, staff, tables, DRIVER_SLOTS[fp], plants, frame) };
            }
}

describe('a layout in a 640 frame', () => {
  test('the default frame is the footprint\'s: layout() with no frame is layout() in one screen', () => {
    for (const s of shops(ONE_SCREEN)) expect(s.lay).toEqual(layout(...s.args));
  });
  test('the room is centred on the vanishing point and nothing in it is placed outside the room', () => {
    for (const { name, lay } of shops(WIDE)) {
      expect([name, lay.L + lay.R]).toEqual([name, 2 * WIDE.vanishX]);
      expect(lay.frame).toBe(WIDE);
      for (const x of roomXs(lay)) expect([name, x >= lay.L - 1e-6 && x <= lay.R + 1e-6]).toEqual([name, true]);
      // the sidewalk's figures and props stand on the pavement, inside the drawing
      for (const x of sidewalkXs(lay)) {
        const sx = P(x, -30, 0, WIDE)[0];
        expect([name, sx >= 0 && sx <= WIDE.width]).toEqual([name, true]);
      }
    }
  });
  test('it is the one-screen shop shifted across, field by field (fp 0 to 3; the flagship\'s potted tree is the one thing the screen edge moves)', () => {
    for (const { name, fp, args, lay } of shops(WIDE)) {
      const one = layout(...args);
      // tagLeft is 0 (a floor, not a place) while no table stands in the back row
      const tl = (l: Layout) => (l.tagLeft > 0 ? [l.tagLeft] : []);
      const shiftable = fp < 4 ? [...roomXs(lay), ...sidewalkXs(lay), ...tl(lay)] : roomXs(lay);
      const base = fp < 4 ? [...roomXs(one), ...sidewalkXs(one), ...tl(one)] : roomXs(one);
      expect(shiftable).toHaveLength(base.length);
      base.forEach((v, i) => expect([name, i, shiftable[i]]).toEqual([name, i, expect.closeTo(v + DX, 6)]));
      expect(lay.tables.map((t) => t.y)).toEqual(one.tables.map((t) => t.y));
      expect(lay.queue.length).toBe(one.queue.length);
      expect(lay.patio.length).toBe(one.patio.length);
      expect(lay.ovens.map((o) => o.z)).toEqual(one.ovens.map((o) => o.z));
    }
  });
  test('the sidewalk queue keeps its spacing (the diners QUEUE_PITCH apart on screen)', () => {
    for (const { name, lay } of shops(WIDE)) {
      const xs = lay.queue.map((q) => P(q[0], q[1], 0, WIDE)[0]);
      for (let i = 1; i < xs.length; i++) expect([name, i, xs[i - 1] - xs[i]]).toEqual([name, i, expect.closeTo(QUEUE_PITCH, 6)]);
    }
  });
  test('the pills keep inside the drawing, not inside one screen', () => {
    for (const { name, args, fp, lay } of shops(WIDE)) {
      for (const text of ['×11 waiting', '3 drivers idle · buy Ovens']) {
        const w = waitTagAt(lay, text);
        const m = moreTagAt(lay, text);
        for (const [label, x, wid] of [['wait', w.x, w.w], ['more', m.x, m.w]] as const) {
          expect([name, label, x - wid / 2 >= 0, x + wid / 2 <= WIDE.width]).toEqual([name, label, true, true]);
        }
      }
      // the idle drivers' pill rides over the drivers: where one screen's width does not clamp it, it is the same pill shifted across
      const one = layout(...args);
      const [w1, w2] = [waitTagAt(one, 'x'), waitTagAt(lay, 'x')];
      if (fp < 4 && w1.tail === 0 && one.tagLeft === 0) expect([name, w2.x]).toEqual([name, expect.closeTo(w1.x + DX, 6)]);
    }
  });
});

// ---- the crowd, simulated in the 640 frame: the budgets of crowd.test.ts, in a frame-aware box ----
const FPS = 15;
const SECONDS = 14;
function box(c: CastMember, frame: typeof WIDE) {
  const [sx, sy] = P(c.props.x, c.props.y, 0, frame);
  const k = kAt(c.props.y) * 1.14;
  const h = (c.props.kind === 'sit' ? 40 : 50) * k;
  return { x0: sx - 11 * k, x1: sx + 11 * k, y0: sy - h, y1: sy };
}
type Box = ReturnType<typeof box>;
const area = (b: Box) => (b.x1 - b.x0) * (b.y1 - b.y0);
function overlap(a: Box, b: Box) {
  const w = Math.min(a.x1, b.x1) - Math.max(a.x0, b.x0);
  const h = Math.min(a.y1, b.y1) - Math.max(a.y0, b.y0);
  return w > 0 && h > 0 ? (w * h) / Math.min(area(a), area(b)) : 0;
}
function simulate(fp: number, tables: number, frame: typeof WIDE, pace: number) {
  const lay = layout(fp, Math.min(fp + 1, 6), fp === 0 ? 2 : 3, 2, tables, DRIVER_SLOTS[fp], 1, frame);
  const shopSeed = 97 * (fp + 3);
  const pal = seatPalette(hash32(shopSeed) % 8, hash32(shopSeed + 9) % 6, 8, 6, lay.tables.length);
  const r: LineRates = { prep: 4 * pace, oven: 4 * pace, serve: 4 * pace, shop: 3 * pace, price: 5, walkInFraction: 0.4, tapBatch: 4 };
  let line: Line = emptyLine();
  let crew: CrewState = emptyCrew();
  const out: CastMember[][] = [];
  for (let f = 0; f < SECONDS * FPS; f++) {
    const clock = f / FPS;
    line = advanceLine(line, 1 / FPS, r, AUTOMATIC).line;
    crew = stepCrew(crew, { lay, walkins: true, departures: line.departures }, clock, frame.width);
    out.push(buildCast({ lay, shop: { drivers: 12, tables: 40, prep: 120 }, running: true, pace, clock, shopSeed, nIdx: 1, pal, crew }).cast);
  }
  return { lay, frames: out };
}

describe('the crowd in a 640 frame', () => {
  const cases = [[0, 1], [2, 6], [3, 8], [4, 8]] as const;
  test('nobody walks in front of a baker or cook covering more than 35% of their torso', () => {
    const bad: string[] = [];
    for (const [fp, tables] of cases) {
      const { frames } = simulate(fp, tables, WIDE, 1.5);
      frames.forEach((cast, f) => {
        const crew = cast.filter((c) => c.role === 'baker' || c.role === 'cook').map((c) => ({ c, b: box(c, WIDE) }));
        const movers = cast.filter((c) => (c.role === 'walkin' && c.props.kind !== 'sit') || c.role === 'driver');
        for (const m of movers)
          for (const cb of crew) {
            const mb = box(m, WIDE);
            const h = cb.b.y1 - cb.b.y0;
            const torso = { x0: cb.b.x0, x1: cb.b.x1, y0: cb.b.y0 + h * 0.3, y1: cb.b.y0 + h * 0.7 };
            if (mb.y1 > cb.b.y1 && overlap(mb, torso) > 0.35) bad.push(`fp${fp} f${f} ${m.key} over ${cb.c.key}`);
          }
      });
    }
    expect(bad.slice(0, 5)).toEqual([]);
  });
  test('nobody stands still on the doormat, and people standing still never cover each other', () => {
    for (const [fp, tables] of cases) {
      const { lay, frames } = simulate(fp, tables, WIDE, 1.5);
      const c4 = [P(lay.door.x0 + 2, -8, 0, WIDE), P(lay.door.x1 - 2, -8, 0, WIDE), P(lay.door.x1 + 1, -22, 0, WIDE), P(lay.door.x0 - 1, -22, 0, WIDE)];
      const mat = { x0: Math.min(...c4.map((p) => p[0])), x1: Math.max(...c4.map((p) => p[0])), y0: Math.min(...c4.map((p) => p[1])), y1: Math.max(...c4.map((p) => p[1])) };
      for (const cast of frames) {
        for (const c of cast) {
          const still = !c.props.step && c.props.kind !== 'sit';
          expect([fp, c.key, still && overlap(box(c, WIDE), mat) > 0.2]).toEqual([fp, c.key, false]);
        }
        const still = cast.filter((c) => !c.props.step).map((c) => ({ c, b: box(c, WIDE) }));
        for (const a of still)
          for (const o of still) {
            if (a === o || a.b.y1 <= o.b.y1) continue;
            expect([fp, a.c.key, o.c.key, overlap(a.b, o.b) > 0.3]).toEqual([fp, a.c.key, o.c.key, false]);
          }
      }
    }
  });
  test('everyone drawn stands inside the drawing, and the walkers come in from its right edge, not one screen\'s', () => {
    for (const [fp, tables] of cases) {
      const { frames } = simulate(fp, tables, WIDE, 1.5);
      let farRight = 0;
      for (const cast of frames)
        for (const c of cast) {
          const sx = P(c.props.x, c.props.y, 0, WIDE)[0];
          expect([fp, c.key, sx > -30 && sx < WIDE.width + 30]).toEqual([fp, c.key, true]);
          if (c.role === 'walkin' || c.role === 'driver') farRight = Math.max(farRight, sx);
        }
      expect(farRight).toBeGreaterThan(SCENE_W + 20);
    }
  });
});
