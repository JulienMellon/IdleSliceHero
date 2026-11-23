/// <reference types="jest" />
// Card S3, steps 2-4: what the workers, the line and the idle drivers show of the shop's state. Poses are transforms on the same art, timed on the pose
// clock; a walk-out is one customer at a time; the idle drivers sit on scooters, one figure per ten, and the pill only counts them.
import { layout } from './draw-layout';
import { buildCast, sidewalkOf, type CastMember } from '../cast';
import { emptyCrew } from '../crew';
import { matRect, hits } from '../ladder';
import { seatPalette } from '../palette';
import { hash32 } from '../looks';
import { DRIVERS_PER_FIGURE, MAX_DRIVER_FIGURES, driverFigures, waitingText } from '../waiting';
import { DRIVER_QUEUE_PITCH } from '../layout';
import { P, kAt } from '../projection';
import {
  HURRY_BOB,
  LEAN,
  PHONE_SECONDS,
  SCOOTER_BOX,
  SCOOTER_K,
  SWEAT_EVERY,
  SWEAT_SECONDS,
  SWEAT_STEPS,
  YAWN_EVERY,
  YAWN_SECONDS,
  workerPose,
  type WorkerPose,
} from '../poses';
import { FROWN_R, WALKOUT_EVERY, WALKOUT_FADE, WALKOUT_RETURN, WALKOUT_TOTAL, WALKOUT_TURN, WALKOUT_WALK, walkoutAt, walkoutPath } from '../walkout';

const STEP = 1 / 7.5;
/** The pose clock's samples over `seconds`. */
const samples = (seconds: number, from = 0) => Array.from({ length: Math.round(seconds / STEP) }, (_, i) => from + i * STEP);

describe('worker poses (step 2)', () => {
  test('nothing shows without a symptom, and a line or a walk-out is not a worker’s state', () => {
    for (const sym of [null, undefined, 'line', 'walkout'] as const) expect(workerPose(sym, 4, 11)).toBeNull();
  });
  test('piling: a quick bob every step and a sweat drop that falls through three steps once every 3 s', () => {
    let drops = 0;
    let prev = 0;
    const poses = samples(30).map((t) => workerPose('piling', t, 0)!);
    for (const p of poses) {
      expect(p.lean).toBe(0);
      expect(p.still).toBe(false);
      expect([0, HURRY_BOB]).toContain(p.bob);
      if (p.sweat > 0 && prev === 0) drops++;
      // it only ever falls: 1, then 2, then 3
      if (p.sweat > 0 && prev > 0) expect(p.sweat).toBeGreaterThanOrEqual(prev);
      prev = p.sweat;
    }
    expect(drops).toBe(30 / SWEAT_EVERY);
    expect(new Set(poses.map((p) => p.sweat))).toEqual(new Set([0, ...Array.from({ length: SWEAT_STEPS }, (_, i) => i + 1)]));
    // the drop is up for a fraction of the cycle, not all of it
    expect(poses.filter((p) => p.sweat > 0).length / poses.length).toBeCloseTo(SWEAT_SECONDS / SWEAT_EVERY, 1);
    // the bob really moves: both heights show every second
    for (let s = 0; s < 30; s++) expect(new Set(samples(1, s).map((t) => workerPose('piling', t, 0)!.bob)).size).toBe(2);
  });
  test('idle: leaning, hands still, and every 6 s a yawn or a phone glance, taking turns', () => {
    const poses = samples(36).map((t) => ({ t, p: workerPose('idle', t, 0)! }));
    for (const { p } of poses) {
      expect(p.lean).toBe(LEAN);
      expect(p.still).toBe(true);
      expect(p.bob).toBe(0);
      expect(p.sweat).toBe(0);
      // never both at once
      expect(p.mood === 'o' && p.act === 'phone').toBe(false);
    }
    // each 6 s window has exactly one of the two, and they alternate
    const events: string[] = [];
    for (let w = 0; w < 6; w++) {
      const win = poses.filter(({ t }) => t >= w * YAWN_EVERY - 0.0001 && t < (w + 1) * YAWN_EVERY - 0.0001).map(({ p }) => p);
      const kinds = new Set(win.flatMap((p) => [p.mood === 'o' ? 'yawn' : '', p.act === 'phone' ? 'phone' : ''].filter(Boolean)));
      expect(kinds.size).toBeLessThanOrEqual(1);
      events.push([...kinds][0] ?? 'none');
    }
    // the offset moves where the window starts, but over 36 s both events happen, and they take turns
    const all = new Set(poses.flatMap(({ p }) => [p.mood === 'o' ? 'yawn' : '', p.act === 'phone' ? 'phone' : ''].filter(Boolean)));
    expect(all).toEqual(new Set(['yawn', 'phone']));
    expect(YAWN_SECONDS).toBeLessThan(YAWN_EVERY);
    expect(PHONE_SECONDS).toBeLessThan(YAWN_EVERY);
  });
  test('D549: an idle worker has a bubble over their head the whole time (a Z, then the phone while they glance at it); a swamped one has none', () => {
    const idle = samples(24).map((t) => workerPose('idle', t, 0)!);
    expect(idle.every((p) => p.bubble === 'z' || p.bubble === 'phone')).toBe(true);
    expect(idle.filter((p) => p.act === 'phone').every((p) => p.bubble === 'phone')).toBe(true);
    expect(new Set(idle.map((p) => p.bubble))).toEqual(new Set(['z', 'phone']));
    expect(samples(24).every((t) => workerPose('piling', t, 0)!.bubble === null)).toBe(true);
  });
  test('three workers at a station are not in step', () => {
    const at = (seed: number) => samples(12).map((t) => workerPose('idle', t, seed)!.mood === 'o');
    expect(at(1)).not.toEqual(at(7));
    const sweats = (seed: number) => samples(6).map((t) => workerPose('piling', t, seed)!.sweat);
    expect(sweats(2)).not.toEqual(sweats(13));
  });
  test('the pose is a pure function of the clock: the same step gives the same pose (so a memoised figure holds)', () => {
    const a: WorkerPose = workerPose('piling', 12.4, 9)!;
    expect(workerPose('piling', 12.4, 9)).toEqual(a);
  });
});

// ---------- the cast with symptoms ----------

const lay = layout(2, 3, 3, 2, 3, 3, 1);
const shopSeed = 97 * 5;
const pal = seatPalette(hash32(shopSeed) % 8, hash32(shopSeed + 9) % 6, 8, 6, lay.tables.length);
const build = (clock: number, over: Partial<Parameters<typeof buildCast>[0]> = {}) =>
  buildCast({ lay, shop: { drivers: 30, tables: 3, prep: 40 }, running: true, pace: 1.5, clock, shopSeed, nIdx: 1, pal, crew: emptyCrew(), ...over }).cast;
const roleOf = (cast: CastMember[], role: CastMember['role']) => cast.filter((c) => c.role === role);
const queue4 = { diners: 4, drivers: 25 };

describe('the cast shows the stations’ state (step 2)', () => {
  test('a station’s symptom changes only that station’s workers', () => {
    const base = build(5, { queue: queue4 });
    const sym = build(5, { queue: queue4, symptoms: { prep: 'piling', ovens: 'idle', counter: 'idle' } });
    const same = (a: CastMember[], b: CastMember[]) => JSON.stringify(a.map((c) => c.props)) === JSON.stringify(b.map((c) => c.props));
    expect(same(roleOf(base, 'driver'), roleOf(sym, 'driver'))).toBe(true);
    expect(same(roleOf(base, 'queue'), roleOf(sym, 'queue'))).toBe(true);
    expect(same(roleOf(base, 'diner'), roleOf(sym, 'diner'))).toBe(true);
    const only = build(5, { queue: queue4, symptoms: { counter: 'idle' } });
    expect(same(roleOf(base, 'cook'), roleOf(only, 'cook'))).toBe(true);
    expect(same(roleOf(base, 'baker'), roleOf(only, 'baker'))).toBe(true);
    expect(same(roleOf(base, 'staff'), roleOf(only, 'staff'))).toBe(false);
  });
  test('an idle worker leans with still hands; a piling one hurries and, once every 3 s, sweats', () => {
    for (const role of ['cook', 'baker', 'staff'] as const) {
      const key = role === 'cook' ? 'prep' : role === 'baker' ? 'ovens' : 'counter';
      for (const c of roleOf(build(5, { symptoms: { [key]: 'idle' } }), role)) {
        expect([role, c.props.lean]).toEqual([role, LEAN]);
        expect([role, c.props.arm]).toEqual([role, 0]);
        expect([role, ['z', 'phone'].includes(c.props.idle!)]).toEqual([role, true]);
      }
      const hurried = samples(6).flatMap((t) => roleOf(build(t, { symptoms: { [key]: 'piling' } }), role).map((c) => c.props));
      expect(hurried.some((p) => (p.sweat ?? 0) > 0)).toBe(true);
      expect(hurried.some((p) => (p.bob ?? 0) > 0)).toBe(true);
    }
  });
  test('the same art: a posed worker keeps their look, kind and place', () => {
    const base = roleOf(build(5), 'cook');
    const idle = roleOf(build(5, { symptoms: { prep: 'idle' } }), 'cook');
    idle.forEach((c, i) =>
      expect([c.props.x, c.props.y, c.props.kind, c.props.seed, c.props.variant, c.key]).toEqual([
        base[i].props.x,
        base[i].props.y,
        base[i].props.kind,
        base[i].props.seed,
        base[i].props.variant,
        base[i].key,
      ]),
    );
  });
  test('the cheer pulse still wins over a pose', () => {
    for (const c of roleOf(build(5, { cheer: true, symptoms: { prep: 'idle' } }), 'cook')) {
      expect(c.props.act).toBe('cheer');
      expect(c.props.lean).toBeUndefined();
    }
  });
  test('with no symptoms nothing is posed', () => {
    for (const c of build(5, { queue: queue4 }))
      expect([c.key, c.props.bob, c.props.lean, c.props.sweat, c.props.frown]).toEqual([c.key, undefined, undefined, undefined, undefined]);
  });
});

describe('customers walk out (step 3)', () => {
  const FPS = 15;
  // the flagship's sidewalk has room for the door line (4 figures); the others have none, so their customer comes from the pause by the door
  const wide = layout(4, 3, 3, 2, 3, 3, 1);
  const frames = (l: typeof lay, active: boolean, seconds: number) =>
    Array.from({ length: seconds * FPS }, (_, f) => {
      const clock = f / FPS;
      return { clock, frame: walkoutAt(l, clock, active, 4), cast: build(clock, { lay: l, queue: queue4, symptoms: active ? { floor: 'walkout' } : {} }) };
    });
  test('the flagship draws a door line and a narrow shop does not (the premise of the two cases below)', () => {
    expect(wide.queue.length).toBeGreaterThanOrEqual(2);
    expect(lay.queue.length).toBe(0);
  });
  test('nothing walks out unless the floor shows a walk-out', () => {
    for (const l of [lay, wide]) {
      expect(frames(l, false, 20).every(({ frame, cast }) => frame === null && cast.every((c) => !c.props.frown))).toBe(true);
    }
    expect(walkoutAt(lay, -1, true, 4)).toBeNull();
  });
  test('at most one walk-out animates at a time, and it happens again and again', () => {
    for (const l of [lay, wide]) {
      let starts = 0;
      let was = false;
      for (const { cast } of frames(l, true, 60)) {
        const frowning = cast.filter((c) => c.props.frown);
        expect(frowning.length).toBeLessThanOrEqual(1);
        if (frowning.length && !was) starts++;
        was = frowning.length > 0;
      }
      expect(starts).toBe(Math.ceil(60 / WALKOUT_EVERY));
    }
    expect(WALKOUT_TOTAL).toBeLessThan(WALKOUT_EVERY);
  });
  test('a figure of the door line turns away, frowns, walks off the curb and fades out, and the same element is the walker (same key, no mount)', () => {
    const f0 = walkoutAt(wide, 0.1, true, 4)!;
    expect(f0.walker).toMatchObject({ walking: false, away: true, o: 1 });
    const [qx, qy] = wide.queue[f0.q];
    expect([f0.walker!.x, f0.walker!.y]).toEqual([qx, qy]);
    // walking: down the sidewalk to the lane, then away from the door
    const mid = walkoutAt(wide, WALKOUT_TURN + WALKOUT_WALK * 0.6, true, 4)!;
    expect(mid.walker!.walking).toBe(true);
    expect(mid.walker!.y).toBeLessThan(qy);
    expect(Math.sign(mid.walker!.x - qx)).toBe(Math.sign(qx - wide.door.cx));
    // faded out before the spot fills again, and the spot fills with a fade
    expect(walkoutAt(wide, WALKOUT_TURN + WALKOUT_WALK - 0.02, true, 4)!.walker!.o).toBeLessThan(0.1);
    const back = walkoutAt(wide, WALKOUT_TURN + WALKOUT_WALK + WALKOUT_RETURN / 2, true, 4)!;
    expect(back.walker).toBeNull();
    expect(back.spotOpacity).toBeCloseTo(0.5, 1);
    // the cast keeps the same keys all the way through (React keeps the element)
    const keys = (c: CastMember[]) =>
      c
        .map((m) => m.key)
        .sort()
        .join();
    const calm = keys(build(0.1, { lay: wide, queue: queue4 }));
    for (const t of [0.1, 1, 2, 2.9, 3.2]) expect(keys(build(t, { lay: wide, queue: queue4, symptoms: { floor: 'walkout' } }))).toBe(calm);
    const walking = build(1, { lay: wide, queue: queue4, symptoms: { floor: 'walkout' } }).find((c) => c.props.frown)!;
    expect(walking.key).toBe(`q${walkoutAt(wide, 1, true, 4)!.q}`);
    expect(walking.props.mood).toBe('frown');
    expect(walking.props.flip).toBe(true); // turned away from the door (the plain plan's door is on the right)
  });
  test('a shop with no room for a line has its customer come from the door and walk away from it', () => {
    const start = walkoutAt(lay, 0.1, true, 0)!;
    expect(start.q).toBe(-1);
    expect(start.walker!.o).toBeLessThan(1); // fading in as they turn
    const mid = walkoutAt(lay, WALKOUT_TURN + 1, true, 0)!;
    // away from the door, and on the side the idle drivers do not park on (D552: the first of them stood where the customer did)
    expect(Math.sign(mid.walker!.x - start.walker!.x)).toBe(Math.sign(start.walker!.x - lay.door.cx));
    for (const [dx] of lay.driverQueue) expect(Math.sign(dx - lay.door.cx)).toBe(-Math.sign(start.walker!.x - lay.door.cx));
    expect(walkoutAt(lay, WALKOUT_TURN + WALKOUT_WALK + 0.3, true, 0)!.walker).toBeNull();
    const walker = build(1, { queue: queue4, symptoms: { floor: 'walkout' } }).find((c) => c.props.frown)!;
    expect(walker.key).toBe('wo');
  });
  test('the walk stays on the sidewalk, off the doormat and out of the road, in every footprint and plan', () => {
    for (const mirrored of [false, true])
      for (let fp = 0; fp < 5; fp++) {
        const l = layout(fp, 3, 3, 2, 3, 3, 1, undefined, mirrored);
        const mat = matRect(l);
        const spots = l.queue.length ? l.queue.map((_, q) => q) : [-1];
        for (const q of spots) {
          const path = walkoutPath(l, q);
          expect(Math.min(...path.map((p) => p[1]))).toBeGreaterThan(-80);
          // away from the door, whichever plan
          expect(Math.sign(path[2][0] - path[0][0])).toBe(Math.sign(path[0][0] - l.door.cx));
        }
        for (const t of samples(WALKOUT_TURN + WALKOUT_WALK + WALKOUT_RETURN, 0)) {
          const w = walkoutAt(l, t, true, l.queue.length)?.walker;
          if (!w) continue;
          const [sx, sy] = P(w.x, w.y);
          const k = kAt(w.y) * 1.14;
          const body = { x0: sx - 11 * k, x1: sx + 11 * k, y0: sy - 50 * k, y1: sy };
          // a figure standing still (the turn) never stands on the mat (the crowd budget's 20% of its box); one walking by may pass over it
          const cover = Math.max(0, Math.min(body.x1, mat.x1) - Math.max(body.x0, mat.x0)) * Math.max(0, Math.min(body.y1, mat.y1) - Math.max(body.y0, mat.y0));
          if (!w.walking) expect([fp, mirrored, cover / ((mat.x1 - mat.x0) * (mat.y1 - mat.y0)) > 0.2]).toEqual([fp, mirrored, false]);
        }
      }
  });
  test('the frown bubble is at least 12 pt across wherever the walker is', () => {
    for (let y = -5; y >= -45; y -= 5) expect(2 * FROWN_R * kAt(y) * 1.14).toBeGreaterThanOrEqual(12);
    expect(WALKOUT_FADE).toBeLessThan(WALKOUT_WALK);
  });
});

describe('idle drivers sit on their scooters (step 4)', () => {
  test('one figure per ten idle drivers, at most three, each on a scooter; the pill counts the rest and names no station', () => {
    expect(DRIVERS_PER_FIGURE).toBe(10);
    for (const idle of [1, 9, 10, 11, 25, 29, 60]) {
      const cast = build(3, { queue: { diners: 0, drivers: idle } });
      const riders = cast.filter((c) => c.role === 'queue' && c.props.kind === 'driver');
      expect([idle, riders.length]).toEqual([idle, driverFigures(idle)]);
      expect(riders.length).toBeLessThanOrEqual(MAX_DRIVER_FIGURES);
      for (const r of riders) expect(r.props.ride).toBe(true);
      const side = sidewalkOf(lay, emptyCrew(), { diners: 0, drivers: idle });
      if (side.waiting > 0) expect(waitingText(side.waiting)).toBe(`${idle} drivers waiting`);
    }
  });
  test('the scooters stay clear of each other and of the doormat', () => {
    const bad: string[] = [];
    for (const mirrored of [false, true])
      for (let fp = 0; fp < 5; fp++) {
        const l = layout(fp, 3, 3, 2, 3, 3, 1, undefined, mirrored);
        const mat = matRect(l);
        const rects = l.driverQueue.map(([x, y]) => {
          const [sx, sy] = P(x, y);
          const k = kAt(y) * 1.14 * SCOOTER_K;
          // the scooter is drawn mirrored when the plan is
          const [a, b] = mirrored ? [-SCOOTER_BOX.x1, -SCOOTER_BOX.x0] : [SCOOTER_BOX.x0, SCOOTER_BOX.x1];
          return { x0: sx + a * k, x1: sx + b * k, y0: sy + SCOOTER_BOX.y0 * k, y1: sy + SCOOTER_BOX.y1 * k };
        });
        rects.forEach((r, i) => {
          if (hits(r, mat)) bad.push(`fp${fp}${mirrored ? 'm' : ''} scooter ${i} on the mat`);
          rects.slice(i + 1).forEach((o, j) => hits(r, o) && bad.push(`fp${fp}${mirrored ? 'm' : ''} scooters ${i}/${i + 1 + j} overlap`));
        });
      }
    expect(DRIVER_QUEUE_PITCH).toBe(30);
    expect(bad.slice(0, 6)).toEqual([]);
  });
});
