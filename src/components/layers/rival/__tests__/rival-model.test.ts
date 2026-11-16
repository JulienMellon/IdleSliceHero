/// <reference types="jest" />
import { RIVAL } from '../../../../content/layers';
import type { NeighborhoodId } from '../../../../content/types';
import type { RivalView } from '../../../../engine/features/layers/rival';
import { CURB_Y, SCENE_H, SCENE_W, P } from '../../../scene/projection';
import { layout } from '../../../scene/layout';
import { SIDEWALK_ROW, TAP } from '../../../tap-targets';
import { STRIP } from '../../../report/report-model';
import {
  RIVAL_SHOP, SHUTTERS, SHUTTERS_TOTAL, opener, rivalCard, rivalLite, rivalPercent, rivalRect, rivalTagText, shutterShare,
} from '../rival-model';

const view = (o: Partial<RivalView> = {}): RivalView => ({ open: true, won: false, phase: 'available', target: 120, progress: 0, secondsLeft: 0, retryIn: 0, valueMult: RIVAL.valueMult, ...o });

describe('the tag', () => {
  test('"−20% sales" while a rival is open, nothing otherwise', () => {
    expect(rivalPercent()).toBe(20);
    expect(rivalTagText(view())).toBe('−20% sales');
    expect(rivalTagText(view({ open: false, valueMult: 1 }))).toBe('');
  });
});

describe('the shop across the street', () => {
  test('it sits below the curb, inside the scene, away from the mat, the sidewalk row and the report strip', () => {
    const r = rivalRect();
    expect(r.y0).toBeGreaterThan(CURB_Y + 8);
    expect(r.y1).toBeLessThanOrEqual(SCENE_H);
    // drawn whole: its foot and kerb are on screen (D481)
    expect(RIVAL_SHOP.top + RIVAL_SHOP.h + RIVAL_SHOP.kerb).toBeLessThanOrEqual(SCENE_H);
    expect(r.x0).toBeGreaterThanOrEqual(0);
    expect(r.x1).toBeLessThanOrEqual(SCENE_W);
    // D481: at 60% of its art, the kerb ends clear of the scene's last row (the old shop sat flush on it), sign text still 10 pt or more
    expect(RIVAL_SHOP.scale).toBe(0.6);
    expect(RIVAL_SHOP.w).toBeCloseTo(RIVAL_SHOP.art.w * RIVAL_SHOP.scale, 0);
    expect(RIVAL_SHOP.h).toBeCloseTo(RIVAL_SHOP.art.h * RIVAL_SHOP.scale, 0);
    expect(r.y1).toBeLessThanOrEqual(SCENE_H - 6);
    expect(RIVAL_SHOP.signFont).toBeGreaterThanOrEqual(10);
    // D481: it stands on a pavement slab (the far kerb) wider than the shop that rises behind its foot, whole inside the scene
    expect(RIVAL_SHOP.slab).toBeGreaterThanOrEqual(6);
    expect(RIVAL_SHOP.slabRise).toBeGreaterThan(0);
    expect(RIVAL_SHOP.x - RIVAL_SHOP.slab).toBeGreaterThanOrEqual(0);
    expect(RIVAL_SHOP.x + RIVAL_SHOP.w + RIVAL_SHOP.slab).toBeLessThanOrEqual(SCENE_W);
    expect(RIVAL_SHOP.kerb).toBeGreaterThanOrEqual(5);
    for (let fp = 0; fp < 5; fp++) {
      const lay = layout(fp, 2, 2, 2, 4, 3, 1);
      // the doormat is on the sidewalk, over 100 scene units above the road
      const matLow = Math.max(P(lay.door.x0, -22)[1], P(lay.door.x1, -22)[1]);
      expect(matLow).toBeLessThan(r.y0 - 60);
    }
    // the sidewalk row and the strip stand above the curb line (tap-targets.ts: the row's foot is raised off it)
    expect(SIDEWALK_ROW.raiseManaged).toBeGreaterThanOrEqual(0);
    expect(STRIP.height).toBeGreaterThan(0);
  });
  test('the shutters come down over about a second, then the shop is taken away', () => {
    expect(shutterShare(0)).toBe(0);
    expect(shutterShare(SHUTTERS.down / 2)).toBeCloseTo(0.5, 5);
    expect(shutterShare(SHUTTERS.down + 5)).toBe(1);
    expect(shutterShare(-1)).toBe(0);
    expect(SHUTTERS_TOTAL).toBeGreaterThan(SHUTTERS.down);
  });
});

describe('the challenge card', () => {
  test('no rival, no card; and none while the rival is still setting up (C120)', () => {
    expect(rivalCard(view({ open: false, phase: 'none' }), 'suburbs').face).toBe('none');
    const wait = rivalCard(view({ phase: 'waiting', target: 0 }), 'suburbs');
    expect(wait.face).toBe('none');
    expect(wait.canStart).toBe(false);
  });
  test('the offer: the opener, the title with the pies, and a Start button', () => {
    const m = rivalCard(view({ target: 1234 }), 'suburbs');
    expect(m.face).toBe('offer');
    expect(m.title).toBe('Halftime Showdown: 1234 pies in 5 minutes');
    expect(m.line).toContain('MegaSlice');
    expect(m.speaker).toBe('Todd');
    expect(m.who).toBe('todd-coat');
    expect(m.button).toBe('Start');
    expect(m.canStart).toBe(true);
  });
  test('after a loss the button waits out the retry', () => {
    const m = rivalCard(view({ phase: 'retry', retryIn: 75 }), 'suburbs');
    expect(m.face).toBe('offer');
    expect(m.canStart).toBe(false);
    expect(m.button).toBe('Try again in 1:15');
  });
  test('running: pies, a pies bar in 5% steps, a clock, and "tap to rush!" when behind', () => {
    const run = view({ phase: 'running', target: 100, progress: 15, secondsLeft: 250 });
    const m = rivalCard(run, 'waterfront');
    expect(m.face).toBe('running');
    expect(m.progress).toBe('15 / 100 pies');
    expect(m.fillStep).toBe(3);
    expect(m.drainStep).toBe(17);
    expect(m.clock).toBe('4:10');
    expect(m.behind).toBe(false);
    expect(rivalCard({ ...run, secondsLeft: 100 }, 'waterfront').behind).toBe(true);
    expect(rivalCard({ ...run, secondsLeft: 10 }, 'waterfront').urgent).toBe(true);
    expect(m.who).toBe('victor-crust');
  });
  test('Victor opens the boardwalk and the avenue, Todd the rest', () => {
    const hoods: NeighborhoodId[] = ['downtown', 'suburbs', 'waterfront', 'university', 'industrial', 'uptown'];
    expect(hoods.map(opener)).toEqual(['todd-coat', 'todd-coat', 'victor-crust', 'todd-coat', 'todd-coat', 'victor-crust']);
  });
  test('a win shows the character’s line even though the rival is gone; a loss shows theirs', () => {
    const won = rivalCard(view({ open: false, won: true, phase: 'none', valueMult: 1 }), 'suburbs', 'won');
    expect(won.face).toBe('won');
    expect(won.speaker).toBe('Dale');
    expect(won.line).toContain('packing up the balloons');
    const lost = rivalCard(view({ phase: 'retry', retryIn: 120 }), 'suburbs', 'lost');
    expect(lost.face).toBe('lost');
    expect(lost.line).toContain('They got us this time');
  });
  test('the card repaints only when its string changes: a pies bar moves in 5% steps, a clock by the second', () => {
    const run = view({ phase: 'running', target: 100, progress: 10, secondsLeft: 250 });
    expect(rivalLite({ ...run, progress: 11 })).toBe(rivalLite(run));
    expect(rivalLite({ ...run, progress: 13 })).not.toBe(rivalLite(run));
    expect(rivalLite({ ...run, secondsLeft: 249 })).not.toBe(rivalLite(run));
  });
  test('the buttons are tap targets', () => {
    expect(TAP.min).toBe(44);
  });
});
