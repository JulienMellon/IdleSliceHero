// The two worn cosmetics that are small drawings of their own (v5.15, S1): the neon counter sign and the master's plaque.
// What they replace and where they go is in cosmetics.ts. Memoised on primitives, like every scene piece.
import { memo } from 'react';
import { G, Path, Rect, Text as SvgText } from 'react-native-svg';

import { F } from '../../theme';
import { GOLD_PLAQUE, PLAQUE_H, PLAQUE_W } from './cosmetics';
import { INK } from './projection';

const PINK = '#FF5E9A';
const CYAN = '#6FE8FF';

/** The neon counter sign, in the 38 x 13 box of the ladder's "ORDER HERE" sign it stands in for (origin: bottom centre): a pink tube, a cyan underline and a halo. */
export const NeonCounterSign = memo(function NeonCounterSign() {
  return (
    <G>
      <Rect x={-23} y={-16} width={46} height={19} rx={9} fill={PINK} opacity={0.2} />
      <Rect x={-19} y={-12} width={38} height={13} rx={4} fill="#1E1630" stroke={INK} strokeWidth={1.1} />
      <Rect x={-17} y={-10} width={34} height={9} rx={3} fill="none" stroke={PINK} strokeWidth={1.2} />
      <SvgText x={0} y={-3.4} fontFamily={F.bold} fontSize={6} fill={PINK} stroke={PINK} strokeWidth={1.8} opacity={0.35} textAnchor="middle">
        SLICE
      </SvgText>
      <SvgText x={0} y={-3.4} fontFamily={F.bold} fontSize={6} fill="#FFE3EE" textAnchor="middle">
        SLICE
      </SvgText>
      <Path d="M-9 -1.6 H9" stroke={CYAN} strokeWidth={1} strokeLinecap="round" />
    </G>
  );
});

/** The master's plaque, centred on its own origin, PLAQUE_W x PLAQUE_H: brass plate, a rim, three engraved lines and a star. */
export const GoldPlaque = memo(function GoldPlaque() {
  return (
    <G>
      <Rect x={-PLAQUE_W / 2} y={-PLAQUE_H / 2} width={PLAQUE_W} height={PLAQUE_H} rx={1.6} fill={GOLD_PLAQUE.face} stroke={INK} strokeWidth={1} />
      <Rect x={-PLAQUE_W / 2 + 1.3} y={-PLAQUE_H / 2 + 1.3} width={PLAQUE_W - 2.6} height={PLAQUE_H - 2.6} rx={1} fill="none" stroke={GOLD_PLAQUE.rim} strokeWidth={0.6} />
      <Path d="M0 -5.6 l0.9 1.9 l2 0.3 l-1.5 1.4 l0.4 2 l-1.8 -1 l-1.8 1 l0.4 -2 l-1.5 -1.4 l2 -0.3 Z" fill={GOLD_PLAQUE.text} />
      <Path d="M-3.2 2 H3.2 M-3.2 4 H3.2 M-2 6 H2" stroke={GOLD_PLAQUE.text} strokeWidth={0.7} strokeLinecap="round" />
      <Path d="M-4 -6 L-2.6 -6.6" stroke="#fff" strokeWidth={0.8} opacity={0.7} strokeLinecap="round" />
    </G>
  );
});
