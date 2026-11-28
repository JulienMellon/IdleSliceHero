// scratch: PATCH='{"growth":{"prep":1.1},"cost":{"prep":6},"heads":[250,500,600],"hood":{"suburbs":{"buildCost":20000}},"oven":[..],"fp":[..],"dc":[..],"vc":[..]}'
import { STATIONS, DECOR_TIER_COST } from '../src/content/tuning';
import { HEAD_COST_DOWNTOWN, OVEN_GRADES, FOOTPRINTS, VEHICLES } from '../src/content/cities/home/fit';
import { NEIGHBORHOODS } from '../src/content/cities/home/data';
import { session1 } from './pacing-fit';

const p = JSON.parse(process.env.PATCH ?? '{}');
for (const [k, v] of Object.entries(p.growth ?? {})) (STATIONS as any)[k].growth = v;
for (const [k, v] of Object.entries(p.cost ?? {})) (STATIONS as any)[k].cost = v;
if (p.heads) [HEAD_COST_DOWNTOWN.prep, HEAD_COST_DOWNTOWN.oven, HEAD_COST_DOWNTOWN.counter] = p.heads;
if (p.heads) (NEIGHBORHOODS[0] as any).headsCost = p.heads[0] + p.heads[1] + p.heads[2];
for (const [k, v] of Object.entries(p.hood ?? {}))
  Object.assign(
    NEIGHBORHOODS.find((n) => n.id === k)!,
    v,
  );
p.oven?.forEach((v: number, i: number) => (OVEN_GRADES[i + 1].cost = v));
p.fp?.forEach((v: number, i: number) => (FOOTPRINTS[i + 1].cost = v));
p.dc?.forEach((v: number, i: number) => (DECOR_TIER_COST[i] = v));
p.vc?.forEach((v: number, i: number) => (VEHICLES[i + 1].cost = v));
const m = session1();
const f = (x: number) => (Number.isFinite(x) ? x.toFixed(1) : 'n/a');
console.log(
  `heads ${m.heads.map(f).join('/')} takeover ${f(m.takeover)} opens ${f(m.opens)} manager ${f(m.manager)} finale ${f(m.finale)} | median gap ${m.medianGap}s max ${m.maxGap}s | scene gap ${m.sceneGap.toFixed(1)}`,
);
console.log(`scenes ${m.scenes.map((x) => `${x.id}@${f(x.minutes)}`).join(' ')}`);
console.log(`bought ${JSON.stringify(m.bought)} locked ${m.suburbsLocked}`);
