/// <reference types="jest" />
import { GAME_DAY } from '../../../../content/layers';
import type { GameDayView } from '../../../../engine/features/layers/suburbs-gameday';
import { layout } from '../../../scene/layout';
import { SEAT } from '../../../scene/layout';
import { P, SCENE_W } from '../../../scene/projection';
import {
  WAVE, arrived, chairsOf, familiesFor, freeChairs, gameDayBanner, gameDayChipShown, gameDayChipText, gameDayPopText, glowing, waveFigures, waveGap, walkLength, walkTime, spreadGap, FAMILY_AIR, FAMILY_SEATS,
} from '../gameday-model';

const view = (o: Partial<GameDayView> = {}): GameDayView => ({ active: true, rush: false, nextIn: 187, left: 0, seatsFree: 16, seats: 32, ...o });
const lay = (tables = 4, fp = 1) => layout(fp, 2, 2, 2, tables, 3, 1);

describe('the chip and the banner', () => {
  test('the chip counts down to the next game, then the rush', () => {
    expect(gameDayChipText(view())).toBe('Game Day 3:07');
    expect(gameDayChipText(view({ rush: true, left: 31, nextIn: 450 }))).toBe('Game Day 0:31');
    expect(gameDayChipText(view({ active: false }))).toBe('');
  });
  test('it shows beside the Suburbs shop, and anywhere during the rush', () => {
    expect(gameDayChipShown(view(), 'suburbs')).toBe(true);
    expect(gameDayChipShown(view(), 'downtown')).toBe(false);
    expect(gameDayChipShown(view({ rush: true }), 'downtown')).toBe(true);
    expect(gameDayChipShown(view({ active: false, rush: true }), 'suburbs')).toBe(false);
  });
  test('the banner is only for the rush', () => {
    expect(gameDayBanner(view())).toBe('');
    expect(gameDayBanner(view({ rush: true }))).toBe('Game Day! Fill every seat!');
  });
  test('the pop says what the rush sold', () => {
    expect(gameDayPopText(1000, 1250, 4)).toBe('+$1K from Game Day');
    expect(gameDayPopText(1000, 900, 4)).toBe('+$0 from Game Day');
  });
});

describe('free seats', () => {
  test('every table has two chairs, the right-hand ones first', () => {
    const l = lay(4);
    const chairs = chairsOf(l, 0);
    expect(chairs).toHaveLength(2 * l.tables.length);
    l.tables.forEach((t, i) => expect(chairs[i].x).toBe(t.x + SEAT));
    expect(chairs[l.tables.length].x).toBe(l.tables[0].x - SEAT);
  });
  test('the patio adds its chairs, no more than the room has', () => {
    const l = lay(4, 3);
    expect(chairsOf(l, 2)).toHaveLength(2 * (l.tables.length + l.patio.length));
    expect(chairsOf(l, 99)).toHaveLength(2 * (l.tables.length + l.patio.length));
    expect(chairsOf(l, -1)).toHaveLength(2 * l.tables.length);
  });
  test('the free chairs follow the free share of the seats', () => {
    expect(freeChairs(8, { seatsFree: 16, seats: 32 })).toBe(4);
    expect(freeChairs(8, { seatsFree: 32, seats: 32 })).toBe(8);
    expect(freeChairs(8, { seatsFree: 1, seats: 32 })).toBe(1);
    expect(freeChairs(8, { seatsFree: 0, seats: 32 })).toBe(0);
    expect(freeChairs(0, { seatsFree: 5, seats: 32 })).toBe(0);
  });
  test('a family fills two chairs when it arrives; the glow never goes below zero', () => {
    const l = lay(4, 1);
    const walk = walkTime(l);
    const fam = familiesFor(16, l);
    expect(fam).toBe(Math.ceil(16 / FAMILY_SEATS));
    expect(glowing(8, 0, fam, l)).toBe(8);
    expect(arrived(walk - 0.1, fam, l)).toBe(0);
    expect(arrived(walk, fam, l)).toBe(1);
    expect(glowing(8, walk, fam, l)).toBe(7);
    expect(glowing(8, GAME_DAY.rushSeconds, fam, l)).toBe(0);
    expect(familiesFor(0, l)).toBe(0);
    // a rush has room for only so many families at this gap
    expect(familiesFor(10_000, l)).toBe(Math.floor((GAME_DAY.rushSeconds - walk) / waveGap(l)) + 1);
    // the families come spread over the rush, the last one arriving as it ends
    const spread = spreadGap(l, 4);
    expect(spread).toBeCloseTo((GAME_DAY.rushSeconds - walk) / 4, 5);
    expect(3 * spread + walk).toBeLessThanOrEqual(GAME_DAY.rushSeconds + 1e-9);
  });
});

describe('the wave', () => {
  test('families walk at one pace; the gap keeps the next adult clear of the last child', () => {
    const near = lay(4, 0);
    const far = lay(4, 4);
    expect(walkLength(far)).toBeLessThan(walkLength(near));
    expect(walkTime(far)).toBeLessThan(walkTime(near));
    for (const l of [near, far]) {
      expect(waveGap(l) * WAVE.speed).toBeGreaterThanOrEqual(WAVE.kidLag + FAMILY_AIR - 0.01);
      expect(waveGap(l)).toBeGreaterThanOrEqual(walkTime(l) / WAVE.maxGroups - 1e-9);
    }
  });
  test('families appear one gap apart and never more than maxGroups at once', () => {
    const l = lay(6, 0);
    const gap = spreadGap(l, 28);
    let peak = 0;
    for (let t = 0; t <= GAME_DAY.rushSeconds; t += 1 / 15) peak = Math.max(peak, waveFigures(l, t, 28, t).length / 2);
    expect(peak).toBeLessThanOrEqual(WAVE.maxGroups);
    expect(peak).toBeGreaterThanOrEqual(2);
    expect(waveFigures(l, 0, 28, 0)).toHaveLength(2);
    expect(waveFigures(l, gap + 0.01, 28, 0)).toHaveLength(4);
    expect(waveFigures(l, 10, 0, 0)).toHaveLength(0);
  });
  test('each family is an adult and a smaller child, walking in from beyond the right edge toward the door', () => {
    const l = lay(4, 1);
    const [adult, kid] = waveFigures(l, 0.1, 5, 0);
    expect(kid.props.scale).toBe(WAVE.kidScale);
    expect(P(adult.x, adult.y)[0]).toBeGreaterThan(SCENE_W);
    expect(kid.x).toBeGreaterThan(adult.x);
    const [later] = waveFigures(l, 3, 5, 0);
    expect(later.x).toBeLessThan(adult.x);
    expect(later.props.flip).toBe(true);
  });
  test('a family fades at the door and is gone after its walk', () => {
    const l = lay(4, 1);
    const walk = walkTime(l);
    const end = waveFigures(l, walk - 0.05, 1, 0);
    expect(end[0].props.o).toBeLessThan(0.2);
    expect(end[0].y).toBeGreaterThan(WAVE.laneY);
    expect(end[0].y).toBeLessThanOrEqual(WAVE.doorY + 1);
    expect(waveFigures(l, walk + 0.01, 1, 0)).toHaveLength(0);
  });
});
