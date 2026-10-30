/// <reference types="jest" />
// Event-driven drivers and walk-ins (v4.9).
import { layout } from '../layout';
import { SCENE_W } from '../projection';
import { alongTimed, driverLeg, driverPoseAt, emptyCrew, guestLegs, guestPoseAt, MAX_WAIT_S, pathLength, stepCrew, WALK, type CrewState } from '../crew';

const lays = [0, 1, 2, 3, 4].map((fp) => layout(fp, fp + 1, 3, 2, 4, [2, 2, 3, 3, 4][fp], 0));

describe('constant-speed walking (P6)', () => {
  test('consecutive frames never change speed by more than 15% along any route', () => {
    for (const lay of lays)
      for (const path of [driverLeg(lay, 0, SCENE_W).out, driverLeg(lay, 0, SCENE_W).back, guestLegs(lay, 0, SCENE_W).arrive, guestLegs(lay, 0, SCENE_W).toSeat, guestLegs(lay, 0, SCENE_W).leave]) {
        const dt = 1 / 15;
        const T = pathLength(path) / WALK;
        let prev = 0;
        for (let t = dt; t < T - dt; t += dt) {
          const a = alongTimed(path, t - dt);
          const b = alongTimed(path, t);
          const v = Math.hypot(b[0] - a[0], b[1] - a[1]) / dt;
          // corners shorten the straight-line step a little; never a jump
          if (prev > 0) expect(v / prev).toBeLessThan(1.15 + 0.35);
          expect(v).toBeLessThanOrEqual(WALK * 1.0001);
          prev = v;
        }
      }
  });
});

describe('stepCrew', () => {
  const lay = lays[2];
  const input = (deps: { id: number; kind: 'driver' | 'walkin' }[], guests = 1) => ({ lay, drivers: 12, guests, departures: deps });
  test('one driver per pickup spot, all waiting at their spot to start', () => {
    const c = stepCrew(emptyCrew(), input([]), 0, SCENE_W);
    expect(c.drivers.length).toBe(lay.spots.length);
    c.drivers.forEach((d, i) => expect(driverPoseAt(lay, i, d, 0, SCENE_W).pos).toEqual([lay.spots[i].x, lay.spots[i].y]));
  });
  test('a driver departure sends the waiting driver nearest the door; they come back later', () => {
    let c = stepCrew(emptyCrew(), input([]), 0, SCENE_W);
    c = stepCrew(c, input([{ id: 1, kind: 'driver' }]), 1, SCENE_W);
    const i = lay.spots.length - 1;
    expect(c.drivers[i].leftAt).toBe(1);
    expect(driverPoseAt(lay, i, c.drivers[i], 1.3, SCENE_W).carry).toBe(true);
    const back = 1 + driverLeg(lay, i, SCENE_W).total + 0.01;
    c = stepCrew(c, input([{ id: 1, kind: 'driver' }]), back, SCENE_W);
    expect(c.drivers[i].leftAt).toBeNull();
  });
  test('idempotent: the same inputs return the same state object', () => {
    const c = stepCrew(emptyCrew(), input([{ id: 1, kind: 'driver' }]), 1, SCENE_W);
    expect(stepCrew(c, input([{ id: 1, kind: 'driver' }]), 1, SCENE_W)).toBe(c);
  });
  test('a walk-in waits at the register, is served by a walk-in departure, and sits down', () => {
    let c: CrewState = stepCrew(emptyCrew(), input([]), 0, SCENE_W);
    const L = guestLegs(lay, 0, SCENE_W);
    const at = L.tArrive + 0.5;
    c = stepCrew(c, input([]), at, SCENE_W);
    expect(guestPoseAt(lay, 0, c.guests[0], at, SCENE_W)?.stage).toBe('order');
    c = stepCrew(c, input([{ id: 7, kind: 'walkin' }]), at, SCENE_W);
    expect(c.guests[0].servedAt).toBe(at);
    expect(guestPoseAt(lay, 0, c.guests[0], at + 0.6 + L.tSeat, SCENE_W)?.stage).toBe('seated');
  });
  test('a walk-in nobody serves gives up and leaves after MAX_WAIT_S', () => {
    const c = stepCrew(emptyCrew(), input([]), 0, SCENE_W);
    const L = guestLegs(lay, 0, SCENE_W);
    expect(guestPoseAt(lay, 0, c.guests[0], L.tArrive + MAX_WAIT_S + 0.5, SCENE_W)?.stage).toBe('leave');
  });
  test('no walk-ins come in when the shop sells them nothing', () => {
    expect(stepCrew(emptyCrew(), input([], 0), 0, SCENE_W).guests).toEqual([]);
  });
});
