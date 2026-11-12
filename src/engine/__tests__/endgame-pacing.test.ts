// Pacing pins for v5.15 (card E1 step 7). The check-in player (5 min every 4 h, the 4 h offline cap) of scripts/pacing-fit.ts:
//  - finishes each neighbourhood's first scene and the finale within 0.3 days of 1.0 / 2.0 / 3.1 / 4.4 / 4.8;
//  - after the story buys heads, Flagships and golden ovens and defends each weekly counter-attack, and has all 18 mastery stars
//    between day 10 and day 14.
// A later retune that moves one of these has to say so here. Refit with `npx tsx scripts/pacing-fit.ts fitstars` / `check`.
import { endgame, STAR_DAYS, STORY_TOLERANCE, TARGETS } from '../../../scripts/pacing-fit';
import { run } from '../../../scripts/review/sim2';

jest.setTimeout(120_000);

const SCENE = { waterfront: 'waterfront-1', university: 'university-1', industrial: 'industrial-1', uptown: 'uptown-1', finale: 'uptown-4' } as const;

describe('check-in player: story days and the mastery stars', () => {
  const story = run('checkin', 300, 4 * 3600);
  const after = endgame(story.s, story.wall, 30, 1);

  for (const key of Object.keys(TARGETS) as (keyof typeof TARGETS)[]) {
    it(`${key} lands within ${STORY_TOLERANCE} days of day ${TARGETS[key]}`, () => {
      const day = story.scenes.find((x) => x.id === SCENE[key])!.wall / 86400;
      expect(Math.abs(day - TARGETS[key])).toBeLessThanOrEqual(STORY_TOLERANCE);
    });
  }

  it('the city is finished and the story targets are the v5.13 ones', () => {
    expect(story.s.cityComplete).toBe(true);
    expect(TARGETS).toEqual({ waterfront: 1.0, university: 2.0, industrial: 3.1, uptown: 4.4, finale: 4.8 });
  });

  it('has all 18 stars between day 10 and day 14, with 6 and 12 earlier', () => {
    expect(after.starDay[18]).not.toBeNull();
    expect(after.starDay[18]!).toBeGreaterThanOrEqual(STAR_DAYS.min);
    expect(after.starDay[18]!).toBeLessThanOrEqual(STAR_DAYS.max);
    expect(after.starDay[6]!).toBeLessThanOrEqual(after.starDay[12]!);
    expect(after.starDay[12]!).toBeLessThan(after.starDay[18]!);
  });

  it('defends the weekly counter-attack by rushing the target shop', () => {
    expect(after.attacks).toBeGreaterThanOrEqual(1);
    expect(after.won).toBeGreaterThanOrEqual(1);
    expect(after.lost).toBe(0);
  });
});
