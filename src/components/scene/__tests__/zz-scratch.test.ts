/// <reference types="jest" />
import * as G from '../../../engine/game';
import { cityOf } from '../../../content/cities';
import { batchOf, pileCount } from '../piles';

const gm = (s: G.GameState, patch: Partial<G.Shop>): G.GameState => ({
  ...s,
  shops: { ...s.shops, downtown: { ...s.shops.downtown, built: true, managed: true, heads: G.allHeads(), ...patch } },
});
test('scratch', () => {
  const out: string[] = [];
  const city = cityOf({});
  for (const [name, patch] of [
    ['balanced8', { prep: 8, ovens: 8, counter: 8, drivers: 4, tables: 4, footprint: 1 }],
    ['balanced-drivers-a', { prep: 10, ovens: 10, counter: 10, drivers: 10, tables: 10, footprint: 1 }],
    ['short-ovens', { prep: 20, ovens: 1, counter: 20, drivers: 10, tables: 1, footprint: 1 }],
    ['short-ovens10/5', { prep: 10, ovens: 5, counter: 10, drivers: 10, tables: 1, footprint: 1 }],
  ] as const) {
    let s = { ...gm(G.newGame(0), patch), vehicle: 0 } as G.GameState;
    const hist: Record<number, number> = {};
    let maxR = 0;
    for (let i = 0; i < 1000; i++) {
      s = G.lineTick(s, 0.2);
      if (i > 150) {
        const sh = s.shops.downtown;
        const rate = G.shopRate(sh, s.vehicle, city.fit);
        const batch = batchOf(G.tapBatch(sh), rate);
        const n = pileCount(sh.line.prepped, batch);
        hist[n] = (hist[n] ?? 0) + 1;
        maxR = Math.max(maxR, sh.line.prepped / batch);
      }
    }
    out.push(`${name} ${JSON.stringify(hist)} maxRatio ${maxR.toFixed(2)}`);
  }
  console.log(out.join('\n'));
});
