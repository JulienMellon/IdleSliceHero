/// <reference types="jest" />
import { GRANTS, FOUNDER_COSMETIC } from '../../../services/grants';
import { cosmeticPart } from '../../../content/endgame';
import * as G from '../../../engine/game';
import { grantCosmetic, unwear, wear } from '../../../engine/rewards';
import { cosmeticName } from '../../../content/rewards';
import { vanityViews } from '../../endgame/shop-model';
import { furnitureDeps, furnitureInputs } from '../../scene/furniture-inputs';
import { LOOKS } from '../../scene/identity';
import { AWNING_FOUNDER, AWNING_GOLD, dressedLook, dressOf, isDressed, NO_DRESS } from '../../scene/cosmetics';

describe("the founder awning (the Starter Pack's cosmetic)", () => {
  test('the grant names it, and it is an awning (it replaces the gold one)', () => {
    expect(GRANTS.starter_pack.cosmetic).toBe(FOUNDER_COSMETIC);
    expect(FOUNDER_COSMETIC).toBe('awning-founder');
    expect(cosmeticPart('awning-founder')).toBe(cosmeticPart('awning-gold'));
  });
  test('worn, it dresses the awning; nothing else changes and a plain shop stays plain', () => {
    const d = dressOf(['awning-founder']);
    expect(d.awningFounder).toBe(true);
    expect(isDressed(d)).toBe(true);
    expect(dressOf([])).toEqual(NO_DRESS);
    expect(dressOf(['awning-gold']).awningFounder).toBe(false);
  });
  test('the look is red and white stripes with a dark-red piping; the gold awning is unchanged', () => {
    const look = LOOKS.downtown;
    const founder = dressedLook(look, { facadeSkin: 0, awningGold: false, awningFounder: true });
    expect(founder.awning).toEqual([AWNING_FOUNDER.main, AWNING_FOUNDER.alt]);
    expect(founder.piping).toBe(AWNING_FOUNDER.piping);
    expect(AWNING_FOUNDER.main).toBe('#D9443A');
    const gold = dressedLook(look, { facadeSkin: 0, awningGold: true });
    expect(gold.awning).toEqual([AWNING_GOLD.main, AWNING_GOLD.alt]);
    expect(dressedLook(look, { facadeSkin: 0, awningGold: false }).awning).toEqual(look.awning);
  });

  test('worn, it reaches the FrontWall props (what storefront.tsx passes) and the look it draws', () => {
    const src = {
      id: 'downtown' as const,
      name: 'Main',
      shop: { footprint: 0, prep: 1, counter: 1, drivers: 0, managed: false, line: { prepped: 0 }, decor: { plants: 0, tables: 0, signage: 0 } },
      running: false,
      rate: 0,
      vehicle: 0,
      worn: [] as string[],
      first: true,
    };
    const off = furnitureInputs(src);
    const on = furnitureInputs({ ...src, worn: ['awning-founder'] });
    expect(off.awningFounder).toBeFalsy();
    expect(on.awningFounder).toBe(true);
    expect(furnitureDeps(on)).not.toEqual(furnitureDeps(off)); // the furniture rebuilds when it goes on
    const look = dressedLook(LOOKS[on.id], { facadeSkin: on.facadeSkin, awningGold: on.awningGold, awningFounder: !!on.awningFounder });
    expect(look.awning).toEqual([AWNING_FOUNDER.main, AWNING_FOUNDER.alt]);
  });
  test('it has a name', () => {
    expect(cosmeticName('awning-founder')).toBe('Founder awning');
  });
  test('the Shop Style list shows it once owned, with wear and take-off; not before', () => {
    const g0 = G.newGame(1_700_000_000_000);
    expect(vanityViews(g0).some((v) => v.id === 'awning-founder')).toBe(false);
    const owned: G.GameState = { ...g0, rewards: { ...g0.rewards, ...grantCosmetic(g0.rewards, 'awning-founder') } };
    const worn = vanityViews(owned).find((v) => v.id === 'awning-founder');
    expect(worn).toMatchObject({ name: 'Founder awning', state: 'worn', label: 'Worn', wearId: 'awning-founder', buyId: null });
    const off = vanityViews(unwear(owned, 'awning-founder')).find((v) => v.id === 'awning-founder');
    expect(off).toMatchObject({ state: 'owned', label: 'Wear', wearId: 'awning-founder' });
    expect(vanityViews(wear(unwear(owned, 'awning-founder'), 'awning-founder')).find((v) => v.id === 'awning-founder')?.state).toBe('worn');
  });
});
