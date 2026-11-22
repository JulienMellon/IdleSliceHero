// Service (v5.16, card P1): the report's numbers, tips, the cold line, away time, and the heads' slammed asks. Only a shop that runs itself,
// after the tutorial, takes part. One second of play per tick, with the wall clock moving the same second.
import { COPY, MANAGER_COPY_KEY, SERVICE } from '../../../content/service';
import type { NeighborhoodId } from '../../../content/types';
import * as G from '../../game';
import { getFeature, withFeatures } from '..';
import { capacityAfter, missedOf, onServicePulse, quantise, reportActive, reportView, service, symptomAsks, type ServicePulse } from '../service';
import { HEAD_BARKS } from '../../../content/heads';
import { newBarkMem, nextBark } from '../heads';
import type { BarkTable } from '../../../content/cities/types';
const bt = (o: unknown) => o as Partial<BarkTable>;

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

  test('wanted, kitchen and sold per minute; the seats', () => {
    only(() => {
      const v = view(SLOW());
      expect(v.perMin.wanted).toBeCloseTo(2.8 * 60, 6);
      expect(v.perMin.kitchen).toBeCloseTo(2.1 * 60, 6);
      expect(v.perMin.sold).toBeCloseTo(2.1 * 60, 6);
      // the Customers line is the drivers' deliveries plus the seats (G119, S90): the Drivers bar alone can never reach it
      expect(v.capacity.drivers + v.walkIns).toBeCloseTo(v.wanted, 6);
      expect(v.walkIns).toBeGreaterThan(0);
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
        symptomAsks(g, 'downtown');
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
      expect(getFeature(back, service).shops.downtown).toEqual(service.init(0, HOME_CITY).shops.downtown);
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
    const s = service.migrate({ at: 5, shops: { downtown: { below: 40, cold: true, tip: true, pile: { prep: 1 } } } }, T0, HOME_CITY);
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

describe('the copy', () => {
  test('every manager has the four strip lines, the shops name the managers the game has', () => {
    for (const id of Object.keys(MANAGERS) as NeighborhoodId[]) {
      const k = MANAGER_COPY_KEY[id];
      for (const s of ['tipping', 'cold']) expect(COPY[`report.${k}.${s}` as keyof typeof COPY]).toBeTruthy();
    }
  });
});

// ---------- v5.22 (card E3): the report from the first head, and the shop's symptoms ----------

/** A downtown with the three stations at the given levels, run by `heads` (a head per station, or none), 10 drivers and 1 seating. */
const kitchen = (
  levels: { prep: number; ovens: number; counter: number },
  heads: Partial<Record<'prep' | 'oven' | 'counter', boolean>> = G.allHeads(),
  patch: Partial<G.Shop> = {},
) => shop(5, 10, 1, { managed: false, heads: { ...G.noHeads(), ...heads }, ...levels, ...patch });
/** Ovens far short of prep and counter: wants 2.8 a second, ovens make 0.7. */
const OVENS_SHORT = () => kitchen({ prep: 20, ovens: 1, counter: 20 });

describe('the report is live from the first head (v5.22)', () => {
  test('a shop with no head and no manager is inactive; one head makes it live; a manager does', () => {
    only(() => {
      const none = kitchen({ prep: 5, ovens: 5, counter: 5 }, {});
      expect(reportActive(none, 'downtown')).toBe(false);
      expect(view(none)).toBe(view(none)); // the shared inactive view
      expect(view(none).capacity).toEqual({ prep: 0, ovens: 0, counter: 0, drivers: 0 });
      for (const h of ['prep', 'oven', 'counter'] as const)
        expect(reportActive(kitchen({ prep: 5, ovens: 5, counter: 5 }, { [h]: true }), 'downtown')).toBe(true);
      expect(reportActive(shop(5, 10, 1), 'downtown')).toBe(true);
      expect(reportActive(withShop(none, 'downtown', { built: false, heads: G.allHeads() }), 'downtown')).toBe(false);
    });
  });

  test('the tip and the cold line still wait for a shop that runs itself, after the takeover', () => {
    only(() => {
      const one = kitchen({ prep: 10, ovens: 10, counter: 10 }, { oven: true });
      const v = view(one);
      expect(v.state).toBe('inactive');
      expect(v.capacity.ovens).toBeGreaterThan(0);
      const { g, now } = play(one, 5);
      expect(view(g, now).state).toBe('inactive');
      expect(getFeature(g, service).shops.downtown.tip).toBe(false);
      expect(G.shopEarnings(g, 'downtown', now)).toBeCloseTo(
        withFeatures([], () => G.shopEarnings(g, 'downtown', now)),
        9,
      );
    });
  });

  test('a station the player still taps is `you`, and its capacity is what the hands made', () => {
    only(() => {
      const g0 = kitchen({ prep: 10, ovens: 10, counter: 10 }, { oven: true, counter: true });
      const v0 = view(g0);
      expect(v0.you).toEqual({ prep: true, ovens: false, counter: false });
      expect(v0.capacity.prep).toBe(0); // nothing made yet
      // the score the sheet shows agrees with its Served and Missed: nothing made by hand serves nobody, however fast the machine would be
      expect(v0.served).toBe(0);
      expect(v0.service).toBe(0);
      expect(v0.capacity.ovens).toBeCloseTo(v0.perMin.ovens, 9);
      // tap prep whenever the bench has room for a minute
      let g = g0;
      let now = T0;
      for (let i = 0; i < 60; i++) {
        const r = G.tapStation(g, 'downtown', 'prep');
        if (r.ok) g = r.state;
        now += 1000;
        g = G.playTick(g, 1, now);
      }
      const v = view(g, now);
      expect(v.capacity.prep).toBeGreaterThan(0);
      expect(v.capacity.prep).toBeLessThan(v.perMin.prep); // what it managed is below what the bench could do
    });
  });
});

describe('capacity, wanted, served and missed (v5.22)', () => {
  test('per minute, for every station and the drivers; served and missed add up to wanted', () => {
    only(() => {
      const v = view(OVENS_SHORT());
      expect(v.capacity.ovens).toBeCloseTo(0.7 * 60, 6);
      expect(v.capacity.drivers).toBeGreaterThan(0);
      expect(v.wanted).toBeCloseTo(2.8 * 60, 6);
      expect(v.served).toBeCloseTo(0.7 * 60, 6);
      expect(v.missed).toBeCloseTo((2.8 - 0.7) * 60, 6);
      expect(v.served + v.missed).toBeCloseTo(v.wanted, 9);
      // the smallest kitchen entry is the ovens: the table is data, nobody names it
      const { prep, ovens, counter } = v.capacity;
      expect(Math.min(prep, ovens, counter)).toBe(ovens);
      expect(Object.keys(v)).not.toContain('limit');
    });
  });

  test('missed is zero when the kitchen keeps up, and the chapters read it (a hand shop: its machines)', () => {
    only(() => {
      expect(view(TIPPING()).missed).toBe(0);
      expect(missedOf(TIPPING(), 'downtown', T0 + 1000)).toBe(0);
      expect(missedOf(OVENS_SHORT(), 'downtown', T0 + 1000)).toBeCloseTo(2.1 * 60, 6);
      const byHand = kitchen({ prep: 5, ovens: 5, counter: 5 }, {});
      expect(missedOf(byHand, 'downtown', T0 + 1000)).toBeCloseTo((2.8 - 2.1) * 60, 6);
    });
  });

  test('capacityAfter is the station after one more level, and unchanged at the cap', () => {
    only(() => {
      const g = kitchen({ prep: 5, ovens: 5, counter: 5 });
      const now = T0 + 1000;
      const before = view(g, now).capacity;
      const more = (k: 'prep' | 'ovens' | 'counter') => G.buyUpgrade({ ...g, cash: 1e15 }, 'downtown', k);
      for (const k of ['prep', 'ovens', 'counter'] as const) {
        const r = more(k);
        expect(r.ok).toBe(true);
        if (r.ok) expect(capacityAfter(g, 'downtown', k, now)).toBeCloseTo(view(r.state, now).capacity[k], 9);
        expect(capacityAfter(g, 'downtown', k, now)).toBeGreaterThan(before[k]);
      }
      const d = G.buyUpgrade({ ...g, cash: 1e15 }, 'downtown', 'drivers');
      if (d.ok) expect(capacityAfter(g, 'downtown', 'drivers', now)).toBeCloseTo(view(d.state, now).capacity.drivers, 9);
      const capped = withShop(g, 'downtown', { prep: G.levelCap(g.shops.downtown) });
      expect(capacityAfter(capped, 'downtown', 'prep', now)).toBeCloseTo(view(capped, now).capacity.prep, 9);
    });
  });
});

describe('symptoms (v5.22)', () => {
  test('ovens far short: dough piles at prep, the counter waits, the ovens neither', () => {
    only(() => {
      const { g, now } = play(OVENS_SHORT(), 60);
      const v = view(g, now);
      expect(v.symptoms.prep).toBe('piling');
      expect(v.symptoms.counter).toBe('idle');
      expect(v.symptoms.ovens).toBeNull();
    });
  });

  test('before they have held a while nothing shows, and a kitchen that keeps up shows nothing at all', () => {
    only(() => {
      expect(view(play(OVENS_SHORT(), 2).g, T0 + 2000).symptoms).toEqual({ prep: null, ovens: null, counter: null, drivers: null, floor: null });
      const { g, now } = play(kitchen({ prep: 10, ovens: 10, counter: 10 }, G.allHeads(), { drivers: 1 }), 60);
      expect(view(g, now).symptoms).toEqual({ prep: null, ovens: null, counter: null, drivers: null, floor: null });
    });
  });

  test('customers outnumbering the kitchen: a line at the door after 10 s, a walk-out after 20', () => {
    only(() => {
      let { g, now } = play(OVENS_SHORT(), 5);
      expect(view(g, now).symptoms.floor).toBeNull();
      ({ g, now } = play(g, 8, now));
      expect(view(g, now).symptoms.floor).toBe('line');
      ({ g, now } = play(g, 15, now));
      expect(view(g, now).symptoms.floor).toBe('walkout');
    });
  });

  test('idle drivers: more than half of them with nothing to carry, held 10 s', () => {
    only(() => {
      const idle = kitchen({ prep: 20, ovens: 20, counter: 20 }, G.allHeads(), { drivers: 30, tables: 1 }); // a fleet far bigger than the orders
      let { g, now } = play(idle, 5);
      expect(view(g, now).symptoms.drivers).toBeNull();
      ({ g, now } = play(g, 8, now));
      expect(view(g, now).symptoms.drivers).toBe('idle');
      expect(view(OVENS_SHORT(), T0 + 1000).symptoms.drivers).toBeNull();
    });
  });

  test('a station the player taps by hand is never idle (it is the player)', () => {
    only(() => {
      const { g, now } = play(kitchen({ prep: 10, ovens: 10, counter: 10 }, { counter: true }), 60);
      expect(view(g, now).symptoms.prep).not.toBe('idle');
      expect(view(g, now).symptoms.ovens).not.toBe('idle');
    });
  });

  test('away time starts them over', () => {
    only(() => {
      const { g, now } = play(OVENS_SHORT(), 60);
      expect(view(g, now).symptoms.prep).toBe('piling');
      const back = G.applyOffline({ ...g, lastSavedAt: now }, now + 3_600_000).state;
      expect(view(back, now + 3_600_000).symptoms).toEqual({ prep: null, ovens: null, counter: null, drivers: null, floor: null });
    });
  });
});

describe('symptom barks (v5.22)', () => {
  const managed = () => withShop(OVENS_SHORT(), 'downtown', { managed: true });

  test('a head speaks about their station, the manager about the door, each after the state has held 10 s', () => {
    only(() => {
      expect(symptomAsks(play(OVENS_SHORT(), 8).g, 'downtown')).toEqual([]);
      const { g } = play(OVENS_SHORT(), 60);
      const asks = symptomAsks(g, 'downtown');
      expect(asks.map((a) => [a.trigger, a.station, a.by])).toEqual([
        ['pile', 'prep', undefined],
        ['idle', 'counter', undefined],
      ]); // heads, no manager: nobody speaks for the door
      expect(asks.every((a) => (a.held ?? 0) >= SERVICE.barkAfterSeconds)).toBe(true);
      const m = symptomAsks(play(managed(), 40).g, 'downtown').filter((a) => a.by === 'manager');
      expect(m.map((a) => a.trigger)).toEqual(['line', 'drivers-idle']); // the fleet has little to carry while the kitchen is short
    });
  });

  test('nobody speaks before a hire', () => {
    only(() => expect(symptomAsks(play(kitchen({ prep: 20, ovens: 1, counter: 20 }, {}), 40).g, 'downtown')).toEqual([]));
  });

  test('at most once per 45 s in a shop, and every 30 s once the state has held two minutes', () => {
    const lines = bt({ downtown: { prep: { pile: 'Dough’s stacking up by the ovens, boss.' } } });
    const manager = { downtown: { line: 'Line’s out the door.' } };
    const pile = { trigger: 'pile' as const, station: 'prep' as const, held: 20 };
    const first = nextBark(newBarkMem(), 'downtown', [pile], 100, false, lines, manager);
    expect(first.bark?.text).toBe('Dough’s stacking up by the ovens, boss.');
    // the bubble gap (20 s) has passed but the symptom gap has not
    expect(nextBark(first.mem, 'downtown', [pile], 100 + HEAD_BARKS.gap + 1, false, lines, manager).bark).toBeNull();
    expect(nextBark(first.mem, 'downtown', [pile], 100 + HEAD_BARKS.symptomGap - 1, false, lines, manager).bark).toBeNull();
    expect(nextBark(first.mem, 'downtown', [pile], 100 + HEAD_BARKS.symptomGap, false, lines, manager).bark).not.toBeNull();
    // a long-held state comes back sooner
    const long = { ...pile, held: HEAD_BARKS.symptomLongAfter };
    expect(nextBark(first.mem, 'downtown', [long], 100 + HEAD_BARKS.symptomGapLong, false, lines, manager).bark).not.toBeNull();
    // another kind of bark is not held back by a symptom's gap
    const milestone = { trigger: 'milestone' as const, station: 'prep' as const };
    expect(nextBark(first.mem, 'downtown', [milestone], 100 + HEAD_BARKS.gap, false, bt({ downtown: { prep: { milestone: 'Flour!' } } })).bark?.text).toBe(
      'Flour!',
    );
  });

  test('the manager speaks the manager’s line; a missing line is silent', () => {
    const line = { trigger: 'line' as const, station: 'counter' as const, by: 'manager' as const, held: 12 };
    const r = nextBark(newBarkMem(), 'downtown', [line], 100, false, {}, { downtown: { line: 'Line’s out the door.' } });
    expect(r.bark?.text).toBe('Line’s out the door.');
    expect(nextBark(newBarkMem(), 'downtown', [line], 100, false, {}, {}).bark).toBeNull();
  });

  test('a symptom outranks a milestone, and an attack outranks both', () => {
    const lines = bt({ downtown: { prep: { pile: 'p', milestone: 'm', attack: 'a' } } });
    const at = (...t: ('pile' | 'milestone' | 'attack')[]) =>
      nextBark(
        newBarkMem(),
        'downtown',
        t.map((trigger) => ({ trigger, station: 'prep' as const, held: 20 })),
        100,
        false,
        lines,
      ).bark?.trigger;
    expect(at('milestone', 'pile')).toBe('pile');
    expect(at('milestone', 'pile', 'attack')).toBe('attack');
  });
});
