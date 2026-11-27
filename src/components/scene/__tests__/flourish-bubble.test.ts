/// <reference types="jest" />
// The set flourish's bubble (card S5, D580): hung under the counter badge, it must leave the menu board uncovered in every city, neighbourhood, footprint and plan, with the longest line.
import { CITIES, hoodIds } from '../../../content/cities';
import { HOME_COPY } from '../../../content/copy';
import { SETS } from '../../../content/catalog';
import * as G from '../../../engine/game';
import { MANAGERS } from '../../../content/cities/home/data';
import { menuRect, hits } from '../ladder';
import { bubbleWalls, bubbleWidth, bubbleX } from '../moments';
import { FLOURISH_BUBBLE_DROP, flourishBubbleRect, flourishLine } from '../set-flourish';
import { shopLayout } from '../shop-layout';
import { badgeRowY, badgeXs } from '../stations';

const shopAt = (footprint: number): G.Shop => ({ ...G.newShop(true), footprint, ovens: 100, prep: 100, counter: 100, tables: 100 });
const longest = SETS.map((s) =>
  flourishLine(
    Object.values(MANAGERS)
      .map((m) => m.name)
      .sort((a, b) => b.length - a.length)[0],
    HOME_COPY[`set.${s.id}.done`] ?? '',
  ),
).sort((a, b) => b.length - a.length)[0];

describe('the flourish bubble clears the menu board', () => {
  test('there is a line to measure', () => {
    expect(longest.length).toBeGreaterThan(30);
  });
  for (const city of Object.values(CITIES))
    for (const id of hoodIds(city))
      for (let fp = 0; fp < city.fit.footprints.length; fp++) {
        test(`${city.id} ${id} footprint ${fp}`, () => {
          const { draw: lay } = shopLayout(id, shopAt(fp), city);
          const menu = menuRect(lay);
          const r = flourishBubbleRect(longest, badgeXs(lay).counter, badgeRowY(), bubbleWalls(lay), menu);
          expect(r.y0).toBeGreaterThanOrEqual(badgeRowY() + 44 + FLOURISH_BUBBLE_DROP - 24);
          if (menu) expect(hits(r, menu)).toBe(false);
          // and inside the walls
          const w = bubbleWidth(longest);
          const px = bubbleX(badgeXs(lay).counter, w, bubbleWalls(lay));
          expect(r.x0).toBeCloseTo(px - w / 2);
        });
      }
});
