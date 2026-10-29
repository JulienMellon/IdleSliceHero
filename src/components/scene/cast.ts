// The cast builder: who is in the shop this frame, where they stand and what they're doing.
// Pure (no React), so crowd layouts can be simulated frame by frame in node tests; Storefront only
// turns the records into <Person/> elements.
import { SEAT, type Layout } from './layout';
import { GUEST_SHIRTS, HAIR_COLORS, hash32, type Act, type Mood, type PersonProps } from './looks';
import type { SeatPalette } from './palette';
import { P, SCENE_W } from './projection';
import { STEP_FRAMES } from './quantise';
import { driverPhase, driverPose, guestPose } from './timelines';

const BAKER_SHIRTS = ['#B23A48', '#7E3A8E', '#2E6E8E'];
const BAKER_DOTS = ['#D9443A', '#3FAE5A', '#2D9CDB'];
const STAFF_CAPS = ['#F5C33B', '#F2994A', '#56CCF2', '#BB6BD9', '#6FCF97', '#EB6F92'];
const SEATED_ACTS = ['none', 'slice', 'cup', 'lean'] as const;
const COMPANION_ACTS = ['cup', 'none', 'slice', 'lean'] as const;
const COOK_ACTS = ['pin', 'toss', 'ladle'] as const;
const BAKER_ACTS = ['pizza', 'peel', 'slide'] as const;

/** One figure this frame: a React key, its depth for sorting, and its props. */
export interface CastMember {
  key: string;
  /** depth used for painter's sorting (larger = further back) */
  sortY: number;
  role: 'driver' | 'walkin' | 'diner' | 'companion' | 'cook' | 'baker' | 'staff';
  props: PersonProps;
}

export interface CastInput {
  lay: Layout;
  shop: { drivers: number; tables: number; prep: number };
  running: boolean;
  /** animation speed for this shop's rate */
  pace: number;
  /** scene clock (seconds) */
  clock: number;
  shopSeed: number;
  /** neighbourhood index (uniform colours) */
  nIdx: number;
  pal: SeatPalette;
}

/** Opacity for a figure at screen x: fades over 30 units at both screen edges. */
export const edgeFade = (sx: number) => Math.max(0, Math.min(1, (SCENE_W - sx) / 30, sx / 30));

/**
 * Builds this frame's cast. Two clocks drive it:
 *   - the 15 fps scene clock for placement and walking (the walk cycle steps one of STEP_FRAMES phases
 *     per frame from an integer frame counter, so it never skips or stutters with timer jitter);
 *   - a 7.5 Hz pose clock for arm work and eating, so a worker's limbs keep identical props for two
 *     frames and their memo holds.
 * Returns the driver phases too, for payout edge detection.
 */
export function buildCast({ lay, shop, running, pace, clock, shopSeed, nIdx, pal }: CastInput): { cast: CastMember[]; phases: number[] } {
  const t = clock * pace;
  const poseClock = Math.floor(clock * 7.5) / 7.5;
  const pt = poseClock * pace;
  const frame = Math.floor(clock * 15);
  const walkStep = (k: number) => (((frame + k) % STEP_FRAMES) + 0.5) * ((Math.PI * 2) / STEP_FRAMES);
  // a short blink every few seconds per person
  const blinkAt = (sd: number) => (clock + (sd % 37) * 0.31) % 3.7 < 0.13;
  const cast: CastMember[] = [];
  const phases: number[] = [];

  const driverCount = Math.min(shop.drivers, lay.spots.length * 3, 2 + lay.fp);
  for (let i = 0; i < driverCount; i++) {
    const jitter = (hash32(shopSeed + i * 17) % 100) / 2500;
    const p = driverPhase(i, driverCount, t, jitter);
    phases.push(p);
    if (!running && i > 0) continue;
    const spot = lay.spots[i % lay.spots.length];
    const dp = running ? driverPose(lay, i, p, SCENE_W) : null;
    const [x, y] = dp ? dp.pos : [spot.x, spot.y];
    const o = edgeFade(P(x, y)[0]);
    if (o <= 0) continue; // off-screen: don't keep an invisible figure mounted
    const sd = shopSeed + i + 10;
    cast.push({
      key: `d${i}`,
      sortY: y,
      role: 'driver',
      props: { x, y, kind: 'driver', seed: sd, blink: blinkAt(sd), carry: !!dp?.carry, carryWalk: !!dp && dp.carry && dp.walking, step: dp?.walking ? walkStep(i) : 0, arm: 0, flip: !!dp?.face, o, mood: dp?.leaving ? 'o' : 'smile' },
    });
  }

  const guestCount = running ? Math.min(4, Math.ceil(lay.tables.length / 2)) : 0;
  const fixedFill = Math.min(1, 0.4 + shop.tables / 40);
  for (let i = 0; i < guestCount; i++) {
    const cyc = t / 9 + 0.3 + i / Math.max(2, guestCount);
    const lap = Math.floor(cyc);
    const g = guestPose(lay, i, ((cyc % 1) + 1) % 1, SCENE_W);
    // a different customer every visit, and different crowds in every shop
    const gSeed = shopSeed + i * 2 + 3 + lap * 13;
    const seated = g.stage === 'seated';
    const bite = Math.abs(Math.sin(poseClock * 2 + i));
    const mood: Mood = seated ? (bite > 0.7 ? 'chew' : bite < 0.3 ? 'happy' : 'smile') : 'smile';
    const o = edgeFade(P(g.pos[0], g.pos[1])[0]);
    if (o <= 0) continue;
    cast.push({
      key: `g${i}`,
      sortY: g.pos[1] - 0.3,
      role: 'walkin',
      props: { x: g.pos[0], y: g.pos[1], kind: seated ? 'sit' : 'guest', seed: gSeed, shirt: GUEST_SHIRTS[pal.walkShirt(i, lap)], hair: HAIR_COLORS[pal.walkHair(i, lap)], o, flip: g.face, step: g.walking ? walkStep(i + 3) : 0, talk: g.stage === 'order' && Math.sin(poseClock * 9) > -0.2, mood, blink: blinkAt(gSeed), arm: seated ? bite * 2 : 0 },
    });
  }

  // seated regulars (someone is always eating) and, in a busy room, a companion opposite
  const regulars = running ? Math.max(1, Math.round(lay.tables.length * fixedFill)) : 1;
  lay.tables.forEach((tb, i) => {
    if (i >= regulars) return;
    const dSeed = shopSeed + i * 3 + 7 + Math.floor(t / 14 + i * 0.37) * 29;
    const bite = Math.abs(Math.sin(poseClock * 2 + i));
    const act: Act = SEATED_ACTS[(hash32(dSeed) >>> 3) % 4];
    // tables a walk-in heads for keep their right-hand chair free (see guestPose); others alternate sides
    const side = i < guestCount ? -SEAT : i % 2 ? SEAT : -SEAT;
    cast.push({
      key: `s${i}`,
      sortY: tb.y,
      role: 'diner',
      props: { x: tb.x + side, y: tb.y, kind: 'sit', flip: side > 0, seed: dSeed, act, shirt: GUEST_SHIRTS[pal.shirt(i)], hair: HAIR_COLORS[pal.hair(i)], blink: blinkAt(dSeed), arm: bite * 2, mood: act === 'slice' || bite > 0.7 ? 'chew' : bite < 0.3 ? 'happy' : 'smile' },
    });
    const cx = tb.x - side;
    const crowded = lay.tables.some((o) => o !== tb && Math.abs(o.y - tb.y) < 32 && (Math.abs(o.x - SEAT - cx) < 18 || Math.abs(o.x + SEAT - cx) < 18));
    if (running && i >= guestCount && !crowded && (shop.tables >= 13 ? i % 2 === 0 : fixedFill >= 0.6 && hash32(dSeed + 1) % 3 !== 0)) {
      const cSeed = dSeed + 501;
      const cb = Math.abs(Math.sin(poseClock * 2 + i + 1.7));
      cast.push({
        key: `s2${i}`,
        sortY: tb.y - 0.1,
        role: 'companion',
        props: { x: cx, y: tb.y, kind: 'sit', flip: cx > tb.x, seed: cSeed, act: COMPANION_ACTS[(hash32(cSeed) >>> 3) % 4], shirt: GUEST_SHIRTS[pal.companionShirt(i)], hair: HAIR_COLORS[pal.companionHair(i)], blink: blinkAt(cSeed), arm: cb * 2, mood: cb > 0.7 ? 'chew' : cb < 0.3 ? 'happy' : 'smile' },
      });
    }
  });

  // kitchen crew
  const cookY = lay.cooks.length === 1 ? 74 : 92;
  lay.cooks.forEach((x, i) => {
    const sd = shopSeed + i * 4 + 20;
    const y = cookY + (i % 2) * 8;
    cast.push({
      key: `c${i}`,
      sortY: y,
      role: 'cook',
      props: { x, y, kind: 'cook', gold: shop.prep >= 100, front: true, act: COOK_ACTS[i % 3], mood: running && Math.sin(pt * 4 + i) > 0.3 ? 'focus' : 'smile', seed: sd, blink: blinkAt(sd), arm: running ? Math.abs(Math.sin(pt * 4 + i)) * 3 : 0 },
    });
  });
  // bakers in front of the oven bank; the one by the counter holds the peel upright so it clears the counter
  const bBase = nIdx % 3;
  lay.bakers.forEach((b, i) => {
    const sd = shopSeed + i * 3 + 31 + nIdx * 7;
    const ci = (bBase + i) % 3;
    cast.push({
      key: `b${i}`,
      sortY: b.y,
      role: 'baker',
      props: { x: b.x, y: b.y, shirt: BAKER_SHIRTS[ci], kind: 'baker', seed: sd, blink: blinkAt(sd), arm: running ? Math.abs(Math.sin(pt * 3 + i)) * 2.5 : 0, peelK: b.nearCounter ? 0.7 : 1, act: b.nearCounter ? 'peel' : BAKER_ACTS[(i + bBase) % 3], dot: BAKER_DOTS[(ci + 1) % 3] },
    });
  });
  lay.staff.forEach((x, i) => {
    const sd = shopSeed + i * 5 + 41;
    cast.push({
      key: `st${i}`,
      sortY: 92,
      role: 'staff',
      props: { x, y: 92, kind: 'staff', front: true, alt: i === 1, cap: STAFF_CAPS[nIdx], seed: sd, blink: blinkAt(sd), arm: running ? Math.abs(Math.sin(pt * 5 + i * 2)) * 2 : 0 },
    });
  });
  return { cast, phases };
}
