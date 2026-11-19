/// <reference types="jest" />
// Card R5c, step 5: in a Boston game no string the founder-naming models return says "Nonna" (C146): the City-map pin, the shop tab, the rewards.
// "Nonna's Plus" is a product name (the store's own table) and the home city's day-30 visitor is Nonna Rosa: neither is checked here.
import { cityOf } from '../../content/cities';
import { claimDelta } from '../../engine/offers';
import * as G from '../../engine/game';
import { money } from '../../engine/format';
import { deltaText, doubleLabel } from '../store/ad-model';
import { lotView, piesToGo } from '../city-model';
import { chestRows, dailyRows, giftHeader, giftTiles, rewardsHud, weeklyRows } from '../rewards-model';

const NOW = new Date(2026, 10, 11, 12, 0, 0).getTime();

/** Every string anywhere in a value the models return. */
function strings(v: unknown, out: string[] = []): string[] {
  if (typeof v === 'string') out.push(v);
  else if (Array.isArray(v)) for (const x of v) strings(x, out);
  else if (v && typeof v === 'object') for (const x of Object.values(v)) strings(x, out);
  return out;
}

describe('a Boston game never hears "Nonna" from the models that name the founder', () => {
  const boston = cityOf({ city: 'boston' });
  const g = G.newGame(NOW, boston.id);
  const founder = boston.managers[G.firstHood(boston)].name;

  test('every lot of the City map and the shop tabs, in every state of the takeover', () => {
    const states = [g, { ...g, shops: { ...g.shops, [G.firstHood(boston)]: { ...g.shops[G.firstHood(boston)], sold: 1e6 } } }];
    for (const s of states)
      for (const n of boston.neighbourhoods) {
        const v = lotView(s, n);
        expect(strings(v).join('|')).not.toMatch(/Nonna/);
        if (v.kind === 'founder') expect(v.founder).toBe(founder);
      }
    expect(lotView(g, boston.neighbourhoods[1]).pin).toMatch(new RegExp(`^${founder} in `));
    expect(piesToGo(30, boston.id)).not.toMatch(/Nonna/);
  });

  test('the rewards: the locked gift, the tiles, the HUD and the task rows', () => {
    const header = giftHeader(g, NOW);
    expect(header.caption).toBe(`Unlocks when ${founder} takes over`);
    // not giftTiles: its day-30 prize is named in content/rewards.ts ("Nonna’s Golden Oven", the home visitor), outside this card
    const all = [header, giftTiles(g, NOW).map(({ name: _name, ...tile }) => tile), rewardsHud(g, NOW), dailyRows(g), weeklyRows(g), chestRows(g)];
    expect(strings(all).join('|')).not.toMatch(/Nonna/);
  });

  test('the ad and claim lines', () => {
    const d = claimDelta(g, { ...g, cash: g.cash + 500, rewards: { ...g.rewards, diamonds: g.rewards.diamonds + 5 } });
    expect(strings([doubleLabel(d, money), deltaText(d, money)]).join('|')).not.toMatch(/Nonna/);
  });

  test('home still says Nonna (the same keys, the home founder)', () => {
    const home = G.newGame(NOW);
    expect(giftHeader(home, NOW).caption).toBe('Unlocks when Nonna takes over');
    const v = lotView(home, cityOf(home).neighbourhoods[1]);
    expect(v.pin).toMatch(/^Nonna in /);
    expect(v.founder).toBe('Nonna');
  });
});
