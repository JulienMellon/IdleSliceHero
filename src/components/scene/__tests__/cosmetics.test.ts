/// <reference types="jest" />
// Cosmetics (v5.15, S1): every cosmetic the game gives out dresses something, a skin per cycle (repeating), the furniture memo sees what
// is worn, and the two things that are drawn on the wall (the neon sign, the plaque) clear everything the ladder budget guards.
import { cosmeticPart } from '../../../content/endgame';
import { FOOTPRINTS, NEIGHBORHOODS } from '../../../content/tuning';
import { WEEKLY_COSMETICS } from '../../../content/rewards';
import { AWNING_GOLD, MINT, NO_DRESS, SKINS, dressOf, dressedLook, isDressed, neonSpot, ovenPaint, ovenTrim, plaqueRect, skinNumber } from '../cosmetics';
import { furnitureDeps, furnitureInputs, type FurnitureSource } from '../furniture-inputs';
import { LOOKS } from '../identity';
import { candidates, fixedPeople, hits, obstacles } from '../ladder';
import { layout } from '../layout';
import { SCENE_W, P } from '../projection';
import { doorwaySignRect, staffFaces } from '../stations';

const DS = [2, 2, 3, 3, 4];
const shopAt = (fp: number, staff = 2) => layout(fp, FOOTPRINTS[fp].ovenSlots, fp === 0 ? 2 : 3, staff, 8, DS[fp], 1);

describe('what each cosmetic dresses', () => {
  const ALL = ['oven-gold', 'oven-woodfired', 'scooter-mint', 'neon-counter', 'awning-gold', 'plaque-master', 'storefront-skin-1'];
  test('every cosmetic the game gives out changes exactly one thing', () => {
    for (const id of [...ALL, ...WEEKLY_COSMETICS]) {
      const d = dressOf([id]);
      expect(isDressed(d)).toBe(true);
      const changed = (Object.keys(d) as (keyof typeof d)[]).filter((k) => d[k] !== NO_DRESS[k]);
      expect(changed).toHaveLength(1);
    }
  });
  test('nothing worn is the plain shop; unknown ids dress nothing', () => {
    expect(dressOf([])).toEqual(NO_DRESS);
    expect(isDressed(dressOf(['hat-of-doom', 'storefront-skin-x']))).toBe(false);
  });
  test('the parts the engine keeps apart dress apart things', () => {
    const parts = new Set(ALL.map(cosmeticPart));
    expect(parts.size).toBe(6);
    const all = dressOf(ALL);
    expect(all).toEqual({ ovenSkin: 2, awningGold: true, facadeSkin: 1, scooterMint: true, neon: true, plaque: true });
  });
  test('the two oven skins repaint with the Golden and the wood-fired grade, whatever grade was bought', () => {
    expect([0, 1, 2, 3, 4].map((g) => ovenPaint(g, 1))).toEqual([4, 4, 4, 4, 4]);
    expect([0, 1, 2, 3, 4].map((g) => ovenPaint(g, 2))).toEqual([2, 2, 2, 2, 2]);
    expect([0, 1, 2, 3, 4].map((g) => ovenPaint(g, 0))).toEqual([0, 1, 2, 3, 4]);
    expect(ovenTrim(0, 1)).toBe(1);
    expect(ovenTrim(2, 1)).toBe(2);
    expect(ovenTrim(0, 2)).toBe(0);
  });
});

describe('storefront skins: one per cycle, repeating', () => {
  test('at least two distinct skins, then the cycle numbers repeat them', () => {
    expect(new Set(SKINS.map((s) => s.pilaster)).size).toBeGreaterThanOrEqual(2);
    expect(new Set(SKINS.map((s) => s.fascia)).size).toBeGreaterThanOrEqual(2);
    const n = SKINS.length;
    for (let cycle = 1; cycle <= 3 * n; cycle++) expect(skinNumber(`storefront-skin-${cycle}`)).toBe(((cycle - 1) % n) + 1);
    expect(skinNumber('storefront-skin-1')).toBe(skinNumber(`storefront-skin-${n + 1}`));
    expect(skinNumber('storefront-skin-1')).not.toBe(skinNumber('storefront-skin-2'));
    expect(skinNumber('oven-gold')).toBe(0);
  });
  test('a skin repaints the facade and the fascia; the gold awning repaints the stripes and keeps the red piping', () => {
    const base = LOOKS.downtown;
    const plain = dressedLook(base, { facadeSkin: 0, awningGold: false });
    expect(plain).toEqual({ ...base, fascia: '#5E3A26' });
    const skinned = dressedLook(base, { facadeSkin: 2, awningGold: false });
    expect(skinned.pilaster).toBe(SKINS[1].pilaster);
    expect(skinned.fascia).toBe(SKINS[1].fascia);
    expect(skinned.awning).toEqual(base.awning);
    const gold = dressedLook(LOOKS.uptown, { facadeSkin: 0, awningGold: true });
    expect(gold.awning).toEqual([AWNING_GOLD.main, AWNING_GOLD.alt]);
    expect(gold.piping).toBe('#D9443A');
    expect(gold.pilaster).toBe(LOOKS.uptown.pilaster);
  });
  test('the mint is not the scooter yellow or the brand red', () => {
    expect(MINT.body).not.toBe('#FFC531');
    expect(MINT.body).not.toBe('#E8432E');
  });
});

describe('the furniture memo sees what is worn', () => {
  const base = (worn: string[]): FurnitureSource => ({
    id: 'suburbs',
    name: 'Suburbs',
    shop: { footprint: 1, prep: 24, counter: 1, drivers: 1, managed: true, line: { prepped: 0 }, decor: { plants: 1, tables: 1, signage: 1 } },
    running: true,
    rate: 4,
    vehicle: 1,
    worn,
  });
  const deps = (worn: string[]) => JSON.stringify(furnitureDeps(furnitureInputs(base(worn))));
  test('each cosmetic changes the deps; wearing nothing equals not passing worn', () => {
    const d0 = deps([]);
    for (const id of ['oven-gold', 'oven-woodfired', 'scooter-mint', 'neon-counter', 'awning-gold', 'plaque-master', 'storefront-skin-1', 'storefront-skin-2']) expect(deps([id])).not.toBe(d0);
    expect(deps(['oven-gold'])).not.toBe(deps(['oven-woodfired']));
    expect(JSON.stringify(furnitureDeps(furnitureInputs({ ...base([]), worn: undefined })))).toBe(d0);
  });
  test('a skin of the next cycle that looks the same does not rebuild (skin 4 is skin 1)', () => {
    expect(deps([`storefront-skin-${SKINS.length + 1}`])).toBe(deps(['storefront-skin-1']));
  });
  test('the deps list keeps its length', () => {
    expect(furnitureDeps(furnitureInputs(base([])))).toHaveLength(furnitureDeps(furnitureInputs(base(['oven-gold', 'neon-counter']))).length);
  });
});

describe('the neon sign (budget; G99)', () => {
  test('at every footprint and counter crew it is at least 40 x 14, over the register, inside the walls, under the badge band and over the cashiers’ faces', () => {
    for (let fp = 0; fp < FOOTPRINTS.length; fp++)
      for (const staff of [1, 2, 3]) {
        const lay = shopAt(fp, staff);
        const { cx, rect: r } = neonSpot(lay);
        expect(r.x1 - r.x0).toBeGreaterThanOrEqual(40);
        expect(r.y1 - r.y0).toBeGreaterThanOrEqual(14);
        // over the register (the first cashier's, 12 along), unless the wall stops it
        expect(Math.abs(cx - P(lay.staff[0] + 12, 70)[0])).toBeLessThan(0.01);
        expect(r.x0).toBeGreaterThanOrEqual(P(lay.L + 8, 0)[0]);
        expect(r.x1).toBeLessThanOrEqual(P(lay.R - 8, 0)[0]);
        expect(r.x1).toBeLessThanOrEqual(SCENE_W);
        const ob = obstacles(lay, 'downtown');
        for (const b of ob.all) expect(hits(r, b)).toBe(false);
        for (const f of staffFaces(lay)) expect(hits(r, f)).toBe(false);
        for (const p of fixedPeople(lay)) expect(hits(r, p.head)).toBe(false);
        // under the awning and the badge band (they end at 186)
        expect(r.y0).toBeGreaterThanOrEqual(190);
      }
  });
  test('the check can fail: the old slot (the ladder’s neon spot) was 38 x 13 and sat on the wall behind the menu board and window', () => {
    for (let fp = 1; fp < FOOTPRINTS.length; fp++) {
      const lay = shopAt(fp, 2);
      const slot = candidates(lay, { id: 'downtown', pins: 12, outside: true }).find((c) => c.id === 'neon')!;
      expect(slot.rect.x1 - slot.rect.x0).toBeLessThan(40);
      expect(slot.rect.y0).toBeLessThan(270); // on the wall, above the window's foot: the sign now hangs below the wall's gear
    }
  });
});

describe('the plaque (budget; D458)', () => {
  test('it is 34 x 22 on the brick header over the door, under the awning, off the glass, the PIZZA blade and the doorway plank', () => {
    for (let fp = 0; fp < FOOTPRINTS.length; fp++) {
      const lay = shopAt(fp);
      const r = plaqueRect(lay);
      expect(r.x1 - r.x0).toBe(34);
      expect(r.y1 - r.y0).toBe(22);
      expect(r.x0).toBeGreaterThanOrEqual(P(lay.door.x0 - 8, 0)[0]);
      expect(r.x1).toBeLessThanOrEqual(P(lay.R - 8, 0)[0]);
      expect(r.x1).toBeLessThanOrEqual(SCENE_W);
      expect(r.y0).toBeGreaterThanOrEqual(190);
      expect(r.y1).toBeLessThanOrEqual(P(0, 0, 196)[1]);
      expect(hits(r, doorwaySignRect(lay))).toBe(false);
      // the blade hangs at the header's mid-height + 14, 21 tall, when it has no room outside the wall
      const mid = (P(0, 0, 340 - 20)[1] + P(0, 0, 196)[1]) / 2;
      expect(r.y0).toBeGreaterThan(mid + 14 + 10.5);
      // the clock face (r 8 at mid - 6)
      expect(r.y0).toBeGreaterThan(mid - 6 + 8);
    }
  });
});
