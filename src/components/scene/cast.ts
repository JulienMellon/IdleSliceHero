// The cast builder: who is in the shop this frame, where they stand and what they're doing.
// Pure (no React), so crowd layouts can be simulated frame by frame in node tests; Storefront only
// turns the records into <Person/> elements.
import { SEAT, type Layout } from './layout';
import { GUEST_SHIRTS, HAIR_COLORS, hash32, type Act, type Mood, type PersonProps } from './looks';
import type { SeatPalette } from './palette';
import { P, SCENE_W } from './projection';
import { STEP_FRAMES } from './quantise';
import { driverPoseAt, guestPoseAt, WALKIN_TABLES, type CrewState } from './crew';

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
  /** Departures this figure carries or is being handed (their pops ride above them). */
  deps?: readonly number[];
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
  /** Who is waiting, walking out or eating, folded from the engine's departures (crew.ts `stepCrew`). */
  crew: CrewState;
}

/** Walk-cycle poses per second: STEP_FRAMES (8) per second is one stride cycle a second. */
export const WALK_POSES_PER_S = STEP_FRAMES;

/** A figure stays opaque until its centre is this far past the screen edge, so it has fully left before it fades. */
const EDGE_HOLD = 14;
/** …then fades out over this many units (D284: it used to fade over the last 30 on screen and read as a ghost). */
const EDGE_FADE = 8;
/** Opacity for a figure at screen x. */
export const edgeFade = (sx: number) => Math.max(0, Math.min(1, (SCENE_W + EDGE_HOLD - sx) / EDGE_FADE, (sx + EDGE_HOLD) / EDGE_FADE));

/**
 * Builds this frame's cast. Two clocks drive it:
 *   - the 15 fps scene clock for placement and walking (the walk cycle steps one of STEP_FRAMES phases
 *     per frame from an integer frame counter, so it never skips or stutters with timer jitter);
 *   - a 7.5 Hz pose clock for arm work and eating, so a worker's limbs keep identical props for two
 *     frames and their memo holds.
 */
export function buildCast({ lay, shop, running, pace, clock, shopSeed, nIdx, pal, crew }: CastInput): { cast: CastMember[] } {
  const t = clock * pace;
  const poseClock = Math.floor(clock * 7.5) / 7.5;
  const pt = poseClock * pace;
  // a 1.0 s walk cycle of STEP_FRAMES poses, stepped by time (not by frame), so each pose holds ~2 frames at 15 fps
  // and the memoised limbs keep hitting (P6, codecritic plan #2)
  const pose = Math.floor(clock * WALK_POSES_PER_S);
  const walkStep = (k: number) => (((pose + k) % STEP_FRAMES) + 0.5) * ((Math.PI * 2) / STEP_FRAMES);
  // a short blink every few seconds per person
  const blinkAt = (sd: number) => (clock + (sd % 37) * 0.31) % 3.7 < 0.13;
  const cast: CastMember[] = [];

  // drivers and walk-ins follow the engine's departures (crew.ts): one driver per pickup spot, out the door with
  // each order and back again; walk-ins wait at their own order spot for a pie, eat, and leave
  {
    const dp = driverPoseAt(lay, crew.driver, clock, SCENE_W, crew.idle);
    if (dp) {
      const [x, y] = dp.pos;
      const o = edgeFade(P(x, y)[0]);
      const sd = shopSeed + 10;
      // off-screen: don't keep an invisible figure mounted
      if (o > 0)
        cast.push({
          key: 'd0',
          sortY: y,
          role: 'driver',
          props: { x, y, kind: 'driver', seed: sd, blink: blinkAt(sd), carry: dp.carry, carryWalk: dp.carry && dp.walking, step: dp.walking ? walkStep(0) : 0, arm: 0, flip: dp.face, o, mood: dp.leaving ? 'o' : 'smile' },
          deps: dp.deps,
        });
    }
  }

  // walk-ins sit in the right-hand chair of the first WALKIN_TABLES tables; those tables' regulars take the left
  const guestCount = crew.guests.length ? Math.min(WALKIN_TABLES, lay.tables.length) : 0;
  const fixedFill = Math.min(1, 0.4 + shop.tables / 40);
  for (const slot of crew.guests) {
    const g = guestPoseAt(lay, slot, clock, SCENE_W, crew.idle);
    if (!g) continue;
    const i = slot.visit;
    // a different customer every visit, and different crowds in every shop
    const gSeed = shopSeed + (i % 4) * 2 + 3 + i * 13;
    const seated = g.stage === 'seated';
    const bite = Math.abs(Math.sin(poseClock * 2 + i));
    const mood: Mood = seated ? (bite > 0.7 ? 'chew' : bite < 0.3 ? 'happy' : 'smile') : 'smile';
    const o = edgeFade(P(g.pos[0], g.pos[1])[0]);
    if (o <= 0) continue;
    cast.push({
      key: `g${i % 8}`,
      sortY: g.pos[1] - 0.3,
      role: 'walkin',
      props: { x: g.pos[0], y: g.pos[1], kind: seated ? 'sit' : 'guest', seed: gSeed, shirt: GUEST_SHIRTS[pal.walkShirt(i % 4, Math.floor(i / 4))], hair: HAIR_COLORS[pal.walkHair(i % 4, Math.floor(i / 4))], o, flip: g.face, step: g.walking ? walkStep((i % 4) + 3) : 0, talk: g.stage === 'order' && Math.sin(poseClock * 9) > -0.2, mood, blink: blinkAt(gSeed), arm: seated ? bite * 2 : 0 },
      deps: g.deps,
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
      props: { x, y, kind: 'cook', variant: i, gold: shop.prep >= 100, front: true, act: COOK_ACTS[i % 3], mood: running && Math.floor(poseClock / 1.5 + i) % 2 === 0 ? 'focus' : 'smile', seed: sd, blink: blinkAt(sd), arm: running ? Math.abs(Math.sin(pt * 4 + i)) * 3 : 0 },
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
  return { cast };
}
