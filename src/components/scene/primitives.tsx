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
