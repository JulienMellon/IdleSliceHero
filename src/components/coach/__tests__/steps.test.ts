import { stepsFor } from '../../../engine/tutorial';
import { CITIES, HOME_ID } from '../../../content/cities';
import { coachProps } from '../steps';

describe('coachProps: today’s steps as overlay props', () => {
  test.each([
    ['prep', false, ['station:prep'], 'tap'],
    ['oven', false, ['station:oven'], 'tap'],
    ['counter', false, ['station:counter'], 'tap'],
    ['prep', true, ['station:prep', 'dial:prep'], 'wait'],
    ['oven', true, ['station:oven', 'dial:oven'], 'wait'],
    ['cash', false, ['hud:cash'], 'wait'],
    ['walk-ovens', false, ['walk:ovens'], 'tap'],
    ['goal', false, ['hud:goal'], 'tap'],
  ])('%s (wait %s)', (target, wait, targets, mode) => {
    expect(coachProps({ target, wait })).toEqual({ targets, mode });
  });

  test('every step of the home tutorial points somewhere', () => {
    for (const step of stepsFor(CITIES[HOME_ID])) {
      const p = coachProps(step);
      expect(p.targets.length).toBeGreaterThan(0);
      expect(p.mode).not.toBe('free');
    }
  });
});
