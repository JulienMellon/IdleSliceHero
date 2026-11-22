/// <reference types="jest" />
import * as G from '../../engine/game';
import { money, pizzasLeft } from '../../engine/format';
import { cityOf } from '../../content/cities';
import { LOCKED_LOT_TAP, lotView, piesToGo } from '../city-model';

import { NONNA_TAKEOVER } from '../../content/cities/home/fit';
import { NEIGHBORHOODS } from '../../content/cities/home/data';
const n = (id: string) => NEIGHBORHOODS.find((x) => x.id === id)!;
const withSold = (sold: number, seen: string[] = []): G.GameState => {
  const s = G.newGame(0);
  return { ...s, seenScenes: seen, shops: { ...s.shops, downtown: { ...s.shops.downtown, sold } } };
};

describe('city lots held back by Nonna (D305)', () => {
  test('Suburbs, next in line but locked, is a padlock with the countdown, not "Build $"', () => {
    const s = withSold(40);
    const v = lotView(s, n('suburbs'));
    expect(v.kind).toBe('founder');
    expect(v.locked).toBe(true);
    expect(v.dim).toBe(true);
    expect(v.tappable).toBe(false);
    expect(v.rowRight).toBeNull(); // the padlock, not a price
    expect(v.pin).not.toMatch(/Build/);
    expect(v.pin).toBe(`Nonna in ${pizzasLeft(G.founderPizzasLeft(s))}`);
  });
  test('the row uses the very countdown the refusal toast shows', () => {
    const s = withSold(40);
    expect(lotView(s, n('suburbs')).rowSub).toBe(G.founderCountdownText(s));
    const refusal = G.buildShop({ ...s, cash: 1e9 }, 'suburbs');
    expect(refusal.ok).toBe(false);
    if (!refusal.ok) expect(refusal.reason).toBe(lotView(s, n('suburbs')).rowSub);
  });
  test('once the countdown is due the pin says soon; once Nonna has taken over it is a live Build', () => {
    expect(lotView(withSold(5000), n('suburbs')).pin).toBe('Nonna soon');
    const v = lotView(withSold(5000, [NONNA_TAKEOVER.sceneId]), n('suburbs'));
    expect(v.kind).toBe('buildable');
    expect(v.pin).toBe(`Build ${money(n('suburbs').buildCost)}`);
    expect(v.rowRight).toBe(`Build ${money(n('suburbs').buildCost)}`);
    expect(v.tappable).toBe(true);
    expect(v.dim).toBe(false);
  });
  test('later lots just wait for the one before; a built lot is a visit', () => {
    const s = withSold(0);
    const q = lotView(s, n('waterfront'));
    expect(q.kind).toBe('queued');
    expect(q.pin).toBe('???');
    expect(q.locked).toBe(true);
    expect(q.dim).toBe(false);
    expect(lotView(s, n('downtown')).kind).toBe('built');
  });
});

describe('C146: the pin names the own-city founder, and the tab gets its words without slicing', () => {
  test('home: "Nonna in 60" and "60 pies to go"', () => {
    const s = withSold(40);
    const left = G.founderPizzasLeft(s);
    const v = lotView(s, n('suburbs'));
    expect(v.pinsLeft).toBe(left);
    expect(v.founder).toBe('Nonna');
    expect(piesToGo(left)).toBe(`${pizzasLeft(left)} pies to go`);
    expect(piesToGo(1)).toBe('1 pie to go');
    expect(lotView(withSold(5000), n('suburbs')).pinsLeft).toBeNull();
  });
  test('Boston: the pin says Father Dom, never Nonna', () => {
    const city = cityOf({ city: 'boston' });
    const s = G.newGame(0, 'boston');
    const next = city.neighbourhoods[1];
    const v = lotView(s, next);
    expect(v.kind).toBe('founder');
    expect(v.pin).not.toMatch(/Nonna/);
    expect(v.pin).toMatch(/^Father Dom in /);
    expect(v.founder).toBe('Father Dom');
    expect(v.pinsLeft).toBeGreaterThan(0);
    expect(piesToGo(v.pinsLeft!, 'boston')).toMatch(/pies to go$/);
  });
});

describe('a lot held by the story of the shop before it (E1b)', () => {
  const upTo = (seen: string[]): G.GameState => {
    const s = G.newGame(0);
    const built = (id: string) => ({ ...s.shops[id as keyof typeof s.shops], built: true });
    return { ...s, seenScenes: [NONNA_TAKEOVER.sceneId, ...seen], shops: { ...s.shops, suburbs: built('suburbs') } };
  };
  test('is a padlock with the one line, and a tap that opens the Story tab', () => {
    const v = lotView(upTo(['suburbs-1']), n('waterfront'));
    expect(v.kind).toBe('chapter');
    expect(v.rowSub).toBe(G.buildLock(upTo(['suburbs-1']), 'waterfront'));
    expect(v.rowSub).toMatch(/^Finish Chapter \d+ first$/);
    expect(v.rowSub.length).toBeLessThanOrEqual(32);
    expect(v.pin).toBe('Chapter 1'); // D546: the current chapter, the one the Story tab shows
    expect(v.rowSub).toBe(`Finish ${v.pin} first`);
    expect(v.locked).toBe(true);
    expect(v.rowRight).toBeNull(); // the padlock, not a price
    expect(v.tappable).toBe(true); // the tap goes to the Story tab, not to a build
    expect(LOCKED_LOT_TAP).toEqual({ pathname: '/', params: { tasks: 'story' } });
  });
  test('is a live Build once the beat has played', () => {
    const v = lotView(upTo(['suburbs-1', 'suburbs-2', 'suburbs-3']), n('waterfront'));
    expect(v.kind).toBe('buildable');
    expect(v.tappable).toBe(true);
  });
  test("Nonna's countdown still comes first for the second lot", () => {
    expect(lotView(withSold(40), n('suburbs')).kind).toBe('founder');
  });
});
