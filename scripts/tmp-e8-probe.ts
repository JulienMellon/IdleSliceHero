import * as G from '../src/engine/game';
import { applyCfg, run } from './review/sim2';
applyCfg({ rewards: true });
const marks = [10, 20, 30, 45, 60, 90, 120, 180, 300, 420, 600, 720, 900, 1080, 1200, 1500, 1800, 2400, 3000];
const r = run('continuous', 0, 0, undefined, {
  atScene: 'suburbs-4',
  maxWall: 3200,
  onSecond: (s, wall) => {
    if (!marks.includes(wall)) return;
    const d = s.shops.downtown;
    console.log(
      `${String(wall).padStart(5)}s cash ${s.cash.toFixed(0).padStart(9)} eps ${G.earningsPerSecond(s).toFixed(2).padStart(8)} sold ${d.sold} lv ${d.prep}/${d.ovens}/${d.counter}/${d.drivers}/${d.tables} fp${d.footprint} heads ${Object.values(d.heads).filter(Boolean).length} sub ${s.shops.suburbs.built ? s.shops.suburbs.sold : '-'}`,
    );
  },
});
console.log(
  r.buys
    .slice(0, 40)
    .map((b) => `${b.wall.toFixed(0)}s ${b.label} $${b.cost.toFixed(0)}`)
    .join('\n'),
);
