/// <reference types="jest" />
// v5.16 (T1b): the later-cycle visitors' in-shop lines (COPY-v5.16 section 5), and the story count that moves with the scene total.
import { readFileSync } from 'fs';
import { join } from 'path';

import { HOME_SCENES } from '../../content/scenes/home';
import { VISITORS, VISITOR_CAMEO_LINES } from '../../content/rewards';
import { STORY_TOTAL, storyGoal } from '../goal-model';
import { sayLines } from '../scene/cameo';

const copy = readFileSync(join(__dirname, '../../../docs/story/COPY-v5.16.md'), 'utf8');
const fromCopy = (key: string) => [...copy.matchAll(new RegExp(`\\| \`cameo\\.${key}\\.\\d\` \\| [^|]+ \\| ([^|]+) \\|`, 'g'))].map((m) => m[1].trim());

describe('later-cycle visitors', () => {
  test('cycle 2 is Big Sal and cycle 3 Genevieve, six lines each, word for word from the copy', () => {
    expect(VISITORS.slice(1, 3)).toEqual(['big-sal', 'genevieve']);
    for (const v of VISITORS.slice(1, 3)) {
      expect(VISITOR_CAMEO_LINES[v]).toHaveLength(6);
      expect([v, [...VISITOR_CAMEO_LINES[v]]]).toEqual([v, fromCopy(v)]);
    }
  });

  test("every line sets on at most two lines in the shop (the pill's two-line limit)", () => {
    for (const v of VISITORS.slice(1, 3)) for (const line of VISITOR_CAMEO_LINES[v]) expect([line, sayLines(line).length <= 2]).toEqual([line, true]);
  });
});

describe('the story count', () => {
  test('the completed-city goal counts against all 50 scenes', () => {
    expect(STORY_TOTAL).toBe(HOME_SCENES.length);
    expect(STORY_TOTAL).toBe(50);
    expect(storyGoal(12)).toEqual({ label: 'Story 12/50', current: 12, target: 50 });
  });
});
