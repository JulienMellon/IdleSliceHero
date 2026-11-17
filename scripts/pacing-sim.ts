// Greedy-player pacing simulation. Run: npx tsx scripts/pacing-sim.ts
// The player always saves for the purchase with the best cash/sec gained per dollar, across every pizzeria, and keeps tapping the newest
// pizzerias until it has a manager. v5.16: this is scripts/review/sim2.ts's `run('continuous')` (one player, one set of rules: it also plays
// the rewards, REWARDS=0 turns them off), printed as the scene table it always was. NOTAP=1: a casual player who only taps Downtown.
import { HOME_SCENES } from '../src/content/scenes/home';
import { NEIGHBORHOODS } from '../src/content/tuning';
import * as G from '../src/engine/game';
import { masteryTotal } from '../src/engine/features/mastery';
import { applyCfg, options, reportLines, run } from './review/sim2';
import { BOSTON_TOLERANCE, franchiseRun } from './pacing-fit';

const r = run('continuous');
const s = r.s;
/** What starts each scene, as the table prints it (v5.16, card T1a: the story models `after`, `requires`, the rival `challenge` and the hired `manager`). */
const KIND = (id: string): string => {
  const t = HOME_SCENES.find((x) => x.id === id)!.trigger;
  return t.kind === 'after' ? `after ${t.scene} +${t.seconds}s` : t.kind;
};
const events: [number, string][] = r.scenes.map((x) => [x.wall, `${x.id} [${KIND(x.id)}]`]);
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
const played = new Set(r.scenes.map((x) => x.id));
const missing = HOME_SCENES.filter((x) => !played.has(x.id)).map((x) => x.id);
console.log(`scenes ${played.size}/${HOME_SCENES.length} · longest scene gap ${(maxGap / 60).toFixed(1)} min · $/s ${G.earningsPerSecond(s).toFixed(0)} · mastery stars at the finale ${masteryTotal(s)}/18 (the check-in player's days after the story: scripts/pacing-fit.ts check)`);
console.log(reportLines(r).join('\n'));

// ---- v5.18 (card E3): the franchise. The check-in player finishes the home city, franchises when it can, and plays Boston (pacing-fit.ts `franchiseRun`). ----
// Run before the EAGER player below, which changes the home tables for good.
{
  const f = franchiseRun();
  const d = (x: number) => (Number.isFinite(x) ? x.toFixed(2) : 'n/a').padStart(6);
  console.log(`\nfranchise: ${f.home.earned.toExponential(2)} earned in ${f.home.offered ? 'Port Marinara' : '(not on offer)'} -> ${f.home.stars} Stars, x${f.home.multiplier}; Boston starts as ${f.boston.startedWith.city} with $${f.boston.startedWith.cash}`);
  console.log('day table (check-in player)  home  boston');
  for (const k of Object.keys(f.home.days) as (keyof typeof f.home.days)[]) console.log(`  ${k.padEnd(10)} ${d(f.home.days[k])} ${d(f.boston.days[k])}`);
  if (!f.boston.done || Object.keys(f.home.days).some((k) => Math.abs(f.boston.days[k as keyof typeof f.boston.days] - f.home.days[k as keyof typeof f.home.days]) > BOSTON_TOLERANCE)) {
    console.error(`BOSTON IS OFF THE HOME CITY'S DAYS BY MORE THAN ${BOSTON_TOLERANCE}`);
    process.exitCode = 1;
  }
}

// ---- v5.16 (card T1a): the story, all of it ----
// Every scene must play; the gaps are listed by what ends them. A timer gap (an `after` interlude) is the only one `after` delays change: the others wait
// for the economy (a build, a manager's price) or for a won challenge, which card E2b's refit fits.
const byId = new Map(HOME_SCENES.map((x) => [x.id, x]));
const gapsOf = (walls: { id: string; wall: number }[]) => walls.map((x, i) => ({ id: x.id, min: (x.wall - (i ? walls[i - 1].wall : 0)) / 60, kind: byId.get(x.id)!.trigger.kind }));
const gaps = gapsOf(r.scenes);
const MAX_GAP_MIN = 12;
const over = gaps.filter((g) => g.min > MAX_GAP_MIN);
const timers = gaps.filter((g) => g.kind === 'after');
console.log(`scene gaps over ${MAX_GAP_MIN} min: ${over.length ? over.map((g) => `${g.id} +${g.min.toFixed(0)} (${g.kind})`).join(', ') : 'none'}`);
console.log(`longest interlude timer gap ${Math.max(...timers.map((g) => g.min)).toFixed(1)} min (${timers.sort((a, b) => b.min - a.min)[0].id}); longest of the others ${Math.max(...gaps.filter((g) => g.kind !== 'after').map((g) => g.min)).toFixed(1)} min`);
if (missing.length) {
  console.error(`NOT ALL SCENES PLAY: ${played.size}/${HOME_SCENES.length}, missing ${missing.join(', ')}`);
  process.exitCode = 1;
}
if (timers.some((g) => g.min > MAX_GAP_MIN)) {
  console.error(`AN INTERLUDE TIMER IS OVER ${MAX_GAP_MIN} MIN: ${timers.filter((g) => g.min > MAX_GAP_MIN).map((g) => g.id).join(', ')}`);
  process.exitCode = 1;
}

// The player who builds University before the bid. EAGER builds every pizzeria the moment it is affordable, and University's build price is cut to twice
// Waterfront's so that moment comes before the bid opens (at the real price it never does: the bid opens first). Scenes must still all play, and the
// goal bar's hint ("Save Marisol's dock to continue University's story") must be on screen while University's act 3 waits for the bid.
applyCfg({ eager: true, bc: NEIGHBORHOODS.map((n) => (n.id === 'university' ? NEIGHBORHOODS.find((w) => w.id === 'waterfront')!.buildCost * 2 : NaN)) });
let hintFrom = -1;
let hintTo = -1;
let hintText = '';
const e = run('continuous', 0, 0, undefined, {
  onSecond: (st, wall) => {
    const h = G.storyWaitHint(st);
    if (h) { if (hintFrom < 0) { hintFrom = wall; hintText = h; } hintTo = wall; }
  },
});
const ePlayed = new Set(e.scenes.map((x) => x.id));
const eWall = (id: string) => e.scenes.find((x) => x.id === id)?.wall;
const uniBuilt = e.timeline.university?.build;
const bidOpen = e.pier9Open?.wall;
console.log(`\nUniversity built before the bid (EAGER): University built ${uniBuilt === undefined ? 'never' : (uniBuilt / 60).toFixed(1) + ' min'}, bid open ${bidOpen === undefined ? 'never' : (bidOpen / 60).toFixed(1) + ' min'}, waterfront-4 ${eWall('waterfront-4') === undefined ? 'never' : ((eWall('waterfront-4') ?? 0) / 60).toFixed(1) + ' min'}, university-3 ${eWall('university-3') === undefined ? 'never' : ((eWall('university-3') ?? 0) / 60).toFixed(1) + ' min'}`);
console.log(`  hint on screen ${hintFrom < 0 ? 'never' : `${(hintFrom / 60).toFixed(1)} to ${(hintTo / 60).toFixed(1)} min: "${hintText}"`} · scenes ${ePlayed.size}/${HOME_SCENES.length} · city complete ${e.s.cityComplete}`);
const eMissing = HOME_SCENES.filter((x) => !ePlayed.has(x.id)).map((x) => x.id);
if (eMissing.length) {
  console.error(`NOT ALL SCENES PLAY (University first): missing ${eMissing.join(', ')}`);
  process.exitCode = 1;
}
if (process.env.DEBUG) {
  for (const n of NEIGHBORHOODS) {
    const sh = s.shops[n.id];
    console.log(n.id, JSON.stringify({ ...sh, line: undefined }), 'bottleneck', G.bottleneck(sh, s.vehicle),
      'rates', [G.prepRate(sh), G.ovenRate(sh), G.counterRate(sh), G.deliveryRate(sh, s.vehicle), G.walkInRate(sh)].map((x) => x.toFixed(1)).join('/'));
  }
  console.log(options(s).sort((a, b) => b.gain / b.cost - a.gain / a.cost).slice(0, 6).map((o) => `${o.label} cost ${o.cost.toExponential(1)} gain ${o.gain.toFixed(1)}`).join('\n'));
}
