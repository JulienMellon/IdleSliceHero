/// <reference types="jest" />
import { newGame } from '../../../engine/game';
import { BOSTON_LAYER_COPY } from '../../../content/cities/boston/copy';
import { BOSTON_CITY } from '../../../content/cities/boston';
import { builtHood, hoodOf } from '../city-layers';
import { dressed, isDressed } from '../city-dress';
import { gameDayBanner, gameDayChipShown, gameDayChipText } from '../suburbs/gameday-model';
import { harbourChip, rackCard, tierName } from '../waterfront/boats-model';
import { chipText } from '../uptown/stars-model';
import { shiftRows, whistle } from '../industrial/shift-model';
import { jamLabel } from '../industrial/jam-model';
import { zoneCells } from '../university/zones-model';
import { rivalCard } from '../rival/rival-model';
import { rivalLine } from '../layer-text';
import { gameDaySheet, boatSheet } from '../sheet-model';
import type { RivalView } from '../../../engine/features/layers/rival';

const boston = () => newGame(0, 'boston');
const home = () => newGame(0);

describe('the layers read the current city', () => {
  test('each layer runs in the shop the city says (Boston: Southie, Back Bay, Fenway, Cambridge, Dorchester)', () => {
    const b = boston();
    expect(hoodOf(b, 'stars')).toBe('southie');
    expect(hoodOf(b, 'menu')).toBe('back-bay');
    expect(hoodOf(b, 'gameDay')).toBe('fenway');
    expect(hoodOf(b, 'shifts')).toBe('cambridge');
    expect(hoodOf(b, 'boats')).toBe('dorchester');
    const h = home();
    expect(hoodOf(h, 'gameDay')).toBe('suburbs');
    expect(hoodOf(h, 'stars')).toBe('uptown');
  });

  test('a layer is drawn only once its shop is built', () => {
    const b = boston();
    expect(builtHood(b, 'gameDay')).toBeNull();
    const built = { ...b, shops: { ...b.shops, fenway: { ...b.shops.fenway, built: true } } };
    expect(builtHood(built, 'gameDay')).toBe('fenway');
    expect(builtHood(built, 'stars')).toBeNull();
  });

  test('the Game Day chip follows the city’s shop', () => {
    const v = { active: true, rush: false } as Parameters<typeof gameDayChipShown>[0];
    expect(gameDayChipShown(v, 'fenway', 'fenway')).toBe(true);
    expect(gameDayChipShown(v, 'suburbs', 'fenway')).toBe(false);
    expect(gameDayChipShown(v, 'suburbs')).toBe(true);
  });
});

describe('Boston’s layers speak the script’s words', () => {
  const view = { active: true, rush: true, left: 31, nextIn: 400 } as Parameters<typeof gameDayChipText>[0];
  test('Fenway: the game-day banner and rush chip', () => {
    expect(gameDayBanner(view, 'boston')).toBe(BOSTON_LAYER_COPY['layer.fenway.gameday.banner']);
    expect(gameDayChipText(view, 'boston')).toBe(`${BOSTON_LAYER_COPY['layer.fenway.gameday.chip']} 0:31`);
    expect(gameDayBanner(view)).toBe('Game Day! Fill every seat!');
    expect(gameDayChipText({ ...view, rush: false }, 'boston')).toBe('Game Day 6:40');
  });

  test('Dorchester: boats are supper orders and the rack is the pantry shelf', () => {
    const v = { active: true, boat: false, nextIn: 125, rackTier: 2, rackCapacity: 40, rackPrice: 5, rackPies: 3, left: 0 } as Parameters<typeof rackCard>[0];
    const chip = harbourChip(v, { live: false, maxed: false, nextIn: 0 } as Parameters<typeof harbourChip>[1], 'dorchester', 'boston', 'dorchester');
    expect(chip?.text).toBe('Next order 2:05');
    expect(rackCard(v, 'boston').title).toBe(BOSTON_LAYER_COPY['layer.dorchester.shelf.title']);
    expect(tierName(2, 'boston')).toBe('Wide Shelf');
    expect(tierName(2)).toBe('Trawler Rack');
    const sheet = boatSheet(boston(), 0);
    expect(sheet.title).toBe(BOSTON_LAYER_COPY['layer.dorchester.orders.title']);
    expect(sheet.body).toContain(BOSTON_LAYER_COPY['layer.dorchester.shelf.hint']);
    expect(sheet.body).not.toMatch(/boat|Pier|Marisol/i);
    expect(gameDaySheet(boston(), 0).body).not.toMatch(/Mudhens/);
  });

  test('Southie: the rating is "How local is it?"', () => {
    expect(chipText(1, 'boston')).toBe('Shipped In');
    expect(chipText(5, 'boston')).toBe('Kayla Local');
    expect(chipText(4)).toBe('Rating 4★');
  });

  test('Cambridge: lab hours and the exploding oven', () => {
    expect(shiftRows('day', [{ id: 'day', demand: 1, value: 1 }, { id: 'swing', demand: 1, value: 1 }, { id: 'night', demand: 1, value: 2 }], 'boston').map((r) => r.name)).toEqual(['Morning Lab', 'Afternoon Lab', 'Night Lab']);
    expect(whistle('night', 'boston')?.text).toBe('Whistle! Night Lab is on');
    expect(jamLabel({ jammed: true, autoFixIn: null }, 'boston')).toBe(BOSTON_LAYER_COPY['layer.cambridge.breakdown.banner']);
    expect(jamLabel({ jammed: true, autoFixIn: null })).toBe('Oven jammed! Tap the wrench.');
  });

  test('Back Bay: the zones are its own streets', () => {
    const cells = zoneCells({ drones: false, zones: [{ id: 'dorms', open: true, share: 50, tripSeconds: 6, distance: 1 }] } as unknown as Parameters<typeof zoneCells>[0], 'boston');
    expect(cells[0].name).toBe('Brownstone Row');
  });

  test('a line a city does not dress keeps its home text', () => {
    expect(dressed('boston', 'layer.suburbs.gameday.chip', 'home')).toBe('home');
    expect(dressed(undefined, 'layer.suburbs.gameday.banner', 'home')).toBe('home');
    expect(isDressed('boston', 'upgrade.waterfront.rack.name')).toBe(true);
    expect(isDressed('home', 'upgrade.waterfront.rack.name')).toBe(false);
  });
});

describe('the rival card in Boston', () => {
  const view = { open: true, phase: 'available', target: 120, progress: 0, secondsLeft: 300, retryIn: 0, valueMult: 0.8, won: false } as unknown as RivalView;
  test('every Boston neighbourhood has a rival card, opened by Trish Vance and answered by its own character', () => {
    for (const n of BOSTON_CITY.neighbourhoods) {
      const offer = rivalCard(view, n.id, null, BOSTON_CITY);
      expect(offer.face).toBe('offer');
      expect(offer.who).toBe('trish-vance');
      expect(offer.speaker).toBe('Trish');
      expect(offer.line.length).toBeGreaterThan(10);
      expect(offer.title).toContain('120');
      const won = rivalCard({ ...view, open: false, won: true } as RivalView, n.id, 'won', BOSTON_CITY);
      expect(won.who).not.toBe('trish-vance');
      expect(won.speaker).toBe(BOSTON_CITY.managers[n.id].name);
      expect(won.line.length).toBeGreaterThan(10);
    }
    expect(rivalLine('southie', 'open', {}, 'boston')).toMatch(/MegaSlice/);
  });
});
