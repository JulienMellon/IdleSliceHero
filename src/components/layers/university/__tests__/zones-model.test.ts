/// <reference types="jest" />
import { newGame, type GameState } from '../../../../engine/game';
import { chipPillWidth, twoRows } from '../layer-model';
import { zonesView, type ZonesView } from '../../../../engine/features/layers/university-menu';
import { withFeatures } from '../../../../engine/features';
import { universityMenu } from '../../../../engine/features/layers/university-menu';
import { DRONE_MAX, DRONES_NOTE, campusChipText, campusOut, droneCount, droneLane, droneX, tripText, zoneCells } from '../zones-model';

const NOW = new Date(2026, 10, 9, 9, 0, 0).getTime();
function uni(p: { footprint: number; vehicle: number }): GameState {
  const g = newGame(NOW);
  return { ...g, vehicle: p.vehicle, shops: { ...g.shops, university: { ...g.shops.university, built: true, managed: true, footprint: p.footprint } } };
}
const view = (p: { footprint: number; vehicle: number }): ZonesView => withFeatures([universityMenu], () => zonesView(uni(p)));

describe('the zones strip', () => {
  it('shows Dorms, Library and Stadium; the Stadium is locked at the first footprint step, and says what opens it', () => {
    const cells = zoneCells(view({ footprint: 1, vehicle: 2 }));
    expect(cells.map((c) => c.name)).toEqual(['Dorms', 'Library', 'Stadium']);
    expect(cells.map((c) => c.locked)).toEqual([false, false, true]);
    expect(cells[2]).toMatchObject({ mid: 'Locked', foot: 'Expand to open' });
    // the two open zones split the demand 50 : 30 -> 63% and 38%
    expect(cells[0].mid).toMatch(/^6\d% · \d/);
    expect(cells[1].mid).toMatch(/^3\d% · \d/);
    expect(cells[0].foot).toBe('distance 1');
    expect(cells[1].foot).toBe('distance 2');
  });

  it('gives a trip that grows with distance for a car, and the same trip for every zone with drones', () => {
    const car = view({ footprint: 2, vehicle: 2 });
    const [d, l, s] = car.zones.map((z) => z.tripSeconds);
    expect(l).toBeCloseTo(2 * d, 6);
    expect(s).toBeCloseTo(3 * d, 6);
    const drone = view({ footprint: 2, vehicle: 4 });
    expect(new Set(drone.zones.map((z) => z.tripSeconds)).size).toBe(1);
    const cells = zoneCells(drone);
    expect(cells.every((c) => c.foot === DRONES_NOTE)).toBe(true);
    expect(cells.every((c) => !c.locked)).toBe(true);
  });

  it('writes trips short', () => {
    expect([tripText(0), tripText(2.4), tripText(2.449), tripText(9.96), tripText(14.6)]).toEqual(['0s', '2.4s', '2.4s', '10s', '15s']);
  });
});

describe('the chip', () => {
  it('counts the drivers out on campus, and says drones once they are the fleet', () => {
    expect(campusChipText(3, false)).toBe('3 out on campus');
    expect(campusChipText(3, true)).toBe('3 drones up');
    // G107: one drone is singular
    expect(campusChipText(1, true)).toBe('1 drone up');
    expect(campusChipText(1, false)).toBe('1 out on campus');
    expect(campusChipText(0, true)).toBe('0 drones up');
    // widest plausible: two digits; both fit the chip's 76 pt cap on two lines
    expect(chipPillWidth(twoRows(campusChipText(12, false)))).toBeLessThanOrEqual(76);
    expect(chipPillWidth(twoRows(campusChipText(12, true)))).toBeLessThanOrEqual(76);
  });

  it('counts only drivers on the university line', () => {
    const g = uni({ footprint: 0, vehicle: 2 });
    const line = { ...g.shops.university.line, departures: [{ id: 1, kind: 'driver' as const, n: 2, cash: 5, left: 3 }, { id: 2, kind: 'walkin' as const, n: 1, cash: 2, left: 1 }, { id: 3, kind: 'driver' as const, n: 2, cash: 5, left: 4 }] };
    expect(campusOut({ shops: { ...g.shops, university: { ...g.shops.university, line } } })).toBe(2);
  });
});

describe('the drone flight', () => {
  it('draws one to three drones', () => {
    expect([0, 1, 2, 3, 9].map(droneCount)).toEqual([1, 1, 2, 3, DRONE_MAX]);
  });

  it('gives each drone its own lane, speed and way, inside the sky band', () => {
    const lanes = Array.from({ length: DRONE_MAX }, (_, i) => droneLane(i));
    expect(new Set(lanes.map((l) => l.y)).size).toBe(DRONE_MAX);
    expect(new Set(lanes.map((l) => l.ms)).size).toBe(DRONE_MAX);
    expect(lanes.map((l) => l.dir)).toEqual([1, -1, 1]);
    for (const l of lanes) {
      expect(l.y).toBeGreaterThan(0.1);
      expect(l.y).toBeLessThan(0.9);
    }
  });

  it('crosses from just off one edge to just off the other, never outside that', () => {
    const right = droneLane(0);
    const left = droneLane(1);
    expect(droneX(right, 0, 393, 30)).toBe(-30);
    expect(droneX(right, 1, 393, 30)).toBe(393 + 30);
    expect(droneX(left, 0, 393, 30)).toBe(393 + 30);
    expect(droneX(left, 1, 393, 30)).toBe(-30);
    for (const p of [-1, 0.3, 2]) expect(droneX(right, p, 393, 30)).toBeGreaterThanOrEqual(-30);
  });
});
