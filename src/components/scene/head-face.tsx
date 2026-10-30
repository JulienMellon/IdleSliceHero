// A station head's face (D345): a small bust with a role hat, so Finn, Gus and Coral are people, not an icon.
// Drawn at the origin, `size` units across. Looks are seeded from the head's name: the same face everywhere.
import { memo } from 'react';
import { Circle, G, Path, Rect } from 'react-native-svg';

import type { HeadKind } from '../../content/tuning';
import { INK } from './projection';

const SKIN = ['#F2C9A0', '#E0A877', '#C68B59', '#9C6B43', '#7A4E2D', '#FAD9BC'];
const HAIR = ['#3B2416', '#6B3E22', '#C98B3C', '#1E1E1E', '#8A8A8A', '#B5462E'];
const seed = (name: string) => Array.from(name).reduce((h, ch) => (h * 31 + ch.charCodeAt(0)) >>> 0, 7);

export const HeadFace = memo(function HeadFace({ kind, name, size }: { kind: HeadKind | 'gm'; name: string; size: number }) {
  const h = seed(name);
  const skin = SKIN[h % SKIN.length];
  const hair = HAIR[(h >>> 4) % HAIR.length];
  const k = size / 40;
  return (
    <G transform={`scale(${k})`}>
      {/* shoulders in the role's colour */}
      <Path d="M-15 20 Q-15 9 0 9 Q15 9 15 20 Z" fill={kind === 'oven' ? '#B23A48' : kind === 'counter' ? '#2E8B3E' : kind === 'gm' ? '#3B4A6B' : '#FFFFFF'} stroke={INK} strokeWidth={1.4} />
      <Circle cx={0} cy={-1} r={11} fill={skin} stroke={INK} strokeWidth={1.4} />
      {/* hair under the hat */}
      <Path d="M-11 -2 Q-12 -12 0 -12 Q12 -12 11 -2 Q8 -7 0 -7 Q-8 -7 -11 -2 Z" fill={hair} />
      <Circle cx={-4} cy={0} r={1.4} fill={INK} />
      <Circle cx={4} cy={0} r={1.4} fill={INK} />
      <Path d="M-4 5 Q0 8 4 5" stroke={INK} strokeWidth={1.3} fill="none" strokeLinecap="round" />
      <Circle cx={-7} cy={4} r={1.8} fill="#F08A7A" opacity={0.5} />
      <Circle cx={7} cy={4} r={1.8} fill="#F08A7A" opacity={0.5} />
      {kind === 'prep' && (
        // a tall white cook's cap
        <G>
          <Path d="M-9 -9 Q-13 -18 -6 -20 Q-3 -26 3 -22 Q10 -24 10 -16 Q13 -12 9 -9 Z" fill="#fff" stroke={INK} strokeWidth={1.2} />
          <Rect x={-9} y={-11} width={18} height={4} rx={1.5} fill="#fff" stroke={INK} strokeWidth={1.2} />
        </G>
      )}
      {kind === 'oven' && (
        // a red baker's bandana with a knot
        <G>
          <Path d="M-11 -5 Q-11 -14 0 -14 Q11 -14 11 -5 Q0 -9 -11 -5 Z" fill="#D9443A" stroke={INK} strokeWidth={1.2} />
          <Circle cx={-2} cy={-11} r={0.9} fill="#fff" />
          <Circle cx={4} cy={-10} r={0.9} fill="#fff" />
          <Path d="M10 -6 l5 -3 l-1 5 Z" fill="#D9443A" stroke={INK} strokeWidth={1} strokeLinejoin="round" />
        </G>
      )}
      {kind === 'counter' && (
        // a green cashier's visor
        <G>
          <Path d="M-11 -6 Q0 -11 11 -6 L11 -4 Q0 -8 -11 -4 Z" fill="#3FAE5A" stroke={INK} strokeWidth={1.2} />
          <Path d="M-2 -6 Q8 -7 15 -3 Q8 -2 -1 -4 Z" fill="#2E8B3E" stroke={INK} strokeWidth={1.1} />
        </G>
      )}
      {kind === 'gm' && <Path d="M-4 9 L0 15 L4 9 Z" fill="#D9443A" stroke={INK} strokeWidth={1} />}
    </G>
  );
});
