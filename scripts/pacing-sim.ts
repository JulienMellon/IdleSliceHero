// Greedy-player pacing simulation. Run: npx tsx scripts/pacing-sim.ts
// The player always saves for the purchase with the best cash/sec gained per dollar, across every pizzeria, and keeps tapping the newest
// pizzerias until it has a manager. v5.16: this is scripts/review/sim2.ts's `run('continuous')` (one player, one set of rules: it also plays
// the rewards, REWARDS=0 turns them off), printed as the scene table it always was. NOTAP=1: a casual player who only taps Downtown.
import { HOME_SCENES } from '../src/content/scenes/home';
import * as G from '../src/engine/game';
import { masteryTotal } from '../src/engine/features/mastery';
import { applyCfg, options, reportLines, run } from './review/sim2';
import { BOSTON_TOLERANCE, franchiseRun } from './pacing-fit';

import { HOME_FIT } from '../src/content/cities/home/fit';
import { HOME_CHAPTERS } from '../src/content/cities/home/chapters';
import { NEIGHBORHOODS } from '../src/content/cities/home/data';
const r = run('continuous');
const s = r.s;
/** What starts each scene, as the table prints it (v5.16, card T1a: the story models `after`, `requires`, the rival `challenge` and the hired `manager`). */
const KIND = (id: string): string => {
  const t = HOME_SCENES.find((x) => x.id === id)!.trigger;
  return t.kind === 'after' ? `after ${t.scene} +${t.seconds}s` : t.kind;
};
/** v5.21 (card E1): the minutes each main beat played at in v5.20 (before the chapters), from this script's own table. */
const V520_MIN: Record<string, number> = {
  'downtown-1': 0.0,
  'downtown-2': 4.5,
  'downtown-3': 7.9,
  'downtown-4': 11.4,
  'suburbs-1': 17.8,
  'suburbs-2': 23.7,
  'suburbs-3': 30.8,
  'suburbs-4': 38.0,
  'waterfront-1': 174.9,
  'waterfront-2': 183.6,
  'waterfront-3': 217.0,
  'waterfront-4': 239.6,
  'university-1': 800.0,
  'university-2': 884.3,
  'university-3': 939.4,
  'university-4': 1401.4,
  'industrial-1': 1620.5,
  'industrial-2': 1711.8,
  'industrial-3': 1741.5,
  'industrial-4': 2234.4,
  'uptown-1': 2281.7,
  'uptown-2': 2379.4,
  'uptown-3': 2518.5,
  'uptown-4': 4438.4,
};
const movedBeats: string[] = [];
/** The chapter column: the chapter's task kinds, and where the beat plays now against v5.20 (a beat more than 5% off is flagged). */
const CHAPTER = (id: string, wall: number): string => {
  const c = HOME_CHAPTERS.find((x) => x.sceneId === id);
  if (!c) return '';
  const before = V520_MIN[id];
  const now = wall / 60;
  const pct = before >= 1 ? ((now - before) / before) * 100 : 0;
  const moved = Math.abs(pct) > 5;
  if (moved) movedBeats.push(`${id} ${before.toFixed(1)} -> ${now.toFixed(1)} min (${pct >= 0 ? '+' : ''}${pct.toFixed(1)}%)`);
  return ` · chapter ${c.tasks.map((t) => t.kind).join('+')} · v5.20 ${before.toFixed(1)} -> ${now.toFixed(1)} (${pct >= 0 ? '+' : ''}${pct.toFixed(1)}%)${moved ? ' MOVED' : ''}`;
};
const events: [number, string][] = r.scenes.map((x) => [x.wall, `${x.id} [${KIND(x.id)}]${CHAPTER(x.id, x.wall)}`]);
for (const b of r.buys) {
  const l = b.label;
  if (
    l.startsWith('build') ||
    l.endsWith('manager') ||
    l.includes(':head') ||
    l === 'fleet' ||
    l.includes('expand') ||
    l.includes('grade') ||
    l === 'pier9' ||
    l === 'night-oven'
  )
    events.push([b.wall, `  buy ${l}`]);
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
console.log(`chapter beats more than 5% off v5.20: ${movedBeats.length ? movedBeats.join(', ') : 'none'}`);
const played = new Set(r.scenes.map((x) => x.id));
const missing = HOME_SCENES.filter((x) => !played.has(x.id)).map((x) => x.id);
console.log(
  `scenes ${played.size}/${HOME_SCENES.length} · longest scene gap ${(maxGap / 60).toFixed(1)} min · $/s ${G.earningsPerSecond(s).toFixed(0)} · mastery stars at the finale ${masteryTotal(s)}/18 (the check-in player's days after the story: scripts/pacing-fit.ts check)`,
);
console.log(reportLines(r).join('\n'));

// ---- v5.18 (card E3): the franchise. The check-in player finishes the home city, franchises when it can, and plays Boston (pacing-fit.ts `franchiseRun`). ----
// Run before the EAGER player below, which changes the home tables for good.
{
  const f = franchiseRun();
  const d = (x: number) => (Number.isFinite(x) ? x.toFixed(2) : 'n/a').padStart(6);
  console.log(
    `\nfranchise: ${f.home.earned.toExponential(2)} earned in ${f.home.offered ? 'Port Marinara' : '(not on offer)'} -> ${f.home.stars} Stars, x${f.home.multiplier}; Boston starts as ${f.boston.startedWith.city} with $${f.boston.startedWith.cash}`,
  );
  console.log('day table (check-in player)  home  boston');
  for (const k of Object.keys(f.home.days) as (keyof typeof f.home.days)[]) console.log(`  ${k.padEnd(10)} ${d(f.home.days[k])} ${d(f.boston.days[k])}`);
  if (
    !f.boston.done ||
    Object.keys(f.home.days).some(
      (k) => Math.abs(f.boston.days[k as keyof typeof f.boston.days] - f.home.days[k as keyof typeof f.home.days]) > BOSTON_TOLERANCE,
    )
  ) {
    console.error(`BOSTON IS OFF THE HOME CITY'S DAYS BY MORE THAN ${BOSTON_TOLERANCE}`);
    process.exitCode = 1;
  }
}

// ---- v5.16 (card T1a): the story, all of it ----
// Every scene must play; the gaps are listed by what ends them. A timer gap (an `after` interlude) is the only one `after` delays change: the others wait
// for the economy (a build, a manager's price) or for a won challenge, which card E2b's refit fits.
const byId = new Map(HOME_SCENES.map((x) => [x.id, x]));
const gapsOf = (walls: { id: string; wall: number }[]) =>
  walls.map((x, i) => ({ id: x.id, min: (x.wall - (i ? walls[i - 1].wall : 0)) / 60, kind: byId.get(x.id)!.trigger.kind }));
const gaps = gapsOf(r.scenes);
const MAX_GAP_MIN = 12;
const over = gaps.filter((g) => g.min > MAX_GAP_MIN);
const timers = gaps.filter((g) => g.kind === 'after');
console.log(`scene gaps over ${MAX_GAP_MIN} min: ${over.length ? over.map((g) => `${g.id} +${g.min.toFixed(0)} (${g.kind})`).join(', ') : 'none'}`);
console.log(
  `longest interlude timer gap ${Math.max(...timers.map((g) => g.min)).toFixed(1)} min (${timers.sort((a, b) => b.min - a.min)[0].id}); longest of the others ${Math.max(...gaps.filter((g) => g.kind !== 'after').map((g) => g.min)).toFixed(1)} min`,
);
if (missing.length) {
  console.error(`NOT ALL SCENES PLAY: ${played.size}/${HOME_SCENES.length}, missing ${missing.join(', ')}`);
  process.exitCode = 1;
}
if (timers.some((g) => g.min > MAX_GAP_MIN)) {
  console.error(
    `AN INTERLUDE TIMER IS OVER ${MAX_GAP_MIN} MIN: ${timers
      .filter((g) => g.min > MAX_GAP_MIN)
      .map((g) => g.id)
      .join(', ')}`,
  );
  process.exitCode = 1;
}

// The player who builds University as early as the game lets him. EAGER builds every pizzeria the moment it is affordable, and University's build price is
// cut to twice Waterfront's so that moment comes early (at the real price it never does: the bid opens first). Since v5.21 (card E1b) the build waits for
// Waterfront's chapter 3 (`buildLock`), so a chapter that needs Waterfront is never left behind a shop built too early. Scenes must still all play.
/** The longest wait between two main beats of a run, in minutes, and the beat that ends it (the card E1b check: EAGER must not wait much longer than the tuned run). */
const MAIN_IDS = new Set(HOME_CHAPTERS.map((c) => c.sceneId));
const longestBeatWait = (walls: { id: string; wall: number }[]): { min: number; id: string } => {
  let prevWall = 0;
  let best = { min: 0, id: '' };
  for (const x of walls.filter((w) => MAIN_IDS.has(w.id)).sort((a, b) => a.wall - b.wall)) {
    if ((x.wall - prevWall) / 60 > best.min) best = { min: (x.wall - prevWall) / 60, id: x.id };
    prevWall = x.wall;
  }
  return best;
};
const tunedWait = longestBeatWait(r.scenes);
applyCfg({ eager: true, bc: NEIGHBORHOODS.map((n) => (n.id === 'university' ? NEIGHBORHOODS.find((w) => w.id === 'waterfront')!.buildCost * 2 : NaN)) });
const e = run('continuous', 0, 0, undefined, {});
const ePlayed = new Set(e.scenes.map((x) => x.id));
const eWall = (id: string) => e.scenes.find((x) => x.id === id)?.wall;
const uniBuilt = e.timeline.university?.build;
const bidOpen = e.pier9Open?.wall;
console.log(
  `\nEAGER player, University built as early as the gate lets him: University built ${uniBuilt === undefined ? 'never' : (uniBuilt / 60).toFixed(1) + ' min'}, bid open ${bidOpen === undefined ? 'never' : (bidOpen / 60).toFixed(1) + ' min'}, waterfront-4 ${eWall('waterfront-4') === undefined ? 'never' : ((eWall('waterfront-4') ?? 0) / 60).toFixed(1) + ' min'}, university-3 ${eWall('university-3') === undefined ? 'never' : ((eWall('university-3') ?? 0) / 60).toFixed(1) + ' min'}`,
);
console.log(`  scenes ${ePlayed.size}/${HOME_SCENES.length} · city complete ${e.s.cityComplete}`);
const eagerWait = longestBeatWait(e.scenes);
console.log(
  `longest wait between main beats: tuned ${tunedWait.min.toFixed(1)} min (${tunedWait.id}) · EAGER ${eagerWait.min.toFixed(1)} min (${eagerWait.id})`,
);
const eMissing = HOME_SCENES.filter((x) => !ePlayed.has(x.id)).map((x) => x.id);
if (eMissing.length) {
  console.error(`NOT ALL SCENES PLAY (EAGER): missing ${eMissing.join(', ')}`);
  process.exitCode = 1;
}
if (process.env.DEBUG) {
  for (const n of NEIGHBORHOODS) {
    const sh = s.shops[n.id];
    console.log(
      n.id,
      JSON.stringify({ ...sh, line: undefined }),
      'bottleneck',
      G.bottleneck(sh, s.vehicle, HOME_FIT),
      'rates',
      [G.prepRate(sh), G.ovenRate(sh, HOME_FIT), G.counterRate(sh), G.deliveryRate(sh, s.vehicle, HOME_FIT), G.walkInRate(sh)]
        .map((x) => x.toFixed(1))
        .join('/'),
    );
  }
  console.log(
    options(s)
      .sort((a, b) => b.gain / b.cost - a.gain / a.cost)
      .slice(0, 6)
      .map((o) => `${o.label} cost ${o.cost.toExponential(1)} gain ${o.gain.toFixed(1)}`)
      .join('\n'),
  );
}
