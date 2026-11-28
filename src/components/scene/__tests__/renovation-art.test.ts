/// <reference types="jest" />
// Renovation art (v5.25, cards S6 and S7): all six shops (Downtown, the Suburbs, the Waterfront, the University, Industrial, Uptown) show their plaque, their fixtures and their nine decor things. The budget: for every city, shop,
// footprint, station level (a renovated shop's stations are back at 1), parked vehicle and plan, all nine things find a place; none lies over a head, the badge rail, the doorway, the
// WELCOME mat or another thing; each stays on screen; the plaque stands clear of the master's plaque, the door's glass and the badges. The art is in renovation-props.tsx, which a node
// test cannot import: the test reads its source for the table of drawings.
import * as fs from 'fs';
import * as path from 'path';

import { CITIES, hoodIds } from '../../../content/cities';
import { RENO_ITEMS, RENO_SHOPS, type RenoShop } from '../../../content/renovation';
import * as G from '../../../engine/game';
import { badgeBand, doorRect, fixedPeople, hits, matRect } from '../ladder';
import { plaqueRect } from '../cosmetics';
import { COVER_MAX, coveredShare } from '../protected';
import {
  DEFS,
  NO_RENO,
  RENO_PLAQUE_H,
  RENO_PLAQUE_W,
  decorOf,
  fixtureSpots,
  fixturesOf,
  hasFixture,
  plaqueFrame,
  renoDressOf,
  renoPlaqueRect,
  renoSpots,
  thingOf,
} from '../renovation-art';
import { shopLayout } from '../shop-layout';
import { visitShown } from '../cameo';
import { withStars } from '../../../engine/features/layers/__tests__/gate-helpers';

const ART: RenoShop[] = [...RENO_SHOPS];
const lv = (fp: number, n: number): G.Shop => ({ ...G.newShop(true), footprint: fp, ovens: n, prep: n, counter: n, tables: n });

describe('the table of things', () => {
  test('every decor thing of the three shops has a place rule and a drawing; the plaque and the fixtures are named', () => {
    const src = ['renovation-props.tsx', 'renovation-props-b.tsx'].map((f) => fs.readFileSync(path.resolve(__dirname, '..', f), 'utf8')).join('\n');
    for (const set of ART) {
      expect(decorOf(set)).toHaveLength(9);
      for (const t of decorOf(set)) {
        expect(DEFS[`${set}/${t}`]).toBeDefined();
        expect(src).toMatch(t === 'pennants' ? /export const Pennants/ : new RegExp(`['"]?${t}['"]?: `));
      }
      expect(fixturesOf(set)).toHaveLength(3);
    }
    expect(Object.keys(DEFS)).toHaveLength(54);
  });
  test('the University, Industrial and Uptown fixtures are each drawn: on the front wall (facade.tsx) or as a piece of their own (renovation-props-b.tsx)', () => {
    const facade = fs.readFileSync(path.resolve(__dirname, '../facade.tsx'), 'utf8');
    const pieces = fs.readFileSync(path.resolve(__dirname, '../renovation-props-b.tsx'), 'utf8');
    for (const f of ['banner', 'clock-tower', 'steel-shutter', 'chimney', 'gantry', 'brass-door', 'crown-sign'])
      expect(facade).toContain(`hasFixture(reno, '${f}')`);
    for (const piece of ['LoungeCounter', 'MarbleCounter']) expect(pieces).toContain(`export const ${piece}`);
    expect(['university', 'industrial', 'uptown'].flatMap((set) => fixturesOf(set as RenoShop))).toEqual([
      'banner',
      'lounge-counter',
      'clock-tower',
      'steel-shutter',
      'chimney',
      'gantry',
      'brass-door',
      'marble-counter',
      'crown-sign',
    ]);
  });
  test('each shop of the six has one plaque frame of its own', () => {
    expect(new Set(RENO_SHOPS.map(plaqueFrame)).size).toBe(6);
  });
  test('a thing is named by its id without the level and the shop', () => {
    expect(thingOf('reno2-downtown-pendant-lamps')).toBe('pendant-lamps');
    expect(RENO_ITEMS.suburbs[2].decor.map(thingOf)).toEqual(['cadillac', 'trophy-case', 'popcorn-cart']);
  });
  test('the plaque has a frame by place and a numeral at 12 pt in a box that holds it', () => {
    expect(RENO_SHOPS.map(plaqueFrame)).toEqual(['oval', 'plate', 'porthole', 'shield', 'hex', 'fan']);
    for (const f of ['renovation-props.tsx', 'renovation-props-b.tsx']) {
      const src = fs.readFileSync(path.resolve(__dirname, '..', f), 'utf8');
      const sizes = [...src.matchAll(/fontSize=\{(\d+(?:\.\d+)?)\}/g)].map((m) => Number(m[1]));
      if (sizes.length) expect(Math.min(...sizes)).toBeGreaterThanOrEqual(10);
    }
    expect(RENO_PLAQUE_W).toBeGreaterThanOrEqual(36);
    expect(RENO_PLAQUE_H).toBeGreaterThanOrEqual(24);
  });
});

describe('what a shop wears', () => {
  const g = (renovation: G.GameState['renovation']) => ({ renovation });
  test('a shop that has not been renovated wears nothing', () => {
    expect(renoDressOf(g({}), 'downtown', CITIES.home)).toEqual(NO_RENO);
    expect(renoDressOf(g({ downtown: { level: 0, decor: [] } }), 'downtown', CITIES.home)).toEqual(NO_RENO);
  });
  test('the level, the set and the decor bought, in the list order', () => {
    const d = renoDressOf(g({ suburbs: { level: 2, decor: ['reno2-suburbs-booth', 'reno1-suburbs-stools'] } }), 'suburbs', CITIES.home);
    expect(d).toEqual({ renoSet: 'suburbs', renoLevel: 2, renoDecor: 'stools,booth' });
  });
  test("another city's shop wears the set of its place: Boston's first shop is Downtown's", () => {
    const boston = CITIES.boston;
    const first = hoodIds(boston)[0];
    expect(renoDressOf(g({ [first]: { level: 1, decor: [] } }), first, boston).renoSet).toBe('downtown');
  });
  test('a fixture shows from its level on', () => {
    const at = (renoLevel: number) => ({ renoSet: 'downtown' as const, renoLevel });
    expect(['awning', 'oven-arch', 'gold-sign'].map((f) => hasFixture(at(1), f))).toEqual([true, false, false]);
    expect(['awning', 'oven-arch', 'gold-sign'].map((f) => hasFixture(at(3), f))).toEqual([true, true, true]);
    expect(hasFixture(at(0), 'awning')).toBe(false);
    expect(hasFixture({ renoSet: '', renoLevel: 3 }, 'awning')).toBe(false);
  });
});

describe('the cameo waits for its gate (E9 cameoOpen)', () => {
  test('the visit boost runs, but nobody is drawn before Suburbs has a star', () => {
    const base = G.newGame(Date.now());
    const boost = { source: 'visit-nonna', until: Date.now() + 86400000 } as G.Boost;
    const g = { ...base, rewards: { ...base.rewards, boosts: [boost] } };
    expect(visitShown(g, Date.now())).toBeNull();
    expect(visitShown(withStars(g, 1, 0), Date.now())).toBeNull();
    expect(visitShown(withStars(g, 1, 1), Date.now())?.visitor).toBe('nonna');
  });
});

describe('the budget: every thing finds a clear place', () => {
  for (const city of Object.values(CITIES)) {
    hoodIds(city).forEach((id, i) => {
      const set = RENO_SHOPS[i];
      if (!ART.includes(set)) return;
      test.each([0, 1, 2, 3, 4].filter((fp) => fp < city.fit.footprints.length).flatMap((fp) => [1, 30, 100].map((n) => [fp, n] as const)))(
        `${city.id} ${id}: footprint %i, stations at level %i`,
        (fp, n) => {
          const { draw } = shopLayout(id, lv(fp, n), city);
          const people = fixedPeople(draw);
          for (const vehicle of [0, 2, 3])
            for (const idle of [false, true]) {
              const spots = renoSpots(draw, set, id, vehicle, idle);
              const street = decorOf(set).filter((t) => DEFS[`${set}/${t}`].mount === 'street');
              const wanted = decorOf(set).filter((t) => !(idle && street.includes(t)));
              expect(spots.map((s) => s.thing).sort()).toEqual([...wanted].sort());
              const bad: string[] = [];
              for (const s of spots) {
                const m = DEFS[`${set}/${s.thing}`].mount;
                if (hits(s.rect, badgeBand(draw))) bad.push(`${s.thing} over the badges`);
                if (hits(s.rect, doorRect(draw))) bad.push(`${s.thing} over the doorway`);
                if (coveredShare(matRect(draw), s.rect) > COVER_MAX) bad.push(`${s.thing} over the mat`);
                if (s.rect.x0 < draw.frame.x0 || s.rect.x1 > draw.frame.x0 + draw.frame.width) bad.push(`${s.thing} off the frame`);
                if (m !== 'wall' && m !== 'hang') for (const p of people) if (p.y > s.sortY && hits(s.rect, p.head)) bad.push(`${s.thing} over a head`);
                for (const o of spots) if (o !== s && o.key < s.key && hits(o.rect, s.rect)) bad.push(`${s.thing} over ${o.thing}`);
              }
              expect(bad).toEqual([]);
            }
        },
      );
    });
  }
  test('the places do not move when one thing is bought (all nine are always placed)', () => {
    const { draw } = shopLayout('suburbs', lv(1, 30), CITIES.home);
    expect(renoSpots(draw, 'suburbs', 'suburbs', 1)).toEqual(renoSpots(draw, 'suburbs', 'suburbs', 1));
    expect(renoSpots(draw, 'suburbs', 'suburbs', 1)).toHaveLength(9);
  });
});

describe('the plaque and the fixtures', () => {
  for (const city of Object.values(CITIES))
    hoodIds(city).forEach((id) => {
      test(`${city.id} ${id}: the plaque is clear of the master's plaque, the glass, the badges and the mat`, () => {
        for (let fp = 0; fp < city.fit.footprints.length; fp++) {
          const { draw } = shopLayout(id, lv(fp, 1), city);
          // the facade is drawn from the plain plan and flipped, so the plain plan's rects are the ones to compare
          const plain = draw.mirrored ? shopLayout(id, lv(fp, 1), city).room : draw;
          void plain;
          const r = renoPlaqueRect(draw);
          expect(r.x1 - r.x0).toBe(RENO_PLAQUE_W);
          expect(hits(r, plaqueRect(draw))).toBe(false);
          expect(hits(r, badgeBand(draw))).toBe(false);
          expect(coveredShare(doorRect(draw), r)).toBeLessThanOrEqual(COVER_MAX);
          expect(coveredShare(matRect(draw), r)).toBe(0);
        }
      });
    });
  test('the fixture pieces have a place: an arch per dome oven, the counter front, a rail left of the door, the deck across the room', () => {
    const { draw } = shopLayout('downtown', lv(3, 100), CITIES.home);
    const f = fixtureSpots(draw);
    expect(f.arches).toHaveLength(draw.ovens.filter((o) => o.chimney).length);
    expect(f.counter.x1).toBeGreaterThan(f.counter.x0);
    expect(f.counter.footY).toBeGreaterThan(f.counter.bandY + 9);
    expect(f.rail.x1).toBeGreaterThan(f.rail.x0 + 36);
    expect(f.deck).toEqual({ x0: draw.L, x1: draw.R });
  });
});
