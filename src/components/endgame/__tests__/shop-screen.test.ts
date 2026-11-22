/// <reference types="jest" />
import * as fs from 'fs';
import * as path from 'path';

const read = (rel: string): string => fs.readFileSync(path.join(__dirname, '../../../', rel), 'utf8');

describe('the Shop screen and its chip, as wired (card U5)', () => {
  const shop = read('app/shop.tsx');
  const chip = read('components/endgame/diamond-chip.tsx');

  test("the chip is the coach's hud:store and carries the dot", () => {
    expect(chip).toContain("'hud:store'");
    expect(chip).toContain("useCoachTarget('hud:store')");
    expect(chip).toContain('shop-chip-dot');
  });

  test('the Boosters tab sells above the free shelf', () => {
    expect(shop.indexOf('<BoosterBuy />')).toBeGreaterThan(0);
    expect(shop.indexOf('<BoosterBuy />')).toBeLessThan(shop.indexOf('testID="booster-ad"'));
  });

  test('the route param opens the Store tab, the Shop says how it was opened, and no tab is locked', () => {
    expect(shop).toContain('tabFromParam(params.tab)');
    expect(shop).toContain('STORE_OPENED_EVENT');
    expect(shop).not.toContain('disabled={tab');
    expect(shop).not.toMatch(/tab-locked|tabLocked|tabsLocked/);
  });
});
