// A shop's three mastery stars (heads, Flagship, golden ovens): lit gold when earned, a dim outline when not.
// `StarPips` is for headers (a small Svg); `MapStars` draws the same three inside the City map's own Svg.
// Primitive props only, so a pip row repaints when a star is earned and never on a game tick.
import { memo } from 'react';
import Svg, { G, Path } from 'react-native-svg';

import { starPath } from './mastery-model';

// G97: a deeper gold than the selected tab's cheese (#FFC531), with a white halo, so a lit star never vanishes on it
const GOLD = '#F29A00';
const GOLD_EDGE = '#8A5200';
const HALO = '#FFFFFF';
const DIM = 'rgba(59,31,20,0.14)';
const DIM_EDGE = 'rgba(59,31,20,0.35)';

/** Which of the three are lit, from `pipBits` (heads = 1, Flagship = 2, golden = 4). */
const lit = (bits: number, i: number) => (bits & (1 << i)) !== 0;

export const StarPips = memo(function StarPips({ bits, size = 14, testID }: { bits: number; size?: number; testID?: string }) {
  const gap = size * 0.15;
  const w = size * 3 + gap * 2;
  return (
    <Svg testID={testID} width={w} height={size} viewBox={`0 0 ${w} ${size}`} accessibilityLabel={`${[0, 1, 2].filter((i) => lit(bits, i)).length} of 3 stars`}>
      {[0, 1, 2].map((i) => lit(bits, i) && <Path key={`h${i}`} d={starPath(size / 2 + i * (size + gap), size / 2 + 0.5, size / 2 - 0.5)} fill={HALO} stroke={HALO} strokeWidth={size * 0.22} strokeLinejoin="round" />)}
      {[0, 1, 2].map((i) => (
        <Path key={i} d={starPath(size / 2 + i * (size + gap), size / 2 + 0.5, size / 2 - 0.5)} fill={lit(bits, i) ? GOLD : DIM} stroke={lit(bits, i) ? GOLD_EDGE : DIM_EDGE} strokeWidth={size * 0.07} strokeLinejoin="round" />
      ))}
    </Svg>
  );
});

/** The pips inside the map's SVG units, centred on x, with y their middle. */
export function MapStars({ x, y, bits, r = 2.1 }: { x: number; y: number; bits: number; r?: number }) {
  const step = r * 2.3;
  return (
    <G>
      {[0, 1, 2].map((i) => (
        <Path key={i} d={starPath(x + (i - 1) * step, y, r)} fill={lit(bits, i) ? GOLD : '#E7DDD0'} stroke={lit(bits, i) ? GOLD_EDGE : '#B5A99C'} strokeWidth={0.3} strokeLinejoin="round" />
      ))}
    </G>
  );
}
