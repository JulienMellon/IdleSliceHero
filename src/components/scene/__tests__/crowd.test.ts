/// <reference types="jest" />
// Crowd budgets: simulate the cast frame by frame for busy shops and check, in screen space, that moving
// people don't sit on top of the kitchen crew, each other, or the WELCOME mat for more than a moment.
import { buildCast, sidewalkOf, type CastMember } from '../cast';
import { alongDist, emptyCrew, routesFor, stepCrew, type CrewState } from '../crew';
import { advanceLine, AUTOMATIC, emptyLine, type Line, type LineRates } from '../../../engine/pipeline';
import { BACK_ROW_Y, PATIO_SEAT, SEAT, VEHICLE_HALF_W, layout, waitTagAt, waitTagWidth } from '../layout';
import { hash32 } from '../looks';
import { seatPalette } from '../palette';
import { CURB_Y, P, SCENE_H, SCENE_W, kAt } from '../projection';
import { SIDEWALK_ROW } from '../../tap-targets';
import { doorwaySignRect, popRect, spotlightCutout, staffFaces, stationRects, tutorialHand } from '../stations';
import { bodyBy, chairBack, SEATED_TORSO_HALF } from '../geometry';
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
    // the real engine line drives who walks: `pace` sets its rate; `burst` runs a high-rate shop whose stacks merge
    const r: LineRates = { prep: 4 * pace, oven: 4 * pace, serve: 4 * pace, shop: 3 * pace * (burst ? 6 : 1), price: 5, walkInFraction: 0.4, tapBatch: 4 };
    let line: Line = emptyLine();
    for (let f = 0; f < SECONDS * FPS; f++) {
      const clock = f / FPS;
      line = advanceLine(line, 1 / FPS, r, AUTOMATIC).line;
      crew = stepCrew(crew, { lay: shop.lay, walkins: true, departures: line.departures }, clock, SCENE_W);
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
          for (const d of drivers) for (const w of walkins) if (overlap(box(d), box(w)) > 0.15) bad.push(`${shop.name} pace${pace}${burst ? " burst" : ""} f${f} ${w.key}${w.props.step ? "w" : "s"}@${w.props.x.toFixed(0)},${w.props.y.toFixed(0)}/${d.key}${d.props.step ? "w" : "s"}@${d.props.x.toFixed(0)},${d.props.y.toFixed(0)}`);
          for (const a of drivers) for (const b of drivers) if (a !== b && !a.props.step && !b.props.step && overlap(box(a), box(b)) > 0.15) bad.push(`${shop.name} f${f} ${a.key}/${b.key} stacked`);
        });
    expect(bad.slice(0, 5)).toEqual([]);
  });

  // The old chair test only checked a seat existed at ±SEAT; the lone rug-table diner still sat on air because the
  // old backrest (x −7.5…−1.1) hid entirely behind their torso. Now the chair must be at the diner's own side, with its
  // back rail showing beside the torso and 6 above the shoulders (the old rail failed both: 0 visible, 5 above).
  test('each seated figure\'s own chair has its back on the diner\'s back side, showing beside the torso, 6 above the shoulders', () => {
    const bad: string[] = [];
    for (const shop of busyShops())
      for (const pace of [1, 2.6])
        frames(shop, pace).forEach((cast, f) => {
          for (const c of cast) {
            if (c.props.kind !== 'sit') continue;
            const tb = shop.lay.tables.find((t) => Math.abs(t.y - c.props.y) < 0.01 && Math.abs(Math.abs(c.props.x - t.x) - SEAT) < 0.01);
            if (!tb) continue; // covered by the test above
            const out = c.props.x < tb.x ? -1 : 1;
            const cb = chairBack(out);
            const visible = out < 0 ? -SEATED_TORSO_HALF - cb.x0 : cb.x1 - SEATED_TORSO_HALF; // rail width beyond the torso edge
            const aboveShoulders = bodyBy('sit', 0) - cb.rail.y0;
            if (Boolean(c.props.flip) !== out > 0 || visible < 3 || aboveShoulders < 5.5) bad.push(`${shop.name} pace${pace} f${f} ${c.key} flip${c.props.flip} visible${visible} above${aboveShoulders}`);
          }
        });
    expect(bad.slice(0, 5)).toEqual([]);
  });
});

describe('the tutorial hand (D384)', () => {
  const headOf = (c: CastMember) => {
    const b = box(c);
    return { x0: b.x0, x1: b.x1, y0: b.y0, y1: b.y0 + (b.y1 - b.y0) * 0.3 };
  };
  test('the hand never meets any character head, for every spotlighted station, at any bounce, in any frame (Downtown, footprint 0)', () => {
    const bad: string[] = [];
    for (const shop of busyShops()) {
      if (shop.lay.fp !== 0) continue;
      for (const pace of [1, 2.6])
        for (const scale of [0.95, 1.25, 1.6]) // fit.s on a 375 pt wide phone … a tablet
          for (const st of ['prep', 'oven', 'counter'] as const) {
            const cut = spotlightCutout(stationRects(shop.lay, 44 / scale)[st]);
            for (const bounce of [0, 4]) {
              const hand = tutorialHand(cut, bounce);
              expect(hand.hx).toBeCloseTo((cut.x0 + cut.x1) / 2);
              expect(hand.hy).toBeCloseTo(cut.y1 - 30 + bounce);
              frames(shop, pace).forEach((cast, f) => {
                for (const c of cast) {
                  if (c.role === 'walkin' && c.props.kind !== 'sit') continue; // a guest in transit may cross any spot for a moment
                  const h = headOf(c);
                  if (hand.rect.x0 < h.x1 && hand.rect.x1 > h.x0 && hand.rect.y0 < h.y1 && hand.rect.y1 > h.y0) bad.push(`${shop.name} ${st} s${scale} pace${pace} f${f} ${c.key}`);
                }
              });
            }
          }
    }
    expect(bad.slice(0, 5)).toEqual([]);
  });
});

describe('the sidewalk row (D352)', () => {
  test('on a shop with no manager nobody walks where the taller sidewalk row stands', () => {
    for (const shop of busyShops()) {
      let crew: CrewState = emptyCrew();
      const r: LineRates = { prep: 4, oven: 4, serve: 4, shop: 3, price: 5, walkInFraction: 0.4, tapBatch: 4 };
      let line: Line = emptyLine();
      for (let f = 0; f < SECONDS * FPS; f++) {
        line = advanceLine(line, 1 / FPS, r, AUTOMATIC).line;
        crew = stepCrew(crew, { lay: shop.lay, walkins: true, idle: true, departures: line.departures }, f / FPS, SCENE_W);
        const { cast } = buildCast({ lay: shop.lay, shop: { drivers: 12, tables: 40, prep: 120 }, running: true, pace: 1, clock: f / FPS, shopSeed: shop.shopSeed, nIdx: 1, pal: shop.pal, crew });
        // the row's top edge is at room depth ≈ −27.6; keep feet 4 pt clear of it
        for (const c of cast) if (c.role === 'walkin' || c.role === 'driver') expect([shop.name, c.key, c.props.y >= -22]).toEqual([shop.name, c.key, true]);
      }
    }
  });
});

describe('pops and the waiting walk-in (D368, D370)', () => {
  test('a pop riding a carrier never covers a cashier’s face', () => {
    const bad: string[] = [];
    for (const shop of busyShops()) {
      const faces = staffFaces(shop.lay);
      frames(shop, 1).forEach((cast, f) => {
        for (const c of cast)
          if (c.deps && c.deps.length) {
            const r = popRect(P(c.props.x, c.props.y, 52), 80);
            for (const fc of faces) if (r.x0 < fc.x1 && r.x1 > fc.x0 && r.y0 < fc.y1 && r.y1 > fc.y0) bad.push(`${shop.name} f${f} ${c.key}`);
          }
      });
    }
    expect(bad.slice(0, 5)).toEqual([]);
  });
  test('the walk-in waiting at the register never stacks with the driver anywhere (> 15%)', () => {
    const bad: string[] = [];
    for (const shop of busyShops())
      for (const pace of [1, 2.6])
        frames(shop, pace).forEach((cast, f) => {
          const waiting = cast.filter((c) => c.role === 'walkin' && !c.props.step && c.props.kind !== 'sit');
          const drivers = cast.filter((c) => c.role === 'driver');
          for (const w of waiting) for (const d of drivers) if (overlap(box(w), box(d)) > 0.15) bad.push(`${shop.name} pace${pace} f${f}`);
        });
    expect(bad.slice(0, 5)).toEqual([]);
  });
});

describe('drivers and diners (D353)', () => {
  test('no seated diner in front of a driver covers more than 15% of him standing (30% walking past), in any frame', () => {
    const bad: string[] = [];
    for (const shop of busyShops())
      for (const pace of [1, 2.6])
        frames(shop, pace).forEach((cast, f) => {
          const drivers = cast.filter((c) => c.role === 'driver');
          const sitters = cast.filter((c) => c.props.kind === 'sit');
          for (const d of drivers) for (const s of sitters) if (s.props.y < d.props.y && overlap(box(d), box(s)) > (d.props.step ? 0.3 : 0.15)) bad.push(`${shop.name} pace${pace} f${f} ${s.key}@${s.props.x.toFixed(0)},${s.props.y.toFixed(0)} over ${d.key}@${d.props.x.toFixed(0)},${d.props.y.toFixed(0)}${d.props.step ? "w" : "s"} ${overlap(box(d), box(s)).toFixed(2)}`);
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

describe('the doorway sign (D377)', () => {
  const headOf = (c: CastMember) => {
    const b = box(c);
    return { x0: b.x0, x1: b.x1, y0: b.y0, y1: b.y0 + (b.y1 - b.y0) * 0.3 };
  };
  const hits = (a: Box, r: { x0: number; x1: number; y0: number; y1: number }) => a.x0 < r.x1 && a.x1 > r.x0 && a.y0 < r.y1 && a.y1 > r.y0;
  test('no standing head (order spot, outside pause, pickup) or walking guest/driver head meets the PIZZERIA plank, in any frame', () => {
    const bad: string[] = [];
    for (const shop of busyShops()) {
      const sign = doorwaySignRect(shop.lay);
      for (const pace of [1, 2.6])
        frames(shop, pace).forEach((cast, f) => {
          for (const c of cast)
            if ((c.role === 'walkin' && c.props.kind !== 'sit') || c.role === 'driver') if (hits(headOf(c), sign)) bad.push(`${shop.name} pace${pace} f${f} ${c.key}@${c.props.x.toFixed(0)},${c.props.y.toFixed(0)}`);
        });
    }
    expect(bad.slice(0, 5)).toEqual([]);
  });
  test('the order spot and the pickup spots keep their heads clear of the plank (and a figure by the door would not)', () => {
    for (const shop of busyShops()) {
      const sign = doorwaySignRect(shop.lay);
      const at = (x: number, y: number, role: 'walkin' | 'driver'): CastMember => ({ key: 'p', sortY: y, role, props: { x, y, kind: role === 'driver' ? 'driver' : 'guest', step: 0 } });
      for (const [x, y] of shop.lay.orderSpots.slice(0, 1)) expect([shop.name, 'order', hits(headOf(at(x, y, 'walkin')), sign)]).toEqual([shop.name, 'order', false]);
      for (const sp of shop.lay.spots) expect([shop.name, 'pickup', hits(headOf(at(sp.x, sp.y, 'driver')), sign)]).toEqual([shop.name, 'pickup', false]);
      expect(hits(headOf(at(shop.lay.counter.x1 + 4, 60, 'walkin')), sign)).toBe(true); // the v5.2 spot, at the counter's right end by the door
    }
  });
});

describe('seated diners have chairs (D354)', () => {
  test('every seated figure sits on a chair drawn at a table seat, in any frame', () => {
    const bad: string[] = [];
    for (const shop of busyShops())
      for (const pace of [1, 2.6])
        frames(shop, pace).forEach((cast, f) => {
          for (const c of cast)
            if (c.props.kind === 'sit' && !shop.lay.tables.some((tb) => Math.abs(tb.y - c.props.y) < 0.01 && Math.abs(Math.abs(c.props.x - tb.x) - SEAT) < 0.01)) bad.push(`${shop.name} pace${pace} f${f} ${c.key}@${c.props.x.toFixed(1)},${c.props.y}`);
        });
    expect(bad.slice(0, 5)).toEqual([]);
  });
});

// ---------- v5.11: the sidewalk queues, the patio and walk-ins at every table ----------

const SIDE_FPS = 8;
const SIDE_SECONDS = 60;
/** A phone as narrow as an iPhone SE (375 pt): the scene scales down to 375/393, which makes the sidewalk row tallest in scene units. */
const NARROW_S = 375 / 393;

/** The top edge (scene units) of the sidewalk row on a phone where the scene is scaled by `s`. `stacked`: the no-GM hire stack. */
const rowTop = (s: number, stacked: boolean) =>
  SCENE_H - ((SCENE_H - CURB_Y) * s + (stacked ? SIDEWALK_ROW.raiseIdle + SIDEWALK_ROW.idleStackHeight : SIDEWALK_ROW.raiseManaged + SIDEWALK_ROW.cardHeight)) / s;

interface SideShop {
  name: string;
  lay: ReturnType<typeof layout>;
  patio: number;
  queue: { diners: number; drivers: number };
  idle: boolean;
  tables: number;
  shopSeed: number;
  pal: ReturnType<typeof seatPalette>;
}
/** Every footprint with a full sidewalk (4 hungry diners, 5 idle drivers, 2 patio tables), a lone starter table, and an idle shop. */
function* sideShops(): Generator<SideShop> {
  for (let fp = 0; fp < 5; fp++)
    for (const [tag, tables, patio, idle] of [['full', 6, 2, false], ['solo', 1, 0, false], ['idle', 6, 2, true]] as const) {
      const lay = layout(fp, Math.min(fp + 1, 6), 3, 2, tables, DRIVER_SLOTS[fp], 1);
      const shopSeed = 97 * (fp + 3);
      const pal = seatPalette(hash32(shopSeed) % 8, hash32(shopSeed + 9) % 6, 8, 6, lay.tables.length + patio);
      yield { name: `fp${fp} ${tag}`, lay, patio, queue: { diners: 4, drivers: 5 }, idle, tables, shopSeed, pal };
    }
}
const sideCache = new Map<string, CastMember[][]>();
function sideFrames(sh: SideShop) {
  let out = sideCache.get(sh.name);
  if (!out) {
    out = [];
    let crew: CrewState = emptyCrew();
    const r: LineRates = { prep: 6, oven: 6, serve: 6, shop: 4, price: 5, walkInFraction: 0.9, tapBatch: 4 };
    let line: Line = emptyLine();
    for (let f = 0; f < SIDE_SECONDS * SIDE_FPS; f++) {
      const clock = f / SIDE_FPS;
      line = advanceLine(line, 1 / SIDE_FPS, r, AUTOMATIC).line;
      crew = stepCrew(crew, { lay: sh.lay, walkins: true, idle: sh.idle, patio: sh.patio, departures: line.departures }, clock, SCENE_W);
      out.push(buildCast({ lay: sh.lay, shop: { drivers: 12, tables: 40, prep: 120 }, running: true, pace: 1.5, clock, shopSeed: sh.shopSeed, nIdx: 1, pal: sh.pal, crew, queue: sh.queue }).cast);
    }
    sideCache.set(sh.name, out);
  }
  return out;
}
const queuers = (cast: CastMember[]) => cast.filter((c) => c.role === 'queue');

describe('the sidewalk row never cuts a figure off (D408)', () => {
  test('no sidewalk figure stands below the top of the row that is up, less 4 pt, on a 375 pt phone and wider', () => {
    const bad: string[] = [];
    for (const sh of sideShops())
      for (const cast of sideFrames(sh)) {
        // the hire stack when the shop has no GM, else the station cards
        for (const s of [NARROW_S, 1, 1.3]) {
          const top = rowTop(s, sh.idle) - 4;
          for (const c of cast) if (c.props.y < 0 && P(c.props.x, c.props.y)[1] > top) bad.push(`${sh.name} s${s.toFixed(2)} ${c.key} feet ${P(c.props.x, c.props.y)[1].toFixed(1)} > ${top.toFixed(1)}`);
        }
      }
    expect([...new Set(bad)].slice(0, 5)).toEqual([]);
  });
  test('the queue and patio spots clear even the tallest (stacked hire) row, so they could stand beside either', () => {
    for (const sh of sideShops()) {
      const top = rowTop(NARROW_S, true) - 4;
      for (const [x, y] of [...sh.lay.queue, ...sh.lay.driverQueue, ...sh.lay.patio.map((p) => [p.x, p.y] as [number, number])]) expect([sh.name, P(x, y)[1] <= top]).toEqual([sh.name, true]);
    }
  });
  test('an idle shop keeps the sidewalk clear: no queue, no patio, no walk-in on the patio', () => {
    for (const sh of sideShops()) {
      if (!sh.idle) continue;
      expect(sidewalkOf(sh.lay, { idle: true, patio: 2 }, sh.queue)).toEqual({ patio: 0, diners: 0, drivers: 0, waiting: 0 });
      for (const cast of sideFrames(sh)) expect(queuers(cast)).toEqual([]);
    }
  });
});

describe('the sidewalk queues', () => {
  const points = (sh: SideShop) => sh.lay.queue.concat(sh.lay.driverQueue);
  const standing = (x: number, y: number, kind: 'guest' | 'driver' = 'guest'): CastMember => ({ key: 'p', sortY: y, role: 'walkin', props: { x, y, kind, step: 0 } });

  test('a full queue is 4 diners left of the door and up to 3 drivers right of it, and the tag counts the rest', () => {
    for (const sh of sideShops()) {
      if (sh.idle || sh.tables === 1) continue;
      const cast = sideFrames(sh)[100];
      const q = queuers(cast);
      expect([sh.name, q.filter((c) => c.props.kind === 'guest').length]).toEqual([sh.name, 4]);
      expect([sh.name, q.filter((c) => c.props.kind === 'driver').length]).toEqual([sh.name, sh.lay.driverQueue.length]);
      expect(sh.lay.driverQueue.length).toBeGreaterThanOrEqual(1);
      expect(sh.lay.driverQueue.length).toBeLessThanOrEqual(3);
      for (const c of q) expect([sh.name, c.props.kind === 'guest' ? c.props.x < sh.lay.door.x0 : c.props.x > sh.lay.door.x1]).toEqual([sh.name, true]);
      for (const c of q) expect([sh.name, c.props.kind === 'guest' ? !c.props.flip : !!c.props.flip]).toEqual([sh.name, true]); // diners face the door, drivers face left
      const s = sidewalkOf(sh.lay, { idle: false, patio: 2 }, sh.queue);
      expect(s.waiting).toBe(sh.queue.drivers > sh.lay.driverQueue.length ? sh.queue.drivers : 0);
      expect(sidewalkOf(sh.lay, { idle: false, patio: 0 }, { diners: 0, drivers: sh.lay.driverQueue.length }).waiting).toBe(0);
    }
  });
  test('queue figures stand fully on screen, never on the mat, and miss each other (< 30%)', () => {
    for (const sh of sideShops()) {
      const mat = matBox(sh.lay);
      for (const cast of sideFrames(sh).filter((_, f) => f % 7 === 0)) {
        const q = queuers(cast).map((c) => ({ c, b: box(c) }));
        for (const a of q) {
          expect([sh.name, a.c.key, a.b.x0 >= 0 && a.b.x1 <= SCENE_W]).toEqual([sh.name, a.c.key, true]);
          expect([sh.name, a.c.key, overlap(a.b, mat) <= 0.2]).toEqual([sh.name, a.c.key, true]);
          for (const o of q) if (a !== o) expect([sh.name, a.c.key, o.c.key, overlap(a.b, o.b) < 0.3]).toEqual([sh.name, a.c.key, o.c.key, true]);
        }
      }
    }
  });
  test('they miss the door lanes: at least ~half a figure (12) from the walk-in and driver lanes outside and in', () => {
    for (const sh of sideShops()) {
      const ln = sh.lay.door.lanes;
      for (const c of queuers(sideFrames(sh)[100]))
        for (const lx of [ln.guestPauseX, ln.driverPauseX, ln.guestX, ln.driverX]) expect([sh.name, c.key, lx, Math.abs(c.props.x - lx) >= 12]).toEqual([sh.name, c.key, lx, true]);
      // …and no lane's standing figure covers a queue figure (> 20%) once it is in the doorway
      for (const c of queuers(sideFrames(sh)[100])) for (const l of [standing(ln.guestX, 8), standing(ln.driverX, 8, 'driver')]) expect([sh.name, c.key, overlap(box(c), box(l)) <= 0.2]).toEqual([sh.name, c.key, true]);
    }
  });
  test('they stand behind the parked vehicle, which covers at most their feet (< 20%), and clear of the patio tables (< 10%)', () => {
    for (const sh of sideShops()) {
      const { x, y } = sh.lay.scooter;
      const [vx, vy] = P(x, y);
      const k = kAt(y);
      const vehicle: Box = { x0: vx - VEHICLE_HALF_W * k, x1: vx + VEHICLE_HALF_W * k, y0: vy - 30, y1: vy + 2 };
      const sets = sh.lay.patio.map((p) => {
        const [sx, sy] = P(p.x, p.y);
        const kk = kAt(p.y);
        return { x0: sx - (PATIO_SEAT + 13) * kk, x1: sx + (PATIO_SEAT + 13) * kk, y0: sy - 50, y1: sy };
      });
      for (const c of queuers(sideFrames(sh)[100])) {
        expect([sh.name, c.key, 'vehicle', overlap(box(c), vehicle) < 0.2]).toEqual([sh.name, c.key, 'vehicle', true]);
        if (c.props.kind === 'guest') for (const set of sets) expect([sh.name, c.key, 'patio', overlap(box(c), set) < 0.1]).toEqual([sh.name, c.key, 'patio', true]);
      }
    }
  });
  test('a walker passing in front covers a queue figure (> 50%) in under 15% of frames', () => {
    for (const sh of sideShops()) {
      if (sh.idle) continue;
      const fs = sideFrames(sh);
      let bad = 0;
      for (const cast of fs) {
        const q = queuers(cast).map(box);
        const movers = cast.filter((c) => c.role !== 'queue' && c.props.step && c.props.y < 0).map(box);
        if (movers.some((m) => q.some((b) => m.y1 > b.y1 && overlap(m, b) > 0.5))) bad++;
      }
      expect([sh.name, bad / fs.length < 0.15]).toEqual([sh.name, true]);
    }
  });
  test('the "×N waiting" tag fits on screen for any count and points at the last driver spot', () => {
    for (const sh of sideShops())
      for (const n of [4, 9, 10, 99, 1234]) {
        const t = waitTagAt(sh.lay, n);
        expect([sh.name, n, t.x - t.w / 2 >= 0, t.x + t.w / 2 <= SCENE_W, t.w === waitTagWidth(n)]).toEqual([sh.name, n, true, true, true]);
        expect(Math.abs(t.x + t.tail - P(sh.lay.waitTag[0], sh.lay.waitTag[1])[0])).toBeLessThan(0.01);
      }
  });
});

describe('the patio and walk-ins at every table', () => {
  test('patio chairs sit on no walker\'s or driver\'s route (a patio guest touches only their own chair)', () => {
    for (const sh of sideShops()) {
      if (sh.idle || !sh.patio) continue;
      const R = routesFor(sh.lay, SCENE_W, false, sh.patio);
      const chairs = sh.lay.patio.flatMap((p) => [p.x - PATIO_SEAT, p.x + PATIO_SEAT].map((cx) => ({ cx, cy: p.y })));
      const legs: { name: string; pts: readonly [number, number][]; own: number | null }[] = [
        { name: 'driver toDoor', pts: R.driver.toDoor.pts, own: null },
        { name: 'driver away', pts: R.driver.away.pts, own: null },
        { name: 'driver back', pts: R.driver.back.pts, own: null },
      ];
      R.guests.forEach((g, n) => {
        legs.push({ name: `guest${n} arrive`, pts: g.arrive.pts, own: null }, { name: `guest${n} giveUp`, pts: g.giveUp.pts, own: null });
        for (const [nm, route] of [['toSeat', g.toSeat], ['leave', g.leave]] as const) legs.push({ name: `guest${n} ${nm}`, pts: route.pts, own: g.patio ? g.seat[0] : null });
      });
      for (const L of legs)
        for (let d = 0; d <= 1500; d += 1) {
          const [x, y] = alongDist(L.pts, d);
          for (const c of chairs) {
            if (L.own !== null && Math.abs(c.cx - L.own) < 0.01) continue;
            expect([sh.name, L.name, Math.abs(x - c.cx) < 11 && Math.abs(y - c.cy) < 5]).toEqual([sh.name, L.name, false]);
          }
        }
    }
  });
  test('walk-ins sit at every table, the patio\'s too, and no seated figure overlaps another (> 10%)', () => {
    for (const sh of sideShops()) {
      if (sh.idle) continue;
      const cast = sideFrames(sh);
      const seats = new Set<string>();
      cast.forEach((frame, f) => {
        const sitters = frame.filter((c) => c.props.kind === 'sit').map((c) => ({ c, b: box(c) }));
        for (const w of sitters) if (w.c.role === 'walkin') seats.add(`${w.c.props.x.toFixed(1)},${w.c.props.y}`);
        // indoors with indoors, patio with patio (the sidewalk stands in front of the room, so a patio diner always crosses the front row in perspective)
        for (const a of sitters) for (const o of sitters) if (a !== o && a.c.props.y < 0 === o.c.props.y < 0) expect([sh.name, f, a.c.key, o.c.key, overlap(a.b, o.b) <= 0.1]).toEqual([sh.name, f, a.c.key, o.c.key, true]);
      });
      const want = [...sh.lay.tables.map((t) => `${(t.x + SEAT).toFixed(1)},${t.y}`), ...sh.lay.patio.slice(0, sh.patio).map((t) => `${(t.x + PATIO_SEAT).toFixed(1)},${t.y}`)];
      expect([sh.name, want.filter((w) => !seats.has(w))]).toEqual([sh.name, []]);
    }
  });
  test('every seated figure sits on a chair of a room table or a patio table', () => {
    for (const sh of sideShops()) {
      if (sh.idle) continue;
      for (const frame of sideFrames(sh).filter((_, f) => f % 5 === 0))
        for (const c of frame) {
          if (c.props.kind !== 'sit') continue;
          const room = sh.lay.tables.some((tb) => Math.abs(tb.y - c.props.y) < 0.01 && Math.abs(Math.abs(c.props.x - tb.x) - SEAT) < 0.01);
          const out = sh.lay.patio.slice(0, sh.patio).some((tb) => Math.abs(tb.y - c.props.y) < 0.01 && Math.abs(Math.abs(c.props.x - tb.x) - PATIO_SEAT) < 0.01);
          expect([sh.name, c.key, room || out]).toEqual([sh.name, c.key, true]);
        }
    }
  });
  test('a patio walk-in is served inside, walks out the door and along the curb lane to the chair, and walks back the same way', () => {
    const lay = layout(2, 3, 2, 2, 6, 3, 0);
    const R = routesFor(lay, SCENE_W, false, 2);
    expect(R.guests.length).toBe(lay.tables.length + 2);
    const g = R.guests[lay.tables.length];
    expect(g.patio).toBe(true);
    expect(g.seat[0]).toBeCloseTo(lay.patio[0].x + PATIO_SEAT);
    const exit = alongDist(g.toSeat.pts, 1e9);
    expect(exit).toEqual(g.seat);
    expect(g.toSeat.pts.some(([x, y]) => x === lay.door.lanes.guestPauseX && y < 0)).toBe(true);
    expect(routesFor(lay, SCENE_W, true, 2).guests.length).toBe(lay.tables.length); // idle: no patio
  });
});
