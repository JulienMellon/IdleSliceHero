/// <reference types="node" />
// Review sim: the pacing-sim greedy player, plus (a) purchase cadence, (b) saves at key moments, (c) a check-in player.
import { writeFileSync, mkdirSync } from 'fs';
import { HOME_SCENES } from '../../src/content/scenes/home';
import { DECOR_KINDS, DECOR_TIER_COST, FOOTPRINTS, NEIGHBORHOODS, OVEN_GRADES, PIER9_BID, STATIONS, VEHICLES, TUNING } from '../../src/content/tuning';
import type { NeighborhoodId } from '../../src/content/types';
import { pickScene } from '../../src/engine/cutscene-input';
import * as G from '../../src/engine/game';
import { money } from '../../src/engine/format';

type Option = { label: string; cost: number; gain: number; buy: (s: G.GameState) => G.BuyResult };
export function options(s: G.GameState): Option[] {
  const out: Option[] = [];
  for (const n of NEIGHBORHOODS) {
    const shop = s.shops[n.id];
    if (!shop.built) continue;
    for (const what of ['prep', 'ovens', 'counter', 'drivers', 'tables', 'grade', 'headPrep', 'headOven', 'headCounter', 'manager'] as G.Upgrade[]) {
      const gain = G.upgradeGain(s, n.id, what);
      const cost = G.upgradeCostOf(s, n.id, what);
      if (gain === null || cost === null) continue;
      const g = what === 'manager' ? gain : shop.managed ? gain : gain / 3;
      out.push({ label: `${n.id}:${what}`, cost, gain: g, buy: (st) => G.buyUpgrade(st, n.id, what) });
    }
    for (const kind of DECOR_KINDS) {
      const gain = G.decorGain(s, n.id, kind);
      const cost = G.decorCost(s, n.id, kind);
      if (gain !== null && cost !== null && shop.managed) out.push({ label: `${n.id}:decor-${kind}`, cost, gain, buy: (st) => G.buyDecor(st, n.id, kind) });
    }
    const b = G.bottleneckBundle(s, n.id);
    if (b && shop.managed) out.push({ label: `${n.id}:bundle(${b.steps.join('+')})`, cost: b.cost, gain: b.gain, buy: (st) => { let cur = st; for (const w of b.steps) { const r = G.buyUpgrade(cur, n.id, w); if (!r.ok) return r; cur = r.state; } return { ok: true, state: cur }; } });
    if (!G.upgradeLock(s, n.id, 'expand')) {
      const stage = G.bottleneck(shop, s.vehicle);
      const what: G.Upgrade = stage === 'customers' ? 'tables' : stage;
      if (G.upgradeLock(s, n.id, what)) {
        const after = G.buyUpgrade({ ...s, cash: 1e300 }, n.id, 'expand');
        if (after.ok) out.push({ label: `${n.id}:expand`, cost: G.upgradeCostOf(s, n.id, 'expand')!, gain: G.upgradeGain(after.state, n.id, what) ?? 0, buy: (st) => G.buyUpgrade(st, n.id, 'expand') });
      }
    }
  }
  const next = G.nextToBuild(s);
  if (next) out.push({ label: `build:${next.id}`, cost: next.buildCost, gain: G.buildGain(s, next.id) / 2, buy: (st) => G.buildShop(st, next.id) });
  const vg = G.vehicleGain(s);
  if (vg !== null) out.push({ label: 'fleet', cost: VEHICLES[s.vehicle + 1].cost, gain: vg, buy: G.buyVehicle });
  return out.filter((o) => o.gain > 1e-9);
}

/** The five station upgrades whose prices scale with a shop's cost multiplier. */
const STATION_KEYS = ['prep', 'ovens', 'counter', 'drivers', 'tables'] as const;

/** How many levels (cheapest next level first, across the five stations) `cash` buys in a pizzeria right now. Ignores the level cap. */
export function levelsAffordable(s: G.GameState, id: NeighborhoodId, cash: number) {
  const shop = s.shops[id];
  const next = STATION_KEYS.map((k) => ({ k, lv: shop[k] }));
  let left = cash;
  let n = 0;
  for (; n < 1000; n++) {
    const price = (x: { k: (typeof STATION_KEYS)[number]; lv: number }) => G.upgradeCost(STATIONS[x.k].cost * G.def(id).costMult, x.lv - 1);
    const best = next.reduce((a, b) => (price(b) < price(a) ? b : a));
    if (price(best) > left) break;
    left -= price(best);
    best.lv++;
  }
  return n;
}

const median = (xs: number[]) => { const a = [...xs].sort((x, y) => x - y); return a.length ? a[Math.floor(a.length / 2)] : 0; };

/** mode 'continuous': plays without stopping. mode 'checkin': plays `session` s, then away `away` s (offline catch-up). */
export function run(mode: 'continuous' | 'checkin', session = 300, away = 4 * 3600, dumpDir?: string, stop: { atScene?: string; maxWall?: number } = {}) {
  let s = G.newGame(0);
  let lastSceneEnd: number | null = null;
  let wall = 0; // real seconds since install
  const buys: { t: number; wall: number; label: string; cost: number; session: number; cashBefore: number }[] = [];
  const scenes: { t: number; wall: number; id: string }[] = [];
  const dumped = new Set<string>();
  /** Per build: cash left right after it and how many levels that buys; per shop: manager price vs the median next-level station price when its last head was hired (D435); one round of five station levels at Lv 25 vs citywide income (C107). */
  const builds: { id: NeighborhoodId; wall: number; left: number; levels: number }[] = [];
  const hires: { id: NeighborhoodId; wall: number; manager: number; station: number; ratio: number }[] = [];
  const rounds: { id: NeighborhoodId; wall: number; cost: number; eps: number; minutes: number }[] = [];
  /** When Pier 9 opens: the bid in minutes of citywide income at that moment. */
  let pier9Open: { wall: number; eps: number; minutes: number } | null = null;
  let sessions = 0;
  const dump = (name: string) => { if (!dumpDir || dumped.has(name)) return; dumped.add(name); writeFileSync(`${dumpDir}/${name}.json`, JSON.stringify({ ...s, lastSavedAt: 0 })); };
  outer: for (;;) {
    sessions++;
    lastSceneEnd = null;
    for (let k = 0; k < (mode === 'continuous' ? 1e9 : session); k++) {
      const newest = [...NEIGHBORHOODS].reverse().find((n) => s.shops[n.id].built)!.id as NeighborhoodId;
      for (const id of [newest, 'downtown'] as NeighborhoodId[]) for (let j = 0; j < 3 && !s.shops[id].managed; j++) { const st = G.nextStation(s.shops[id]); if (!st) break; const r = G.tapStation(s, id, st); if (!r.ok) break; s = r.state; }
      s = G.playTick(s, 1); wall += 1;
      for (let sc = pickScene(s, HOME_SCENES, 1e15, 0, false, lastSceneEnd); sc; sc = pickScene(s, HOME_SCENES, 1e15, 0, false, lastSceneEnd)) {
        s = G.markSceneSeen(s, sc); lastSceneEnd = s.playSeconds; scenes.push({ t: s.playSeconds, wall, id: sc.id });
        dump(`at-${sc.id}`);
        if (stop.atScene === sc.id) break outer;
      }
      if (!pier9Open && G.pier9Available(s)) { const eps = G.earningsPerSecond(s); pier9Open = { wall, eps, minutes: PIER9_BID.cost / eps / 60 }; }
      if (G.pier9Available(s) && s.cash >= PIER9_BID.cost) { const before = s.cash; const r = G.bidPier9(s); if (r.ok) { s = r.state; buys.push({ t: s.playSeconds, wall, label: 'pier9', cost: PIER9_BID.cost, session: sessions, cashBefore: before }); } }
      if (s.cityComplete) break outer;
      // EAGER=1: a human who builds the next neighbourhood the moment they can afford it (the default greedy waits until the build also beats every upgrade per dollar)
      if (cfg.eager && !G.pier9Available(s)) { const nb = G.nextToBuild(s); if (nb && !G.buildLock(s, nb.id) && s.cash >= nb.buildCost) { const r = G.buildShop(s, nb.id); if (r.ok) { const before = s.cash; s = r.state; buys.push({ t: s.playSeconds, wall, label: `build:${nb.id}`, cost: nb.buildCost, session: sessions, cashBefore: before }); builds.push({ id: nb.id, wall, left: s.cash, levels: levelsAffordable(s, nb.id, s.cash) }); } } }
      for (let q = 0; q < 30 && !G.pier9Available(s); q++) {
        const opts = options(s).sort((a, b) => b.gain / b.cost - a.gain / a.cost);
        if (!opts.length) break;
        // The best gain per dollar is the goal. A cheaper item that is affordable now is bought first when it pays itself back before the goal would
        // have been affordable anyway ((a + c) / (e + g) < a / e  <=>  c / g < a / e) and within PAYBACK seconds (default no limit); the default, POLICY=top, is the v5.12 rule: save for the best ratio, whatever it takes. POLICY=smart turns the rule above on.
        let pick = opts[0];
        if (cfg.policy === 'casual' && pick.cost > s.cash) {
          // a player who cannot reach the goal before the next check-in spends what they have on the best thing they can afford
          const eps = G.earningsPerSecond(s);
          const wait = eps > 0 ? (pick.cost - s.cash) / eps : Infinity;
          const x = opts.find((o) => o.cost <= s.cash);
          if (x && wait > cfg.saveFor) pick = x;
        }
        if (cfg.policy === 'smart' && pick.cost > s.cash) {
          const eps = G.earningsPerSecond(s);
          const wait = eps > 0 ? (pick.cost - s.cash) / eps : Infinity;
          const x = opts.find((o) => o.cost <= s.cash);
          if (x && x.cost / x.gain < Math.min(wait, cfg.payback)) pick = x;
        }
        const r = pick.buy(s);
        if (!r.ok) break;
        const before = s.cash; s = r.state; buys.push({ t: s.playSeconds, wall, label: pick.label, cost: pick.cost, session: sessions, cashBefore: before });
        const [lbShop, lbWhat = ''] = pick.label.split(':') as [NeighborhoodId, string | undefined];
        if (lbShop === ('build' as string)) { const id = lbWhat as NeighborhoodId; builds.push({ id, wall, left: s.cash, levels: levelsAffordable(s, id, s.cash) }); }
        else if (lbShop !== 'downtown' && lbWhat.startsWith('head') && G.allHeadsHired(s.shops[lbShop]) && !hires.some((h) => h.id === lbShop)) {
          const station = median(STATION_KEYS.map((k) => G.upgradeCostOf(s, lbShop, k) ?? 0).filter((x) => x > 0));
          hires.push({ id: lbShop, wall, manager: G.def(lbShop).managerCost, station, ratio: G.def(lbShop).managerCost / station });
        }
      }
      for (const n of NEIGHBORHOODS) {
        const sh = s.shops[n.id];
        if (!sh.built || rounds.some((x) => x.id === n.id) || Math.min(sh.prep, sh.ovens, sh.counter) < 25) continue;
        const cost = STATION_KEYS.reduce((t, k) => t + G.upgradeCost(STATIONS[k].cost * n.costMult, 24), 0);
        const eps = G.earningsPerSecond(s);
        rounds.push({ id: n.id, wall, cost, eps, minutes: cost / eps / 60 });
      }
      if (s.playSeconds > 60 * 60 * 200) break outer;
    }
    // away
    s = G.offlineTick(s, Math.min(away, cfg.cap) * cfg.eff).state;
    wall += away;
    if (sessions > 400 || wall > (stop.maxWall ?? Infinity)) break;
  }
  return { s, buys, scenes, sessions, wall, builds, hires, rounds, pier9Open };
}

/** Purchases per check-in session (the last session, cut short by the finale, is left out). `from` = first wall-clock second counted. */
export function sessionStats(r: ReturnType<typeof run>, sessionSeconds: number, awaySeconds: number, from = 0) {
  const counts: number[] = [];
  for (let i = 1; i < r.sessions; i++) {
    if ((i - 1) * (sessionSeconds + awaySeconds) < from) continue;
    counts.push(r.buys.filter((b) => b.session === i).length);
  }
  const sorted = [...counts].sort((a, b) => a - b);
  return { min: sorted.length ? sorted[0] : 0, median: sorted.length ? sorted[Math.floor(sorted.length / 2)] : 0, max: sorted.length ? sorted[sorted.length - 1] : 0, counts };
}

/** Purchases per session after day 0 and what the late-game items ended as. */
export function endSummary(r: ReturnType<typeof run>, sessionSeconds: number, awaySeconds: number) {
  const st = sessionStats(r, sessionSeconds, awaySeconds, 86400);
  const shops = Object.values(r.s.shops);
  const per = st.counts.length ? `min ${st.min}, median ${st.median}, max ${st.max}` : 'n/a';
  return `buys/session after day 0: ${per}; fleet ${VEHICLES[r.s.vehicle].id}, golden ovens in ${shops.filter((x) => x.grade >= OVEN_GRADES.length - 1).length}/6, flagships ${shops.filter((x) => x.footprint >= FOOTPRINTS.length - 1).length}/6`;
}

/** Per-shop economy rows of a run: costMult/orderValue, build and manager price against the Lv 1 prep price, levels the cash left after the build buys, manager vs station price when the heads were hired, minutes of income one Lv 25 round costs. */
export function economyReport(r: ReturnType<typeof run>) {
  const f = (x: number | undefined, d = 1) => (x === undefined ? 'n/a' : x >= 100 ? x.toFixed(0) : x.toFixed(d));
  return NEIGHBORHOODS.map((n) => {
    const b = r.builds.find((x) => x.id === n.id), h = r.hires.find((x) => x.id === n.id), c = r.rounds.find((x) => x.id === n.id);
    const prep1 = STATIONS.prep.cost * n.costMult;
    return `${n.id.padEnd(10)} cm/ov ${f(n.costMult / n.orderValue, 2)}  build/prep1 ${f(n.buildCost / prep1)}  mgr/prep1 ${f(n.managerCost / prep1)}  after-build levels ${b ? b.levels : 'n/a'}  mgr/station@heads ${f(h?.ratio)}  Lv25 round ${c ? f(c.minutes) + ' min' : 'n/a'}`;
  }).join('\n') + `\npier9 bid ${money(PIER9_BID.cost)} = ${r.pier9Open ? f(r.pier9Open.minutes) + ' min of income when it opens (day ' + (r.pier9Open.wall / 86400).toFixed(2) + ')' : 'never opened'}`;
}

/** Everything the fitter can vary. Lists are per neighbourhood (6) unless noted. Unset fields keep src/content/tuning.ts. */
export interface Cfg {
  ov?: number[]; bc?: number[]; cm?: number[]; mc?: number[];
  /** Pier 9 bid cost and the Waterfront pizzas that unlock it. */
  pier9?: number; pier9Pizzas?: number;
  /** Oven grade costs for grades 1–4, footprint costs for tiers 1–4, decor tier costs 1–3, vehicle costs for 1–4 (scooter…drone). */
  og?: number[]; fp?: number[]; dc?: number[]; vc?: number[];
  cap?: number; eff?: number; eager?: boolean;
}
export const cfg = { cap: TUNING.offlineCapSeconds, eff: 1, eager: false, policy: (process.env.POLICY === 'smart' || process.env.POLICY === 'casual' ? process.env.POLICY : 'top') as 'top' | 'smart' | 'casual', saveFor: Number(process.env.SAVEFOR ?? 4 * 3600), payback: Number(process.env.PAYBACK ?? Infinity) };
export function applyCfg(c: Cfg) {
  const each = (xs: number[] | undefined, set: (i: number, v: number) => void) => xs?.forEach((v, i) => { if (Number.isFinite(v)) set(i, v); });
  each(c.ov, (i, v) => { (NEIGHBORHOODS[i] as any).orderValue = v; });
  each(c.bc, (i, v) => { (NEIGHBORHOODS[i] as any).buildCost = v; });
  each(c.cm, (i, v) => { (NEIGHBORHOODS[i] as any).costMult = v; });
  each(c.mc, (i, v) => { (NEIGHBORHOODS[i] as any).managerCost = v; });
  each(c.og, (i, v) => { OVEN_GRADES[i + 1].cost = v; });
  each(c.fp, (i, v) => { FOOTPRINTS[i + 1].cost = v; });
  each(c.dc, (i, v) => { DECOR_TIER_COST[i] = v; });
  each(c.vc, (i, v) => { VEHICLES[i + 1].cost = v; });
  if (c.pier9 !== undefined) (PIER9_BID as any).cost = c.pier9;
  if (c.pier9Pizzas !== undefined) (PIER9_BID as any).unlockPizzas = c.pier9Pizzas;
  if (c.cap !== undefined) cfg.cap = c.cap;
  if (c.eff !== undefined) cfg.eff = c.eff;
  if (c.eager !== undefined) cfg.eager = c.eager;
}
const list = (name: string) => process.env[name]?.split(',').map(Number);

// Env overrides (all optional): OV BC CM MC = six values; OG FP VC = four; DC = three; PB = Pier 9 bid; PP = Pier 9 unlock pizzas; CAP, EFF = offline cap (s) and rate; EAGER=1 builds the next pizzeria as soon as it is affordable.
const main = () => {
applyCfg({ ov: list('OV'), bc: list('BC'), cm: list('CM'), mc: list('MC'), og: list('OG'), fp: list('FP'), dc: list('DC'), vc: list('VC'),
  pier9: process.env.PB ? Number(process.env.PB) : undefined, pier9Pizzas: process.env.PP ? Number(process.env.PP) : undefined,
  cap: process.env.CAP ? Number(process.env.CAP) : undefined, eff: process.env.EFF ? Number(process.env.EFF) : undefined, eager: process.env.EAGER ? true : undefined });
const mode = process.argv[2] ?? 'continuous';
if (mode === 'continuous') {
  mkdirSync('saves', { recursive: true });
  const r = run('continuous', 0, 0, 'saves');
  // purchase cadence per neighbourhood phase
  const phases = r.scenes.filter((x) => x.id.endsWith('-1')).map((x) => ({ id: x.id.replace('-1', ''), t: x.t }));
  phases.push({ id: 'end', t: r.s.playSeconds });
  for (let i = 0; i < phases.length - 1; i++) {
    const a = phases[i].t, b = phases[i + 1].t;
    const bs = r.buys.filter((x) => x.t >= a && x.t < b);
    const gaps = bs.map((x, j) => (j ? x.t - bs[j - 1].t : x.t - a));
    gaps.push(b - (bs.length ? bs[bs.length - 1].t : a));
    const sorted = [...gaps].sort((x, y) => x - y);
    const long = gaps.filter((g) => g >= 60);
    console.log(`${phases[i].id.padEnd(11)} ${((b - a) / 60).toFixed(1).padStart(6)} min · ${String(bs.length).padStart(4)} buys · median gap ${sorted[Math.floor(sorted.length / 2)].toFixed(0)} s · max gap ${(Math.max(...gaps)).toFixed(0)} s · ${long.length} waits ≥ 60 s totalling ${(long.reduce((t, g) => t + g, 0) / 60).toFixed(1)} min`);
  }
  // what kinds were bought
  const kinds: Record<string, number> = {};
  for (const b of r.buys) { const k = b.label.split(':')[1]?.replace(/\(.*/, '') ?? b.label; kinds[k] = (kinds[k] ?? 0) + 1; }
  console.log(kinds);
  console.log('total play', (r.s.playSeconds / 60).toFixed(0), 'min');
  // dump mid-shops
  writeFileSync('saves/end.json', JSON.stringify({ ...r.s, lastSavedAt: 0 }));
} else {
  for (const [sess, away] of [[300, 4 * 3600], [300, 8 * 3600], [600, 3 * 3600], [120, 2 * 3600]] as const) {
    const r = run('checkin', sess, away);
    const days = r.wall / 86400;
    const m: Record<string, number> = {};
    for (const x of r.scenes) if (x.id.endsWith('-1') || x.id === 'uptown-4') m[x.id] = +(x.wall / 86400).toFixed(2);
    console.log(`sessions of ${sess / 60} min every ${(sess + away) / 3600} h: done=${r.s.cityComplete} after ${r.sessions} sessions, ${days.toFixed(1)} days; scenes ${r.s.seenScenes.length}/24; unlock days ${JSON.stringify(m)}; ${endSummary(r, sess, away)}`);
    if (sess === 300 && away === 4 * 3600) console.log(economyReport(r));
  }
}
};
if (require.main === module) main();
