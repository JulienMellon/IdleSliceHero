// The factory whistle (BANNERS slot): "Whistle! Night Shift is on" for a few seconds when the shift changes, with Big Sal's line on the
// night. Whichever shop is on screen (the whistle is heard across town). Nothing at load; the first shift seen is not news.
import { memo } from 'react';

import { shiftView } from '../../../engine/features/layers/industrial-shifts';
import { useGame } from '../../../store/game-store';
import { builtHood } from '../city-layers';
import { LayerToast, useChangeToast } from '../university/layer-ui';
import { whistle } from './shift-model';

export const ShiftBanner = memo(function ShiftBanner() {
  const shift = useGame((s) => (builtHood(s.game, 'shifts') ? shiftView(s.game).shift : ''));
  const toast = useChangeToast(shift, (k) => {
    const w = whistle(k, useGame.getState().game.city);
    return w ? { text: w.text, line: w.line, speaker: w.speaker } : null;
  });
  return toast ? <LayerToast testID="shift-banner" toast={toast} tone={shift === 'night' ? 'plain' : 'cheese'} /> : null;
});
