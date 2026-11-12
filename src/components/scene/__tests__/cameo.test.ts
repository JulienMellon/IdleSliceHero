/// <reference types="jest" />
// The day-30 visitor's cameo (v5.15, S1): who is in the shop, the tag, the line schedule and a budget on where it all stands.
import { CAMEO, CAMEO_NONNA_LINES } from '../../../content/heads';
import { FOOTPRINTS, NEIGHBORHOODS } from '../../../content/tuning';
import { VISITORS } from '../../../content/rewards';
import { SAY_MAX_CHARS, TAG_H, VISITOR_LOOK, cameoGeom, sayHeight, sayLines, cameoSpot, linesOf, tagWidth, visitLine, visitOf, visitTag } from '../cameo';
import { candidates, fixedPeople, hits, obstacles } from '../ladder';
import { layout } from '../layout';
import { BUBBLE_AIR, bubbleWalls, bubbleWidth, bubbleX } from '../moments';
import { SCENE_W } from '../projection';

const NOW = 1_800_000_000_000;
const DAY = 86_400_000;
const DS = [2, 2, 3, 3, 4];
const shopAt = (fp: number, staff: number) => layout(fp, FOOTPRINTS[fp].ovenSlots, fp === 0 ? 2 : 3, staff, 8, DS[fp], 1);

describe('who is visiting', () => {
  test('the running day-30 visit names the visitor and its time left', () => {
    const v = visitOf([{ source: 'visit-nonna', until: NOW + 7 * DAY }], NOW)!;
    expect(v.visitor).toBe('nonna');
    expect(v.name).toBe('Nonna Rosa');
    expect(v.left).toBe(7 * 86_400);
  });
  test('later cycles show that cycle’s visitor, the one the rewards engine names', () => {
    for (const id of VISITORS) expect(visitOf([{ source: `visit-${id}`, until: NOW + DAY }], NOW)?.visitor).toBe(id);
    expect(visitOf([{ source: 'visit-big-sal', until: NOW + DAY }], NOW)?.name).toBe('Big Sal');
    expect(visitOf([{ source: 'visit-genevieve', until: NOW + DAY }], NOW)?.name).toBe('Genevieve');
  });
  test('nobody once the boost ends, for other boosts and for an unknown visitor', () => {
    expect(visitOf([], NOW)).toBeNull();
    expect(visitOf([{ source: 'visit-nonna', until: NOW }], NOW)).toBeNull();
    expect(visitOf([{ source: 'gift-day-7', until: NOW + DAY }, { source: 'booster', until: NOW + DAY }], NOW)).toBeNull();
    expect(visitOf([{ source: 'visit-mickey', until: NOW + DAY }], NOW)).toBeNull();
  });
});

describe('the tag', () => {
  test('days and hours, then hours and minutes, then minutes (rounded up)', () => {
    expect(visitTag(7 * 86_400)).toBe('7d 0h');
    expect(visitTag(6 * 86_400 + 4 * 3600 + 59)).toBe('6d 4h');
    expect(visitTag(5 * 3600 + 12 * 60)).toBe('5h 12m');
    expect(visitTag(42 * 60 - 5)).toBe('42m');
    expect(visitTag(3)).toBe('1m');
    expect(visitTag(0)).toBe('1m');
  });
});

describe('the lines', () => {
  test('Nonna has her six; the others the line they gave on the gift card', () => {
    expect(linesOf('nonna')).toEqual(CAMEO_NONNA_LINES);
    expect(linesOf('nonna')).toHaveLength(6);
    expect(linesOf('big-sal')).toHaveLength(1);
    expect(linesOf('genevieve')).toHaveLength(1);
  });
  test('one line every period, up for a few seconds, the six in turn', () => {
    const per = CAMEO.everySeconds;
    const said: string[] = [];
    for (let slot = 0; slot < 6; slot++) {
      const t = slot * per;
      expect(visitLine('nonna', t + CAMEO.firstAfter - 0.1)).toBeNull();
      const line = visitLine('nonna', t + CAMEO.firstAfter)!;
      expect(visitLine('nonna', t + CAMEO.firstAfter + CAMEO.lineSeconds - 0.1)).toBe(line);
      expect(visitLine('nonna', t + CAMEO.firstAfter + CAMEO.lineSeconds)).toBeNull();
      said.push(line);
    }
    expect(new Set(said).size).toBe(6);
    // "every few minutes", not constantly
    expect(per).toBeGreaterThanOrEqual(120);
    expect(per).toBeLessThanOrEqual(300);
    expect(CAMEO.lineSeconds).toBeLessThan(per / 10);
  });
  test('every visitor has a look', () => {
    for (const id of VISITORS) expect(VISITOR_LOOK[id]).toBeDefined();
  });
});

describe('where the visitor stands (budget)', () => {
  test('at every footprint and counter crew: clear of the cashiers, and the tag and the line stay in the walls, off the badges, the doorway and the wall props', () => {
    for (let fp = 0; fp < FOOTPRINTS.length; fp++)
      for (const staff of [1, 2, 3])
        for (const tagText of ['7d 0h', '6d 23h', '5h 12m']) {
          const lay = shopAt(fp, staff);
          const g = cameoGeom(lay, tagText);
          // a body's width apart from every cashier
          for (const sx of lay.staff) expect(Math.abs(sx - g.spot.x)).toBeGreaterThanOrEqual(24);
          expect(g.spot).toEqual(cameoSpot(lay));
          // by the counter: inside its span
          expect(g.spot.x).toBeGreaterThan(lay.counter.x0);
          expect(g.spot.x).toBeLessThan(lay.counter.x1);
          // the tag is as wide as its text needs and sits over the head
          expect(g.tag.x1 - g.tag.x0).toBeCloseTo(tagWidth(tagText), 6);
          expect(g.tag.y1 - g.tag.y0).toBe(TAG_H);
          expect(g.tag.y1).toBeLessThan(g.body.y0);
          const walls = bubbleWalls(lay);
          expect(g.tag.x0).toBeGreaterThanOrEqual(walls.x0);
          expect(g.tag.x1).toBeLessThanOrEqual(walls.x1);
          expect(g.tag.x1).toBeLessThanOrEqual(SCENE_W);
          for (const n of NEIGHBORHOODS) {
            const ob = obstacles(lay, n.id);
            for (const b of [...ob.all]) expect(hits(g.tag, b)).toBe(false);
            for (const c of candidates(lay, { id: n.id, pins: 12, outside: true })) expect(hits(g.tag, c.rect)).toBe(false);
          }
          // nobody's head is under the tag
          for (const p of fixedPeople(lay)) expect(hits(g.tag, p.head)).toBe(false);
        }
  });
  test('every line fits the walls at every footprint, under the tag', () => {
    for (let fp = 0; fp < FOOTPRINTS.length; fp++) {
      const lay = shopAt(fp, 2);
      const walls = bubbleWalls(lay);
      const g = cameoGeom(lay, '7d 0h');
      for (const id of VISITORS)
        for (const line of linesOf(id).flatMap(sayLines)) {
          expect(line.length).toBeLessThanOrEqual(SAY_MAX_CHARS + 2);
          const w = bubbleWidth(line);
          const cx = bubbleX(g.tailX, w, walls);
          expect(cx - w / 2).toBeGreaterThanOrEqual(walls.x0 + BUBBLE_AIR - 1e-9);
          expect(cx + w / 2).toBeLessThanOrEqual(walls.x1 - BUBBLE_AIR + 1e-9);
          expect(cx + w / 2).toBeLessThanOrEqual(SCENE_W);
          // under the chip row (the badge band ends at y 186)
          expect(g.sayY - 20 - 12).toBeGreaterThan(186);
        }
    }
  });
  test('a long line is set on two lines, split at a space; a short one stays whole', () => {
    expect(sayLines('Eat! You look like a breadstick.')).toEqual(['Eat! You look like a breadstick.']);
    const two = sayLines("Thirty days, no sick days. Union'd be proud, kid.");
    expect(two).toHaveLength(2);
    expect(two.join(' ')).toBe("Thirty days, no sick days. Union'd be proud, kid.");
    expect(sayHeight(two)).toBe(30);
    expect(sayHeight(['x'])).toBe(18);
    for (const id of VISITORS) for (const l of linesOf(id)) expect(sayLines(l).length).toBeLessThanOrEqual(2);
  });
});
