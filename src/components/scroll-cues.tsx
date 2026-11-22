// The off-screen cues of a wide shop (scroll-cues-model.ts): a chevron at each screen edge, 52 x 44 pt, when something that wants the player is out of sight on
// that side. A tap scrolls the shop there. Screen-fixed (it sits over the shop's view, not in its scrolling drawing). Primitive props only, so a frame with the same
// cues re-renders nothing.
import { memo } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import Svg, { Path } from 'react-native-svg';
import { F } from '../theme';
import { CUE_H, CUE_W, type CueKind } from './scroll-cues-model';

const TONE: Record<CueKind, { bg: string; ink: string }> = {
  jam: { bg: '#D9443A', ink: '#fff' },
  piling: { bg: '#E8762E', ink: '#fff' },
  bubble: { bg: '#FFF8EA', ink: '#3B1F14' },
  tap: { bg: '#FFC531', ink: '#3B1F14' },
};

interface CueProps {
  side: 'left' | 'right';
  kind: CueKind;
  word: string;
  label: string;
  scrollTo: number;
  top: number;
  onGo: (scrollTo: number) => void;
}

const Cue = memo(function Cue({ side, kind, word, label, scrollTo, top, onGo }: CueProps) {
  const tone = TONE[kind];
  return (
    <Pressable
      testID={`scroll-cue-${side}`}
      accessibilityRole="button"
      accessibilityLabel={label}
      onPress={() => onGo(scrollTo)}
      style={[styles.cue, side === 'left' ? styles.left : styles.right, { top, backgroundColor: tone.bg }]}
    >
      <Svg width={14} height={16} viewBox="0 0 14 16">
        <Path
          d={side === 'left' ? 'M10 2 L4 8 L10 14' : 'M4 2 L10 8 L4 14'}
          stroke={tone.ink}
          strokeWidth={3}
          strokeLinecap="round"
          strokeLinejoin="round"
          fill="none"
        />
      </Svg>
      <Text style={[styles.word, { color: tone.ink }]} numberOfLines={1} maxFontSizeMultiplier={1.1}>
        {word}
      </Text>
    </Pressable>
  );
});

export interface ScrollCuesProps {
  /** `''` for no cue on that side. */
  leftKind: CueKind | '';
  leftWord: string;
  leftLabel: string;
  leftScroll: number;
  rightKind: CueKind | '';
  rightWord: string;
  rightLabel: string;
  rightScroll: number;
  /** Distance of each chevron's top from the top of the shop view (pt): the two may differ, each keeps clear of the tappables on its side (G111). */
  leftTop: number;
  rightTop: number;
  onGo: (scrollTo: number) => void;
}

export const ScrollCues = memo(function ScrollCues(p: ScrollCuesProps) {
  if (!p.leftKind && !p.rightKind) return null;
  return (
    <View pointerEvents="box-none" style={StyleSheet.absoluteFill}>
      {p.leftKind ? <Cue side="left" kind={p.leftKind} word={p.leftWord} label={p.leftLabel} scrollTo={p.leftScroll} top={p.leftTop} onGo={p.onGo} /> : null}
      {p.rightKind ? (
        <Cue side="right" kind={p.rightKind} word={p.rightWord} label={p.rightLabel} scrollTo={p.rightScroll} top={p.rightTop} onGo={p.onGo} />
      ) : null}
    </View>
  );
});

const styles = StyleSheet.create({
  cue: {
    position: 'absolute',
    width: CUE_W,
    height: CUE_H,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 2,
    borderColor: '#3B1F14',
    opacity: 0.94,
  },
  left: { left: 0, borderLeftWidth: 0, borderTopRightRadius: 22, borderBottomRightRadius: 22 },
  right: { right: 0, borderRightWidth: 0, borderTopLeftRadius: 22, borderBottomLeftRadius: 22 },
  word: { fontFamily: F.bold, fontSize: 10, lineHeight: 12 },
});
