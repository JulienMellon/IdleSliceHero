// The two worn cosmetics that are small drawings of their own (v5.15, S1): the neon counter sign and the master's plaque.
// What they replace and where they go is in cosmetics.ts. Memoised on primitives, like every scene piece.
import { memo } from 'react';
import { Circle, G, Path, Rect, Text as SvgText } from 'react-native-svg';

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

/** The master's plaque, centred on its own origin, PLAQUE_W x PLAQUE_H (34 x 22): a brass plate with a double rim, corner rivets, MASTER over three stars, and a shine. */
export const GoldPlaque = memo(function GoldPlaque() {
  const w = PLAQUE_W;
  const h = PLAQUE_H;
  const star = (cx: number, cy: number, r: number) =>
    `M${cx} ${cy - r} L${cx + r * 0.3} ${cy - r * 0.32} L${cx + r} ${cy - r * 0.3} L${cx + r * 0.48} ${cy + r * 0.14} L${cx + r * 0.62} ${cy + r * 0.86} L${cx} ${cy + r * 0.48} L${cx - r * 0.62} ${cy + r * 0.86} L${cx - r * 0.48} ${cy + r * 0.14} L${cx - r} ${cy - r * 0.3} L${cx - r * 0.3} ${cy - r * 0.32} Z`;
  return (
    <G>
      <Rect x={-w / 2 + 1.5} y={-h / 2 + 2} width={w} height={h} rx={3} fill="rgba(59,31,20,0.3)" />
      <Rect x={-w / 2} y={-h / 2} width={w} height={h} rx={3} fill={GOLD_PLAQUE.rim} stroke={INK} strokeWidth={1.3} />
      <Rect x={-w / 2 + 2} y={-h / 2 + 2} width={w - 4} height={h - 4} rx={2} fill={GOLD_PLAQUE.face} stroke="#FFE9A0" strokeWidth={0.8} />
      {[[-w / 2 + 4.5, -h / 2 + 4.5], [w / 2 - 4.5, -h / 2 + 4.5], [-w / 2 + 4.5, h / 2 - 4.5], [w / 2 - 4.5, h / 2 - 4.5]].map(([x, y], i) => (
        <Circle key={i} cx={x} cy={y} r={1.1} fill={GOLD_PLAQUE.rim} />
      ))}
      <SvgText x={0} y={-1.2} fontFamily={F.bold} fontSize={6.6} fill={GOLD_PLAQUE.text} textAnchor="middle" letterSpacing={0.2}>
        MASTER
      </SvgText>
      {[-7, 0, 7].map((dx) => (
        <Path key={dx} d={star(dx, 5.6, 3.1)} fill={GOLD_PLAQUE.text} stroke="#FFF3B0" strokeWidth={0.3} />
      ))}
      <Path d={`M${-w / 2 + 4} ${-h / 2 + 3.4} L${-w / 2 + 13} ${-h / 2 + 3.4}`} stroke="#fff" strokeWidth={1.4} opacity={0.65} strokeLinecap="round" />
      <Path d={`M${-w / 2 + 4} ${-h / 2 + 3.4} L${-w / 2 + 3.4} ${-h / 2 + 8}`} stroke="#fff" strokeWidth={1.4} opacity={0.5} strokeLinecap="round" />
    </G>
  );
});
