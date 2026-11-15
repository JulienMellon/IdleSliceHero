// Industrial's scene tint (SCENE_OVERLAYS slot): the night shift washes the scene deep blue and hangs a gold "×2" by the sign (it pays double);
// the swing shift is a faint amber. Decoration only: it takes no touches. Selects the shift id, so it repaints once a shift.
import { memo } from 'react';
import { StyleSheet, Text, View } from 'react-native';

import { shiftView } from '../../../engine/features/layers/industrial-shifts';
import { useGame } from '../../../store/game-store';
import { C, F } from '../../../theme';
import { sceneFit } from '../../scene/projection';
import { toWindow } from '../layer-geometry';
import type { SceneSlotProps } from '../../slots';
import { payTag, shiftTint } from './shift-model';

/** Where the ×2 badge hangs, in scene units: right of the sign's plate. */
const BADGE = { x: 312, y: 139, size: 34 } as const;

export const NightTint = memo(function NightTint({ shopId, width, height }: SceneSlotProps) {
  const key = useGame((s) => {
    if (shopId !== 'industrial' || !s.game.shops.industrial.built) return '';
    const v = shiftView(s.game);
    return `${v.shift}|${v.valueMult}`;
  });
  const [shift, value] = key.split('|');
  const tint = shiftTint(shift);
  if (!tint || !(width > 0)) return null;
  const tag = payTag(Number(value));
  const at = toWindow(sceneFit(width, height), BADGE.x, BADGE.y);
  return (
    <View testID="shift-tint" pointerEvents="none" style={StyleSheet.absoluteFill}>
      <View style={[StyleSheet.absoluteFill, { backgroundColor: tint.color, opacity: tint.opacity }]} />
      {tag ? (
        <View testID="shift-x2" style={[styles.badge, { left: at.left - BADGE.size / 2, top: at.top - BADGE.size / 2 }]}>
          <Text style={styles.badgeText} maxFontSizeMultiplier={1.1}>
            {tag}
          </Text>
        </View>
      ) : null}
    </View>
  );
});

const styles = StyleSheet.create({
  badge: { position: 'absolute', width: BADGE.size, height: BADGE.size, borderRadius: BADGE.size / 2, backgroundColor: C.cheese, borderWidth: 2, borderColor: C.ink, alignItems: 'center', justifyContent: 'center' },
  badgeText: { fontFamily: F.bold, fontSize: 14, lineHeight: 17, color: C.ink },
});
