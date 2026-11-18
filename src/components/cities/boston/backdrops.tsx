import type { ReactElement } from 'react';
import { Circle, Ellipse, G, Path, Rect, Text } from 'react-native-svg';

import { F } from '../../../theme';
import { BOSTON_LOOKS, type BostonLook, bricks, circle, gridLines, mullions, rect, windows } from '../../cutscene/backdrop-art';
import { CLOUDS, FAR_CITY, Ground, INK, type Ids } from '../../cutscene/backdrops/shared';
import type { CityBackdrops } from '../types';

// ---------------------------------------------------------------------------------------------------------------
// Boston (card T2). Exteriors: one near row of buildings per neighbourhood from BOSTON_LOOKS (palette in cutscene/backdrop-art.ts) and the
// neighbourhood's signature object: North End's church steeple, Southie's bar sign, Back Bay's stoops and gas lamp, Fenway's light towers,
// Cambridge's lab windows, Dorchester's triple-decker porches. Everything stays under the caption zone (BOSTON_SIGNS are tested).

const BOS = (() => {
  const out: Record<string, ReturnType<typeof buildBoston>> = {};
  function buildBoston(id: string) {
    const L = BOSTON_LOOKS[id];
    const B = L.buildings;
    // which buildings carry the ordinary window grid (the church, the ballpark wall and the lab are drawn by hand)
    const plain = (i: number) => !((L.sig === 'steeple' && i === 3) || (L.sig === 'towers' && i === 1) || (L.sig === 'lab' && i === 1));
    const win = B.map(([x0, x1, top], i) => {
      if (!plain(i)) return { glass: '', bars: '', sills: '' };
      const cols = Math.floor((x1 - x0 - 12) / 22);
      const rows = Math.floor((90 - top - 10) / 24);
      const left = x0 + (x1 - x0 - (cols * 22 - 8)) / 2;
      return {
        glass: windows(left, top + 14, cols, rows, 14, 16, 22, 24),
        bars: mullions(left, top + 14, cols, rows, 14, 16, 22, 24),
        sills: windows(left - 2, top + 30, cols, rows, 18, 3, 22, 24),
      };
    });
    const doors = B.map(([x0, x1], i) => (L.sig === 'towers' && i === 1 ? '' : rect((x0 + x1) / 2 - 10, 114, 20, 26))).join('');
    const glassFront = B.map(([x0, x1], i) => (L.sig === 'towers' && i === 1 ? '' : rect(x0 + 8, 116, Math.max(0, (x1 - x0) / 2 - 22), 22))).join('');
    const awnings =
      L.sig === 'brownstones' || L.sig === 'deckers' || L.sig === 'towers'
        ? []
        : B.map(([x0, x1], i) => ({ d: `M${x0 + 4} 96H${x1 - 4}L${x1} 112H${x0}Z`, c: ['#E8432E', '#3FAE5A', '#2F80ED', '#F2C94C', '#9B51E0'][i % 5] }));
    const cornices = B.map(([x0, x1, top]) => rect(x0 - 3, top - 6, x1 - x0 + 6, 7)).join('');
    const brick = B.map(([x0, x1, top], i) => (plain(i) && L.sig !== 'deckers' ? bricks(x0, top + 2, x1, 94, 6, 14) : '')).join('');
    const paving = gridLines(-20, 140, 420, 200, 40, 22);
    const far = FAR_CITY;
    return {
      L,
      win,
      doors,
      glassFront,
      awnings,
      cornices,
      brick,
      paving,
      far,
      glassAll: win.map((w) => w.glass).join(''),
      barsAll: win.map((w) => w.bars).join(''),
      sillsAll: win.map((w) => w.sills).join(''),
    };
  }
  for (const id of Object.keys(BOSTON_LOOKS)) out[id] = buildBoston(id);
  return out;
})();

/** Back Bay's stoops: stepped stairs to each door, with an iron rail. */
const STOOPS = (() => {
  const xs = [30, 112, 196, 278, 364];
  return {
    steps: xs.map((x) => `M${x} 140V132H${x + 7}V124H${x + 14}V116H${x + 21}V108H${x + 36}V140Z`).join(''),
    rail: xs.map((x) => `M${x} 128L${x + 21} 100M${x} 128v-10M${x + 7} 124v-12M${x + 14} 116v-10`).join(''),
  };
})();

/** Fenway's light towers and the ballpark wall's ad panels. */
const TOWER = (() => {
  const tower = (x: number) => ({
    legs: `M${x - 9} 140L${x - 4} -28M${x + 9} 140L${x + 4} -28M${x - 7} 100L${x + 7} 60M${x + 7} 100L${x - 7} 60M${x - 6} 52L${x + 6} 14M${x + 6} 52L${x - 6} 14`,
    bank: rect(x - 16, -46, 32, 18),
    bulbs: [0, 1, 2, 3].map((c) => circle(x - 11.5 + c * 7.7, -40, 2.8) + circle(x - 11.5 + c * 7.7, -33, 2.8)).join(''),
  });
  return {
    towers: [tower(128), tower(272)],
    panels: ['#F2C94C', '#E8432E', '#FFFFFF', '#2F80ED', '#F2C94C'].map((c, i) => [118 + i * 36, 34, 28, 22, c] as const),
  };
})();

/** Cambridge's lab: a grid of lit windows, alternating cool and warm; and the smoking basement window. */
const LAB = (() => {
  const cold = (c: number, r: number) => (c + r) % 2 === 1;
  return {
    cool: windows(126, -32, 6, 4, 18, 20, 26, 28, cold),
    warm: windows(126, -32, 6, 4, 18, 20, 26, 28, (c, r) => !cold(c, r)),
    bars: mullions(126, -32, 6, 4, 18, 20, 26, 28),
    smoke: circle(334, 116, 7) + circle(342, 106, 9) + circle(335, 94, 7.5) + circle(344, 82, 6),
  };
})();

/** Dorchester's triple-deckers: a porch on each of three floors, balusters under the rail, a low pitched roof. */
const DECK = (() => {
  const b = BOSTON_LOOKS.dorchester.buildings;
  const floors = [20, 52, 84];
  let slabs = '';
  let rails = '';
  let posts = '';
  for (const [x0, x1] of b) {
    for (const fy of floors) {
      slabs += rect(x0 + 6, fy, x1 - x0 - 12, 4);
      rails += `M${x0 + 8} ${fy - 14}H${x1 - 8}`;
      for (let x = x0 + 10; x < x1 - 8; x += 8) posts += `M${x} ${fy - 14}V${fy}`;
    }
  }
  return { slabs, rails, posts, roofs: b.map(([x0, x1, top]) => `M${x0 - 4} ${top - 5}L${(x0 + x1) / 2} ${top - 20}L${x1 + 4} ${top - 5}Z`).join('') };
})();

function BostonSignature({ sig, glow }: { sig: BostonLook['sig']; glow: string }) {
  if (sig === 'steeple')
    return (
      <G>
        <Path d={rect(246, -16, 32, 40)} fill="#E4D3B8" stroke={INK} strokeWidth={2} />
        <Path d="M256 6V-4Q262 -14 268 -4V6Z" fill="#3B2A22" stroke={INK} strokeWidth={1.2} />
        <Path d="M243 -16L262 -46L281 -16Z" fill="#4F6A7A" stroke={INK} strokeWidth={2} strokeLinejoin="round" />
        <Circle cx={262} cy={-24} r={1.8} fill="#F2C94C" />
        {/* the nave: arched windows and the big door */}
        <Path d="M246 78V60Q254 48 262 60V78ZM270 78V60Q278 48 286 60V78ZM298 78V60Q306 48 314 60V78Z" fill="#5C7FA8" stroke={INK} strokeWidth={1.4} />
        <Path d="M252 140V112Q262 98 272 112V140Z" fill="#5A2E1A" stroke={INK} strokeWidth={1.6} />
        <Path d="M240 24H284" stroke={INK} strokeWidth={1.4} />
      </G>
    );
  if (sig === 'bar')
    return (
      <G>
        <Path d="M124 6V-12M184 6V-12" stroke="#2D3436" strokeWidth={3} />
        <Rect x={112} y={-42} width={84} height={30} rx={3} fill="#1F3D2B" stroke="#E0B84A" strokeWidth={2.4} />
        <Rect x={116} y={-38} width={76} height={22} rx={2} fill="none" stroke="#FFD98A" strokeWidth={1} opacity={0.6} />
        <Text x={154} y={-21} fontSize={15} fontFamily={F.bold} fill="#FFD98A" textAnchor="middle">
          DUNN’S
        </Text>
        <Ellipse cx={154} cy={-26} rx={52} ry={18} fill={`url(#${glow})`} opacity={0.3} />
      </G>
    );
  if (sig === 'brownstones')
    return (
      <G>
        <Path d={STOOPS.steps} fill="#CFC6B8" stroke={INK} strokeWidth={1.6} strokeLinejoin="round" />
        <Path d={STOOPS.rail} stroke="#1E1E22" strokeWidth={1.6} fill="none" />
        {/* a gas lamp between two brownstones */}
        <Path d="M232 140V0" stroke="#2D3436" strokeWidth={3.4} />
        <Path d="M226 140h12l-2 -8h-8Z" fill="#2D3436" stroke={INK} strokeWidth={1} />
        <Ellipse cx={232} cy={-6} rx={16} ry={14} fill={`url(#${glow})`} opacity={0.85} />
        <Path d="M226 0h12l2 -14h-16Z" fill="#FFE9A8" stroke={INK} strokeWidth={1.4} strokeLinejoin="round" />
        <Path d="M225 -14h14l-7 -8Z" fill="#2D3436" stroke={INK} strokeWidth={1} strokeLinejoin="round" />
      </G>
    );
  if (sig === 'towers')
    return (
      <G>
        {TOWER.towers.map((t, i) => (
          <G key={i}>
            <Path d={t.legs} stroke="#4A5560" strokeWidth={2} fill="none" />
            <Path d={t.bank} fill="#3C4650" stroke={INK} strokeWidth={1.6} />
            <Path d={t.bulbs} fill="#FFF3B0" />
          </G>
        ))}
        {TOWER.panels.map(([x, y, w, h, c], i) => (
          <Rect key={i} x={x} y={y} width={w} height={h} fill={c} stroke={INK} strokeWidth={1.2} />
        ))}
        <Path d="M100 20H300" stroke="#1F4A30" strokeWidth={3} />
        <Path d="M104 140V104Q118 90 132 104V140ZM268 140V104Q282 90 296 104V140Z" fill="#26323A" stroke={INK} strokeWidth={1.6} />
      </G>
    );
  if (sig === 'lab')
    return (
      <G>
        <Path d={LAB.cool} fill="#9FE3E8" stroke={INK} strokeWidth={1.3} />
        <Path d={LAB.warm} fill="#FFE9A0" stroke={INK} strokeWidth={1.3} />
        <Path d={LAB.bars} stroke="#4A2A22" strokeWidth={1.1} />
        <Path d="M122 -38h156" stroke="#E8E1CC" strokeWidth={3} />
        <Rect x={322} y={120} width={24} height={14} fill="#26323A" stroke={INK} strokeWidth={1.6} />
        <Path d="M326 130h6" stroke="#F2994A" strokeWidth={2} />
        <Path d={LAB.smoke} fill="#E6DFD6" opacity={0.85} />
      </G>
    );
  return (
    <G>
      <Path d={DECK.roofs} fill="#6E4430" stroke={INK} strokeWidth={1.6} strokeLinejoin="round" />
      <Path d={DECK.slabs} fill="#F4EFE6" stroke={INK} strokeWidth={1.2} />
      <Path d={DECK.rails} stroke="#F4EFE6" strokeWidth={2.4} />
      <Path d={DECK.posts} stroke="#F4EFE6" strokeWidth={1.4} />
    </G>
  );
}

/** A Boston neighbourhood by day (or dusk): its buildings, its one signature object, the sidewalk and a street lamp. */
export function BostonScene({ hood, glow }: { hood: string; glow: string }) {
  const S = BOS[hood];
  const L = S.L;
  return (
    <G>
      <Path d={CLOUDS} fill="#FFFFFF" opacity={0.8} />
      <Path d={FAR_CITY} fill={L.far} />
      {L.buildings.map(([x0, x1, top, c]) => (
        <Path key={x0} d={rect(x0, top, x1 - x0, 140 - top)} fill={c} stroke={INK} strokeWidth={2} />
      ))}
      <Path d={S.brick} stroke="#000" strokeWidth={0.9} opacity={0.2} />
      <Path d={S.cornices} fill={L.trim} stroke={INK} strokeWidth={1.6} />
      <Path d={S.sillsAll} fill="#F2E3C8" />
      <Path d={S.glassAll} fill={L.glass} stroke={INK} strokeWidth={1.3} />
      <Path d={S.barsAll} stroke={L.trim} strokeWidth={1.2} />
      <BostonSignature sig={L.sig} glow={glow} />
      {/* street level */}
      <Path d={S.glassFront} fill="#9CC7DE" stroke={INK} strokeWidth={1.6} />
      <Path d={S.doors} fill="#5A2E1A" stroke={INK} strokeWidth={1.6} />
      {S.awnings.map((a, i) => (
        <Path key={i} d={a.d} fill={a.c} stroke={INK} strokeWidth={1.8} />
      ))}
      <Ground y={140} fill={hood === 'north-end' ? '#E4EAEE' : '#D3C7B6'} />
      <Path d={S.paving} stroke="#B2A693" strokeWidth={1.2} opacity={hood === 'north-end' ? 0.5 : 1} />
      <Rect x={-20} y={190} width={440} height={12} fill="#A39A8C" />
      <Path d="M62 140V-2" stroke="#2D3436" strokeWidth={4} />
      <Path d="M56 140h12l-2 -8h-8Z M52 -2h20l-4 -14h-12Z" fill="#2D3436" stroke={INK} strokeWidth={1.2} />
      <Path d="M57 -4h10l-2 -9h-6Z" fill="#FFF1C2" />
    </G>
  );
}

// ---- Boston's shop interiors: the window onto the neighbourhood (66 x 58) and the one object on the shelf wall (x 102..200, y -10..36) ----

function BostonWindow({ hood }: { hood: string }): ReactElement | null {
  switch (hood) {
    case 'north-end':
      return (
        <G>
          <Path d="M0 58V22Q0 0 33 0Q66 0 66 22V58Z" fill="#F4E6CC" stroke={INK} strokeWidth={2.4} />
          <Path d="M5 53V23Q5 5 33 5Q61 5 61 23V53Z" fill="#B5C8E4" />
          <Path d="M27 53V30H39V53Z" fill="#E4D3B8" stroke={INK} strokeWidth={1} />
          <Path d="M25 30L33 10L41 30Z" fill="#4F6A7A" stroke={INK} strokeWidth={1} strokeLinejoin="round" />
          <Path d="M30 46V40Q33 36 36 40V46Z" fill="#3B2A22" />
          <Path d="M8 53V40H22V53ZM44 53V36H58V53Z" fill="#B4573F" stroke={INK} strokeWidth={1} />
          <Path d="M33 5V53" stroke="#F4E6CC" strokeWidth={2.2} />
        </G>
      );
    case 'southie':
      return (
        <G>
          <Rect x={0} y={0} width={66} height={58} rx={3} fill="#FFFFFF" stroke={INK} strokeWidth={2.4} />
          <Rect x={5} y={5} width={56} height={44} fill="#7FA0C0" />
          <Rect x={10} y={13} width={46} height={16} rx={2} fill="#1F3D2B" stroke="#E0B84A" strokeWidth={1.4} />
          <Path d="M16 21H50" stroke="#FFD98A" strokeWidth={3} strokeLinecap="round" />
          <Path d="M5 49V38H61V49Z" fill="#6F8FB5" />
          <Path d="M33 5V49M5 27H61" stroke="#FFFFFF" strokeWidth={2.4} />
          <Rect x={-3} y={49} width={72} height={6} rx={1.5} fill="#FFFFFF" stroke={INK} strokeWidth={1.6} />
        </G>
      );
    case 'back-bay':
      return (
        <G>
          <Rect x={0} y={0} width={66} height={58} rx={3} fill="#2A1D1A" stroke={INK} strokeWidth={2.4} />
          <Rect x={5} y={5} width={56} height={48} fill="#C9B7D9" />
          <Path d="M5 53V20H22V53ZM24 53V10H42V53ZM44 53V22H61V53Z" fill="#8A5642" stroke={INK} strokeWidth={1} />
          <Path d={windows(8, 24, 1, 4, 5, 6, 8, 8) + windows(29, 14, 2, 4, 5, 6, 8, 9) + windows(47, 26, 1, 3, 5, 6, 8, 8)} fill="#F4D58A" />
          <Path d="M10 53l4 -6M36 53l4 -6" stroke={INK} strokeWidth={1.2} />
        </G>
      );
    case 'fenway':
      return (
        <G>
          <Rect x={0} y={0} width={66} height={58} rx={3} fill="#FFFFFF" stroke={INK} strokeWidth={2.4} />
          <Rect x={5} y={5} width={56} height={44} fill="#7EC8E3" />
          <Path d="M5 49V38H61V49Z" fill="#2F7A4A" />
          <Path d="M16 38L20 8M30 38L26 8M18 24H28" stroke="#4A5560" strokeWidth={1.4} />
          <Path d="M13 8h16v8H13Z" fill="#3C4650" stroke={INK} strokeWidth={1} />
          <Path d={circle(17, 12, 1.6) + circle(22, 12, 1.6) + circle(27, 12, 1.6)} fill="#FFF3B0" />
          <Path d="M44 38L47 12M56 38L53 12" stroke="#4A5560" strokeWidth={1.2} />
          <Path d="M42 12h16v7H42Z" fill="#3C4650" stroke={INK} strokeWidth={1} />
          <Path d="M33 5V49M5 27H61" stroke="#FFFFFF" strokeWidth={2.4} />
          <Rect x={-3} y={49} width={72} height={6} rx={1.5} fill="#FFFFFF" stroke={INK} strokeWidth={1.6} />
        </G>
      );
    case 'cambridge':
      return (
        <G>
          <Rect x={0} y={0} width={66} height={58} rx={2} fill="#B26A52" stroke={INK} strokeWidth={2.4} />
          <Path d={windows(6, 6, 3, 3, 14, 12, 18, 16)} fill="#9FE3E8" stroke={INK} strokeWidth={1} />
          <Path d={windows(6, 6, 3, 3, 14, 12, 18, 16, (c, r) => (c + r) % 2 === 0)} fill="#FFE9A0" />
          <Path d={circle(48, 52, 3) + circle(53, 47, 4)} fill="#E6DFD6" opacity={0.9} />
        </G>
      );
    default:
      return (
        <G>
          <Rect x={0} y={0} width={66} height={58} rx={3} fill="#FFFFFF" stroke={INK} strokeWidth={2.4} />
          <Rect x={5} y={5} width={56} height={44} fill="#F5C98C" />
          <Path d="M5 49V20L22 14L39 20V49Z" fill="#7BA7C9" stroke={INK} strokeWidth={1} strokeLinejoin="round" />
          <Path d="M39 49V16L50 10L61 16V49Z" fill="#E8B84A" stroke={INK} strokeWidth={1} strokeLinejoin="round" />
          <Path d="M7 26H37M7 36H37M41 24H59M41 34H59" stroke="#F4EFE6" strokeWidth={2.2} />
          <Path d="M33 5V49" stroke="#FFFFFF" strokeWidth={2.4} />
          <Rect x={-3} y={49} width={72} height={6} rx={1.5} fill="#FFFFFF" stroke={INK} strokeWidth={1.6} />
        </G>
      );
  }
}

/** The bar's bottles, a church's votive rack, a gilt frame, a pennant, the lab's flasks, the pantry's jars: one signature thing each. */
function BostonObject({ hood }: { hood: string }): ReactElement | null {
  switch (hood) {
    case 'north-end':
      // a votive rack: three rows of candles in red glass, the flames lit
      return (
        <G>
          <Rect x={108} y={26} width={84} height={6} fill="#6B3A22" stroke={INK} strokeWidth={1.3} />
          {[0, 1, 2, 3, 4, 5].map((i) => (
            <G key={i}>
              <Path d={rect(114 + i * 13, 14, 8, 12)} fill="#C8483A" stroke={INK} strokeWidth={1} />
              <Path
                d={`M${118 + i * 13} 5Q${121 + i * 13} 10 ${118 + i * 13} 13Q${115 + i * 13} 10 ${118 + i * 13} 5Z`}
                fill="#FFC531"
                stroke={INK}
                strokeWidth={0.8}
              />
            </G>
          ))}
          <Path d="M108 32v8M186 32v8" stroke="#5E3A26" strokeWidth={2} strokeLinecap="round" />
        </G>
      );
    case 'southie':
      // the bar shelf: bottles, a pint glass and a clover pennant
      return (
        <G>
          <Rect x={104} y={14} width={92} height={4} fill="#4A3426" stroke={INK} strokeWidth={1} />
          {[0, 1, 2, 3, 4, 5, 6].map((i) => (
            <Path
              key={i}
              d={`M${110 + i * 12} 14V2Q${110 + i * 12} -2 ${112 + i * 12} -4V-8h3V-4Q${117 + i * 12} -2 ${117 + i * 12} 2V14Z`}
              fill={['#3E7A4A', '#C9A24A', '#7A4A26', '#2F5E8A'][i % 4]}
              stroke={INK}
              strokeWidth={0.9}
            />
          ))}
          <Rect x={104} y={30} width={92} height={4} fill="#4A3426" stroke={INK} strokeWidth={1} />
          <Path d="M118 30V20H128V30ZM140 30V18H152V30Z" fill="#FFD98A" stroke={INK} strokeWidth={1} />
          <Path d="M164 18L184 24L164 30Z" fill="#2E5D3A" stroke={INK} strokeWidth={1} strokeLinejoin="round" />
        </G>
      );
    case 'back-bay':
      // a tall gilt frame around a stern portrait
      return (
        <G>
          <Rect x={126} y={-10} width={48} height={46} fill="#CDA64B" stroke={INK} strokeWidth={1.6} />
          <Rect x={131} y={-5} width={38} height={36} fill="#3A2A20" />
          <Path d={circle(150, 8, 7)} fill="#F6DCC8" stroke={INK} strokeWidth={0.8} />
          <Path d="M137 31Q137 18 150 18Q163 18 163 31Z" fill="#1F2A44" stroke={INK} strokeWidth={0.8} />
          <Path d="M144 5Q150 2 156 5" stroke="#D8C28A" strokeWidth={2} fill="none" />
        </G>
      );
    case 'fenway':
      // pennants and a framed jersey
      return (
        <G>
          <Path d="M104 -6L150 -2L196 -6" stroke={INK} strokeWidth={1.2} fill="none" />
          {[0, 1, 2, 3, 4, 5].map((i) => (
            <Path
              key={i}
              d={`M${108 + i * 15} -5.5h11l-5.5 14Z`}
              fill={['#C03A2B', '#FFFFFF', '#2F7A4A'][i % 3]}
              stroke={INK}
              strokeWidth={0.9}
              strokeLinejoin="round"
            />
          ))}
          <Path d="M130 36V22L120 18L126 10H140Q150 16 160 10H174L180 18L170 22V36Z" fill="#FFFFFF" stroke={INK} strokeWidth={1.2} strokeLinejoin="round" />
          <Path d="M148 20V30" stroke="#C03A2B" strokeWidth={3} />
        </G>
      );
    case 'cambridge':
      // the lab bench: three flasks, a beaker, a burner
      return (
        <G>
          <Rect x={104} y={28} width={92} height={5} fill="#8E9AA3" stroke={INK} strokeWidth={1.2} />
          <Path d="M116 28L123 8V0H129V8L136 28Z" fill="#9FE3E8" stroke={INK} strokeWidth={1.2} strokeLinejoin="round" />
          <Path d="M120 26L124 16H128L132 26Z" fill="#3FAE5A" opacity={0.8} />
          <Path d="M146 28V4H168V28Z" fill="#E8F4F6" stroke={INK} strokeWidth={1.2} />
          <Path d="M147.5 26V16H166.5V26Z" fill="#E8432E" opacity={0.75} />
          <Path d="M178 28L184 14V6H188V14L194 28Z" fill="#FFE9A0" stroke={INK} strokeWidth={1.2} strokeLinejoin="round" />
          <Path d={circle(139, -3, 2) + circle(135, -9, 3)} fill="#E6DFD6" opacity={0.9} />
        </G>
      );
    default:
      // the pantry shelf: jars and tins, and the last spot empty
      return (
        <G>
          <Rect x={104} y={14} width={92} height={4} fill="#9A6A3A" stroke={INK} strokeWidth={1} />
          <Rect x={104} y={32} width={92} height={4} fill="#9A6A3A" stroke={INK} strokeWidth={1} />
          {[0, 1, 2, 3].map((i) => (
            <G key={i}>
              <Rect x={109 + i * 16} y={-2} width={12} height={16} rx={2} fill={['#E8432E', '#F2C94C', '#3FAE5A', '#BFE3F2'][i]} stroke={INK} strokeWidth={1} />
              <Rect x={110.5 + i * 16} y={-5} width={9} height={3.5} fill="#9A6A3A" stroke={INK} strokeWidth={0.8} />
            </G>
          ))}
          {[0, 1, 2].map((i) => (
            <Rect key={i} x={110 + i * 15} y={19} width={12} height={13} rx={1} fill={['#BFC6CE', '#E0A82E', '#C8483A'][i]} stroke={INK} strokeWidth={1} />
          ))}
        </G>
      );
  }
}

/** Boston's backdrop art, registered in cities/index.ts: the six neighbourhood scenes, their sky and glow, and the shop interiors' window and shelf object. */
export const BOSTON_BACKDROPS: CityBackdrops = {
  scenes: Object.fromEntries(Object.keys(BOSTON_LOOKS).map((id) => [id, ({ glow }: Ids) => <BostonScene hood={id} glow={glow} />])),
  sky: Object.fromEntries(Object.entries(BOSTON_LOOKS).map(([id, l]) => [id, l.sky])),
  glow: Object.fromEntries(Object.entries(BOSTON_LOOKS).map(([id, l]) => [id, l.glow])),
  shopWindow: (hood) => (BOSTON_LOOKS[hood] ? <BostonWindow hood={hood} /> : null),
  shopObject: (hood) => (BOSTON_LOOKS[hood] ? <BostonObject hood={hood} /> : null),
};
