// A recipe card's picture (D457): the crust's shape follows the card's number (1 round, 2 pan, 3 long stromboli, 4 half-moon calzone) and
// the toppings follow the shop (tomato and basil Downtown, pepperoni in the Suburbs, shellfish on the Waterfront, onion and pepper at the
// University, sausage and pineapple Industrial, truffle and gold leaf Uptown). A card not owned yet is the same shape, flat: a real silhouette.
import { memo } from 'react';
import Svg, { Circle, G, Path, Rect } from 'react-native-svg';

import type { NeighborhoodId } from '../../content/types';

const INK = '#3B1F14';
type Glyph = 'circle' | 'leaf' | 'square' | 'diamond' | 'ring';
const TOP: Record<NeighborhoodId, { a: string; b: string; glyph: Glyph }> = {
  downtown: { a: '#D8402B', b: '#3FAE5A', glyph: 'leaf' },
  suburbs: { a: '#B8321F', b: '#FFE08A', glyph: 'circle' },
  waterfront: { a: '#F28B82', b: '#9FB7C9', glyph: 'diamond' },
  university: { a: '#8E4FB5', b: '#6DBE5C', glyph: 'ring' },
  industrial: { a: '#7B4A2D', b: '#F6D04A', glyph: 'square' },
  uptown: { a: '#2A1A14', b: '#F5B700', glyph: 'diamond' },
};
/** Topping spots inside each crust, in the 40 x 40 box. */
const SPOTS: Record<1 | 2 | 3 | 4, readonly (readonly [number, number])[]> = {
  1: [[-6, -4], [5, -6], [1, 5], [-7, 6], [8, 3]],
  2: [[-8, -6], [0, -7], [8, -5], [-7, 2], [2, 3], [9, 5], [-3, 8]],
  3: [[-12, 0], [-5, -3], [2, 2], [9, -2], [14, 2], [-1, 5]],
  4: [[-8, 0], [-1, -6], [7, 0], [0, 1]],
};

function Shape({ n, fill, stroke, opacity = 1 }: { n: 1 | 2 | 3 | 4; fill: string; stroke?: string; opacity?: number }) {
  const common = { fill, fillOpacity: opacity, stroke: stroke ?? 'none', strokeWidth: 1.4 };
  if (n === 1) return <Circle r={17} {...common} />;
  if (n === 2) return <Rect x={-16} y={-14} width={32} height={28} rx={5} {...common} />;
  if (n === 3) return <Path d="M-19 0 Q-19 -11 -8 -11 H8 Q19 -11 19 0 Q19 11 8 11 H-8 Q-19 11 -19 0 Z" {...common} />;
  return <Path d="M-17 6 A17 17 0 0 1 17 6 Q0 10 -17 6 Z" {...common} />;
}

function Topping({ x, y, color, glyph }: { x: number; y: number; color: string; glyph: Glyph }) {
  const p = { fill: color, stroke: INK, strokeWidth: 0.5 };
  if (glyph === 'leaf') return <Path d={`M${x - 2.6} ${y} Q${x} ${y - 3.4} ${x + 2.6} ${y} Q${x} ${y + 3.4} ${x - 2.6} ${y} Z`} {...p} />;
  if (glyph === 'square') return <Rect x={x - 2} y={y - 2} width={4} height={4} rx={0.8} {...p} />;
  if (glyph === 'diamond') return <Path d={`M${x} ${y - 2.8} L${x + 2.4} ${y} L${x} ${y + 2.8} L${x - 2.4} ${y} Z`} {...p} />;
  if (glyph === 'ring') return <Circle cx={x} cy={y} r={2.4} fill="none" stroke={color} strokeWidth={1.2} />;
  return <Circle cx={x} cy={y} r={2.5} {...p} />;
}

export const RecipeArt = memo(function RecipeArt({ hood, n, owned, size = 44 }: { hood: NeighborhoodId; n: 1 | 2 | 3 | 4; owned: boolean; size?: number }) {
  const t = TOP[hood];
  return (
    <Svg width={size} height={size} viewBox="-20 -20 40 40" accessibilityElementsHidden importantForAccessibility="no-hide-descendants">
      {owned ? (
        <G>
          <Shape n={n} fill="#F2B25C" stroke={INK} />
          <G transform="scale(0.78)">
            <Shape n={n} fill="#FFD67A" />
          </G>
          {SPOTS[n].map(([x, y], i) => (
            <Topping key={i} x={x} y={y} color={i % 2 ? t.b : t.a} glyph={t.glyph} />
          ))}
        </G>
      ) : (
        <Shape n={n} fill={INK} opacity={0.22} />
      )}
    </Svg>
  );
});
