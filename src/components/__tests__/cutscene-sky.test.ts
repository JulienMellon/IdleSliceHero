/// <reference types="jest" />
// D510: a cloud is one filled shape. Its base is wound the way its circles are (counter-clockwise on screen), so the nonzero fill unions them; wound the
// other way the overlap cancels to winding 0 and the sky shows through as bites.
import { cloud } from '../cutscene/backdrop-art';

describe('cloud', () => {
  const d = cloud(330, -20, 0.8);
  const subpaths = d.split('M').filter(Boolean);
  it('has four circles and a base', () => {
    expect(subpaths).toHaveLength(5);
  });
  it('winds every circle counter-clockwise (arc sweep 0)', () => {
    for (const sp of subpaths.slice(0, 4)) expect(sp).toMatch(/a[\d.]+ [\d.]+ 0 1 0 /);
  });
  it('winds the base the same way: its shoelace area is negative on a y-down screen', () => {
    const m = /^(-?[\d.]+) (-?[\d.]+)v(-?[\d.]+)h(-?[\d.]+)v(-?[\d.]+)Z$/.exec(subpaths[4]);
    expect(m).not.toBeNull();
    const [x, y, v, h] = [1, 2, 3, 4].map((i) => Number(m![i]));
    const pts = [
      [x, y],
      [x, y + v],
      [x + h, y + v],
      [x + h, y],
    ];
    let a = 0;
    for (let i = 0; i < 4; i++) {
      const [x0, y0] = pts[i];
      const [x1, y1] = pts[(i + 1) % 4];
      a += x0 * y1 - x1 * y0;
    }
    expect(a).toBeLessThan(0);
  });
});
