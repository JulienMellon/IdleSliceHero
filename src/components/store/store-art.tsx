// The paid screens' art (card U3, D496): the Founder awning hero, the content chips and the ribbon, so a pack reads as a prize, not a system alert.
import { StyleSheet, Text, View } from 'react-native';
import Svg, { Path, Rect } from 'react-native-svg';

import { C, F } from '../../theme';
import { BoostIcon, DiamondIcon } from '../icons';
import { AWNING_COLORS, AWNING_VIEW, awningStripes } from './awning-art';
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

/** What a pack holds, as small cards in a row. */
export function ChipRow({ chips }: { chips: readonly Chip[] }) {
  if (!chips.length) return null;
  return (
    <View style={styles.row} testID="pack-chips">
      {chips.map((c) => (
        <View key={c.kind} style={styles.chip} accessible accessibilityLabel={`${c.title} ${c.sub}`}>
          <ChipIcon kind={c.kind} />
          <Text style={styles.chipTitle} numberOfLines={1} adjustsFontSizeToFit maxFontSizeMultiplier={1.15}>
            {c.title}
          </Text>
          <Text style={styles.chipSub} numberOfLines={1} adjustsFontSizeToFit maxFontSizeMultiplier={1.15}>
            {c.sub}
          </Text>
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
  awning: { alignSelf: 'center' },
  row: { flexDirection: 'row', gap: 6 },
  chip: {
    flex: 1,
    minWidth: 0,
    alignItems: 'center',
    gap: 2,
    paddingVertical: 6,
    paddingHorizontal: 4,
    borderRadius: 12,
    backgroundColor: '#FFF4E0',
    borderWidth: 2,
    borderColor: C.cheeseDark,
  },
  chipTitle: { fontFamily: F.bold, fontSize: 14, color: C.ink, alignSelf: 'stretch', textAlign: 'center' },
  chipSub: { fontFamily: F.semi, fontSize: 11, color: C.inkSoft, alignSelf: 'stretch', textAlign: 'center' },
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
