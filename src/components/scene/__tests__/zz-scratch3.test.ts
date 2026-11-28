import { CITIES } from '../../../content/cities';
import * as G from '../../../engine/game';
import { shopLayout } from '../shop-layout';
import { P, FRONT_TOP } from '../projection';
import { doorRect, matRect } from '../ladder';
import { doorwaySignRect } from '../stations';
const lv = (fp: number, n: number): G.Shop => ({ ...G.newShop(true), footprint: fp, ovens: n, prep: n, counter: n, tables: n });
test('scratch', () => {
  const city = CITIES.home;
  for (const fp of [0, 4]) {
    const { room: lay } = shopLayout('uptown', lv(fp, 1), city);
    const { L, R, door } = lay;
    console.log(
      fp,
      JSON.stringify({
        frame: lay.frame,
        fx0: P(L - 6, 0, FRONT_TOP)[0],
        fx1: P(R + 6, 0, FRONT_TOP)[0],
        fTop: P(0, 0, FRONT_TOP)[1],
        fBot: P(0, 0, FRONT_TOP - 20)[1],
        jax: P(door.x0 - 8, 0)[0],
        jbx: P(door.x0, 0)[0],
        dx1: P(door.x1, 0)[0],
        kbx: P(R - 8, 0)[0],
        pR: P(R + 6, 0)[0],
        lTop: P(0, 0, 122)[1],
        lBot: P(0, 0, 108)[1],
        gTop: P(0, 0, 196)[1],
        jay: P(0, 0, 0)[1],
        doorR: doorRect(lay),
        sign: doorwaySignRect(lay),
        dcx: P(door.cx, 0)[0],
      }),
    );
  }
});
