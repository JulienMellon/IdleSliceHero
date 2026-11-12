/// <reference types="jest" />
// The `cheer` pulse (D444): anyone emits it, the storefront listens and the cooks raise both arms for CHEER_SECONDS.
import { CHEER_SECONDS, emitCheer, onCheer } from '../pulse-bus';
import { buildCast } from '../scene/cast';
import { emptyCrew } from '../scene/crew';
import { layout } from '../scene/layout';
import { hash32 } from '../scene/looks';
import { seatPalette } from '../scene/palette';

describe('the cheer pulse', () => {
  test('every listener hears each emit until it unsubscribes; it lasts about 1.2 s', () => {
    let a = 0;
    let b = 0;
    const offA = onCheer(() => a++);
    const offB = onCheer(() => b++);
    emitCheer();
    emitCheer();
    offA();
    emitCheer();
    offB();
    emitCheer();
    expect([a, b]).toEqual([2, 3]);
    expect(CHEER_SECONDS).toBeGreaterThanOrEqual(1);
    expect(CHEER_SECONDS).toBeLessThanOrEqual(1.5);
  });
  test('while it is up every cook cheers (primitive props: act and mood) and nobody else changes; when it is over they work again', () => {
    const lay = layout(3, 4, 3, 2, 6, 3, 1);
    const pal = seatPalette(hash32(1) % 8, hash32(2) % 6, 8, 6, lay.tables.length);
    const at = (cheer: boolean) => buildCast({ lay, shop: { drivers: 12, tables: 40, prep: 120 }, running: true, pace: 1, clock: 3, shopSeed: 7, nIdx: 1, pal, crew: emptyCrew(), cheer }).cast;
    const on = at(true);
    const off = at(false);
    const cooks = (cast: ReturnType<typeof at>) => cast.filter((c) => c.role === 'cook');
    expect(cooks(on)).toHaveLength(3);
    for (const c of cooks(on)) expect([c.props.act, c.props.mood]).toEqual(['cheer', 'happy']);
    for (const c of cooks(off)) expect(c.props.act).not.toBe('cheer');
    // everyone else is the same either way
    expect(on.filter((c) => c.role !== 'cook')).toEqual(off.filter((c) => c.role !== 'cook'));
    // only strings and numbers cross into the memoised limbs
    for (const c of cooks(on)) for (const v of Object.values(c.props)) expect(['string', 'number', 'boolean', 'undefined']).toContain(typeof v);
  });
});
