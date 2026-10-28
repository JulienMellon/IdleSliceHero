// Greedy-player pacing simulation. Run: npx tsx scripts/pacing-sim.ts
import * as G from '../src/engine/game';
import { NEIGHBORHOODS, VEHICLES } from '../src/content/tuning';

import { HOME_SCENES } from '../src/content/scenes/home';
const thresholds: Record<string, number[]> = {};
for (const sc of HOME_SCENES) if (sc.trigger.kind === 'deliveries') (thresholds[sc.neighborhood] ??= []).push(sc.trigger.count);
let s = G.newGame(0);
const events: [number, string][] = [];
const hit = new Set<string>();
const dt = 0.5;
for (let t = 0; t < 60 * 60 * 40; t += dt) {
  if (!s.autoBake) s = G.tapOven(s); // active player taps
  s = G.tick(s, dt);
  for (const n of s.unlocked) {
    if (!hit.has(n + '1')) { hit.add(n + '1'); events.push([t, `${n} beat1 (unlock)`]); }
    thresholds[n].forEach((c, i) => {
      const k = n + (i + 2);
      if (!hit.has(k) && s.delivered[n] >= c) {
        hit.add(k); events.push([t, `${n} beat${i + 2}`]);
        if (n === 'downtown' && i === 2) s = { ...s, autoBake: true };
        if (n === 'university' && i === 2) s = { ...s, dronesUnlocked: true };
      }
    });
  }
  if (hit.has('uptown4')) break;
  // Greedy: buy cheapest available useful thing, prefer unlocks/vehicles when affordable.
  for (let k = 0; k < 20; k++) {
    const next = NEIGHBORHOODS.find((n) => !s.unlocked.includes(n.id));
    const opts: { cost: number; f: () => G.BuyResult }[] = [];
    if (next && !G.neighborhoodLock(s, next.id)) opts.push({ cost: next.unlockCost, f: () => G.unlockNeighborhood(s, next.id) });
    if (!G.nextVehicleLock(s)) opts.push({ cost: VEHICLES[s.vehicle + 1].cost, f: () => G.buyVehicle(s) });
    // buy whichever of oven/drivers is the bottleneck
    if (G.bottleneck(s) === 'oven') opts.push({ cost: G.ovenCost(s), f: () => G.buyOven(s) });
    else opts.push({ cost: G.driverCost(s), f: () => G.buyDriver(s) });
    opts.sort((a, b) => a.cost - b.cost);
    const r = opts[0].f();
    if (!r.ok) break;
    s = r.state;
  }
}
let prev = 0;
for (const [t, e] of events) { console.log(`${(t / 60).toFixed(1).padStart(7)} min  (+${((t - prev) / 60).toFixed(1)})  ${e}`); prev = t; }
console.log('final oven', s.ovenLevel, 'drivers', s.drivers, 'vehicle', VEHICLES[s.vehicle].id, '$/s', G.earningsPerSecond(s).toFixed(0));
