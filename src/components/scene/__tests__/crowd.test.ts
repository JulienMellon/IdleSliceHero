/// <reference types="jest" />
// Crowd budgets: simulate the cast frame by frame for busy shops and check, in screen space, that moving
// people don't sit on top of the kitchen crew, each other, or the WELCOME mat for more than a moment.
import { buildCast, sidewalkOf, type CastMember } from '../cast';
import { alongDist, emptyCrew, routesFor, stepCrew, type CrewState } from '../crew';
import { advanceLine, AUTOMATIC, emptyLine, type Line, type LineRates } from '../../../engine/pipeline';
import { BACK_ROW_Y, DRIVER_QUEUE_PITCH, DRIVER_SPOTS, FEET_IN, NEAR_ROW_Y, PATIO_HALF_W, PATIO_SEAT, PROP_Y, QUEUE_PITCH, QUEUE_Y, SEAT, TABLE_SET_HALF, TAG_MARGIN, TREE_Y, VEHICLE_HALF_W, WAIT_TAG_Z, layout, moreTagAt, moreTagRect, waitTagAt, waitTagRect, waitTagWidth } from '../layout';
import { driverCast, hash32, lookFor } from '../looks';
import { driverFigures, queueLabel, queueOverflow, waitingText } from '../waiting';
import { seatPalette } from '../palette';
import { CURB_Y, FRONT_TOP, P, SCENE_H, SCENE_W, kAt, unprojectX } from '../projection';
import { SIDEWALK_ROW } from '../../tap-targets';
import { PILL_UMBRELLA_AIR, UMBRELLA_TOP } from '../patio-deck';
import { doorwaySignRect, placePops, popPlace, popRect, popsCover, popWidth, spotlightCutout, staffFaces, stationRects, tutorialHand } from '../stations';
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
      // the starter shop's level cap (25) allows two cooks at most: its 54 pt bench beside the oven bay seats no more
      const lay = layout(fp, Math.min(fp + 1, 6), fp === 0 ? 2 : 3, 2, tables, DRIVER_SLOTS[fp], 1);
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
/** Every footprint with a full sidewalk (4 hungry diners, 37 idle drivers = 4 figures, every patio table the layout has room for), a lone starter table, and an idle shop. */
function* sideShops(): Generator<SideShop> {
  for (let fp = 0; fp < 5; fp++)
    for (const [tag, tables, patio, idle] of [['full', 6, 2, false], ['solo', 1, 0, false], ['idle', 6, 2, true]] as const) {
      const lay = layout(fp, Math.min(fp + 1, 6), 3, 2, tables, DRIVER_SLOTS[fp], 1);
      const shopSeed = 97 * (fp + 3);
      const pal = seatPalette(hash32(shopSeed) % 8, hash32(shopSeed + 9) % 6, 8, 6, lay.tables.length + patio);
      yield { name: `fp${fp} ${tag}`, lay, patio: Math.min(patio, lay.patio.length), queue: { diners: 4, drivers: 37 }, idle, tables, shopSeed, pal };
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
      expect(sidewalkOf(sh.lay, { idle: true, patio: 2 }, sh.queue)).toEqual({ patio: 0, diners: 0, drivers: 0, waiting: 0, more: 0 });
      for (const cast of sideFrames(sh)) expect(queuers(cast)).toEqual([]);
    }
  });
});

describe('the sidewalk queues', () => {
  const standing = (x: number, y: number, kind: 'guest' | 'driver' = 'guest'): CastMember => ({ key: 'p', sortY: y, role: 'walkin', props: { x, y, kind, step: 0 } });

  test('a full lane is 3 drivers nearest the door and the diners the shop front leaves room for left of them, all facing the door; the pills count the rest', () => {
    for (const sh of sideShops()) {
      if (sh.idle || sh.tables === 1) continue;
      const cast = sideFrames(sh)[100];
      const q = queuers(cast);
      expect([sh.name, q.filter((c) => c.props.kind === 'guest').length]).toEqual([sh.name, sh.lay.queue.length]);
      expect([sh.name, q.filter((c) => c.props.kind === 'driver').length]).toEqual([sh.name, 3]);
      // D431: the drivers stand nearest the door, the diners left of the last driver
      const lastDriverX = sh.lay.driverQueue[sh.lay.driverQueue.length - 1][0];
      for (const c of q) expect([sh.name, c.props.kind === 'guest' ? c.props.x < lastDriverX : c.props.x < sh.lay.door.x0]).toEqual([sh.name, true]);
      for (const c of q) expect([sh.name, !c.props.flip]).toEqual([sh.name, true]); // everyone faces the door
      const s = sidewalkOf(sh.lay, { idle: false, patio: 2 }, sh.queue);
      expect(s.waiting).toBe(37);
      expect(s.more).toBe(Math.max(0, 4 - sh.lay.queue.length));
      expect(sidewalkOf(sh.lay, { idle: false, patio: 0 }, { diners: 0, drivers: 1 }).waiting).toBe(0); // one driver: one figure, nothing left to count
    }
  });

  // G90: the old scene drew as many drivers as the footprint had room for (×29 idle: 1 figure, ×9: 3, ×37: 2)
  test('G90/D430: the idle drivers drawn are min(3, ceil(n / 10)) at every footprint, and the same in every frame', () => {
    const want = (n: number) => (n <= 0 ? 0 : Math.min(3, Math.ceil(n / 10)));
    expect([0, 1, 9, 10, 11, 29, 30, 31, 37, 40, 41, 125].map(driverFigures)).toEqual([0, 1, 1, 1, 2, 3, 3, 3, 3, 3, 3, 3]);
    for (let fp = 0; fp < 5; fp++) {
      const lay = layout(fp, 3, 3, 2, 6, DRIVER_SLOTS[fp], 1);
      const pal = seatPalette(1, 2, 8, 6, lay.tables.length);
      for (const n of [0, 1, 9, 10, 11, 29, 30, 31, 37, 40, 99]) {
        expect([fp, n, sidewalkOf(lay, { idle: false, patio: 0 }, { diners: 0, drivers: n }).drivers]).toEqual([fp, n, want(n)]);
        const crew: CrewState = emptyCrew();
        let keys = '';
        for (let f = 0; f < 30; f++) {
          const { cast } = buildCast({ lay, shop: { drivers: 12, tables: 40, prep: 120 }, running: true, pace: 1, clock: f / 15, shopSeed: 1234, nIdx: 1, pal, crew, queue: { diners: 0, drivers: n } });
          const k = queuers(cast).filter((c) => c.props.kind === 'driver').map((c) => `${c.key}:${c.props.seed}`).join(',');
          if (f === 0) keys = k;
          expect([fp, n, f, k]).toEqual([fp, n, f, keys]); // no flicker: the same figures with the same faces every frame
        }
        expect([fp, n, keys === '' ? 0 : keys.split(',').length]).toEqual([fp, n, want(n)]);
      }
    }
  });
  test('D416: the drivers are a cast: distinct skin and hair, at most one moustache, one on a phone, a depth stagger', () => {
    const shops = [97 * 3, 97 * 4, 97 * 5, 1234, 7, 0, 997 * 97, 31337];
    for (const seed of shops) {
      const cast = driverCast(seed);
      expect(cast).toHaveLength(4);
      const looks = cast.map((c) => lookFor(c.seed, true));
      expect([seed, new Set(looks.map((l) => l.skin)).size]).toEqual([seed, 4]);
      expect([seed, new Set(looks.map((l) => l.hair)).size]).toEqual([seed, 4]);
      expect([seed, looks.filter((l) => l.trait === 2).length <= 1]).toEqual([seed, true]);
      expect([seed, looks.slice(0, 3).filter((l) => l.trait === 2).length <= 1]).toEqual([seed, true]); // no moustache on at least two of three
      expect([seed, cast.filter((c) => c.phone).length]).toEqual([seed, 1]);
      expect(driverCast(seed)).toBe(cast); // stable
    }
    const sh = [...sideShops()].find((x) => x.name === 'fp3 full')!;
    const w = queuers(sideFrames(sh)[100]).filter((c) => c.props.kind === 'driver');
    expect(w.filter((c) => c.props.act === 'phone')).toHaveLength(1);
    expect(new Set(w.map((c) => Math.round(P(c.props.x, c.props.y)[1] / 2))).size).toBeGreaterThanOrEqual(3); // at three or more heights (D430)
  });
  // D430: the queued drivers overlapped ~40% at one height, feet on the sill. v5.14: the real silhouette (torso, cap and its brim) is what is measured,
  // there are three drivers at most (the pill counts the rest) and the feet stand 7 pt or more in front of the sill.
  test('D430: queued drivers stand 30 apart, at most 3, overlapping under 15% by their drawn silhouette, at three heights, feet 7 pt or more in front of the shop front', () => {
    const sill = P(0, 0)[1];
    for (const sh of sideShops()) {
      if (sh.idle) continue;
      expect([sh.name, sh.lay.driverQueue.length <= 3, DRIVER_SPOTS]).toEqual([sh.name, true, 3]);
      const drivers = sh.lay.driverQueue.map(([x, y]) => figureAt(x, y, 'driver'));
      drivers.forEach((a, i) => {
        if (i) {
          expect([sh.name, i, overlap(box(drivers[i - 1]), box(a))]).toEqual([sh.name, i, 0]);
          expect([sh.name, i, silhouetteOverlap(drivers[i - 1], a) < 0.15]).toEqual([sh.name, i, true]);
        }
        expect([sh.name, i, P(a.props.x, a.props.y)[1] - sill >= FEET_IN - 1e-6, FEET_IN >= 7]).toEqual([sh.name, i, true, true]);
      });
      const rows = new Set(drivers.map((d) => Math.round(P(d.props.x, d.props.y)[1] * 2)));
      expect([sh.name, rows.size >= 3]).toEqual([sh.name, true]);
      const ys = drivers.map((d) => P(d.props.x, d.props.y)[1]);
      expect([sh.name, Math.max(...ys) - Math.min(...ys) <= 6.01, Math.max(...ys) - Math.min(...ys) >= 5.5]).toEqual([sh.name, true, true]);
      // the check can fail: the v5.13 lane (26 apart, feet 6 in front) touched by the brim and stood too close to the sill; the 22 apart lane before it overlapped badly
      const old = [0, 1, 2, 3].map((j) => figureAt(unprojectX(P(sh.lay.driverQueue[0][0], -3)[0] - 26 * j, -3), -3, 'driver'));
      expect(silhouetteOverlap(old[0], old[1])).toBeGreaterThan(0); // the brim met the next cap
      expect(silhouetteOverlap(drivers[0], drivers[1])).toBe(0);
      expect(P(old[0].props.x, old[0].props.y)[1] - sill).toBeLessThan(7);
      const older = [0, 1, 2, 3].map((j) => figureAt(unprojectX(P(sh.lay.driverQueue[0][0], -3)[0] - 22 * j, -3), -3, 'driver'));
      expect(overlap(box(older[0]), box(older[1]))).toBeGreaterThan(0.05);
    }
  });
  // D431: the diner queue shared its floor band with the queued driver and the seated diner (a five-head clump)
  test('D431: the drivers stand at the door (the first at x ≥ 250), every diner left of every driver with a clear gap, and no queue figure crowds a seated patio diner', () => {
    for (const sh of sideShops()) {
      if (sh.idle) continue;
      const diners = sh.lay.queue.map(([x, y]) => P(x, y)[0]);
      const drivers = sh.lay.driverQueue.map(([x, y]) => P(x, y)[0]);
      expect([sh.name, drivers[0] >= 250]).toEqual([sh.name, true]);
      expect([sh.name, Math.max(...diners) < Math.min(...drivers)]).toEqual([sh.name, true]);
      expect([sh.name, Math.min(...drivers) - Math.max(...diners) >= 29.9]).toEqual([sh.name, true]);
      // no five-head clump: any 60 pt window of the lane holds at most three queue heads
      const heads = [...diners, ...drivers];
      for (const h of heads) expect([sh.name, h, heads.filter((o) => o >= h && o < h + 60).length <= 3]).toEqual([sh.name, h, true]);
      for (const cast of sideFrames(sh).filter((_, f) => f % 5 === 0)) {
        const q = queuers(cast).map((c) => box(c));
        for (const c of cast) if (c.props.kind === 'sit' && c.props.y < 0) for (const b of q) expect([sh.name, c.key, overlap(box(c), b) <= 0.05]).toEqual([sh.name, c.key, true]);
      }
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
  test('D420/D421: the pills stay 12 pt inside the screen for any text, the drivers\' one points at the group and the "+N" over the last diner (or the first spot when none fit)', () => {
    const texts = ['1 driver idle', '11 drivers idle · buy Ovens', '29 drivers idle · buy Prep + Ovens', '1234 drivers idle · buy all three'];
    for (const sh of sideShops())
      for (const text of texts) {
        const t = waitTagAt(sh.lay, text);
        expect([sh.name, text, t.x - t.w / 2 >= TAG_MARGIN - 1e-6, t.x + t.w / 2 <= SCENE_W - TAG_MARGIN + 1e-6, t.w === waitTagWidth(text)]).toEqual([sh.name, text, true, true, true]);
        expect(Math.abs(t.x + t.tail - P(sh.lay.waitTag[0], sh.lay.waitTag[1])[0])).toBeLessThan(0.01);
      }
    for (const sh of sideShops()) {
      const m = moreTagAt(sh.lay, '+1');
      expect(Math.abs(m.x - P(...sh.lay.queueTag)[0])).toBeLessThan(0.01);
      // the two pills never meet: the "+N" hangs lower than the drivers' (taller) one
      const t = waitTagAt(sh.lay, texts[1]);
      const sepY = m.y - t.y;
      const sepX = Math.abs(m.x - t.x) < (m.w + t.w) / 2;
      expect([sh.name, sepX ? sepY >= 17 : true]).toEqual([sh.name, true]);
    }
    expect(TAG_MARGIN).toBe(12);
  });
  test('D421: the pill names how many drivers wait and which station to buy', () => {
    expect(waitingText(29, ['ovens'])).toBe('29 drivers idle · buy Ovens');
    expect(waitingText(1, ['prep'])).toBe('1 driver idle · buy Prep');
    expect(waitingText(12, ['counter', 'prep'])).toBe('12 drivers idle · buy Prep + Counter');
    expect(waitingText(12, ['prep', 'ovens', 'counter'])).toBe('12 drivers idle · buy all three');
    expect(waitingText(12, ['customers'])).toBe('12 drivers idle'); // nothing to buy in the kitchen
    expect(queueOverflow(4, 3)).toBe(1);
    expect(queueOverflow(2, 3)).toBe(0);
  });
});

// ---------- D414: the budgets that fail on the v5.11 sidewalk ----------
// Boxes are the real drawn extents in screen units: a figure (box()), a patio set (chairs ±26.5, canopy to 73 up), the umbrella canopy,
// the wall's left pilaster, the potted tree (pot ±12, crown to 55 up), the signature prop (per kind), the parked vehicle (±24, 30 up).
type Lay = ReturnType<typeof layout>;
const setBox = (p: { x: number; y: number }): Box => {
  const [sx, sy] = P(p.x, p.y);
  const k = kAt(p.y) * 1.1;
  return { x0: sx - 26.5 * k, x1: sx + 26.5 * k, y0: sy - 73 * k, y1: sy };
};
const umbrellaBox = (p: { x: number; y: number }): Box => {
  const [sx, sy] = P(p.x, p.y);
  const k = kAt(p.y) * 1.1;
  return { x0: sx - 24 * k, x1: sx + 24 * k, y0: sy - 73 * k, y1: sy - 53 * k };
};
const pillarBox = (lay: Lay): Box => ({ x0: P(lay.L - 6, 0)[0], x1: P(lay.L + 8, 0)[0], y0: P(0, 0, FRONT_TOP)[1], y1: P(0, 0)[1] });
const treeBox = (lay: Lay): Box => {
  const [sx, sy] = P(Math.max(lay.L + 8, unprojectX(20, TREE_Y)), TREE_Y);
  return { x0: sx - 14, x1: sx + 14, y0: sy - 55, y1: sy };
};
/** x extents of each neighbourhood's signature prop around its anchor, and its height. */
const PROP_EXTENT = { newsbox: [-9, 9, 29], picket: [-30, 30, 22], bollard: [-20, 9, 20], bikerack: [-33, 33, 22], barrel: [-13, 15, 22], topiary: [-14, 28.6, 25] } as const;
const propBoxes = (lay: Lay): Box[] => {
  const [sx, sy] = P(lay.prop.x, PROP_Y);
  return Object.values(PROP_EXTENT).map(([a, b, h]) => ({ x0: sx + a, x1: sx + b, y0: sy - h, y1: sy }));
};
const vehicleBox = (lay: Lay): Box => {
  const [vx, vy] = P(lay.scooter.x, lay.scooter.y);
  const k = kAt(lay.scooter.y);
  // the roofline is 22 up (a car at 0.62 is ~25, a scooter's rear box and handlebars poke to 30 over ~12 pt): queue feet stand 6 pt in front of the shop front (D430), so they may sink a few pt behind a scooter's top but never reach its body
  return { x0: vx - VEHICLE_HALF_W * k, x1: vx + VEHICLE_HALF_W * k, y0: vy - 22, y1: vy + 2 };
};
const touches = (a: Box, b: Box) => a.x0 < b.x1 && a.x1 > b.x0 && a.y0 < b.y1 && a.y1 > b.y0;
const figureAt = (x: number, y: number, kind: 'guest' | 'driver' = 'guest'): CastMember => ({ key: 'f', sortY: y, role: 'queue', props: { x, y, kind, step: 0 } });
/**
 * A standing figure's drawn silhouette as boxes (screen units): the torso with its arms (−10 … +10.5, 0 … 50 up) and, for a driver, the cap whose brim
 * reaches +15.5 at head height (40 … 52 up). The plain `box()` (±11) leaves the brim out, which is why drivers 26 apart still touched.
 */
function silhouette(c: CastMember): Box[] {
  const [sx, sy] = P(c.props.x, c.props.y);
  const k = kAt(c.props.y) * 1.14;
  const body = { x0: sx - 10 * k, x1: sx + 10.5 * k, y0: sy - 50 * k, y1: sy };
  return c.props.kind === 'driver' ? [{ x0: sx - 10 * k, x1: sx + 15.5 * k, y0: sy - 52 * k, y1: sy - 40 * k }, { ...body, y0: sy - 40 * k }] : [body];
}
/** Overlapping area of two figures' silhouettes over the smaller one's area. */
function silhouetteOverlap(a: CastMember, b: CastMember): number {
  const area2 = (bs: Box[]) => bs.reduce((t, x) => t + area(x), 0);
  let shared = 0;
  for (const p of silhouette(a)) for (const q of silhouette(b)) {
    const w = Math.min(p.x1, q.x1) - Math.max(p.x0, q.x0);
    const h = Math.min(p.y1, q.y1) - Math.max(p.y0, q.y0);
    if (w > 0 && h > 0) shared += w * h;
  }
  return shared / Math.min(area2(silhouette(a)), area2(silhouette(b)));
}

/** The v5.11 sidewalk, as the old layout placed it: queue at −9 from d0 − 27 (19 apart), patio at d0 − 126 / d0 − 213. */
function oldSidewalk(lay: Lay) {
  const d0 = lay.door.x0;
  return {
    queue: Array.from({ length: 4 }, (_, i) => figureAt(d0 - 27 - 19 * i, -9)),
    patio: [126, 213].map((dx) => ({ x: d0 - dx, y: -12 })),
  };
}

describe('the sidewalk budgets (D414)', () => {
  const full = (lay: Lay) => [
    ...lay.queue.map(([x, y]) => figureAt(x, y)),
    ...lay.driverQueue.map(([x, y]) => figureAt(x, y, 'driver')),
  ];
  const lays = (): [string, Lay][] => [0, 1, 2, 3, 4].map((fp) => [`fp${fp}`, layout(fp, Math.min(fp + 1, 6), 3, 2, 6, DRIVER_SLOTS[fp], 1)]);

  test('the checks can fail: the v5.11 sidewalk had a queue figure over the patio, one against the parked vehicle, and an umbrella across the pillar', () => {
    const lay = layout(0, 1, 3, 2, 6, 2, 1);
    const old = oldSidewalk(lay);
    // (against the strict 30-tall silhouette the v5.11 budget used; vehicleBox now stops at the 22 roofline so the D430 queue can stand 6 pt out)
    expect(old.queue.some((f) => touches(box(f), { ...vehicleBox(lay), y0: vehicleBox(lay).y0 - 8 }))).toBe(true);
    const straddle = old.patio.map((p) => umbrellaBox(p)).some((u) => u.x0 < pillarBox(lay).x1 && u.x1 > pillarBox(lay).x0);
    expect(straddle).toBe(true);
    // the old table at d0 − 126 on a wider shop sat 4 pt from the last queue figure's elbow; any patio set under the queue's span fails the same budget
    const under = { x: old.queue[3].props.x - 6, y: -12 };
    expect(touches(box(old.queue[3]), setBox(under))).toBe(true);
  });
  test('no queue or driver figure overlaps a patio set (chairs, table or umbrella) or the parked vehicle, at any footprint', () => {
    for (const [name, lay] of lays())
      for (const f of full(lay)) {
        const b = box(f);
        for (const p of lay.patio) expect([name, f.props.x, 'patio', touches(b, setBox(p))]).toEqual([name, f.props.x, 'patio', false]);
        expect([name, f.props.x, 'vehicle', touches(b, vehicleBox(lay))]).toEqual([name, f.props.x, 'vehicle', false]);
      }
  });
  test('no queue or driver figure overlaps the potted tree or the neighbourhood\'s signature prop (whichever of the six it is)', () => {
    for (const [name, lay] of lays())
      for (const f of full(lay)) {
        const b = box(f);
        expect([name, f.props.x, 'tree', touches(b, treeBox(lay))]).toEqual([name, f.props.x, 'tree', false]);
        for (const pb of propBoxes(lay)) expect([name, f.props.x, 'prop', touches(b, pb)]).toEqual([name, f.props.x, 'prop', false]);
      }
  });
  test('every umbrella stands wholly inside the wall line (right of the left pilaster) and inside the screen', () => {
    for (const [name, lay] of lays())
      for (const p of lay.patio) {
        const u = umbrellaBox(p);
        const pil = pillarBox(lay);
        expect([name, u.x0 >= pil.x1, u.x0 >= 0, u.x1 <= SCENE_W]).toEqual([name, true, true, true]);
        expect([name, setBox(p).x0 >= pil.x1]).toEqual([name, true]); // chairs too
      }
  });
  test('the diner queue is single file along the door lane, 22 pt apart, the WELCOME mat and the signature prop stay in clear view', () => {
    for (const [name, lay] of lays()) {
      const xs = lay.queue.map(([x, y]) => P(x, y)[0]);
      expect([name, xs.every((x) => x >= 70), xs.length <= 4]).toEqual([name, true, true]);
      xs.forEach((x, i) => i && expect(xs[i - 1] - x).toBeCloseTo(QUEUE_PITCH, 5));
      expect(new Set(lay.queue.map(([, y]) => y)).size).toBeLessThanOrEqual(1); // one file: one depth
      if (lay.queue.length) expect(lay.queue[0][1]).toBe(QUEUE_Y);
      // the mat is untouched by any lane figure, and no figure stands in front of the prop to hide it
      const mat = matBox(lay);
      for (const f of full(lay)) {
        expect([name, f.props.x, overlap(box(f), mat) <= 0.2]).toEqual([name, f.props.x, true]);
        for (const pb of propBoxes(lay)) expect([name, f.props.x, f.props.y > PROP_Y, touches(box(f), pb)]).toEqual([name, f.props.x, true, false]);
      }
      expect(DRIVER_SPOTS).toBe(3);
      expect(DRIVER_QUEUE_PITCH).toBe(30);
      expect(PATIO_HALF_W).toBeGreaterThanOrEqual(26.5 * kAt(-12) * 1.1 - 0.5);
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
    const lay = layout(4, 3, 2, 2, 6, 4, 0);
    const n = lay.patio.length;
    expect(n).toBeGreaterThanOrEqual(1);
    const R = routesFor(lay, SCENE_W, false, 2);
    expect(R.guests.length).toBe(lay.tables.length + n);
    const g = R.guests[lay.tables.length];
    expect(g.patio).toBe(true);
    expect(g.seat[0]).toBeCloseTo(lay.patio[0].x + PATIO_SEAT);
    const exit = alongDist(g.toSeat.pts, 1e9);
    expect(exit).toEqual(g.seat);
    expect(g.toSeat.pts.some(([x, y]) => x === lay.door.lanes.guestPauseX && y < 0)).toBe(true);
    expect(routesFor(lay, SCENE_W, true, 2).guests.length).toBe(lay.tables.length); // idle: no patio
  });
});

// ---------- G91: the "+$" pop never covers the waiting pill ----------
describe('pops and the waiting pill (G91)', () => {
  const TEXTS = ['28 drivers idle · buy Prep + Ovens', '37 drivers idle · buy all three', '12 drivers idle · buy Counter', '11 drivers idle · buy Prep'];
  const hit = (a: { x0: number; x1: number; y0: number; y1: number }, b: { x0: number; x1: number; y0: number; y1: number }) => a.x0 < b.x1 && a.x1 > b.x0 && a.y0 < b.y1 && a.y1 > b.y0;
  /** Every pop on screen in a frame, as the scene draws it: riding a driver's head, or hanging over the register for a hand-over. */
  function pops(sh: SideShop, cast: CastMember[], keepOff: { x0: number; x1: number; y0: number; y1: number }[]) {
    const register = P(sh.lay.staff[0] + 12, 70, 78);
    const out: { rect: { x0: number; x1: number; y0: number; y1: number }; role: string }[] = [];
    for (const c of cast)
      if (c.deps?.length)
        for (const text of ['+$12', '×3 · +$12.3K'])
          for (const k of [0, 0.5, 1]) {
            const walkin = c.role === 'walkin';
            const at = walkin ? register : P(c.props.x, c.props.y, 52);
            out.push({ rect: popPlace(at, popWidth(text), { walkin, rideAlong: !walkin, k, keepOff, sceneW: SCENE_W }).rect, role: c.role });
          }
    return out;
  }
  test('with the pill\'s rect to keep off, no pop covers it or the "+N" pill, in any frame, at any footprint and for every instruction text', () => {
    const bad: string[] = [];
    for (const sh of sideShops()) {
      if (sh.idle) continue;
      for (const text of TEXTS) {
        const pill = [waitTagRect(sh.lay, text), moreTagRect(sh.lay, '+3')];
        sideFrames(sh).forEach((cast, f) => {
          for (const p of pops(sh, cast, pill)) for (const r of pill) if (hit(p.rect, r)) bad.push(`${sh.name} "${text}" f${f} ${p.role}`);
        });
      }
    }
    expect(bad.slice(0, 5)).toEqual([]);
  });
  test('the check can fail: placed the old way (no keep-off) the pop of the driver leaving the pickup spot lands on the pill\'s right end', () => {
    let covered = 0;
    for (const sh of sideShops()) {
      if (sh.idle) continue;
      const pill = [waitTagRect(sh.lay, TEXTS[0])];
      sideFrames(sh).forEach((cast) => {
        for (const p of pops(sh, cast, [])) if (pill.some((r) => hit(p.rect, r))) covered++;
      });
    }
    expect(covered).toBeGreaterThan(100);
  });
  test('a pop asked to keep off a rect still lifts to sit just above it (4 pt) on screen; the scene no longer asks (D439)', () => {
    const sh = [...sideShops()].find((x) => x.name === 'fp4 full')!;
    const pill = waitTagRect(sh.lay, TEXTS[0]);
    // a driver whose head is right under the pill's left half, so the unlifted pop would land on it
    const at: [number, number] = [pill.x0 + 40, pill.y1 + 4];
    const placed = popPlace(at, popWidth('+$12'), { walkin: false, rideAlong: true, k: 0, keepOff: [pill], sceneW: SCENE_W });
    expect(placed.rect.y1).toBeCloseTo(pill.y0 - 4, 6);
    expect(placed.rect.y0).toBeGreaterThan(0);
    expect(popPlace(at, popWidth('+$12'), { walkin: false, rideAlong: true, k: 0, sceneW: SCENE_W }).rect.y1).toBeGreaterThan(pill.y0);
  });
});

// ---------- D439: the "+$" pop stacked on the waiting pill into a 45 pt band across faces ----------
describe('the waiting pill and the pops never cover a face (D439)', () => {
  const TEXTS = ['28 drivers idle · buy Prep + Ovens', '37 drivers idle · buy all three', '12 drivers idle · buy Counter', '11 drivers idle · buy Prep'];
  const hit = (a: Box, b: Box) => a.x0 < b.x1 && a.x1 > b.x0 && a.y0 < b.y1 && a.y1 > b.y0;
  /** A figure's face (screen units): the head's 14 wide box, 31 … 47 up for a standing figure and 22 … 38 for a seated one (bodyBy: −30 / −21, head 9 above the shoulders). */
  const face = (c: CastMember): Box => {
    const [sx, sy] = P(c.props.x, c.props.y);
    const k = kAt(c.props.y) * 1.14;
    const [lo, hi] = c.props.kind === 'sit' ? [22, 38] : [31, 47];
    return { x0: sx - 7 * k, x1: sx + 7 * k, y0: sy - hi * k, y1: sy - lo * k };
  };
  const pillAt = (sh: SideShop, text: string, z: number) => {
    const [sx, sy] = P(sh.lay.waitTag[0], sh.lay.waitTag[1], z);
    const w = waitTagWidth(text);
    const x = Math.min(SCENE_W - TAG_MARGIN - w / 2, Math.max(TAG_MARGIN + w / 2, sx));
    return { x0: x - w / 2, x1: x + w / 2, y0: sy - 9.7, y1: sy + 12.7 };
  };

  test('the drivers\' pill covers no standing or seated face, in any frame, at any footprint and for every instruction text', () => {
    const bad: string[] = [];
    for (const sh of sideShops()) {
      if (sh.idle) continue;
      for (const text of TEXTS) {
        const t = waitTagAt(sh.lay, text);
        const pill = { x0: t.x - t.w / 2, x1: t.x + t.w / 2, y0: t.y - 9.7, y1: t.y + 8.7 }; // the pill's body (its 8 wide tail points down at the drivers)
        sideFrames(sh).forEach((cast, f) => {
          for (const c of cast) if (!c.props.step && hit(face(c), pill)) bad.push(`${sh.name} "${text}" f${f} ${c.key} ${JSON.stringify([c.props.x, c.props.y, c.props.kind, c.props.talk])} ${JSON.stringify(pill)}`); // (a walker crossing under it for a moment is not covered for long: the stills are the budget)
        });
      }
    }
    expect([...new Set(bad)].slice(0, 5)).toEqual([]);
  });
  test('the check can fail: the pill at the old height (z 96) sat across the face of the driver at the pickup spot', () => {
    expect(WAIT_TAG_Z).toBeLessThan(96);
    let covered = 0;
    for (const sh of sideShops()) {
      if (sh.idle) continue;
      const old = { ...pillAt(sh, TEXTS[0], 96), y1: pillAt(sh, TEXTS[0], 96).y1 - 4 };
      sideFrames(sh).forEach((cast) => {
        for (const c of cast) if (!c.props.step && hit(face(c), old)) covered++;
      });
    }
    expect(covered).toBeGreaterThan(100);
  });
  test('a pop that would land on a pill fades the pill instead of lifting above it: no visible pill and pop ever meet, and the pops are never lifted', () => {
    let faded = 0;
    let frames = 0;
    for (const sh of sideShops()) {
      if (sh.idle) continue;
      const register = P(sh.lay.staff[0] + 12, 70, 78);
      const pills = [waitTagRect(sh.lay, TEXTS[0]), moreTagRect(sh.lay, '+3')];
      sideFrames(sh).forEach((cast) => {
        const carriers = new Map<number, [number, number]>();
        const deps: { id: number; kind: 'driver' | 'walkin'; n: number; cash: number; left: number }[] = [];
        for (const c of cast)
          for (const id of c.deps ?? []) {
            carriers.set(id, P(c.props.x, c.props.y, 52));
            deps.push({ id, kind: c.role === 'walkin' ? 'walkin' : 'driver', n: 1, cash: 12, left: 1.6 });
          }
        const placed = placePops(deps, (d) => d.left, (d) => carriers.get(d.id) ?? null, register, SCENE_W);
        const rects = placed.map((q) => q.rect);
        frames++;
        for (const q of placed) {
          const at = q.dep.kind === 'walkin' ? register : carriers.get(q.dep.id) ?? register;
          const plain = popPlace(at, q.w, { walkin: q.dep.kind === 'walkin', rideAlong: q.dep.kind !== 'walkin' && carriers.has(q.dep.id), k: Math.min(1, Math.max(0, 1 - (q.rest) / 1)), sceneW: SCENE_W }).rect;
          expect(Math.abs(plain.y1 - q.rect.y1)).toBeLessThan(7); // within its own 6 pt drift of the unlifted spot, never jumped above a pill
        }
        for (const pill of pills) {
          const shown = !popsCover(rects, pill);
          if (!shown) faded++;
          if (shown) for (const r of rects) expect([sh.name, hit(r, pill)]).toEqual([sh.name, false]);
        }
      });
    }
    expect(frames).toBeGreaterThan(100);
    expect(faded).toBeGreaterThan(0); // it does happen (a leaving driver's pop crosses the pill)…
    expect(faded).toBeLessThan(frames); // …but the pill is up most of the time
  });
  test('popsCover is a plain rect overlap', () => {
    const pill = { x0: 100, x1: 200, y0: 300, y1: 323 };
    expect(popsCover([{ x0: 190, x1: 230, y0: 310, y1: 328 }], pill)).toBe(true);
    expect(popsCover([{ x0: 200, x1: 230, y0: 310, y1: 328 }], pill)).toBe(false);
    expect(popsCover([], pill)).toBe(false);
  });
  test('the pops placed for the scene sit beside their carrier\'s head and cover no seated or queued diner\'s face other than their carrier\'s own row, at any footprint', () => {
    const bad: string[] = [];
    for (const sh of sideShops()) {
      if (sh.idle) continue;
      sideFrames(sh).forEach((cast, f) => {
        if (f % 4) return;
        for (const c of cast)
          if (c.deps?.length && c.role !== 'walkin') {
            const r = popPlace(P(c.props.x, c.props.y, 52), popWidth('+$12'), { walkin: false, rideAlong: true, k: 0.5, sceneW: SCENE_W }).rect;
            for (const o of cast) if (o.role === 'staff' && hit(face(o), r)) bad.push(`${sh.name} f${f} ${c.key} over ${o.key}`);
          }
      });
    }
    expect([...new Set(bad)].slice(0, 5)).toEqual([]);
  });
});

// ---------- D430: five diners clumped over the table ----------
describe('queued diners never stand in front of a table or a seated diner (D430)', () => {
  const dinerBoxes = (lay: ReturnType<typeof layout>) => lay.queue.map(([x, y]) => box(figureAt(x, y)));
  /** The table sets the glass front shows nearest the sill, as screen x intervals (table top, both chairs and the diners in them). */
  const sets = (lay: ReturnType<typeof layout>) => lay.tables.filter((t) => t.y <= NEAR_ROW_Y).map((t) => {
    const c = P(t.x, t.y)[0];
    const h = TABLE_SET_HALF * kAt(t.y) * 1.1;
    return [c - h, c + h] as const;
  });
  test('no queued diner overlaps a table set or a seated diner indoors, at any footprint and any table count; the rest are in the "+N" pill', () => {
    for (let fp = 0; fp < 5; fp++)
      for (const tables of [1, 2, 3, 4, 6, 8]) {
        const lay = layout(fp, Math.min(fp + 1, 6), 3, 2, tables, DRIVER_SLOTS[fp], 1);
        for (const b of dinerBoxes(lay)) for (const [a, z] of sets(lay)) expect([fp, tables, b.x1 <= a || b.x0 >= z]).toEqual([fp, tables, true]);
        const s = sidewalkOf(lay, { idle: false, patio: 0 }, { diners: 4, drivers: 37 });
        expect([fp, tables, s.diners + s.more]).toEqual([fp, tables, 4]);
        expect([fp, tables, s.diners === lay.queue.length]).toEqual([fp, tables, true]);
      }
  });
  test('seated indoor figures in every frame are missed by every queue diner (< 5%)', () => {
    for (const sh of sideShops()) {
      if (sh.idle) continue;
      for (const cast of sideFrames(sh).filter((_, f) => f % 5 === 0)) {
        const diners = queuers(cast).filter((c) => c.props.kind === 'guest').map((c) => box(c));
        for (const c of cast) if (c.props.kind === 'sit' && c.props.y >= 0 && c.props.y <= NEAR_ROW_Y) for (const b of diners) expect([sh.name, c.key, overlap(box(c), b) < 0.05]).toEqual([sh.name, c.key, true]);
      }
    }
  });
  test('the check can fail: the v5.13 spots (four diners 22 apart left of the drivers) stood in front of a table set at most footprints', () => {
    let clumped = 0;
    for (let fp = 0; fp < 5; fp++) {
      const lay = layout(fp, Math.min(fp + 1, 6), 3, 2, 6, DRIVER_SLOTS[fp], 1);
      const last = P(...lay.driverQueue[DRIVER_SPOTS - 1])[0];
      const old = [0, 1, 2, 3].map((i) => figureAt(unprojectX(last - 30 - QUEUE_PITCH * i, QUEUE_Y), QUEUE_Y));
      if (old.some((f) => sets(lay).some(([a, z]) => box(f).x1 > a && box(f).x0 < z))) clumped++;
    }
    expect(clumped).toBeGreaterThanOrEqual(4);
  });
  test('the pill says how many wait: "+N" with figures in the lane, "N waiting" when no figure fits', () => {
    expect(queueLabel(2, 2)).toBe('+2');
    expect(queueLabel(4, 0)).toBe('4 waiting');
    const lay = layout(1, 2, 3, 2, 6, 3, 1);
    expect(lay.queue).toHaveLength(0);
    // with nobody in the lane the pill hangs over the first spot the diners would take, GROUP_GAP left of the last driver
    expect(Math.abs(moreTagAt(lay, '4 waiting').x - Math.max(TAG_MARGIN + waitTagWidth('4 waiting') / 2, P(...lay.queueTag)[0]))).toBeLessThan(0.01);
    expect(P(...lay.driverQueue[DRIVER_SPOTS - 1])[0] - P(...lay.queueTag)[0]).toBeCloseTo(30, 5);
  });
});

// ---------- D450: the waiting pill clears the umbrellas; fewer patio diners ----------
describe('the waiting pill over the patio (D450)', () => {
  test('the pill\'s body stays PILL_UMBRELLA_AIR (6 pt) above every umbrella tip, at every footprint with a patio, for every text; the old tip (75 up) was within 2 pt', () => {
    let sets = 0;
    for (const sh of sideShops()) {
      if (sh.idle) continue;
      for (const text of ['1 driver idle', '28 drivers idle · buy Prep + Ovens', '37 drivers idle · buy all three']) {
        const t = waitTagAt(sh.lay, text);
        const bodyBottom = t.y + 8.7;
        const x0 = t.x - t.w / 2;
        const x1 = t.x + t.w / 2;
        for (const p of sh.lay.patio) {
          const [sx, sy] = P(p.x, p.y);
          const k = kAt(p.y) * 1.1;
          if (sx + 24 * k < x0 || sx - 24 * k > x1) continue; // the pill is not over this umbrella
          sets++;
          expect([sh.name, text, sy - UMBRELLA_TOP * k - bodyBottom >= PILL_UMBRELLA_AIR - 1e-9]).toEqual([sh.name, text, true]);
          expect(sy - 75 * k - bodyBottom).toBeLessThan(PILL_UMBRELLA_AIR);
        }
      }
    }
    expect(sets).toBeGreaterThan(5);
  });
  test('only the first patio set seats a regular: the second stays empty until a walk-in takes it', () => {
    for (const sh of sideShops()) {
      if (sh.idle || sh.lay.patio.length < 2) continue;
      const patioXs = sh.lay.patio.map((p) => p.x - PATIO_SEAT);
      const seatedAt = (cast: CastMember[], x: number) => cast.some((c) => c.role === 'diner' && Math.abs(c.props.x - x) < 0.01);
      for (const cast of sideFrames(sh).filter((_, f) => f % 10 === 0)) {
        expect([sh.name, seatedAt(cast, patioXs[1])]).toEqual([sh.name, false]);
      }
    }
  });
});
