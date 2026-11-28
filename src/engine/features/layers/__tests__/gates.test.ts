// The layer gates (v5.25, card E9, D493): the rival at Suburbs two stars, boats at Downtown two stars and a built Waterfront, the cameo at Suburbs one star,
// Game Day at the Suburbs unlock. One rule in gates.ts, read by every layer; a city past the first has none.
import { CAMEO_GATE } from '../../../../content/rewards';
import { LAYER_GATES } from '../../../../content/layers';
import { cityOf, hoodIds } from '../../../../content/cities';
import { BOSTON_CITY } from '../../../../content/cities/boston';
import * as G from '../../../game';
import { boatsLock, boatsOpen, cameoOpen, gateHood, gateMet, gated, rivalGateMet } from '../gates';
import { withStars } from './gate-helpers';

const NOW = new Date(2026, 10, 9, 9, 0, 0).getTime();

describe('the gates are the home city’s positions and stars', () => {
  it('names Suburbs (position 1) and Downtown (position 0)', () => {
    const g = G.newGame(NOW);
    expect(gateHood(g, LAYER_GATES.rival)).toBe('suburbs');
    expect(gateHood(g, CAMEO_GATE)).toBe('suburbs');
    expect(gateHood(g, LAYER_GATES.boats)).toBe('downtown');
    expect(LAYER_GATES.rival.stars).toBe(2);
    expect(LAYER_GATES.boats.stars).toBe(2);
    expect(CAMEO_GATE.stars).toBe(1);
  });

  it('the rival: Suburbs built and at two stars', () => {
    const g = G.newGame(NOW);
    expect(rivalGateMet(g)).toBe(false);
    expect(rivalGateMet(withStars(g, 1, 1))).toBe(false);
    expect(rivalGateMet(withStars(g, 1, 2))).toBe(true);
    expect(rivalGateMet(withStars(g, 1, 3))).toBe(true);
    // stars of another shop do not count
    expect(rivalGateMet(withStars(g, 0, 3))).toBe(false);
  });

  it('the cameo: Suburbs at one star', () => {
    const g = G.newGame(NOW);
    expect(cameoOpen(g)).toBe(false);
    expect(cameoOpen(withStars(g, 1, 0))).toBe(false);
    expect(cameoOpen(withStars(g, 1, 1))).toBe(true);
    expect(cameoOpen(withStars(g, 0, 3))).toBe(false);
  });

  it('boats: Downtown at two stars and the Waterfront shop built, whichever comes later', () => {
    const g = G.newGame(NOW);
    const built = (s: G.GameState): G.GameState => ({ ...s, shops: { ...s.shops, waterfront: { ...s.shops.waterfront, built: true } } });
    expect(boatsOpen(g)).toBe(false);
    expect(boatsOpen(built(g))).toBe(false);
    expect(boatsOpen(built(withStars(g, 0, 1)))).toBe(false);
    expect(boatsOpen(withStars(g, 0, 2))).toBe(false);
    expect(boatsOpen(built(withStars(g, 0, 2)))).toBe(true);
    expect(boatsLock(g)).toBe('Build this pizzeria first');
    expect(boatsLock(built(g))).toBe('Earn 2 stars in Downtown first');
    expect(boatsLock(built(withStars(g, 0, 2)))).toBeNull();
  });
});

describe('a city past the first has no gates', () => {
  it('Boston opens its layers on their own shop, as before', () => {
    const g = G.newGame(NOW, BOSTON_CITY.id);
    expect(gated(g)).toBe(false);
    expect(cityOf(g)).toBe(BOSTON_CITY);
    expect(rivalGateMet(g)).toBe(true);
    expect(cameoOpen(g)).toBe(true);
    expect(gateMet(g, LAYER_GATES.boats)).toBe(true);
    const dorchester = hoodIds(BOSTON_CITY)[5];
    expect(boatsOpen({ ...g, shops: { ...g.shops, [dorchester]: { ...g.shops[dorchester], built: true } } })).toBe(true);
    expect(boatsOpen(g)).toBe(false);
  });
});
