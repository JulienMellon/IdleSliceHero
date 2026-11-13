/**
 * @jest-environment <rootDir>/src/engine/__tests__/tz-env.js
 */
// Victor's weekly counter-attack (v5.15): when it starts, the week roll (increase only, time zones included), the target, the
// challenge, the x0.8 while it is open, the win and the loss, and the week's end.
import { COUNTERATTACK } from '../../content/endgame';
import { NEIGHBORHOODS } from '../../content/tuning';
import type { NeighborhoodId } from '../../content/types';
import { getFeature } from '../features';
import { ackAttack, attackView, challengeTarget, counterattack, pickTarget, startChallenge, weekNumber } from '../features/counterattack';
import { recipes } from '../features/recipes';
import * as G from '../game';

const IDS = NEIGHBORHOODS.map((n) => n.id);
const at = (y: number, m: number, d: number, h = 0, mi = 0, s = 0) => new Date(y, m - 1, d, h, mi, s).getTime();
const state = (g: G.GameState) => getFeature(g, counterattack);
const withShop = (g: G.GameState, id: NeighborhoodId, patch: Partial<G.Shop>): G.GameState => ({ ...g, shops: { ...g.shops, [id]: { ...g.shops[id], ...patch } } });
const ok = (r: G.BuyResult): G.GameState => {
  if (!r.ok) throw new Error(r.reason);
  return r.state;
};
function inTZ<T>(tz: string, fn: () => T): T {
  const old = process.env.TZ;
  process.env.TZ = tz;
  try {
    return fn();
  } finally {
    if (old === undefined) delete process.env.TZ;
    else process.env.TZ = old;
  }
}
const NY = 'America/New_York';
const KIRI = 'Pacific/Kiritimati';

// Wed 2026-11-11 is when the finale plays; the first attack starts Mon 2026-11-16 00:00 local
const WED = at(2026, 11, 11, 12);
const MON = at(2026, 11, 16);
const WEEK = 7 * 86_400_000;

/** Every shop built and running, so each has a pizza rate. */
function city(finale = true): G.GameState {
  let g = G.newGame(WED);
  for (const id of IDS) g = withShop(g, id, { built: true, managed: true, heads: G.allHeads(), prep: 10, ovens: 10, counter: 10, tables: 10, drivers: 5 });
  return finale ? { ...g, seenScenes: ['uptown-4'] } : g;
}
const tick = (g: G.GameState, now: number, dt = 1) => G.playTick(g, dt, now);
/** An attack that is open this week. */
const attacked = (): G.GameState => tick(tick(city(), WED), MON);

describe('when it starts', () => {
  it('does nothing before the finale has been seen', () => {
    const g = city(false);
    expect(state(tick(g, MON))).toBe(state(g));
    expect(state(tick(g, MON))).toMatchObject({ armedWeek: 0, open: false });
  });

  it('starts at the first Monday 00:00 local after the finale, not before', () => {
    const armed = tick(city(), WED);
    expect(state(armed).armedWeek).toBe(weekNumber(MON));
    expect(state(armed).open).toBe(false);
    expect(state(tick(armed, MON - 1000)).open).toBe(false); // Sunday 23:59:59
    const monday = tick(armed, MON);
    expect(state(monday).open).toBe(true);
    expect(state(monday).target).not.toBeNull();
    expect(attackView(monday, MON).phase).toBe('open');
    expect(tick(armed, MON - 1000).x).toBe(armed.x);
  });

  it('a finale seen on a Sunday night still waits for Monday', () => {
    const sunday = at(2026, 11, 15, 23, 59);
    const armed = tick(city(), sunday);
    expect(state(tick(armed, sunday + 30_000)).open).toBe(false);
    expect(state(tick(armed, MON)).open).toBe(true);
  });

  it('a save from v5.14 (no feature state, finale already seen) arms on the first tick', () => {
    const raw = JSON.parse(JSON.stringify(city()));
    delete raw.x;
    const g = G.migrate(raw, WED);
    expect(state(g)).toMatchObject({ armedWeek: 0, open: false, defended: [] });
    const a = tick(g, WED);
    expect(state(a).armedWeek).toBe(weekNumber(MON));
    expect(state(tick(a, MON)).open).toBe(true);
  });
});

describe('the week roll', () => {
  it('rolls once per week, never within one', () => {
    const a = attacked();
    const t = state(a).target;
    for (const at_ of [MON + 3_600_000, MON + 3 * 86_400_000, MON + WEEK - 1000]) {
      const x = tick(a, at_);
      expect(x.x).toBe(a.x);
    }
    const next = tick(a, MON + WEEK);
    expect(state(next).open).toBe(true);
    expect(state(next).target).not.toBe(t);
  });

  it('a time-zone change rolls only when the week number goes up, never back', () => {
    const instant = Date.UTC(2026, 10, 15, 12, 0, 0); // Sunday 07:00 NY; Monday 02:00 Kiritimati
    const g = inTZ(NY, () => tick(tick(city(), WED), instant)); // armed for the Monday, seen week = this Sunday's
    expect(state(g).open).toBe(false);
    const there = inTZ(KIRI, () => tick(g, instant + 60_000)); // the key moved forward: a legitimate new week
    expect(state(there).open).toBe(true);
    const target = state(there).target;
    const back = inTZ(NY, () => tick(there, instant + 120_000)); // the key went backwards
    expect(back.x).toBe(there.x);
    const again = inTZ(KIRI, () => tick(back, instant + 180_000));
    expect(again.x).toBe(there.x);
    expect(state(again).target).toBe(target);
    // and back in NY, when its Monday really comes, nothing rolls a second time
    const monNY = inTZ(NY, () => tick(again, MON));
    expect(monNY.x).toBe(there.x);
    expect(state(inTZ(NY, () => tick(monNY, MON + WEEK))).target).not.toBe(target);
  });

  it('a week the app was closed for rolls once, on the next tick', () => {
    const a = attacked();
    const later = tick(a, MON + 5 * WEEK + 3_600_000);
    expect(state(later).seenWeek).toBe(weekNumber(MON) + 5);
    expect(state(later).open).toBe(true);
    expect(state(G.applyOffline({ ...a, lastSavedAt: MON }, MON + 8 * WEEK).state).seenWeek).toBe(weekNumber(MON) + 8);
  });
});

describe('the target', () => {
  it('is seeded by the week number and never repeats the previous target', () => {
    const g = city();
    let prev: NeighborhoodId | null = null;
    const seen = new Set<NeighborhoodId>();
    for (let w = 2900; w < 3100; w++) {
      const t = pickTarget(g, w, prev);
      expect(t).not.toBeNull();
      expect(t).not.toBe(prev);
      expect(pickTarget(g, w, prev)).toBe(t); // the same week and previous give the same shop
      seen.add(t!);
      prev = t;
    }
    expect(seen.size).toBe(IDS.length); // every shop gets its turn
  });

  it('rolls through the feature the same way, week after week', () => {
    let g = attacked();
    let prev = state(g).target;
    for (let i = 1; i <= 30; i++) {
      g = tick(g, MON + i * WEEK);
      expect(state(g).target).not.toBe(prev);
      prev = state(g).target;
    }
  });

  it('only a built shop can be hit', () => {
    let g = city();
    for (const id of ['university', 'industrial', 'uptown'] as const) g = withShop(g, id, { built: false });
    for (let w = 2900; w < 2960; w++) expect(['downtown', 'suburbs', 'waterfront']).toContain(pickTarget(g, w, null));
  });
});

describe('while it is open', () => {
  it("the target shop's value is x0.8 and no other shop's changes", () => {
    const a = attacked();
    const t = state(a).target!;
    const calm = { ...a, x: { ...a.x, counterattack: { ...state(a), open: false } } };
    const other = IDS.find((id) => id !== t)!;
    expect(G.shopEarnings(a, t, MON) / G.shopEarnings(calm, t, MON)).toBeCloseTo(COUNTERATTACK.valueMult, 9);
    expect(G.shopEarnings(a, other, MON)).toBe(G.shopEarnings(calm, other, MON));
  });
});

describe('the challenge', () => {
  it('asks for ceil(5 min x the shop rate x 1.25) pies', () => {
    const a = attacked();
    const t = state(a).target!;
    const rate = G.shopRate(a.shops[t], a.vehicle);
    expect(challengeTarget(a, t, MON)).toBe(Math.ceil(300 * rate * 1.25));
    const started = ok(startChallenge(a, MON));
    expect(state(started).challenge).toMatchObject({ target: Math.ceil(300 * rate * 1.25), left: 300, startSold: a.shops[t].sold });
    expect(attackView(started, MON)).toMatchObject({ phase: 'running', shopId: t, target: Math.ceil(300 * rate * 1.25), secondsLeft: 300 });
    // an upgrade made after the start does not move the goal
    expect(state(ok(startChallenge(withShop(a, t, { prep: 99, ovens: 99, counter: 99, tables: 99, drivers: 40 }), MON))).challenge!.target).toBeGreaterThan(state(started).challenge!.target);
  });

  it('cannot start without an attack or twice', () => {
    expect(startChallenge(city(), MON).ok).toBe(false);
    const started = ok(startChallenge(attacked(), MON));
    expect(startChallenge(started, MON).ok).toBe(false);
  });

  it('a win pays 30 min of boost-free citywide income, 15 diamonds, ends the attack and records the shop', () => {
    let g = ok(startChallenge(attacked(), MON));
    const t = state(g).target!;
    const need = state(g).challenge!.target;
    g = withShop(g, t, { sold: g.shops[t].sold + need });
    // a boost running now must not inflate the reward
    g = { ...g, rewards: { ...g.rewards, boosts: [{ mult: 2, until: MON + 3_600_000, source: 't' }], lastSeen: MON } };
    const calm = { ...g, x: { ...g.x, counterattack: { ...state(g), open: false } } };
    const expected = Math.floor(G.earningsPerSecond(calm) * 60 * COUNTERATTACK.rewardMinutes);
    const cash = g.cash;
    const won = tick(g, MON + 1000);
    expect(state(won)).toMatchObject({ open: false, challenge: null, defended: [t] });
    expect(won.rewards.diamonds).toBe(g.rewards.diamonds + COUNTERATTACK.rewardDiamonds);
    expect(won.cash - cash).toBeGreaterThanOrEqual(expected);
    expect(won.cash - cash).toBeLessThan(expected * 1.001 + 50); // plus what the kitchens sold in that second
    expect(state(won).news).toMatchObject({ kind: 'won', shopId: t, cash: expected, diamonds: 15 });
    expect(attackView(won, MON + 1000).phase).toBe('none');
    expect(state(ackAttack(won)).news).toBeNull();
    // the shop is back to full value: nothing but its recipe cards multiplies it
    expect(G.featureMults(won, t, MON + 1000).value).toBeGreaterThanOrEqual(1);
  });

  it('a win while an event runs is not inflated by it', () => {
    const fri = at(2026, 11, 13, 18);
    let g = tick(tick(city(), WED), MON);
    g = tick(g, fri); // the event is running
    expect(getFeature(g, { key: 'events' } as never)).toMatchObject({ id: 'friday-rush' });
    g = ok(startChallenge(g, fri));
    const t = state(g).target!;
    g = withShop(g, t, { sold: g.shops[t].sold + state(g).challenge!.target });
    const noEvent = tick({ ...g, x: { ...g.x, events: { id: null, at: 0 } } }, fri + 1000);
    const won = tick(g, fri + 1000);
    expect((state(won).news as { cash: number }).cash).toBe((state(noEvent).news as { cash: number }).cash);
  });

  it('time runs out: a loss, and no retry until 60 real minutes have passed', () => {
    const base = attacked();
    let g = ok(startChallenge(base, MON));
    const t = state(g).target!;
    g = withShop(g, t, { prep: 1, ovens: 1, counter: 1, managed: false, heads: G.noHeads() }); // sells nothing more
    for (let i = 0; i < 299; i++) g = tick(g, MON + 1000 * (i + 1));
    expect(state(g).challenge).not.toBeNull();
    const lost = tick(g, MON + 300_000);
    expect(state(lost)).toMatchObject({ challenge: null, open: true });
    expect(state(lost).news).toEqual({ kind: 'lost', shopId: t });
    expect(lost.rewards.diamonds).toBe(base.rewards.diamonds); // a loss pays nothing
    expect(attackView(lost, MON + 300_000)).toMatchObject({ phase: 'retry', retryIn: 3600 });
    expect(startChallenge(lost, MON + 300_000 + 59 * 60_000).ok).toBe(false);
    expect(attackView(lost, MON + 300_000 + 59 * 60_000).retryIn).toBe(60);
    const retry = ok(startChallenge(lost, MON + 300_000 + 3_600_000));
    expect(state(retry).challenge).not.toBeNull();
  });

  it('T85 a short absence keeps the challenge: the time away comes off its clock and the pies sold meanwhile do not count', () => {
    const g = ok(startChallenge(attacked(), MON));
    const t = state(g).target!;
    const a0 = state(g).challenge!;
    const away = G.applyOffline({ ...g, lastSavedAt: MON }, MON + 3_000).state;
    const c = state(away).challenge!;
    expect(c).not.toBeNull();
    expect(c.left).toBe(a0.left - 3);
    expect(c.target).toBe(a0.target);
    const sold = away.shops[t].sold - g.shops[t].sold;
    expect(c.startSold).toBe(a0.startSold + sold);
    expect(G.playTick(away, 0, MON + 3_000).shops[t].sold - c.startSold).toBe(0); // nothing counts yet
    expect(state(away).retryAt).toBe(0);
    expect(state(away).open).toBe(true);
  });

  it('T85 an absence longer than the clock lapses the challenge, with no cooldown and no loss', () => {
    const g = ok(startChallenge(attacked(), MON));
    const t = state(g).target!;
    const away = G.applyOffline({ ...g, lastSavedAt: MON }, MON + 2 * 3_600_000).state;
    expect(state(away).challenge).toBeNull();
    expect(state(away).open).toBe(true);
    expect(state(away).retryAt).toBe(0); // no penalty: the player wasn't there
    expect(state(away).news).toBeNull();
    expect(away.shops[t].sold).toBeGreaterThan(g.shops[t].sold);
    expect(startChallenge(away, MON + 2 * 3_600_000).ok).toBe(true);
  });

  it('an absence exactly as long as the clock lapses it', () => {
    const g = ok(startChallenge(attacked(), MON));
    expect(state(G.applyOffline({ ...g, lastSavedAt: MON }, MON + 300_000).state).challenge).toBeNull();
    expect(state(G.applyOffline({ ...g, lastSavedAt: MON }, MON + 299_000).state).challenge).not.toBeNull();
  });
});

describe("the week's end", () => {
  it('an attack nobody defended ends unpaid, with a note for the UI', () => {
    const a = attacked();
    const t = state(a).target!;
    const next = tick(a, MON + WEEK);
    expect(state(next).news).toEqual({ kind: 'expired', shopId: t });
    expect(next.rewards.diamonds).toBe(a.rewards.diamonds);
    expect(state(next).defended).toEqual([]);
  });

  it('a running challenge ends with its week', () => {
    const g = ok(startChallenge(attacked(), MON + WEEK - 60_000));
    expect(state(tick(g, MON + WEEK)).challenge).toBeNull();
  });

  it('attackView counts down to Monday 00:00 local', () => {
    expect(attackView(attacked(), MON + 3_600_000).weekEndsIn).toBe(WEEK / 1000 - 3600);
  });
});

describe('saving', () => {
  it('state survives a JSON round trip; a running challenge keeps its clock', () => {
    const g = tick(ok(startChallenge(attacked(), MON)), MON + 1000, 5);
    const back = G.migrate(JSON.parse(JSON.stringify(g)), MON + 2000);
    expect(state(back)).toEqual({ ...state(g), news: null });
  });

  it('junk loads as a fresh state', () => {
    expect(counterattack.migrate('junk', 0)).toEqual(counterattack.init(0));
    expect(counterattack.migrate({ target: 'nowhere', open: true, defended: ['uptown', 'x'] }, 0)).toMatchObject({ target: null, open: false, defended: ['uptown'] });
  });
});

describe('recipe card 4 follows a defence', () => {
  it('the defended shop gets its fourth card', () => {
    let g = ok(startChallenge(attacked(), MON));
    const t = state(g).target!;
    g = tick(withShop(g, t, { sold: g.shops[t].sold + state(g).challenge!.target }), MON + 1000);
    expect(getFeature(g, recipes).owned).toContain(`recipe.${t}.4`);
  });
});
