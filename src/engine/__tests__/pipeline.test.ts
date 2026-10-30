/// <reference types="jest" />
// The kitchen line (playtest 2): cash only arrives with departures, the line's revenue equals the steady-state
// formula, offline catch-up settles the line, and pizza counts are whole numbers everywhere.
import * as G from '../game';
import { pizzas, pizzasLeft } from '../format';
import { advanceLine, AUTOMATIC, emptyLine, LINE, MANUAL, piesInFlight, tapStation, type LineRates } from '../pipeline';
import { NEIGHBORHOODS } from '../../content/tuning';

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
  test('without a GM, only running jobs finish (heads do not work while you are away)', () => {
    let s = withShop(G.newGame(0), 'downtown', { heads: { prep: true, oven: true, counter: true } });
    for (let i = 0; i < 40; i++) s = G.lineTick(s, 0.2);
    const r = G.offlineTick(s, 3600);
    const l = r.state.shops.downtown.line;
    expect(l.prep).toBeNull();
    expect(l.oven).toBeNull();
    expect(l.counter).toBeNull();
    expect(l.departures).toEqual([]);
    expect(r.state.shops.downtown.sold - s.shops.downtown.sold).toBeLessThanOrEqual(piesInFlight(s.shops.downtown.line));
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
      expect(G.nonnaCountdownText(s)).not.toMatch(/\d\.\d/);
    }
  });
  test('Downtown heads have their fixed prices; other shops scale with the manager price', () => {
    for (const n of NEIGHBORHOODS.slice(1)) expect(G.headCost(n.id, 'counter')).toBe(Math.ceil(n.managerCost * 0.5));
  });
});
