// The piles a slow station leaves (piles.ts places them): rolled dough on a steel stand at the pass, boxed pies on the counter, kraft bags on the pickup
// shelf. One memoised drawing per kind, taking primitives only (the item count, the anchor, the scale, the floor's depth and the wobble step), so a pile
// re-renders only when its count moves or, while its station is piling, when its top item rocks. The first PILE_STACK items stand in the pile; the rest
// spill onto the floor beside it (D548).
import { memo } from 'react';
import { Ellipse, G, Path, Rect } from 'react-native-svg';
import { INK } from './projection';
import { PILE_STACK, SPILL_STEP, SPILL_X, STAND_H, type PileKind } from './piles';

/** The top item's rock (degrees) at wobble step 1 and 2 (0: still). */
const ROCK = [0, -5, 5] as const;
/** `rotate(...)` about a point, or nothing when still. */
const rock = (wob: number, cx: number, cy: number) => (wob > 0 ? `rotate(${ROCK[wob]} ${cx} ${cy})` : undefined);

const Disc = ({ cx, cy, wob = 0 }: { cx: number; cy: number; wob?: number }) => (
  <G transform={rock(wob, cx, cy)}>
    <Ellipse cx={cx} cy={cy} rx={8} ry={3.3} fill="#FBEFD6" stroke={INK} strokeWidth={0.8} />
    <Ellipse cx={cx - 1.2} cy={cy - 0.8} rx={3.6} ry={0.9} fill="#fff" opacity={0.6} />
  </G>
);

const Dough = memo(function Dough({ n, stand, drop, wob }: { n: number; stand: boolean; drop: number; wob: number }) {
  const base = stand ? STAND_H : 0;
  const stacked = Math.min(n, PILE_STACK);
  return (
    <G>
      {stand && (
        <G>
          <Rect x={-6} y={-base} width={1.8} height={base} fill="#7C858E" stroke={INK} strokeWidth={0.7} />
          <Rect x={4.2} y={-base} width={1.8} height={base} fill="#7C858E" stroke={INK} strokeWidth={0.7} />
          <Rect x={-8.5} y={-base - 1.6} width={17} height={2.6} rx={0.8} fill="#AEB4BB" stroke={INK} strokeWidth={0.8} />
        </G>
      )}
      {Array.from({ length: stacked }).map((_, i) => (
        <Disc key={i} cx={(i % 2) * 0.8 - 0.4} cy={-base - 3.4 - i * 3.2} wob={i === stacked - 1 ? wob : 0} />
      ))}
      {Array.from({ length: n - stacked }).map((_, i) => (
        <Disc key={`s${i}`} cx={SPILL_X + i * SPILL_STEP} cy={drop - 3} />
      ))}
    </G>
  );
});

const Box = ({ x, y, wob = 0 }: { x: number; y: number; wob?: number }) => (
  <G transform={rock(wob, x + 9, y + 2.5)}>
    <Rect x={x} y={y} width={18} height={5} rx={0.9} fill="#F6E7C1" stroke={INK} strokeWidth={0.8} />
    <Rect x={x + 0.8} y={y + 0.7} width={16.4} height={1.6} rx={0.6} fill="#FFF6E5" />
    <Path d={`M${x + 9} ${y + 2.4} v2.2`} stroke="#E8432E" strokeWidth={1.2} strokeLinecap="round" />
  </G>
);

const Boxes = memo(function Boxes({ n, drop, wob }: { n: number; drop: number; wob: number }) {
  const stacked = Math.min(n, PILE_STACK);
  return (
    <G>
      {Array.from({ length: stacked }).map((_, i) => (
        <Box key={i} x={-9 + (i % 2 ? 1.2 : -0.8)} y={-5 * (i + 1)} wob={i === stacked - 1 ? wob : 0} />
      ))}
      {/* the rest slid off the counter onto the floor in front of it */}
      {Array.from({ length: n - stacked }).map((_, i) => (
        <Box key={`s${i}`} x={SPILL_X + i * SPILL_STEP - 9} y={drop - 5} />
      ))}
    </G>
  );
});

/** One kraft bag standing on the shelf, `x` its centre and `y` its foot: a trapezoid, a folded top and a tomato-red tag. */
const Bag = ({ x, y, wob = 0 }: { x: number; y: number; wob?: number }) => (
  <G transform={rock(wob, x, y)}>
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

const Bags = memo(function Bags({ n, drop, wob }: { n: number; drop: number; wob: number }) {
  const stacked = Math.min(n, PILE_STACK);
  return (
    <G>
      {/* the shelf: a plank on two brackets */}
      <Rect x={-15} y={-2.4} width={30} height={3} rx={0.8} fill="#9A6A44" stroke={INK} strokeWidth={0.8} />
      <Path d="M-11 0.6 L-11 5 L-6 0.6 M11 0.6 L11 5 L6 0.6" fill="none" stroke={INK} strokeWidth={1} strokeLinejoin="round" />
      {Array.from({ length: stacked }).map((_, i) => (
        <Bag key={i} x={(i - (stacked - 1) / 2) * 9.5} y={-2.4} wob={i === stacked - 1 ? wob : 0} />
      ))}
      {/* bags past the shelf's three stand on the floor beside it */}
      {Array.from({ length: n - stacked }).map((_, i) => (
        <Bag key={`s${i}`} x={SPILL_X + i * SPILL_STEP} y={drop} />
      ))}
    </G>
  );
});

/** A pile of `n` items of `kind`, anchored at the bottom centre (ax, ay) and scaled by k, the floor `drop` below the anchor; `wob` (0-2) rocks the top item. Nothing for n = 0. */
export const Pile = memo(function Pile({
  kind,
  n,
  ax,
  ay,
  k,
  stand,
  drop,
  wob,
  dir = 1,
}: {
  kind: PileKind;
  n: number;
  ax: number;
  ay: number;
  k: number;
  stand: boolean;
  drop: number;
  wob: number;
  dir?: 1 | -1;
}) {
  if (n <= 0) return null;
  return (
    <G testID={`pile-${kind}`} transform={`translate(${ax.toFixed(1)} ${ay.toFixed(1)}) scale(${(dir * k).toFixed(3)} ${k.toFixed(3)})`}>
      {kind === 'dough' ? (
        <Dough n={n} stand={stand} drop={drop} wob={wob} />
      ) : kind === 'boxes' ? (
        <Boxes n={n} drop={drop} wob={wob} />
      ) : (
        <Bags n={n} drop={drop} wob={wob} />
      )}
    </G>
  );
});
