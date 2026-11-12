/// <reference types="node" />
// Pacing fitter for the check-in player (v5.12). Not a test: a search tool for src/content/tuning.ts.
//
//   npx tsx scripts/pacing-fit.ts                 fit build costs (and Uptown's cost multiplier) to the targets below
//   npx tsx scripts/pacing-fit.ts check           just print the unlock days of the current tuning, all four sim rows
//   OV=3,10,27,75,200,550 CM=1,4.5,12,34,90,250 MCR=0.5 npx tsx scripts/pacing-fit.ts
//   K=300 RHO=0.45 MCR=0.5 npx tsx scripts/pacing-fit.ts fit3   v5.13: proportional costs. Per pizzeria one free number (its order value):
//                                    costMult = RHO x orderValue, buildCost = K x costMult, managerCost = MCR x buildCost; ov is bisected to the day target.
//
// Order values (OV), cost multipliers (CM), the manager-cost ratio (MCR = managerCost / buildCost) and the other cost tables
// (OG, FP, DC, VC, PB, PP, CAP, EFF as in scripts/review/sim2.ts) are chosen by hand; the fitter bisects each later pizzeria's
// buildCost so its first scene lands on the target day, one stage at a time (a stage only depends on earlier ones), then
// bisects Uptown's cost multiplier so the finale lands on its target. Round the printed numbers by hand and run `check`.
import { FOOTPRINTS, HEAD_KINDS, NEIGHBORHOODS, OVEN_GRADES } from '../src/content/tuning';
import { COUNTERATTACK } from '../src/content/endgame';
import * as G from '../src/engine/game';
import { getFeature } from '../src/engine/features';
import { ackAttack, counterattack, attackView, startChallenge } from '../src/engine/features/counterattack';
import { masteryStars, masteryTotal } from '../src/engine/features/mastery';
import { applyCfg, endSummary, options, run, sessionStats, type Cfg } from './review/sim2';

const SESSION = 300;
const AWAY = 4 * 3600;
/** Target day of each pizzeria's first scene, and of the finale (card E1 step 7, v5.15): the check-in player must land within STORY_TOLERANCE of each. */
export const TARGETS = { waterfront: 1.0, university: 2.0, industrial: 3.1, uptown: 4.4, finale: 4.8 };
export const STORY_TOLERANCE = 0.3;
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
  ov: list('OV'), cm: list('CM'), mc: list('MC'), bc: list('BC'),
  og: list('OG'), fp: list('FP'), dc: list('DC'), vc: list('VC'),
  pier9: num('PB'), pier9Pizzas: num('PP'), cap: num("CAP"), eff: num('EFF'), eager: process.env.EAGER ? true : undefined,
};
const mcRatio = num('MCR');

/** Day each tracked scene first played in the 5-min-every-4-h run, stopping at `until` (or the end of the city). */
function days(c: Cfg, until?: string, maxDays = 12) {
  applyCfg(c);
  const r = run('checkin', SESSION, AWAY, undefined, { atScene: until, maxWall: maxDays * 86400 });
  const out: Partial<Record<Key, number>> = {};
  for (const k of KEYS) { const sc = r.scenes.find((x) => x.id === SCENE[k]); if (sc) out[k] = sc.wall / 86400; }
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
  const cur: Cfg = { ...base, bc: base.bc ? [...base.bc] : NEIGHBORHOODS.map((n) => n.buildCost), cm: base.cm ? [...base.cm] : NEIGHBORHOODS.map((n) => n.costMult), mc: NEIGHBORHOODS.map((n) => n.managerCost) };
  const mk = num('MK'); // manager price in units of the shop's cost multiplier (v5.13); beats MCR when set
  const setBC = (i: number, v: number) => { cur.bc![i] = v; if (mk !== undefined) cur.mc![i] = mk * cur.cm![i]; else if (mcRatio !== undefined) cur.mc![i] = v * mcRatio; };
  // stages: waterfront (2), university (3), industrial (4), uptown (5)
  for (let i = 2; i <= 5; i++) {
    const key = KEYS[i - 2];
    const lo = num('LO') ?? 1e4;
    const best = scan((v) => { setBC(i, v); return days(cur, SCENE[key], TARGETS[key] * 2.5).out[key] ?? TARGETS[key] * 3; }, TARGETS[key], i > 2 ? cur.bc![i - 1] / 8 : lo, num("HI") ?? 8.5e15);
    setBC(i, best.x);
    console.log(`${NEIGHBORHOODS[i].id.padEnd(10)} buildCost ${best.x.toPrecision(3)} managerCost ${cur.mc![i].toPrecision(3)} -> day ${best.d.toFixed(2)} (target ${TARGETS[key]})`);
  }
  // finale: Uptown's cost multiplier (cheaper upgrades -> more pizzas sooner)
  // finale: Uptown's cost multiplier within 0.3x-1.0x of its order value (v5.13: no outlier), the rest of the table fixed
  const ov5 = cur.ov![5];
  const best = scan((v) => { cur.cm![5] = v; if (mk !== undefined) cur.mc![5] = mk * v; return days(cur, 'uptown-4', 9).out.finale ?? 20; }, TARGETS.finale, 0.3 * ov5, 1.0 * ov5);
  cur.cm![5] = Math.min(ov5, Math.max(0.3 * ov5, best.x));
  if (mk !== undefined) cur.mc![5] = mk * cur.cm![5];
  console.log(`uptown costMult ${best.x.toPrecision(3)} -> finale day ${best.d.toFixed(2)} (target ${TARGETS.finale})`);
  console.log(JSON.stringify({ ov: cur.ov, bc: cur.bc!.map((v) => +v.toPrecision(3)), cm: cur.cm!.map((v) => +v.toPrecision(3)), mc: cur.mc!.map((v) => +v.toPrecision(3)) }));
}

function check() {
  const c = { ...base };
  for (const [sess, away] of [[300, 4 * 3600], [300, 8 * 3600], [600, 3 * 3600], [120, 2 * 3600]] as const) {
    applyCfg(c);
    const r = run('checkin', sess, away);
    const m: Record<string, number> = {};
    for (const x of r.scenes) if (x.id.endsWith('-1') || x.id === 'uptown-4') m[x.id] = +(x.wall / 86400).toFixed(2);
    console.log(`${sess / 60} min every ${(sess + away) / 3600} h: ${(r.wall / 86400).toFixed(1)} days, done=${r.s.cityComplete}, ${JSON.stringify(m)}; ${endSummary(r, sess, away)}`);
  }
  endgameCheck();
}

// ---- v5.15: after the story. The check-in player keeps coming back every 4 h for 5 min, buys heads, Flagships and golden ovens
// (the three mastery stars) and defends each weekly counter-attack. Targets: the story days above, and 18 stars between day 10 and 14. ----

/** The install moment of the simulated player: a Monday morning, local time (the events and the attack week are local). */
const INSTALL = new Date(2026, 10, 9, 9, 0, 0).getTime();
export const STAR_DAYS = { min: 10, max: 14 };
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
    const have = masteryStars(shop);
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
      if (st.open && st.seenWeek !== lastWeek) { res.attacks++; lastWeek = st.seenWeek; }
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
      if (total >= 18 && res.attacks >= minAttacks) { res.days = (wall + k) / 86400; return res; }
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
  const best = scan((k) => { const d = dayOf(k); console.log(`   k ${k.toPrecision(3)} -> all 18 stars on day ${d.toFixed(2)}`); return d; }, target, 1, 4096);
  console.log(`k ${best.x.toPrecision(3)}: golden oven ${(og[4] * best.x).toPrecision(3)}, flagship ${(fp[4] * best.x).toPrecision(3)} (x costMult) -> day ${best.d.toFixed(2)} (target ${target})`);
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
  console.log(`day table: story ${story} (targets ${KEYS.map((k) => TARGETS[k]).join(' / ')}) | stars 6 d${e.starDay[6]} 12 d${e.starDay[12]} 18 d${e.starDay[18]} (target ${STAR_DAYS.min}-${STAR_DAYS.max}: ${ok(e.starDay[18], STAR_DAYS.min, STAR_DAYS.max)}) | attacks ${e.attacks}: won ${e.won}, lost ${e.lost}, expired ${e.expired} (${COUNTERATTACK.challengeSeconds / 60} min, x${COUNTERATTACK.targetMargin})`);
}

// ---- random local search over the whole table (loss on the 5-min-every-4-h run) ----
interface Vec { bc: number[]; cm: number[]; mcr: number; ovg: number; og: number; fp: number }
const toCfg = (v: Vec): Cfg => {
  const ov = [3, 10, ...[2, 3, 4, 5].map((i) => 10 * Math.pow(v.ovg, i - 1))];
  const mc = v.bc.map((b, i) => (i < 2 ? NEIGHBORHOODS[i].managerCost : b * v.mcr));
  return { ...base, ov: base.ov ?? ov, bc: [0, 450, ...v.bc.slice(2)], cm: [1, 4.5, ...v.cm.slice(2)], mc, og: [400 * v.og, 12_000 * v.og, 400_000 * v.og, 12_000_000 * v.og], fp: [500 * v.fp, 15_000 * v.fp, 500_000 * v.fp, 15_000_000 * v.fp] };
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
  const rand = () => { rnd = (rnd * 1664525 + 1013904223) % 4294967296; return rnd / 4294967296; };
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
      if (f.startsWith('bc')) nxt.bc[+f[2]] *= m; else if (f.startsWith('cm')) nxt.cm[+f[2]] *= m; else (nxt as any)[f] *= m;
    }
    const r = loss(nxt);
    if (r.L <= best.L) {
      cur = nxt; best = r;
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
  const fixed = (process.env.FIX ?? '').split(';').filter(Boolean).map((s) => s.split(',').map(Number)); // optional [ov,bc] for finished stages
  for (let i = 2; i <= 5; i++) {
    const key = KEYS[i - 2];
    const T = TARGETS[key];
    const prevOv = cur.ov[i - 1];
    let best = { score: Infinity, ov: 0, bc: 0, g: 0, e: 0 };
    const tryIt = (ov: number, bc: number) => {
      const c: Cfg = { ...base, ov: [...cur.ov.slice(0, i), ov, ...cur.ov.slice(i + 1)], bc: [...cur.bc.slice(0, i), bc, ...cur.bc.slice(i + 1)], cm: [...cur.cm.slice(0, i), ov * rho, ...cur.cm.slice(i + 1)], mc: [...cur.mc.slice(0, i), mk !== undefined ? ov * rho * mk : bc * mcr2, ...cur.mc.slice(i + 1)] };
      if (bc > bcMax) return;
      const g = dayOfScene(c, false, SCENE[key], T * 2.2);
      const e = dayOfScene(c, true, SCENE[key], T * 2.2);
      const score = Math.log(g / T) ** 2 + 0.5 * Math.log(e / T) ** 2;
      if (score < 0.01 && process.env.VERBOSE) console.log(`   ${NEIGHBORHOODS[i].id} ov ${ov.toPrecision(3)} bc ${bc.toPrecision(3)} greedy ${g.toFixed(2)} eager ${e.toFixed(2)}`);
      if (score < best.score - 1e-4 || (Math.abs(score - best.score) <= 1e-4 && (process.env.TIE === 'big' ? ov > best.ov : ov < best.ov))) best = { score, ov, bc, g, e };
    };
    const fx = fixed[i - 2];
    if (fx) tryIt(fx[0], fx[1]);
    else {
      const bcLo = i === 2 ? 1e6 : cur.bc[i - 1] / 4;
      for (const f of (process.env.FS ?? "2.5,4,6,10,16").split(",").map(Number)) for (let bc = bcLo; bc <= bcLo * 4096; bc *= 2.5) tryIt(prevOv * f, bc);
      const { ov: o0, bc: b0 } = best;
      for (const fo of (process.env.FO ?? "0.8,0.9,1,1.12,1.25").split(",").map(Number)) for (const fb of [0.7, 0.85, 1, 1.2, 1.4]) tryIt(o0 * fo, b0 * fb);
    }
    cur.ov[i] = best.ov; cur.bc[i] = best.bc; cur.cm[i] = best.ov * rho; cur.mc[i] = mk !== undefined ? best.ov * rho * mk : best.bc * mcr2;
    console.log(`${NEIGHBORHOODS[i].id.padEnd(10)} ov ${best.ov.toPrecision(3)} buildCost ${best.bc.toPrecision(3)} -> greedy day ${best.g.toFixed(2)}, eager day ${best.e.toFixed(2)} (target ${T})`);
  }
  console.log(JSON.stringify(cur));
}


// ---- v5.13: proportional fit. costMult = RHO x orderValue, buildCost = K x costMult, managerCost = MCR x buildCost (D434, D435) ----
function fit3() {
  const rho = num('RHO') ?? 0.45;
  const K = num('K') ?? 300;
  const mcr = mcRatio ?? 0.5;
  const cur = { ov: [3, 10, 0, 0, 0, 0], bc: [0, 450, 0, 0, 0, 0], cm: [1, 4.5, 0, 0, 0, 0], mc: [0, 600, 0, 0, 0, 0] };
  const set = (i: number, ov: number) => { cur.ov[i] = ov; cur.cm[i] = ov * rho; cur.bc[i] = ov * rho * K; cur.mc[i] = ov * rho * K * mcr; };
  for (let i = 2; i <= 5; i++) {
    const key = KEYS[i - 2];
    const best = scan((ov) => { set(i, ov); return dayOfScene({ ...base, ...cur }, false, SCENE[key], TARGETS[key] * 2.5); }, TARGETS[key], cur.ov[i - 1] * 1.5, cur.ov[i - 1] * 1e9);
    set(i, best.x);
    console.log(`${NEIGHBORHOODS[i].id.padEnd(10)} ov ${best.x.toPrecision(3)} (x${(best.x / cur.ov[i - 1]).toExponential(1)} the last) buildCost ${cur.bc[i].toPrecision(3)} -> day ${best.d.toFixed(2)} (target ${TARGETS[key]})`);
  }
  console.log(JSON.stringify({ ov: cur.ov.map((v) => +v.toPrecision(3)), bc: cur.bc.map((v) => +v.toPrecision(3)), cm: cur.cm.map((v) => +v.toPrecision(3)), mc: cur.mc.map((v) => +v.toPrecision(3)) }));
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
  const fixed = (process.env.FIX ?? '').split(';').filter(Boolean).map((s) => s.split(',').map(Number)); // [ov,K] per finished stage
  const set = (i: number, ov: number, K: number) => { cur.ov[i] = ov; cur.cm[i] = ov * rho; cur.bc[i] = ov * rho * K; cur.mc[i] = ov * rho * mk; };
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
    console.log(`${NEIGHBORHOODS[i].id}: ${good.length} of ${hits.length} pairs within ~10% of day ${T}; best 6: ${hits.slice(0, 6).map((h) => `ov ${h.ov.toPrecision(3)} K ${h.K} -> ${h.g.toFixed(2)}/${h.e.toFixed(2)}`).join(' | ')}`);
    if (!hits.length) { console.log('no pair fits the limits'); return; }
    const pick = (process.env.PICK ?? 'smallK') === 'smallK' ? [...(good.length ? good : hits)].sort((a, b) => a.K - b.K || a.score - b.score)[0] : hits[0];
    set(i, pick.ov, pick.K);
  }
  console.log(JSON.stringify({ ov: cur.ov.map((v) => +v.toPrecision(3)), bc: cur.bc.map((v) => +v.toPrecision(3)), cm: cur.cm.map((v) => +v.toPrecision(3)), mc: cur.mc.map((v) => +v.toPrecision(3)) }));
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
  const ov = list('OV')!, bc = list('BC')!, cm = list('CM')!;
  const names = ['bc3', 'ov4', 'bc4', 'ov5', 'bc5', 'cm5', 'mcr5'];
  let p: Record<string, number> = { bc3: bc[3], ov4: ov[4], bc4: bc[4], ov5: ov[5], bc5: bc[5], cm5: cm[5], mcr5: num('MCR5') ?? 0.5 };
  const cfgOf = (q: Record<string, number>): Cfg => {
    const o = [...ov], b = [...bc], c = [...cm], m = list('MC')!;
    b[3] = q.bc3; o[4] = q.ov4; b[4] = q.bc4; o[5] = q.ov5; b[5] = q.bc5; c[5] = q.cm5;
    m[3] = snap(b[3] * 0.5); m[4] = snap(b[4] * 0.5); m[5] = snap(b[5] * q.mcr5);
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
  const rand = () => { rnd = (rnd * 1664525 + 1013904223) % 4294967296; return rnd / 4294967296; };
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
    if (s.L <= best.L) { p = q; best = s; console.log(`it ${it} loss ${s.L.toFixed(2)} ${s.out}`); console.log(JSON.stringify(Object.fromEntries(Object.entries(p).map(([k, v]) => [k, +v.toPrecision(3)])))); }
  }
}

// (a test imports `endgame` and the targets above, so the commands only run when this file is the entry point)
if (require.main === module) {
  if (process.argv[2] === 'endgame') endgameCheck();
  else if (process.argv[2] === 'fitstars') fitStars();
  else if (process.argv[2] === 'polish') polish(Number(process.env.SEED ?? 1), Number(process.env.ITERS ?? 60));
  else if (process.argv[2] === 'fit2') fit2();
  else if (process.argv[2] === 'fit3') fit3();
  else if (process.argv[2] === 'fit4') fit4();
  else if (process.argv[2] === 'check') check();
  else if (process.argv[2] === 'search') {
    const start: Vec = process.env.START ? JSON.parse(process.env.START) : { bc: [0, 450, 5e7, 1.75e8, 5.5e8, 5.4e9], cm: [1, 4.5, 12, 34, 90, 250], mcr: 0.5, ovg: 2.7, og: 1, fp: 1 };
    search(Number(process.env.SEED ?? 1), Number(process.env.ITERS ?? 200), start);
  } else fit();
}
