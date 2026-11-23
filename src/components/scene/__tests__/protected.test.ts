/// <reference types="jest" />
// Q8: nothing opaque covers the WELCOME mat, the entrance or a station worker's face. For every city, neighbourhood, footprint, managed or not (a managed shop draws the
// street props; an unmanaged one has the taller hire stack), plan (the mirrored shops are in the data) and phone size, no fixed scene cover (parked vehicles, the
// A-frame, the neighbourhood prop, the patio, the cosmetics, the report strip and the sidewalk row) lies over more than 10% of a protected rect (protected.ts).
import { CITIES, hoodIds } from '../../../content/cities';
import * as G from '../../../engine/game';
import { COVER_MAX, coverFindings, coveredShare, protectedRects, protectedScene, sceneCovers, type CoverInputs } from '../protected';
import { P, sceneView } from '../projection';
import { shopLayout } from '../shop-layout';
import { stripTop } from '../strip-clear';

const shopAt = (footprint: number): G.Shop => ({ ...G.newShop(true), footprint, ovens: 100, prep: 100, counter: 100, tables: 100 });
// the phones the game runs on, as the area the scene gets: the screen less the HUD and the shop tabs above it (178 pt in the screenshots; src/app/index.tsx sceneArea). The fit is
// then set by the width (the SE 0.95, the standard 1.0) or, on the Max, by the height (1.11): the scene never fits larger than that, so the strip never sits higher than this.
const CHROME = 178;
const SCREENS: [number, number][] = [
  [375, 667 - CHROME],
  [393, 852 - CHROME],
  [430, 932 - CHROME],
];

interface Case {
  name: string;
  lay: ReturnType<typeof shopLayout>['draw'];
  frameOf: ReturnType<typeof shopLayout>['room']['frame'];
  inputs: CoverInputs[];
}
const cases: Case[] = [];
for (const city of Object.values(CITIES)) {
  for (const id of hoodIds(city)) {
    for (let fp = 0; fp < city.fit.footprints.length; fp++) {
      const { room, draw } = shopLayout(id, shopAt(fp), city);
      const inputs: CoverInputs[] = [];
      for (const idleShop of [false, true])
        for (let vehicle = 0; vehicle < city.fit.vehicles.length; vehicle++)
          for (const [w, h] of SCREENS) inputs.push({ id, vehicle, idleShop, s: sceneView(w, h, room.frame).fit.s, h });
      cases.push({ name: `${city.id} ${id} footprint ${fp}${room.mirrored ? ' mirrored' : ''}`, lay: draw, frameOf: room.frame, inputs });
    }
  }
}

describe('the protected elements are never covered (Q8)', () => {
  test('there are cases to check: both cities, every footprint, both plans', () => {
    expect(cases.length).toBeGreaterThanOrEqual(30);
    expect(cases.some((c) => c.name.endsWith('mirrored'))).toBe(true);
    expect(new Set(cases.map((c) => c.name.split(' ')[0]))).toEqual(new Set(Object.keys(CITIES)));
  });
  test.each(cases.map((c) => [c.name, c] as const))('%s', (_name, c) => {
    const bad: string[] = [];
    for (const inp of c.inputs)
      for (const f of coverFindings(c.lay, inp))
        bad.push(
          `${f.coverId} covers ${f.protectedId} by ${(f.share * 100).toFixed(0)}% (${inp.idleShop ? 'unmanaged' : 'managed'}, vehicle ${inp.vehicle}, s ${inp.s.toFixed(2)})`,
        );
    expect([...new Set(bad)]).toEqual([]);
  });
});

describe('the rule itself', () => {
  const { draw } = shopLayout('downtown', shopAt(2), CITIES.home);
  test('a shop has the mat, the door and a face for every cook, baker and counter worker', () => {
    const ids = protectedScene(draw).map((r) => r.id);
    expect(ids.filter((i) => i === 'mat')).toHaveLength(1);
    expect(ids.filter((i) => i === 'door')).toHaveLength(1);
    expect(ids.filter((i) => i === 'face-cook')).toHaveLength(draw.cooks.length);
    expect(ids.filter((i) => i === 'face-baker')).toHaveLength(draw.bakers.length);
    expect(ids.filter((i) => i === 'face-counter')).toHaveLength(draw.staff.length);
  });
  test('a cover on the mat is found (the deliberate regression: the parked van moved onto the mat)', () => {
    const inp: CoverInputs = { id: 'downtown', vehicle: 3, idleShop: false, s: 1, h: 676 };
    expect(coverFindings(draw, inp)).toEqual([]);
    const [mx, my] = P((draw.door.x0 + draw.door.x1) / 2, -14);
    const onMat = { ...draw, scooter: { x: (draw.door.x0 + draw.door.x1) / 2, y: -14 } };
    expect(mx).toBeGreaterThan(0);
    expect(my).toBeGreaterThan(0);
    const found = coverFindings(onMat, inp);
    expect(found.some((f) => f.protectedId === 'mat' && f.coverId === 'vehicle')).toBe(true);
  });
  test('the strip lowers onto the mat on a screen too small for it (the strip is a cover)', () => {
    const covers = sceneCovers(draw, { id: 'downtown', vehicle: 0, idleShop: false, s: 1, h: 676 });
    expect(covers.find((c) => c.id === 'strip')!.y0).toBe(stripTop(1, false));
  });
  test("an unmanaged shop's strip stands at the top of the area, clear of the mat and the door at every fit (it cannot fit between the mat and the hire stack)", () => {
    for (const [s, h] of [
      [0.95, 489],
      [1, 676],
      [1.11, 754],
    ]) {
      const inp: CoverInputs = { id: 'downtown', vehicle: 0, idleShop: true, s, h };
      expect(coverFindings(draw, inp).filter((f) => f.coverId === 'strip')).toEqual([]);
    }
  });
  test('the share is the covered part of the protected rect, 0 for rects that only touch', () => {
    const a = { x0: 0, y0: 0, x1: 10, y1: 10 };
    expect(coveredShare(a, { x0: 5, y0: 0, x1: 20, y1: 10 })).toBeCloseTo(0.5);
    expect(coveredShare(a, { x0: 10, y0: 0, x1: 20, y1: 10 })).toBe(0);
    expect(COVER_MAX).toBe(0.1);
  });
  test('the page rects are the scene rects through the fit, the scroll and the origin', () => {
    const fit = { s: 2, ox: 5, oy: 7 };
    const [mat] = protectedScene(draw);
    const [pm] = protectedRects(draw, fit, 10, { x: 100, y: 200 });
    expect(pm.id).toBe('mat');
    expect(pm.x0).toBeCloseTo(100 + 5 + (mat.x0 - draw.frame.x0) * 2 - 10);
    expect(pm.y0).toBeCloseTo(200 + 7 + mat.y0 * 2);
  });
});
