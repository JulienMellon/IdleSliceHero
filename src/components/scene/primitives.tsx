import { createContext, useContext, type ReactNode } from 'react';
import { Ellipse, G, Polygon } from 'react-native-svg';
import { INK, ONE_SCREEN, P, kAt, pts, shade, type SceneFrame } from './projection';

// ---------- drawing primitives ----------
/** A solid box: side face (towards the centre), front face, top face. */
/** `frame`: the drawing it stands in: its vanishing point says which side faces the room's centre. */
export function Box({ x0, x1, y0, y1, h, z = 0, color, top, frame = ONE_SCREEN }: { x0: number; x1: number; y0: number; y1: number; h: number; z?: number; color: string; top?: string; frame?: SceneFrame }) {
  const sideX = (x0 + x1) / 2 > frame.vanishX ? x0 : x1;
  const p = (x: number, y: number, zz: number) => P(x, y, zz, frame);
  return (
    <G>
      <Polygon points={pts([p(sideX, y0, z), p(sideX, y1, z), p(sideX, y1, z + h), p(sideX, y0, z + h)])} fill={shade(color, -0.25)} stroke={INK} strokeWidth={1} strokeLinejoin="round" />
      <Polygon points={pts([p(x0, y0, z), p(x1, y0, z), p(x1, y0, z + h), p(x0, y0, z + h)])} fill={color} stroke={INK} strokeWidth={1} strokeLinejoin="round" />
      <Polygon points={pts([p(x0, y0, z + h), p(x1, y0, z + h), p(x1, y1, z + h), p(x0, y1, z + h)])} fill={top ?? shade(color, 0.28)} stroke={INK} strokeWidth={1} strokeLinejoin="round" />
    </G>
  );
}

export function FloorShadow({ x, y, r }: { x: number; y: number; r: number }) {
  const [sx, sy] = P(x, y);
  const k = kAt(y);
  return <Ellipse cx={sx} cy={sy} rx={r * k} ry={r * k * 0.3} fill="rgba(59,31,20,0.22)" />;
}

// ---------- the mirrored plan's architecture ----------
// The mirrored floor plan reflects the layout itself (layout-space.ts), so everything that stands on a place (people, tables, the counter) is just placed there.
// The few pieces of architecture with a handed shape (the room's walls and back-wall decor, the facade and its doorway, the door leaf) are instead drawn from the
// plain plan and flipped, and their signs and lettering are `Upright`: the flip moves a sign to its mirrored place without turning its letters round.
const FlipContext = createContext(false);
/** Draws its children as their mirror image about the vertical line at screen x `axis` (the room's centre: the frame's vanishing point). Off: the children as they are. */
export function Flip({ on, axis, children }: { on: boolean; axis: number; children: ReactNode }) {
  if (!on) return <>{children}</>;
  return (
    <FlipContext.Provider value>
      <G transform={`translate(${2 * axis} 0) scale(-1 1)`}>{children}</G>
    </FlipContext.Provider>
  );
}
/** Inside a `Flip`: mirrors its children about their own centre `cx` (screen x, in the plain plan), so a sign lands where the flip puts it but reads the right way round. Outside one: nothing. */
export function Upright({ cx, children }: { cx: number; children: ReactNode }) {
  const flipped = useContext(FlipContext);
  if (!flipped) return <>{children}</>;
  return <G transform={`translate(${2 * cx} 0) scale(-1 1)`}>{children}</G>;
}
