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
import { doorwaySignRect } from '../stations';

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
    shop: { footprint: 1, prep: 24, managed: true, line: { prepped: 0 }, decor: { plants: 1, tables: 1, signage: 1 } },
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

describe('the neon sign (budget)', () => {
  test('at every footprint, every neighbourhood and every counter crew it has its slot, clear of badges, doorway, menu, window, ovens, props and faces', () => {
    for (let fp = 0; fp < FOOTPRINTS.length; fp++)
      for (const staff of [1, 2, 3])
        for (const n of NEIGHBORHOODS) {
          const lay = shopAt(fp, staff);
          const spot = neonSpot(lay, n.id);
          expect(spot).not.toBeNull();
          const r = spot!.rect;
          const ob = obstacles(lay, n.id);
          for (const b of [...ob.all, ...ob.wall]) expect(hits(r, b)).toBe(false);
          // every other ladder prop at every step
          for (const c of candidates(lay, { id: n.id, pins: 12, outside: true })) if (c.id !== 'neon') expect(hits(r, c.rect)).toBe(false);
          for (const p of fixedPeople(lay)) expect(hits(r, p.head)).toBe(false);
          // inside the scene, and under the badge band (the awning's valance ends at 186)
          expect(r.x0).toBeGreaterThanOrEqual(0);
          expect(r.x1).toBeLessThanOrEqual(SCENE_W);
          expect(r.y0).toBeGreaterThanOrEqual(190);
        }
  });
});

describe('the plaque (budget)', () => {
  test('it sits on the right pilaster, by the door, inside the scene, off the doorway plank and the door', () => {
    for (let fp = 0; fp < FOOTPRINTS.length; fp++) {
      const lay = shopAt(fp);
      const r = plaqueRect(lay);
      expect(r.x0).toBeGreaterThanOrEqual(P(lay.R - 8, 0)[0]);
      expect(r.x1).toBeLessThanOrEqual(P(lay.R + 6, 0)[0]);
      expect(r.x1).toBeLessThanOrEqual(SCENE_W);
      expect(hits(r, doorwaySignRect(lay))).toBe(false);
      // below the doorway's lintel: nothing of the window or the hanging sign is behind it
      expect(r.y0).toBeGreaterThan(doorwaySignRect(lay).y1);
      expect(r.x0).toBeGreaterThanOrEqual(P(lay.door.x1, 0)[0]);
    }
  });
});
