// University's HUD chip (HUD_CHIPS slot): "3 out on campus" / "3 drones up". A tap opens the University sheet. Selects one string, so it
// repaints only when the words change, never on a game tick; nothing in any other shop.
import { memo } from 'react';

import { isDrones } from '../../../engine/features/layers/university-menu';
import { useGame } from '../../../store/game-store';
import { builtHood } from '../city-layers';
import { twoRows } from './layer-model';
import { LayerChip } from './layer-ui';
import { campusChipText, campusOut } from './zones-model';
import { universitySheet } from './university-state';

export const UniversityChip = memo(function UniversityChip() {
  const text = useGame((s) => (s.game.active === builtHood(s.game, 'menu') ? campusChipText(campusOut(s.game), isDrones(s.game.vehicle)) : ''));
  if (!text) return null;
  return <LayerChip testID="university-chip" rows={twoRows(text)} label={`${text}. Open the menu and campus zones`} onPress={universitySheet.open} />;
});
