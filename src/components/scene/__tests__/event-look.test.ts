/// <reference types="jest" />
// A running weekly event changes the scene (D470): dusk, string lights, two more diners while the shop runs; only in the event's own shops.
import { EVENTS } from '../../../content/endgame';
import { EVENT_LOOK, NO_EVENT_LOOK, eventLook, lightString } from '../event-look';
import { SCENE_W } from '../projection';

const friday = EVENTS.find((e) => e.hoods === 'all')!;
const game = EVENTS.find((e) => e.hoods !== 'all')!;

describe('the look of a running event', () => {
  test('no event, no change', () => {
    expect(eventLook(null, 'downtown', true)).toEqual(NO_EVENT_LOOK);
    expect(NO_EVENT_LOOK).toEqual({ dusk: false, lights: false, extraDiners: 0 });
  });
  test('a running event brings dusk, lights and two more diners while the shop sells', () => {
    expect(eventLook(friday, 'uptown', true)).toEqual({ dusk: true, lights: true, extraDiners: 2 });
    expect(EVENT_LOOK.extraDiners).toBe(2);
  });
  test('a shop that is not selling gets the sky and the lights but no extra diners', () => {
    expect(eventLook(friday, 'uptown', false)).toEqual({ dusk: true, lights: true, extraDiners: 0 });
  });
  test('an event for some shops dresses only those', () => {
    const hoods = game.hoods as readonly string[];
    expect(hoods.length).toBeGreaterThan(0);
    expect(eventLook(game, hoods[0] as never, true).dusk).toBe(true);
    expect(eventLook(game, 'waterfront', true)).toEqual(NO_EVENT_LOOK);
  });
});

describe('the string lights', () => {
  test('they dip in the middle and stay inside the scene', () => {
    const b = lightString(8, SCENE_W - 8, 104, 14, 18);
    expect(b).toHaveLength(18);
    expect(b[0].y).toBeCloseTo(104, 6);
    expect(b[17].y).toBeCloseTo(104, 6);
    expect(Math.max(...b.map((p) => p.y))).toBeCloseTo(104 + 14, 0);
    for (const p of b) {
      expect(p.x).toBeGreaterThanOrEqual(8);
      expect(p.x).toBeLessThanOrEqual(SCENE_W - 8);
    }
  });
});
