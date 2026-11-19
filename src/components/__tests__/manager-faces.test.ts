/// <reference types="jest" />
// v5.16 (T1b): the five General Managers. The shop's badge, the drawer's hire card and the cut-scene portrait all name a manager by the id in
// MANAGERS (not a generated `<shop>-gm` face), and the five fixed looks tell the managers apart.
import type { NeighborhoodId } from '../../content/types';
import * as G from '../../engine/game';
import { drawerCards } from '../drawer-model';
import { ARM_FORE, ARM_UPPER, FEDORA, GESTURES, HAIR_FRONT, MARKER_MUSTACHE, STRANDS } from '../cutscene/figure-art';
import { POSE } from '../cutscene/staging';
import type { Pose } from '../cutscene/staging';
import { MANAGER_LOOKS, isManagerId } from '../scene/looks';
import { pathPoints } from './path-bounds';

import { MANAGERS } from '../../content/cities/home/data';
const OTHERS = (Object.keys(MANAGERS) as NeighborhoodId[]).filter((id) => id !== 'downtown');

describe('manager looks', () => {
  test('every non-Downtown manager in MANAGERS has a fixed look, and Nonna is not one of them', () => {
    for (const id of OTHERS) expect([id, isManagerId(MANAGERS[id].id)]).toEqual([id, true]);
    expect(isManagerId(MANAGERS.downtown.id)).toBe(false);
    expect(Object.keys(MANAGER_LOOKS).sort()).toEqual(OTHERS.map((id) => MANAGERS[id].id).sort());
  });

  test('no two managers share a hair style, a signature item or a shirt colour, and every hair style has art', () => {
    const looks = Object.values(MANAGER_LOOKS);
    for (const key of ['hairStyle', 'item', 'shirt', 'hair'] as const) expect([key, new Set(looks.map((l) => l[key])).size]).toEqual([key, looks.length]);
    for (const l of looks) expect(l.hairStyle in HAIR_FRONT && l.hairStyle in STRANDS).toBe(true);
  });

  test("the look lines: Deb's whistle, Skip's cap, Noor's stopwatch and bun, Dee's armband and cropped red hair, Anton's napkin and silver hair", () => {
    expect(MANAGER_LOOKS.deb).toMatchObject({ item: 'whistle', hairStyle: 'perm' });
    expect(MANAGER_LOOKS.skip).toMatchObject({ item: 'purser-cap', hair: '#F4F1EC' });
    expect(MANAGER_LOOKS.noor).toMatchObject({ item: 'stopwatch', hairStyle: 'bun', hair: '#1B1414' });
    expect(MANAGER_LOOKS.dee).toMatchObject({ item: 'armband', hairStyle: 'crop' });
    expect(MANAGER_LOOKS.anton).toMatchObject({ item: 'napkin', hairStyle: 'slick' });
    const red = (h: string) => parseInt(h.slice(1, 3), 16) > 150 && parseInt(h.slice(3, 5), 16) < 100;
    expect(red(MANAGER_LOOKS.dee.hair)).toBe(true);
  });
});

describe('the shop and the drawer use the manager id', () => {
  test("the drawer's hire card draws the manager's face by MANAGERS id, never `<shop>-gm`", () => {
    for (const id of OTHERS) {
      const game: G.GameState = { ...G.newGame(0), cash: 0 };
      const withShop = { ...game, shops: { ...game.shops, [id]: { ...game.shops[id], built: true, managed: false } } };
      const card = drawerCards({ game: withShop, id }).cards.find((c) => c.key === 'manager')!;
      expect([id, card.icon]).toEqual([id, { t: 'gm', name: MANAGERS[id].id }]);
    }
  });
});

describe('what a manager wears on an arm follows the arm', () => {
  const leftArm = (pose: Pose) => `M${GESTURES[pose].arms.split('M').filter(Boolean)[0]}`;
  /** Distance from a point to the arm's centre-line (its sampled polyline). */
  const dist = (pose: Pose, x: number, y: number) => {
    const pts = pathPoints(leftArm(pose));
    let best = Infinity;
    for (let i = 0; i + 1 < pts.length; i++) {
      const [ax, ay] = pts[i];
      const [bx, by] = pts[i + 1];
      const t = Math.max(0, Math.min(1, ((x - ax) * (bx - ax) + (y - ay) * (by - ay)) / ((bx - ax) ** 2 + (by - ay) ** 2 || 1)));
      best = Math.min(best, Math.hypot(x - (ax + t * (bx - ax)), y - (ay + t * (by - ay))));
    }
    return best;
  };

  test('the armband and the napkin sit on the left arm of every pose (within 1.5 units of its centre-line)', () => {
    const poses = Object.keys(GESTURES) as Pose[];
    expect(Object.keys(ARM_UPPER).sort()).toEqual([...poses].sort());
    expect(Object.keys(ARM_FORE).sort()).toEqual([...poses].sort());
    for (const pose of poses) {
      for (const [name, spot] of [
        ['upper', ARM_UPPER[pose]],
        ['fore', ARM_FORE[pose]],
      ] as const)
        expect([pose, name, dist(pose, spot.x, spot.y) <= 1.5]).toEqual([pose, name, true]);
    }
  });

  test('the poses a mood picks for them are among those covered', () => {
    for (const pose of Object.values(POSE)) expect(ARM_UPPER[pose]).toBeDefined();
  });
});

describe("Mr. Smith's mustache", () => {
  test('is one thick, uneven stroke, off the face centre, between the nose (y 55) and the mouth (y 58 to 64)', () => {
    const pts = pathPoints(MARKER_MUSTACHE.stroke + MARKER_MUSTACHE.tail);
    const xs = pts.map(([x]) => x);
    const ys = pts.map(([, y]) => y);
    expect(MARKER_MUSTACHE.width).toBeGreaterThanOrEqual(3.5); // 100-box units: 5 px on the stage figure, 2 px on a 56 px bust
    expect((Math.min(...xs) + Math.max(...xs)) / 2).toBeGreaterThan(51.5); // off-centre
    expect(Math.max(...ys) - Math.min(...ys)).toBeGreaterThan(3); // wobbles
    expect(Math.min(...ys)).toBeGreaterThan(52);
    expect(Math.max(...ys)).toBeLessThan(62);
  });
});

describe("Todd's fedora", () => {
  test('its brim stays inside the face box (head x 20 to 80), so no panel edge or neighbour is covered', () => {
    const { cx, rx } = FEDORA.brim;
    expect(cx - rx).toBeGreaterThanOrEqual(20);
    expect(cx + rx).toBeLessThanOrEqual(80);
  });
});
