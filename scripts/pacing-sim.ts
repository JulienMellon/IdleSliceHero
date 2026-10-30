// Greedy-player pacing simulation. Run: npx tsx scripts/pacing-sim.ts
// The player always saves for the purchase with the best cash/sec gained per dollar, across every
// pizzeria, and keeps tapping the newest pizzerias until it has a manager.
import { HOME_SCENES } from '../src/content/scenes/home';
import { DECOR_KINDS, NEIGHBORHOODS, PIER9_BID, VEHICLES } from '../src/content/tuning';
import type { NeighborhoodId } from '../src/content/types';
import { pickScene } from '../src/engine/cutscene-input';
import * as G from '../src/engine/game';

type Option = { label: string; cost: number; gain: number; buy: (s: G.GameState) => G.BuyResult };

function options(s: G.GameState): Option[] {
  const out: Option[] = [];
  for (const n of NEIGHBORHOODS) {
    const shop = s.shops[n.id];
    if (!shop.built) continue;
    for (const what of ['prep', 'ovens', 'counter', 'drivers', 'tables', 'grade', 'manager'] as G.Upgrade[]) {
      const gain = G.upgradeGain(s, n.id, what);
      const cost = G.upgradeCostOf(s, n.id, what);
      if (gain === null || cost === null) continue;
      // An unmanaged shop only earns while tapped; treat its upgrades as worth a third.
      const g = what === 'manager' ? gain : shop.managed ? gain : gain / 3;
      out.push({ label: `${n.id}:${what}`, cost, gain: g, buy: (st) => G.buyUpgrade(st, n.id, what) });
    }
    for (const kind of DECOR_KINDS) {
      const gain = G.decorGain(s, n.id, kind);
      const cost = G.decorCost(s, n.id, kind);
      if (gain !== null && cost !== null && shop.managed) out.push({ label: `${n.id}:decor-${kind}`, cost, gain, buy: (st) => G.buyDecor(st, n.id, kind) });
    }
    const b = G.bottleneckBundle(s, n.id);
    if (b && shop.managed) {
      out.push({
        label: `${n.id}:bundle(${b.steps.join('+')})`,
        cost: b.cost,
        gain: b.gain,
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
    }
    // Expand is worth what the capped bottleneck station would gain after it.
    if (!G.upgradeLock(s, n.id, 'expand')) {
      const stage = G.bottleneck(shop, s.vehicle);
      const what: G.Upgrade = stage === 'customers' ? 'tables' : stage;
      if (G.upgradeLock(s, n.id, what)) {
        const after = G.buyUpgrade({ ...s, cash: 1e300 }, n.id, 'expand');
        if (after.ok) {
          const gain = G.upgradeGain(after.state, n.id, what) ?? 0;
          out.push({ label: `${n.id}:expand`, cost: G.upgradeCostOf(s, n.id, 'expand')!, gain, buy: (st) => G.buyUpgrade(st, n.id, 'expand') });
        }
      }
    }
  }
  const next = G.nextToBuild(s);
  if (next) out.push({ label: `build:${next.id}`, cost: next.buildCost, gain: G.buildGain(s, next.id) / 2, buy: (st) => G.buildShop(st, next.id) });
  const vg = G.vehicleGain(s);
  if (vg !== null) out.push({ label: 'fleet', cost: VEHICLES[s.vehicle + 1].cost, gain: vg, buy: G.buyVehicle });
  return out.filter((o) => o.gain > 1e-9);
}

let s = G.newGame(0);
const events: [number, string][] = [];
// v3.7 story pacing: one waiting beat may play at once after launch, then 90 s of play between beats.
// The sim plays in one sitting and never taps during a scene, so the tap gate is always open.
let lastSceneEnd: number | null = null;
const dt = 1;
const LIMIT = 60 * 60 * 30;
for (let t = 0; t < LIMIT; t += dt) {
  // Tap every unmanaged pizzeria the player is "looking at": the newest one.
  const newest = [...NEIGHBORHOODS].reverse().find((n) => s.shops[n.id].built)!.id as NeighborhoodId;
  // NOTAP=1: a casual player who only taps Downtown until Nonna takes over, then never taps again.
  const tappers = (process.env.NOTAP ? ['downtown'] : [newest, 'downtown']) as NeighborhoodId[];
  for (const id of tappers) if (!s.shops[id].managed && s.shops[id].queued < 4) s = G.tapShop(s, id);
  s = G.playTick(s, dt);
  for (let sc = pickScene(s, HOME_SCENES, 1e15, 0, false, lastSceneEnd); sc; sc = pickScene(s, HOME_SCENES, 1e15, 0, false, lastSceneEnd)) {
    s = G.markSceneSeen(s, sc);
    lastSceneEnd = s.playSeconds;
    events.push([t, `${sc.id}`]);
  }
  // Waterfront's finale is a purchase: the player bids on Pier 9 as soon as they can afford it
  if (G.pier9Available(s) && s.cash >= PIER9_BID.cost) {
    const r = G.bidPier9(s);
    if (r.ok) {
      s = r.state;
      events.push([t, '  buy pier9-bid']);
    }
  }
  if (s.cityComplete) break;
  // the goal bar puts the bid first, so the player saves for it instead of buying anything else
  for (let k = 0; k < 30 && !G.pier9Available(s); k++) {
    const opts = options(s).sort((a, b) => b.gain / b.cost - a.gain / a.cost);
    if (!opts.length) break;
    const r = opts[0].buy(s);
    if (!r.ok) break;
    if (opts[0].label.startsWith('build') || opts[0].label.endsWith('manager') || opts[0].label === 'fleet' || opts[0].label.includes('expand') || opts[0].label.includes('grade'))
      events.push([t, `  buy ${opts[0].label}`]);
    s = r.state;
  }
}
let prev = 0;
let maxGap = 0;
for (const [t, e] of events) {
  const scene = !e.startsWith('  ');
  if (scene) maxGap = Math.max(maxGap, t - prev);
  console.log(`${(t / 60).toFixed(1).padStart(7)} min  ${scene ? `(+${((t - prev) / 60).toFixed(1)})` : '        '}  ${e}`);
  if (scene) prev = t;
}
console.log(`scenes ${s.seenScenes.length}/24 · longest scene gap ${(maxGap / 60).toFixed(1)} min · $/s ${G.earningsPerSecond(s).toFixed(0)}`);
if (process.env.DEBUG) {
  for (const n of NEIGHBORHOODS) {
    const sh = s.shops[n.id];
    console.log(n.id, JSON.stringify({ ...sh, sold: Math.round(sh.sold), queued: undefined }), 'bottleneck', G.bottleneck(sh, s.vehicle),
      'rates', [G.prepRate(sh), G.ovenRate(sh), G.counterRate(sh), G.deliveryRate(sh, s.vehicle), G.walkInRate(sh)].map((x) => x.toFixed(1)).join('/'));
  }
  console.log(options(s).sort((a, b) => b.gain / b.cost - a.gain / a.cost).slice(0, 6).map((o) => `${o.label} cost ${o.cost.toExponential(1)} gain ${o.gain.toFixed(1)}`).join('\n'));
}
