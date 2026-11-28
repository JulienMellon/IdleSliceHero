import { CITIES, hoodIds } from '../../../content/cities';
import { RENO_SHOPS } from '../../../content/renovation';
import * as G from '../../../engine/game';
import { shopLayout } from '../shop-layout';
import { DEFS, decorOf, renoSpots } from '../renovation-art';
const lv = (fp: number, n: number): G.Shop => ({ ...G.newShop(true), footprint: fp, ovens: n, prep: n, counter: n, tables: n });
test('scratch', () => {
  const miss: Record<string, string[]> = {};
  for (const city of Object.values(CITIES))
    hoodIds(city).forEach((id, i) => {
      const set = RENO_SHOPS[i];
      if (['downtown', 'suburbs', 'waterfront'].includes(set)) return;
      for (let fp = 0; fp < city.fit.footprints.length; fp++)
        for (const n of [1, 30, 100]) {
          const { draw } = shopLayout(id, lv(fp, n), city);
          for (const vehicle of [0, 2, 3])
            for (const idle of [false, true]) {
              const spots = renoSpots(draw, set, id, vehicle, idle).map((s) => s.thing);
              for (const t of decorOf(set)) {
                if (idle && DEFS[`${set}/${t}`].mount === 'street') continue;
                if (!spots.includes(t)) (miss[`${set}/${t}`] ??= []).push(`${city.id}:${id} fp${fp} n${n} v${vehicle} idle${idle}`);
              }
            }
        }
    });
  console.log(
    Object.entries(miss)
      .map(([k, v]) => `${k}: ${v.length} e.g. ${v.slice(0, 3).join(' | ')}`)
      .join('\n'),
  );
});
