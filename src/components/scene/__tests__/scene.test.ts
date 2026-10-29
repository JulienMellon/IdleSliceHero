/// <reference types="jest" />
import { BACK_ROW_Y, FRONT_ROW_Y, LEDGE_Y, ROOM_W, SEAT, STOOL_Y, layout, type Layout } from '../layout';
import { pickAvoid, seatPalette } from '../palette';
import { DRIVER_PAYOUT, along, driverPhase, driverPose, guestPose, payoutCrossed } from '../timelines';

const SCENE_W = 393;
const DRIVER_SLOTS = [2, 2, 3, 3, 4];

/** Every combination of shop size and visible staff the scene can show. */
function* allLayouts(): Generator<[string, Layout]> {
  for (let fp = 0; fp < ROOM_W.length; fp++)
    for (const ovens of [1, 2, 3, 4, 6])
      for (const cooks of [1, 2, 3])
        for (const staff of [1, 2])
          for (const tables of [1, 2, 3, 4, 6, 8])
            for (const plants of [0, 1, 3]) yield [`fp${fp} o${ovens} c${cooks} s${staff} t${tables} p${plants}`, layout(fp, ovens, cooks, staff, tables, DRIVER_SLOTS[fp], plants)];
}

describe('layout invariants (T1)', () => {
  test('stations sit inside the room, left to right: prep, ovens, counter, door', () => {
    for (const [name, lay] of allLayouts()) {
      const ctx = `${name}: ${JSON.stringify({ prep: lay.prep, cols: lay.ovenCols, counter: lay.counter, door: lay.door })}`;
      expect([ctx, lay.prep.x0 >= lay.L]).toEqual([ctx, true]);
      expect([ctx, lay.ovenCols[0].x0 > lay.prep.x1]).toEqual([ctx, true]);
      expect([ctx, lay.counter.x0 > lay.ovenCols[lay.ovenCols.length - 1].x1]).toEqual([ctx, true]);
      expect([ctx, lay.door.x0 > lay.counter.x0 && lay.door.x1 <= lay.R]).toEqual([ctx, true]);
    }
  });
  test('tables stay in the room and no two chairs overlap', () => {
    for (const [name, lay] of allLayouts()) {
      const chairs = lay.tables.flatMap((t) => [
        { x: t.x - SEAT, y: t.y },
        { x: t.x + SEAT, y: t.y },
      ]);
      for (const c of chairs) expect([name, c.x > lay.L + 10 && c.x < lay.R - 10]).toEqual([name, true]);
      for (let a = 0; a < chairs.length; a++)
        for (let b = a + 1; b < chairs.length; b++) {
          const close = Math.abs(chairs[a].x - chairs[b].x) < 16 && Math.abs(chairs[a].y - chairs[b].y) < 20;
          expect([name, a, b, close]).toEqual([name, a, b, false]);
        }
    }
  });
  test('back-row diners sit right of the prep bench so heads never poke into it', () => {
    for (const [name, lay] of allLayouts())
      for (const t of lay.tables.filter((tb) => tb.y === BACK_ROW_Y)) expect([name, t.x - SEAT > lay.prep.x1]).toEqual([name, true]);
  });
  test('a lone table is the starter, and the front row fills first', () => {
    for (const [name, lay] of allLayouts()) {
      if (lay.tables.length === 1) continue;
      const firstBack = lay.tables.findIndex((t) => t.y === BACK_ROW_Y);
      if (firstBack >= 0) expect([name, lay.tables.slice(0, firstBack).every((t) => t.y === FRONT_ROW_Y)]).toEqual([name, true]);
    }
  });
  test('bakers stand clear of the counter, and only the counter-side one is flagged', () => {
    for (const [name, lay] of allLayouts()) {
      expect(lay.bakers.length).toBeGreaterThanOrEqual(1);
      for (const b of lay.bakers) expect([name, b.x <= lay.counter.x0 - 26]).toEqual([name, true]);
      expect(lay.bakers.filter((b) => b.nearCounter).length).toBe(lay.bakers.length > 1 ? 1 : 0);
    }
  });
});

describe('door lanes (T2)', () => {
  test('guest and driver lanes are ≥ 20 apart and both inside the doorway', () => {
    for (const [name, lay] of allLayouts()) {
      const { guestX, driverX } = lay.door.lanes;
      expect([name, driverX - guestX >= 20]).toEqual([name, true]);
      for (const x of [guestX, driverX]) expect([name, x > lay.door.x0 + 6 && x < lay.door.x1 - 4]).toEqual([name, true]);
    }
  });
});

describe('window bar (T3)', () => {
  test('the ledge and stools never overlap a front-row chair, and stop short of the door', () => {
    let seen = 0;
    for (const [name, lay] of allLayouts()) {
      if (!lay.ledge) continue;
      seen++;
      expect([name, lay.ledge.x1 <= lay.door.x0 - 10]).toEqual([name, true]);
      for (const t of lay.tables.filter((tb) => Math.abs(tb.y - LEDGE_Y) < 20 || Math.abs(tb.y - STOOL_Y) < 20))
        if (t.y < 20) expect([name, t.x + SEAT + 8 <= lay.ledge.x0]).toEqual([name, true]);
    }
    expect(seen).toBeGreaterThan(0);
  });
});

describe('seat colours (T4)', () => {
  test('diners, companions and walk-ins at neighbouring tables never share a shirt or hair colour', () => {
    for (let shirtBase = 0; shirtBase < 9; shirtBase++)
      for (let hairBase = 0; hairBase < 6; hairBase++)
        for (const n of [2, 4, 6, 8]) {
          const pal = seatPalette(shirtBase, hairBase, 9, 6, n);
          for (let i = 0; i < n; i++) {
            const near = [i - 1, i, i + 1].filter((j) => j >= 0 && j < n);
            if (i + 1 < n) {
              expect(pal.shirt(i)).not.toBe(pal.shirt(i + 1));
              expect(pal.hair(i)).not.toBe(pal.hair(i + 1));
            }
            expect(pal.companionShirt(i)).not.toBe(pal.shirt(i));
            expect(pal.companionHair(i)).not.toBe(pal.hair(i));
            for (let lap = 0; lap < 4; lap++) {
              const ws = pal.walkShirt(i, lap);
              for (const j of near) expect([ws === pal.shirt(j), ws === pal.companionShirt(j)]).toEqual([false, false]);
            }
          }
        }
  });
  test('pickAvoid skips used colours and falls back to the start when all are used', () => {
    expect(pickAvoid(2, 5, [2, 3])).toBe(4);
    expect(pickAvoid(4, 5, [4, 0])).toBe(1);
    expect(pickAvoid(7, 3, [0, 1, 2])).toBe(1);
  });
});

describe('along (T5)', () => {
  const path: [number, number][] = [
    [0, 0],
    [10, 0],
    [10, 10],
  ];
  test('clamps to the ends and interpolates by length', () => {
    expect(along(path, -1)).toEqual([0, 0]);
    expect(along(path, 0)).toEqual([0, 0]);
    expect(along(path, 0.5)).toEqual([10, 0]);
    expect(along(path, 0.75)).toEqual([10, 5]);
    expect(along(path, 1)).toEqual([10, 10]);
    expect(along(path, 2)).toEqual([10, 10]);
  });
  test('zero-length segments and single points do not produce NaN', () => {
    const p = along(
      [
        [3, 3],
        [3, 3],
        [3, 3],
      ],
      0.5,
    );
    expect(p).toEqual([3, 3]);
  });
});

describe('driver and walk-in timelines (T6)', () => {
  const lay = layout(2, 3, 2, 2, 6, DRIVER_SLOTS[2], 0);
  test('the payout fires exactly once per lap per driver', () => {
    const n = 4;
    let prev: number[] = [];
    let fires = 0;
    for (let f = 0; f <= 15 * 60; f++) {
      const t = f / 15;
      const next = Array.from({ length: n }, (_, i) => driverPhase(i, n, t * 1.5, 0.01 * i));
      // count per-driver crossings
      for (let i = 0; i < n; i++) if (payoutCrossed([prev[i] ?? NaN].map((x) => x) as number[], [next[i]])) fires++;
      prev = next;
    }
    // 60 s at pace 1.5, 6 s per lap → 15 laps each
    expect(fires).toBeGreaterThanOrEqual(n * 14);
    expect(fires).toBeLessThanOrEqual(n * 15);
    expect(payoutCrossed([0.9], [0.1])).toBe(false); // wrap-around is not a payout
    expect(payoutCrossed([DRIVER_PAYOUT - 0.01], [DRIVER_PAYOUT])).toBe(true);
  });
  test('drivers sharing a pickup spot never stand on it at the same time', () => {
    for (const n of [2, 3, 4, 5, 6]) {
      const drivers = Math.min(n, lay.spots.length * 3);
      for (let f = 0; f < 600; f++) {
        const t = f / 15;
        const standing = Array.from({ length: drivers }, (_, i) => driverPose(lay, i, driverPhase(i, drivers, t, (i * 7) % 4 / 100), SCENE_W)).filter((d) => !d.walking);
        for (let a = 0; a < standing.length; a++)
          for (let b = a + 1; b < standing.length; b++) expect(Math.hypot(standing[a].pos[0] - standing[b].pos[0], standing[a].pos[1] - standing[b].pos[1])).toBeGreaterThan(10);
      }
    }
  });
  test('walk-ins reach their chair from the aisle behind the table, not through it', () => {
    for (let i = 0; i < 4; i++) {
      const table = lay.tables[i];
      for (let k = 0; k <= 40; k++) {
        const g = guestPose(lay, i, 0.42 + (0.08 * k) / 40, SCENE_W);
        // while walking to the seat, a guest is never in front of the table's depth within its width
        const overTable = Math.abs(g.pos[0] - table.x) < SEAT - 6 && g.pos[1] < table.y + 6;
        expect(overTable).toBe(false);
      }
      expect(guestPose(lay, i, 0.6, SCENE_W).stage).toBe('seated');
    }
  });
});

describe('walk-ins keep clear of the pickup line (D255)', () => {
  test('a walk-in never passes in front of a standing driver', () => {
    for (const [name, lay] of allLayouts()) {
      const n = Math.min(4, Math.ceil(lay.tables.length / 2));
      for (let i = 0; i < n; i++)
        for (let k = 0; k <= 100; k++) {
          const g = guestPose(lay, i, 0.42 + (0.08 * k) / 100, SCENE_W);
          const h = guestPose(lay, i, 0.8 + (0.08 * k) / 100, SCENE_W);
          for (const pos of [g.pos, h.pos])
            for (const sp of lay.spots) {
              const inFront = Math.abs(pos[0] - sp.x) < 12 && pos[1] < sp.y && pos[1] > sp.y - 24;
              expect([name, i, inFront]).toEqual([name, i, false]);
            }
        }
    }
  });
});

describe('payout edge with changing driver counts (T9)', () => {
  test('no payout when the number of drivers changes between frames', () => {
    expect(payoutCrossed([0.5, 0.1], [0.56, 0.2, 0.9])).toBe(false);
    expect(payoutCrossed([], [0.6])).toBe(false);
    expect(payoutCrossed([0.5, 0.53], [0.52, 0.55])).toBe(true);
  });
});
