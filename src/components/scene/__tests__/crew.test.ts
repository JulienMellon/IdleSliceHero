/// <reference types="jest" />
// Event-driven drivers and walk-ins, synced with the engine's carriers (v4.9 / v5.0).
import { advanceLine, AUTOMATIC, emptyLine, LINE, type Line, type LineRates } from '../../../engine/pipeline';
import { layout } from '../layout';
import { SCENE_W } from '../projection';
import { alongDist, driverPoseAt, emptyCrew, guestPoseAt, guestSchedule, routesFor, stepCrew, WALK, type CrewState } from '../crew';

const lays = [0, 1, 2, 3, 4].map((fp) => layout(fp, fp + 1, 3, 2, 4, [2, 2, 3, 3, 4][fp], 0));
const rates = (over: Partial<LineRates> = {}): LineRates => ({ prep: 3, oven: 3, serve: 3, shop: 2.5, price: 5, walkInFraction: 0.35, tapBatch: 4, ...over });

describe('walking speed (P6)', () => {
  test('no leg walks faster than its own constant speed and none jumps between frames', () => {
    for (const lay of lays) {
      const R = routesFor(lay, SCENE_W);
      const legs: [readonly [number, number][], number][] = [
        [R.driver.toDoor.pts, R.driver.toDoor.len / LINE.departSeconds],
        [R.driver.away.pts, R.driver.speed],
        [R.driver.back.pts, R.driver.speed],
        ...R.guests.flatMap((g) => [[g.arrive.pts, g.arriveSpeed], [g.toSeat.pts, WALK], [g.leave.pts, WALK]] as [readonly [number, number][], number][]),
      ];
      for (const [pts, v] of legs) {
        const dt = 1 / 15;
        for (let d = v * dt; d < 600; d += v * dt) {
          const a = alongDist(pts, d - v * dt);
          const b = alongDist(pts, d);
          expect(Math.hypot(b[0] - a[0], b[1] - a[1])).toBeLessThanOrEqual(v * dt + 1e-6);
        }
        // the driver's walk to the door stays a believable pace on every footprint (codecritic plan #5: 0.8–1.25× is
        // the target; the door is far in the widest rooms, so allow a brisk 2×)
        expect(v).toBeLessThan(WALK * 2.1);
      }
    }
  });
});

describe('stepCrew', () => {
  const lay = lays[2];
  test('the driver waits at the pickup spot, leaves on a driver sale, reaches the door as it pays, and is back after one lap', () => {
    let c = stepCrew(emptyCrew(), { lay, walkins: false, departures: [] }, 0, SCENE_W);
    expect(driverPoseAt(lay, c.driver, 0, SCENE_W)?.pos).toEqual([lay.spots[0].x, lay.spots[0].y]);
    c = stepCrew(c, { lay, walkins: false, departures: [{ id: 1, kind: 'driver', left: LINE.departSeconds }] }, 1, SCENE_W);
    const atDoor = driverPoseAt(lay, c.driver, 1 + LINE.departSeconds - 1e-3, SCENE_W)!;
    const door = lay.door.lanes;
    expect(Math.hypot(atDoor.pos[0] - door.driverX, atDoor.pos[1] - 8)).toBeLessThan(2);
    expect(atDoor.deps).toEqual([1]);
    c = stepCrew(c, { lay, walkins: false, departures: [] }, 1 + LINE.driverLap, SCENE_W);
    expect(c.driver.leftAt).toBeNull();
  });
  test('idempotent: the same inputs return the same state object', () => {
    const c = stepCrew(emptyCrew(), { lay, walkins: true, departures: [{ id: 1, kind: 'driver', left: LINE.departSeconds }] }, 1, SCENE_W);
    expect(stepCrew(c, { lay, walkins: true, departures: [{ id: 1, kind: 'driver', left: LINE.departSeconds }] }, 1, SCENE_W)).toBe(c);
  });
  test('on a fresh mount a walk-in is already waiting at the register', () => {
    const c = stepCrew(emptyCrew(), { lay, walkins: true, departures: [] }, 5, SCENE_W);
    expect(guestPoseAt(lay, c.guests[0], 5, SCENE_W)?.stage).toBe('order');
  });
  test('after a hand-over the next walk-in reaches the register exactly one walk-in lap later', () => {
    let c = stepCrew(emptyCrew(), { lay, walkins: true, departures: [] }, 5, SCENE_W);
    c = stepCrew(c, { lay, walkins: true, departures: [{ id: 3, kind: 'walkin', left: LINE.handoffSeconds }] }, 6, SCENE_W);
    const next = c.guests.find((g) => g.servedAt === null)!;
    expect(next.start + next.arriveT).toBeCloseTo(6 + LINE.walkinLap, 6);
  });
  test('C78/T56: walk-ins stopping only stops new arrivals; nobody vanishes mid-meal; visits keep counting', () => {
    let c = stepCrew(emptyCrew(), { lay, walkins: true, departures: [] }, 5, SCENE_W);
    c = stepCrew(c, { lay, walkins: true, departures: [{ id: 3, kind: 'walkin', left: LINE.handoffSeconds }] }, 6, SCENE_W);
    const eater = c.guests.find((g) => g.servedAt !== null)!;
    const S = guestSchedule(eater, routesFor(lay, SCENE_W).guests[eater.visit % 2]);
    const mid = (S.seated + S.eaten) / 2;
    c = stepCrew(c, { lay, walkins: false, departures: [] }, mid, SCENE_W);
    expect(c.guests.some((g) => g.visit === eater.visit)).toBe(true);
    expect(guestPoseAt(lay, c.guests.find((g) => g.visit === eater.visit)!, mid, SCENE_W)?.stage).toBe('seated');
    const before = c.nextVisit;
    c = stepCrew(c, { lay, walkins: true, departures: [] }, S.done + 30, SCENE_W);
    expect(c.nextVisit).toBeGreaterThan(before);
  });
  test('T58: a driver sale while he is still out joins his trip; nothing throws and seenId advances', () => {
    let c = stepCrew(emptyCrew(), { lay, walkins: false, departures: [{ id: 1, kind: 'driver', left: LINE.departSeconds }] }, 0, SCENE_W);
    c = stepCrew(c, { lay, walkins: false, departures: [{ id: 1, kind: 'driver', left: LINE.departSeconds }, { id: 2, kind: 'driver', left: LINE.departSeconds }] }, 0.5, SCENE_W);
    expect(c.seenId).toBe(2);
    expect(c.driver.deps).toEqual([1, 2]);
  });
  test('T60: a layout without pickup spots draws no driver (no NaN)', () => {
    const bare = { ...lay, spots: [] };
    expect(driverPoseAt(bare, { leftAt: null, deps: [] }, 0, SCENE_W)).toBeNull();
  });
});

describe('G81: every sale has someone carrying it', () => {
  test('engine and scene run on one clock: each departure walking out is carried by the driver or handed to the walk-in', () => {
    for (const lay of lays)
      for (const r of [rates(), rates({ shop: 9, prep: 10, oven: 10, serve: 10 }), rates({ walkInFraction: 0 })]) {
        let line: Line = emptyLine();
        let crew: CrewState = emptyCrew();
        const walkins = r.walkInFraction > LINE.minWalkInShare;
        const dt = 1 / 15;
        for (let f = 0; f < 60 * 15; f++) {
          const t = f * dt;
          line = advanceLine(line, dt, r, AUTOMATIC).line;
          crew = stepCrew(crew, { lay, walkins, departures: line.departures }, t, SCENE_W);
          const carried = new Set<number>();
          const dp = driverPoseAt(lay, crew.driver, t, SCENE_W);
          dp?.deps.forEach((d) => carried.add(d));
          for (const g of crew.guests) guestPoseAt(lay, g, t, SCENE_W)?.deps.forEach((d) => carried.add(d));
          for (const d of line.departures) expect([lay.fp, f, d.kind, carried.has(d.id)]).toEqual([lay.fp, f, d.kind, true]);
        }
      }
  });
});
