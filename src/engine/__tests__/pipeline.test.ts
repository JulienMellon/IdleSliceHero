/// <reference types="jest" />
// The kitchen line (playtest 2): cash only arrives with departures, the line's revenue equals the steady-state
// formula, offline catch-up settles the line, and pizza counts are whole numbers everywhere.
import * as G from '../game';
import { pizzas, pizzasLeft } from '../format';
import { advanceLine, AUTOMATIC, emptyLine, LINE, MANUAL, piesInFlight, tapStation, type LineRates } from '../pipeline';
import { GM_BOOST, HEADS_OFFLINE_SHARE, NEIGHBORHOODS } from '../../content/tuning';

const rates = (over: Partial<LineRates> = {}): LineRates => ({ prep: 2, oven: 1.5, serve: 3, shop: 1.5, price: 5, walkInFraction: 0.3, tapBatch: 4, ...over });
const withShop = (s: G.GameState, id: G.GameState['active'], patch: Partial<G.Shop>): G.GameState => ({ ...s, shops: { ...s.shops, [id]: { ...s.shops[id], ...patch } } });
const gm = (s: G.GameState, id: G.GameState['active'], patch: Partial<G.Shop> = {}) => withShop(s, id, { built: true, managed: true, heads: G.allHeads(), ...patch });

describe('advanceLine', () => {
  test('results do not depend on tick size', () => {
    const run = (dt: number) => {
      let l = emptyLine();
      let paid = 0;
      for (let t = 0; t < 30 - 1e-9; t += dt) {
        const a = advanceLine(l, dt, rates(), AUTOMATIC);
        l = a.line;
        paid += a.paid;
      }
      return paid;
    };
    const ref = run(0.05);
    for (const dt of [0.2, 1, 2]) expect(Math.abs(run(dt) - ref)).toBeLessThanOrEqual(rates().price * 4 * 2);
  });
  test('cash never rises without a departure reaching the door', () => {
    let l = emptyLine();
    for (let i = 0; i < 500; i++) {
      const dt = 0.01 + ((i * 37) % 13) / 20;
      const a = advanceLine(l, dt, rates(), AUTOMATIC);
      if (a.paid > 0) expect(a.sold).toBeGreaterThan(0);
      expect(Number.isInteger(a.sold)).toBe(true);
      l = a.line;
      expect(l.departures.length).toBeLessThanOrEqual(LINE.maxDepartures);
      expect(l.prepped).toBeLessThanOrEqual(2 * Math.max(4, Math.ceil(1.5 * LINE.cycleSeconds)) + 8);
    }
  });
  test('departure ids keep increasing', () => {
    let l = emptyLine();
    const ids: number[] = [];
    for (let i = 0; i < 200; i++) {
      l = advanceLine(l, 0.2, rates(), AUTOMATIC).line;
      for (const d of l.departures) if (!ids.includes(d.id)) ids.push(d.id);
    }
    expect(ids.length).toBeGreaterThan(3);
    expect([...ids].sort((a, b) => a - b)).toEqual(ids);
  });
  test('the walk-in split follows the steady-state fraction; every pie pays the same average price', () => {
    let l = emptyLine();
    let walk = 0;
    let all = 0;
    let paid = 0;
    let seen = 0;
    for (let i = 0; i < 2000; i++) {
      const a = advanceLine(l, 0.2, rates({ walkInFraction: 0.3 }), AUTOMATIC);
      for (const d of a.line.departures) if (d.id > seen) {
        seen = d.id;
        all += d.n;
        if (d.kind === 'walkin') walk += d.n;
      }
      paid += a.paid;
      if (a.sold) expect(a.paid / a.sold).toBeCloseTo(5);
      l = a.line;
    }
    expect(walk / all).toBeGreaterThan(0.25);
    expect(walk / all).toBeLessThan(0.35);
    expect(paid).toBeGreaterThan(0);
  });
  test('a manual line refuses out-of-order taps and the oven takes everything prepped', () => {
    const r = rates();
    expect(tapStation(emptyLine(), 'counter', r).ok).toBe(false);
    const a = tapStation(emptyLine(), 'prep', r);
    expect(a.ok).toBe(true);
    if (!a.ok) return;
    expect(tapStation(a.line, 'prep', r).ok).toBe(false); // still prepping
    const l = advanceLine(a.line, 10, r, MANUAL).line;
    expect(l.prepped).toBe(4);
    const b = tapStation(l, 'oven', r);
    expect(b.ok && b.line.oven?.n).toBe(4);
    expect(tapStation(emptyLine(), 'oven', r, { prep: false, oven: true, counter: false }).ok).toBe(false);
  });
});

describe('offline settles the line', () => {
  test('a GM shop: closed-form whole pies plus everything already on its line', () => {
    let s = gm(G.newGame(0), 'downtown', { prep: 20, ovens: 20, counter: 20, drivers: 20 });
    for (let i = 0; i < 40; i++) s = G.lineTick(s, 0.2);
    const inFlight = piesInFlight(s.shops.downtown.line);
    const sec = 600;
    const r = G.offlineTick(s, sec);
    const pies = r.state.shops.downtown.sold - s.shops.downtown.sold;
    expect(pies).toBe(Math.floor(G.shopRate(s.shops.downtown, 0) * sec) + inFlight);
    expect(piesInFlight(r.state.shops.downtown.line)).toBe(0);
    expect(r.state.shops.downtown.line.nextId).toBe(s.shops.downtown.line.nextId);
  });
  // v5.16: a shop with all three heads and no GM keeps selling while you are away, at HEADS_OFFLINE_SHARE of its rate and without the GM's boost
  const levelled = { prep: 20, ovens: 20, counter: 20, drivers: 20 };
  const away = (s: G.GameState, sec: number) => {
    let cur = s;
    for (let i = 0; i < 40; i++) cur = G.lineTick(cur, 0.2);
    return { before: cur, after: G.offlineTick(cur, sec) };
  };
  test('with no head and no GM, only running jobs finish', () => {
    let s = withShop(G.newGame(0), 'downtown', levelled);
    s = withShop(s, 'downtown', { line: { ...s.shops.downtown.line, prep: { n: 4, left: 1, total: 2 } } });
    const { before, after } = away(s, 3600);
    const l = after.state.shops.downtown.line;
    expect(l.prep).toBeNull();
    expect(l.oven).toBeNull();
    expect(l.counter).toBeNull();
    expect(l.departures).toEqual([]);
    expect(after.state.shops.downtown.sold - before.shops.downtown.sold).toBeLessThanOrEqual(piesInFlight(before.shops.downtown.line));
  });
  test('with two heads of three it is still idle: it only finishes what was on the line', () => {
    const s = withShop(G.newGame(0), 'downtown', { ...levelled, heads: { prep: true, oven: true, counter: false } });
    const { before, after } = away(s, 3600);
    expect(after.state.shops.downtown.sold - before.shops.downtown.sold).toBeLessThanOrEqual(piesInFlight(before.shops.downtown.line));
    expect(after.state.shops.downtown.line.prep).toBeNull();
    const idle = G.applyOffline({ ...withShop(withShop(G.newGame(0), 'suburbs', { ...levelled, built: true, heads: { prep: true, oven: true, counter: false } }), 'downtown', { managed: true, heads: G.allHeads() }), lastSavedAt: 0 }, 3600_000);
    expect(idle.idle).toEqual(['suburbs']);
  });
  test('with all three heads and no GM it sells HEADS_OFFLINE_SHARE of its rate, at the plain price (no GM boost)', () => {
    const s = withShop(G.newGame(0), 'downtown', { ...levelled, heads: G.allHeads() });
    const { before, after } = away(s, 3600);
    const shop = before.shops.downtown;
    const inFlight = piesInFlight(shop.line);
    const pies = after.state.shops.downtown.sold - shop.sold;
    expect(pies).toBe(Math.floor(G.shopRate(shop, 0) * HEADS_OFFLINE_SHARE * 3600) + inFlight);
    expect(after.state.cash - before.cash).toBeCloseTo(after.byShop[0].base, 6);
    // the same shop with a GM sells the full rate at twice the price per pie
    const full = away(withShop(G.newGame(0), 'downtown', { ...levelled, managed: true, heads: G.allHeads() }), 3600);
    const fullPies = full.after.state.shops.downtown.sold - full.before.shops.downtown.sold;
    expect(fullPies / pies).toBeCloseTo(1 / HEADS_OFFLINE_SHARE, 1);
    expect(full.after.byShop[0].base / after.byShop[0].base).toBeCloseTo((fullPies / pies) * GM_BOOST, 1);
    // all three heads: not idle
    const r = G.applyOffline({ ...withShop(withShop(G.newGame(0), 'suburbs', { ...levelled, built: true, heads: G.allHeads() }), 'downtown', { managed: true, heads: G.allHeads() }), lastSavedAt: 0 }, 3600_000);
    expect(r.idle).toEqual([]);
  });
  test('applyOffline never pays twice: a second load right after pays nothing', () => {
    let s = gm(G.newGame(0), 'downtown');
    for (let i = 0; i < 40; i++) s = G.lineTick(s, 0.2);
    const a = G.applyOffline({ ...s, lastSavedAt: 0 }, 120_000);
    const b = G.applyOffline(a.state, 120_000);
    expect(b.earned).toBe(0);
  });
});

describe('save v4', () => {
  test('v3 saves: fractional sold floors, queued pies go on the bench, managed shops keep all heads', () => {
    const v3 = JSON.parse(JSON.stringify(G.newGame(0)));
    v3.saveVersion = 3;
    for (const id of Object.keys(v3.shops)) {
      delete v3.shops[id].line;
      delete v3.shops[id].heads;
    }
    v3.shops.downtown = { ...v3.shops.downtown, sold: 79.9998, queued: 7.2, managed: false };
    v3.shops.suburbs = { ...v3.shops.suburbs, built: true, managed: true, sold: 12.5 };
    const m = G.migrate(v3, 0);
    expect(m.shops.downtown.sold).toBe(79);
    expect(m.shops.downtown.line.prepped).toBe(8);
    expect(m.shops.suburbs.heads).toEqual({ prep: true, oven: true, counter: true });
    expect(m.shops.downtown.heads).toEqual({ prep: false, oven: false, counter: false });
  });
  test('a v4 save with carriers mid-walk round-trips', () => {
    let s = gm(G.newGame(0), 'downtown');
    for (let i = 0; i < 30; i++) s = G.lineTick(s, 0.2);
    expect(G.migrate(JSON.parse(JSON.stringify(s)), 0)).toEqual(s);
  });
  test('a malformed line starts empty', () => {
    const raw = JSON.parse(JSON.stringify(G.newGame(0)));
    raw.shops.downtown.line = { prep: { n: 'x' }, departures: [{ n: -3 }, 7], prepped: -2, nextId: 'q' };
    const l = G.migrate(raw, 0).shops.downtown.line;
    expect(l).toEqual({ ...emptyLine(), prepped: 0 });
  });
});

describe('whole pizza numbers (P7)', () => {
  test('formatters', () => {
    expect(pizzas(70.0002)).toBe('70');
    expect(pizzasLeft(70.0002)).toBe('71');
    expect(pizzasLeft(70)).toBe('70');
    expect(pizzas(12_345)).toBe('12.3K');
  });
  test('no player-facing count shows a long decimal', () => {
    for (const sold of [0, 0.5, 79.9998, 80.0002, 149.99]) {
      const s = withShop(G.newGame(0), 'downtown', { sold });
      expect(G.nonnaCountdownText(s)).not.toMatch(/\d\.\d+(?![\dKMB])/); // "2.22K" is a short count, "70.0002" is not
    }
  });
  test('Downtown heads have their fixed prices; other shops split their own heads price', () => {
    for (const n of NEIGHBORHOODS.slice(1)) expect(G.headCost(n.id, 'counter')).toBe(Math.ceil(n.headsCost * 0.5));
  });
});

describe('codecritic round 15', () => {
  const deepFreeze = <T,>(o: T): T => {
    if (o && typeof o === 'object') {
      Object.values(o as object).forEach(deepFreeze);
      Object.freeze(o);
    }
    return o;
  };
  test('T47: remainders after a batch-size change all leave; buffers stay under 2 batches', () => {
    // tapped play left 3 on the bench and 5 on the pass, then the GM arrives with a bigger batch
    let l = { ...emptyLine(), prepped: 3, baked: 5 };
    const r = rates({ shop: 3.5, prep: 4, oven: 4, serve: 4 });
    const b = Math.max(r.tapBatch, Math.ceil(r.shop * LINE.cycleSeconds));
    let sold = 0;
    for (let i = 0; i < 600; i++) {
      const a = advanceLine(l, 0.2, r, AUTOMATIC);
      sold += a.sold;
      l = a.line;
      expect(l.prepped).toBeLessThan(2 * b + 1);
      expect(l.baked).toBeLessThan(2 * b + 1);
    }
    expect(sold).toBeGreaterThan(8 + 100);
    // stop prepping new dough: everything already made must leave
    for (let i = 0; i < 200; i++) l = advanceLine(l, 0.2, r, { prep: false, oven: true, counter: true }).line;
    expect(l.prepped + l.baked).toBe(0);
  });
  test('T48: line revenue matches shopRevenue within 1% over 600 s at many levels', () => {
    for (const lvl of [1, 10, 50, 150, 400]) {
      let s = gm(G.newGame(0), 'downtown', { prep: lvl, ovens: lvl, counter: lvl, drivers: lvl, tables: lvl, footprint: 4, grade: 4 });
      for (let i = 0; i < 100; i++) s = G.lineTick(s, 0.2);
      const c0 = s.cash;
      for (let i = 0; i < 3000; i++) s = G.lineTick(s, 0.2);
      const ratio = (s.cash - c0) / 600 / G.shopEarnings(s, 'downtown');
      expect(ratio).toBeGreaterThan(0.99);
      expect(ratio).toBeLessThan(1.01);
    }
  });
  test('T49: advanceLine and rush never mutate their input', () => {
    let l = emptyLine();
    for (let i = 0; i < 20; i++) l = advanceLine(l, 0.2, rates(), AUTOMATIC).line;
    const frozen = deepFreeze(JSON.parse(JSON.stringify(l)));
    expect(() => advanceLine(frozen, 1.5, rates(), AUTOMATIC)).not.toThrow();
    let s = gm(G.newGame(0), 'downtown');
    for (let i = 0; i < 20; i++) s = G.lineTick(s, 0.2);
    deepFreeze(s);
    expect(() => G.tapShop(s, 'downtown')).not.toThrow();
  });
  test('T50: a saved departure id at or past nextId raises it; an over-long walk is clamped', () => {
    const raw = JSON.parse(JSON.stringify(G.newGame(0)));
    raw.shops.downtown.line = { ...emptyLine(), nextId: 2, departures: [{ id: 9, kind: 'driver', n: 4, cash: 12, left: 99 }] };
    const l = G.migrate(raw, 0).shops.downtown.line;
    expect(l.nextId).toBe(10);
    expect(l.departures[0].left).toBe(LINE.departSeconds);
  });
  test('T51: a rush on a GM shop pays nothing until pies leave', () => {
    let s = gm(G.newGame(0), 'downtown');
    s = G.lineTick(s, 0.5);
    expect(G.tapShop(s, 'downtown').cash).toBe(s.cash);
  });
  test('C68: a shop with all three heads earns in the foreground and counts in the city $/s', () => {
    const s = withShop(G.newGame(0), 'downtown', { heads: G.allHeads() });
    expect(G.runsItself(s.shops.downtown)).toBe(true);
    expect(G.earningsPerSecond(s)).toBeGreaterThan(0);
  });
});
