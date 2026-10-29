import { memo } from 'react';
import { F } from '../../theme';
import { Circle, Ellipse, G, Path, Rect, Text as SvgText } from 'react-native-svg';
import { INK, SCENE_W, CURB_Y, shade } from './projection';

// ---------- street + traffic ----------
export const CARS = [
  { lane: 0, speed: 46, offset: 40, color: '#56CCF2', kind: 'car' as const },
  { lane: 0, speed: 46, offset: 330, color: '#7B2CBF', kind: 'van' as const },
  { lane: 1, speed: 62, offset: 120, color: '#FFC531', kind: 'taxi' as const },
  { lane: 1, speed: 62, offset: 420, color: '#E8432E', kind: 'car' as const },
];

export const Car = memo(function Car({ x, y, color, kind, dir, label = 'MEGASLICE', labelColor = '#FFC531' }: { x: number; y: number; color: string; kind: 'car' | 'van' | 'taxi'; dir: 1 | -1; label?: string; labelColor?: string }) {
  const len = kind === 'van' ? 74 : 56;
  const h = kind === 'van' ? 30 : 22;
  return (
    <G transform={`translate(${x} ${y}) scale(${dir} 1) translate(${-len / 2} 0)`}>
      <Ellipse cx={len / 2} cy={1} rx={len / 2 + 4} ry={4} fill="rgba(0,0,0,0.3)" />
      <Rect x={0} y={-h - 4} width={len} height={h} rx={7} fill={color} stroke={INK} strokeWidth={1.2} />
      <Rect x={2} y={-h + 2} width={len - 4} height={4} rx={2} fill="#fff" opacity={0.25} />
      <Rect x={2} y={-10} width={len - 4} height={5} rx={2} fill="#000" opacity={0.15} />
      {kind !== 'van' ? (
        <G>
          <Path d={`M${len * 0.2} ${-h - 3} L${len * 0.3} ${-h - 15} L${len * 0.72} ${-h - 15} L${len * 0.86} ${-h - 3} Z`} fill={shade(color, 0.1)} stroke={INK} strokeWidth={1.2} />
          <Path d={`M${len * 0.32} ${-h - 4} L${len * 0.38} ${-h - 12} L${len * 0.5} ${-h - 12} L${len * 0.5} ${-h - 4} Z M${len * 0.55} ${-h - 4} L${len * 0.55} ${-h - 12} L${len * 0.68} ${-h - 12} L${len * 0.78} ${-h - 4} Z`} fill="#BFE3F5" stroke={INK} strokeWidth={0.8} />
        </G>
      ) : (
        <G>
          <Rect x={len * 0.68} y={-h} width={len * 0.26} height={h * 0.45} rx={3} fill="#BFE3F5" stroke={INK} strokeWidth={0.8} />
          <G transform={dir === -1 ? `translate(${len * 0.68} 0) scale(-1 1)` : undefined}>
            <SvgText x={len * 0.34} y={-h * 0.42} fontFamily={F.bold} fontSize={9} fill={labelColor} textAnchor="middle">
              {label}
            </SvgText>
          </G>
        </G>
      )}
      {kind === 'taxi' && <Rect x={len * 0.4} y={-h - 21} width={len * 0.2} height={6} rx={2} fill="#fff" stroke={INK} strokeWidth={0.8} />}
      {[0.22, 0.78].map((f) => (
        <G key={f}>
          <Circle cx={len * f} cy={-3} r={7} fill="#222" stroke={INK} strokeWidth={1} />
          <Circle cx={len * f} cy={-3} r={2.6} fill="#bbb" />
        </G>
      ))}
      <Rect x={len - 4} y={-h + 2} width={4} height={5} rx={1} fill="#FFF3B0" />
    </G>
  );
});

/** The shop's delivery vehicle parked by the door, drawn in the scene's outlined style. */
export const ParkedVehicle = memo(function ParkedVehicle({ x, y, v }: { x: number; y: number; v: number }) {
  if (v >= 2 && v <= 3) {
    return (
      <G transform={`translate(${x} ${y + 2}) scale(0.62)`}>
        <Car x={0} y={0} color={v === 3 ? '#D9443A' : '#E8432E'} kind={v === 3 ? 'van' : 'car'} dir={1} label="ROSA’S" labelColor="#FFF4E0" />
      </G>
    );
  }
  if (v === 4) {
    return (
      <G transform={`translate(${x} ${y - 18})`}>
        <Ellipse cx={0} cy={20} rx={14} ry={3} fill="rgba(59,31,20,0.2)" />
        <Path d="M-18 -4 H18" stroke={INK} strokeWidth={2} />
        {[-18, 18].map((dx) => <Ellipse key={dx} cx={dx} cy={-6} rx={9} ry={2} fill="#BFE3F5" stroke={INK} strokeWidth={0.8} />)}
        <Rect x={-10} y={-4} width={20} height={10} rx={4} fill="#9B51E0" stroke={INK} strokeWidth={1} />
        <Rect x={-6} y={6} width={12} height={8} rx={1} fill="#F6E7C1" stroke={INK} strokeWidth={0.8} />
      </G>
    );
  }
  const bike = v === 0;
  return (
    <G transform={`translate(${x} ${y})`}>
      <Ellipse cx={0} cy={1} rx={20} ry={3.5} fill="rgba(59,31,20,0.25)" />
      {[-12, 12].map((dx) => (
        <G key={dx}>
          <Circle cx={dx} cy={-7} r={bike ? 8 : 6.5} fill={bike ? 'none' : '#222'} stroke={INK} strokeWidth={bike ? 2 : 1} />
          <Circle cx={dx} cy={-7} r={2} fill="#bbb" />
        </G>
      ))}
      {bike ? (
        <Path d="M-12 -7 L-2 -18 L8 -18 L12 -7 M-2 -18 L2 -7 L8 -18 M8 -18 L6 -24 M-4 -20 H2" stroke="#E8432E" strokeWidth={2.2} fill="none" strokeLinejoin="round" strokeLinecap="round" />
      ) : (
        <G>
          <Path d="M-16 -9 Q-16 -20 -4 -20 L6 -20 L10 -10 L14 -10 L12 -5 L-16 -5 Z" fill="#FFC531" stroke={INK} strokeWidth={1.1} />
          <Path d="M8 -20 L12 -30 M9 -30 H16" stroke={INK} strokeWidth={1.8} strokeLinecap="round" />
          <Rect x={-18} y={-30} width={14} height={10} rx={1.5} fill="#E8432E" stroke={INK} strokeWidth={1} />
          <Rect x={-14} y={-27} width={6} height={3} rx={1} fill="#fff" opacity={0.8} />
        </G>
      )}
    </G>
  );
});

export const Street = memo(function Street() {
  return (
    <G>
      <Rect x={-20} y={CURB_Y} width={SCENE_W + 40} height={8} fill="#9B9386" stroke={INK} strokeWidth={0.8} />
      <Rect x={-20} y={CURB_Y + 8} width={SCENE_W + 40} height={120} fill="#4C5056" />
      <Rect x={-20} y={CURB_Y + 8} width={SCENE_W + 40} height={10} fill="#000" opacity={0.15} />
      {Array.from({ length: 10 }).map((_, i) => (
        <Rect key={i} x={i * 48 - 20} y={CURB_Y + 40} width={26} height={3.5} rx={1.5} fill="#F2D15C" />
      ))}
    </G>
  );
});

export const Sidewalk = memo(function Sidewalk({ frontY }: { frontY: number }) {
  return (
    <G>
      <Rect x={-20} y={frontY} width={SCENE_W + 40} height={CURB_Y - frontY} fill="#D3CCC0" />
      <Rect x={-20} y={frontY} width={SCENE_W + 40} height={16} fill="#000" opacity={0.06} />
      {Array.from({ length: 12 }).map((_, i) => (
        <Path key={i} d={`M${i * 40 - 6} ${frontY + 8} L${i * 40 - 32} ${CURB_Y}`} stroke="#B5AD9F" strokeWidth={1.1} />
      ))}
      <Path d={`M-20 ${frontY + 62} H${SCENE_W + 20}`} stroke="#B5AD9F" strokeWidth={1.1} />
    </G>
  );
});

/** A drifting cloud: the shape is memoised at the origin and only the translate changes per frame. */
export function Cloud({ x, y, k, dusk = false }: { x: number; y: number; k: number; dusk?: boolean }) {
  return (
    <G transform={`translate(${x.toFixed(1)} ${y})`}>
      <CloudShape k={k} dusk={dusk} />
    </G>
  );
}

const CloudShape = memo(function CloudShape({ k, dusk }: { k: number; dusk: boolean }) {
  const c = dusk ? '#F6C6A8' : '#fff';
  return (
    <G transform={`scale(${k})`}>
      <Ellipse cx={0} cy={8} rx={34} ry={12} fill={c} />
      <Circle cx={-14} cy={0} r={14} fill={c} />
      <Circle cx={6} cy={-6} r={19} fill={c} />
      <Circle cx={24} cy={2} r={13} fill={c} />
      <Ellipse cx={0} cy={13} rx={30} ry={5} fill={dusk ? '#B9A3C9' : '#DCEBF7'} />
    </G>
  );
});
