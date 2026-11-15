/// <reference types="jest" />
import { FRONT_TOP, P } from '../../../scene/projection';
import { PIN, PLAQUE, PLAQUE_W, SIGN, STAR, TAG, pinXs, plaqueBox, plaqueStars } from '../sign-model';

describe('the rating on the sign', () => {
  it('hangs in the sky strip above the sign plate, clear of the station badges under it', () => {
    for (const s of [0.8, 1, 1.2]) {
      const b = plaqueBox(s, true);
      expect(b.y + PLAQUE.height).toBeLessThan(SIGN.top);
      expect(b.y).toBeGreaterThan(0);
      // plaque and tag stay inside the 393 pt scene, and the tag sits level with the plaque
      expect(b.x).toBeGreaterThanOrEqual(0);
      expect(b.tagX + TAG.w / s).toBeLessThanOrEqual(393);
      expect(b.tagY + TAG.h / s / 2).toBeCloseTo(b.y + PLAQUE.height / 2, 6);
      expect(plaqueBox(s, false).x + PLAQUE_W / 2).toBeCloseTo(SIGN.cx, 6);
    }
  });

  it('sits on the sign\u2019s plate, centred on the shop', () => {
    expect(SIGN.cx).toBeCloseTo(P(196.5, 0, FRONT_TOP)[0], 6);
    expect(SIGN.bottom).toBeGreaterThan(SIGN.top);
    expect(SIGN.bottom - SIGN.top).toBeCloseTo(P(0, 0, FRONT_TOP - 20)[1] - P(0, 0, FRONT_TOP)[1], 6);
  });

  it('draws five stars with as many filled as the rating, in a plaque that holds them all', () => {
    for (const n of [1, 2, 3, 4, 5]) expect(plaqueStars(n).filter((s) => s.filled)).toHaveLength(n);
    const xs = plaqueStars(5).map((s) => s.x);
    expect(plaqueStars(5)).toHaveLength(5);
    expect(xs[4] + STAR.size).toBeLessThanOrEqual(PLAQUE_W);
    expect(plaqueStars(9).filter((s) => s.filled)).toHaveLength(5);
    expect(plaqueStars(0).filter((s) => s.filled)).toHaveLength(0);
  });

  it('puts a pin on the plate for every critic pass, centred, at most eight', () => {
    expect(pinXs(0)).toEqual([]);
    const three = pinXs(3);
    expect(three).toHaveLength(3);
    expect((three[0] + three[2] + PIN.size) / 2).toBeCloseTo(SIGN.cx, 6);
    expect(pinXs(20)).toHaveLength(PIN.max);
  });
});
