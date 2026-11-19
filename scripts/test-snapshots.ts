/// <reference types="node" />
// The test build's neighbourhood jumps (v5.19-test, card X3): plays the greedy pacing sim and saves the state the second each shop is built,
// and once when the city's last finale has been seen, for every city in src/content/cities/index.ts. The Test panel's "Jump to" list loads them.
//
//   npx tsx scripts/test-snapshots.ts        writes src/dev/snapshots.json and prints one line per row
//   npm run test-snapshots                   the same
//
// Re-run it after a tuning change or a SAVE_VERSION bump: src/dev/__tests__/snapshots.test.ts fails until you do.
//
// The home city is played by sim2's own `run('continuous')` (its `onSecond` hook sees every second). `franchiseRun` of pacing-fit.ts plays Boston on a
// stand-in (the home ids with Boston's numbers), which is a different game state from a real Boston save; the jumps need the real one, so the home
// clear is franchised with the engine's own `franchise` and Boston is played here by the same greedy rules over `cityOf(s)`'s tables (rewards off).
import { writeFileSync } from 'fs';
import { join } from 'path';
import { ORDER } from '../src/content/hooks';
import { CITIES, cityOf, layerHood } from '../src/content/cities';
import { pickScene, scenePacesGap } from '../src/engine/cutscene-input';
import * as G from '../src/engine/game';
import '../src/engine/features'; // the registry must be live: without this import no feature hook runs
import { canFranchise, franchise } from '../src/engine/features/franchise';
import { bestMix, mixOf, setMenu } from '../src/engine/features/layers/menu';
import { rivalView, startRivalChallenge } from '../src/engine/features/layers/rival';
import { fixJam, jamView } from '../src/engine/features/layers/shifts';
import * as R from '../src/engine/rewards';
import { DECOR_KINDS } from '../src/content/tuning';
import type { NeighborhoodId } from '../src/content/types';
import type { SnapshotFile, SnapshotRow } from '../src/dev/jumps';
import { INSTALL, run } from './review/sim2';

const OUT = join(__dirname, '..', 'src', 'dev', 'snapshots.json');
const clockAt = (wall: number) => INSTALL + wall * 1000;

/** Collects the rows of one city: a state the second a shop first shows as built, and once at the city's end. */
function collector(rows: SnapshotRow[]) {
  const done = new Set<string>();
  const take = (s: G.GameState, wall: number, hood: NeighborhoodId, label: string) => {
    const key = `${s.city}:${label}`;
    if (done.has(key)) return;
    done.add(key);
    // the rewards are brought up to the snapshot's clock (the franchised city is played with the rewards off, so its day keys would be days old),
    // then a plain-JSON copy with that clock in lastSavedAt: the loader rebases every timestamp from it
    const at = clockAt(wall);
    const fresh = R.rewardsUnlocked(s) ? R.refreshRewards(s, at) : s;
    rows.push({ city: s.city, hood, label, state: JSON.parse(JSON.stringify({ ...fresh, lastSavedAt: at })) });
  };
  return (s: G.GameState, wall: number) => {
    const city = cityOf(s);
    for (const n of city.neighbourhoods) if (s.shops[n.id].built) take(s, wall, n.id, `${n.name} — just built`);
    if (s.cityComplete) take(s, wall, city.neighbourhoods[city.neighbourhoods.length - 1].id, `${city.name} — complete`);
  };
}

// ---- Boston: the sim2 player, generic over the city (sim2's own `options()` reads the home city's tables) ----

type Option = { label: string; cost: number; gain: number; buy: (s: G.GameState) => G.BuyResult };
const UPGRADES: G.Upgrade[] = ['prep', 'ovens', 'counter', 'drivers', 'tables', 'grade', 'headPrep', 'headOven', 'headCounter', 'manager'];

function options(s: G.GameState): Option[] {
  const city = cityOf(s);
  const out: Option[] = [];
  for (const n of city.neighbourhoods) {
    const shop = s.shops[n.id];
    if (!shop.built) continue;
    for (const what of UPGRADES) {
      const gain = G.upgradeGain(s, n.id, what);
      const cost = G.upgradeCostOf(s, n.id, what);
      if (gain === null || cost === null || G.upgradeLock(s, n.id, what)) continue;
      // a shop that runs itself earns without taps; one that doesn't only earns while tapped, so an upgrade there is worth a third
      out.push({ label: `${n.id}:${what}`, cost, gain: what === 'manager' || G.runsItself(shop) ? gain : gain / 3, buy: (st) => G.buyUpgrade(st, n.id, what) });
    }
    for (const kind of DECOR_KINDS) {
      const gain = G.decorGain(s, n.id, kind);
      const cost = G.decorCost(s, n.id, kind);
      if (gain !== null && cost !== null && shop.managed) out.push({ label: `${n.id}:decor-${kind}`, cost, gain, buy: (st) => G.buyDecor(st, n.id, kind) });
    }
    const b = G.bottleneckBundle(s, n.id);
    if (b)
      out.push({
        label: `${n.id}:bundle`,
        cost: b.cost,
        gain: G.runsItself(shop) ? b.gain : b.gain / 3,
        buy: (st) => {
          let cur = st;
          for (const w of b.steps) {
            const r = G.buyUpgrade(cur, n.id, w);
            if (!r.ok) return r;
            cur = r.state;
          }
          return { ok: true, state: cur };
        },
      });
    if (!G.upgradeLock(s, n.id, 'expand')) {
      const stage = G.bottleneck(shop, s.vehicle, city.fit);
      const what: G.Upgrade = stage === 'customers' ? 'tables' : stage;
      if (G.upgradeLock(s, n.id, what)) {
        const after = G.buyUpgrade({ ...s, cash: 1e300 }, n.id, 'expand');
        if (after.ok)
          out.push({
            label: `${n.id}:expand`,
            cost: G.upgradeCostOf(s, n.id, 'expand')!,
            gain: G.upgradeGain(after.state, n.id, what) ?? 0,
            buy: (st) => G.buyUpgrade(st, n.id, 'expand'),
          });
      }
    }
  }
  const next = G.nextToBuild(s);
  if (next && !G.buildLock(s, next.id))
    out.push({ label: `build:${next.id}`, cost: next.buildCost, gain: G.buildGain(s, next.id) / 2, buy: (st) => G.buildShop(st, next.id) });
  const vg = G.vehicleGain(s);
  if (vg !== null) out.push({ label: 'fleet', cost: city.fit.vehicles[s.vehicle + 1].cost, gain: vg, buy: G.buyVehicle });
  return out.filter((o) => o.gain > 1e-9);
}

/** Play the franchised city from `start` (a continuous, tapping, greedy player) until its last finale has been seen. */
function playCity(start: G.GameState, wall0: number, onSecond: (s: G.GameState, wall: number) => void, maxDays = 60) {
  let s = start;
  let wall = wall0;
  let lastSceneEnd: number | null = null;
  let waitCash = 0;
  let waitScenes = -1;
  let seen = 0;
  let rival: NeighborhoodId | null = null;
  let jammedFor = 0;
  const city = cityOf(s);
  const hoods = city.neighbourhoods;
  const menuHood = layerHood(city, 'menu');
  const shiftsHood = layerHood(city, 'shifts');
  onSecond(s, wall);
  while (!s.cityComplete && wall - wall0 < maxDays * 86400) {
    const newest = [...hoods].reverse().find((n) => s.shops[n.id].built)!.id;
    for (const id of [newest, hoods[0].id])
      for (let j = 0; j < 3 && !s.shops[id].managed; j++) {
        const st = G.nextStation(s.shops[id]);
        if (!st) break;
        const r = G.tapStation(s, id, st);
        if (!r.ok) break;
        s = r.state;
      }
    s = G.playTick(s, 1);
    wall += 1;
    for (let sc = pickScene(s, city.scenes, 1e15, 0, false, lastSceneEnd); sc; sc = pickScene(s, city.scenes, 1e15, 0, false, lastSceneEnd)) {
      s = G.markSceneSeen(s, sc);
      if (scenePacesGap(sc)) lastSceneEnd = s.playSeconds;
      seen++;
    }
    const at = clockAt(wall);
    // the rival's challenge: taken the moment it is on offer in a shop that runs itself, and rushed all through
    if (rival) {
      const v = rivalView(s, rival, at);
      if (v.phase === 'running') {
        if (s.shops[rival].managed) for (let i = 0; i < ORDER.rushTapsPerSecond; i++) s = G.tapShop(s, rival);
      } else rival = null;
    }
    if (!rival)
      for (const n of hoods) {
        const sh = s.shops[n.id];
        if (!sh.built || !G.runsItself(sh) || !G.challengeOffered(s, n.id) || rivalView(s, n.id, at).phase !== 'available') continue;
        const r = startRivalChallenge(s, n.id, at);
        if (r.ok) {
          s = r.state;
          rival = n.id;
        }
        break;
      }
    if (menuHood && s.shops[menuHood].built && wall % 30 === 0) {
      const best = bestMix(s);
      const now = mixOf(s);
      if (best.pepperoni !== now.pepperoni || best.knots !== now.knots) {
        const r = setMenu(s, best.pepperoni, best.knots);
        if (r.ok) s = r.state;
      }
    }
    if (shiftsHood && s.shops[shiftsHood].built && jamView(s).jammed) {
      if (++jammedFor >= 5) {
        const r = fixJam(s);
        if (r.ok) s = r.state;
        jammedFor = 0;
      }
    } else jammedFor = 0;
    onSecond(s, wall);
    if (s.cityComplete) break;
    for (let q = 0; q < 30; q++) {
      if (s.cash < waitCash && seen === waitScenes) break;
      const opts = options(s).sort((a, b) => b.gain / b.cost - a.gain / a.cost);
      if (!opts.length) break;
      const pick = opts[0];
      const r = pick.buy(s);
      if (!r.ok) {
        if (pick.cost > s.cash) {
          waitCash = pick.cost;
          waitScenes = seen;
        }
        break;
      }
      waitCash = 0;
      s = r.state;
    }
  }
  return { s, wall };
}

function main() {
  const rows: SnapshotRow[] = [];
  // the home city: sim2's continuous player, every second seen through `onSecond`
  const takeHome = collector(rows);
  const home = run('continuous', 300, 0, undefined, { onSecond: takeHome });
  if (!home.s.cityComplete) throw new Error('the home run did not reach the last finale');
  // every other city in the pack list, in order, entered by the engine's own franchise (the Stars of the clear before it)
  let from = home.s;
  let wall = home.wall;
  for (const city of Object.values(CITIES)) {
    if (city.id === cityOf(home.s).id) continue;
    if (!canFranchise(from)) throw new Error(`cannot franchise from ${from.city} to ${city.id}`);
    const entered = franchise(from, clockAt(wall));
    if (entered.city !== city.id) continue; // the franchise goes to the next city in CITY_ORDER; a pack out of order gets no rows until it is
    const take = collector(rows);
    const end = playCity(entered, wall, take);
    if (!end.s.cityComplete) throw new Error(`${city.id} did not reach its last finale in the run`);
    from = end.s;
    wall = end.wall;
  }
  const file: SnapshotFile = { saveVersion: G.SAVE_VERSION, made: new Date().toISOString(), rows };
  writeFileSync(OUT, JSON.stringify(file) + '\n');
  for (const r of rows)
    console.log(`${r.city.padEnd(7)} ${r.label.padEnd(26)} cash ${r.state.cash.toExponential(3).padStart(10)}  play ${Math.round(r.state.playSeconds)} s`);
  console.log(`${rows.length} rows -> src/dev/snapshots.json (saveVersion ${file.saveVersion})`);
}

main();
