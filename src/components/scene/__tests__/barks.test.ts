/// <reference types="jest" />
// Head barks in the scene (v5.15, S1; D440): every bubble, at every station's badge, in every footprint, stays inside the shop's walls
// and the scene, and sits under the chip row, not over it. (The rules for when a head speaks are in features/__tests__/heads.test.ts.)
import { BARKS } from '../../../content/heads';
import { FOOTPRINTS, NEIGHBORHOODS } from '../../../content/tuning';
import { layout } from '../layout';
import { BUBBLE_AIR, CHIP_ROW_HALF, ROW_AIR, bubbleWalls, bubbleWidth, bubbleX } from '../moments';
import { SCENE_W } from '../projection';
import { badgeRowY, badgeXs } from '../stations';

const DS = [2, 2, 3, 3, 4];

describe('head barks stay inside the walls', () => {
  test('every line, under every badge, at every footprint', () => {
    for (let fp = 0; fp < FOOTPRINTS.length; fp++) {
      const lay = layout(fp, FOOTPRINTS[fp].ovenSlots, fp === 0 ? 2 : 3, 2, 8, DS[fp], 1);
      const walls = bubbleWalls(lay);
      const xs = badgeXs(lay);
      for (const n of NEIGHBORHOODS)
        for (const st of ['prep', 'oven', 'counter'] as const)
          for (const text of Object.values(BARKS[n.id][st])) {
            const w = bubbleWidth(text);
            const cx = bubbleX(xs[st], w, walls);
            expect(cx - w / 2).toBeGreaterThanOrEqual(walls.x0 + BUBBLE_AIR - 1e-9);
            expect(cx + w / 2).toBeLessThanOrEqual(walls.x1 - BUBBLE_AIR + 1e-9);
            expect(cx - w / 2).toBeGreaterThanOrEqual(0);
            expect(cx + w / 2).toBeLessThanOrEqual(SCENE_W);
          }
    }
  });
  test('the bubble hangs under the chip row (its top is the speech pill y - 14 - tail)', () => {
    const by = badgeRowY();
    const pillY = by + 44; // storefront.tsx: 4 under the hello's, so the tail clears the badge's pins (they reach by + 22.4)
    expect(pillY - 20).toBeGreaterThanOrEqual(by + 12 + 4 + 6.4 + 1.5); // the badge's radius, a pin's offset and radius, and air
    expect(pillY - 20).toBeGreaterThanOrEqual(by + CHIP_ROW_HALF + ROW_AIR);
  });
});
