// A recipe card's picture: a little pizza, its toppings by the card's number (1-4); a card not owned yet is a flat silhouette.
import { memo } from 'react';
import Svg, { Circle, G } from 'react-native-svg';

const INK = '#3B1F14';
const TOPPINGS: readonly (readonly [number, number])[][] = [
  [[-5, -3], [5, -5], [1, 5]],
  [[-6, -2], [0, -7], [6, -1], [-1, 5], [5, 6]],
  [[-5, -5], [5, -4], [-6, 3], [4, 3], [0, -1]],
  [[-7, -1], [-2, -7], [5, -6], [7, 1], [1, 6], [-5, 6], [0, 0]],
];

export const RecipeArt = memo(function RecipeArt({ n, owned, size = 44 }: { n: 1 | 2 | 3 | 4; owned: boolean; size?: number }) {
  return (
    <Svg width={size} height={size} viewBox="-20 -20 40 40" accessibilityElementsHidden importantForAccessibility="no-hide-descendants">
      <Circle r={17} fill={owned ? '#F2B25C' : INK} fillOpacity={owned ? 1 : 0.2} stroke={owned ? INK : 'none'} strokeWidth={1.4} />
      {owned && (
        <G>
          <Circle r={12.5} fill="#E8432E" />
          <Circle r={11} fill="#FFD67A" />
          {TOPPINGS[n - 1].map(([x, y], i) => (
            <Circle key={i} cx={x} cy={y} r={2.4} fill={i % 2 ? '#3FAE5A' : '#C83A27'} stroke={INK} strokeWidth={0.5} />
          ))}
        </G>
      )}
    </Svg>
  );
});
