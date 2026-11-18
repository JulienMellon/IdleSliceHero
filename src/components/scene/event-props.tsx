// The drawings of a running event (event-look.ts): a dusk wash over the backdrop and a string of warm lights across the top of the shop.
import { memo } from 'react';
import { Circle, G, Path, Rect } from 'react-native-svg';

import { CURB_Y, INK } from './projection';
import { lightString } from './event-look';

/** Dusk: a violet wash over the sky that fades to orange at the skyline. `x`, `y`, `w` and `h` are the area to tint (the backdrop above the sidewalk). */
export const DuskTint = memo(function DuskTint({ x, y, w, h }: { x: number; y: number; w: number; h: number }) {
  const band = h / 4;
  return (
    <G>
      {[0.55, 0.45, 0.36, 0.28].map((o, i) => (
        <Rect key={i} x={x} y={y + band * i} width={w} height={band + 0.5} fill={i < 2 ? '#3B2A6B' : '#FF7A45'} opacity={o} />
      ))}
    </G>
  );
});

/** A cord of string lights from `x0` to `x1` at `y`, sagging 14: warm bulbs with a soft halo, every 22. */
export const StringLights = memo(function StringLights({ x0, x1, y }: { x0: number; x1: number; y: number }) {
  const n = Math.max(2, Math.round((x1 - x0) / 22));
  const bulbs = lightString(x0, x1, y, 14, n);
  const cord = `M${x0} ${y} Q${(x0 + x1) / 2} ${y + 28} ${x1} ${y}`;
  return (
    <G>
      <Path d={cord} stroke={INK} strokeWidth={1.4} fill="none" />
      {bulbs.map((b, i) => (
        <G key={i}>
          <Circle cx={b.x} cy={b.y + 4} r={6.5} fill="#FFD76A" opacity={0.28} />
          <Circle cx={b.x} cy={b.y + 4} r={3} fill={i % 2 ? '#FFF3B0' : '#FFC531'} stroke={INK} strokeWidth={0.7} />
        </G>
      ))}
    </G>
  );
});

/** The cold line's frost (D514): while the shop's line is cold an icy wash lies over the sidewalk where the queue stands, with a few ice flecks, so "cold" reads without the strip's word. `x`/`w`: the sidewalk's span. */
export const ColdFrost = memo(function ColdFrost({ x, w, frontY }: { x: number; w: number; frontY: number }) {
  const h = CURB_Y - frontY;
  return (
    <G pointerEvents="none">
      <Rect x={x} y={frontY} width={w} height={h} fill="#9FD3F2" opacity={0.24} />
      <Rect x={x} y={frontY} width={w} height={5} fill="#E8F6FF" opacity={0.55} />
      {Array.from({ length: Math.max(3, Math.floor(w / 60)) }, (_, i) => {
        const cx = x + 22 + i * 60 + (i % 2) * 14;
        const cy = frontY + 18 + (i % 3) * 14;
        return (
          <Path
            key={i}
            d={`M${cx - 4} ${cy} H${cx + 4} M${cx} ${cy - 4} V${cy + 4} M${cx - 3} ${cy - 3} L${cx + 3} ${cy + 3} M${cx + 3} ${cy - 3} L${cx - 3} ${cy + 3}`}
            stroke="#fff"
            strokeWidth={1.2}
            strokeLinecap="round"
            opacity={0.8}
          />
        );
      })}
    </G>
  );
});
