// Service (v5.16, card P1): the report's numbers, tips, the cold line, away time, and the heads' slammed asks. Only a shop that runs itself,
// after the tutorial, takes part. One second of play per tick, with the wall clock moving the same second.
import { COPY, MANAGER_COPY_KEY, SERVICE } from '../../../content/service';
import type { NeighborhoodId } from '../../../content/types';
import * as G from '../../game';
import { getFeature, withFeatures } from '..';
import { onServicePulse, quantise, reportView, service, slammedAsks, type ServicePulse } from '../service';

import { HOME_CITY } from '../../../content/cities/home';
import { HOME_BARKS } from '../../../content/cities/home/voice';
import { NONNA_TAKEOVER } from '../../../content/cities/home/fit';
import { MANAGERS } from '../../../content/cities/home/data';
const T0 = 1_800_000_000_000;
const withShop = (g: G.GameState, id: NeighborhoodId, patch: Partial<G.Shop>): G.GameState => ({
  ...g,
  shops: { ...g.shops, [id]: { ...g.shops[id], ...patch } },
});

/** Downtown after the tutorial, run by Nonna, with a kitchen of one level `lv`, `d` drivers and `t` seating. */
function shop(lv: number, d: number, t: number, patch: Partial<G.Shop> = {}): G.GameState {
  let g = G.newGame(T0);
  g = { ...g, seenScenes: [...g.seenScenes, NONNA_TAKEOVER.sceneId] };
  return withShop(g, 'downtown', { built: true, managed: true, prep: lv, ovens: lv, counter: lv, drivers: d, tables: t, ...patch });
}
/** Play `seconds` one second at a time, the clock moving with it. Returns the state and the clock. */
function play(g: G.GameState, seconds: number, from = T0): { g: G.GameState; now: number } {
  let now = from;
  for (let i = 0; i < seconds; i++) {
    now += 1000;
    g = G.playTick(g, 1, now);
  }
  return { g, now };
}
const only = <T>(fn: () => T): T => withFeatures([service], fn);
const view = (g: G.GameState, now = T0 + 1000) => reportView(g, 'downtown', now);

// the shops used below (checked by the first tests): wanted and kitchen in pies/s
const QUIET = () => shop(10, 1, 1); // wants 0.55, kitchen 3.85
const TIPPING = () => shop(10, 10, 1); // wants 2.8, kitchen 3.85
const SLOW = () => shop(5, 10, 1); // wants 2.8, kitchen 2.1: service 75%
const COLD = () => shop(5, 10, 10); // wants 4.15, kitchen 2.1: service 50%

describe('what is measured', () => {
  test('service is sold ÷ wanted in 5% steps rounded down, 1 when nothing is wanted', () => {
    expect(quantise(0.9)).toBe(0.9);
    expect(quantise(0.8999)).toBe(0.85);
    expect(quantise(0.9499)).toBe(0.9);
    expect(quantise(1)).toBe(1);
    only(() => {
      expect(view(SLOW()).service).toBe(0.75);
      expect(view(QUIET()).service).toBe(1);
    });
  });

  test('wanted, kitchen and sold per minute; the lamps and the floor', () => {
    only(() => {
      const v = view(SLOW());
      expect(v.perMin.wanted).toBeCloseTo(2.8 * 60, 6);
      expect(v.perMin.kitchen).toBeCloseTo(2.1 * 60, 6);
      expect(v.perMin.sold).toBeCloseTo(2.1 * 60, 6);
      // loads are sold ÷ the station's rate
      expect(v.loads.ovens).toBe(1);
      expect(v.loads.prep).toBe(0.75); // 2.1 / 2.7 = 0.777, down to 5%
      expect(v.loads.counter).toBe(0.6); // 2.1 / 3.3 = 0.636
      expect(v.lamps).toEqual({ prep: 'busy', ovens: 'slammed', counter: 'busy', floor: 'full' });
      expect(v.worst).toEqual({ kind: 'ovens', lamp: 'slammed' });
      expect(v.kitchenLimits).toBe(true);
    });
  });

  test('the floor is Quiet below 0.6 of the kitchen, Steady from there, Packed from 1.05', () => {
    only(() => {
      expect(view(QUIET()).lamps.floor).toBe('quiet');
      expect(view(QUIET()).worst).toEqual({ kind: 'floor', lamp: 'quiet' });
      expect(view(TIPPING()).lamps.floor).toBe('steady');
      expect(view(TIPPING()).worst).toBeNull();
      expect(view(SLOW()).lamps.floor).toBe('full');
    });
  });

  test('a station is Idle under 60% load, Busy from 60%, Slammed from 95%', () => {
    only(() => {
      const v = view(QUIET()); // sold 0.55 against 3.85 / 4.95 / 6.05
      expect(v.lamps.ovens).toBe('idle');
      expect(view(TIPPING()).lamps.ovens).toBe('busy'); // 2.8 / 3.85 = 0.727
    });
  });

  test('money walking out a minute = (wanted − sold) × the value per pizza × 60', () => {
    only(() => {
      const g = SLOW();
      const v = view(g);
      const perPie = G.valuePerPizza('downtown', g.shops.downtown, g.vehicle, G.featureMults(g, 'downtown', T0 + 1000));
      expect(v.lostPerMinute).toBeCloseTo((2.8 - 2.1) * perPie * 60, 6);
      expect(view(QUIET()).lostPerMinute).toBe(0);
    });
  });

  test("wanted keeps the other features demand multipliers, before this feature's own effect", () => {
    const doubling = { key: 'dbl', init: () => 0, migrate: () => 0, shopDemandMult: () => 2 };
    withFeatures([doubling, service], () => {
      const v = view(SLOW());
      expect(v.perMin.wanted).toBeCloseTo(5.6 * 60, 6);
      expect(v.service).toBe(0.35);
    });
  });
});

describe('the cost of the hook (U17)', () => {
  test('the other features demand hooks run once per state, however often the shop is read', () => {
    let calls = 0;
    const counting = { key: 'cnt', init: () => 0, migrate: () => 0, shopDemandMult: () => (calls++, 1) };
    withFeatures([counting, service], () => {
      const g = TIPPING();
      for (let i = 0; i < 5; i++) {
        view(g);
        slammedAsks(g, 'downtown');
      }
      expect(calls).toBe(1);
      // a different state is a different flow
      view(withShop(g, 'downtown', { drivers: 3 }));
      expect(calls).toBe(2);
    });
  });

  test('one featureMults pass runs the other features demand hooks once, and prices the tip from what they gave (U17)', () => {
    let calls = 0;
    const counting = { key: 'cnt', init: () => 0, migrate: () => 0, shopDemandMult: () => (calls++, 1) };
    withFeatures([counting, service], () => {
      const g = TIPPING();
      const fx = G.featureMults(g, 'downtown', T0 + 1000);
      expect(calls).toBe(1);
      expect(fx.value).toBe(view(g).state === 'tipping' ? SERVICE.tipMult : 1);
    });
  });
});

describe('who takes part', () => {
  test('a shop still tapped by hand, and a shop in the tutorial, show nothing new', () => {
    only(() => {
      expect(view(shop(5, 10, 1, { managed: false })).state).toBe('inactive');
      const tutorial = { ...SLOW(), seenScenes: [] };
      expect(view(tutorial).state).toBe('inactive');
      expect(G.shopEarnings(tutorial, 'downtown', T0)).toBeCloseTo(G.shopEarnings(withShop(tutorial, 'downtown', {}), 'downtown', T0), 9);
    });
  });
  test('three heads and no manager is a shop that runs itself', () => {
    only(() => expect(view(shop(5, 10, 1, { managed: false, heads: G.allHeads() })).state).not.toBe('inactive'));
  });
});

describe('tips', () => {
  test('service of 90% or more makes the pizzas worth 1.1 (once the app has ticked)', () => {
    only(() => {
      let { g, now } = play(TIPPING(), 3);
      expect(view(g, now).state).toBe('tipping');
      const tipped = G.shopEarnings(g, 'downtown', now);
      const plain = G.shopEarnings(shop(10, 10, 1), 'downtown', T0); // never ticked: no stamp, no tip
      expect(tipped / plain).toBeCloseTo(SERVICE.tipMult, 9);
      // an unticked game, or a clock far past the stamp, has none
      expect(view(TIPPING(), T0).state).toBe('normal');
      expect(G.shopEarnings(g, 'downtown', now + 60_000) / plain).toBeCloseTo(1, 9);
      ({ g, now } = play(SLOW(), 3));
      expect(view(g, now).state).toBe('normal');
    });
  });

  test('upgradeGain sees the tip an upgrade would earn', () => {
    only(() => {
      // ovens 6 -> 7: the kitchen goes from 2.45 to 2.8 against 2.8 wanted, service from 85% to 100%: the tip comes with it
      const { g, now } = play(shop(10, 10, 1, { ovens: 6 }), 3);
      expect(view(g, now).state).toBe('normal');
      const gain = G.upgradeGain({ ...g, lastSavedAt: now }, 'downtown', 'ovens')!;
      const plain = withFeatures([], () => G.upgradeGain(shop(10, 10, 1, { ovens: 6 }), 'downtown', 'ovens')!);
      expect(gain / plain).toBeCloseTo((2.8 * SERVICE.tipMult - 2.45) / (2.8 - 2.45), 6);
    });
  });
});

describe('the cold line', () => {
  test('service under 60% for 60 s of play in a row makes pizzas worth 0.9', () => {
    only(() => {
      let { g, now } = play(COLD(), 59);
      expect(view(g, now).state).not.toBe('cold');
      expect(view(g, now).coldIn).toBe(2); // the first tick only stamps the clock
      ({ g, now } = play(g, 2, now));
      expect(getFeature(g, service).shops.downtown.cold).toBe(true);
      const v = view(g, now);
      expect(v.state).toBe('cold');
      expect(v.queueShare).toBe(SERVICE.coldQueueShare);
      const cold = G.shopEarnings(g, 'downtown', now);
      const calm = G.shopEarnings(withShop(g, 'downtown', {}), 'downtown', now + 60_000); // a stale stamp: no penalty
      expect(cold / calm).toBeCloseTo(SERVICE.coldMult, 9);
    });
  });

  test('it cannot recover by itself, and ends when service is back at 60%', () => {
    only(() => {
      let { g, now } = play(COLD(), 120);
      expect(view(g, now).state).toBe('cold');
      expect(view(g, now).service).toBe(0.5); // still measured against demand before the penalty
      // a bigger kitchen: service 2.8 / 4.15 = 67%
      g = withShop(g, 'downtown', { prep: 8, ovens: 8, counter: 8 });
      expect(view(g, now).state).not.toBe('cold');
      ({ g, now } = play(g, 2, now));
      expect(getFeature(g, service).shops.downtown.cold).toBe(false);
      expect(getFeature(g, service).shops.downtown.below).toBe(0);
    });
  });

  test('a 45-second Game Day or a 30-second boat cannot trip it', () => {
    only(() => {
      let { g, now } = play(COLD(), 45);
      expect(getFeature(g, service).shops.downtown.cold).toBe(false);
      // service comes back for a moment: the count starts over
      g = withShop(g, 'downtown', { prep: 10, ovens: 10, counter: 10 });
      ({ g, now } = play(g, 1, now));
      expect(getFeature(g, service).shops.downtown.below).toBe(0);
      g = withShop(g, 'downtown', { prep: 5, ovens: 5, counter: 5 });
      ({ g, now } = play(g, 30, now));
      expect(getFeature(g, service).shops.downtown.cold).toBe(false);
    });
  });

  test('upgradeGain sees the recovery from a cold line', () => {
    only(() => {
      const { g, now } = play(COLD(), 70);
      expect(view(g, now).state).toBe('cold');
      const bigger = withShop(g, 'downtown', { prep: 8, ovens: 8, counter: 8 });
      // the hook ends the penalty at once for a state whose service is back at 60%
      expect(G.shopEarnings(bigger, 'downtown', now)).toBeGreaterThan(G.shopEarnings(g, 'downtown', now) * 1.1);
    });
  });
});

describe('away time', () => {
  test('no tip and no penalty while away, and the timers start again on return', () => {
    only(() => {
      let { g, now } = play(COLD(), 70);
      expect(view(g, now).state).toBe('cold');
      const back = G.applyOffline({ ...g, lastSavedAt: now }, now + 3_600_000).state;
      expect(getFeature(back, service).shops.downtown).toEqual({ below: 0, cold: false, tip: false, slam: { prep: 0, oven: 0, counter: 0 } });
      // what the shop earns while away is plain: the same as with no feature at all
      const away = G.offlineTick({ ...g, lastSavedAt: now }, 600, 1, now + 3_600_000).state.cash - g.cash;
      const plain = withFeatures([], () => G.offlineTick({ ...g, lastSavedAt: now }, 600, 1, now + 3_600_000).state.cash - g.cash);
      expect(away).toBeCloseTo(plain, 6);
    });
    only(() => {
      const { g, now } = play(TIPPING(), 3);
      const away = G.offlineTick({ ...g, lastSavedAt: now }, 600, 1, now + 3_600_000).state.cash - g.cash;
      const plain = withFeatures([], () => G.offlineTick({ ...g, lastSavedAt: now }, 600, 1, now + 3_600_000).state.cash - g.cash);
      expect(away).toBeCloseTo(plain, 6);
    });
  });

  test('a long gap between ticks (the app was in the background) starts the timer again', () => {
    only(() => {
      let { g, now } = play(COLD(), 51);
      expect(getFeature(g, service).shops.downtown.below).toBe(50);
      g = G.playTick(g, 1, now + 120_000);
      expect(getFeature(g, service).shops.downtown.below).toBe(0);
    });
  });

  test('old saves migrate to zero, and a saved cold flag does not come back', () => {
    const s = service.migrate({ at: 5, shops: { downtown: { below: 40, cold: true, tip: true, slam: { prep: 9, oven: 9, counter: 9 } } } }, T0, HOME_CITY);
    expect(s.at).toBe(0);
    expect(s.shops.downtown.cold).toBe(false);
    expect(s.shops.downtown.below).toBe(0);
    expect(service.migrate(undefined, T0, HOME_CITY).shops.uptown.below).toBe(0);
  });
});

describe('the pulse', () => {
  test('service-up when tipping starts and service-down when the line goes cold, never twice', () => {
    only(() => {
      const seen: ServicePulse[] = [];
      const off = onServicePulse((p) => seen.push(p));
      let { g, now } = play(SLOW(), 3);
      expect(seen).toEqual([]);
      g = withShop(g, 'downtown', { prep: 10, ovens: 10, counter: 10 });
      ({ g, now } = play(g, 3, now));
      expect(seen).toEqual([{ type: 'service-up', shopId: 'downtown' }]);
      g = withShop(g, 'downtown', { prep: 5, ovens: 5, counter: 5, tables: 10 });
      ({ g, now } = play(g, 65, now));
      expect(seen.map((p) => p.type)).toEqual(['service-up', 'service-down']);
      off();
    });
  });
});

describe('heads that ask for help', () => {
  const heads = () => shop(5, 10, 1, { managed: false, heads: G.allHeads() });
  test('a Slammed station asks after 20 s, in a shop with no manager', () => {
    only(() => {
      const { g: early } = play(heads(), 19);
      expect(slammedAsks(early, 'downtown')).toEqual([]);
      const { g } = play(heads(), 21);
      // the ovens are the slammed station at this level (load 100%)
      expect(slammedAsks(g, 'downtown')).toEqual([{ trigger: 'slammed', station: 'oven' }]);
      expect(slammedAsks({ ...g, shops: { ...g.shops, downtown: { ...g.shops.downtown, managed: true } } }, 'downtown')).toEqual([]);
    });
  });
});

describe('the copy', () => {
  test('every manager has the four strip lines, the shops name the managers the game has', () => {
    for (const id of Object.keys(MANAGERS) as NeighborhoodId[]) {
      const k = MANAGER_COPY_KEY[id];
      for (const s of ['kitchen', 'quiet', 'tipping', 'cold']) expect(COPY[`report.${k}.${s}` as keyof typeof COPY]).toBeTruthy();
    }
  });
});

describe('the slammed bark (step 6)', () => {
  test('18 lines, one per shop and station, after `attack` in the priority and ahead of the rest', () => {
    const { HEAD_BARKS } = jest.requireActual('../../../content/heads');
    const { HOME_BARKS: BARKS } = jest.requireActual('../../../content/cities/home/voice');
    for (const id of Object.keys(BARKS)) for (const st of ['prep', 'oven', 'counter']) expect(BARKS[id][st].slammed.length).toBeGreaterThan(5);
    expect(HEAD_BARKS.priority.slice(0, 2)).toEqual(['attack', 'slammed']);
  });
  test('a slammed ask speaks through the ordinary ask rules and loses to an attack', () => {
    const { nextBark, newBarkMem } = jest.requireActual('../heads');
    const { HOME_BARKS: BARKS } = jest.requireActual('../../../content/cities/home/voice');
    const r = nextBark(
      newBarkMem(),
      'downtown',
      [
        { trigger: 'milestone', station: 'prep' },
        { trigger: 'slammed', station: 'oven' },
      ],
      100,
      false,
      HOME_BARKS,
    );
    expect(r.bark.text).toBe(BARKS.downtown.oven.slammed);
    const a = nextBark(
      newBarkMem(),
      'downtown',
      [
        { trigger: 'slammed', station: 'oven' },
        { trigger: 'attack', station: 'prep', key: 'x' },
      ],
      100,
      false,
      HOME_BARKS,
    );
    expect(a.bark.trigger).toBe('attack');
  });
});
