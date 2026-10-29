/// <reference types="jest" />
// Crowd budgets: simulate the cast frame by frame for busy shops and check, in screen space, that moving
// people don't sit on top of the kitchen crew, each other, or the WELCOME mat for more than a moment.
import { buildCast, type CastMember } from '../cast';
import { DOOR_OUT_Y, layout } from '../layout';
import { hash32 } from '../looks';
import { seatPalette } from '../palette';
import { P, kAt } from '../projection';
import { quantArm, quantStep } from '../quantise';

const DRIVER_SLOTS = [2, 2, 3, 3, 4];
const FPS = 15;
const SECONDS = 40;

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

function frames(shop: ReturnType<typeof busyShops> extends Generator<infer T> ? T : never, pace: number) {
  const out: CastMember[][] = [];
  for (let f = 0; f < SECONDS * FPS; f++) {
    const { cast } = buildCast({ lay: shop.lay, shop: { drivers: 12, tables: 40, prep: 120 }, running: true, pace, clock: f / FPS, shopSeed: shop.shopSeed, nIdx: 1, pal: shop.pal });
    out.push(cast);
  }
  return out;
}

describe('crowd budgets', () => {
  test('walk-ins and drivers cover a baker or cook (>35% of them) in under 6% of frames', () => {
    for (const shop of busyShops())
      for (const pace of [1, 2.6]) {
        const fs = frames(shop, pace);
        let bad = 0;
        for (const cast of fs) {
          const crew = cast.filter((c) => c.role === 'baker' || c.role === 'cook').map(box);
          const movers = cast.filter((c) => (c.role === 'walkin' && c.props.kind !== 'sit') || c.role === 'driver');
          // only people in front of the crew can cover them
          if (movers.some((m) => crew.some((cb) => box(m).y1 > cb.y1 && overlap(box(m), cb) > 0.35))) bad++;
        }
        expect([shop.name, pace, bad / fs.length < 0.06]).toEqual([shop.name, pace, true]);
      }
  });
  test('nobody stands still on the doormat', () => {
    for (const shop of busyShops()) {
      const fs = frames(shop, 1.5);
      const { x0, x1 } = shop.lay.door;
      for (const cast of fs)
        for (const c of cast) {
          const still = !c.props.step && c.props.kind !== 'sit';
          const onMat = c.props.x > x0 && c.props.x < x1 && c.props.y < -6 && c.props.y > DOOR_OUT_Y + 4;
          expect([shop.name, c.key, still && onMat]).toEqual([shop.name, c.key, false]);
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
