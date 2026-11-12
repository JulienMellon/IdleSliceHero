import type { Scene } from '../../types';
import { DOWNTOWN_SCENES } from './downtown';
import { SUBURBS_SCENES } from './suburbs';
import { WATERFRONT_SCENES } from './waterfront';
import { UNIVERSITY_SCENES } from './university';
import { INDUSTRIAL_SCENES } from './industrial';
import { UPTOWN_SCENES } from './uptown';

// City 1 story: Port Marinara. 6 neighborhoods x 4 beats, one file per neighbourhood.
// Beat 1 = unlock, 2 = first milestone, 3 = complication (MegaSlice), 4 = resolution.
// Order matters: it is the story order (pinned by scenes-golden.test.ts).
export const HOME_SCENES: Scene[] = [...DOWNTOWN_SCENES, ...SUBURBS_SCENES, ...WATERFRONT_SCENES, ...UNIVERSITY_SCENES, ...INDUSTRIAL_SCENES, ...UPTOWN_SCENES];
