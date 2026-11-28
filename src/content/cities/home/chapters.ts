// The home city's 24 main beats as chapters (v5.21, card E1): beats 1-4 of the six neighbourhoods. Task 1 is today's gate made visible (its
// number is the scene's trigger, unchanged); the others teach and are finished by the tuned player before it (docs/build/v5.21/chapters.md has
// the table with the sim's times). The words are in content/copy (`chapter.<scene>.title`, `.teaser`, `task.<scene>.<n>`).
import type { HeadKind } from '../../tuning';
import type { NeighborhoodId } from '../../types';
import type { Chapter, ChapterTask } from '../types';
import { PIER9_BID } from './data';

type Draft = Omit<ChapterTask, 'key'>;
const serve = (shop: NeighborhoodId, target: number): Draft => ({ kind: 'serve', shop, target });
const rate = (shop: NeighborhoodId, target: number): Draft => ({ kind: 'rate', shop, target });
const noMissed = (shop: NeighborhoodId, seconds: number): Draft => ({ kind: 'noMissed', shop, target: seconds });
const hire = (shop: NeighborhoodId, head: HeadKind): Draft => ({ kind: 'hire', shop, target: 1, head });
const build = (shop: NeighborhoodId): Draft => ({ kind: 'build', shop, target: 1 });
const win = (shop: NeighborhoodId): Draft => ({ kind: 'win', shop, target: 1 });
const bid = (shop: NeighborhoodId): Draft => ({ kind: 'bid', shop, target: 1 });
const report = (shop: NeighborhoodId): Draft => ({ kind: 'report', shop, target: 1 });

const chapter = (sceneId: string, tasks: Draft[], free?: true): Chapter => ({
  sceneId,
  key: `chapter.${sceneId}`,
  tasks: tasks.map((t, i) => ({ ...t, key: `task.${sceneId}.${i + 1}` })),
  ...(free ? { free } : {}),
});

export const HOME_CHAPTERS: Chapter[] = [
  // Downtown: chapter 1 is the tutorial (its beat plays at the start, so it does not wait for the tasks)
  chapter('downtown-1', [serve('downtown', 1), serve('downtown', 4), hire('downtown', 'prep')], true),
  chapter('downtown-2', [serve('downtown', 424), hire('downtown', 'oven'), rate('downtown', 6)]),
  chapter('downtown-3', [serve('downtown', 941), hire('downtown', 'counter'), report('downtown')]),
  chapter('downtown-4', [serve('downtown', 2217), rate('downtown', 2500), noMissed('downtown', 30)]),
  // Suburbs
  chapter('suburbs-1', [build('suburbs'), rate('downtown', 300)]),
  chapter('suburbs-2', [serve('suburbs', 12430), hire('suburbs', 'prep'), rate('suburbs', 500)]),
  chapter('suburbs-3', [serve('suburbs', 28045), hire('suburbs', 'oven'), rate('suburbs', 1000)]),
  chapter('suburbs-4', [win('suburbs'), hire('suburbs', 'counter'), rate('suburbs', 2000)]),
  // Waterfront
  chapter('waterfront-1', [build('waterfront'), rate('suburbs', 2000)]),
  chapter('waterfront-2', [serve('waterfront', 3000), rate('waterfront', 500)]),
  chapter('waterfront-3', [serve('waterfront', 15000), rate('waterfront', 1000)]),
  chapter('waterfront-4', [serve('waterfront', PIER9_BID.unlockPizzas), bid('waterfront'), hire('waterfront', 'prep')]),
  // University
  chapter('university-1', [build('university'), rate('waterfront', 2000)]),
  chapter('university-2', [serve('university', 30000), rate('university', 500)]),
  chapter('university-3', [serve('university', 135000), hire('university', 'prep'), rate('university', 1000)]),
  chapter('university-4', [win('university'), hire('university', 'oven'), hire('university', 'counter')]),
  // Industrial
  chapter('industrial-1', [build('industrial'), rate('university', 2000)]),
  chapter('industrial-2', [serve('industrial', 100000), hire('industrial', 'prep'), hire('industrial', 'oven')]),
  chapter('industrial-3', [serve('industrial', 360000), hire('industrial', 'counter'), rate('industrial', 1000)]),
  chapter('industrial-4', [win('industrial'), noMissed('industrial', 120), rate('industrial', 2000)]),
  // Uptown
  chapter('uptown-1', [build('uptown'), rate('industrial', 2000)]),
  chapter('uptown-2', [serve('uptown', 200000), hire('uptown', 'prep'), hire('uptown', 'oven')]),
  chapter('uptown-3', [serve('uptown', 625000), hire('uptown', 'counter'), rate('uptown', 1000)]),
  chapter('uptown-4', [win('uptown'), noMissed('uptown', 120), rate('uptown', 1000)]),
];
