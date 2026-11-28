// The free gift's box (v5.25, card S7), drawn while a gift waits: a red box with a gold ribbon and bow, a soft halo, a sparkle on the lid and, every few seconds, a glint that sweeps
// across it (gift.ts `giftPose`). No lettering: the box says "take me" by its glow. The origin is the box's foot middle; it is 18 wide and 16 tall (renovation-art.ts GIFT box).
import { memo } from 'react';
import { Circle, Ellipse, G, Path, Rect } from 'react-native-svg';

import { INK } from './projection';

const RIBBON = '#F2C94C';
const L = { stroke: INK, strokeWidth: 1, strokeLinejoin: 'round' as const };

/** `bob`: how far the box floats above its place; `glint`: the sweep's progress along the lid (0: none). Primitives, so the memo skips an unchanged pose. */
export const GiftBox = memo(function GiftBox({ bob, glint }: { bob: number; glint: number }) {
  const gx = -6 + 12 * glint;
  const gs = glint > 0 ? Math.sin(Math.PI * glint) : 0;
  return (
    <G>
      <Ellipse cx={0} cy={0.8} rx={8.4 - bob * 0.6} ry={1.8} fill="#000" opacity={0.2} />
      <G transform={`translate(0 ${-bob})`}>
        <Circle cx={0} cy={-8} r={13} fill="#FFE08A" opacity={0.22 + gs * 0.18} />
        <Circle cx={0} cy={-8} r={9.6} fill="#FFE08A" opacity={0.2} />
        <Rect x={-8} y={-11} width={16} height={11} rx={1.4} fill="#D9443A" {...L} />
        <Rect x={-9} y={-15} width={18} height={5} rx={1.4} fill="#E8605A" {...L} />
        <Path d="M-8 -9.4 V-1" stroke="#fff" strokeWidth={1} opacity={0.35} strokeLinecap="round" />
        <Rect x={-2} y={-15} width={4} height={15} fill={RIBBON} stroke={INK} strokeWidth={0.8} />
        {/* the bow: two loops and a knot */}
        <Path d="M0 -15 Q-7 -22 -7 -17.4 Q-6.6 -15 0 -15 Q6.6 -15 7 -17.4 Q7 -22 0 -15 Z" fill={RIBBON} {...L} />
        <Circle cx={0} cy={-15.2} r={1.7} fill="#E3B52E" stroke={INK} strokeWidth={0.7} />
        {/* the sparkle that is always on the lid, and the glint that sweeps along it */}
        <Path d="M5.6 -18 L6.4 -15.8 L8.6 -15 L6.4 -14.2 L5.6 -12 L4.8 -14.2 L2.6 -15 L4.8 -15.8 Z" fill="#fff" opacity={0.9} />
        {glint > 0 && (
          <G opacity={gs}>
            <Path
              d={`M${gx} -14.8 L${gx + 1.2} -12.6 L${gx + 3.4} -11.4 L${gx + 1.2} -10.2 L${gx} -8 L${gx - 1.2} -10.2 L${gx - 3.4} -11.4 L${gx - 1.2} -12.6 Z`}
              fill="#fff"
            />
            <Path d={`M${gx - 2.4} -14.8 L${gx + 2.4} -8`} stroke="#fff" strokeWidth={1.2} opacity={0.7} strokeLinecap="round" />
          </G>
        )}
      </G>
    </G>
  );
});
