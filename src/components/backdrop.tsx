// Placeholder scene backdrops: one flat SVG vignette per location.
import Svg, { Circle, Defs, G, LinearGradient, Path, Rect, Stop, Text } from 'react-native-svg';

import type { Backdrop as BackdropId } from '../content/types';
import { F } from '../theme';

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
  'downtown-rain': ['#2B2D52', '#5C5470'],
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
    case 'downtown-rain':
      return (
        <G>
          {[[0, 60, 150, '#3E3A5C'], [64, 50, 175, '#4A4468'], [282, 52, 165, '#3E3A5C'], [340, 60, 140, '#4A4468']].map(([x, w, h, c], i) => (
            <Building key={i} x={x as number} w={w as number} h={h as number} color={c as string} />
          ))}
          {/* Rosa's storefront */}
          <Rect x={120} y={88} width={160} height={112} fill="#8E3B2E" stroke={INK} strokeWidth={3} />
          <Path d="M112 96 L288 96 L276 118 L124 118 Z" fill="#E8432E" stroke={INK} strokeWidth={2.5} />
          {[136, 168, 200, 232, 264].map((x) => (
            <Path key={x} d={`M${x - 12} 118 q12 12 24 0`} fill="#FFFFFF" stroke={INK} strokeWidth={1.5} />
          ))}
          <Rect x={142} y={134} width={56} height={50} fill="#F7C873" stroke={INK} strokeWidth={2.5} />
          <Rect x={214} y={134} width={44} height={66} fill="#5A2A1F" stroke={INK} strokeWidth={2.5} />
          {/* flickering neon sign: half the letters dark */}
          <Rect x={136} y={44} width={128} height={38} rx={8} fill="#1E1630" stroke="#FF5E7E" strokeWidth={3} />
          <Text x={200} y={71} fontSize={24} fontFamily={F.bold} fill="#FF8FA3" textAnchor="middle" opacity={0.95}>
            ROSA’S
          </Text>
          <Rect x={213} y={50} width={46} height={27} fill="#1E1630" opacity={0.75} />
          {/* rain */}
          {Array.from({ length: 46 }).map((_, i) => {
            const x = (i * 53) % 410;
            const y = -280 + ((i * 97) % 470);
            return <Path key={i} d={`M${x} ${y} l-6 18`} stroke="#B9C6FF" strokeWidth={2} opacity={0.55} strokeLinecap="round" />;
          })}
          <Rect x={0} y={192} width={400} height={8} fill="#2A2840" />
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

function Clouds({ dark }: { dark: boolean }) {
  const fill = dark ? 'rgba(255,255,255,0.18)' : 'rgba(255,255,255,0.85)';
  return (
    <G fill={fill}>
      {[[70, -40, 1], [250, -60, 1.3], [350, -10, 0.8]].map(([x, y, k], i) => (
        <G key={i}>
          <Circle cx={x} cy={y} r={14 * k} />
          <Circle cx={x + 16 * k} cy={y - 6 * k} r={18 * k} />
          <Circle cx={x + 34 * k} cy={y} r={13 * k} />
          <Rect x={x} y={y} width={34 * k} height={13 * k} />
        </G>
      ))}
    </G>
  );
}

/** Upper wall of the shop interior: shelves of jars and a hanging menu board. */
function ShopWall() {
  return (
    <G>
      {/* string lights */}
      <Path d="M-10 -190 Q100 -150 200 -185 Q300 -150 410 -190" stroke={INK} strokeWidth={2} fill="none" />
      {Array.from({ length: 11 }).map((_, i) => {
        const x = -10 + i * 42;
        const y = -190 + (i % 5 === 0 ? 2 : 22) + (i % 2) * 6;
        return <Circle key={i} cx={x} cy={y} r={6} fill={['#FFC531', '#E8432E', '#3FAE5A'][i % 3]} stroke={INK} strokeWidth={1.5} />;
      })}
      {/* framed photo: young Rosa at the oven, est. 1974 */}
      <Rect x={262} y={-150} width={96} height={78} rx={4} fill="#C98F63" stroke={INK} strokeWidth={3} />
      <Rect x={272} y={-140} width={76} height={50} fill="#F6E7C1" />
      <Circle cx={298} cy={-118} r={10} fill="#F2C9A0" stroke={INK} strokeWidth={1.5} />
      <Path d="M286 -90 Q298 -104 310 -90 Z" fill="#B23A48" />
      <Path d="M318 -90 L318 -112 Q330 -128 342 -112 L342 -90 Z" fill="#B85C38" />
      <Text x={310} y={-78} fontSize={10} fontFamily={F.bold} fill="#FFF4E0" textAnchor="middle">
        EST. 1974
      </Text>
      <Rect x={170} y={-80} width={60} height={34} rx={4} fill="#3B1F14" />
      <Rect x={176} y={-74} width={48} height={4} rx={2} fill="#FFF4E0" />
      <Rect x={176} y={-64} width={34} height={4} rx={2} fill="#FFF4E0" />
      <Rect x={176} y={-54} width={40} height={4} rx={2} fill="#FFF4E0" />
      <Rect x={20} y={-20} width={130} height={6} fill="#8E5A3C" />
      {[30, 55, 80, 105, 128].map((x, i) => (
        <Rect key={x} x={x} y={-38} width={14} height={18} rx={3} fill={['#E8432E', '#3FAE5A', '#FFC531', '#E8432E', '#F2994A'][i]} stroke={INK} strokeWidth={1.5} />
      ))}
    </G>
  );
}

/** Distant city silhouette that fills the upper part of tall panels so they aren't empty sky (critic D44). */
function Skyline({ top, dark }: { top: number; dark: boolean }) {
  const fill = dark ? 'rgba(20,16,40,0.35)' : 'rgba(110,130,170,0.28)';
  const base = 120;
  const towers = [[0, 70], [34, 95], [62, 60], [96, 120], [130, 80], [168, 105], [210, 70], [246, 130], [282, 85], [318, 110], [356, 75]];
  if (base - 130 < top) return null;
  return (
    <G fill={fill}>
      {towers.map(([x, h], i) => (
        <Rect key={i} x={x} y={base - h} width={30} height={h} />
      ))}
    </G>
  );
}

function VendingMachine() {
  return (
    <G transform="translate(-128 0)">
      <Rect x={300} y={92} width={56} height={104} rx={4} fill="#7B2CBF" stroke={INK} strokeWidth={3} />
      <Rect x={308} y={102} width={30} height={60} fill="#C9B6E4" stroke={INK} strokeWidth={2} />
      {[0, 1, 2].map((r) => [0, 1].map((c) => <Rect key={`${r}${c}`} x={311 + c * 14} y={106 + r * 19} width={10} height={14} rx={2} fill="#FFC531" stroke={INK} strokeWidth={1} />))}
      <Rect x={342} y={106} width={8} height={30} rx={2} fill="#3A1450" />
      <Rect x={308} y={170} width={30} height={14} fill="#2A0A3A" />
      <Rect x={300} y={78} width={56} height={14} rx={3} fill={'#E8432E'} stroke={INK} strokeWidth={2} />
      <Text x={328} y={89} fontSize={10} fontFamily={F.bold} fill="#FFFFFF" textAnchor="middle">
        MEGA
      </Text>
    </G>
  );
}

export function Backdrop({ id, width, height, prop }: { id: BackdropId; width: number; height: number; prop?: 'vending-machine' }) {
  const [top, bottom] = SKY[id];
  const vbH = Math.max(200, (400 * height) / width);
  return (
    // Art is 400 wide with scenery in the bottom 200 units; any extra frame height becomes sky.
    <Svg width={width} height={height} viewBox={`0 ${200 - vbH} 400 ${vbH}`} preserveAspectRatio="xMidYMax meet">
      <Defs>
        <LinearGradient id={`sky-${id}`} x1="0" y1="0" x2="0" y2="1">
          <Stop offset="0" stopColor={top} />
          <Stop offset="1" stopColor={bottom} />
        </LinearGradient>
      </Defs>
      <Rect x={-20} y={180 - vbH} width={440} height={vbH + 40} fill={`url(#sky-${id})`} />
      {id !== 'shop' && id !== 'megaslice-hq' && id !== 'downtown-rain' && <Clouds dark={id === 'uptown' || id === 'industrial'} />}
      {id === 'shop' && <ShopWall />}
      {id !== 'shop' && id !== 'megaslice-hq' && vbH > 260 && <Skyline top={200 - vbH} dark={id === 'uptown' || id === 'industrial' || id === 'downtown-rain'} />}
      <Scenery id={id} />
      {prop === 'vending-machine' && <VendingMachine />}
    </Svg>
  );
}
