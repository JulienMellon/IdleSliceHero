/// <reference types="jest" />
// v5.18 card V2: the Restaurant and the Flagship are wider than the screen, two neighbourhoods use the mirrored floor plan, and the first three tiers do not change.
import { createHash } from 'crypto';
import { FOOTPRINTS } from '../../../content/tuning';
import { FIRST_WIDE_FOOTPRINT, ROOM_WIDTH, SCENE_WIDTH, WIDE_PLAN, isMirrored } from '../../../content/shop-layout';
import { buildCast, type CastMember } from '../cast';
import { emptyCrew, routesFor, stepCrew, type CrewState } from '../crew';
import { advanceLine, AUTOMATIC, emptyLine, type Line, type LineRates } from '../../../engine/pipeline';
import { BACK_ROW_Y, FRONT_ROW_Y, ROOM_W, SEAT, layout, moreTagAt, waitTagAt, OVEN_BAY, type Layout } from '../layout';
import { flipRect, plainOf, reflectLayout, toDrawSpace } from '../layout-space';
import { menuRect, ladderProps } from '../ladder';
import { hash32 } from '../looks';
import { seatPalette } from '../palette';
import { P, drawFrame, drawShift, frameRight, kAt, makeFrame, sceneFrame } from '../projection';
import { doorwaySignRect, badgeXs, stationRects } from '../stations';
import { ladderInput, furnitureInputs } from '../furniture-inputs';

const DRIVER_SLOTS = [2, 2, 3, 3, 4];

describe('the widths (content/shop-layout.ts)', () => {
  test('scene widths 393 / 393 / 393 / 520 / 640 and room widths 270 / 295 / 320 / 450 / 570; the room fits the drawing with air to spare', () => {
    expect(SCENE_WIDTH).toEqual([393, 393, 393, 520, 640]);
    expect(ROOM_WIDTH).toEqual([270, 295, 320, 450, 570]);
    expect([...ROOM_W]).toEqual([...ROOM_WIDTH]);
    expect(FIRST_WIDE_FOOTPRINT).toBe(3);
    for (let fp = 0; fp < 5; fp++) {
      expect(sceneFrame(fp).width).toBe(SCENE_WIDTH[fp]);
      expect(SCENE_WIDTH[fp] - ROOM_WIDTH[fp]).toBeGreaterThanOrEqual(70);
    }
  });
  test('Waterfront and Industrial are the mirrored plan, nobody else', () => {
    expect(['downtown', 'suburbs', 'waterfront', 'university', 'industrial', 'uptown'].filter(isMirrored)).toEqual(['waterfront', 'industrial']);
  });
});

describe('the first three tiers do not change by a pixel', () => {
  // the digest of every v5.17 layout (and its two pills) over a grid of kitchens, taken from the code before this card: the numbers, field by field
  test('the layout and the pills of the Hole-in-the-wall, the Corner shop and the Double storefront are the v5.17 ones', () => {
    const h = createHash('sha1');
    const added = ['prep2', 'jamb', 'walk', 'tree', 'mirrored', 'frame'];
    for (let fp = 0; fp < 3; fp++)
      for (const o of [1, 2, 3, 4, 6])
        for (const c of [1, 2, 3])
          for (const s of [1, 2])
            for (const t of [1, 2, 3, 4, 6, 8])
              for (const p of [0, 1, 3]) {
                const lay = layout(fp, o, c, s, t, DRIVER_SLOTS[fp], p);
                const old = Object.fromEntries(Object.entries(lay).filter(([k]) => !added.includes(k)));
                h.update(JSON.stringify(old));
                h.update(JSON.stringify([waitTagAt(lay, 'x'), waitTagAt(lay, '11 drivers idle · buy Ovens'), moreTagAt(lay, '+3'), moreTagAt(lay, '9 waiting')]));
              }
    expect(h.digest('hex')).toBe('65e8b42473e7e5226c04c834ab74b1e7bb24a44f');
  });
});

describe('the wide tiers use their room (card V2 step 2)', () => {
  const at = (fp: number, o = FOOTPRINTS[fp].ovenSlots, c = 3, s = 2, t = FOOTPRINTS[fp].maxTables, p = 1) => layout(fp, o, c, s, t, DRIVER_SLOTS[fp], p);
  const bank = (lay: Layout) => lay.ovenCols[lay.ovenCols.length - 1].x1 - lay.ovenCols[0].x0;
  test('a longer oven bank: the bay is 140 / 190 against the narrow tiers\' 52 / 60 / 60, and the full bank is longer than the old 110 / 118 bay', () => {
    expect([OVEN_BAY[3].w, OVEN_BAY[4].w]).toEqual([WIDE_PLAN[3].bayW, WIDE_PLAN[4].bayW]);
    expect(bank(at(3))).toBeGreaterThan(120);
    expect(bank(at(4))).toBeGreaterThan(180);
    // the bank only gets longer with each oven, up to the full bank (the D417 rule, checked for all crews in ovens.test.ts)
    for (const fp of [3, 4]) {
      let prev = 0;
      for (let n = 1; n <= FOOTPRINTS[fp].ovenSlots; n++) {
        const total = at(fp, n).ovens.reduce((t, o) => t + (o.x1 - o.x0), 0);
        expect(total).toBeGreaterThanOrEqual(prev - 1e-6);
        prev = total;
      }
    }
  });
  test('a second prep table beside the first, clear of it, of the oven bay and of the room\'s walls', () => {
    for (const fp of [3, 4])
      for (const cooks of [1, 2, 3]) {
        const lay = at(fp, 3, cooks);
        expect(lay.prep2).not.toBeNull();
        const b2 = lay.prep2!;
        expect(b2.x1 - b2.x0).toBe(WIDE_PLAN[fp].bench2W);
        expect(b2.x0).toBeGreaterThanOrEqual(lay.prep.x1 + 12 - 1e-6);
        expect(b2.x1 + 8).toBeLessThanOrEqual(lay.bay.x0 + 1e-6);
        expect(b2.x0).toBeGreaterThan(lay.L);
        // it stays where it is as the kitchen grows (a hired cook never moves it)
        expect(at(fp, 1, 1, 1, 1).prep2).toEqual(lay.prep2);
      }
    for (const fp of [0, 1, 2]) expect(at(fp).prep2).toBeNull();
  });
  test('the dining room is deep enough for all of the footprint\'s tables in two rows, none on the bench\'s side of the back wall', () => {
    for (const fp of [3, 4]) {
      const lay = at(fp);
      expect(lay.tables).toHaveLength(FOOTPRINTS[fp].maxTables);
      const front = lay.tables.filter((tb) => tb.y === FRONT_ROW_Y);
      const back = lay.tables.filter((tb) => tb.y === BACK_ROW_Y);
      expect(front.length + back.length).toBe(lay.tables.length);
      expect(front.length).toBeGreaterThan(0);
      expect(back.length).toBeGreaterThanOrEqual(Math.floor(lay.tables.length / 2) - 1);
      expect(back.length).toBeGreaterThan(0);
      for (const tb of back) expect(tb.x - SEAT).toBeGreaterThan(lay.prep2!.x1);
    }
    // the check can fail: the narrow tiers' plan (the front row first) would put five of the Flagship's six tables in one long row; now no row holds more than four
    const oneRow = (fp: number) => Math.min(FOOTPRINTS[fp].maxTables, Math.max(1, Math.floor((at(fp).counter.x1 - 30 - SEAT - (at(fp).L + 44 + 10)) / 78) + 1));
    expect(oneRow(4)).toBeGreaterThanOrEqual(5);
    for (const fp of [3, 4]) expect(Math.max(...[FRONT_ROW_Y, BACK_ROW_Y].map((y) => at(fp).tables.filter((tb) => tb.y === y).length))).toBeLessThanOrEqual(4);
  });
  test('room for the layer props: the wide tiers keep the floor between the counter and the door the narrow tiers do not have (the warming rack, the shift clock)', () => {
    for (const fp of [3, 4]) {
      const lay = at(fp);
      expect(lay.R - lay.counter.x1).toBe(WIDE_PLAN[fp].doorGap);
    }
    expect(at(4).R - at(4).counter.x1).toBeGreaterThan(at(2).R - at(2).counter.x1);
  });
  test('the room is centred in its drawing, the kitchen\'s pieces all stand inside it and in order along the back wall', () => {
    for (const fp of [3, 4]) {
      const lay = at(fp);
      const f = sceneFrame(fp);
      expect(lay.L + lay.R).toBeCloseTo(2 * f.vanishX, 9);
      expect(lay.L).toBeGreaterThan(0);
      expect(lay.R).toBeLessThan(f.width);
      const order = [lay.prep.x0, lay.prep.x1, lay.prep2!.x0, lay.prep2!.x1, lay.bay.x0, lay.bay.x1, lay.counter.x0, lay.counter.x1, lay.door.x0];
      for (let i = 1; i < order.length; i++) expect(order[i]).toBeGreaterThan(order[i - 1]);
    }
  });
});

describe('the draw space', () => {
  test('a one-screen frame is its own draw space; a wide one is the same drawing seen from the one-screen vanishing point', () => {
    for (let fp = 0; fp < 3; fp++) expect(drawFrame(sceneFrame(fp))).toBe(sceneFrame(fp));
    const f = sceneFrame(4);
    const d = drawFrame(f);
    expect(d.vanishX).toBe(196.5);
    expect(d.x0).toBe(-drawShift(f));
    expect(frameRight(d)).toBe(f.width - drawShift(f));
    expect(drawFrame(f)).toBe(d);
  });
  test('every x of a layout lands drawShift to the left, and the default P of the drawing code plus the shift is the frame\'s own P', () => {
    for (const fp of [3, 4])
      for (const mirrored of [false, true]) {
        const lay = layout(fp, 3, 2, 2, 4, DRIVER_SLOTS[fp], 1, undefined, mirrored);
        const d = toDrawSpace(lay);
        const dx = drawShift(lay.frame);
        expect(d.L).toBeCloseTo(lay.L - dx, 9);
        expect(d.door.cx).toBeCloseTo(lay.door.cx - dx, 9);
        expect(d.tables.map((t) => t.x)).toEqual(lay.tables.map((t) => expect.closeTo(t.x - dx, 9)));
        for (const [x, y] of [[lay.counter.x0, 70], [lay.door.cx, 0], [lay.patio[0]?.x ?? lay.L, -12]]) expect(P(x - dx, y)[0] + dx).toBeCloseTo(P(x, y, 0, lay.frame)[0], 9);
        expect(toDrawSpace(lay)).toBe(d);
      }
  });
});

describe('the mirrored floor plan (card V2 step 3)', () => {
  const build = (fp: number, mirrored: boolean, t = FOOTPRINTS[fp].maxTables) => layout(fp, Math.min(fp + 1, 6), 3, 2, t, DRIVER_SLOTS[fp], 1, undefined, mirrored);
  // every x of a layout; the two ends of a span swap places when the plan is mirrored (the left end of a bench is the right end of its reflection)
  const xsOf = (lay: Layout): number[] => {
    const sp = (s: { x0: number; x1: number }) => (lay.mirrored ? [s.x1, s.x0] : [s.x0, s.x1]);
    return [
    ...sp({ x0: lay.L, x1: lay.R }), ...sp(lay.prep), ...(lay.prep2 ? sp(lay.prep2) : []), ...lay.cooks, ...sp(lay.bay), ...sp(lay.counter), ...lay.staff,
    ...sp(lay.door), lay.door.cx, lay.door.lanes.guestX, lay.door.lanes.driverX, lay.door.lanes.guestPauseX, lay.door.lanes.driverPauseX, ...sp(lay.jamb),
    ...lay.spots.map((s) => s.x), ...lay.orderSpots.map((s) => s[0]), ...lay.tables.map((t) => t.x), ...lay.bakers.map((b) => b.x), lay.scooter.x, lay.tree.x, lay.sign.x, lay.prop.x,
    ...lay.patio.map((p) => p.x), ...lay.queue.map((q) => q[0]), ...lay.driverQueue.map((q) => q[0]), lay.queueTag[0], lay.waitTag[0], lay.walk.from, lay.walk.away,
    ];
  };
  test('every x is reflected about the room\'s centre, every y is the same, and reflecting twice gives the plain plan back', () => {
    for (let fp = 0; fp < 5; fp++) {
      const plain = build(fp, false);
      const m = build(fp, true);
      const a = 2 * plain.frame.vanishX;
      expect([fp, m.mirrored, plain.mirrored]).toEqual([fp, true, false]);
      xsOf(plain).forEach((x, i) => expect([fp, i, xsOf(m)[i]]).toEqual([fp, i, expect.closeTo(a - x, 6)]));
      expect(m.tables.map((t) => t.y)).toEqual(plain.tables.map((t) => t.y));
      expect(m.queue.map((q) => q[1])).toEqual(plain.queue.map((q) => q[1]));
      expect(m.ovens.map((o) => [o.z, o.h])).toEqual(plain.ovens.map((o) => [o.z, o.h]));
      const back = reflectLayout(m);
      expect(back.mirrored).toBe(false);
      const round = (_: string, v: unknown) => (typeof v === 'number' ? Math.round(v * 1e6) / 1e6 : v);
      expect(JSON.stringify(back, round)).toBe(JSON.stringify(plain, round));
      expect(plainOf(m)).toBe(plainOf(m));
      expect(plainOf(plain)).toBe(plain);
    }
  });
  test('kitchen on the right, door on the left; ovens, bench and counter keep their order the other way round', () => {
    for (let fp = 0; fp < 5; fp++) {
      const m = build(fp, true);
      const v = m.frame.vanishX;
      expect(m.door.cx).toBeLessThan(v);
      expect(m.counter.x1).toBeLessThan(m.bay.x0);
      expect(m.bay.x1).toBeLessThan(m.prep.x0);
      expect(m.door.x1).toBeLessThan(m.counter.x0);
      expect(m.L).toBeLessThan(m.R);
      expect(m.ovenCols.map((c) => c.x0)).toEqual([...m.ovenCols.map((c) => c.x0)].sort((p, q) => p - q));
      // the badges run counter, ovens, prep from the left, and are as far apart as they ever were
      const b = badgeXs(m);
      expect(b.counter).toBeLessThan(b.oven);
      expect(b.oven).toBeLessThan(b.prep);
      expect(b.oven - b.counter).toBeGreaterThan(30);
      expect(b.prep - b.oven).toBeGreaterThan(30);
    }
  });
  test('the WELCOME mat stays at the door, the doorway plank and the jambs sit over it', () => {
    for (let fp = 0; fp < 5; fp++) {
      const m = build(fp, true);
      const sign = doorwaySignRect(m);
      const [mx] = P(m.door.cx, -15);
      expect(mx).toBeGreaterThan(sign.x0);
      expect(mx).toBeLessThan(sign.x1);
      expect(m.jamb.x0).toBeLessThan(m.door.x0);
      expect(m.jamb.x1).toBeGreaterThan(m.door.x1);
      expect(m.jamb.x0).toBeCloseTo(m.L + 8, 6);
    }
  });
  test('the crew\'s routes mirror with the layout: walkers come in from the right edge and go off the left, the chairs and the register are where the layout says', () => {
    for (let fp = 0; fp < 5; fp++) {
      const plain = build(fp, false);
      const m = build(fp, true);
      const a = 2 * plain.frame.vanishX;
      const rp = routesFor(plain, plain.frame.width, false, 2);
      const rm = routesFor(m, m.frame.width, false, 2);
      expect(rm.guests).toHaveLength(rp.guests.length);
      rp.guests.forEach((g, i) => {
        const gm = rm.guests[i];
        expect(gm.arrive.pts[0][0]).toBeCloseTo(a - g.arrive.pts[0][0], 6);
        expect(gm.orderAt[0]).toBeCloseTo(a - g.orderAt[0], 6);
        expect(gm.arrive.len).toBeCloseTo(g.arrive.len, 6);
      });
      expect(rm.driver.away.len).toBeCloseTo(rp.driver.away.len, 6);
      expect(m.walk.from).toBeGreaterThan(m.frame.width);
      expect(m.walk.away).toBeLessThan(0);
    }
  });
  test('the pills run the plain plan\'s rules on the reflection: the same pill, mirrored, with its tail turned round', () => {
    for (let fp = 0; fp < 5; fp++) {
      const plain = build(fp, false);
      const m = build(fp, true);
      const a = 2 * plain.frame.vanishX;
      for (const text of ['×11 waiting', '11 drivers idle · buy Ovens']) {
        const p = waitTagAt(plain, text);
        const q = waitTagAt(m, text);
        expect([fp, q.x]).toEqual([fp, expect.closeTo(a - p.x, 6)]);
        expect(q.tail).toBeCloseTo(-p.tail, 6);
        const mp = moreTagAt(plain, text);
        const mq = moreTagAt(m, text);
        expect([fp, mq.x]).toEqual([fp, expect.closeTo(a - mp.x, 6)]);
        expect(mq.y).toBeCloseTo(mp.y, 6);
        // and stays inside the drawing
        for (const [x, w] of [[q.x, q.w], [mq.x, mq.w]]) expect([fp, x - w / 2 >= 0, x + w / 2 <= plain.frame.width]).toEqual([fp, true, true]);
      }
    }
  });
  test('the ladder\'s props and the menu board are placed by the plain plan and flipped, so they never stand on the wrong wall', () => {
    for (let fp = 1; fp < 5; fp++) {
      // (the drawing code's space: its default `P`)
      const plain = toDrawSpace(build(fp, false));
      const m = toDrawSpace(build(fp, true));
      const a = 2 * plain.frame.vanishX;
      const inp = ladderInput(furnitureInputs({ id: 'waterfront', name: 'Waterfront', shop: { footprint: fp, prep: 120, counter: 120, drivers: 40, managed: true, line: { prepped: 3 }, decor: { tables: 2, plants: 1, signage: 0 } }, running: true, rate: 3, vehicle: 2, worn: [] }));
      const pp = ladderProps(plain, inp);
      const mm = ladderProps(m, inp);
      expect(mm.map((p) => p.id)).toEqual(pp.map((p) => p.id));
      pp.forEach((p, i) => {
        expect(mm[i].ax).toBeCloseTo(a - p.ax, 6);
        expect(mm[i].rect).toEqual({ ...p.rect, x0: expect.closeTo(a - p.rect.x1, 6), x1: expect.closeTo(a - p.rect.x0, 6) });
      });
      const mp = menuRect(plain);
      expect(menuRect(m)).toEqual(mp && flipRect(mp, a));
      // the tap areas follow the furniture
      const rp = stationRects(plain, 44);
      const rm = stationRects(m, 44);
      expect(rm.counter.x1).toBeCloseTo(a - rp.counter.x0, 6);
    }
  });
});

// ---- the crowd, simulated in the mirrored plan: the budgets of frame.test.ts, in a frame-aware box ----
const FPS = 15;
const SECONDS = 14;
function box(c: CastMember, lay: Layout) {
  const [sx, sy] = P(c.props.x, c.props.y, 0, lay.frame);
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
function simulate(fp: number, tables: number, mirrored: boolean, pace: number) {
  const lay = toDrawSpace(layout(fp, Math.min(fp + 1, 6), fp === 0 ? 2 : 3, 2, tables, DRIVER_SLOTS[fp], 1, undefined, mirrored));
  const shopSeed = 97 * (fp + 3);
  const pal = seatPalette(hash32(shopSeed) % 8, hash32(shopSeed + 9) % 6, 8, 6, lay.tables.length);
  const r: LineRates = { prep: 4 * pace, oven: 4 * pace, serve: 4 * pace, shop: 3 * pace, price: 5, walkInFraction: 0.4, tapBatch: 4 };
  let line: Line = emptyLine();
  let crew: CrewState = emptyCrew();
  const out: CastMember[][] = [];
  for (let f = 0; f < SECONDS * FPS; f++) {
    const clock = f / FPS;
    line = advanceLine(line, 1 / FPS, r, AUTOMATIC).line;
    crew = stepCrew(crew, { lay, walkins: true, departures: line.departures }, clock, lay.frame.width);
    out.push(buildCast({ lay, shop: { drivers: 12, tables: 40, prep: 120 }, running: true, pace, clock, shopSeed, nIdx: 1, pal, crew }).cast);
  }
  return { lay, frames: out };
}

describe('the crowd in the mirrored plan (the budgets of the plain plan, mirrored)', () => {
  const cases = [[0, 1], [1, 3], [2, 6], [3, 5], [4, 6]] as const;
  test('nobody walks in front of a baker or cook covering more than 35% of their torso', () => {
    const bad: string[] = [];
    for (const [fp, tables] of cases) {
      const { lay, frames } = simulate(fp, tables, true, 1.5);
      frames.forEach((cast, f) => {
        const crew = cast.filter((c) => c.role === 'baker' || c.role === 'cook').map((c) => ({ c, b: box(c, lay) }));
        const movers = cast.filter((c) => (c.role === 'walkin' && c.props.kind !== 'sit') || c.role === 'driver');
        for (const m of movers)
          for (const cb of crew) {
            const mb = box(m, lay);
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
      const { lay, frames } = simulate(fp, tables, true, 1.5);
      const c4 = [P(lay.door.x0 + 2, -8), P(lay.door.x1 - 2, -8), P(lay.door.x1 + 1, -22), P(lay.door.x0 - 1, -22)];
      const mat = { x0: Math.min(...c4.map((p) => p[0])), x1: Math.max(...c4.map((p) => p[0])), y0: Math.min(...c4.map((p) => p[1])), y1: Math.max(...c4.map((p) => p[1])) };
      for (const cast of frames) {
        for (const c of cast) {
          const still = !c.props.step && c.props.kind !== 'sit';
          expect([fp, c.key, still && overlap(box(c, lay), mat) > 0.2]).toEqual([fp, c.key, false]);
        }
        const still = cast.filter((c) => !c.props.step).map((c) => ({ c, b: box(c, lay) }));
        for (const a of still)
          for (const o of still) {
            if (a === o || a.b.y1 <= o.b.y1) continue;
            expect([fp, a.c.key, o.c.key, overlap(a.b, o.b) > 0.3]).toEqual([fp, a.c.key, o.c.key, false]);
          }
      }
    }
  });
  test('everyone drawn stands inside the drawing, and the walkers come in from its left edge: the door is on the right edge of the street', () => {
    for (const [fp, tables] of cases) {
      const { lay, frames } = simulate(fp, tables, true, 1.5);
      let farLeft = Infinity;
      for (const cast of frames)
        for (const c of cast) {
          const sx = P(c.props.x, c.props.y, 0, lay.frame)[0];
          expect([fp, c.key, sx > lay.frame.x0 - 30 && sx < lay.frame.x0 + lay.frame.width + 30]).toEqual([fp, c.key, true]);
          if (c.role === 'walkin' || c.role === 'driver') farLeft = Math.min(farLeft, sx);
        }
      expect(farLeft).toBeLessThan(lay.frame.x0 + 60);
    }
  });
  test('diners are turned toward the door the other way round: the sidewalk queue faces left', () => {
    for (const [fp, tables] of cases) {
      const plain = simulate(fp, tables, false, 1);
      const m = simulate(fp, tables, true, 1);
      const facing = (r: { frames: CastMember[][] }) => r.frames[r.frames.length - 1].filter((c) => c.role === 'queue').map((c) => c.props.flip);
      expect([fp, facing(m)]).toEqual([fp, facing(plain).map((f) => !f)]);
    }
  });
});

describe('the frame of a footprint', () => {
  test('makeFrame and the draw frame agree on the shift', () => {
    expect(drawShift(makeFrame(640))).toBe(123.5);
    expect(drawShift(makeFrame(393))).toBe(0);
    expect(makeFrame(520).x0).toBe(0);
  });
});
