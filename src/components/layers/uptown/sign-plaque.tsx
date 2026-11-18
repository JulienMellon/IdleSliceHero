// Uptown's rating on the storefront sign (SCENE_OVERLAYS slot): five stars in a small plaque just above the sign's plate, the "Half pay" /
// "Double pay" tag beside it, and one gold pin on the plate's lower edge for every critic pass. Decoration only: it takes no touches (the HUD
// chip opens the sheet). It selects one string, so it repaints when the rating, the pay or the pins change.
import { memo } from 'react';
import { StyleSheet, Text, View } from 'react-native';
import Svg, { G, Path, Rect } from 'react-native-svg';

import { starsView } from '../../../engine/features/layers/uptown-stars';
import { useGame } from '../../../store/game-store';
import { builtHood } from '../city-layers';
import { C, F } from '../../../theme';
import { INK, sceneFit } from '../../scene/projection';
import { useShopFrame } from '../../scene/use-frame';
import type { SceneSlotProps } from '../../slots';
import { toWindow } from '../layer-geometry';
import { isDressed } from '../city-dress';
import { chipText, PAY_WORDS, payTagOf, type PayTag } from './stars-model';
import { PIN, PLAQUE, PLAQUE_W, pinXs, plaqueBox, plaqueStars, signOf, STAMP, STAR, TAG } from './sign-model';

const STAR_PATH = 'M10 1.8 L12.4 7 L18 7.6 L13.8 11.4 L15 17 L10 14.1 L5 17 L6.2 11.4 L2 7.6 L7.6 7 Z';

export const SignPlaque = memo(function SignPlaque({ shopId, width, height }: SceneSlotProps) {
  const frame = useShopFrame(shopId);
  const key = useGame((s) => {
    if (shopId !== builtHood(s.game, 'stars')) return '';
    const v = starsView(s.game);
    // a city that dresses the stars as a local rating (Southie) adds its stamp: the rating's name from the script, in the key so it repaints with it
    const local = isDressed(s.game.city, 'rating.1') ? chipText(v.stars, s.game.city) : '';
    return `${v.stars}|${payTagOf(v.payMult)}|${v.sign}|${local}`;
  });
  if (!key || !(width > 0)) return null;
  const [st, tag, pins, local] = key.split('|');
  const stars = Number(st);
  const f = sceneFit(width, height, frame);
  const sign = signOf(frame);
  const box = plaqueBox(f.s, tag !== 'full', sign, !!local);
  const tagAt = toWindow(f, box.tagX, box.tagY);
  const stampAt = toWindow(f, box.stampX, box.stampY);
  return (
    <View testID="sign-rating" accessibilityLabel={`Rating ${stars} stars. ${PAY_WORDS[tag as PayTag]}`} pointerEvents="none" style={StyleSheet.absoluteFill}>
      <Svg accessibilityElementsHidden importantForAccessibility="no-hide-descendants" width={width} height={height} style={StyleSheet.absoluteFill}>
        <G transform={`translate(${f.ox} ${f.oy}) scale(${f.s})`}>
          <G transform={`translate(${box.x} ${box.y})`}>
            <Rect
              x={0.7}
              y={0.7}
              width={PLAQUE_W - 1.4}
              height={PLAQUE.height - 1.4}
              rx={(PLAQUE.height - 1.4) / 2}
              fill="#FFF4E0"
              stroke={INK}
              strokeWidth={1.4}
            />
            {plaqueStars(stars).map((p, i) => (
              <G key={i} transform={`translate(${p.x} ${PLAQUE.padY}) scale(${STAR.size / 20})`}>
                <Path d={STAR_PATH} fill={p.filled ? '#FFC531' : '#E6DDD5'} stroke={INK} strokeWidth={1.3} strokeLinejoin="round" />
              </G>
            ))}
          </G>
          {pinXs(Number(pins), sign).map((x, i) => (
            <G key={`pin${i}`} transform={`translate(${x} ${box.pinY}) scale(${PIN.size / 20})`}>
              <Path d={STAR_PATH} fill="#FFD54A" stroke={INK} strokeWidth={1.6} strokeLinejoin="round" />
            </G>
          ))}
        </G>
      </Svg>
      {local ? (
        <View testID="local-stamp" style={[styles.stamp, Number(st) >= 4 && styles.stampTop, { left: stampAt.left, top: stampAt.top }]}>
          <Text style={styles.stampText} numberOfLines={1} maxFontSizeMultiplier={1.1}>
            {local}
          </Text>
        </View>
      ) : null}
      {tag !== 'full' ? (
        <View testID="pay-tag" style={[styles.tag, tag === 'half' ? styles.tagHalf : styles.tagDouble, { left: tagAt.left, top: tagAt.top }]}>
          <Text style={[styles.tagText, tag === 'half' && styles.tagTextHalf]} maxFontSizeMultiplier={1.1}>
            {PAY_WORDS[tag as PayTag]}
          </Text>
        </View>
      ) : null}
    </View>
  );
});

const styles = StyleSheet.create({
  tag: {
    position: 'absolute',
    width: TAG.w,
    height: TAG.h,
    borderRadius: 9,
    borderWidth: 1.5,
    borderColor: C.ink,
    alignItems: 'center',
    justifyContent: 'center',
  },
  stamp: {
    position: 'absolute',
    width: STAMP.w,
    height: STAMP.h,
    borderRadius: 9,
    borderWidth: 1.5,
    borderColor: C.ink,
    backgroundColor: '#FFF4E0',
    alignItems: 'center',
    justifyContent: 'center',
  },
  stampTop: { backgroundColor: '#CDEFC9', borderColor: C.basilDark },
  stampText: { fontFamily: F.bold, fontSize: 10, lineHeight: 12, color: C.ink },
  tagHalf: { backgroundColor: C.tomato },
  tagDouble: { backgroundColor: C.cheese },
  tagText: { fontFamily: F.bold, fontSize: 10, lineHeight: 12, color: C.ink },
  tagTextHalf: { color: '#fff' },
});
