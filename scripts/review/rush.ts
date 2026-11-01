/// <reference types="node" />
import { readFileSync } from 'fs';
import * as G from '../../src/engine/game';
for (const name of ['at-suburbs-4', 'at-university-2', 'end']) {
  const e = G.migrate(JSON.parse(readFileSync(`saves/${name}.json`, 'utf8')), 0);
  const id = e.active;
  const out: string[] = [];
  for (const rate of [0, 1, 2, 4, 6]) {
    let s = e; const dt = 0.05; let acc = 0;
    for (let i = 0; i < 60 / dt; i++) { acc += rate * dt; while (acc >= 1) { s = G.tapShop(s, id); acc -= 1; } s = G.playTick(s, dt); }
    out.push(`${rate}/s → ${s.shops[id].sold - e.shops[id].sold}`);
  }
  console.log(name, id, e.shops[id].managed ? 'GM' : 'noGM', out.join('  '));
}
