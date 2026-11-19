// Character art: flat, cartoony SVG figures with mood-driven faces.
// variant 'bust' (default): the small head-and-shoulders used by the coach card, title card, scrapbook and HUD.
// variant 'stage': the waist-up, cel-shaded figure with a gesture per mood, used by the cut-scene player only.
import { memo } from 'react';

import type { CharacterId, Mood } from '../../content/types';
import { Bust } from './bust';
import { lookFor } from './look';
import { Stage } from './stage';

export { DISPLAY_NAMES, LOOKS, lookFor } from './look';

/**
 * A character. `size` is the bust's square size, or the stage figure's height (its width is 0.8 × size).
 * `dim` (stage only) shades a listener down a little; `holding` (stage only) puts the prop in the figure's hands.
 */
export const Portrait = memo(function Portrait({
  id,
  mood = 'neutral',
  size = 120,
  flip = false,
  variant = 'bust',
  dim = false,
  holding,
  city,
}: {
  id: CharacterId;
  mood?: Mood;
  size?: number;
  flip?: boolean;
  variant?: 'bust' | 'stage';
  dim?: boolean;
  /** Stage only: a prop the figure holds up at chest height. */
  holding?: 'recipe-card';
  /** The city the scene is in: it ages a character the way its pack says (Priya and Nonna in Boston). */
  city?: string;
}) {
  const L = lookFor(id, city);
  return variant === 'stage' ? (
    <Stage id={id} mood={mood} size={size} flip={flip} dim={dim} holding={holding} city={city} />
  ) : (
    <Bust L={L} mood={mood} size={size} flip={flip} />
  );
});
