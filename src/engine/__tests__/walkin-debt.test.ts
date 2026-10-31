/// <reference types="jest" />
// C84: the walk-in split's running debt stays bounded and can't be poisoned by a corrupt save.
import * as G from '../game';
import { advanceLine, AUTOMATIC, emptyLine, WALK_IN_DEBT_MAX, type Line, type LineRates } from '../pipeline';

const rates = (over: Partial<LineRates> = {}): LineRates => ({ prep: 2, oven: 1.5, serve: 3, shop: 1.5, price: 5, walkInFraction: 0.3, tapBatch: 4, ...over });

describe('walkInDebt (C84)', () => {
  test('stays at zero over a long run with no walk-ins', () => {
    let line: Line = { ...emptyLine(), walkInDebt: 40 };
    for (let i = 0; i < 20000; i++) {
      line = advanceLine(line, 0.25, rates({ walkInFraction: 0 }), AUTOMATIC).line;
      expect(line.walkInDebt).toBe(0);
    }
  });
  test('stays within the bound with walk-ins over a long run', () => {
    let line: Line = emptyLine();
    for (let i = 0; i < 20000; i++) {
      line = advanceLine(line, 0.25, rates({ walkInFraction: 0.3 }), AUTOMATIC).line;
      expect(Math.abs(line.walkInDebt)).toBeLessThanOrEqual(WALK_IN_DEBT_MAX);
    }
  });
  test('migrate clamps a corrupt huge saved debt', () => {
    for (const bad of [1e12, -1e12, Infinity, 'x']) {
      const raw = JSON.parse(JSON.stringify(G.newGame(0)));
      raw.shops.downtown.line = { walkInDebt: bad };
      const d = G.migrate(raw, 0).shops.downtown.line.walkInDebt;
      expect(Math.abs(d)).toBeLessThanOrEqual(WALK_IN_DEBT_MAX);
    }
    const raw = JSON.parse(JSON.stringify(G.newGame(0)));
    raw.shops.downtown.line = { walkInDebt: 1e12 };
    expect(G.migrate(raw, 0).shops.downtown.line.walkInDebt).toBe(WALK_IN_DEBT_MAX);
  });
});

describe('late-game walk-ins (C90, T66)', () => {
  test('at shop rate 200 and f 0.1 walk-ins still depart and take f of the pies (±5 points)', () => {
    let line: Line = emptyLine();
    let sold = 0;
    let walkins = 0;
    let walkinTrips = 0;
    for (let i = 0; i < 2000; i++) {
      const adv = advanceLine(line, 0.25, rates({ prep: 260, oven: 230, serve: 220, shop: 200, walkInFraction: 0.1, tapBatch: 4 }), AUTOMATIC);
      line = adv.line;
      sold += adv.sold;
      walkins += adv.walkins;
      if (adv.walkins > 0) walkinTrips++;
    }
    expect(sold).toBeGreaterThan(0);
    expect(walkinTrips).toBeGreaterThan(0);
    expect(Math.abs(walkins / sold - 0.1)).toBeLessThanOrEqual(0.05);
  });
});
