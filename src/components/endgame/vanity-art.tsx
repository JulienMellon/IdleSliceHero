// A small picture for each cosmetic of the Shop screen (44 pt): the part it dresses, in the cosmetic's colours.
import { memo } from 'react';
import Svg, { Circle, G, Path, Rect } from 'react-native-svg';

import type { VanityId } from './shop-model';

const INK = '#3B1F14';

export const VanityArt = memo(function VanityArt({ id, size = 44 }: { id: VanityId; size?: number }) {
  return (
    <Svg width={size} height={size} viewBox="0 0 44 44" accessibilityElementsHidden importantForAccessibility="no-hide-descendants">
      <Rect x={1} y={1} width={42} height={42} rx={10} fill="#FFF4E0" stroke="#E6D3B0" strokeWidth={1.5} />
      {id === 'oven-gold' || id === 'oven-woodfired' ? (
        <G>
          <Path d="M9 36 V22 a13 13 0 0 1 26 0 V36 Z" fill={id === 'oven-gold' ? '#F5B700' : '#A8714B'} stroke={INK} strokeWidth={1.5} />
          <Path d="M16 36 V26 a6 6 0 0 1 12 0 V36 Z" fill="#2A1208" />
          <Path d="M19 36 q3 -9 6 0 Z" fill="#FF8A3D" />
        </G>
      ) : id === 'storefront-skin' ? (
        <G>
          <Rect x={8} y={14} width={28} height={22} rx={2} fill="#9ED0E6" stroke={INK} strokeWidth={1.5} />
          <Path d="M6 14 h32 l-3 7 h-26 Z" fill="#E8432E" stroke={INK} strokeWidth={1.5} />
          <Rect x={18} y={25} width={8} height={11} fill="#7E5038" stroke={INK} strokeWidth={1} />
        </G>
      ) : id === 'scooter-mint' ? (
        <G>
          <Circle cx={13} cy={31} r={5} fill="#fff" stroke={INK} strokeWidth={1.5} />
          <Circle cx={32} cy={31} r={5} fill="#fff" stroke={INK} strokeWidth={1.5} />
          <Path d="M13 31 L19 22 H29 L32 31" stroke={INK} strokeWidth={1.5} fill="#8FE3C0" />
          <Rect x={16} y={14} width={10} height={8} rx={2} fill="#8FE3C0" stroke={INK} strokeWidth={1.5} />
        </G>
      ) : id === 'neon-counter' ? (
        <G>
          <Rect x={7} y={26} width={30} height={10} rx={2} fill="#7E5038" stroke={INK} strokeWidth={1.5} />
          <Path d="M11 19 h22" stroke="#FF4FD8" strokeWidth={3.5} strokeLinecap="round" opacity={0.35} />
          <Path d="M11 19 h22" stroke="#FF9BEA" strokeWidth={1.8} strokeLinecap="round" />
        </G>
      ) : id === 'awning-gold' ? (
        <G>
          {[0, 1, 2, 3, 4].map((i) => (
            <Path key={i} d={`M${7 + i * 6} 12 h6 l-0.5 12 q-2.5 3 -5 0 Z`} fill={i % 2 ? '#FFF4E0' : '#F5B700'} stroke={INK} strokeWidth={1.2} />
          ))}
          <Rect x={7} y={28} width={30} height={8} fill="#BFE3F5" stroke={INK} strokeWidth={1.2} />
        </G>
      ) : (
        <G>
          <Rect x={10} y={11} width={24} height={22} rx={3} fill="#F5B700" stroke={INK} strokeWidth={1.5} />
          <Path d="M16 19 h12 M16 24 h12 M16 29 h7" stroke={INK} strokeWidth={1.6} strokeLinecap="round" />
        </G>
      )}
    </Svg>
  );
});
