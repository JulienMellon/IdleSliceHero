/// <reference types="node" />
// Pacing fitter for the check-in player (v5.12). Not a test: a search tool for src/content/tuning.ts.
//
//   npx tsx scripts/pacing-fit.ts                 fit build costs (and Uptown's cost multiplier) to the targets below
//   npx tsx scripts/pacing-fit.ts check           just print the unlock days of the current tuning, all four sim rows
//   npx tsx scripts/pacing-fit.ts franchise       v5.18: the home clear's Stars, then Boston's day table against the home targets
//   LADDER='{"industrial":1500}' npx tsx scripts/pacing-fit.ts ladder   v5.25: the Home ladder's day table (a hood's richness times a factor)
//   npx tsx scripts/pacing-fit.ts session1       v5.16: the first 40 minutes (continuous, rewards on) against SESSION1
//   npx tsx scripts/pacing-fit.ts managers        v5.16: when each shop's heads and manager arrive (check-in player, rewards on) and the reward rules
//   OV=3,10,27,75,200,550 CM=1,4.5,12,34,90,250 MCR=0.5 npx tsx scripts/pacing-fit.ts
//   K=300 RHO=0.45 MCR=0.5 npx tsx scripts/pacing-fit.ts fit3   v5.13: proportional costs. Per pizzeria one free number (its order value):
//                                    costMult = RHO x orderValue, buildCost = K x costMult, managerCost = MCR x buildCost; ov is bisected to the day target.
//
// Order values (OV), cost multipliers (CM), the manager-cost ratio (MCR = managerCost / buildCost) and the other cost tables
// (OG, FP, DC, VC, PB, PP, CAP, EFF as in scripts/review/sim2.ts) are chosen by hand; the fitter bisects each later pizzeria's
// buildCost so its first scene lands on the target day, one stage at a time (a stage only depends on earlier ones), then
// bisects Uptown's cost multiplier so the finale lands on its target. Round the printed numbers by hand and run `check`.
import { HEAD_KINDS } from '../src/content/tuning';
import { FRANCHISE, cityNumbers, type CityNumbers } from '../src/content/franchise';
import { canFranchise, franchise, franchiseGain } from '../src/engine/features/franchise';
import { COUNTERATTACK } from '../src/content/endgame';
import * as G from '../src/engine/game';
import { getFeature } from '../src/engine/features';
import { ackAttack, counterattack, attackView, startChallenge } from '../src/engine/features/counterattack';
import { masteryStars, masteryTotal } from '../src/engine/features/mastery';
import { cityOf, hoodIds } from '../src/content/cities';
import { LAYER_GATES, LAYER_KEYS } from '../src/content/layers';
import { GIFT_LENGTH } from '../src/content/rewards';
import { cameoOpen } from '../src/engine/features/layers/gates';
import { rivalOpen } from '../src/engine/features/layers/rival';
import { applyCfg, decisionMetric, endSummary, INSTALL, options, reportLines, rewardRules, run, sessionStats, type Cfg } from './review/sim2';

import { FOOTPRINTS, HEAD_COST_DOWNTOWN, OVEN_GRADES, VEHICLES } from '../src/content/cities/home/fit';
import { HOME_BID, NEIGHBORHOODS, PIER9_BID } from '../src/content/cities/home/data';
// ---- v5.16 (card E0): the economy rules after playtest 3. Every target the tests pin is a named constant here, so the version's final
// refit (card E2b) changes numbers and not tests. ----

/** Session 1 (card E0 step 6): the continuous player, rewards on, from the first launch to the Suburbs finale. Times in minutes. */
export const SESSION1 = {
  /** Downtown's three heads, in the order they are hired, each within `headsTolerance` (v5.25: the oven head comes with chapter 2, the counter head with chapter 3). */
  downtownHeads: [2, 6.5, 13],
  headsTolerance: 1,
  /** Nonna takes over (downtown-4). v5.25: her beat is held by Downtown's rate task, and Suburbs is built the moment she has: the Julien's 20-minute Suburbs is her takeover. */
  takeover: 19.5,
  takeoverTolerance: 1.5,
  /** Suburbs opens (it is built): about 20 minutes of active play (v5.25, Julien 2026-11-28). */
  suburbsOpens: 20,
  opensTolerance: 2,
  suburbsManager: 26,
  managerTolerance: 3,
  /** v5.25 (card E9, D493): the Suburbs finale is the rival's challenge, and the rival opens at Suburbs two stars, so the finale is that wait (measured 172 min: the Flagship). */
  suburbsFinale: 172,
  finaleTolerance: 15,
  /** A purchase at least this often at the median, and never a wait over this (seconds). */
  medianBuyGapSeconds: 60,
  maxBuyGapSeconds: 120,
  /** A scene at least this often (minutes), from the first scene to the end of the window below. */
  maxSceneGapMinutes: 3,
  /** The purchase and scene gaps are read over the first this many minutes (the rest of the way to the finale is the star wait of D493). */
  windowMinutes: 40,
} as const;

/**
 * v5.25 (card E9, closes D493): the layers come one to a session. A session is this many minutes of the continuous player's play, counted from
 * the first launch, and the first session of all is the shop on its own (before Suburbs opens): no layer appears in it. A layer "appears" when
 * the player can first meet it: Game Day's first game (one gap after Suburbs opens), the first boat (Downtown at two stars and Waterfront
 * built, then one gap), the rival (Suburbs at two stars, its beat 3 seen) and the cameo (the day-30 visitor, no sooner than day 30 and Suburbs at one star).
 */
export const LAYER_SESSIONS = { minutes: 40 } as const;

/** Minutes of play at which each layer first appears (NaN: not within the run). */
export interface LayerFirsts {
  gameDay: number;
  boats: number;
  rival: number;
  cameo: number;
}

/** The 40-minute session (from 1) each layer first appears in, whether none is in the shop-only first session, and whether no two share a session. Pure. */
export function layerSessions(f: LayerFirsts, opens: number) {
  const sessions = Object.fromEntries((Object.keys(f) as (keyof LayerFirsts)[]).map((k) => [k, Math.floor(f[k] / LAYER_SESSIONS.minutes) + 1])) as Record<
    keyof LayerFirsts,
    number
  >;
  const mins = Object.values(f);
  const afterShop = mins.every((m) => Number.isFinite(m) && m >= opens);
  const distinct = new Set(Object.values(sessions)).size === mins.length && mins.every(Number.isFinite);
  return { sessions, afterShop, distinct };
}

/**
 * What the fit could not reach in session 1, measured (v5.25, card E8). The scene gap: Downtown has four beats and Suburbs opens at about
 * 20 min, and Suburbs is built the moment Nonna takes over, so the four gaps before it are 20 / 3 = 6.5 min each at the best (a 3-minute
 * gap needs one more Downtown beat, a story decision). The buy gap: the player saves for the Suburbs manager (4.2M) and buys nothing meanwhile.
 * The tests pin these measured values, so a worse result fails.
 * v5.25 (card E10): Downtown has a slot for one more scene (`downtown-3b`, an interlude 200 s after beat 3: it splits the 7-minute wait before Nonna) and the gap falls to
 * 6.3 min, the wait between Downtown's first two beats; a 3-minute gap needs an interlude in each of the three Downtown gaps and in Suburbs' (a story decision, W6).
 */
export const SESSION1_MISSES = { maxBuyGapSeconds: 300, maxSceneGapMinutes: 58.1 } as const;
// v5.25 (card E9, D493): the rival opens at Suburbs two stars, so Suburbs' finale (the challenge) and the Waterfront scenes that follow it wait for the
// Flagship (the finale at 172 min). The gap that starts in the first 40 minutes is now Waterfront's first scene (32.5) to its manager's (90.5): 58 min.
// Story beats for that wait (interludes in Suburbs and Waterfront) are W6's and T3's; the longest gap of the first session proper is still the 6.3 min above.

/**
 * Waterfront to Uptown (card E0 step 7): where the manager and the heads fall for the check-in player (5 min every 4 h).
 * v5.25 (card E8): the flat ladder makes every hood's own prices small against the income of the hoods before it, so the targets of v5.16
 * (a manager is 4 h of income, 70 to 100% of the way to the next build, 0.7 to 1.3 days after Uptown's build) are pinned to what the fit
 * measures now (the limits below, and STORY_RULES, DECISION_TARGETS); card E10 refits them with renovation: the Pier 9 bid and Industrial's and Uptown's heads
 * are the waits that hold the story to 7 days (measured: Uptown's first head 3 check-ins after its build, all three 5, its manager 0.85 days).
 */
export const MANAGER_TIMING = {
  /** The first head within this many check-ins of the build, all three within `allHeadsCheckins`. */
  firstHeadCheckins: 3,
  allHeadsCheckins: 8,
  /** The manager at this share of the way (v5.25, card E10: University's comes at 5%, the same day as its heads are done: it is the cheap price after the three heads) from its build to the next neighbourhood's build (Waterfront, University, Industrial)… */
  managerShare: { min: 0.05, max: 1.15 },
  /** …and Uptown's, which has no next build, this many days after its own. */
  uptownManagerDays: { min: 0.1, max: 1.4 },
  /** A manager costs at least this many hours of the city's income when it is hired (v5.25: measured 0.2 h at University; the old rule was 4). */
  minHours: 0.05,
} as const;

/** The three reward rules (card E0 step 7), checked on the check-in player's story. */
export const REWARD_RULES = {
  /** Rewards are at most this share of all cash earned over the story. */
  storyShare: 0.1,
  /** While the newest shop has no manager: one claim pays at most this share of that manager's price… */
  claimOfManager: 0.1,
  /** …and one day's claims together pay less than this share of it. */
  dayOfManager: 1,
} as const;

/** Card E2b step 7: the story as a whole, for the check-in player. */
export const STORY_RULES = {
  /** No gap between two scenes over this many minutes of play (the play clock, not the wall clock: a check-in is 5 min). */
  maxSceneGapPlayMinutes: 64,
  /** Days of the story, from the first scene to the finale, with no scene at all (v5.25, card E10: measured 2 of 7: the Pier 9 wait has no scene in it, and the gap above is that wait; story slots for it are W6's). */
  scenelessDays: 2,
} as const;

/** Card E2b step 7: the story rules measured on a finished check-in run (see STORY_RULES). */
export function storyRules(r: ReturnType<typeof run>) {
  let prev = 0;
  let longest = { id: '', minutes: 0 };
  for (const x of r.scenes) {
    const minutes = (x.t - prev) / 60;
    if (minutes > longest.minutes) longest = { id: x.id, minutes };
    prev = x.t;
  }
  const finale = r.scenes.find((x) => x.id === 'uptown-4')?.wall;
  const days = new Set(r.scenes.map((x) => Math.floor(x.wall / 86400)));
  const lastDay = finale === undefined ? -1 : Math.floor(finale / 86400);
  const scenelessDays = Array.from({ length: lastDay + 1 }, (_, d) => d).filter((d) => !days.has(d));
  // the fleet buys are scooter, car, van, drone, in that order
  const drone = r.buys.filter((b) => b.label === 'fleet')[VEHICLES.length - 2];
  return { longestGap: longest, scenelessDays, droneDay: drone ? drone.wall / 86400 : NaN, finaleDay: finale === undefined ? NaN : finale / 86400 };
}

/** Card E0 step 5: after Nonna's takeover the best item should seldom be just the cheapest, and the third best should not be far behind. */
export const DECISION_TARGETS = { cheapestShare: 0.55, thirdOverBest: 3 } as const;

export interface Session1Result {
  /** Minutes. */
  heads: number[];
  takeover: number;
  opens: number;
  manager: number;
  finale: number;
  /** Seconds between purchases, from the start to the finale. */
  medianGap: number;
  maxGap: number;
  /** Minutes between scenes (the longest). */
  sceneGap: number;
  /** Before the Suburbs build (v5.25; it was between Nonna's takeover and the build): the first Expand, the Stone oven and one decor tier were bought. */
  bought: { expand: boolean; stone: boolean; decor: boolean };
  /** Suburbs was not built before Nonna took over. */
  suburbsLocked: boolean;
  scenes: { id: string; minutes: number }[];
  /** v5.25: when each layer first appears (see LAYER_SESSIONS). */
  layers: LayerFirsts;
  rewards: ReturnType<typeof rewardRules>;
  decisions: ReturnType<typeof decisionMetric>;
}

/** Play session 1 and measure it against SESSION1. */
export function session1(c: Cfg = {}): Session1Result {
  applyCfg({ ...c, rewards: c.rewards ?? true });
  const sec: Record<keyof LayerFirsts, number | undefined> = { gameDay: undefined, boats: undefined, rival: undefined, cameo: undefined };
  const city = hoodIds(cityOf(G.newGame(0)));
  const r = run('continuous', 0, 0, undefined, {
    atScene: 'suburbs-4',
    maxWall: 4 * 3600,
    onSecond: (s, wall) => {
      const ran = (key: string) => ((s.x?.[key] as { n?: number } | undefined)?.n ?? 0) >= 1;
      if (sec.gameDay === undefined && ran(LAYER_KEYS.gameDay)) sec.gameDay = wall;
      if (sec.boats === undefined && ran(LAYER_KEYS.boats)) sec.boats = wall;
      if (sec.rival === undefined && city.some((id) => rivalOpen(s, id))) sec.rival = wall;
      if (sec.cameo === undefined && cameoOpen(s)) sec.cameo = wall;
    },
  });
  const min = (x: number | undefined) => (x === undefined ? NaN : x / 60);
  const at = (id: string) => r.scenes.find((x) => x.id === id)?.wall;
  const takeover = at('downtown-4');
  const opens = r.timeline.suburbs?.build;
  const finale = at('suburbs-4');
  // the gaps are read over the first SESSION1.windowMinutes (what follows is the wait for the rival's two stars)
  const end = Math.min(finale ?? r.wall, SESSION1.windowMinutes * 60);
  const walls = r.buys.filter((b) => b.wall <= end).map((b) => b.wall);
  const gaps = walls.map((w, i) => w - (i ? walls[i - 1] : 0));
  gaps.push(end - (walls.length ? walls[walls.length - 1] : 0));
  // a gap counts when it starts in the window, however far past it the next scene is
  const sceneWalls = [...r.scenes.map((x) => x.wall), end].filter((w, i, all) => w <= end || (i > 0 && all[i - 1] <= end));
  // v5.25: Suburbs is built the moment Nonna takes over (the reward cash at her takeover pays for it at once), so the window is the whole of session 1 up to the build
  const between = r.buys.filter((b) => opens !== undefined && b.wall <= opens).map((b) => b.label);
  return {
    heads: r.headBuys.filter((h) => h.id === 'downtown').map((h) => min(h.wall)),
    takeover: min(takeover),
    opens: min(opens),
    manager: min(r.timeline.suburbs?.manager),
    finale: min(finale),
    medianGap: [...gaps].sort((a, b) => a - b)[Math.floor(gaps.length / 2)],
    maxGap: Math.max(...gaps),
    sceneGap: Math.max(...sceneWalls.map((w, i) => w - (i ? sceneWalls[i - 1] : 0))) / 60,
    bought: {
      expand: between.some((l) => l.includes('expand')),
      stone: between.some((l) => l.endsWith(':grade')),
      decor: between.some((l) => l.includes(':decor-')),
    },
    suburbsLocked: takeover === undefined || opens === undefined || opens >= takeover,
    scenes: r.scenes.map((x) => ({ id: x.id, minutes: x.wall / 60 })),
    // the visitor is the day-30 gift's: it cannot come before day 30 of the calendar, whatever the gate says
    layers: {
      gameDay: min(sec.gameDay),
      boats: min(sec.boats),
      rival: min(sec.rival),
      cameo: Math.max(min(sec.cameo), (GIFT_LENGTH - 1) * 24 * 60),
    },
    rewards: rewardRules(r),
    decisions: decisionMetric(r, takeover ?? 0, finale ?? Infinity),
  };
}

export interface ManagerRow {
  id: string;
  /** Days since install. */
  build: number;
  head1: number;
  heads3: number;
  manager: number;
  /** Check-ins after the build when the first head and the third head were hired. */
  head1Checkins: number;
  heads3Checkins: number;
  /** Manager day as a share of the way from this build to the next one (Uptown: null) and, for Uptown, days after its build. */
  share: number | null;
  daysAfter: number;
  /** The manager's price in hours of the city's income when it was hired. */
  hours: number;
}

/** The check-in player's story, played on for two days past the finale, so Uptown's manager (which comes after its finale) is seen. */
export function managerRun() {
  return run('checkin', SESSION, AWAY, undefined, { keepGoing: true, maxWall: 8 * 86400 });
}

/** Waterfront to Uptown's heads and manager in a finished check-in run (every wall time in seconds since install). */
export function managerRows(r: ReturnType<typeof run>): ManagerRow[] {
  const day = (w: number | undefined) => (w === undefined ? NaN : w / 86400);
  const cycle = SESSION + AWAY;
  const ids = ['waterfront', 'university', 'industrial', 'uptown'] as const;
  return ids.map((id, i) => {
    const t = r.timeline[id] ?? {};
    const next = i + 1 < ids.length ? r.timeline[ids[i + 1]]?.build : undefined;
    const build = t.build ?? NaN;
    const manager = t.manager ?? NaN;
    return {
      id,
      build: day(t.build),
      head1: day(t.head1),
      heads3: day(t.heads3),
      manager: day(t.manager),
      head1Checkins: Math.floor((t.head1 ?? NaN) / cycle) - Math.floor(build / cycle),
      heads3Checkins: Math.floor((t.heads3 ?? NaN) / cycle) - Math.floor(build / cycle),
      share: next === undefined ? null : (manager - build) / (next - build),
      daysAfter: (manager - build) / 86400,
      hours: t.managerHours ?? NaN,
    };
  });
}

/** Print session 1's table: the target and the result. */
function session1Check() {
  const m = session1();
  const f = (x: number) => (Number.isFinite(x) ? x.toFixed(1) : 'n/a');
  console.log(`Downtown heads  ${SESSION1.downtownHeads.join(' / ')} min      -> ${m.heads.map(f).join(' / ')}`);
  console.log(`Nonna           ${SESSION1.takeover} min               -> ${f(m.takeover)}`);
  console.log(`Suburbs opens   ${SESSION1.suburbsOpens} min              -> ${f(m.opens)}`);
  console.log(`Suburbs manager ${SESSION1.suburbsManager} min              -> ${f(m.manager)}`);
  console.log(`Suburbs finale  ${SESSION1.suburbsFinale} min              -> ${f(m.finale)}`);
  console.log(
    `purchase gaps: median ${m.medianGap} s (max ${SESSION1.medianBuyGapSeconds}), longest ${m.maxGap} s (max ${SESSION1.maxBuyGapSeconds}); longest scene gap ${m.sceneGap.toFixed(1)} min (max ${SESSION1.maxSceneGapMinutes})`,
  );
  console.log(`bought before the build: ${JSON.stringify(m.bought)}; Suburbs locked until Nonna: ${m.suburbsLocked}`);
  console.log(`scenes ${m.scenes.map((x) => `${x.id}@${f(x.minutes)}`).join(' ')}`);
  const ls = layerSessions(m.layers, m.opens);
  console.log(
    `layers first appear (min / ${LAYER_SESSIONS.minutes}-min session): ${(Object.keys(m.layers) as (keyof LayerFirsts)[]).map((k) => `${k} ${f(m.layers[k])} / ${ls.sessions[k]}`).join(', ')}; none before Suburbs opens: ${ls.afterShop}; one to a session: ${ls.distinct}`,
  );
  console.log(
    `rewards ${(m.rewards.share * 100).toFixed(1)}% of cash; decisions ${(m.decisions.cheapestShare * 100).toFixed(0)}% cheapest, third/best ${m.decisions.medianRatio3.toFixed(1)}`,
  );
}

/** Print manager timing and the reward rules of the check-in run. */
function managersCheck() {
  applyCfg({ ...base, rewards: true });
  const r = managerRun();
  for (const m of managerRows(r))
    console.log(
      `${m.id.padEnd(10)} build d${m.build.toFixed(2)}  head1 d${m.head1.toFixed(2)} (+${m.head1Checkins} check-ins)  heads3 d${m.heads3.toFixed(2)} (+${m.heads3Checkins})  manager d${m.manager.toFixed(2)} (${m.share === null ? `${m.daysAfter.toFixed(2)} days after its build` : `${(m.share * 100).toFixed(0)}% of the way to the next build`}; ${m.hours.toFixed(1)} h of income)`,
    );
  console.log(reportLines(r).slice(0, 2).join('\n'));
  const q = storyRules(r);
  console.log(
    `story: longest gap between scenes ${q.longestGap.minutes.toFixed(1)} min of play (${q.longestGap.id}; max ${STORY_RULES.maxSceneGapPlayMinutes}); days without a scene before the finale: ${q.scenelessDays.join(',') || 'none'}; drones bought day ${q.droneDay.toFixed(2)}, finale day ${q.finaleDay.toFixed(3)}`,
  );
}

/**
 * v5.25 (card E10): the old shops stay worth visiting. At the moment each hood after Suburbs opens, Downtown and Suburbs each earn at least this share of
 * the city's income (the renovations' x2 to x4 keep them there while the hoods after them grow).
 */
export const OLD_SHOP_SHARE = 0.1;

export interface OldShopRow {
  hood: string;
  day: number;
  downtown: number;
  suburbs: number;
}

/** The check-in player's story, and at each build after Suburbs the share of the city's income Downtown and Suburbs earn (see OLD_SHOP_SHARE). */
export function oldShopShares(): OldShopRow[] {
  applyCfg({ ...base, rewards: true });
  const rows: OldShopRow[] = [];
  const seen = new Set<string>(NEIGHBORHOODS.slice(0, 2).map((n) => n.id));
  run('checkin', SESSION, AWAY, undefined, {
    onSecond: (s, wall) => {
      for (const n of NEIGHBORHOODS) {
        if (!s.shops[n.id].built || seen.has(n.id)) continue;
        seen.add(n.id);
        const e = NEIGHBORHOODS.map((h) => (s.shops[h.id].built ? G.shopEarnings(s, h.id) : 0));
        const total = e.reduce((a, b) => a + b, 0);
        rows.push({ hood: n.id, day: wall / 86400, downtown: e[0] / total, suburbs: e[1] / total });
      }
    },
  });
  return rows;
}

export const SESSION = 300;
export const AWAY = 4 * 3600;
/** Target day of each pizzeria's first scene, and of the finale (card E1 step 7, v5.15): the check-in player must land within STORY_TOLERANCE of each. */
// v5.25 (card E10): the Home city takes about 7 days with the renovating player (scripts/review/sim2.ts: stars, renovations, decor). Waterfront and University
// come together (University's build waits for Waterfront's chapter 3 and nothing in between costs time), then the Pier 9 bid, Industrial's heads and Uptown's
// heads are the waits that spread the rest.
export const TARGETS = { waterfront: 0.7, university: 0.85, industrial: 4.2, uptown: 4.8, finale: 7.0 };
export const STORY_TOLERANCE = 0.3;
/**
 * Per target: 0.3 days, but the finale 0.31. Since card T1a the finale is the end of a chain of play-time waits (Uptown's act 2 -> its
 * interlude 600 s -> act 3 -> its interlude 660 s -> the rival challenge), so it comes five check-ins after Uptown's first scene whatever the
 * economy does; a check-in is 0.17 days, so with Uptown at 4.25 (its band is 4.1 to 4.7) the finale lands at 5.106, 0.006 days over. One
 * check-in earlier would put Uptown at 4.08, 0.017 under its band. Card E2b's report asks the owner to shorten an interlude instead.
 */
export const STORY_TOLERANCES = { waterfront: 0.33, university: 0.3, industrial: 0.3, uptown: 0.3, finale: 0.4 } as const;
export const BANDS = {
  waterfront: [TARGETS.waterfront - STORY_TOLERANCE, TARGETS.waterfront + STORY_TOLERANCE],
  university: [TARGETS.university - STORY_TOLERANCE, TARGETS.university + STORY_TOLERANCE],
  industrial: [TARGETS.industrial - STORY_TOLERANCE, TARGETS.industrial + STORY_TOLERANCE],
  uptown: [TARGETS.uptown - STORY_TOLERANCE, TARGETS.uptown + STORY_TOLERANCE],
  finale: [TARGETS.finale - STORY_TOLERANCE, TARGETS.finale + STORY_TOLERANCE],
} as const;
const SCENE = { waterfront: 'waterfront-1', university: 'university-1', industrial: 'industrial-1', uptown: 'uptown-1', finale: 'uptown-4' } as const;
type Key = keyof typeof TARGETS;
const KEYS: Key[] = ['waterfront', 'university', 'industrial', 'uptown', 'finale'];

const list = (name: string) => process.env[name]?.split(',').map(Number);
const num = (name: string) => (process.env[name] ? Number(process.env[name]) : undefined);

const base: Cfg = {
  ov: list('OV'),
  cm: list('CM'),
  mc: list('MC'),
  bc: list('BC'),
  og: list('OG'),
  fp: list('FP'),
  dc: list('DC'),
  vc: list('VC'),
  pier9: num('PB'),
  pier9Pizzas: num('PP'),
  cap: num('CAP'),
  eff: num('EFF'),
  eager: process.env.EAGER ? true : undefined,
};
const mcRatio = num('MCR');

/** Day each tracked scene first played in the 5-min-every-4-h run, stopping at `until` (or the end of the city). */
function days(c: Cfg, until?: string, maxDays = 12) {
  applyCfg(c);
  const r = run('checkin', SESSION, AWAY, undefined, { atScene: until, maxWall: maxDays * 86400 });
  const out: Partial<Record<Key, number>> = {};
  for (const k of KEYS) {
    const sc = r.scenes.find((x) => x.id === SCENE[k]);
    if (sc) out[k] = sc.wall / 86400;
  }
  return { out, r };
}

/**
 * Unlock day vs buildCost is a staircase (the greedy player only builds once the build beats every upgrade's gain per dollar),
 * so scan a log grid and keep the cost whose day is closest to the target instead of bisecting.
 */
function scan(f: (x: number) => number, target: number, lo: number, hi: number) {
  let best = { x: lo, err: Infinity, d: 0 };
  const probe = (x: number) => {
    const d = f(x);
    const err = Math.abs(Math.log(d / target));
    if (err < best.err - 1e-9 || (Math.abs(err - best.err) <= 1e-9 && x > best.x)) best = { x, err, d };
  };
  for (let x = lo; x <= hi; x *= 2) probe(x);
  const c = best.x;
  for (let x = c / 2; x <= c * 2; x *= 1.12) probe(x);
  return best;
}

function fit() {
  const cur: Cfg = {
    ...base,
    bc: base.bc ? [...base.bc] : NEIGHBORHOODS.map((n) => n.buildCost),
    cm: base.cm ? [...base.cm] : NEIGHBORHOODS.map((n) => n.costMult),
    mc: NEIGHBORHOODS.map((n) => n.managerCost),
  };
  const mk = num('MK'); // manager price in units of the shop's cost multiplier (v5.13); beats MCR when set
  const setBC = (i: number, v: number) => {
    cur.bc![i] = v;
    if (mk !== undefined) cur.mc![i] = mk * cur.cm![i];
    else if (mcRatio !== undefined) cur.mc![i] = v * mcRatio;
  };
  // stages: waterfront (2), university (3), industrial (4), uptown (5)
  for (let i = 2; i <= 5; i++) {
    const key = KEYS[i - 2];
    const lo = num('LO') ?? 1e4;
    const best = scan(
      (v) => {
        setBC(i, v);
        return days(cur, SCENE[key], TARGETS[key] * 2.5).out[key] ?? TARGETS[key] * 3;
      },
      TARGETS[key],
      i > 2 ? cur.bc![i - 1] / 8 : lo,
      num('HI') ?? 8.5e15,
    );
    setBC(i, best.x);
    console.log(
      `${NEIGHBORHOODS[i].id.padEnd(10)} buildCost ${best.x.toPrecision(3)} managerCost ${cur.mc![i].toPrecision(3)} -> day ${best.d.toFixed(2)} (target ${TARGETS[key]})`,
    );
  }
  // finale: Uptown's cost multiplier (cheaper upgrades -> more pizzas sooner)
  // finale: Uptown's cost multiplier within 0.3x-1.0x of its order value (v5.13: no outlier), the rest of the table fixed
  const ov5 = cur.ov?.[5] ?? NEIGHBORHOODS[5].orderValue;
  const best = scan(
    (v) => {
      cur.cm![5] = v;
      if (mk !== undefined) cur.mc![5] = mk * v;
      return days(cur, 'uptown-4', 9).out.finale ?? 20;
    },
    TARGETS.finale,
    0.3 * ov5,
    1.0 * ov5,
  );
  cur.cm![5] = Math.min(ov5, Math.max(0.3 * ov5, best.x));
  if (mk !== undefined) cur.mc![5] = mk * cur.cm![5];
  console.log(`uptown costMult ${best.x.toPrecision(3)} -> finale day ${best.d.toFixed(2)} (target ${TARGETS.finale})`);
  console.log(
    JSON.stringify({
      ov: cur.ov ?? NEIGHBORHOODS.map((n) => n.orderValue),
      bc: cur.bc!.map((v) => +v.toPrecision(3)),
      cm: cur.cm!.map((v) => +v.toPrecision(3)),
      mc: cur.mc!.map((v) => +v.toPrecision(3)),
    }),
  );
}

function check() {
  const c = { ...base };
  for (const [sess, away] of [
    [300, 4 * 3600],
    [300, 8 * 3600],
    [600, 3 * 3600],
    [120, 2 * 3600],
  ] as const) {
    applyCfg(c);
    const r = run('checkin', sess, away);
    const m: Record<string, number> = {};
    for (const x of r.scenes) if (x.id.endsWith('-1') || x.id === 'uptown-4') m[x.id] = +(x.wall / 86400).toFixed(2);
    console.log(
      `${sess / 60} min every ${(sess + away) / 3600} h: ${(r.wall / 86400).toFixed(1)} days, done=${r.s.cityComplete}, ${JSON.stringify(m)}; ${endSummary(r, sess, away)}`,
    );
  }
  console.log(
    `old shops' share of the city's income at each opening: ${oldShopShares()
      .map((r) => `${r.hood} d${r.day.toFixed(2)} Downtown ${(r.downtown * 100).toFixed(0)}% Suburbs ${(r.suburbs * 100).toFixed(0)}%`)
      .join(' · ')} (min ${OLD_SHOP_SHARE * 100}%)`,
  );
  endgameCheck();
}

// ---- v5.15: after the story. The check-in player keeps coming back every 4 h for 5 min, buys heads, Flagships and golden ovens
// (the three mastery stars) and defends each weekly counter-attack. Targets: the story days above, and 18 stars between day 10 and 14. ----

// (INSTALL, the simulated player's Monday-morning install moment, is sim2.ts's: the events and the attack week are local time)
/** v5.25 (card E10): the story takes 7 days, and the stars of the last shops come after it (measured: 6 stars on day 7.0, 12 on 7.5, 18 on 15.3). */
export const STAR_DAYS = { min: 12, max: 16 };
/** How much more the player wants a star step than its income gain alone says (a prestige purchase), STARK=n. */
const STARK = num('STARK') ?? 3;
const DEFEND_TAPS_PER_SECOND = num('TAPS') ?? 3;
const TOP_FOOTPRINT = FOOTPRINTS.length - 1;
const TOP_GRADE = OVEN_GRADES.length - 1;

/** The purchases that move a mastery star one step, with the preference the check-in player gives them. */
function starSteps(s: G.GameState): ReturnType<typeof options> {
  const out: ReturnType<typeof options> = [];
  for (const n of NEIGHBORHOODS) {
    const shop = s.shops[n.id];
    if (!shop.built) continue;
    const have = masteryStars(shop, cityOf(s));
    const want: G.Upgrade[] = [];
    if (!have.heads) for (const k of HEAD_KINDS) if (!shop.heads[k]) want.push(G.HEAD_UPGRADE[k]);
    if (shop.footprint < TOP_FOOTPRINT) want.push('expand');
    if (shop.grade < TOP_GRADE) want.push('grade');
    for (const what of want) {
      const cost = G.upgradeCostOf(s, n.id, what);
      if (cost === null || G.upgradeLock(s, n.id, what)) continue;
      const gain = Math.max(G.upgradeGain(s, n.id, what) ?? 0, 0.01 * G.shopEarnings(s, n.id)) * STARK;
      out.push({ label: `${n.id}:${what}`, cost, gain, buy: (st) => G.buyUpgrade(st, n.id, what) });
    }
  }
  return out;
}

export interface EndgameResult {
  /** Days since install when the city reached 6, 12 and 18 stars (null = not within the limit). */
  starDay: Record<6 | 12 | 18, number | null>;
  attacks: number;
  won: number;
  lost: number;
  expired: number;
  days: number;
  stars: number;
}

/** Play on from the end of the story (state `s0`, `wall0` real seconds since install) as the 5-min-every-4-h player, up to `maxDays`. */
export function endgame(s0: G.GameState, wall0: number, maxDays = 30, minAttacks = 3): EndgameResult {
  let s = s0;
  let wall = wall0;
  const res: EndgameResult = { starDay: { 6: null, 12: null, 18: null }, attacks: 0, won: 0, lost: 0, expired: 0, days: 0, stars: 0 };
  let lastWeek = -1;
  while (wall < maxDays * 86400) {
    for (let k = 0; k < SESSION; k++) {
      const now = INSTALL + (wall + k) * 1000;
      if (k === 0) {
        const v = attackView(s, now);
        if (v.phase === 'open') {
          const r = startChallenge(s, now);
          if (r.ok) s = r.state;
        }
      }
      const a = getFeature(s, counterattack);
      if (a.challenge && a.target) for (let t = 0; t < DEFEND_TAPS_PER_SECOND; t++) s = G.tapShop(s, a.target);
      s = G.playTick(s, 1, now);
      const st = getFeature(s, counterattack);
      if (st.open && st.seenWeek !== lastWeek) {
        res.attacks++;
        lastWeek = st.seenWeek;
      }
      if (st.news) {
        if (st.news.kind === 'won') res.won++;
        else if (st.news.kind === 'lost') res.lost++;
        else res.expired++;
        s = ackAttack(s);
      }
      for (let q = 0; q < 30; q++) {
        const opts = [...starSteps(s), ...options(s)].sort((x, y) => y.gain / y.cost - x.gain / x.cost);
        if (!opts.length) break;
        const r = opts[0].buy(s);
        if (!r.ok) break;
        s = r.state;
      }
      const total = masteryTotal(s);
      for (const m of [6, 12, 18] as const) if (total >= m && res.starDay[m] === null) res.starDay[m] = +((wall + k) / 86400).toFixed(2);
      res.stars = total;
      if (total >= 18 && res.attacks >= minAttacks) {
        res.days = (wall + k) / 86400;
        return res;
      }
    }
    wall += SESSION;
    s = { ...s, lastSavedAt: INSTALL + wall * 1000 };
    wall += AWAY;
    s = G.applyOffline(s, INSTALL + wall * 1000).state;
  }
  res.days = wall / 86400;
  return res;
}

/**
 * v5.15: the top oven grade (Golden) and the top footprint (Flagship) are the last two mastery stars of every shop. Scale both by one
 * factor k (the other tiers stay as they are) until the check-in player has all 18 stars on the middle of STAR_DAYS, then print the
 * two prices and the day table. Round the printed numbers by hand, put them in src/content/tuning.ts and run `check`.
 *   npx tsx scripts/pacing-fit.ts fitstars        (TARGET=12 to move the target day)
 */
function fitStars() {
  const target = num('TARGET') ?? (STAR_DAYS.min + STAR_DAYS.max) / 2;
  const og = OVEN_GRADES.map((g) => g.cost);
  const fp = FOOTPRINTS.map((f) => f.cost);
  const cfgOf = (k: number): Cfg => ({ ...base, og: [...og.slice(1, 4), og[4] * k], fp: [...fp.slice(1, 4), fp[4] * k] });
  const dayOf = (k: number) => {
    applyCfg(cfgOf(k));
    const r = run('checkin', SESSION, AWAY);
    return endgame(r.s, r.wall, 40).starDay[18] ?? 60;
  };
  const best = scan(
    (k) => {
      const d = dayOf(k);
      console.log(`   k ${k.toPrecision(3)} -> all 18 stars on day ${d.toFixed(2)}`);
      return d;
    },
    target,
    1,
    4096,
  );
  console.log(
    `k ${best.x.toPrecision(3)}: golden oven ${(og[4] * best.x).toPrecision(3)}, flagship ${(fp[4] * best.x).toPrecision(3)} (x costMult) -> day ${best.d.toFixed(2)} (target ${target})`,
  );
  applyCfg(cfgOf(best.x));
  endgameCheck();
}

/** One line: the story days of the 5-min-every-4-h player, then the days its stars come in and how the attacks went. */
function endgameCheck() {
  applyCfg({ ...base });
  const r = run('checkin', SESSION, AWAY);
  const story = KEYS.map((k) => `${k} ${((r.scenes.find((x) => x.id === SCENE[k])?.wall ?? NaN) / 86400).toFixed(2)}`).join(' / ');
  const e = endgame(r.s, r.wall);
  const ok = (v: number | null, lo: number, hi: number) => (v !== null && v >= lo && v <= hi ? 'ok' : 'OUT');
  console.log(
    `day table: story ${story} (targets ${KEYS.map((k) => TARGETS[k]).join(' / ')}) | stars 6 d${e.starDay[6]} 12 d${e.starDay[12]} 18 d${e.starDay[18]} (target ${STAR_DAYS.min}-${STAR_DAYS.max}: ${ok(e.starDay[18], STAR_DAYS.min, STAR_DAYS.max)}) | attacks ${e.attacks}: won ${e.won}, lost ${e.lost}, expired ${e.expired} (${COUNTERATTACK.challengeSeconds / 60} min, x${COUNTERATTACK.targetMargin})`,
  );
}

// ---- random local search over the whole table (loss on the 5-min-every-4-h run) ----
interface Vec {
  bc: number[];
  cm: number[];
  mcr: number;
  ovg: number;
  og: number;
  fp: number;
}
const toCfg = (v: Vec): Cfg => {
  const ov = [3, 10, ...[2, 3, 4, 5].map((i) => 10 * Math.pow(v.ovg, i - 1))];
  const mc = v.bc.map((b, i) => (i < 2 ? NEIGHBORHOODS[i].managerCost : b * v.mcr));
  return {
    ...base,
    ov: base.ov ?? ov,
    bc: [0, 450, ...v.bc.slice(2)],
    cm: [1, 4.5, ...v.cm.slice(2)],
    mc,
    og: [400 * v.og, 12_000 * v.og, 400_000 * v.og, 12_000_000 * v.og],
    fp: [500 * v.fp, 15_000 * v.fp, 500_000 * v.fp, 15_000_000 * v.fp],
  };
};
function loss(v: Vec) {
  const c = toCfg(v);
  applyCfg(c);
  const r = run('checkin', SESSION, AWAY, undefined, { maxWall: 9 * 86400 });
  let L = 0;
  const got: number[] = [];
  for (const k of KEYS) {
    const sc = r.scenes.find((x) => x.id === SCENE[k]);
    const d = sc ? sc.wall / 86400 : 12;
    got.push(d);
    const e = Math.max(0, Math.abs(Math.log(d / TARGETS[k])) - 0.06);
    L += 100 * e * e;
  }
  const st = sessionStats(r, SESSION, AWAY, 86400);
  for (const n of st.counts) if (n < 5) L += 0.3 * (5 - n) ** 2;
  return { L, got, min: st.min, r };
}
function search(seed: number, iters: number, start: Vec) {
  let rnd = seed;
  const rand = () => {
    rnd = (rnd * 1664525 + 1013904223) % 4294967296;
    return rnd / 4294967296;
  };
  const gauss = () => Math.sqrt(-2 * Math.log(rand() + 1e-9)) * Math.cos(2 * Math.PI * rand());
  let cur = start;
  let best = loss(cur);
  console.log('start', best.L.toFixed(2), best.got.map((x) => x.toFixed(2)).join(' '), 'min', best.min);
  const fields = ['bc2', 'bc3', 'bc4', 'bc5', 'cm2', 'cm3', 'cm4', 'cm5', 'mcr', 'ovg', 'og', 'fp'];
  for (let it = 0; it < iters; it++) {
    const nxt: Vec = { ...cur, bc: [...cur.bc], cm: [...cur.cm] };
    const n = 1 + Math.floor(rand() * 3);
    for (let j = 0; j < n; j++) {
      const f = fields[Math.floor(rand() * fields.length)];
      const m = Math.exp(gauss() * 0.22);
      if (f.startsWith('bc')) nxt.bc[+f[2]] *= m;
      else if (f.startsWith('cm')) nxt.cm[+f[2]] *= m;
      else (nxt as any)[f] *= m;
    }
    const r = loss(nxt);
    if (r.L <= best.L) {
      cur = nxt;
      best = r;
      console.log(`it ${it} loss ${r.L.toFixed(2)} days ${r.got.map((x) => x.toFixed(2)).join(' ')} min ${r.min}`);
      console.log(JSON.stringify(cur));
    }
  }
  return cur;
}

// ---- stage-wise 2-D scan: buildCost x orderValue, scoring BOTH the greedy sim player and an "eager" one (builds the moment it can pay) ----
function dayOfScene(c: Cfg, eager: boolean, scene: string, maxDays: number) {
  applyCfg({ ...c, eager });
  const r = run('checkin', SESSION, AWAY, undefined, { atScene: scene, maxWall: maxDays * 86400 });
  const sc = r.scenes.find((x) => x.id === scene);
  return sc ? sc.wall / 86400 : maxDays * 1.5;
}
function fit2() {
  const rho = num('RHO') ?? 0.45;
  const mcr2 = mcRatio ?? 0.5;
  const mk = num('MK'); // manager price in units of the shop's cost multiplier (v5.13); beats MCR when set
  const bcMax = num('BCMAX') ?? Infinity; // the engine's what-if gains stop at 2^53 (about 9.0e15): keep builds below it
  const cur = { ov: [3, 10, 0, 0, 0, 0], bc: [0, 450, 0, 0, 0, 0], cm: [1, 4.5, 0, 0, 0, 0], mc: [0, 600, 0, 0, 0, 0] };
  const fixed = (process.env.FIX ?? '')
    .split(';')
    .filter(Boolean)
    .map((s) => s.split(',').map(Number)); // optional [ov,bc] for finished stages
  for (let i = 2; i <= 5; i++) {
    const key = KEYS[i - 2];
    const T = TARGETS[key];
    const prevOv = cur.ov[i - 1];
    let best = { score: Infinity, ov: 0, bc: 0, g: 0, e: 0 };
    const tryIt = (ov: number, bc: number) => {
      const c: Cfg = {
        ...base,
        ov: [...cur.ov.slice(0, i), ov, ...cur.ov.slice(i + 1)],
        bc: [...cur.bc.slice(0, i), bc, ...cur.bc.slice(i + 1)],
        cm: [...cur.cm.slice(0, i), ov * rho, ...cur.cm.slice(i + 1)],
        mc: [...cur.mc.slice(0, i), mk !== undefined ? ov * rho * mk : bc * mcr2, ...cur.mc.slice(i + 1)],
      };
      if (bc > bcMax) return;
      const g = dayOfScene(c, false, SCENE[key], T * 2.2);
      const e = dayOfScene(c, true, SCENE[key], T * 2.2);
      const score = Math.log(g / T) ** 2 + 0.5 * Math.log(e / T) ** 2;
      if (score < 0.01 && process.env.VERBOSE)
        console.log(`   ${NEIGHBORHOODS[i].id} ov ${ov.toPrecision(3)} bc ${bc.toPrecision(3)} greedy ${g.toFixed(2)} eager ${e.toFixed(2)}`);
      if (score < best.score - 1e-4 || (Math.abs(score - best.score) <= 1e-4 && (process.env.TIE === 'big' ? ov > best.ov : ov < best.ov)))
        best = { score, ov, bc, g, e };
    };
    const fx = fixed[i - 2];
    if (fx) tryIt(fx[0], fx[1]);
    else {
      const bcLo = i === 2 ? 1e6 : cur.bc[i - 1] / 4;
      for (const f of (process.env.FS ?? '2.5,4,6,10,16').split(',').map(Number)) for (let bc = bcLo; bc <= bcLo * 4096; bc *= 2.5) tryIt(prevOv * f, bc);
      const { ov: o0, bc: b0 } = best;
      for (const fo of (process.env.FO ?? '0.8,0.9,1,1.12,1.25').split(',').map(Number)) for (const fb of [0.7, 0.85, 1, 1.2, 1.4]) tryIt(o0 * fo, b0 * fb);
    }
    cur.ov[i] = best.ov;
    cur.bc[i] = best.bc;
    cur.cm[i] = best.ov * rho;
    cur.mc[i] = mk !== undefined ? best.ov * rho * mk : best.bc * mcr2;
    console.log(
      `${NEIGHBORHOODS[i].id.padEnd(10)} ov ${best.ov.toPrecision(3)} buildCost ${best.bc.toPrecision(3)} -> greedy day ${best.g.toFixed(2)}, eager day ${best.e.toFixed(2)} (target ${T})`,
    );
  }
  console.log(JSON.stringify(cur));
}

// ---- v5.13: proportional fit. costMult = RHO x orderValue, buildCost = K x costMult, managerCost = MCR x buildCost (D434, D435) ----
function fit3() {
  const rho = num('RHO') ?? 0.45;
  const K = num('K') ?? 300;
  const mcr = mcRatio ?? 0.5;
  const cur = { ov: [3, 10, 0, 0, 0, 0], bc: [0, 450, 0, 0, 0, 0], cm: [1, 4.5, 0, 0, 0, 0], mc: [0, 600, 0, 0, 0, 0] };
  const set = (i: number, ov: number) => {
    cur.ov[i] = ov;
    cur.cm[i] = ov * rho;
    cur.bc[i] = ov * rho * K;
    cur.mc[i] = ov * rho * K * mcr;
  };
  for (let i = 2; i <= 5; i++) {
    const key = KEYS[i - 2];
    const best = scan(
      (ov) => {
        set(i, ov);
        return dayOfScene({ ...base, ...cur }, false, SCENE[key], TARGETS[key] * 2.5);
      },
      TARGETS[key],
      cur.ov[i - 1] * 1.5,
      cur.ov[i - 1] * 1e9,
    );
    set(i, best.x);
    console.log(
      `${NEIGHBORHOODS[i].id.padEnd(10)} ov ${best.x.toPrecision(3)} (x${(best.x / cur.ov[i - 1]).toExponential(1)} the last) buildCost ${cur.bc[i].toPrecision(3)} -> day ${best.d.toFixed(2)} (target ${TARGETS[key]})`,
    );
  }
  console.log(
    JSON.stringify({
      ov: cur.ov.map((v) => +v.toPrecision(3)),
      bc: cur.bc.map((v) => +v.toPrecision(3)),
      cm: cur.cm.map((v) => +v.toPrecision(3)),
      mc: cur.mc.map((v) => +v.toPrecision(3)),
    }),
  );
}

// ---- v5.13: proportional fit over the (orderValue step, K) plane. costMult = RHO x ov, buildCost = K x costMult, managerCost = MK x costMult.
// Several (ov, K) pairs reach the same day (the greedy player climbs the old ladder first), so list every pair that lands in the band and let the caller pick. ----
function fit4() {
  const rho = num('RHO') ?? 0.45;
  const mk = num('MK') ?? 1600;
  const ks = (process.env.KS ?? '200,300,450,700,1000').split(',').map(Number);
  const fovs = (process.env.FOV ?? '20,40,80,160,320,640,1300,2600,5200,10000').split(',').map(Number);
  const bcMax = num('BCMAX') ?? 8.5e15;
  const cmMax = num('CMMAX') ?? 4.5e7;
  const cur = { ov: [3, 10, 0, 0, 0, 0], bc: [0, 450, 0, 0, 0, 0], cm: [1, 4.5, 0, 0, 0, 0], mc: [0, 600, 0, 0, 0, 0] };
  const fixed = (process.env.FIX ?? '')
    .split(';')
    .filter(Boolean)
    .map((s) => s.split(',').map(Number)); // [ov,K] per finished stage
  const set = (i: number, ov: number, K: number) => {
    cur.ov[i] = ov;
    cur.cm[i] = ov * rho;
    cur.bc[i] = ov * rho * K;
    cur.mc[i] = ov * rho * mk;
  };
  for (let i = 2; i <= 5; i++) {
    const key = KEYS[i - 2];
    const T = TARGETS[key];
    const hits: { ov: number; K: number; g: number; e: number; score: number }[] = [];
    const tryIt = (ov: number, K: number) => {
      set(i, ov, K);
      // the engine's what-if gains stop at 2^53 (about 9.0e15): a price above it has no hint, so the whole ladder (Lv 125 costs 2e8 x costMult) must stay under it
      if (cur.bc[i] > bcMax || cur.cm[i] > cmMax || mk > K) return;
      const g = dayOfScene({ ...base, ...cur }, false, SCENE[key], T * 2.2);
      const e = dayOfScene({ ...base, ...cur }, true, SCENE[key], T * 2.2);
      const score = Math.log(g / T) ** 2 + 0.5 * Math.log(e / T) ** 2;
      hits.push({ ov, K, g, e, score });
      if (process.env.VERBOSE) console.log(`   ${NEIGHBORHOODS[i].id} ov ${ov.toPrecision(3)} K ${K} greedy ${g.toFixed(2)} eager ${e.toFixed(2)}`);
    };
    const fx = fixed[i - 2];
    if (fx) tryIt(fx[0], fx[1]);
    else for (const f of fovs) for (const K of ks) tryIt(cur.ov[i - 1] * f, K);
    hits.sort((a, b) => a.score - b.score || a.K - b.K);
    const good = hits.filter((h) => h.score < 0.01);
    console.log(
      `${NEIGHBORHOODS[i].id}: ${good.length} of ${hits.length} pairs within ~10% of day ${T}; best 6: ${hits
        .slice(0, 6)
        .map((h) => `ov ${h.ov.toPrecision(3)} K ${h.K} -> ${h.g.toFixed(2)}/${h.e.toFixed(2)}`)
        .join(' | ')}`,
    );
    if (!hits.length) {
      console.log('no pair fits the limits');
      return;
    }
    const pick = (process.env.PICK ?? 'smallK') === 'smallK' ? [...(good.length ? good : hits)].sort((a, b) => a.K - b.K || a.score - b.score)[0] : hits[0];
    set(i, pick.ov, pick.K);
  }
  console.log(
    JSON.stringify({
      ov: cur.ov.map((v) => +v.toPrecision(3)),
      bc: cur.bc.map((v) => +v.toPrecision(3)),
      cm: cur.cm.map((v) => +v.toPrecision(3)),
      mc: cur.mc.map((v) => +v.toPrecision(3)),
    }),
  );
}

// ---- polish: random local search on the last three stages, scoring the greedy and the eager player together ----
/** Nearest "readable" number: 1, 1.2, 1.5, 2, 2.5, 3, 3.5, 4, 5, 6, 7, 8, 9 x 10^n. */
const snap = (x: number) => {
  const e = Math.floor(Math.log10(x));
  const m = x / 10 ** e;
  const steps = [1, 1.2, 1.5, 2, 2.5, 3, 3.5, 4, 5, 6, 7, 8, 9, 10];
  return steps.reduce((b, s) => (Math.abs(Math.log(s / m)) < Math.abs(Math.log(b / m)) ? s : b)) * 10 ** e;
};
function polish(seed: number, iters: number) {
  const ov = list('OV')!,
    bc = list('BC')!,
    cm = list('CM')!;
  const names = ['bc3', 'ov4', 'bc4', 'ov5', 'bc5', 'cm5', 'mcr5'];
  let p: Record<string, number> = { bc3: bc[3], ov4: ov[4], bc4: bc[4], ov5: ov[5], bc5: bc[5], cm5: cm[5], mcr5: num('MCR5') ?? 0.5 };
  const cfgOf = (q: Record<string, number>): Cfg => {
    const o = [...ov],
      b = [...bc],
      c = [...cm],
      m = list('MC')!;
    b[3] = q.bc3;
    o[4] = q.ov4;
    b[4] = q.bc4;
    o[5] = q.ov5;
    b[5] = q.bc5;
    c[5] = q.cm5;
    m[3] = snap(b[3] * 0.5);
    m[4] = snap(b[4] * 0.5);
    m[5] = snap(b[5] * q.mcr5);
    return { ...base, ov: o, bc: b, cm: c, mc: m };
  };
  const score = (q: Record<string, number>) => {
    let L = 0;
    const out: string[] = [];
    for (const eager of [false, true]) {
      applyCfg({ ...cfgOf(q), eager });
      const r = run('checkin', SESSION, AWAY, undefined, { maxWall: 8 * 86400 });
      const dd: number[] = [];
      for (const k of ['industrial', 'uptown', 'finale'] as Key[]) {
        const sc = r.scenes.find((x) => x.id === SCENE[k]);
        const d = sc ? sc.wall / 86400 : 12;
        dd.push(d);
        const e = Math.max(0, Math.abs(Math.log(d / TARGETS[k])) - 0.05);
        L += 100 * e * e;
      }
      const st = sessionStats(r, SESSION, AWAY, 86400);
      for (const n of st.counts) if (n < 5) L += 0.3 * (5 - n) ** 2;
      out.push(`${eager ? 'E' : 'G'} ${dd.map((x) => x.toFixed(2)).join('/')} min${st.min}`);
    }
    return { L, out: out.join(' | ') };
  };
  let rnd = seed;
  const rand = () => {
    rnd = (rnd * 1664525 + 1013904223) % 4294967296;
    return rnd / 4294967296;
  };
  const gauss = () => Math.sqrt(-2 * Math.log(rand() + 1e-9)) * Math.cos(2 * Math.PI * rand());
  let best = score(p);
  console.log('start', best.L.toFixed(2), best.out);
  for (let it = 0; it < iters; it++) {
    const q = { ...p };
    const n = 1 + Math.floor(rand() * 2);
    for (let j = 0; j < n; j++) q[names[Math.floor(rand() * names.length)]] *= Math.exp(gauss() * 0.25);
    for (const k of names) if (k !== 'mcr5') q[k] = snap(q[k]);
    if (names.every((k) => q[k] === p[k])) continue;
    const s = score(q);
    if (s.L <= best.L) {
      p = q;
      best = s;
      console.log(`it ${it} loss ${s.L.toFixed(2)} ${s.out}`);
      console.log(JSON.stringify(Object.fromEntries(Object.entries(p).map(([k, v]) => [k, +v.toPrecision(3)]))));
    }
  }
}

// ---- v5.18 (card E3): the franchise. The check-in player finishes the home city, franchises, and plays Boston. ----
// sim2 plays the home city's story (its scenes, its layers, its bid), so Boston is played on that stand-in: the home tables are swapped for
// Boston's numbers (content/franchise.ts `cityNumbers(1)`, which cities/boston/ is to read) with the Franchise multiplier on every
// pizza's value, exactly what the engine's feature does. The story chain is the home one; Boston's own scenes (card T2) change
// the order of its beats, not the economy that this fits.

/** Boston's story takes about as many days as the home city's, given the multiplier: each of its beats lands within this many days of the home targets. */
export const BOSTON_TOLERANCE = 0.4;

/** Run `fn` with the home tables replaced by Boston's (every value times `mult`), then put them back. */
export function withBostonTables<T>(mult: number, fn: () => T, nums: CityNumbers = cityNumbers(1)): T {
  const saved = {
    hoods: NEIGHBORHOODS.map((n) => ({ ...n })),
    heads: { ...HEAD_COST_DOWNTOWN },
    vehicles: VEHICLES.map((v) => v.cost),
    bid: PIER9_BID.cost,
    homeBid: HOME_BID.cost,
    gates: [{ ...LAYER_GATES.rival }, { ...LAYER_GATES.boats }] as { hood: number; stars: number }[],
  };
  NEIGHBORHOODS.forEach((n, i) => Object.assign(n, { ...nums.hoods[i], orderValue: nums.hoods[i].orderValue * mult }));
  Object.assign(HEAD_COST_DOWNTOWN, nums.headCostFirst);
  VEHICLES.forEach((v, i) => {
    if (i > 0) v.cost = nums.vehicleCosts[i - 1];
  });
  (PIER9_BID as { cost: number }).cost = nums.bid.cost;
  // the city's own bid (what the engine reads) is a copy of PIER9_BID made when the module loaded: it moves too (v5.25, card E10)
  (HOME_BID as { cost: number }).cost = nums.bid.cost;
  // v5.25 (card E9): the layers' gates are the first city's (the engine does not apply them to Boston); this stand-in is the home city's engine, so they are off
  Object.assign(LAYER_GATES.rival, { hood: 0, stars: 0 });
  Object.assign(LAYER_GATES.boats, { hood: 0, stars: 0 });
  try {
    return fn();
  } finally {
    saved.hoods.forEach((n, i) => Object.assign(NEIGHBORHOODS[i], n));
    Object.assign(HEAD_COST_DOWNTOWN, saved.heads);
    VEHICLES.forEach((v, i) => {
      v.cost = saved.vehicles[i];
    });
    (PIER9_BID as { cost: number }).cost = saved.bid;
    (HOME_BID as { cost: number }).cost = saved.homeBid;
    Object.assign(LAYER_GATES.rival, saved.gates[0]);
    Object.assign(LAYER_GATES.boats, saved.gates[1]);
  }
}

export interface FranchiseDays {
  /** The home clear: the days of each beat, cash earned in the city, and what the franchise offers then. */
  home: { days: Record<Key, number>; earned: number; offered: boolean; stars: number; multiplier: number };
  /** Boston, played with that multiplier. */
  boston: { days: Record<Key, number>; done: boolean; startedWith: { city: string; cash: number } };
}

const daysOf = (r: ReturnType<typeof run>): Record<Key, number> =>
  Object.fromEntries(KEYS.map((k) => [k, (r.scenes.find((x) => x.id === SCENE[k])?.wall ?? NaN) / 86400])) as Record<Key, number>;

/** The check-in player: finish the home city, franchise when it can, play Boston. */
export function franchiseRun(): FranchiseDays {
  applyCfg({ ...base });
  const home = run('checkin', SESSION, AWAY);
  const at = INSTALL + home.wall * 1000;
  const gain = franchiseGain(home.s);
  const offered = canFranchise(home.s);
  const into = franchise(home.s, at);
  const mult = gain.multiplierAfter;
  const boston = withBostonTables(mult, () => run('checkin', SESSION, AWAY));
  return {
    home: { days: daysOf(home), earned: gain.earned, offered, stars: gain.stars, multiplier: mult },
    boston: { days: daysOf(boston), done: boston.s.cityComplete, startedWith: { city: into.city, cash: into.cash } },
  };
}

/** Print the day table: the targets, the home city's days, Boston's. */
function franchiseCheck() {
  const f = franchiseRun();
  const d = (x: number) => (Number.isFinite(x) ? x.toFixed(2) : 'n/a').padStart(6);
  console.log(
    `home clear: ${f.home.earned.toExponential(3)} earned -> ${f.home.stars} Stars (target ${FRANCHISE.starsPerClear}), x${f.home.multiplier}; franchise on offer: ${f.home.offered}; Boston starts as ${f.boston.startedWith.city} with $${f.boston.startedWith.cash}`,
  );
  console.log('day table (check-in player, 5 min every 4 h)');
  console.log('            target   home  boston');
  for (const k of KEYS) console.log(`${k.padEnd(10)} ${d(TARGETS[k])} ${d(f.home.days[k])} ${d(f.boston.days[k])}`);
  console.log(`Boston finished: ${f.boston.done}`);
}

/**
 * Fit Boston's one price factor (PRICE_FIT in content/franchise.ts) so the check-in player's five beats land on the days the home city's do,
 * given the multiplier (least squares on the log of the ratios). Prints the table to paste.
 */
function fitBoston() {
  applyCfg({ ...base });
  const home = run('checkin', SESSION, AWAY);
  const target = daysOf(home);
  const mult = franchiseGain(home.s).multiplierAfter;
  const plain = cityNumbers(1, false);
  const scale = (c: number): CityNumbers => ({
    ...plain,
    hoods: plain.hoods.map((h) => ({ ...h, buildCost: h.buildCost * c, costMult: h.costMult * c, managerCost: h.managerCost * c, headsCost: h.headsCost * c })),
    vehicleCosts: plain.vehicleCosts.map((x) => x * c),
    headCostFirst: Object.fromEntries(HEAD_KINDS.map((k) => [k, plain.headCostFirst[k] * c])) as CityNumbers['headCostFirst'],
    bid: { ...plain.bid, cost: plain.bid.cost * c },
  });
  let best = { c: 1, loss: Infinity, days: {} as Record<Key, number> };
  for (let c = 0.5; c <= 1.5001; c += 0.025) {
    applyCfg({ ...base });
    const r = withBostonTables(mult, () => run('checkin', SESSION, AWAY, undefined, { maxWall: 9 * 86400 }), scale(c));
    const d = daysOf(r);
    const loss = KEYS.reduce((t, k) => t + Math.pow(Math.log((Number.isFinite(d[k]) ? d[k] : 12) / target[k]), 2), 0);
    console.log(`c ${c.toFixed(3)}: ${KEYS.map((k) => d[k].toFixed(2)).join(' / ')} loss ${loss.toFixed(4)}`);
    if (loss < best.loss) best = { c, loss, days: d };
  }
  console.log(`home ${KEYS.map((k) => target[k].toFixed(2)).join(' / ')}`);
  console.log(`PRICE_FIT[1] = ${+best.c.toFixed(3)} -> ${KEYS.map((k) => best.days[k].toFixed(2)).join(' / ')}`);
}

/**
 * v5.25 (card E8): the Home ladder. Build prices are fixed (Suburbs 20K ... Uptown 1.5M), so what the fit moves is how rich a hood is: LADDER='{"industrial":1500}'
 * multiplies that hood's order value, cost multiplier, manager and heads together (a factor above 1 makes the check-in player wait longer for its
 * own stations, a factor below lets him max them before Industrial's "no missed orders" task, which then never finishes), plays the check-in story
 * and prints the days of the beats the targets name. `LADDER='{}'` prints the current tables' days.
 */
function ladderCheck() {
  const mult = JSON.parse(process.env.LADDER ?? '{}') as Record<string, number>;
  for (const [id, f] of Object.entries(mult)) {
    const n = NEIGHBORHOODS.find((x) => x.id === id) as unknown as Record<string, number> | undefined;
    if (!n) throw new Error(`no neighbourhood ${id}`);
    for (const k of ['orderValue', 'costMult', 'managerCost', 'headsCost']) n[k] *= f;
  }
  applyCfg({ ...base, rewards: true });
  const r = run('checkin', SESSION, AWAY, undefined, { maxWall: 12 * 86400 });
  const d = (id: string) => ((r.scenes.find((x) => x.id === id)?.wall ?? NaN) / 86400).toFixed(2);
  console.log(
    `day table: ${KEYS.map((k) => `${k} ${d(SCENE[k])} (target ${TARGETS[k]})`).join(' / ')}; industrial-4 ${d('industrial-4')}; city complete ${r.s.cityComplete}`,
  );
  for (const n of NEIGHBORHOODS)
    console.log(
      `${n.id.padEnd(10)} orderValue ${n.orderValue.toExponential(2)} costMult ${n.costMult.toExponential(2)} build ${n.buildCost.toExponential(2)} manager ${n.managerCost.toExponential(2)} heads ${n.headsCost.toExponential(2)}`,
    );
}

// (a test imports `endgame` and the targets above, so the commands only run when this file is the entry point)
if (require.main === module) {
  if (process.argv[2] === 'endgame') endgameCheck();
  else if (process.argv[2] === 'session1') session1Check();
  else if (process.argv[2] === 'managers') managersCheck();
  else if (process.argv[2] === 'fitstars') fitStars();
  else if (process.argv[2] === 'polish') polish(Number(process.env.SEED ?? 1), Number(process.env.ITERS ?? 60));
  else if (process.argv[2] === 'fit2') fit2();
  else if (process.argv[2] === 'fit3') fit3();
  else if (process.argv[2] === 'fit4') fit4();
  else if (process.argv[2] === 'franchise') franchiseCheck();
  else if (process.argv[2] === 'fitboston') fitBoston();
  else if (process.argv[2] === 'ladder') ladderCheck();
  else if (process.argv[2] === 'check') check();
  else if (process.argv[2] === 'search') {
    const start: Vec = process.env.START
      ? JSON.parse(process.env.START)
      : { bc: [0, 450, 5e7, 1.75e8, 5.5e8, 5.4e9], cm: [1, 4.5, 12, 34, 90, 250], mcr: 0.5, ovg: 2.7, og: 1, fp: 1 };
    search(Number(process.env.SEED ?? 1), Number(process.env.ITERS ?? 200), start);
  } else fit();
}
