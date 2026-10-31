/// <reference types="jest" />
import { NEIGHBORHOODS, NONNA_TAKEOVER } from '../../content/tuning';
import * as G from '../../engine/game';
import { lotView } from '../city-model';

const n = (id: string) => NEIGHBORHOODS.find((x) => x.id === id)!;
const withSold = (sold: number, seen: string[] = []): G.GameState => {
  const s = G.newGame(0);
  return { ...s, seenScenes: seen, shops: { ...s.shops, downtown: { ...s.shops.downtown, sold } } };
};

describe('city lots held back by Nonna (D305)', () => {
  test('Suburbs, next in line but locked, is a padlock with the countdown, not "Build $"', () => {
    const s = withSold(40);
    const v = lotView(s, n('suburbs'));
    expect(v.kind).toBe('nonna');
    expect(v.locked).toBe(true);
    expect(v.dim).toBe(true);
    expect(v.tappable).toBe(false);
    expect(v.rowRight).toBeNull(); // the padlock, not a price
    expect(v.pin).not.toMatch(/Build/);
    expect(v.pin).toBe(`Nonna in ${G.nonnaPizzasLeft(s)}`);
  });
  test('the row uses the very countdown the refusal toast shows', () => {
    const s = withSold(40);
    expect(lotView(s, n('suburbs')).rowSub).toBe(G.nonnaCountdownText(s));
    const refusal = G.buildShop({ ...s, cash: 1e9 }, 'suburbs');
    expect(refusal.ok).toBe(false);
    if (!refusal.ok) expect(refusal.reason).toBe(lotView(s, n('suburbs')).rowSub);
  });
  test('once the countdown is due the pin says soon; once Nonna has taken over it is a live Build', () => {
    expect(lotView(withSold(5000), n('suburbs')).pin).toBe('Nonna soon');
    const v = lotView(withSold(5000, [NONNA_TAKEOVER.sceneId]), n('suburbs'));
    expect(v.kind).toBe('buildable');
    expect(v.pin).toBe('Build $450');
    expect(v.rowRight).toBe('Build $450');
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
