/// <reference types="jest" />
import { JAMS } from '../../../../content/layers';
import { getFeature, withFeatures } from '../../../../engine/features';
import { fixJam, industrialShifts, jamView, type ShiftsState } from '../../../../engine/features/layers/industrial-shifts';
import { allHeads, newGame, type GameState } from '../../../../engine/game';
import { layout } from '../../../scene/layout';
import { D, P, SCENE_H, SCENE_W } from '../../../scene/projection';
import { TAP } from '../../../tap-targets';
import { onJam, onJamFixed, emitJam, emitJamFixed } from '../jam-bus';
import { jamEdge, jamLabel, ovenSpot, WRENCH } from '../jam-model';

const NOW = new Date(2026, 10, 9, 9, 0, 0).getTime();
const run = <T>(fn: () => T): T => withFeatures([industrialShifts], fn);
function jammed(heads: boolean, secondsIn = 0): GameState {
  return run(() => {
    const g = newGame(NOW);
    const shops = { ...g.shops, industrial: { ...g.shops.industrial, built: true, managed: heads, footprint: 2, heads: heads ? allHeads() : g.shops.industrial.heads } };
    const st: ShiftsState = { ...getFeature(g, industrialShifts), startAt: 0, at: NOW, nextAt: 99999, jam: 100 };
    return { ...g, shops, playSeconds: 100 + secondsIn, x: { ...g.x, [industrialShifts.key]: st } };
  });
}

describe('the wrench label', () => {
  it('is the alert while a jam waits for the wrench', () => {
    expect(jamLabel(run(() => jamView(jammed(false))))).toBe('Oven jammed! Tap the wrench.');
  });

  it('counts the Head Baker down: "Head Baker fixing… 30s" and then 12s', () => {
    expect(jamLabel(run(() => jamView(jammed(true))))).toBe(`Head Baker fixing… ${JAMS.autoFixSeconds}s`);
    expect(jamLabel(run(() => jamView(jammed(true, 18))))).toBe('Head Baker fixing… 12s');
  });

  it('is nothing once the wrench has been tapped', () => {
    const g = jammed(false);
    const fixed = run(() => {
      const r = fixJam(g);
      return r.ok ? r.state : g;
    });
    expect(jamLabel(run(() => jamView(fixed)))).toBeNull();
    expect(jamLabel({ jammed: false, autoFixIn: null })).toBeNull();
  });
});

describe('the wrench is a 44 pt target on the oven', () => {
  it('is drawn at the tap minimum', () => {
    expect(WRENCH).toBeGreaterThanOrEqual(TAP.min);
  });

  it('stands on the last oven of the bank, inside the scene, with the smoke above it', () => {
    for (const fp of [0, 1, 2, 3, 4]) {
      for (const n of [1, 3, 6]) {
        const lay = layout(fp, Math.min(n, [2, 3, 4, 5, 6][fp]), 1, 1, 0, 2, 0);
        const at = ovenSpot(lay);
        expect(at.x).toBeGreaterThan(0);
        expect(at.x).toBeLessThan(SCENE_W);
        expect(at.y).toBeGreaterThan(0);
        expect(at.y).toBeLessThan(SCENE_H);
        expect(at.top).toBeLessThan(at.y);
        const o = lay.ovens[lay.ovens.length - 1];
        expect(at.x).toBeCloseTo(P((o.x0 + o.x1) / 2, D - 6, 0)[0], 5);
      }
    }
  });
});

describe('the pulses', () => {
  it('jam when the flag turns on, jamfixed when it turns off, nothing for the first value or no change', () => {
    expect(jamEdge(null, true)).toBeNull();
    expect(jamEdge(null, false)).toBeNull();
    expect(jamEdge(false, true)).toBe('jam');
    expect(jamEdge(true, false)).toBe('jamfixed');
    expect(jamEdge(true, true)).toBeNull();
    expect(jamEdge(false, false)).toBeNull();
  });

  it('reach their listeners, and stop after the unsubscribe', () => {
    const seen: string[] = [];
    const off = [onJam(() => seen.push('jam')), onJamFixed(() => seen.push('jamfixed'))];
    emitJam();
    emitJamFixed();
    off.forEach((f) => f());
    emitJam();
    expect(seen).toEqual(['jam', 'jamfixed']);
  });
});
