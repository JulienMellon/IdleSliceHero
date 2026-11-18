// Industrial's scene tint (SCENE_OVERLAYS slot): the night shift washes the sky and the skyline deep blue (the pizzeria stays in its own colours, warm
// as if lit, D484), hangs a moon and a gold "×2" by the sign (it pays double); the swing shift is a faint amber. Decoration only: it takes no touches. Selects the shift id, so it repaints once a shift.
import { memo } from 'react';
import { StyleSheet, Text, View } from 'react-native';
import Svg, { Circle, G, Path, Rect } from 'react-native-svg';

import { shiftView } from '../../../engine/features/layers/industrial-shifts';
import { useGame } from '../../../store/game-store';
import { builtHood } from '../city-layers';
import { C, F } from '../../../theme';
import { FRONT_TOP, INK, P, sceneFit } from '../../scene/projection';
import { useShopFrame } from '../../scene/use-frame';
import { layoutOfShop } from '../shop-layout';
import { toWindow } from '../layer-geometry';
import type { SceneSlotProps } from '../../slots';
import { MOON, nightShape, payTag, shiftTint, WARM } from './shift-model';

/** The pizzeria's roof edge in scene units (the pitched roof's peak sits above the fascia's top). */
const ROOF_Y = P(0, 0, FRONT_TOP)[1] - 62;

/** Where the ×2 badge hangs, in scene units: right of the sign's plate. */
const BADGE = { x: 312, y: 139, size: 34 } as const;

export const NightTint = memo(function NightTint({ shopId, width, height }: SceneSlotProps) {
  const frame = useShopFrame(shopId);
  const key = useGame((s) => {
    if (shopId !== builtHood(s.game, 'shifts')) return '';
    const v = shiftView(s.game);
    const lay = layoutOfShop(s.game.shops[shopId]);
    return `${v.shift}|${v.valueMult}|${lay.L}|${lay.R}`;
  });
  if (!key || !(width > 0)) return null;
  const [shift, value, L, R] = key.split('|');
  const tint = shiftTint(shift);
  if (!tint) return null;
  const f = sceneFit(width, height, frame);
  const shape = nightShape({ L: Number(L), R: Number(R) }, frame.width, P(0, 0)[1], ROOF_Y);
  const night = shift === 'night';
  const tag = payTag(Number(value));
  const at = toWindow(f, BADGE.x, BADGE.y);
  return (
    <View testID="shift-tint" pointerEvents="none" style={StyleSheet.absoluteFill}>
      <Svg accessibilityElementsHidden importantForAccessibility="no-hide-descendants" width={width} height={height} style={StyleSheet.absoluteFill}>
        <G transform={`translate(${f.ox} ${f.oy}) scale(${f.s})`}>
          {/* the sky and the skyline: the tint, with the pizzeria's box cut out */}
          <Path d={shape.path} fillRule="evenodd" fill={tint.color} opacity={tint.opacity} />
          {night && (
            <G>
              <Rect x={shape.house.x0} y={shape.house.y0} width={shape.house.x1 - shape.house.x0} height={shape.house.y1 - shape.house.y0} fill={WARM.color} opacity={WARM.opacity} />
              <Circle cx={MOON.cx} cy={MOON.cy} r={MOON.r} fill="#FFF6D6" stroke={INK} strokeWidth={1.2} />
              <Circle cx={MOON.cx + MOON.bite.dx} cy={MOON.cy + MOON.bite.dy} r={MOON.bite.r} fill="#2B3F73" />
            </G>
          )}
        </G>
      </Svg>
      {tag && night ? (
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
