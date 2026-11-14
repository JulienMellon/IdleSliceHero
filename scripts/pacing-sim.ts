// Greedy-player pacing simulation. Run: npx tsx scripts/pacing-sim.ts
// The player always saves for the purchase with the best cash/sec gained per dollar, across every pizzeria, and keeps tapping the newest
// pizzerias until it has a manager. v5.16: this is scripts/review/sim2.ts's `run('continuous')` (one player, one set of rules: it also plays
// the rewards, REWARDS=0 turns them off), printed as the scene table it always was. NOTAP=1: a casual player who only taps Downtown.
import { NEIGHBORHOODS } from '../src/content/tuning';
import * as G from '../src/engine/game';
import { masteryTotal } from '../src/engine/features/mastery';
import { options, reportLines, run } from './review/sim2';

const r = run('continuous');
const s = r.s;
const events: [number, string][] = r.scenes.map((x) => [x.wall, x.id]);
for (const b of r.buys) {
  const l = b.label;
  if (l.startsWith('build') || l.endsWith('manager') || l.includes(':head') || l === 'fleet' || l.includes('expand') || l.includes('grade') || l === 'pier9' || l === 'night-oven') events.push([b.wall, `  buy ${l}`]);
}
events.sort((a, b) => a[0] - b[0]);
let prev = 0;
let maxGap = 0;
for (const [t, e] of events) {
  const scene = !e.startsWith('  ');
  if (scene) maxGap = Math.max(maxGap, t - prev);
  console.log(`${(t / 60).toFixed(1).padStart(7)} min  ${scene ? `(+${((t - prev) / 60).toFixed(1)})` : '        '}  ${e}`);
  if (scene) prev = t;
}
console.log(`scenes ${s.seenScenes.length}/24 · longest scene gap ${(maxGap / 60).toFixed(1)} min · $/s ${G.earningsPerSecond(s).toFixed(0)} · mastery stars at the finale ${masteryTotal(s)}/18 (the check-in player's days after the story: scripts/pacing-fit.ts check)`);
console.log(reportLines(r).join('\n'));
if (process.env.DEBUG) {
  for (const n of NEIGHBORHOODS) {
    const sh = s.shops[n.id];
    console.log(n.id, JSON.stringify({ ...sh, line: undefined }), 'bottleneck', G.bottleneck(sh, s.vehicle),
      'rates', [G.prepRate(sh), G.ovenRate(sh), G.counterRate(sh), G.deliveryRate(sh, s.vehicle), G.walkInRate(sh)].map((x) => x.toFixed(1)).join('/'));
  }
  console.log(options(s).sort((a, b) => b.gain / b.cost - a.gain / a.cost).slice(0, 6).map((o) => `${o.label} cost ${o.cost.toExponential(1)} gain ${o.gain.toFixed(1)}`).join('\n'));
}
