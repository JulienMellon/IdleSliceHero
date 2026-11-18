// Emits the `jam` / `jamfixed` pulses for the audio lane (jam-bus.ts). Draws nothing. Mounted in the BANNERS slot, so it watches the
// Industrial oven whichever shop is on screen. A save that loads already jammed is not a new jam (jam-model.ts `jamEdge`).
import { memo, useEffect, useRef } from 'react';

import { jamView } from '../../../engine/features/layers/industrial-shifts';
import { useGame } from '../../../store/game-store';
import { builtHood } from '../city-layers';
import { emitJam, emitJamFixed } from './jam-bus';
import { jamEdge } from './jam-model';

export const JamPulses = memo(function JamPulses() {
  const jammed = useGame((s) => !!builtHood(s.game, 'shifts') && jamView(s.game).jammed);
  const prev = useRef<boolean | null>(null);
  useEffect(() => {
    const edge = jamEdge(prev.current, jammed);
    prev.current = jammed;
    if (edge === 'jam') emitJam();
    else if (edge === 'jamfixed') emitJamFixed();
  }, [jammed]);
  return null;
});
