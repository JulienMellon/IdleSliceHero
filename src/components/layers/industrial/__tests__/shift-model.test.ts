/// <reference types="jest" />
import { SHIFTS } from '../../../../content/layers';
import { getFeature, withFeatures } from '../../../../engine/features';
import { industrialShifts, shiftView, type ShiftsState } from '../../../../engine/features/layers/industrial-shifts';
import { newGame, type GameState } from '../../../../engine/game';
import { chipPillWidth } from '../../university/layer-model';
import { layout } from '../../../scene/layout';
import { FRONT_TOP, P, sceneFrame } from '../../../scene/projection';
import { MOON, nightShape, payTag, shiftChip, shiftRows, shiftTint, whistle } from '../shift-model';

const NOW = new Date(2026, 10, 9, 9, 0, 0).getTime();
const SHIFT = SHIFTS.cycleSeconds / 3;
const plant = (index: number, into: number): GameState =>
  withFeatures([industrialShifts], () => {
    const g = newGame(NOW);
    const shops = { ...g.shops, industrial: { ...g.shops.industrial, built: true, managed: true } };
    const st: ShiftsState = { ...getFeature(g, industrialShifts), startAt: 0, at: NOW, nextAt: 99999 };
    return { ...g, shops, playSeconds: index * SHIFT + into, x: { ...g.x, [industrialShifts.key]: st } };
  });
const view = (g: GameState) => withFeatures([industrialShifts], () => shiftView(g));

describe('the shift chip', () => {
  it('shows the shift on the clock over the time to the next', () => {
    expect(shiftChip(view(plant(0, 100)))).toMatchObject({ rows: ['Day', '5:00'] });
    expect(shiftChip(view(plant(1, 399)))).toMatchObject({ rows: ['Swing', '0:01'] });
  });

  it('shows ×2 on the night shift, and says so for a screen reader', () => {
    const c = shiftChip(view(plant(2, 40)));
    expect(c.rows).toEqual(['Night ×2', '6:00']);
    expect(c.label).toContain('Shift ends 6:00');
    expect(c.label).toContain('×2');
  });

  it('fits the chip: two rows, the wider under the cap', () => {
    for (const idx of [0, 1, 2]) expect(chipPillWidth(shiftChip(view(plant(idx, 0))).rows)).toBeLessThanOrEqual(76);
  });

  it('tags only a shift that pays more', () => {
    expect([payTag(1), payTag(2), payTag(1.5)]).toEqual(['', '×2', '×1.5']);
  });
});

describe('the tint and the whistle', () => {
  it('tints the night deep blue, the swing faintly, and leaves the day clear', () => {
    expect(shiftTint('day')).toBeNull();
    expect(shiftTint('swing')?.opacity).toBeLessThan(0.15);
    const night = shiftTint('night');
    expect(night?.color).toBe('#0B1E4A');
    expect(night!.opacity).toBeGreaterThan(0.2);
    expect(night!.opacity).toBeLessThan(0.5);
  });

  it('blows the whistle with the copy: Big Sal speaks on the night', () => {
    expect(whistle('day')).toEqual({ text: 'Whistle! Day Shift is on', line: null, speaker: null });
    expect(whistle('swing')?.text).toBe('Whistle! Swing Shift is on');
    expect(whistle('night')).toMatchObject({
      text: 'Whistle! Night Shift is on',
      speaker: 'Big Sal',
      line: 'Night shift. My guys. Best pay, worst moods. Feed ’em.',
    });
    expect(whistle('lunch')).toBeNull();
  });

  it('lists the three shifts with the one on the clock marked', () => {
    const rows = shiftRows('swing', SHIFTS.shifts);
    expect(rows.map((r) => [r.name, r.now])).toEqual([
      ['Day Shift', false],
      ['Swing Shift', true],
      ['Night Shift', false],
    ]);
    expect(rows[2].effect).toBe('demand ×1.2 · pays ×2');
  });
});

describe('the night falls on the sky, not on the pizzeria (D484)', () => {
  const frontY = P(0, 0)[1];
  const roofY = P(0, 0, FRONT_TOP)[1] - 62;
  it.each([0, 1, 2, 3, 4])('at footprint %i the shop\u2019s box is cut out of the tint, inside the scene', (fp) => {
    const lay = layout(fp, 1, 1, 1, 0, 2, 0);
    const W = sceneFrame(fp).width;
    const { sky, house, path } = nightShape(lay, W, frontY, roofY);
    expect(sky.x1).toBe(W);
    expect(house.x0).toBeGreaterThanOrEqual(0);
    expect(house.x1).toBeLessThanOrEqual(W);
    expect(house.x0).toBeLessThan(lay.L);
    expect(house.x1).toBeGreaterThan(lay.R);
    // the box lies inside the tinted area, so the cut-out leaves sky on every side but the bottom
    expect(house.y0).toBeGreaterThan(sky.y0);
    expect(house.y1).toBe(sky.y1);
    expect((path.match(/M/g) ?? []).length).toBe(2);
  });
  it.each([3, 4])('the mirrored plan\u2019s box is the plain one reflected about the frame\u2019s centre, at footprint %i', (fp) => {
    const lay = layout(fp, 1, 1, 1, 0, 2, 0);
    const W = sceneFrame(fp).width;
    const plain = nightShape(lay, W, frontY, roofY).house;
    const flipped = nightShape(lay, W, frontY, roofY, true).house;
    expect(flipped.x0).toBeCloseTo(W - plain.x1, 6);
    expect(flipped.x1).toBeCloseTo(W - plain.x0, 6);
  });
  it('keeps the moon in the visible sky, clear of the roof', () => {
    expect(MOON.cx - MOON.r).toBeGreaterThan(0);
    expect(MOON.cy - MOON.r).toBeGreaterThan(20);
    expect(MOON.cy + MOON.r).toBeLessThan(roofY);
  });
});
