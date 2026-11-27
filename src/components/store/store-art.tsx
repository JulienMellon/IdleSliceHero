// The paid screens' art (card U3, D496): the Founder awning hero, the content chips and the ribbon, so a pack reads as a prize, not a system alert.
import { StyleSheet, Text, View } from 'react-native';
import Svg, { Circle, G, Path, Rect } from 'react-native-svg';

import { C, F } from '../../theme';
import { BoostIcon, DiamondIcon } from '../icons';
import { AWNING_COLORS, AWNING_VIEW, awningStripes } from './awning-art';
import type { ProductId } from '../../services/types';
import type { Chip } from './store-model';

const INK = C.ink;
const STRIPES = awningStripes();

/** The red-and-white striped awning, `height` pt tall and centred. */
export function FounderAwning({ height = 56 }: { height?: number }) {
  const width = (height * AWNING_VIEW.w) / AWNING_VIEW.h;
  return (
    <Svg
      width={width}
      height={height}
      viewBox={`0 0 ${AWNING_VIEW.w} ${AWNING_VIEW.h}`}
      style={styles.awning}
      accessibilityElementsHidden
      importantForAccessibility="no-hide-descendants"
    >
      {STRIPES.map((s) => (
        <Path key={s.x} d={s.d} fill={s.fill} stroke={INK} strokeWidth={3} strokeLinejoin="round" />
      ))}
      <Rect x={0} y={0} width={AWNING_VIEW.w} height={AWNING_VIEW.bar} rx={4} fill={AWNING_COLORS.piping} stroke={INK} strokeWidth={3} />
    </Svg>
  );
}

/** The awning over a small shopfront (wall, window, door): the Starter Pack's picture. `height` is the awning's; the wall is drawn at the same width under it. */
export function FounderStorefront({ height = 44 }: { height?: number }) {
  const width = (height * AWNING_VIEW.w) / AWNING_VIEW.h;
  const wall = (width * 40) / AWNING_VIEW.w;
  return (
    <View style={[styles.front, { height: height + wall - 10 }]}>
      <FounderAwning height={height} />
      <Svg
        width={width}
        height={wall}
        viewBox={`0 0 ${AWNING_VIEW.w} 40`}
        style={[styles.wall, { top: height - 10 }]}
        accessibilityElementsHidden
        importantForAccessibility="no-hide-descendants"
      >
        <Rect x={9} y={0} width={AWNING_VIEW.w - 18} height={40} fill="#FFF0D6" stroke={INK} strokeWidth={3} />
        <Rect x={30} y={14} width={104} height={20} rx={3} fill="#BFE3F5" stroke={INK} strokeWidth={3} />
        <Path d="M82 14 V34" stroke={INK} strokeWidth={3} />
        <Rect x={194} y={8} width={44} height={32} rx={3} fill={C.tomato} stroke={INK} strokeWidth={3} />
        <Rect x={228} y={22} width={5} height={5} rx={2.5} fill="#FFC531" stroke={INK} strokeWidth={1.5} />
      </Svg>
    </View>
  );
}

const GEM_FILL = '#7CC8EE';
/** A cut gem at (x, y), drawn from the 20-unit diamond icon at scale `s`. */
function Gem({ x, y, s }: { x: number; y: number; s: number }) {
  return (
    <G transform={`translate(${x} ${y}) scale(${s})`}>
      <Path d="M5 3 H15 L19 8 L10 18 L1 8 Z" fill={GEM_FILL} stroke={INK} strokeWidth={1.3} strokeLinejoin="round" />
      <Path d="M1 8 H19 M7 3 L5.5 8 L10 18 M13 3 L14.5 8 L10 18" stroke={INK} strokeWidth={0.8} fill="none" strokeLinejoin="round" />
      <Path d="M6.5 5 L8.5 4.5" stroke="#fff" strokeWidth={1.2} strokeLinecap="round" />
    </G>
  );
}

const SACK = '#D9A066';
const WOOD = '#C98B4A';

/** The four diamond packs, one tier each (D559): two loose gems, a pouch of them, a crate heaped with them, a cart piled high. */
export function PackArt({ id, size = 56 }: { id: ProductId; size?: number }) {
  return (
    <Svg width={size} height={size} viewBox="0 0 60 60" accessibilityElementsHidden importantForAccessibility="no-hide-descendants">
      {id === 'diamonds_80' && (
        <>
          <Gem x={4} y={8} s={1.7} />
          <Gem x={30} y={28} s={1.4} />
        </>
      )}
      {id === 'diamonds_500' && (
        <>
          <Gem x={14} y={0} s={1} />
          <Gem x={30} y={3} s={0.9} />
          <Path d="M19 26 L23 16 H37 L41 26 Z" fill={SACK} stroke={INK} strokeWidth={2.2} strokeLinejoin="round" />
          <Path d="M19 26 Q6 34 9 47 Q12 57 30 57 Q48 57 51 47 Q54 34 41 26 Z" fill={SACK} stroke={INK} strokeWidth={2.2} strokeLinejoin="round" />
          <Rect x={19} y={23} width={22} height={5} rx={2.5} fill={C.tomato} stroke={INK} strokeWidth={2} />
          <Gem x={22} y={33} s={0.8} />
        </>
      )}
      {id === 'diamonds_1200' && (
        <>
          <Gem x={3} y={12} s={1.1} />
          <Gem x={19} y={4} s={1.3} />
          <Gem x={37} y={12} s={1.1} />
          <Rect x={4} y={26} width={52} height={30} rx={3} fill={WOOD} stroke={INK} strokeWidth={2.2} />
          <Path d="M4 36 H56 M4 46 H56" stroke={INK} strokeWidth={1.6} />
          <Path d="M10 26 V56 M50 26 V56" stroke={INK} strokeWidth={2.2} />
          <Rect x={22} y={36} width={16} height={10} rx={2} fill="#FFC531" stroke={INK} strokeWidth={1.6} />
        </>
      )}
      {id === 'diamonds_2600' && (
        <>
          <Gem x={1} y={12} s={1.1} />
          <Gem x={38} y={10} s={1.2} />
          <Gem x={13} y={3} s={1.4} />
          <Gem x={27} y={0} s={1.5} />
          <Gem x={22} y={13} s={1.1} />
          <Path d="M4 27 H52 L48 46 H8 Z" fill={WOOD} stroke={INK} strokeWidth={2.2} strokeLinejoin="round" />
          <Path d="M6 37 H50" stroke={INK} strokeWidth={1.6} />
          <Rect x={2} y={23} width={52} height={7} rx={3.5} fill="#FFC531" stroke={INK} strokeWidth={2} />
          <Path d="M52 30 L58 19" stroke={INK} strokeWidth={2.4} strokeLinecap="round" />
          <Circle cx={17} cy={51} r={7} fill={SACK} stroke={INK} strokeWidth={2.2} />
          <Circle cx={41} cy={51} r={7} fill={SACK} stroke={INK} strokeWidth={2.2} />
          <Circle cx={17} cy={51} r={2.2} fill="#FFC531" stroke={INK} strokeWidth={1.2} />
          <Circle cx={41} cy={51} r={2.2} fill="#FFC531" stroke={INK} strokeWidth={1.2} />
        </>
      )}
    </Svg>
  );
}

/** A crop of the awning's middle: about four stripes and their scallops, so it reads at chip size. */
function AwningGlyph({ size }: { size: number }) {
  const w = 120;
  return (
    <Svg
      width={(size * w) / AWNING_VIEW.h}
      height={size}
      viewBox={`${AWNING_VIEW.w / 2 - w / 2} 0 ${w} ${AWNING_VIEW.h}`}
      accessibilityElementsHidden
      importantForAccessibility="no-hide-descendants"
    >
      {STRIPES.map((s) => (
        <Path key={s.x} d={s.d} fill={s.fill} stroke={INK} strokeWidth={3} strokeLinejoin="round" />
      ))}
      <Rect x={0} y={0} width={AWNING_VIEW.w} height={AWNING_VIEW.bar} rx={4} fill={AWNING_COLORS.piping} stroke={INK} strokeWidth={3} />
    </Svg>
  );
}

function ChipIcon({ kind }: { kind: Chip['kind'] }) {
  if (kind === 'diamonds') return <DiamondIcon size={28} />;
  if (kind === 'boost') return <BoostIcon size={28} />;
  return <AwningGlyph size={28} />;
}

/** What a pack holds, as small cards, one to a line (a line of words has to fit beside its icon). */
export function ChipRow({ chips }: { chips: readonly Chip[] }) {
  if (!chips.length) return null;
  return (
    <View style={styles.row} testID="pack-chips">
      {chips.map((c) => (
        <View key={c.kind} style={styles.chip} accessible accessibilityLabel={`${c.title}. ${c.sub}`}>
          <ChipIcon kind={c.kind} />
          <View style={styles.chipText}>
            <Text style={styles.chipTitle} numberOfLines={1} maxFontSizeMultiplier={1.15}>
              {c.title}
            </Text>
            <Text style={styles.chipSub} numberOfLines={2} maxFontSizeMultiplier={1.15}>
              {c.sub}
            </Text>
          </View>
        </View>
      ))}
    </View>
  );
}

/** A ribbon on a card: on the card's top-right edge, or (`inline`) a tag in the flow of the title row. */
export function Ribbon({ text, inline = false }: { text: string; inline?: boolean }) {
  return (
    <View style={inline ? styles.tag : styles.ribbon} pointerEvents="none" testID="pack-ribbon">
      <Text style={styles.ribbonText} numberOfLines={1} maxFontSizeMultiplier={1.15}>
        {text}
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  awning: { alignSelf: 'center', zIndex: 1 },
  front: { alignItems: 'center' },
  wall: { position: 'absolute', alignSelf: 'center', zIndex: 0 },
  row: { gap: 6 },
  chip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    paddingVertical: 6,
    paddingHorizontal: 10,
    borderRadius: 12,
    backgroundColor: '#FFF4E0',
    borderWidth: 2,
    borderColor: C.cheeseDark,
  },
  chipText: { flex: 1, minWidth: 0 },
  chipTitle: { fontFamily: F.bold, fontSize: 14, color: C.ink },
  chipSub: { fontFamily: F.semi, fontSize: 12, color: C.inkSoft },
  ribbon: {
    position: 'absolute',
    top: -2,
    right: 14,
    backgroundColor: C.tomato,
    borderBottomLeftRadius: 8,
    borderBottomRightRadius: 8,
    borderWidth: 2,
    borderTopWidth: 0,
    borderColor: C.tomatoDark,
    paddingHorizontal: 10,
    paddingVertical: 3,
  },
  tag: {
    alignSelf: 'flex-start',
    backgroundColor: C.tomato,
    borderRadius: 8,
    borderWidth: 2,
    borderColor: C.tomatoDark,
    paddingHorizontal: 8,
    paddingVertical: 2,
  },
  ribbonText: { fontFamily: F.bold, fontSize: 11, color: '#fff', letterSpacing: 0.5 },
});
