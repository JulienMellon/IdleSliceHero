import { readFileSync } from 'fs';
import * as G from '../../src/engine/game';
import { NEIGHBORHOODS, VEHICLES } from '../../src/content/tuning';
for (const name of ['at-suburbs-2', 'at-suburbs-4', 'at-university-4', 'at-waterfront-2', 'at-university-2', 'at-industrial-2', 'at-uptown-2', 'end']) {
  const s = G.migrate(JSON.parse(readFileSync(`saves/${name}.json`, 'utf8')), 0);
  const eps = G.earningsPerSecond(s);
  const walk = NEIGHBORHOODS.filter((n) => s.shops[n.id].built).map((n) => { const sh = s.shops[n.id]; return `${n.id.slice(0,4)} walk ${(100 * G.walkInFraction(sh, s.vehicle)).toFixed(1)}% drv/kitchen ${(G.deliveryRate(sh, s.vehicle) / Math.min(G.prepRate(sh), G.ovenRate(sh), G.counterRate(sh))).toFixed(1)}x`; });
  const vg = G.vehicleGain(s);
  console.log(`${name}: t=${(s.playSeconds/60).toFixed(0)}m eps=$${eps.toExponential(2)} vehicle=${VEHICLES[s.vehicle].name} nextFleetGain=${vg === null ? 'n/a' : vg.toFixed(1)} (${vg && eps ? (100*vg/eps).toFixed(2) : 0}% of eps)`);
  console.log('   ', walk.join(' | '));
}
// drones at end with drivers as is
const e = G.migrate(JSON.parse(readFileSync('saves/end.json', 'utf8')), 0);
console.log('end vehicle', e.vehicle, 'drones unlocked', e.dronesUnlocked, 'drone gain', G.vehicleGain(e));
// rush: one GM shop, tap 3x/s for 60 s vs not
let a = e, b = e;
for (let i = 0; i < 60 * 5; i++) { a = G.playTick(a, 0.2); b = G.playTick(G.tapShop(b, 'uptown'), 0.2); if (i % 2 === 0) b = G.tapShop(b, 'uptown'); }
console.log('rush 60s: uptown sold', a.shops.uptown.sold - e.shops.uptown.sold, 'vs tapping 15/s', b.shops.uptown.sold - e.shops.uptown.sold, ' cash', (a.cash - e.cash).toExponential(2), (b.cash - e.cash).toExponential(2));
