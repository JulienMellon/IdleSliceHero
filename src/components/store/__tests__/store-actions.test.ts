// The store's U3 actions on the real game store: what a claim leaves for the sheet, the double, a grant, the offline 2x, the shelf's booster.
jest.mock('@react-native-async-storage/async-storage', () => {
  const mem: Record<string, string> = {};
  return {
    __esModule: true,
    default: {
      getItem: async (k: string) => mem[k] ?? null,
      setItem: async (k: string, v: string) => void (mem[k] = v),
      removeItem: async (k: string) => void delete mem[k],
    },
  };
});

jest.useFakeTimers();

import { HOME_SCENES } from '../../../content/scenes/home';
import * as G from '../../../engine/game';
import { dayKey, refreshRewards } from '../../../engine/rewards';
import { GRANTS } from '../../../services/grants';
import { useGame } from '../../../store/game-store';
import { analytics } from '../../../services';
import { setBannerOpen } from '../../endgame/banner-state';
import { adOffering, boosterAdOffer, READY_CHECK_MS } from '../ad-model';
import * as fs from 'fs';
import * as path from 'path';

import { NONNA_TAKEOVER } from '../../../content/cities/home/fit';
import { hoodIds } from '../../../content/cities';
import { HOME_CITY } from '../../../content/cities/home';
function fresh(): G.GameState {
  const now = Date.now();
  const s = G.newGame(now);
  const shops = { ...s.shops, downtown: { ...s.shops.downtown, prep: 22, ovens: 20, counter: 18, drivers: 14, managed: true } };
  return refreshRewards({ ...s, shops, seenScenes: [NONNA_TAKEOVER.sceneId], cash: 1000, totalEarned: 15000, tutorial: G.TUTORIAL_DONE }, now);
}
const done = (g: G.GameState, i = 0): G.GameState => ({
  ...g,
  rewards: { ...g.rewards, daily: g.rewards.daily.map((t, k) => (k === i ? { ...t, target: 0 } : t)) },
});
const st = () => useGame.getState();

beforeEach(() => {
  useGame.setState({
    game: fresh(),
    loaded: true,
    titleDone: true,
    offline: null,
    claimed: null,
    plus: false,
    prefs: { starterOffered: false, boosterAdDay: '', adGrants: [] },
    toast: null,
  });
});

describe('a claim and its double', () => {
  test('a daily claim leaves what it paid for the sheet; doubling pays it again, once', () => {
    useGame.setState({ game: done(st().game) });
    const before = st().game.cash;
    expect(st().claimDaily(0)).toBe(true);
    const c = st().claimed!;
    expect(c.kind).toBe('daily');
    expect(c.doubled).toBe(false);
    const paid = st().game.cash - before;
    expect(paid).toBeGreaterThan(0);
    expect(c.delta.cash).toBeCloseTo(paid, 6);
    expect(st().doubleClaim()).toBe(true);
    expect(st().game.cash - before).toBeCloseTo(2 * paid, 6);
    expect(st().claimed!.doubled).toBe(true);
    // a second double is refused
    expect(st().doubleClaim()).toBe(false);
    expect(st().game.cash - before).toBeCloseTo(2 * paid, 6);
  });
  test("a Nonna's Plus owner is paid double at once, with no prompt (D504)", () => {
    useGame.setState({ game: done(st().game), plus: true });
    const before = st().game.cash;
    expect(st().claimDaily(0)).toBe(true);
    const c = st().claimed!;
    expect(c.doubled).toBe(true);
    expect(st().game.cash - before).toBeCloseTo(2 * c.delta.cash, 6);
  });
  test('a refused claim leaves no sheet; dismissing clears it; a new claim replaces the old', () => {
    expect(st().claimDaily(0)).toBe(false);
    expect(st().claimed).toBeNull();
    useGame.setState({ game: done(done(st().game, 0), 1) });
    st().claimDaily(0);
    const first = st().claimed!;
    st().claimDaily(1);
    expect(st().claimed!.at).toBeGreaterThanOrEqual(first.at);
    st().dismissClaim();
    expect(st().claimed).toBeNull();
    expect(st().doubleClaim()).toBe(false);
  });
});

describe('a paid-out grant', () => {
  test('the Starter Pack lands in the game; Plus sets the flag', () => {
    const d0 = st().game.rewards.diamonds;
    st().receiveGrant(GRANTS.starter_pack);
    expect(st().game.rewards.diamonds).toBe(d0 + 400);
    expect(st().game.rewards.cosmetics).toContain('awning-founder');
    expect(st().game.rewards.boosts.some((b) => b.mult === 2 && b.source === 'purchase')).toBe(true);
    expect(st().plus).toBe(false);
    st().receiveGrant(GRANTS.nonnas_plus);
    expect(st().plus).toBe(true);
  });
});

describe('the shelf booster', () => {
  test('one a day: the booster is added, today is marked, the offer closes', () => {
    const n = st().game.rewards.boosters.length;
    expect(boosterAdOffer(st().game, Date.now(), st().prefs.boosterAdDay)).toBe(true);
    expect(st().freeBooster()).toBe(true);
    expect(st().game.rewards.boosters).toHaveLength(n + 1);
    expect(st().prefs.boosterAdDay).toBe(dayKey(Date.now()));
    expect(boosterAdOffer(st().game, Date.now(), st().prefs.boosterAdDay)).toBe(false);
  });
});

describe('the daily swap', () => {
  test("swaps one row and uses the day's swap", () => {
    const kinds = st().game.rewards.daily.map((t) => t.kind);
    expect(st().rerollDaily(0)).toBe(true);
    expect(st().game.rewards.rerollUsed).toBe(true);
    expect(st().game.rewards.daily[0].kind).not.toBe(kinds[0]);
    expect(st().rerollDaily(1)).toBe(false);
  });
});

describe('2x offline earnings', () => {
  const summary = (boost: number) => ({
    seconds: 3600,
    capped: false,
    awaySeconds: 3600,
    earned: 100,
    byShop: [{ name: 'Downtown', earned: 100, managed: true, headsOnly: false, pies: 10 }],
    idle: [],
    boost,
  });
  test('doubles the held-back total once', () => {
    useGame.setState({ offline: summary(1) });
    expect(st().doubleOffline()).toBe(true);
    expect(st().offline!.earned).toBe(200);
    expect(st().offline!.byShop[0].earned).toBe(200);
    expect(st().offline!.doubled).toBe(true);
    expect(st().doubleOffline()).toBe(false);
    expect(st().offline!.earned).toBe(200);
  });
  test('replaces a boost: a 1.5x window becomes 2x, a 2x window gets nothing', () => {
    useGame.setState({ offline: summary(1.5) });
    st().doubleOffline();
    expect(st().offline!.earned).toBeCloseTo(133.333, 2);
    useGame.setState({ offline: summary(2) });
    expect(st().doubleOffline()).toBe(false);
    expect(st().offline!.earned).toBe(100);
  });
  test('collecting pays the doubled total into cash and lifetime earnings', () => {
    const g = st().game;
    useGame.setState({ offline: summary(1), game: { ...g, cash: g.cash - 100, totalEarned: g.totalEarned - 100 } });
    const cash0 = st().game.cash;
    st().doubleOffline();
    st().dismissOffline();
    expect(st().game.cash - cash0).toBeCloseTo(200, 6);
    expect(st().offline).toBeNull();
  });
});

describe("the Starter Pack's intro (card E6)", () => {
  test('the Shop opening on the Starter step marks the intro as run; reaching step 16 does not', () => {
    const g = fresh();
    useGame.setState({ game: { ...g, tutorial: 15 } });
    useGame.setState({ game: { ...st().game, tutorial: 16 } });
    expect(st().prefs.starterOffered).toBe(false);
    useGame.setState({ game: { ...st().game, tutorial: 17 } });
    expect(st().prefs.starterOffered).toBe(true);
  });
  test('marking it offered is saved with the prefs', () => {
    st().markStarterOffered();
    expect(st().prefs.starterOffered).toBe(true);
  });
});

describe('analytics events (card N1)', () => {
  let track: jest.SpyInstance;
  beforeEach(() => {
    track = jest.spyOn(analytics, 'track').mockImplementation(() => {});
  });
  afterEach(() => track.mockRestore());

  test('shop_built is sent when a build succeeds, and not when it is refused', () => {
    const g = fresh();
    useGame.setState({ game: { ...g, cash: 0 } });
    expect(st().build('suburbs')).toBe(false);
    expect(track).not.toHaveBeenCalledWith('shop_built', expect.anything());
    useGame.setState({ game: { ...g, cash: 1e15, shops: { ...g.shops, suburbs: { ...g.shops.suburbs, built: false } } } });
    const id = hoodIds(HOME_CITY).find((i) => !st().game.shops[i].built && G.buildLock(st().game, i) === null);
    expect(id).toBeDefined();
    expect(st().build(id!)).toBe(true);
    expect(track).toHaveBeenCalledWith('shop_built', { shop: id });
  });

  test('scene_seen is sent when a scene ends, not when one is replayed', () => {
    const scene = { id: 'downtown-1' } as never;
    useGame.setState({ playing: { scene, replay: true } });
    st().finishScene();
    expect(track).not.toHaveBeenCalledWith('scene_seen', expect.anything());
    useGame.setState({ playing: { scene: { ...(scene as object), id: 'downtown-2', trigger: { kind: 'start' } } as never, replay: false } });
    st().finishScene();
    expect(track).toHaveBeenCalledWith('scene_seen', { scene: 'downtown-2' });
  });

  test('ad_offered is for a player who would watch an ad: an ad ready and no Plus', () => {
    expect(adOffering(false, true)).toBe(true);
    expect(adOffering(false, false)).toBe(false);
    expect(adOffering(true, true)).toBe(false);
    const src = fs.readFileSync(path.join(__dirname, '..', 'ad-button.tsx'), 'utf8');
    expect(src).toMatch(/analytics\.track\(EVENTS\.adOffered/);
    expect(src).toMatch(/adOffering\(plus, ready\)/);
  });

  test('the ad button asks ads.ready() again on mount, every few seconds and after each ad, so it returns with no restart (N1 note)', () => {
    const src = fs.readFileSync(path.join(__dirname, '..', 'ad-button.tsx'), 'utf8');
    expect(READY_CHECK_MS).toBeLessThanOrEqual(5000);
    expect(src).toMatch(/setInterval\(\(\) => setReady\(ads\.ready\(placement\)\), READY_CHECK_MS\)/);
    expect(src.match(/setReady\(ads\.ready\(placement\)\)/g)!.length).toBeGreaterThanOrEqual(3);
  });

  test('the services index counts ad_started, ad_completed and iap_purchased: the callers do not (C128)', () => {
    for (const f of ['ad-button.tsx', 'ad-model.ts', 'use-purchase.ts']) {
      const src = fs.readFileSync(path.join(__dirname, '..', f), 'utf8');
      expect(src).not.toMatch(/EVENTS\.(adStarted|adCompleted|iapPurchased)/);
    }
  });

  test('iap_viewed is sent by the Store tab; the Starter Pack pop-up is gone', () => {
    const tab = fs.readFileSync(path.join(__dirname, '..', 'store-tab.tsx'), 'utf8');
    expect(tab).toMatch(/EVENTS\.iapViewed, \{ surface: 'store_tab' \}/);
    expect(fs.existsSync(path.join(__dirname, '..', 'starter-sheet.tsx'))).toBe(false);
    expect(fs.readFileSync(path.join(__dirname, '..', '..', 'slots.tsx'), 'utf8')).not.toMatch(/starter-sheet|StarterSheet/);
  });
});

describe("an order offer's wait holds while something ahead of it hides it", () => {
  const withOffer = (attack: boolean): G.GameState => {
    const g = fresh();
    const x = attack
      ? { ...g.x, counterattack: { armedWeek: 1, seenWeek: 1, target: 'downtown', open: true, defended: [], challenge: null, retryAt: 0, news: null } }
      : g.x;
    return {
      ...g,
      x,
      shops: { ...g.shops, suburbs: { ...g.shops.suburbs, built: true } }, // every scene seen: none is left to open and cover the game
      seenScenes: HOME_SCENES.map((sc) => sc.id),
      order: { ...g.order, offer: { hood: 'suburbs', target: 40, left: 45, variant: 0 } },
    };
  };
  beforeEach(() => useGame.setState({ playing: null }));
  afterEach(() => setBannerOpen(false));

  test('behind the open attack banner the 45 s do not run down; in front they do', () => {
    useGame.setState({ game: withOffer(true) });
    setBannerOpen(true);
    st().tick(1);
    expect(st().game.order.offer!.left).toBe(45);
    // the banner collapses to a badge: the offer is visible again and its wait runs
    setBannerOpen(false);
    st().tick(1);
    expect(st().game.order.offer!.left).toBeLessThan(45);
    // no attack at all: it runs
    useGame.setState({ game: withOffer(false) });
    st().tick(1);
    expect(st().game.order.offer!.left).toBeLessThan(45);
  });
});
