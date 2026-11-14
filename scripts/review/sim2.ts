/// <reference types="node" />
// Review sim: the pacing-sim greedy player, plus (a) purchase cadence, (b) saves at key moments, (c) a check-in player.
// v5.16: the player also plays the rewards (golden pizzas, special orders, tasks and chests, the weekly chest, the daily gift, the night oven)
// through the engine's own functions on a wall clock; REWARDS=0 turns them off. Every claim is recorded ({ wall, kind, cash }). The decision
// metric (was the best-payback item also the cheapest?) and the heads and manager timeline of every shop come out of `run()` too.
// Env: REWARDS=0 · POLICY=top|smart|casual · NOTAP=1 · NOCACHE=1 (the 'top' player re-decides every second instead of only when something but cash changed).
import { writeFileSync, mkdirSync } from 'fs';
import { HOME_SCENES } from '../../src/content/scenes/home';
import { DECOR_KINDS, DECOR_TIER_COST, FOOTPRINTS, NEIGHBORHOODS, OVEN_GRADES, PIER9_BID, VEHICLES, TUNING } from '../../src/content/tuning';
import { DAILY_CHESTS } from '../../src/content/rewards';
import { ORDER } from '../../src/content/hooks';
import type { NeighborhoodId } from '../../src/content/types';
import { pickScene } from '../../src/engine/cutscene-input';
import * as G from '../../src/engine/game';
import '../../src/engine/features'; // the registry must be live (mastery, heads, recipes, ...): without this import no feature hook runs
import * as B from '../../src/engine/bonus';
import * as O from '../../src/engine/orders';
import * as N from '../../src/engine/night-oven';
import * as R from '../../src/engine/rewards';
import { money } from '../../src/engine/format';

// Every run is played in one time zone, so day and week keys (and so the daily sets) come out the same wherever it runs.
if (!process.env.TZ) process.env.TZ = 'America/New_York';
/** The install moment of every simulated player: a Monday morning, local time. The wall clock of a run is this plus the seconds since install. */
export const INSTALL = new Date(2026, 10, 9, 9, 0, 0).getTime();

type Option = { label: string; cost: number; gain: number; buy: (s: G.GameState) => G.BuyResult };
export function options(s: G.GameState): Option[] {
  const out: Option[] = [];
  for (const n of NEIGHBORHOODS) {
    const shop = s.shops[n.id];
    if (!shop.built) continue;
    for (const what of ['prep', 'ovens', 'counter', 'drivers', 'tables', 'grade', 'headPrep', 'headOven', 'headCounter', 'manager'] as G.Upgrade[]) {
      const gain = G.upgradeGain(s, n.id, what);
      const cost = G.upgradeCostOf(s, n.id, what);
      // an upgrade that is locked (Downtown's manager before Nonna, a manager before the heads) cannot be bought: a player buys something else
      if (gain === null || cost === null || G.upgradeLock(s, n.id, what)) continue;
      // a shop that runs itself (a manager, or all three heads) earns without taps; one that doesn't only earns while tapped, so an upgrade there is worth a third
      const g = what === 'manager' ? gain : G.runsItself(shop) ? gain : gain / 3;
      out.push({ label: `${n.id}:${what}`, cost, gain: g, buy: (st) => G.buyUpgrade(st, n.id, what) });
    }
    for (const kind of DECOR_KINDS) {
      const gain = G.decorGain(s, n.id, kind);
      const cost = G.decorCost(s, n.id, kind);
      if (gain !== null && cost !== null && shop.managed) out.push({ label: `${n.id}:decor-${kind}`, cost, gain, buy: (st) => G.buyDecor(st, n.id, kind) });
    }
    const b = G.bottleneckBundle(s, n.id);
    if (b) out.push({ label: `${n.id}:bundle(${b.steps.join('+')})`, cost: b.cost, gain: G.runsItself(shop) ? b.gain : b.gain / 3, buy: (st) => { let cur = st; for (const w of b.steps) { const r = G.buyUpgrade(cur, n.id, w); if (!r.ok) return r; cur = r.state; } return { ok: true, state: cur }; } });
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
  // a build that is locked (Nonna has not taken over, the last finale has not played) cannot be bought: a player does not save for it, they buy something else
  if (next && !G.buildLock(s, next.id)) out.push({ label: `build:${next.id}`, cost: next.buildCost, gain: G.buildGain(s, next.id) / 2, buy: (st) => G.buildShop(st, next.id) });
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
    const price = (x: { k: (typeof STATION_KEYS)[number]; lv: number }) => G.stationCost(id, x.k, x.lv - 1);
    const best = next.reduce((a, b) => (price(b) < price(a) ? b : a));
    if (price(best) > left) break;
    left -= price(best);
    best.lv++;
  }
  return n;
}

const median = (xs: number[]) => { const a = [...xs].sort((x, y) => x - y); return a.length ? a[Math.floor(a.length / 2)] : 0; };

export type RewardKind = 'golden' | 'order' | 'daily' | 'chest' | 'weekly' | 'weeklyChest' | 'gift';
/** One reward paid: when (wall seconds since install), what and how much cash (0 for a diamond or booster only). */
export interface Claim { wall: number; kind: RewardKind; cash: number }
/** One purchase decision after Nonna's takeover: whether the best-payback item was also the cheapest on offer, and the third-best payback over the best. */
export interface Decision { wall: number; session: number; cheapest: boolean; ratio3: number | null }
/** When a pizzeria was built, got its first head, all three heads and its manager (wall seconds since install). */
export interface Timeline { build?: number; head1?: number; heads3?: number; manager?: number; /** The manager's price in hours of the city's income just before it was hired. */ managerHours?: number }

/**
 * mode 'continuous': plays without stopping. mode 'checkin': plays `session` s, then away `away` s (offline catch-up).
 * With `cfg.rewards` (the default; REWARDS=0 turns it off) the player also does what the store does: taps four of every five golden
 * pizzas, accepts every special order (and rushes it), claims every finished task and chest, the weekly ones and the daily gift,
 * and buys the night oven when it can. Every one is the engine's own function on the run's wall clock (INSTALL + seconds).
 */
export function run(mode: 'continuous' | 'checkin', session = 300, away = 4 * 3600, dumpDir?: string, stop: { atScene?: string; maxWall?: number; /** Called after every simulated second of play with the state and the wall clock (the fitters sample curves with it). */ onSecond?: (s: G.GameState, wall: number) => void; /** Keep playing after the city is complete (to see what is bought after the story, up to `maxWall`). */ keepGoing?: boolean } = {}) {
  let s = G.newGame(INSTALL);
  let lastSceneEnd: number | null = null;
  let wall = 0; // real seconds since install
  const buys: { t: number; wall: number; label: string; cost: number; session: number; cashBefore: number }[] = [];
  const scenes: { t: number; wall: number; id: string }[] = [];
  const dumped = new Set<string>();
  /** Per build: cash left right after it and how many levels that buys; per shop: manager price vs the median next-level station price when its last head was hired (D435); one round of five station levels at Lv 25 vs citywide income (C107). */
  const builds: { id: NeighborhoodId; wall: number; left: number; levels: number }[] = [];
  const hires: { id: NeighborhoodId; wall: number; manager: number; station: number; ratio: number }[] = [];
  const rounds: { id: NeighborhoodId; wall: number; cost: number; eps: number; minutes: number }[] = [];
  const claims: Claim[] = [];
  const decisions: Decision[] = [];
  const timeline: Partial<Record<NeighborhoodId, Timeline>> = {};
  /** Every head hired, in order: which shop, which station, when. */
  const headBuys: { id: NeighborhoodId; kind: string; wall: number }[] = [];
  const orders = { offered: 0, done: 0 };
  /** When Pier 9 opens: the bid in minutes of citywide income at that moment. */
  let pier9Open: { wall: number; eps: number; minutes: number } | null = null;
  let sessions = 0;
  /** When the story ended (the finale's scene played) and the cash earned by then: rewards are judged over the story only. */
  let storyEnd: { wall: number; earned: number } | null = null;
  /** The cash the unaffordable pick of the last decision needs, and the scenes seen then (see the buy loop). */
  let waitCash = 0;
  let waitScenes = -1;
  const dump = (name: string) => { if (!dumpDir || dumped.has(name)) return; dumped.add(name); writeFileSync(`${dumpDir}/${name}.json`, JSON.stringify({ ...s, lastSavedAt: 0 })); };
  const mark = (id: NeighborhoodId, patch: Timeline) => { timeline[id] = { ...timeline[id], ...patch }; };
  /** Take a claim's result: the cash it paid is what the state gained. */
  const take = (kind: RewardKind, r: G.BuyResult) => { if (!r.ok) return; claims.push({ wall, kind, cash: r.state.cash - s.cash }); s = r.state; };
  /** What the player does with the rewards in one second of play. */
  const rewardSecond = () => {
    if (!R.rewardsUnlocked(s)) return;
    const at = INSTALL + wall * 1000;
    s = R.refreshRewards(s, at);
    // golden pizza: it appears, the player taps four of every five
    s = B.bonusTick(s, 1, false);
    if (B.bonusVisible(s) && s.bonus.spawned % 5 !== 0) {
      const c = B.collectBonus(s);
      if (c) { claims.push({ wall, kind: 'golden', cash: c.paid }); s = c.state; }
    }
    // special order: accept every offer and rush it (only a managed shop has a rush); the engine decides the win
    const done = s.stats.ordersDone;
    const made = s.order.made;
    s = O.orderTick(s, 1, false);
    if (s.order.made > made) orders.offered++;
    if (s.stats.ordersDone > done) { orders.done++; claims.push({ wall, kind: 'order', cash: s.order.result?.reward ?? 0 }); }
    if (s.order.offer) s = O.acceptOrder(s);
    const a = s.order.active;
    if (a && s.shops[a.hood].managed) for (let i = 0; i < ORDER.rushTapsPerSecond; i++) s = G.tapShop(s, a.hood);
    // tasks and chests, when something is ready
    if (R.claimableCount(s, at) > 0) {
      s.rewards.daily.forEach((tk, i) => { if (!tk.claimed && R.taskDone(s, tk)) take('daily', R.claimDaily(s, i, at)); });
      DAILY_CHESTS.forEach((_, i) => { if (R.chestReady(s, i)) take('chest', R.claimChest(s, i, at)); });
      s.rewards.weekly.forEach((tk, i) => { if (!tk.claimed && R.taskDone(s, tk)) take('weekly', R.claimWeekly(s, i, at)); });
      if (R.weeklyChestReady(s)) take('weeklyChest', R.claimWeeklyChest(s, at));
    }
    // the daily gift, once a day (a missed day starts over: the sim never pays diamonds to repair it)
    const gk = R.giftStatus(s, at).kind;
    if (gk === 'ready' || gk === 'save') take('gift', R.claimGift(s, at));
    // the night oven, the moment it is unlocked and affordable (a price, not a reward)
    const nt = N.nextTier(s);
    if (nt !== null && !N.nightOvenLock(s, nt) && s.cash >= N.nightOvenPrice(s, nt)) {
      const before = s.cash;
      const r = N.buyNightOven(s);
      if (r.ok) { s = r.state; waitCash = 0; buys.push({ t: s.playSeconds, wall, label: 'night-oven', cost: before - s.cash, session: sessions, cashBefore: before }); }
    }
  };
  outer: for (;;) {
    sessions++;
    lastSceneEnd = null;
    for (let k = 0; k < (mode === 'continuous' ? 1e9 : session); k++) {
      const newest = [...NEIGHBORHOODS].reverse().find((n) => s.shops[n.id].built)!.id as NeighborhoodId;
      for (const id of (cfg.notap ? ['downtown'] : [newest, 'downtown']) as NeighborhoodId[]) for (let j = 0; j < 3 && !s.shops[id].managed; j++) { const st = G.nextStation(s.shops[id]); if (!st) break; const r = G.tapStation(s, id, st); if (!r.ok) break; s = r.state; }
      s = G.playTick(s, 1); wall += 1;
      for (let sc = pickScene(s, HOME_SCENES, 1e15, 0, false, lastSceneEnd); sc; sc = pickScene(s, HOME_SCENES, 1e15, 0, false, lastSceneEnd)) {
        s = G.markSceneSeen(s, sc); lastSceneEnd = s.playSeconds; scenes.push({ t: s.playSeconds, wall, id: sc.id });
        dump(`at-${sc.id}`);
        if (stop.atScene === sc.id) break outer;
      }
      if (cfg.rewards) rewardSecond();
      stop.onSecond?.(s, wall);
      if (!pier9Open && G.pier9Available(s)) { const eps = G.earningsPerSecond(s); pier9Open = { wall, eps, minutes: PIER9_BID.cost / eps / 60 }; }
      if (G.pier9Available(s) && s.cash >= PIER9_BID.cost) { const before = s.cash; const r = G.bidPier9(s); if (r.ok) { s = r.state; buys.push({ t: s.playSeconds, wall, label: 'pier9', cost: PIER9_BID.cost, session: sessions, cashBefore: before }); } }
      if (s.cityComplete) { storyEnd ??= { wall, earned: s.totalEarned }; if (!stop.keepGoing) break outer; }
      // EAGER=1: a human who builds the next neighbourhood the moment they can afford it (the default greedy waits until the build also beats every upgrade per dollar)
      if (cfg.eager && !G.pier9Available(s)) { const nb = G.nextToBuild(s); if (nb && !G.buildLock(s, nb.id) && s.cash >= nb.buildCost) { const r = G.buildShop(s, nb.id); if (r.ok) { const before = s.cash; s = r.state; waitCash = 0; mark(nb.id, { build: wall }); buys.push({ t: s.playSeconds, wall, label: `build:${nb.id}`, cost: nb.buildCost, session: sessions, cashBefore: before }); builds.push({ id: nb.id, wall, left: s.cash, levels: levelsAffordable(s, nb.id, s.cash) }); } } }
      for (let q = 0; q < 30 && !G.pier9Available(s); q++) {
        // POLICY=top picks the same item until something other than cash changes (a purchase, a scene): while the cash is short of it, skip the work
        if (cfg.policy === 'top' && !process.env.NOCACHE && s.cash < waitCash && scenes.length === waitScenes) break;
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
        if (!r.ok) { if (pick.cost > s.cash) { waitCash = pick.cost; waitScenes = scenes.length; } break; }
        waitCash = 0;
        const epsPre = G.earningsPerSecond(s);
        if (s.seenScenes.includes('downtown-4')) {
          // the decision metric (card E0 step 5): was the best item also the cheapest on offer, and how far behind is the third best
          const best = opts[0];
          decisions.push({ wall, session: sessions, cheapest: best.cost <= Math.min(...opts.map((o) => o.cost)), ratio3: opts.length >= 3 ? opts[2].cost / opts[2].gain / (best.cost / best.gain) : null });
        }
        const before = s.cash; s = r.state; buys.push({ t: s.playSeconds, wall, label: pick.label, cost: pick.cost, session: sessions, cashBefore: before });
        const [lbShop, lbWhat = ''] = pick.label.split(':') as [NeighborhoodId, string | undefined];
        if (lbShop === ('build' as string)) { const id = lbWhat as NeighborhoodId; mark(id, { build: wall }); builds.push({ id, wall, left: s.cash, levels: levelsAffordable(s, id, s.cash) }); }
        else if (lbWhat.startsWith('head')) {
          headBuys.push({ id: lbShop, kind: lbWhat, wall });
          if (!timeline[lbShop]?.head1) mark(lbShop, { head1: wall });
          if (G.allHeadsHired(s.shops[lbShop])) mark(lbShop, { heads3: wall });
          if (lbShop !== 'downtown' && G.allHeadsHired(s.shops[lbShop]) && !hires.some((h) => h.id === lbShop)) {
            const station = median(STATION_KEYS.map((k) => G.upgradeCostOf(s, lbShop, k) ?? 0).filter((x) => x > 0));
            hires.push({ id: lbShop, wall, manager: G.def(lbShop).managerCost, station, ratio: G.def(lbShop).managerCost / station });
          }
        } else if (lbWhat === 'manager') mark(lbShop, { manager: wall, managerHours: pick.cost / Math.max(1e-9, epsPre) / 3600 });
      }
      for (const n of NEIGHBORHOODS) {
        const sh = s.shops[n.id];
        if (!sh.built || rounds.some((x) => x.id === n.id) || Math.min(sh.prep, sh.ovens, sh.counter) < 25) continue;
        const cost = STATION_KEYS.reduce((t, k) => t + G.stationCost(n.id, k, 24), 0);
        const eps = G.earningsPerSecond(s);
        rounds.push({ id: n.id, wall, cost, eps, minutes: cost / eps / 60 });
      }
      if (s.playSeconds > 60 * 60 * 200 || (mode === 'continuous' && wall > (stop.maxWall ?? Infinity))) break outer;
    }
    // away
    const before = s;
    const cap = Math.max(cfg.cap, G.offlineCapOf(s));
    s = G.offlineTick(s, Math.min(away, cap) * cfg.eff).state;
    if (cfg.rewards) s = B.bonusAway(O.returnFromAway(before, s, away), away);
    wall += away;
    if (sessions > 400 || wall > (stop.maxWall ?? Infinity)) break;
  }
  const rewardCash = claims.filter((c) => !storyEnd || c.wall <= storyEnd.wall).reduce((t, c) => t + c.cash, 0);
  return { storyEnd, s, buys, scenes, sessions, wall, builds, hires, rounds, pier9Open, claims, rewardCash, earnedCash: storyEnd?.earned ?? s.totalEarned, decisions, timeline, headBuys, orders };
}

const median2 = (xs: number[]) => (xs.length ? median(xs) : NaN);

/** The decision metric of card E0 step 5 over the decisions in [from, to) wall seconds: the share where the best item was also the cheapest on offer, and the median payback of the third best over the best. */
export function decisionMetric(r: ReturnType<typeof run>, from = 0, to = Infinity) {
  const ds = r.decisions.filter((d) => d.wall >= from && d.wall < to);
  const ratios = ds.map((d) => d.ratio3).filter((x): x is number => x !== null);
  return { n: ds.length, cheapestShare: ds.length ? ds.filter((d) => d.cheapest).length / ds.length : NaN, medianRatio3: median2(ratios) };
}

/**
 * Card E0 step 7's three reward rules over a run: rewards' share of all cash earned; and, while the newest shop (Waterfront on: `from`) has
 * no manager, the largest single claim and the largest day's claims (a local calendar day since install) as shares of that manager's price.
 */
export function rewardRules(r: ReturnType<typeof run>, from: NeighborhoodId = 'waterfront') {
  const newestAt = (wall: number): NeighborhoodId => {
    let id: NeighborhoodId = 'downtown';
    for (const n of NEIGHBORHOODS) { const b = r.timeline[n.id]?.build; if (n.id !== 'downtown' && b !== undefined && b <= wall) id = n.id; }
    return id;
  };
  const unmanaged = (id: NeighborhoodId, wall: number) => id !== 'downtown' && (r.timeline[id]?.manager === undefined || r.timeline[id]!.manager! > wall);
  let maxClaim = 0;
  const perDay = new Map<string, number>();
  for (const c of r.claims) {
    if (r.storyEnd && c.wall > r.storyEnd.wall) continue;
    const id = newestAt(c.wall);
    if (NEIGHBORHOODS.findIndex((n) => n.id === id) < NEIGHBORHOODS.findIndex((n) => n.id === from) || !unmanaged(id, c.wall)) continue;
    const price = G.def(id).managerCost;
    maxClaim = Math.max(maxClaim, c.cash / price);
    const key = `${id}|${Math.floor((INSTALL + c.wall * 1000 - new Date(INSTALL).setHours(0, 0, 0, 0)) / 86_400_000)}`;
    perDay.set(key, (perDay.get(key) ?? 0) + c.cash / price);
  }
  return { share: r.earnedCash > 0 ? r.rewardCash / r.earnedCash : 0, maxClaimOfManager: maxClaim, maxDayOfManager: Math.max(0, ...perDay.values()) };
}

/** The decision metric, the rewards and the manager timing of a run, as printable lines. */
export function reportLines(r: ReturnType<typeof run>) {
  const f = (x: number, d = 2) => (Number.isFinite(x) ? x.toFixed(d) : 'n/a');
  const takeover = r.scenes.find((x) => x.id === 'downtown-4')?.wall ?? 0;
  const sub = r.scenes.find((x) => x.id === 'suburbs-4')?.wall ?? Infinity;
  const m1 = decisionMetric(r, takeover, sub), m2 = decisionMetric(r, takeover);
  const rr = rewardRules(r);
  const lines = [
    `decisions (cheapest = best): session 1 ${m1.n} buys, ${f(m1.cheapestShare * 100, 0)}% cheapest, third/best ${f(m1.medianRatio3, 1)} | whole run ${m2.n} buys, ${f(m2.cheapestShare * 100, 0)}% cheapest, third/best ${f(m2.medianRatio3, 1)}`,
    `rewards ${cfg.rewards ? 'on' : 'off'}: ${f(rr.share * 100, 1)}% of cash earned; largest claim ${f(rr.maxClaimOfManager * 100, 1)}% and largest day ${f(rr.maxDayOfManager * 100, 1)}% of the newest unmanaged shop's manager; orders ${r.orders.done}/${r.orders.offered}; ${Object.entries(claimTable(r)).map(([k, v]) => `${k} ${v.n} (${money(v.cash)})`).join(', ')}`,
  ];
  for (const n of NEIGHBORHOODS) { const t = r.timeline[n.id]; if (t) lines.push(`${n.id.padEnd(10)} build d${f((t.build ?? 0) / 86400)} head1 d${f((t.head1 ?? NaN) / 86400)} heads3 d${f((t.heads3 ?? NaN) / 86400)} manager d${f((t.manager ?? NaN) / 86400)}${t.managerHours !== undefined ? ` (price ${f(t.managerHours, 1)} h of income)` : ''}`); }
  return lines;
}

/** Rewards by kind: count and cash. */
export function claimTable(r: ReturnType<typeof run>) {
  const out: Record<string, { n: number; cash: number }> = {};
  for (const c of r.claims) { const o = (out[c.kind] ??= { n: 0, cash: 0 }); o.n++; o.cash += c.cash; }
  return out;
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
    const prep1 = G.stationCost(n.id, 'prep', 0);
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
  /** Play with the rewards (the default) or without (REWARDS=0). */
  rewards?: boolean;
}
export const cfg = { cap: TUNING.offlineCapSeconds, eff: 1, eager: false, rewards: process.env.REWARDS !== '0', notap: !!process.env.NOTAP, policy: (process.env.POLICY === 'smart' || process.env.POLICY === 'casual' ? process.env.POLICY : 'top') as 'top' | 'smart' | 'casual', saveFor: Number(process.env.SAVEFOR ?? 4 * 3600), payback: Number(process.env.PAYBACK ?? Infinity) };
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
  if (c.rewards !== undefined) cfg.rewards = c.rewards;
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
  console.log(reportLines(r).join('\n'));
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
