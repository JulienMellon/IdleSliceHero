import { HOME_SCENES } from '../../content/scenes/home';
import { PERKS, PIER9_BID, STORY_PACING } from '../../content/tuning';
import type { NeighborhoodId } from '../../content/types';
import { pickScene } from '../cutscene-input';
import * as G from '../game';

const scene = (id: string) => HOME_SCENES.find((s) => s.id === id)!;
const withShop = (s: G.GameState, id: NeighborhoodId, patch: Partial<G.Shop>): G.GameState => ({ ...s, shops: { ...s.shops, [id]: { ...s.shops[id], ...patch } } });
const seenUpTo = (ids: string[], playSeconds = 0, sceneAt: Record<string, number> = {}): G.GameState => ({ ...G.newGame(0), seenScenes: ids, playSeconds, sceneAt });
const LATE = 1e9; // ms: long after any kitchen tap

describe('story pacing (v3.7)', () => {
  it('the first scene after a launch or return plays straight away', () => {
    const s = withShop(seenUpTo(['downtown-1'], 10), 'downtown', { sold: 20 });
    expect(pickScene(s, HOME_SCENES, LATE, 0, false, null)?.id).toBe('downtown-2');
  });
  it('after a scene, the next waits for 90 s of play', () => {
    const s = withShop(seenUpTo(['downtown-1'], 100), 'downtown', { sold: 20 });
    expect(pickScene(s, HOME_SCENES, LATE, 0, false, 100 - 30)).toBeNull();
    expect(pickScene(s, HOME_SCENES, LATE, 0, false, 100 - STORY_PACING.gapSeconds)?.id).toBe('downtown-2');
  });
  it('a scene the player caused (a new pizzeria, the Pier 9 bid) is never held back', () => {
    const s = withShop(seenUpTo(['downtown-1', 'downtown-2', 'downtown-3', 'downtown-4'], 100), 'suburbs', { built: true });
    expect(pickScene(s, HOME_SCENES, LATE, 0, false, 99)?.id).toBe('suburbs-1');
  });
  it('beat 4 waits 300 s of play after beat 3 (Downtown: 120 s)', () => {
    const sub = withShop(seenUpTo(['suburbs-1', 'suburbs-2', 'suburbs-3', 'downtown-1', 'downtown-2', 'downtown-3', 'downtown-4'], 1000, { 'suburbs-3': 800 }), 'suburbs', { built: true, sold: 9000 });
    expect(pickScene(sub, HOME_SCENES, LATE, 0, false, null)).toBeNull(); // 200 s since beat 3
    expect(pickScene({ ...sub, playSeconds: 1100 }, HOME_SCENES, LATE, 0, false, null)?.id).toBe('suburbs-4');
    const dt = withShop(seenUpTo(['downtown-1', 'downtown-2', 'downtown-3'], 500, { 'downtown-3': 400 }), 'downtown', { sold: 200 });
    expect(pickScene(dt, HOME_SCENES, LATE, 0, false, null)).toBeNull(); // 100 s
    expect(pickScene({ ...dt, playSeconds: 520 }, HOME_SCENES, LATE, 0, false, null)?.id).toBe('downtown-4');
  });
  it('downtown-3 comes at 45 pizzas', () => {
    expect(scene('downtown-3').trigger).toMatchObject({ count: 45 });
  });
  it('play time only grows while playing, not offline', () => {
    const s = G.newGame(0);
    expect(G.playTick(s, 2).playSeconds).toBe(2);
    expect(G.applyOffline({ ...s, playSeconds: 7, lastSavedAt: 0 }, 3600_000).state.playSeconds).toBe(7);
  });
  it('a scene records the play time it was seen at', () => {
    const s = { ...G.newGame(0), playSeconds: 42 };
    expect(G.markSceneSeen(s, scene('downtown-1')).sceneAt['downtown-1']).toBe(42);
  });
});

describe('save migration v2 → v3', () => {
  it('adds play time and scene times, and grants perks for finales already seen', () => {
    const old = { ...JSON.parse(JSON.stringify(G.newGame(0))), saveVersion: 2, playSeconds: undefined, sceneAt: undefined, seenScenes: ['suburbs-4', 'waterfront-4'] };
    const m = G.migrate(old, 0);
    expect(G.SAVE_VERSION).toBe(3);
    expect(m.playSeconds).toBe(0);
    expect(m.sceneAt).toEqual({});
    expect(m.shops.suburbs.perk).toBe(true);
    expect(m.shops.waterfront.perk).toBe(true);
    expect(m.shops.university.perk).toBe(false);
  });
});

describe('neighbourhood perks (v3.7)', () => {
  const managed = (id: NeighborhoodId, perk: boolean) => withShop(G.newGame(0), id, { built: true, managed: true, prep: 40, ovens: 40, counter: 40, drivers: 1, tables: 40, perk });
  it('each perk is defined for its own neighbourhood only', () => {
    expect(Object.keys(PERKS).sort()).toEqual(['industrial', 'suburbs', 'university', 'uptown', 'waterfront']);
  });
  it("Dale: Suburbs walk-ins pay 85% instead of 70%", () => {
    const a = G.shopEarnings(managed('suburbs', false), 'suburbs');
    const b = G.shopEarnings(managed('suburbs', true), 'suburbs');
    expect(b / a).toBeCloseTo(0.85 / 0.7, 1); // nearly all sales are walk-ins with one driver
  });
  it('Marisol: Waterfront prices +10%', () => {
    const a = G.shopEarnings(managed('waterfront', false), 'waterfront');
    expect(G.shopEarnings(managed('waterfront', true), 'waterfront') / a).toBeCloseTo(1.1, 6);
  });
  it('Priya: University driver upgrades cost 10% less', () => {
    const a = G.upgradeCostOf(managed('university', false), 'university', 'drivers')!;
    expect(G.upgradeCostOf(managed('university', true), 'university', 'drivers')).toBe(Math.ceil(a * 0.9));
  });
  it('Sal: Industrial earns 25% more while away', () => {
    const a = G.applyOffline({ ...managed('industrial', false), lastSavedAt: 0 }, 600_000);
    const b = G.applyOffline({ ...managed('industrial', true), lastSavedAt: 0 }, 600_000);
    expect(b.earned / a.earned).toBeCloseTo(1.25, 6);
  });
  it('Genevieve: each Uptown decor tier adds 6% instead of 4%', () => {
    const deco = (perk: boolean) => withShop(managed('uptown', perk), 'uptown', { decor: { plants: 3, flooring: 3, tables: 3, walls: 3, signage: 3 } });
    expect(G.shopEarnings(deco(true), 'uptown') / G.shopEarnings(deco(false), 'uptown')).toBeCloseTo((1 + 0.06 * 15) / (1 + 0.04 * 15), 6);
  });
  it('a perk flag on another shop changes nothing', () => {
    const a = G.shopEarnings(managed('downtown', false), 'downtown');
    expect(G.shopEarnings(managed('downtown', true), 'downtown')).toBe(a);
  });
  it('a finale scene grants its neighbourhood perk', () => {
    expect(G.markSceneSeen(G.newGame(0), scene('suburbs-4')).shops.suburbs.perk).toBe(true);
  });
});

describe('Pier 9 bid (v3.7)', () => {
  const ready = () => withShop({ ...seenUpTo(['waterfront-1', 'waterfront-2', 'waterfront-3']), cash: 3e6 }, 'waterfront', { built: true, managed: true, sold: PIER9_BID.unlockPizzas });
  it('costs $2.0M', () => expect(PIER9_BID.cost).toBe(2_000_000));
  it('opens after "For Sale" and 50,000 Waterfront pizzas', () => {
    expect(G.pier9Available(ready())).toBe(true);
    expect(G.pier9Available(withShop(ready(), 'waterfront', { sold: PIER9_BID.unlockPizzas - 1 }))).toBe(false);
    expect(G.pier9Available({ ...ready(), seenScenes: ['waterfront-1', 'waterfront-2'] })).toBe(false);
  });
  it('winning it spends the bid, grants the perk and plays the finale', () => {
    const r = G.bidPier9(ready());
    expect(r.ok).toBe(true);
    if (!r.ok) return;
    expect(r.state.cash).toBe(1e6);
    expect(r.state.shops.waterfront.perk).toBe(true);
    expect(G.pendingScenes(r.state, HOME_SCENES).map((x) => x.id)).toContain('waterfront-4');
    expect(G.bidPier9(r.state).ok).toBe(false);
  });
  it('the finale no longer plays from a pizza count alone', () => {
    const s = withShop(ready(), 'waterfront', { sold: 1e7 });
    expect(G.pendingScenes(s, HOME_SCENES).map((x) => x.id)).not.toContain('waterfront-4');
  });
});
