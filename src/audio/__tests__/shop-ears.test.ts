// Card A3: the shop's state by ear. The rate limits are the point: a piled-up oven must not tick like a metronome, a line must not ring the
// phone all night, and a long tip streak must not chime on every sale.
import { EARS, ShopEars, type EarsInput } from '../shop-ears';

const base: EarsInput = { live: true, ovens: null, floor: null, tipping: false, baked: 0, sold: 0 };
const at = (i: Partial<EarsInput>): EarsInput => ({ ...base, ...i });
/** A started listener: the first look only takes a baseline. */
function started(first: Partial<EarsInput> = {}) {
  const ears = new ShopEars();
  expect(ears.step(0, at(first))).toEqual([]);
  return ears;
}

describe('oven ding', () => {
  it('dings once for each new baked batch while the ovens pile, at most every 4 s', () => {
    const ears = started({ ovens: 'piling', baked: 5 });
    expect(ears.step(1000, at({ ovens: 'piling', baked: 5 }))).toEqual([]); // nothing new on the pass
    expect(ears.step(2000, at({ ovens: 'piling', baked: 10 }))).toEqual(['oven_ding']);
    expect(ears.step(3000, at({ ovens: 'piling', baked: 15 }))).toEqual([]); // 1 s later: too soon
    expect(ears.step(5900, at({ ovens: 'piling', baked: 20 }))).toEqual([]); // 3.9 s
    expect(ears.step(6000, at({ ovens: 'piling', baked: 25 }))).toEqual(['oven_ding']); // 4 s
  });

  it('a long pile-up never exceeds one ding per 4 s', () => {
    const ears = started({ ovens: 'piling', baked: 0 });
    let dings = 0;
    for (let s = 1; s <= 60; s++) dings += ears.step(s * 1000, at({ ovens: 'piling', baked: s * 3 })).length;
    expect(dings).toBe(15);
    expect(dings).toBeLessThanOrEqual(60 / (EARS.dingGapMs / 1000));
  });

  it('is silent when the ovens are not piling, or the pass only shrinks', () => {
    const ears = started({ ovens: null, baked: 3 });
    expect(ears.step(5000, at({ ovens: null, baked: 9 }))).toEqual([]);
    expect(ears.step(10_000, at({ ovens: 'idle', baked: 12 }))).toEqual([]);
    expect(ears.step(15_000, at({ ovens: 'piling', baked: 2 }))).toEqual([]);
  });
});

describe('phone ring', () => {
  it('rings when a line forms, then not again for 30 s', () => {
    const ears = started();
    expect(ears.step(1000, at({ floor: 'line' }))).toEqual(['phone_ring']);
    for (let s = 2; s < 31; s++) expect(ears.step(s * 1000, at({ floor: 'line' }))).toEqual([]);
    expect(ears.step(31_000, at({ floor: 'line' }))).toEqual(['phone_ring']);
  });

  it('a line that comes and goes does not buy a second ring inside 30 s; a walk-out counts as a line', () => {
    const ears = started();
    expect(ears.step(1000, at({ floor: 'line' }))).toEqual(['phone_ring']);
    expect(ears.step(2000, at({ floor: null }))).toEqual([]);
    expect(ears.step(3000, at({ floor: 'line' }))).toEqual([]);
    expect(ears.step(40_000, at({ floor: 'walkout' }))).toEqual(['phone_ring']);
  });

  it('is silent without a line', () => {
    const ears = started();
    for (let s = 1; s < 100; s++) expect(ears.step(s * 1000, at({ floor: null, ovens: 'idle' }))).toEqual([]);
  });
});

describe('tip bell', () => {
  it('chimes once per 20 sales while tipping, never more', () => {
    const ears = started({ tipping: true, sold: 100 });
    expect(ears.step(1000, at({ tipping: true, sold: 110 }))).toEqual([]);
    expect(ears.step(2000, at({ tipping: true, sold: 120 }))).toEqual(['tip_bell']);
    expect(ears.step(3000, at({ tipping: true, sold: 125 }))).toEqual([]);
    expect(ears.step(4000, at({ tipping: true, sold: 400 }))).toEqual(['tip_bell']); // a big jump is still one bell
    let bells = 0;
    for (let s = 5; s < 65; s++) bells += ears.step(s * 1000, at({ tipping: true, sold: 400 + (s - 4) * 2 })).length;
    expect(bells).toBe(6); // 120 sales over the minute: one per 20
  });

  it('counts only sales made while tipping', () => {
    const ears = started({ tipping: false, sold: 0 });
    expect(ears.step(1000, at({ tipping: false, sold: 50 }))).toEqual([]);
    expect(ears.step(2000, at({ tipping: true, sold: 60 }))).toEqual([]);
    expect(ears.step(3000, at({ tipping: false, sold: 75 }))).toEqual([]);
    expect(ears.step(4000, at({ tipping: true, sold: 85 }))).toEqual([]); // the 10 before the break are gone
    expect(ears.step(5000, at({ tipping: true, sold: 105 }))).toEqual(['tip_bell']);
  });
});

describe('reset and live', () => {
  it('after a reset the next look is a baseline: a jump in the counts is not a batch or a sale', () => {
    const ears = started({ ovens: 'piling', tipping: true, baked: 5, sold: 10 });
    ears.reset();
    expect(ears.step(10_000, at({ ovens: 'piling', tipping: true, baked: 50, sold: 500 }))).toEqual([]);
  });

  it('a reset does not clear the rate limits', () => {
    const ears = started();
    expect(ears.step(1000, at({ floor: 'line' }))).toEqual(['phone_ring']);
    ears.reset();
    expect(ears.step(2000, at({ floor: 'line' }))).toEqual([]); // baseline
    expect(ears.step(3000, at({ floor: 'line' }))).toEqual([]); // 2 s after the ring
  });

  it('a shop that is not live says nothing and forgets the counts', () => {
    const ears = started({ ovens: 'piling', baked: 5 });
    expect(ears.step(6000, at({ live: false, ovens: 'piling', floor: 'line', tipping: true, baked: 9, sold: 99 }))).toEqual([]);
    expect(ears.step(7000, at({ ovens: 'piling', floor: 'line', baked: 20, sold: 99 }))).toEqual([]); // baseline again
  });
});
