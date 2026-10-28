// Placeholder scene backdrops: one flat SVG vignette per location.
import Svg, { Circle, Defs, G, LinearGradient, Path, Rect, Stop } from 'react-native-svg';

import type { Backdrop as BackdropId } from '../content/types';

const INK = '#3B1F14';

const SKY: Record<BackdropId, [string, string]> = {
  shop: ['#F7D9A8', '#F2B880'],
  downtown: ['#9EC9F0', '#D9ECFA'],
  suburbs: ['#A6DCF5', '#E6F7FF'],
  waterfront: ['#FFB88C', '#FFE1C2'],
  university: ['#B9A5E8', '#E8DEFF'],
  industrial: ['#7C8597', '#C3C8D2'],
  uptown: ['#2E3A6B', '#6A5ACD'],
  'megaslice-hq': ['#3A1450', '#7B2CBF'],
};

function Building({ x, w, h, color }: { x: number; w: number; h: number; color: string }) {
  const rows = Math.floor((h - 10) / 14);
  const cols = Math.max(1, Math.floor((w - 6) / 12));
  return (
    <G>
      <Rect x={x} y={200 - h} width={w} height={h} fill={color} stroke={INK} strokeWidth={2} />
      {Array.from({ length: rows }).map((_, r) =>
        Array.from({ length: cols }).map((__, c) => (
          <Rect key={`${r}-${c}`} x={x + 6 + c * 12} y={200 - h + 8 + r * 14} width={6} height={8} fill="#FFF3B0" opacity={0.85} />
        )),
      )}
    </G>
  );
}

function Scenery({ id }: { id: BackdropId }) {
  switch (id) {
    case 'shop':
      return (
        <G>
          <Rect x={0} y={150} width={400} height={50} fill="#C97B4A" />
          {Array.from({ length: 10 }).map((_, i) => (
            <Rect key={i} x={i * 40} y={150} width={20} height={50} fill="#B0653A" />
          ))}
          <Path d="M250 150 L250 70 Q300 30 350 70 L350 150 Z" fill="#B85C38" stroke={INK} strokeWidth={3} />
          <Path d="M272 150 L272 105 Q300 85 328 105 L328 150 Z" fill="#2B1A12" />
          <Path d="M280 150 L285 125 L292 140 L300 118 L308 140 L315 125 L320 150 Z" fill="#FF9F1C" />
          <Rect x={20} y={40} width={120} height={60} rx={8} fill="#FFFFFF" stroke={INK} strokeWidth={3} />
          <Circle cx={80} cy={70} r={22} fill="#FFC531" stroke={INK} strokeWidth={2} />
          {[[72, 62], [88, 66], [78, 80], [92, 78]].map(([cx, cy], i) => (
            <Circle key={i} cx={cx} cy={cy} r={4} fill="#E8432E" />
          ))}
        </G>
      );
    case 'downtown':
      return (
        <G>
          <Building x={10} w={60} h={120} color="#E9A86B" />
          <Building x={80} w={50} h={150} color="#D98A5A" />
          <Building x={140} w={70} h={100} color="#F2C08A" />
          <Building x={220} w={55} h={160} color="#C9774A" />
          <Building x={285} w={50} h={110} color="#E7B07A" />
          <Building x={342} w={50} h={135} color="#D58E5E" />
          <Rect x={0} y={185} width={400} height={15} fill="#8D8D8D" />
        </G>
      );
    case 'suburbs':
      return (
        <G>
          <Rect x={0} y={160} width={400} height={40} fill="#7BC96F" />
          {[20, 150, 280].map((x, i) => (
            <G key={x}>
              <Rect x={x} y={110} width={90} height={60} fill={['#F6E7C1', '#FADADD', '#D6EAF8'][i]} stroke={INK} strokeWidth={2.5} />
              <Path d={`M${x - 8} 112 L${x + 45} 75 L${x + 98} 112 Z`} fill="#C0392B" stroke={INK} strokeWidth={2.5} />
              <Rect x={x + 36} y={135} width={18} height={35} fill="#8E5A3C" stroke={INK} strokeWidth={2} />
            </G>
          ))}
          <Circle cx={360} cy={40} r={22} fill="#FFE066" />
        </G>
      );
    case 'waterfront':
      return (
        <G>
          <Rect x={0} y={140} width={400} height={60} fill="#4FA3D1" />
          <Path d="M0 150 Q25 144 50 150 T100 150 T150 150 T200 150 T250 150 T300 150 T350 150 T400 150" stroke="#BDE6FA" strokeWidth={3} fill="none" />
          <Rect x={0} y={128} width={200} height={14} fill="#A0703F" stroke={INK} strokeWidth={2} />
          {[20, 70, 120, 170].map((x) => (
            <Rect key={x} x={x} y={140} width={8} height={40} fill="#7A522B" />
          ))}
          <Path d="M240 140 L340 140 L320 165 L258 165 Z" fill="#FFFFFF" stroke={INK} strokeWidth={2.5} />
          <Path d="M290 140 L290 70 L330 130 Z" fill="#F9E79F" stroke={INK} strokeWidth={2} />
          <Circle cx={330} cy={60} r={28} fill="#FF8C42" opacity={0.9} />
        </G>
      );
    case 'university':
      return (
        <G>
          <Rect x={0} y={170} width={400} height={30} fill="#7BC96F" />
          <Rect x={90} y={80} width={220} height={95} fill="#E8D8C3" stroke={INK} strokeWidth={3} />
          <Path d="M80 82 L200 35 L320 82 Z" fill="#A04A3B" stroke={INK} strokeWidth={3} />
          {[110, 150, 190, 230, 270].map((x) => (
            <Rect key={x} x={x} y={95} width={14} height={75} fill="#FFFFFF" stroke={INK} strokeWidth={1.5} />
          ))}
          <Circle cx={200} cy={62} r={10} fill="#FFFFFF" stroke={INK} strokeWidth={2} />
        </G>
      );
    case 'industrial':
      return (
        <G>
          <Rect x={0} y={170} width={400} height={30} fill="#6D6D6D" />
          <Path d="M30 175 L30 110 L80 130 L80 110 L130 130 L130 110 L180 130 L180 175 Z" fill="#9C8B7A" stroke={INK} strokeWidth={3} />
          <Rect x={210} y={60} width={24} height={115} fill="#8B5A3C" stroke={INK} strokeWidth={2.5} />
          <Rect x={250} y={80} width={24} height={95} fill="#8B5A3C" stroke={INK} strokeWidth={2.5} />
          <Circle cx={222} cy={45} r={14} fill="#DADADA" opacity={0.8} />
          <Circle cx={240} cy={30} r={18} fill="#DADADA" opacity={0.6} />
          <Rect x={300} y={120} width={80} height={55} fill="#E67E22" stroke={INK} strokeWidth={2.5} />
        </G>
      );
    case 'uptown':
      return (
        <G>
          {[[20, 40, 170], [70, 55, 140], [135, 45, 185], [190, 60, 160], [260, 45, 190], [315, 70, 150]].map(([x, w, h], i) => (
            <Building key={i} x={x} w={w} h={h} color={['#41436A', '#984063', '#41436A', '#5B5F97', '#984063', '#41436A'][i]} />
          ))}
          {[[40, 20], [120, 35], [300, 15], [370, 40]].map(([cx, cy], i) => (
            <Circle key={i} cx={cx} cy={cy} r={1.8} fill="#FFFFFF" />
          ))}
          <Circle cx={355} cy={30} r={14} fill="#FFF3B0" />
        </G>
      );
    case 'megaslice-hq':
      return (
        <G>
          <Rect x={110} y={20} width={180} height={180} fill="#2A0A3A" stroke="#000" strokeWidth={3} />
          {Array.from({ length: 6 }).map((_, r) =>
            Array.from({ length: 6 }).map((__, c) => <Rect key={`${r}${c}`} x={125 + c * 27} y={35 + r * 26} width={16} height={14} fill="#C77DFF" opacity={0.5} />),
          )}
          <Path d="M200 40 L240 110 L160 110 Z" fill="#FFC531" stroke="#000" strokeWidth={3} />
          <Circle cx={190} cy={85} r={6} fill="#E8432E" />
          <Circle cx={210} cy={95} r={5} fill="#E8432E" />
        </G>
      );
  }
}

export function Backdrop({ id, width, height }: { id: BackdropId; width: number; height: number }) {
  const [top, bottom] = SKY[id];
  return (
    <Svg width={width} height={height} viewBox="0 0 400 200" preserveAspectRatio="xMidYMax slice">
      <Defs>
        <LinearGradient id={`sky-${id}`} x1="0" y1="0" x2="0" y2="1">
          <Stop offset="0" stopColor={top} />
          <Stop offset="1" stopColor={bottom} />
        </LinearGradient>
      </Defs>
      <Rect x={0} y={0} width={400} height={200} fill={`url(#sky-${id})`} />
      <Scenery id={id} />
    </Svg>
  );
}
