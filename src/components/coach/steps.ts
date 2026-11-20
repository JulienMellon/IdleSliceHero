// The overlay's modes and props (card C1). The steps themselves (their targets and mode) are the tutorial's own: src/engine/tutorial.ts (card C3).
import type { CoachTargetId } from './targets';

export type CoachMode = 'tap' | 'wait' | 'look' | 'free';

export interface CoachProps {
  targets: CoachTargetId[];
  mode: CoachMode;
}
