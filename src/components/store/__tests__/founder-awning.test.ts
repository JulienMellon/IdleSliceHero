/// <reference types="jest" />
import { GRANTS, FOUNDER_COSMETIC } from '../../../services/grants';
import { cosmeticPart } from '../../../content/endgame';
import { LOOKS } from '../../scene/identity';
import { AWNING_FOUNDER, AWNING_GOLD, dressedLook, dressOf, isDressed, NO_DRESS } from '../../scene/cosmetics';

describe('the founder awning (the Starter Pack\'s cosmetic)', () => {
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
    expect(dressOf(['awning-gold']).awningFounder).toBeUndefined();
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
});
