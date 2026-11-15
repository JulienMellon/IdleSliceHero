/// <reference types="jest" />
import { DINING_AISLE_Y, layout } from '../../../scene/layout';
import { CRITIC_LEAD, MOMENT_MS, WALK_SECONDS, arrival, criticPath, criticPhase, moment, targetChip } from '../critic-model';

const view = (nextIn: number, last: Parameters<typeof criticPhase>[0]['last'] = null, active = true) => ({ active, nextIn, last });

describe('the critic comes in before the visit', () => {
  it('is away until the lead-in, walks for six seconds, then waits seated', () => {
    expect(criticPhase(view(900))).toBe('away');
    expect(criticPhase(view(CRITIC_LEAD + 1))).toBe('away');
    expect(criticPhase(view(CRITIC_LEAD))).toBe('walking');
    expect(criticPhase(view(CRITIC_LEAD - WALK_SECONDS + 1))).toBe('walking');
    expect(criticPhase(view(CRITIC_LEAD - WALK_SECONDS))).toBe('seated');
    expect(criticPhase(view(1))).toBe('seated');
  });

  it('shows the result until it is acknowledged, whatever the clock says', () => {
    expect(criticPhase(view(800, { target: 3, stars: 4, hit: true, cash: 12 }))).toBe('result');
    expect(criticPhase(view(0, { target: 3, stars: 2, hit: false, cash: 0 }))).toBe('result');
  });

  it('is never there before Uptown is built', () => {
    expect(criticPhase(view(5, null, false))).toBe('away');
    expect(criticPhase(view(5, { target: 3, stars: 4, hit: true, cash: 1 }, false))).toBe('away');
  });
});

describe('the walk', () => {
  const lay = layout(2, 1, 1, 1, 0, 2, 0);
  const at = (p: number) => criticPath(p, lay.door.cx, lay.door.x0);

  it('starts on the pavement right of the door, goes through the door and stops on the dining aisle', () => {
    expect(at(0).y).toBeLessThan(0);
    expect(at(0).x).toBeGreaterThan(lay.door.cx);
    expect(at(0.4)).toMatchObject({ x: lay.door.cx, y: -4 });
    expect(at(1).y).toBe(DINING_AISLE_Y);
    expect(at(1).x).toBeLessThan(lay.door.x0);
    expect(at(1).step).toBe(0);
    expect(at(0.5).step).not.toBe(0);
  });

  it('moves one way only, from the door in, and clamps outside 0..1', () => {
    let last = Infinity;
    for (let i = 0; i <= 10; i++) {
      const x = at(i / 10).x;
      expect(x).toBeLessThanOrEqual(last + 1e-9);
      last = x;
    }
    expect(at(-1)).toEqual(at(0));
    expect(at(3)).toEqual(at(1));
  });
});

describe('the words', () => {
  it('puts the target on the chip', () => {
    expect(targetChip(4)).toBe('Target 4★');
  });

  it('says the pass with Genevieve’s line and the cash', () => {
    expect(moment({ target: 3, stars: 4, hit: true, cash: 1234 })).toEqual({
      hit: true,
      headline: 'Target 3★ · you had 4★ · +$1.23K',
      line: 'My colleague said ‘sublime.’ How irritating. How correct.',
      speaker: 'Genevieve',
    });
  });

  it('says the fail with her other line and no cash', () => {
    const m = moment({ target: 4, stars: 2, hit: false, cash: 0 });
    expect(m.hit).toBe(false);
    expect(m.headline).toBe('Target 4★ · you had 2★');
    expect(m.line).toBe('My colleague left early. Croissant stayed. Small mercies.');
    expect(m.speaker).toBe('Genevieve');
  });

  it('warns when the critic arrives', () => {
    expect(arrival()).toEqual({ text: 'A critic is dining here!', line: 'A colleague dines here tonight. I shall hear about it.', speaker: 'Genevieve' });
  });

  it('keeps the moment up a few seconds, before the lead-in ends', () => {
    expect(MOMENT_MS).toBeGreaterThanOrEqual(3000);
    expect(MOMENT_MS).toBeLessThan(CRITIC_LEAD * 1000);
  });
});
