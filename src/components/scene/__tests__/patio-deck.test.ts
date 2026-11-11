/// <reference types="jest" />
// D428: the patio reads as outdoor growth: a plank deck (#C99A6B) one 10 pt step down from the shop front, a low rail round it.
import { CHAIR_WAY_HALF_W, PATIO_HALF_W, PATIO_SEAT, PILASTER_RIGHT, layout } from '../layout';
import { DECK_BACK_Y, DECK_CLEARS_QUEUE, DECK_COLOR, DECK_FRONT_Y, RAIL_PT, STEP_PT, deckBox, patioDeck } from '../patio-deck';
import { P, SCENE_W, kAt } from '../projection';
import { figureBox } from '../ladder';

const DRIVER_SLOTS = [2, 2, 3, 3, 4];
const lays = () => [0, 1, 2, 3, 4].map((fp) => ({ fp, lay: layout(fp, Math.min(fp + 1, 6), 3, 2, 6, DRIVER_SLOTS[fp], 1) }));
const hit = (a: { x0: number; x1: number; y0: number; y1: number }, b: { x0: number; x1: number; y0: number; y1: number }) => a.x0 < b.x1 && a.x1 > b.x0 && a.y0 < b.y1 && a.y1 > b.y0;

describe('the patio deck (D428)', () => {
  test('it is plank-coloured, one 10 pt step down, with an 8 pt rail, and it stands behind the queue lane', () => {
    expect(DECK_COLOR).toBe('#C99A6B');
    expect(STEP_PT).toBe(10);
    expect(RAIL_PT).toBeLessThanOrEqual(10);
    expect(DECK_CLEARS_QUEUE).toBe(true);
    const d = patioDeck({ x: 100, y: -12 });
    expect(d.riser[0][1] - d.top[0][1]).toBeCloseTo(-STEP_PT, 0); // lifted 10 pt (the depth scale is ~0.99 there: within half a point)
    expect(d.planks.length).toBeGreaterThan(2);
  });
  test('every patio set stands wholly on its deck (chairs, table, umbrella), the deck is wholly on screen and right of the wall\'s left pilaster', () => {
    let sets = 0;
    for (const { fp, lay } of lays())
      for (const p of lay.patio) {
        sets++;
        const d = patioDeck(p);
        expect([fp, d.x0 <= p.x - PATIO_SEAT - 13, d.x1 >= p.x + PATIO_SEAT + 13]).toEqual([fp, true, true]); // a chair is ~±13 round its seat
        const box = deckBox(d);
        expect([fp, box.x0 >= P(lay.L + PILASTER_RIGHT, 0)[0], box.x1 <= SCENE_W, box.x0 >= 0]).toEqual([fp, true, true, true]);
        expect(DECK_BACK_Y).toBeGreaterThan(DECK_FRONT_Y);
        expect(PATIO_HALF_W).toBeGreaterThanOrEqual(26.5 * kAt(p.y) * 1.1 - 0.5);
      }
    expect(sets).toBeGreaterThanOrEqual(2); // the roomier shops have a set to test
  });
  test('no queued diner or driver stands on a deck, and the rail leaves the guest\'s way to the right-hand chair open', () => {
    for (const { fp, lay } of lays()) {
      const figures = [...lay.queue, ...lay.driverQueue].map(([x, y]) => figureBox(x, y));
      for (const p of lay.patio) {
        const d = patioDeck(p);
        for (const f of figures) expect([fp, hit(deckBox(d), f)]).toEqual([fp, false]);
        // the way in: from the right-hand chair ± CHAIR_WAY_HALF_W, no bar and no post across it
        const way = p.x + PATIO_SEAT;
        expect(d.gap[0]).toBeCloseTo(way - CHAIR_WAY_HALF_W, 6);
        expect(d.gap[1]).toBeCloseTo(way + CHAIR_WAY_HALF_W, 6);
        const wx0 = P(d.gap[0], DECK_FRONT_Y)[0];
        const wx1 = P(d.gap[1], DECK_FRONT_Y)[0];
        const front = d.rail.bars.slice(0, 2);
        for (const [a, b] of front) expect([fp, Math.max(a[0], b[0]) <= wx0 + 0.01 || Math.min(a[0], b[0]) >= wx1 - 0.01]).toEqual([fp, true]);
        for (const [px] of d.rail.posts) expect([fp, px <= wx0 + 0.01 || px >= wx1 - 0.01]).toEqual([fp, true]); // posts stand at the gap's two ends, never in it
      }
    }
  });
  test('the rail stands below the seated diners\' laps, so it never hides a face', () => {
    for (const { fp, lay } of lays())
      for (const p of lay.patio) {
        const d = patioDeck(p);
        const seatFeet = P(p.x + PATIO_SEAT, p.y)[1];
        for (const [a, b] of d.rail.bars.slice(0, 2)) expect([fp, Math.min(a[1], b[1]) > seatFeet]).toEqual([fp, true]);
      }
  });
});
