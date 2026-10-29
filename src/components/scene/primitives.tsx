import { Ellipse, G, Polygon } from 'react-native-svg';
import { INK, P, kAt, pts, shade } from './projection';

// ---------- drawing primitives ----------
/** A solid box: side face (towards the centre), front face, top face. */
export function Box({ x0, x1, y0, y1, h, z = 0, color, top }: { x0: number; x1: number; y0: number; y1: number; h: number; z?: number; color: string; top?: string }) {
  const sideX = (x0 + x1) / 2 > 196.5 ? x0 : x1;
  return (
    <G>
      <Polygon points={pts([P(sideX, y0, z), P(sideX, y1, z), P(sideX, y1, z + h), P(sideX, y0, z + h)])} fill={shade(color, -0.25)} stroke={INK} strokeWidth={1} strokeLinejoin="round" />
      <Polygon points={pts([P(x0, y0, z), P(x1, y0, z), P(x1, y0, z + h), P(x0, y0, z + h)])} fill={color} stroke={INK} strokeWidth={1} strokeLinejoin="round" />
      <Polygon points={pts([P(x0, y0, z + h), P(x1, y0, z + h), P(x1, y1, z + h), P(x0, y1, z + h)])} fill={top ?? shade(color, 0.28)} stroke={INK} strokeWidth={1} strokeLinejoin="round" />
    </G>
  );
}

export function FloorShadow({ x, y, r }: { x: number; y: number; r: number }) {
  const [sx, sy] = P(x, y);
  const k = kAt(y);
  return <Ellipse cx={sx} cy={sy} rx={r * k} ry={r * k * 0.3} fill="rgba(59,31,20,0.22)" />;
}
