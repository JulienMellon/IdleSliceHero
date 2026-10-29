// Placeholder scene backdrops: one flat SVG vignette per location.
import Svg, { Circle, Defs, G, LinearGradient, Path, Rect, Stop, Text } from 'react-native-svg';

import type { Backdrop as BackdropId } from '../content/types';
import { F } from '../theme';
import { shade } from './scene/projection';

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

function Building({ x, w, h, color, win = '#FFF3B0', winO = 0.85, glow = false, cornice = false }: { x: number; w: number; h: number; color: string; win?: string; winO?: number; glow?: boolean; cornice?: boolean }) {
  const rows = Math.floor((h - 10) / 14);
  const cols = Math.max(1, Math.floor((w - 6) / 12));
  return (
    <G>
      <Rect x={x} y={200 - h} width={w} height={h} fill={color} stroke={INK} strokeWidth={2} />
      {cornice && <Rect x={x - 3} y={200 - h - 4} width={w + 6} height={6} rx={1} fill={shade(color, -0.3)} stroke={INK} strokeWidth={1.5} />}
      {Array.from({ length: rows }).map((_, r) =>
        Array.from({ length: cols }).map((__, c) => (
          <G key={`${r}-${c}`}>
            {glow && <Rect x={x + 4 + c * 12} y={200 - h + 6 + r * 14} width={10} height={12} rx={2} fill={win} opacity={0.25} />}
            <Rect x={x + 6 + c * 12} y={200 - h + 8 + r * 14} width={6} height={8} fill={win} opacity={winO} />
          </G>
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
          <G transform="translate(-22 0)">
            <Path d="M250 150 L250 70 Q300 30 350 70 L350 150 Z" fill="#B85C38" stroke={INK} strokeWidth={2.4} />
            <Path d="M272 150 L272 105 Q300 85 328 105 L328 150 Z" fill="#2B1A12" />
            <Path d="M280 150 L285 125 L292 140 L300 118 L308 140 L315 125 L320 150 Z" fill="#FF9F1C" />
          </G>
          <Rect x={98} y={44} width={82} height={52} rx={8} fill="#FFFFFF" stroke={INK} strokeWidth={2.4} />
          <Circle cx={120} cy={70} r={16} fill="#FFC531" stroke={INK} strokeWidth={2} />
          {[[114, 64], [126, 67], [118, 78], [127, 76]].map(([cx, cy], i) => (
            <Circle key={i} cx={cx} cy={cy} r={4} fill="#E8432E" />
          ))}
          <Text x={157} y={75} fontSize={11} fontFamily={F.bold} fill="#D9443A" textAnchor="middle">
            PIZZA
          </Text>
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
          {/* one path, one fill: no overlap seam */}
          <Path d="M208 45 a14 14 0 1 0 28 0 a14 14 0 1 0 -28 0 Z M222 30 a18 18 0 1 0 36 0 a18 18 0 1 0 -36 0 Z" fill="#D9D9D9" />
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
          {/* a pale moon behind the rain, and the neighbours' lit windows either side of Rosa's */}
          <Circle cx={248} cy={-26} r={30} fill="#E8E4FF" opacity={0.12} />
          <Circle cx={248} cy={-26} r={22} fill="#E8E4FF" opacity={0.92} />
          <Circle cx={240} cy={-32} r={5} fill="#D2CCF2" opacity={0.7} />
          <Circle cx={256} cy={-18} r={3.4} fill="#D2CCF2" opacity={0.7} />
          {/* taller neighbours rise behind Rosa's roofline, so a good width of each shows above it */}
          {([[98, 60, 172, '#4A4468'], [242, 60, 162, '#3E3A5C']] as const).map(([x, w, h, c], i) => (
            <Building key={i} x={x} w={w} h={h} color={c} win="#FFD27A" winO={0.9} glow cornice />
          ))}
          {/* Rosa's storefront */}
          <Rect x={120} y={88} width={160} height={112} fill="#8E3B2E" stroke={INK} strokeWidth={2.4} />
          {Array.from({ length: 9 }).map((_, r) => (
            <G key={r}>
              <Path d={`M121 ${124 + r * 9} H279`} stroke="#6E2A20" strokeWidth={1} />
              {Array.from({ length: 8 }).map((__, c) => <Path key={c} d={`M${128 + c * 20 + (r % 2) * 10} ${115 + r * 9} v9`} stroke="#6E2A20" strokeWidth={1} />)}
            </G>
          ))}
          <Rect x={250} y={89} width={29} height={110} fill="#000" opacity={0.18} />
          <Rect x={121} y={89} width={8} height={110} fill="#fff" opacity={0.1} />
          <Path d="M112 96 L288 96 L276 118 L124 118 Z" fill="#E8432E" stroke={INK} strokeWidth={2} />
          <Path d="M118 99 L282 99" stroke="#fff" strokeWidth={2} opacity={0.3} />
          {[136, 168, 200, 232, 264].map((x) => (
            <Path key={x} d={`M${x - 12} 118 q12 12 24 0`} fill="#FFFFFF" stroke={INK} strokeWidth={1.4} />
          ))}
          <Rect x={124} y={126} width={152} height={8} fill="#000" opacity={0.22} />
          <Rect x={138} y={131} width={64} height={57} rx={2} fill="#5A2A1F" stroke={INK} strokeWidth={2} />
          <Rect x={142} y={134} width={56} height={50} fill="#F7C873" stroke={INK} strokeWidth={1.6} />
          <Path d="M170 134 V184 M142 158 H198" stroke="#5A2A1F" strokeWidth={2.4} />
          <Path d="M148 180 L162 138 M156 180 L168 146" stroke="#fff" strokeWidth={2.4} opacity={0.4} strokeLinecap="round" />
          <Rect x={136} y={186} width={68} height={5} rx={1.5} fill="#5A2A1F" stroke={INK} strokeWidth={1.2} />
          <Rect x={214} y={134} width={44} height={66} fill="#5A2A1F" stroke={INK} strokeWidth={2} />
          <Rect x={219} y={139} width={34} height={24} rx={2} fill="#7A3A2A" stroke={INK} strokeWidth={1} />
          <Rect x={219} y={168} width={34} height={26} rx={2} fill="#7A3A2A" stroke={INK} strokeWidth={1} />
          <Circle cx={250} cy={168} r={2.2} fill="#E0B000" stroke={INK} strokeWidth={0.8} />
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
          {/* wet sidewalk and kerb under the shop */}
          <Rect x={0} y={186} width={400} height={14} fill="#4A4566" />
          <Rect x={0} y={186} width={400} height={3} fill="#3A3550" />
          <Path d="M150 194 q10 -2 20 0 M232 196 q12 -2 24 0" stroke="#8D86B8" strokeWidth={1.4} opacity={0.6} fill="none" />
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
  // solid fill with the opacity on the group, so overlapping puffs don't show seams
  return (
    <G fill="#FFFFFF" opacity={dark ? 0.18 : 0.85}>
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
      <Rect x={214} y={-150} width={92} height={76} rx={4} fill="#C98F63" stroke={INK} strokeWidth={2.4} />
      <Rect x={224} y={-140} width={72} height={48} fill="#F6E7C1" />
      <Circle cx={248} cy={-118} r={10} fill="#F2C9A0" stroke={INK} strokeWidth={1.5} />
      <Path d="M236 -92 Q248 -106 260 -92 Z" fill="#B23A48" />
      <Path d="M268 -92 L268 -112 Q280 -128 292 -112 L292 -92 Z" fill="#B85C38" />
      <Text x={260} y={-79} fontSize={10} fontFamily={F.bold} fill="#FFF4E0" textAnchor="middle">
        EST. 1974
      </Text>
      <Rect x={126} y={-90} width={70} height={46} rx={4} fill="#2F3B33" stroke="#8E5A3C" strokeWidth={3} />
      <Text x={161} y={-77} fontSize={9} fontFamily={F.bold} fill="#FFC531" textAnchor="middle">
        MENU
      </Text>
      {[0, 1, 2].map((i) => (
        <G key={i}>
          <Path d={`M133 ${-70 + i * 8} l6 0 l-3 6 Z`} fill="#FFC531" />
          <Rect x={142} y={-69 + i * 8} width={[30, 26, 22][i]} height={3} rx={1.5} fill="#FFF4E0" />
          <Text x={190} y={-65 + i * 8} fontSize={6} fontFamily={F.bold} fill="#FFC531" textAnchor="end">
            {`$${[3, 4, 4][i]}`}
          </Text>
        </G>
      ))}
      {/* tins on a shelf under the photo, clear of the PIZZA sign */}
      <Rect x={218} y={-48} width={88} height={6} fill="#8E5A3C" stroke={INK} strokeWidth={1.2} />
      <Path d="M228 -42 l4 8 M296 -42 l-4 8" stroke="#5E3A26" strokeWidth={2} strokeLinecap="round" />
      {[224, 242, 260, 278, 294].map((x, i) => (
        <Rect key={x} x={x} y={-64} width={12} height={16} rx={3} fill={['#E8432E', '#3FAE5A', '#FFC531', '#E8432E', '#F2994A'][i]} stroke={INK} strokeWidth={1.4} />
      ))}
    </G>
  );
}

/** Distant city silhouette that fills the upper part of tall panels so they aren't empty sky. */
function Skyline({ top, dark, billboard, lit = false }: { top: number; dark: boolean; billboard: boolean; lit?: boolean }) {
  // solid fill + group opacity so overlapping towers and puffs show no seams
  const fill = dark ? '#141028' : '#6E82AA';
  const alpha = dark ? 0.35 : 0.28;
  const base = 120;
  const towers = [[0, 70], [34, 95], [62, 60], [96, 120], [130, 80], [168, 105], [210, 70], [246, 130], [282, 85], [318, 110], [356, 75]];
  if (base - 130 < top) return null;
  const board = billboard && base - 130 - 46 > top + 70;
  const bb = 40; // billboard sits lower, just behind the cast
  return (
    <G>
      <G fill={fill} opacity={alpha}>
        {board && (
          <G>
            <Rect x={109} y={base - 130 - 16 + bb} width={4} height={16 + 10} />
            <Rect x={259} y={base - 130 - 16 + bb} width={4} height={16} />
          </G>
        )}
        {towers.map(([x, h], i) => (
          <Rect key={i} x={x} y={base - h} width={30} height={h} />
        ))}
      </G>
      {lit && (
        <G fill="#FFD27A">
          {towers.flatMap(([x, h], i) =>
            Array.from({ length: Math.floor((h - 12) / 16) }, (_, r) =>
              (r + i) % 3 === 1 ? null : (
                <G key={`${i}-${r}`}>
                  <Rect x={x + 4 + ((r + i) % 2) * 12} y={base - h + 6 + r * 16} width={10} height={11} rx={2} opacity={0.25} />
                  <Rect x={x + 6 + ((r + i) % 2) * 12} y={base - h + 8 + r * 16} width={6} height={7} opacity={0.9} />
                </G>
              ),
            ),
          )}
        </G>
      )}
      {/* MegaSlice billboard at full strength, on top of the hazy skyline */}
      {board && (
        <G>
          <Rect x={100} y={base - 130 - 46 + bb} width={172} height={30} rx={4} fill="#7B2CBF" stroke={INK} strokeWidth={2} />
          <Rect x={104} y={base - 130 - 43 + bb} width={164} height={6} rx={3} fill="#fff" opacity={0.18} />
          <Text x={186} y={base - 130 - 25 + bb} fontSize={17} fontFamily={F.bold} fill="#FFC531" stroke={INK} strokeWidth={1} textAnchor="middle">
            MEGASLICE
          </Text>
        </G>
      )}
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

/** Per-scene zoom on the scenery, anchored at the kerb (the rainy opening shot frames Rosa's front). */
const SCENE_ZOOM: Partial<Record<BackdropId, number>> = { 'downtown-rain': 1.15 };

export function Backdrop({ id, width, height, prop }: { id: BackdropId; width: number; height: number; prop?: 'vending-machine' }) {
  const [top, bottom] = SKY[id];
  // Art is 400 wide with scenery in the bottom 200 units. Up to 120 units of sky; a taller frame scales the
  // art up and crops the sides instead of showing more empty sky.
  const vbH = Math.max(200, Math.min(300, (400 * height) / width));
  return (
    <Svg width={width} height={height} viewBox={`0 ${200 - vbH} 400 ${vbH}`} preserveAspectRatio="xMidYMax slice">
      <Defs>
        <LinearGradient id={`sky-${id}`} x1="0" y1="0" x2="0" y2="1">
          <Stop offset="0" stopColor={top} />
          <Stop offset="1" stopColor={bottom} />
        </LinearGradient>
      </Defs>
      <Rect x={-20} y={180 - vbH} width={440} height={vbH + 40} fill={`url(#sky-${id})`} />
      {id !== 'shop' && id !== 'megaslice-hq' && id !== 'downtown-rain' && <Clouds dark={id === 'uptown' || id === 'industrial'} />}
      {id === 'shop' && (
        <G transform="translate(0 70)">
          <ShopWall />
        </G>
      )}
      {id !== 'shop' && id !== 'megaslice-hq' && vbH > 260 && <Skyline top={200 - vbH} dark={id === 'uptown' || id === 'industrial' || id === 'downtown-rain'} billboard={id === 'industrial' || id === 'uptown'} lit={id === 'downtown-rain'} />}
      {SCENE_ZOOM[id] ? (
        <G transform={`translate(200 200) scale(${SCENE_ZOOM[id]}) translate(-200 -200)`}>
          <Scenery id={id} />
        </G>
      ) : (
        <Scenery id={id} />
      )}
      {prop === 'vending-machine' && <VendingMachine />}
    </Svg>
  );
}
