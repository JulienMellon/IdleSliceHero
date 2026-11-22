// The piles a slow station leaves (piles.ts places them): rolled dough on a steel stand at the pass, boxed pies on the counter, kraft bags on the pickup
// shelf. One memoised drawing per kind, taking primitives only (the item count, the anchor and the scale), so a pile re-renders only when its count moves.
import { memo } from 'react';
import { Ellipse, G, Path, Rect } from 'react-native-svg';
import { INK } from './projection';
import { STAND_H, type PileKind } from './piles';

const Dough = memo(function Dough({ n, stand }: { n: number; stand: boolean }) {
  const base = stand ? STAND_H : 0;
  return (
    <G>
      {stand && (
        <G>
          <Rect x={-6} y={-base} width={1.8} height={base} fill="#7C858E" stroke={INK} strokeWidth={0.7} />
          <Rect x={4.2} y={-base} width={1.8} height={base} fill="#7C858E" stroke={INK} strokeWidth={0.7} />
          <Rect x={-7.5} y={-base - 1.6} width={15} height={2.6} rx={0.8} fill="#AEB4BB" stroke={INK} strokeWidth={0.8} />
        </G>
      )}
      {Array.from({ length: n }).map((_, i) => (
        <G key={i}>
          <Ellipse cx={(i % 2) * 0.8 - 0.4} cy={-base - 3 - i * 2.6} rx={7} ry={2.8} fill="#FBEFD6" stroke={INK} strokeWidth={0.8} />
          <Ellipse cx={(i % 2) * 0.8 - 1.6} cy={-base - 3.6 - i * 2.6} rx={3.2} ry={0.8} fill="#fff" opacity={0.6} />
        </G>
      ))}
    </G>
  );
});

const Boxes = memo(function Boxes({ n }: { n: number }) {
  return (
    <G>
      {Array.from({ length: n }).map((_, i) => {
        const x = -9 + (i % 2 ? 1.2 : -0.8);
        const y = -5 * (i + 1);
        return (
          <G key={i}>
            <Rect x={x} y={y} width={18} height={5} rx={0.9} fill="#F6E7C1" stroke={INK} strokeWidth={0.8} />
            <Rect x={x + 0.8} y={y + 0.7} width={16.4} height={1.6} rx={0.6} fill="#FFF6E5" />
            <Path d={`M${x + 9} ${y + 2.4} v2.2`} stroke="#E8432E" strokeWidth={1.2} strokeLinecap="round" />
          </G>
        );
      })}
    </G>
  );
});

/** One kraft bag standing on the shelf, `x` its centre and `y` its foot: a trapezoid, a folded top and a tomato-red tag. */
const Bag = ({ x, y }: { x: number; y: number }) => (
  <G>
    <Path
      d={`M${x - 4.4} ${y} L${x - 3.8} ${y - 10} L${x + 3.8} ${y - 10} L${x + 4.4} ${y} Z`}
      fill="#D9B48A"
      stroke={INK}
      strokeWidth={0.8}
      strokeLinejoin="round"
    />
    <Path d={`M${x - 3.8} ${y - 10} h7.6 v2 h-7.6 Z`} fill="#C99A6B" stroke={INK} strokeWidth={0.6} strokeLinejoin="round" />
    <Rect x={x - 1.4} y={y - 6.2} width={2.8} height={2.4} rx={0.5} fill="#E8432E" />
  </G>
);

const Bags = memo(function Bags({ n }: { n: number }) {
  const low = Math.min(3, n);
  const high = Math.max(0, n - 3);
  return (
    <G>
      {/* the shelf: a plank on two brackets */}
      <Rect x={-15} y={-2.4} width={30} height={3} rx={0.8} fill="#9A6A44" stroke={INK} strokeWidth={0.8} />
      <Path d="M-11 0.6 L-11 5 L-6 0.6 M11 0.6 L11 5 L6 0.6" fill="none" stroke={INK} strokeWidth={1} strokeLinejoin="round" />
      {Array.from({ length: low }).map((_, i) => (
        <Bag key={`l${i}`} x={(i - (low - 1) / 2) * 9.5} y={-2.4} />
      ))}
      {Array.from({ length: high }).map((_, i) => (
        <Bag key={`h${i}`} x={(i - (high - 1) / 2) * 9.5 + 0.6} y={-12.4} />
      ))}
    </G>
  );
});

/** A pile of `n` items of `kind`, anchored at the bottom centre (ax, ay) and scaled by k. Nothing for n = 0. */
export const Pile = memo(function Pile({ kind, n, ax, ay, k, stand }: { kind: PileKind; n: number; ax: number; ay: number; k: number; stand: boolean }) {
  if (n <= 0) return null;
  return (
    <G transform={`translate(${ax.toFixed(1)} ${ay.toFixed(1)}) scale(${k.toFixed(3)})`}>
      {kind === 'dough' ? <Dough n={n} stand={stand} /> : kind === 'boxes' ? <Boxes n={n} /> : <Bags n={n} />}
    </G>
  );
});
