// Industrial's shift clock chip (HUD_CHIPS slot): the shift on the clock over the time to the next, "Night ×2" / "6:40". A tap opens the
// Industrial sheet. It selects one string, so it repaints when a word or the clock's second changes, never on a game tick; nothing in any
// other shop.
import { memo } from 'react';

import { shiftView } from '../../../engine/features/layers/industrial-shifts';
import { useGame } from '../../../store/game-store';
import { LayerChip } from '../university/layer-ui';
import { industrialSheet } from './industrial-state';
import { shiftChip } from './shift-model';

export const ShiftChip = memo(function ShiftChip() {
  const key = useGame((s) => {
    if (s.game.active !== 'industrial' || !s.game.shops.industrial.built) return '';
    const c = shiftChip(shiftView(s.game));
    return `${c.rows[0]}|${c.rows[1]}|${c.label}`;
  });
  if (!key) return null;
  const [top, bottom, label] = key.split('|');
  return <LayerChip testID="shift-chip" rows={[top, bottom]} label={label} onPress={industrialSheet.open} />;
});
