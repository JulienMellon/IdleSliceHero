// Today's tutorial steps as overlay props (card C1). Until card C3 gives each step its own targets, `coach.target` maps here.
import type { CoachTargetId } from './targets';

export type CoachMode = 'tap' | 'wait' | 'look' | 'free';

export interface CoachProps {
  targets: CoachTargetId[];
  mode: CoachMode;
}

/** What the overlay shows for a step: the scene steps cut the station (and its dial while waiting); the rest cut the HUD or the sidewalk card. */
export function coachProps(step: { target: string; wait?: boolean }): CoachProps {
  switch (step.target) {
    case 'prep':
    case 'oven':
    case 'counter':
      return step.wait ? { targets: [`station:${step.target}`, `dial:${step.target}`], mode: 'wait' } : { targets: [`station:${step.target}`], mode: 'tap' };
    // the first pizza is on its way out: nothing to tap, just watch the cash
    case 'cash':
      return { targets: ['hud:cash'], mode: 'wait' };
    case 'walk-ovens':
      return { targets: ['walk:ovens'], mode: 'tap' };
    case 'goal':
      return { targets: ['hud:goal'], mode: 'tap' };
    default:
      return { targets: [], mode: 'free' };
  }
}
