import type { Scene } from '../../types';
import { DOWNTOWN_SCENES } from './downtown';
import { SUBURBS_SCENES } from './suburbs';
import { WATERFRONT_SCENES } from './waterfront';
import { UNIVERSITY_SCENES } from './university';
import { INDUSTRIAL_SCENES } from './industrial';
import { UPTOWN_SCENES } from './uptown';

// City 1 story: Port Marinara. 40 scenes, one file per neighbourhood: 6 x 4 main beats, Todd's 11 interludes and the 5 managers' hire scenes.
// Beat 1 = unlock, 2 = first milestone, 3 = complication (MegaSlice), 4 = resolution; 'interlude' = Todd's scenes and the hire scenes.
// Order matters: it is the story order (pinned by scenes-golden.test.ts), and each interlude sits where the story tells it.
export const HOME_SCENES: Scene[] = [...DOWNTOWN_SCENES, ...SUBURBS_SCENES, ...WATERFRONT_SCENES, ...UNIVERSITY_SCENES, ...INDUSTRIAL_SCENES, ...UPTOWN_SCENES];
