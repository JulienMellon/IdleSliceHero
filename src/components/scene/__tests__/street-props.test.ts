/// <reference types="jest" />
// D432: the Suburbs' picket fence was an orphan fragment (rails and pickets floating, cut off at both ends, nothing behind it).
import { PROP_HALF_W } from '../layout';
import { PICKET } from '../street-props';

describe('the picket fence (D432)', () => {
  test('it starts and stops: a capped post at each end, the pickets between them, all standing on a bed that is wider than the fence', () => {
    const [p0, p1] = PICKET.posts;
    expect(p0).toBe(-p1); // symmetric
    for (const px of PICKET.pickets) expect([px, px > p0 + PICKET.postW / 2, px < p1 - PICKET.postW / 2]).toEqual([px, true, true]);
    // the posts' outer edges are the fence's width; the bed reaches a little past them
    expect(p1 + PICKET.postW / 2).toBeLessThanOrEqual(PICKET.halfW);
    expect(PICKET.bed.x0).toBeLessThanOrEqual(-(p1 + PICKET.postW / 2));
    expect(PICKET.bed.x1).toBeGreaterThanOrEqual(p1 + PICKET.postW / 2);
    // pickets are evenly spaced, and the gap to each post is the same as between pickets (no half-section hanging off one end)
    const gaps = PICKET.pickets.slice(1).map((px, i) => px - PICKET.pickets[i]);
    expect(new Set(gaps).size).toBe(1);
    expect(PICKET.pickets[0] - (p0 + PICKET.postW / 2)).toBeGreaterThan(0);
    expect(Math.abs(PICKET.pickets[0] - p0) - Math.abs(PICKET.pickets[PICKET.pickets.length - 1] - p1)).toBe(0);
  });
  test('it fits the room layout.ts keeps for a prop (the bike rack\'s ±33 is the widest) and stays under the 22 pt budget the crowd tests assume', () => {
    expect(PICKET.halfW).toBeLessThanOrEqual(PROP_HALF_W);
    expect(PICKET.height).toBe(22);
  });
});
