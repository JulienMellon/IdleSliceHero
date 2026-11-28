import './tmp-e8-patch';
import { STATIONS, DECOR_TIER_COST, TUNING } from '../src/content/tuning';
import { FOOTPRINTS, OVEN_GRADES, VEHICLES } from '../src/content/cities/home/fit';
import { NEIGHBORHOODS } from '../src/content/cities/home/data';

const cm = NEIGHBORHOODS[0].costMult;
let total = 0;
const parts: Record<string, number> = {};
const levels = TUNING.levelsPerFootprint * FOOTPRINTS.length;
for (const k of ['prep', 'ovens', 'counter', 'drivers', 'tables'] as const) {
  const st = STATIONS[k];
  let sum = 0;
  for (let n = 0; n < levels - 1; n++) sum += st.cost * cm * Math.pow(st.growth ?? TUNING.costGrowth, n);
  parts[k] = sum;
  total += sum;
}
parts.decor = DECOR_TIER_COST.reduce((a, b) => a + b, 0) * 5 * cm;
parts.footprints = FOOTPRINTS.reduce((a, f) => a + f.cost, 0);
parts.grades = OVEN_GRADES.reduce((a, f) => a + f.cost, 0);
parts.vehicles = VEHICLES.reduce((a, f) => a + f.cost, 0);
parts.heads = NEIGHBORHOODS[0].headsCost;
total += parts.decor + parts.footprints + parts.grades + parts.vehicles + parts.heads;
console.log(
  Object.entries(parts)
    .map(([k, v]) => `${k} ${v.toExponential(2)}`)
    .join('  '),
  `TOTAL ${total.toExponential(3)}`,
);
