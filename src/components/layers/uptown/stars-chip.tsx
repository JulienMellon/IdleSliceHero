// Uptown's rating chip (HUD_CHIPS slot): "Rating 4★". A tap opens the stars sheet. It selects one string, so it repaints when the rating
// changes, never on a game tick; nothing in any other shop.
import { memo } from 'react';

import { starsView } from '../../../engine/features/layers/uptown-stars';
import { useGame } from '../../../store/game-store';
import { builtHood } from '../city-layers';
import { twoRows } from '../university/layer-model';
import { LayerChip } from '../university/layer-ui';
import { PAY_WORDS, chipText, payTagOf } from './stars-model';
import { uptownSheet } from './uptown-state';

export const StarsChip = memo(function StarsChip() {
  const key = useGame((s) => {
    if (s.game.active !== builtHood(s.game, 'stars')) return '';
    const v = starsView(s.game);
    return `${v.stars}|${payTagOf(v.payMult)}`;
  });
  if (!key) return null;
  const [stars, tag] = key.split('|');
  const text = chipText(Number(stars), useGame.getState().game.city);
  return (
    <LayerChip
      testID="stars-chip"
      rows={twoRows(text)}
      label={`${text}. ${PAY_WORDS[tag as 'half' | 'full' | 'double']}. Open the stars sheet`}
      onPress={uptownSheet.open}
    />
  );
});
