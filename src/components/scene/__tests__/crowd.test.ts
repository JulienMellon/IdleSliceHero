/// <reference types="jest" />
// Crowd budgets: simulate the cast frame by frame for busy shops and check, in screen space, that moving
// people don't sit on top of the kitchen crew, each other, or the WELCOME mat for more than a moment.
import { buildCast, type CastMember } from '../cast';
import { emptyCrew, stepCrew, type CrewState } from '../crew';
import { BACK_ROW_Y, layout } from '../layout';
import { hash32 } from '../looks';
import { seatPalette } from '../palette';
import { P, SCENE_W, kAt } from '../projection';
import { quantArm, quantStep } from '../quantise';

const DRIVER_SLOTS = [2, 2, 3, 3, 4];
const FPS = 15;
const SECONDS = 20;

/** A figure's on-screen box (feet at its room point; ~22 wide, ~50 tall at depth scale). */
function box(c: CastMember) {
  const [sx, sy] = P(c.props.x, c.props.y);
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

/** The doormat's screen box, from the same corners Doormat draws (room y −8 … −22). */
function matBox(lay: ReturnType<typeof layout>): Box {
  const c = [P(lay.door.x0 + 2, -8), P(lay.door.x1 - 2, -8), P(lay.door.x1 + 1, -22), P(lay.door.x0 - 1, -22)];
  return { x0: Math.min(...c.map((p) => p[0])), x1: Math.max(...c.map((p) => p[0])), y0: Math.min(...c.map((p) => p[1])), y1: Math.max(...c.map((p) => p[1])) };
}

/** Busy shops at every footprint (full crew, full dining room, many drivers). */
function* busyShops() {
  for (let fp = 0; fp < 5; fp++)
    for (const tables of [1, 3, 6, 8]) {
      const lay = layout(fp, Math.min(fp + 1, 6), 3, 2, tables, DRIVER_SLOTS[fp], 1);
      const shopSeed = 97 * (fp + 3);
      const pal = seatPalette(hash32(shopSeed) % 8, hash32(shopSeed + 9) % 6, 8, 6, lay.tables.length);
      yield { name: `fp${fp} t${tables}`, lay, shopSeed, pal };
    }
}

type Shop = ReturnType<typeof busyShops> extends Generator<infer T> ? T : never;
/** Simulated once per (shop, pace) and shared by every test below (C21: the old suite re-simulated 40 s per test). */
const frameCache = new Map<string, CastMember[][]>();
/**
 * v4.9: people follow departures. `pace` sets the departure cadence (one every 1.6 / pace s, 40% walk-ins);
 * `burst` sends them in clumps of 6 every 6 s instead (merged departures at high rates).
 */
function frames(shop: Shop, pace: number, burst = false) {
  const key = `${shop.name}|${pace}|${burst}`;
  let out = frameCache.get(key);
  if (!out) {
    out = [];
    let crew: CrewState = emptyCrew();
    let id = 0;
    let deps: { id: number; kind: 'driver' | 'walkin' }[] = [];
    let nextAt = 0.3;
    for (let f = 0; f < SECONDS * FPS; f++) {
      const clock = f / FPS;
      if (clock >= nextAt) {
        const n = burst ? 6 : 1;
        for (let j = 0; j < n; j++) {
          id++;
          deps = [...deps, { id, kind: (id % 5 < 2 ? 'walkin' : 'driver') as 'walkin' | 'driver' }].slice(-6);
        }
        nextAt += burst ? 6 : 1.6 / pace;
      }
      crew = stepCrew(crew, { lay: shop.lay, drivers: 12, guests: 1, departures: deps }, clock, SCENE_W);
      const { cast } = buildCast({ lay: shop.lay, shop: { drivers: 12, tables: 40, prep: 120 }, running: true, pace, clock, shopSeed: shop.shopSeed, nIdx: 1, pal: shop.pal, crew });
      out.push(cast);
    }
    frameCache.set(key, out);
  }
  return out;
}

describe('crowd budgets', () => {
  // G72: the old <6% budget let walk-ins cross in front of the bakers for a whole lap. Zero frames now.
  test('nobody walks in front of a baker or cook, covering more than 35% of their torso, in any frame', () => {
    const bad: string[] = [];
    for (const shop of busyShops())
      for (const pace of [1, 2.6]) {
        const fs = frames(shop, pace);
        fs.forEach((cast, f) => {
          const crew = cast.filter((c) => c.role === 'baker' || c.role === 'cook').map((c) => ({ c, b: box(c) }));
          const movers = cast.filter((c) => (c.role === 'walkin' && c.props.kind !== 'sit') || c.role === 'driver');
          for (const m of movers)
            for (const cb of crew) {
              const mb = box(m);
              const h = cb.b.y1 - cb.b.y0;
              const torso = { x0: cb.b.x0, x1: cb.b.x1, y0: cb.b.y0 + h * 0.3, y1: cb.b.y0 + h * 0.7 };
              if (mb.y1 > cb.b.y1 && overlap(mb, torso) > 0.35) bad.push(`${shop.name} pace${pace} f${f} ${m.key} over ${cb.c.key}`);
            }
        });
      }
    expect(bad.slice(0, 5)).toEqual([]);
  });
  // T17 (C20): the old test checked y ranges nobody ever stands in. Project the mat polygon to a screen box.
  test('the screen-box check can fail: a figure parked on the mat covers it', () => {
    const lay = layout(2, 3, 2, 2, 6, 3, 0);
    const mat = matBox(lay);
    const cx = (lay.door.x0 + lay.door.x1) / 2;
    const parked = box({ key: 'x', sortY: -15, role: 'walkin', props: { x: cx, y: -15, kind: 'guest', step: 0 } });
    expect(overlap(parked, mat)).toBeGreaterThan(0.2);
  });
  test('nobody stands still on the doormat (>20% of its screen box)', () => {
    for (const shop of busyShops()) {
      const mat = matBox(shop.lay);
      for (const cast of frames(shop, 1.5))
        for (const c of cast) {
          const still = !c.props.step && c.props.kind !== 'sit';
          expect([shop.name, c.key, still && overlap(box(c), mat) > 0.2]).toEqual([shop.name, c.key, false]);
        }
    }
  });
  test('people standing still never cover each other (>30%)', () => {
    for (const shop of busyShops())
      for (const cast of frames(shop, 1.5)) {
        const still = cast.filter((c) => !c.props.step).map((c) => ({ c, b: box(c) }));
        for (const a of still)
          for (const o of still) {
            if (a === o || a.b.y1 <= o.b.y1) continue;
            expect([shop.name, a.c.key, o.c.key, overlap(a.b, o.b) > 0.3]).toEqual([shop.name, a.c.key, o.c.key, false]);
          }
      }
  });
  // Passing traffic (drivers crossing in the doorway, a walk-in passing the crew) is fine for a moment.
  test('a walking figure covers another figure (>50%) in under 15% of frames', () => {
    for (const shop of busyShops()) {
      const fs = frames(shop, 1.5);
      let bad = 0;
      for (const cast of fs) {
        const boxes = cast.map((c) => ({ c, b: box(c) }));
        const hit = boxes.some(({ c, b }) => c.props.step && boxes.some((o) => o.c !== c && b.y1 > o.b.y1 && overlap(b, o.b) > 0.5));
        if (hit) bad++;
      }
      expect([shop.name, bad / fs.length < 0.15]).toEqual([shop.name, true]);
    }
  });
});

describe('the counter (D336)', () => {
  // D336: a walk-in drawn over the pickup driver at the register (one figure, two heads). Event-driven people keep
  // one driver per pickup spot and route walk-ins in front of the pickup line, so at the counter nobody covers anyone.
  test('no walk-in and driver overlap by more than 15% near the counter, in any frame (steady, sparse and burst)', () => {
    const bad: string[] = [];
    for (const shop of busyShops())
      for (const [pace, burst] of [[1, false], [2.6, false], [0.3, false], [1, true]] as const)
        frames(shop, pace, burst).forEach((cast, f) => {
          const near = (c: CastMember) => c.props.y > 30 && c.props.y < 70;
          const drivers = cast.filter((c) => c.role === 'driver' && near(c));
          const walkins = cast.filter((c) => c.role === 'walkin' && c.props.kind !== 'sit' && near(c));
          for (const d of drivers) for (const w of walkins) if (overlap(box(d), box(w)) > 0.15) bad.push(`${shop.name} pace${pace}${burst ? " burst" : ""} f${f} ${w.key}${w.props.step ? "w" : "s"}/${d.key}${d.props.step ? "w" : "s"}`);
          for (const a of drivers) for (const b of drivers) if (a !== b && !a.props.step && !b.props.step && overlap(box(a), box(b)) > 0.15) bad.push(`${shop.name} f${f} ${a.key}/${b.key} stacked`);
        });
    expect(bad.slice(0, 5)).toEqual([]);
  });
});

describe('screen edges and back-row diners', () => {
  // D284: a leaving driver used to fade to a half-transparent ghost while still fully on screen
  test('a figure is only translucent once it is (almost) entirely off screen', () => {
    const bad: string[] = [];
    for (const shop of busyShops())
      for (const pace of [1, 2.6])
        frames(shop, pace).forEach((cast, f) => {
          for (const c of cast) {
            const o = c.props.o ?? 1;
            const b = box(c);
            const visible = Math.max(0, Math.min(b.x1, SCENE_W) - Math.max(b.x0, 0)) / (b.x1 - b.x0);
            if (o < 0.9 && visible > 0.25) bad.push(`${shop.name} pace${pace} f${f} ${c.key} o=${o.toFixed(2)} visible=${visible.toFixed(2)}`);
          }
        });
    expect(bad.slice(0, 5)).toEqual([]);
  });
  // D283: back-row diners (room y 42) sit in front of the bakers; their heads must not land on a baker's shins and feet
  test("a back-row diner's head never covers a baker's lower legs or feet", () => {
    const bad: string[] = [];
    for (const shop of busyShops()) {
      const cast = frames(shop, 1)[0];
      const bakers = cast.filter((c) => c.role === 'baker').map(box);
      for (const d of cast.filter((c) => (c.role === 'diner' || c.role === 'companion') && c.props.y === BACK_ROW_Y)) {
        const b = box(d);
        const head = { x0: b.x0, x1: b.x1, y0: b.y0, y1: b.y0 + (b.y1 - b.y0) * 0.3 };
        for (const bk of bakers) {
          const h = bk.y1 - bk.y0;
          const legs = { x0: bk.x0, x1: bk.x1, y0: bk.y1 - h * 0.35, y1: bk.y1 };
          if (b.y1 > bk.y1 && overlap(head, legs) > 0) bad.push(`${shop.name} ${d.key}`);
        }
      }
    }
    expect(bad.slice(0, 5)).toEqual([]);
  });
});

describe('pose churn (T12)', () => {
  test('worker limb props change on at most ~55% of consecutive frames', () => {
    for (const shop of busyShops()) {
      const fs = frames(shop, 2.6);
      let changes = 0;
      let pairs = 0;
      for (let f = 1; f < fs.length; f++) {
        const prev = new Map(fs[f - 1].map((c) => [c.key, c]));
        for (const c of fs[f]) {
          if (c.role !== 'cook' && c.role !== 'baker' && c.role !== 'staff') continue;
          const p = prev.get(c.key);
          if (!p) continue;
          pairs++;
          if (quantArm(p.props.arm ?? 0) !== quantArm(c.props.arm ?? 0) || quantStep(p.props.step ?? 0) !== quantStep(c.props.step ?? 0)) changes++;
        }
      }
      expect([shop.name, changes / pairs <= 0.55]).toEqual([shop.name, true]);
    }
  });
});
