/// <reference types="jest" />
import { afterOpen, NO_FLAGS, nudgeShows, parseFlags } from '../shop-flags-model';

describe('the Shop reminders (card U5)', () => {
  test('the dot is used up by opening the Shop after the takeover, not before', () => {
    expect(afterOpen(NO_FLAGS, false)).toBe(NO_FLAGS);
    expect(afterOpen(NO_FLAGS, true)).toEqual({ dotCleared: true, nudged: false });
    const done = { dotCleared: true, nudged: true };
    expect(afterOpen(done, true)).toBe(done);
  });

  test("Nonna's nudge: the first refused buy of a look when short of diamonds, once", () => {
    expect(nudgeShows(NO_FLAGS, false, true)).toBe(true);
    expect(nudgeShows(NO_FLAGS, true, true)).toBe(false); // it was bought
    expect(nudgeShows(NO_FLAGS, false, false)).toBe(false); // refused for another reason
    expect(nudgeShows({ dotCleared: false, nudged: true }, false, true)).toBe(false);
  });

  test('saved flags read back; anything broken is the start', () => {
    expect(parseFlags(JSON.stringify({ dotCleared: true, nudged: true }))).toEqual({ dotCleared: true, nudged: true });
    expect(parseFlags(JSON.stringify({ dotCleared: 'yes' }))).toEqual(NO_FLAGS);
    expect(parseFlags('{oops')).toEqual(NO_FLAGS);
    expect(parseFlags(null)).toEqual(NO_FLAGS);
  });
});
