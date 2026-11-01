// Review sim: the pacing-sim greedy player, plus (a) purchase cadence, (b) saves at key moments, (c) a check-in player.
import { writeFileSync, mkdirSync } from 'fs';
import { HOME_SCENES } from '../../src/content/scenes/home';
import { DECOR_KINDS, NEIGHBORHOODS, PIER9_BID, VEHICLES, TUNING } from '../../src/content/tuning';
import type { NeighborhoodId } from '../../src/content/types';
import { pickScene } from '../../src/engine/cutscene-input';
import * as G from '../../src/engine/game';

type Option = { label: string; cost: number; gain: number; buy: (s: G.GameState) => G.BuyResult };
function options(s: G.GameState): Option[] {
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

/** mode 'continuous': plays without stopping. mode 'checkin': plays `session` s, then away `away` s (offline catch-up). */
function run(mode: 'continuous' | 'checkin', session = 300, away = 4 * 3600, dumpDir?: string) {
  let s = G.newGame(0);
  let lastSceneEnd: number | null = null;
  let wall = 0; // real seconds since install
  const buys: { t: number; wall: number; label: string; cost: number }[] = [];
  const scenes: { t: number; wall: number; id: string }[] = [];
  const dumped = new Set<string>();
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
      }
      if (G.pier9Available(s) && s.cash >= PIER9_BID.cost) { const r = G.bidPier9(s); if (r.ok) { s = r.state; buys.push({ t: s.playSeconds, wall, label: 'pier9', cost: PIER9_BID.cost }); } }
      if (s.cityComplete) break outer;
      for (let q = 0; q < 30 && !G.pier9Available(s); q++) {
        const opts = options(s).sort((a, b) => b.gain / b.cost - a.gain / a.cost);
        if (!opts.length) break;
        const r = opts[0].buy(s);
        if (!r.ok) break;
        s = r.state; buys.push({ t: s.playSeconds, wall, label: opts[0].label, cost: opts[0].cost });
      }
      if (s.playSeconds > 60 * 60 * 40) break outer;
    }
    // away
    const cap = Number(process.env.CAP ?? 14400), eff = Number(process.env.EFF ?? 1);
    s = G.offlineTick(s, Math.min(away, cap) * eff).state;
    wall += away;
    if (sessions > 400) break;
  }
  return { s, buys, scenes, sessions, wall };
}

if (process.env.OV) { const ov = process.env.OV.split(',').map(Number); NEIGHBORHOODS.forEach((n, i) => { (n as any).orderValue = ov[i]; }); }
if (process.env.BC) { const bc = process.env.BC.split(',').map(Number); NEIGHBORHOODS.forEach((n, i) => { (n as any).buildCost = bc[i]; }); }
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
    console.log(`sessions of ${sess / 60} min every ${(sess + away) / 3600} h: done=${r.s.cityComplete} after ${r.sessions} sessions, ${days.toFixed(1)} days; scenes ${r.s.seenScenes.length}/24; unlock days ${JSON.stringify(m)}`);
  }
}
