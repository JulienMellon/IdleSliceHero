/// <reference types="jest" />
// v5.18 (T2): the franchise sheet's numbers are the engine's, the two confirmations come before the franchise, the map lot and the city list
// say the right things, and a Boston game with its finale seen has no franchise to offer (no Chicago pack yet).
import { HOME_CITY } from '../../../content/cities/home';
import { finaleId, newGame, TUTORIAL_DONE, type GameState } from '../../../engine/game';
import { franchise, franchiseGain } from '../../../engine/features/franchise';
import { advance, cityRows, lotLabel, momentView, retreat, sheetView, starsSummary, times } from '../franchise-model';
import { seenCount } from '../scrapbook-view';

const NOW = new Date(2026, 10, 11, 12).getTime();
const HOME = HOME_CITY.neighbourhoods.map((n) => n.id);

function cleared(): GameState {
  let g = newGame(NOW);
  for (const id of HOME) g = { ...g, shops: { ...g.shops, [id]: { ...g.shops[id], built: true, managed: true } } };
  return { ...g, cash: 5e9, totalEarned: 2.79e15, cityComplete: true, tutorial: TUTORIAL_DONE, seenScenes: ['downtown-1', finaleId(HOME[HOME.length - 1])] };
}

describe('the confirm sheet', () => {
  it('is for a cleared city only, and its Stars and multiplier are what the franchise gives', () => {
    expect(sheetView(newGame(NOW))).toBeNull();
    const g = cleared();
    const s = sheetView(g)!;
    const gain = franchiseGain(g);
    expect(s.to).toBe('Boston');
    expect(s.starsLine).toContain(`+${gain.stars} Franchise Stars`);
    expect(s.multiplierLine).toContain(times(gain.multiplierAfter));
    expect(franchise(g, NOW + 1000).city).toBe('boston');
  });
  it('says what is kept and what is given up, and asks twice', () => {
    const s = sheetView(cleared())!;
    expect(s.keep.join(' ')).toMatch(/Diamonds/);
    expect(s.keep.join(' ')).toMatch(/Scrapbook/);
    expect(s.giveUp.join(' ')).toMatch(/cash/);
    expect(s.giveUp.join(' ')).toMatch(/All 6 pizzerias/);
    expect(s.warning).toMatch(/cannot be undone/);
    expect([advance('ask'), advance('sure'), advance('moment')]).toEqual(['sure', 'moment', 'commit']);
    expect([retreat('ask'), retreat('sure'), retreat('moment')]).toEqual([null, 'ask', 'moment']);
  });
  it('has a moment that names the city left and the one gone to, and a map lot that says Franchise', () => {
    const g = cleared();
    expect(momentView(g)!.title).toBe('Port Marinara is franchised');
    expect(momentView(g)!.button).toBe('On to Boston');
    expect(lotLabel(g)).toEqual(['Franchise', 'Boston']);
    expect(lotLabel(newGame(NOW))).toBeNull();
  });
});

describe('in Boston', () => {
  it('lists Port Marinara as an earlier city with a Scrapbook, and offers no franchise (no next pack)', () => {
    const b = franchise(cleared(), NOW + 1000);
    expect(cityRows(b)).toEqual([
      { id: 'home', name: 'Port Marinara', current: false, past: true },
      { id: 'boston', name: 'Boston', current: true, past: false },
    ]);
    expect(starsSummary(b)).toMatch(/Franchise Stars/);
    const done = { ...b, seenScenes: [...b.seenScenes, 'dorchester-4'] };
    expect(sheetView(done)).toBeNull();
    expect(lotLabel(done)).toBeNull();
  });
  it('a home game lists one city and no stars line', () => {
    expect(cityRows(newGame(NOW)).length).toBe(1);
    expect(starsSummary(newGame(NOW))).toBeNull();
  });
  it('counts a city\'s own seen scenes in its Scrapbook header', () => {
    expect(seenCount(['downtown-1', 'north-end-1'], HOME_CITY.scenes)).toBe(`Stories 1/${HOME_CITY.scenes.length}`);
  });
});
