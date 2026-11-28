import './tmp-e8-patch';
import * as G from '../src/engine/game';
import { applyCfg, run } from './review/sim2';
applyCfg({ rewards: true });
const marks = (process.env.MARKS ?? '60,120,180,300,420,600,720,900,1020,1080,1140,1200,1260,1320,1500,1800,2100,2400,3000').split(',').map(Number);
const r = run('continuous', 0, 0, undefined, {
  atScene: 'suburbs-4',
  maxWall: 3200,
  onSecond: (s, wall) => {
    if (!marks.includes(wall)) return;
    const d = s.shops.downtown;
    const sb = s.shops.suburbs;
    console.log(
      `${String(wall).padStart(5)}s cash ${s.cash.toFixed(0).padStart(8)} eps ${G.earningsPerSecond(s).toFixed(1).padStart(7)} sold ${d.sold} lv ${d.prep}/${d.ovens}/${d.counter}/${d.drivers}/${d.tables} fp${d.footprint} gr${d.grade} veh${s.vehicle} heads ${Object.values(d.heads).filter(Boolean).length}${d.managed ? 'M' : ''} sub ${sb.built ? `${sb.prep}/${sb.ovens}/${sb.counter} sold ${sb.sold}${sb.managed ? ' M' : ''}` : '-'}`,
    );
  },
});
if (process.env.BUYS)
  console.log(
    r.buys
      .filter((b) => b.cost > Number(process.env.BUYS))
      .map((b) => `${(b.wall / 60).toFixed(1)}m ${b.label} $${b.cost.toFixed(0)}`)
      .join('\n'),
  );
if (process.env.CLAIMS)
  console.log(
    r.claims
      .filter((c) => c.wall >= Number(process.env.CLAIMS))
      .slice(0, 15)
      .map((c) => `${c.wall}s ${c.kind} $${c.cash.toFixed(0)}`)
      .join('\n'),
  );
console.log(r.scenes.map((x) => `${x.id}@${(x.wall / 60).toFixed(1)}`).join(' '));
