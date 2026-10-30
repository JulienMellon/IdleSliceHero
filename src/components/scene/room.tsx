import { memo, type ReactElement } from 'react';
import type { NeighborhoodId } from '../../content/types';
import { F } from '../../theme';
import { Circle, Defs, Ellipse, G, LinearGradient, Path, Polygon, Rect, Stop, Text as SvgText } from 'react-native-svg';
import { INK, SCENE_W, D, WH, FRONT_TOP, P, pts, shade } from './projection';
import type { Layout } from './layout';
import { hash32 } from './people';
import { Sidewalk } from './street';

// ---------- the room shell (static per layout) ----------
/** A small back-wall prop that tells neighbourhoods apart before any wall decor is bought. */
export function LocalProp({ id, x, y }: { id: NeighborhoodId; x: number; y: number }) {
  return (
    <G transform={`translate(${x} ${y})`}>
      {id === 'downtown' && (
        <G>
          <Rect x={-16} y={-12} width={32} height={22} rx={2} fill="#FFF4E0" stroke={INK} strokeWidth={1.1} />
          {[[-12, 8, 9], [-4, 8, 15], [4, 8, 11], [10, 8, 17]].map(([bx, by, h], i) => <Rect key={i} x={bx} y={by - h} width={5} height={h} fill={['#A9B8D0', '#93A6C4', '#A9B8D0', '#7F92B0'][i]} />)}
          <SvgText x={0} y={-4.5} fontFamily={F.bold} fontSize={3.8} fill="#D9443A" textAnchor="middle">I ♥ PORT M.</SvgText>
        </G>
      )}
      {id === 'suburbs' && (
        <G>
          <Rect x={-14} y={-12} width={28} height={22} rx={2} fill="#C98F63" stroke={INK} strokeWidth={1.1} />
          <Rect x={-11} y={-9} width={22} height={16} fill="#D6EAF8" />
          {[-6, 0, 6].map((dx, i) => <Circle key={i} cx={dx} cy={-1} r={2.6} fill={['#F2C9A0', '#C98F63', '#F2C9A0'][i]} stroke={INK} strokeWidth={0.5} />)}
          <Path d="M-9 7 Q0 1 9 7" fill="#6FCF97" />
        </G>
      )}
      {id === 'waterfront' && (
        <G>
          <Circle cx={0} cy={0} r={11} fill="#fff" stroke={INK} strokeWidth={1.1} />
          <Circle cx={0} cy={0} r={6} fill={'#D6EEF8'} stroke={INK} strokeWidth={1} />
          {[0, 90, 180, 270].map((a) => <Path key={a} d={`M${Math.cos((a * Math.PI) / 180) * 6} ${Math.sin((a * Math.PI) / 180) * 6} L${Math.cos((a * Math.PI) / 180) * 11} ${Math.sin((a * Math.PI) / 180) * 11}`} stroke="#E8432E" strokeWidth={4} />)}
          <Path d="M-14 12 q4 -4 8 0 t8 0 t8 0" stroke="#C99A6B" strokeWidth={1.6} fill="none" />
        </G>
      )}
      {id === 'university' && (
        <G>
          <Path d="M-18 -10 L16 -4 L-18 2 Z" fill="#7B2CBF" stroke={INK} strokeWidth={1} />
          <SvgText x={-7} y={-2.4} fontFamily={F.bold} fontSize={5} fill="#FFC531" textAnchor="middle">U.P.M.</SvgText>
          <Path d="M-18 -11 V6" stroke="#8E5A3C" strokeWidth={1.6} />
        </G>
      )}
      {id === 'industrial' && (
        <G>
          <Rect x={-17} y={-10} width={34} height={18} rx={2} fill="#F2C94C" stroke={INK} strokeWidth={1.1} />
          {[-10, -4, 2, 8].map((dx) => <Path key={dx} d={`M${dx} 8 l4 -18`} stroke={INK} strokeWidth={1.6} opacity={0.7} />)}
          <Rect x={-14} y={-6} width={28} height={10} rx={1} fill="#fff" stroke={INK} strokeWidth={0.6} />
          <SvgText x={0} y={1} fontFamily={F.bold} fontSize={4.2} fill={INK} textAnchor="middle">SAFETY 1ST</SvgText>
        </G>
      )}
      {id === 'uptown' && (
        <G>
          <Rect x={-16} y={-10} width={32} height={20} rx={1.5} fill="#7A4A26" stroke={INK} strokeWidth={1.1} />
          {[0, 1, 2, 3].map((c) => [0, 1].map((r) => <Circle key={`${c}${r}`} cx={-11 + c * 7.3} cy={-4 + r * 8} r={2.6} fill={c % 2 ? '#7B1E3A' : '#2F5D3A'} stroke={INK} strokeWidth={0.5} />))}
        </G>
      )}
    </G>
  );
}

export const RoomShell = memo(function RoomShell({ lay, wall, fp, flooring, walls, signage, plants, id }: { lay: Layout; wall: string; fp: number; flooring: number; walls: number; signage: number; plants: number; id: NeighborhoodId }) {
  const { L, R } = lay;
  const sideTop = FRONT_TOP;
  const lights: ReactElement[] = [];
  if (fp >= 2 && signage < 2) {
    const n = 12;
    for (let i = 0; i <= n; i++) {
      const x = L + 10 + ((R - L - 20) * i) / n;
      const [lx, ly] = P(x, D, WH - 18 - Math.sin((i / n) * Math.PI) * 8);
      lights.push(<Circle key={i} cx={lx} cy={ly} r={3.2} fill={['#FFC531', '#E8432E', '#3FAE5A'][i % 3]} stroke={INK} strokeWidth={0.7} />);
    }
  }
  const [wx, wy] = P(lay.counter.x1 - 50, D, 132);
  const [mx0, my] = P(lay.counter.x0 + 4, D, 180);
  const hoodRight = P(lay.ovenCols[lay.ovenCols.length - 1].x1 + 6, D - 6)[0];
  // clamp the menu board between the oven hood and the brick pier; shrink it if the gap is tight
  const pierLeft = P(lay.door.x0 - 8, 0)[0];
  const gap = pierLeft - 6 - (hoodRight + 6);
  const mw = Math.max(40, Math.min(56, gap));
  const mx = Math.min(Math.max(mx0 - 24, hoodRight + 6), pierLeft - 6 - mw);
  return (
    <G>
      <Defs>
        <LinearGradient id="wainscot" x1="0" y1="1" x2="0" y2="0">
          <Stop offset="0" stopColor="#000" stopOpacity={0.1} />
          <Stop offset="1" stopColor="#000" stopOpacity={0} />
        </LinearGradient>
        <LinearGradient id="bw" x1="0" y1="0" x2="0" y2="1">
          <Stop offset="0" stopColor={shade(wall, -0.1)} />
          <Stop offset="1" stopColor={shade(wall, 0.06)} />
        </LinearGradient>
        <LinearGradient id="lw" x1="0" y1="0" x2="1" y2="0">
          <Stop offset="0" stopColor={shade(wall, -0.26)} />
          <Stop offset="1" stopColor={shade(wall, -0.1)} />
        </LinearGradient>
        <LinearGradient id="rw" x1="0" y1="0" x2="1" y2="0">
          <Stop offset="0" stopColor={shade(wall, -0.04)} />
          <Stop offset="1" stopColor={shade(wall, -0.18)} />
        </LinearGradient>
      </Defs>
      {/* back wall with kitchen tiles below a rail */}
      <Polygon points={pts([P(L, D, 0), P(R, D, 0), P(R, D, WH), P(L, D, WH)])} fill="url(#bw)" stroke={INK} strokeWidth={1.4} />
      <Polygon points={pts([P(L, D, WH - 22), P(R, D, WH - 22), P(R, D, WH), P(L, D, WH)])} fill="rgba(59,31,20,0.12)" />
      <Path d={`M${P(L, D, WH - 22).join(' ')} L${P(R, D, WH - 22).join(' ')}`} stroke={shade(wall, -0.3)} strokeWidth={2.2} />
      <Polygon points={pts([P(L, D, 0), P(R, D, 0), P(R, D, 60), P(L, D, 60)])} fill="#fff" opacity={0.35} />
      {Array.from({ length: Math.floor((R - L) / 12) }).map((_, i) => {
        const [x0, y0] = P(L + 6 + i * 12, D, 0);
        const [, y1] = P(0, D, 60);
        return <Path key={i} d={`M${x0} ${y0} V${y1}`} stroke={shade(wall, -0.12)} strokeWidth={1} />;
      })}
      <Path d={`M${P(L, D, 60).join(' ')} L${P(R, D, 60).join(' ')}`} stroke={shade(wall, -0.3)} strokeWidth={2} />
      {/* side walls */}
      <Polygon points={pts([P(L, 0, 0), P(L, D, 0), P(L, D, WH), P(L, 0, sideTop)])} fill="url(#lw)" stroke={INK} strokeWidth={1.4} />
      <Polygon points={pts([P(R, 0, 0), P(R, D, 0), P(R, D, WH), P(R, 0, sideTop)])} fill="url(#rw)" stroke={INK} strokeWidth={1.4} />
      {/* wall caps along the cut tops */}
      <Path d={`M${P(L, 0, sideTop).join(' ')} L${P(L, D, WH).join(' ')} L${P(R, D, WH).join(' ')} L${P(R, 0, sideTop).join(' ')}`} stroke="#5E3A26" strokeWidth={4.5} strokeLinejoin="round" fill="none" />
      <Path d={`M${P(L, 0, sideTop).join(' ')} L${P(L, D, WH).join(' ')} L${P(R, D, WH).join(' ')} L${P(R, 0, sideTop).join(' ')}`} stroke="#8E5A3C" strokeWidth={1.4} strokeLinejoin="round" fill="none" />
      {/* floor: plain tile → checkerboard → wood parquet → marble (decor) */}
      <Polygon points={pts([P(L, 0), P(R, 0), P(R, D), P(L, D)])} fill={flooring === 0 && id === 'industrial' ? '#CFC6B8' : ['#E7D7BE', '#F4EFE6', '#C99A6B', '#E2D6C4'][flooring]} stroke={INK} strokeWidth={1.4} />
      {flooring === 1 &&
        Array.from({ length: 20 * 6 }).map((_, i) => {
          const c = i % 20;
          const r = Math.floor(i / 20);
          if ((c + r) % 2) return null;
          const xa = L + ((R - L) * c) / 20;
          const xb = L + ((R - L) * (c + 1)) / 20;
          return <Polygon key={`ch${i}`} points={pts([P(xa, r * 18.3), P(xb, r * 18.3), P(xb, (r + 1) * 18.3), P(xa, (r + 1) * 18.3)])} fill="#C8463A" />;
        })}
      {flooring === 2 &&
        Array.from({ length: 12 }).map((_, j) => (
          <G key={`pl${j}`}>
            <Path d={`M${P(L, j * 9.2).join(' ')} L${P(R, j * 9.2).join(' ')}`} stroke="#A8784E" strokeWidth={1} />
            {Array.from({ length: 6 }).map((__, i) => {
              const x = L + ((R - L) * (i + (j % 2) * 0.5)) / 6;
              return <Path key={i} d={`M${P(x, j * 9.2).join(' ')} L${P(x, (j + 1) * 9.2).join(' ')}`} stroke="#A8784E" strokeWidth={0.8} />;
            })}
          </G>
        ))}
      {/* marble: two-tone tiles with grout, real veins, a brass border and a soft sheen */}
      {flooring === 3 && (
        <G>
          {Array.from({ length: 8 * 6 }).map((_, i) => {
            const c = i % 8;
            const r = Math.floor(i / 8);
            if ((c + r) % 2) return null;
            const xa = L + ((R - L) * c) / 8;
            const xb = L + ((R - L) * (c + 1)) / 8;
            return <Polygon key={`mt${i}`} points={pts([P(xa, r * 18.3), P(xb, r * 18.3), P(xb, (r + 1) * 18.3), P(xa, (r + 1) * 18.3)])} fill="#C9BBA6" />;
          })}
          {Array.from({ length: 9 }).map((_, i) => {
            const x = L + ((R - L) * i) / 8;
            return <Path key={`mv${i}`} d={`M${P(x, 0).join(' ')} L${P(x, D).join(' ')}`} stroke="#C8BEB0" strokeWidth={1} />;
          })}
          {Array.from({ length: 7 }).map((_, j) => (
            <Path key={`mh${j}`} d={`M${P(L, j * 18.3).join(' ')} L${P(R, j * 18.3).join(' ')}`} stroke="#C8BEB0" strokeWidth={1} />
          ))}
          {Array.from({ length: 8 * 6 }).map((_, i) => {
            const c = i % 8;
            const r = Math.floor(i / 8);
            const h = hash32(i * 7 + 3);
            if (h % 2 === 0 && h % 3 === 0) return null;
            const xa = L + ((R - L) * (c + 0.2 + (h % 5) * 0.08)) / 8;
            const ya = r * 18.3 + 4 + (h % 7);
            const xb = xa + (R - L) / 8 * 0.45;
            const yb = ya + 5 + (h % 4);
            return <Path key={`vein${i}`} d={`M${P(xa, ya).join(' ')} L${P((xa + xb) / 2, ya + 4).join(' ')} L${P(xb, yb).join(' ')}`} stroke="#8F8577" strokeWidth={1.1} fill="none" opacity={1} strokeLinejoin="round" />;
          })}
          <Polygon points={pts([P(L, 0), P(R, 0), P(R, D), P(L, D)])} fill="url(#sheen)" />
          <Polygon points={pts([P(L, D - 5), P(R, D - 5), P(R, D), P(L, D)])} fill="#C9A04A" stroke="#9C7A2E" strokeWidth={0.6} />
          <Polygon points={pts([P(L, 2), P(R, 2), P(R, 6), P(L, 6)])} fill="#C9A04A" stroke="#9C7A2E" strokeWidth={0.6} />
          <Path d={`M${P(L, 4).join(' ')} L${P(R, 4).join(' ')}`} stroke="#FFF3B0" strokeWidth={0.8} opacity={0.7} />
          <Polygon points={pts([P(L, 0), P(L + 5, 0), P(L + 5, D - 5), P(L, D)])} fill="#C9A04A" stroke="#9C7A2E" strokeWidth={0.6} />
          <Polygon points={pts([P(R - 5, 0), P(R, 0), P(R, D), P(R - 5, D - 5)])} fill="#C9A04A" stroke="#9C7A2E" strokeWidth={0.6} />
        </G>
      )}
      {flooring === 0 &&
        Array.from({ length: 21 }).map((_, i) => {
          const x = L + ((R - L) * i) / 20;
          return <Path key={`v${i}`} d={`M${P(x, 0).join(' ')} L${P(x, D).join(' ')}`} stroke="#D4C1A3" strokeWidth={1} />;
        })}
      {flooring < 2 &&
        Array.from({ length: 7 }).map((_, j) => (
          <Path key={`h${j}`} d={`M${P(L, j * 18.3).join(' ')} L${P(R, j * 18.3).join(' ')}`} stroke={flooring === 1 ? '#B53A30' : flooring === 3 ? '#DCD6CE' : '#D4C1A3'} strokeWidth={flooring === 1 ? 0.5 : 1} />
        ))}
      {/* a soft strip marks where the kitchen floor starts */}
      <Polygon points={pts([P(L, 57), P(lay.counter.x0 - 4, 57), P(lay.counter.x0 - 4, 60), P(L, 60)])} fill="#000" opacity={0.14} />
      <Path d={`M${P(L, 56.6).join(' ')} L${P(lay.counter.x0 - 4, 56.6).join(' ')}`} stroke="#FFFFFF" strokeWidth={1} opacity={0.3} />
      {/* Uptown: burgundy wainscot with a gold cap and a brass picture rail */}
      {id === 'uptown' && (
        <G>
          <Polygon points={pts([P(L, D, 0), P(R, D, 0), P(R, D, 60), P(L, D, 60)])} fill="#7B1E3A" />
          {Array.from({ length: Math.floor((R - L) / 26) }).map((_, i) => {
            const xa = L + 6 + i * 26;
            return (
              <G key={`up${i}`}>
                <Polygon points={pts([P(xa, D, 10), P(xa + 18, D, 10), P(xa + 18, D, 50), P(xa, D, 50)])} fill="none" stroke="#5A1229" strokeWidth={1.2} />
                {/* lit top and left edges give the mouldings relief */}
                <Path d={`M${P(xa + 0.8, D, 11).join(' ')} L${P(xa + 0.8, D, 49).join(' ')} L${P(xa + 17.2, D, 49).join(' ')}`} stroke="#B04A68" strokeWidth={1.6} opacity={0.9} fill="none" />
                <Path d={`M${P(xa + 17.2, D, 49).join(' ')} L${P(xa + 17.2, D, 11).join(' ')} L${P(xa + 0.8, D, 11).join(' ')}`} stroke="#5A1228" strokeWidth={1.6} opacity={0.9} fill="none" />
              </G>
            );
          })}
          <Polygon points={pts([P(L, D, 58), P(R, D, 58), P(R, D, 63), P(L, D, 63)])} fill="#D4A84A" />
          <Path d={`M${P(L, D, 62.6).join(' ')} L${P(R, D, 62.6).join(' ')}`} stroke="#FFE08A" strokeWidth={1.2} />
          <Path d={`M${P(L, D, 63).join(' ')} L${P(R, D, 63).join(' ')}`} stroke="#9C7A2E" strokeWidth={0.8} />
          {/* brass picture rail: a 2-unit band with a dark underside */}
          <Polygon points={pts([P(L, D, 130), P(R, D, 130), P(R, D, 133), P(L, D, 133)])} fill="#D4A84A" stroke="#8A6A2A" strokeWidth={0.6} />
          <Path d={`M${P(L, D, 132.6).join(' ')} L${P(R, D, 132.6).join(' ')}`} stroke="#FFE08A" strokeWidth={0.9} />
        </G>
      )}
      {id === 'industrial' && (
        <G>
          <Polygon points={pts([P(L, D, 0), P(R, D, 0), P(R, D, 60), P(L, D, 60)])} fill="#9AA1A8" />
          <Path d={`M${P(L, D, 60).join(' ')} L${P(R, D, 60).join(' ')}`} stroke="#6E757B" strokeWidth={2} />
          {/* hazard band: alternating dark / yellow chevrons */}
          <Polygon points={pts([P(L, D, 60), P(R, D, 60), P(R, D, 65), P(L, D, 65)])} fill="#E8B23A" />
          {Array.from({ length: Math.ceil((R - L) / 8) }).map((_, i) => (
            <Polygon key={`hz${i}`} points={pts([P(L + i * 8, D, 60), P(L + i * 8 + 4, D, 60), P(L + i * 8 + 7, D, 65), P(L + i * 8 + 3, D, 65)])} fill="#1F1A17" />
          ))}
          <Path d={`M${P(L, D, 60).join(' ')} L${P(R, D, 60).join(' ')}`} stroke="#8C8478" strokeWidth={1.2} />
          {Array.from({ length: Math.floor((R - L) / 14) }).map((_, i) => {
            const [rx, ry] = P(L + 7 + i * 14, D, 54);
            const [, ry2] = P(0, D, 8);
            return (
              <G key={`rv${i}`}>
                <Circle cx={rx} cy={ry} r={1} fill="#C9CED4" />
                <Circle cx={rx} cy={ry2} r={1} fill="#C9CED4" />
              </G>
            );
          })}
        </G>
      )}
      {/* ambient occlusion where the walls meet the floor */}
      <Polygon points={pts([P(L, D - 10), P(R, D - 10), P(R, D), P(L, D)])} fill="rgba(59,31,20,0.16)" />
      <Polygon points={pts([P(L, 0), P(L + 10, 0), P(L + 10, D), P(L, D)])} fill="rgba(59,31,20,0.14)" />
      <Polygon points={pts([P(R - 10, 0), P(R, 0), P(R, D), P(R - 10, D)])} fill="rgba(59,31,20,0.1)" />
      <Polygon points={pts([P(L, D, 0), P(R, D, 0), P(R, D, 10), P(L, D, 10)])} fill="rgba(59,31,20,0.12)" />
      <Polygon points={pts([P(L, D, 0), P(R, D, 0), P(R, D, 24), P(L, D, 24)])} fill="url(#wainscot)" />
      {/* decor grows with the shop */}
      {/* a hole-in-the-wall: branching crack and a chipped patch showing bricks; not beside the porthole */}
      {fp === 0 && id !== 'waterfront' && (
        <G>
          <Path d={`M${mx - 26} ${my + 18} l5 9 l-3 7 l6 9 M${mx - 24} ${my + 32} l-6 5 M${mx - 18} ${my + 43} l5 4`} stroke={shade(wall, -0.35)} strokeWidth={1.2} fill="none" strokeLinecap="round" strokeLinejoin="round" />
          {(() => {
            const [px, py] = P(L + 60, D, 150);
            return (
              <G>
                <Path d={`M${px} ${py} q9 -4 18 1 q3 7 -2 13 q-9 4 -16 -1 q-4 -6 0 -13 Z`} fill="#C8643E" stroke={shade(wall, -0.35)} strokeWidth={1} />
                <Path d={`M${px + 1} ${py + 6} H${px + 18} M${px + 8} ${py} V${py + 6} M${px + 4} ${py + 6} V${py + 12} M${px + 13} ${py + 6} V${py + 13}`} stroke="#8C3F22" strokeWidth={0.8} />
              </G>
            );
          })()}
        </G>
      )}
      {/* menu board: header, slices and prices */}
      {fp >= 1 && (
        <G>
          <G transform={`translate(${mx} ${my}) scale(${mw / 56})`}>
          <Rect x={2} y={2} width={56} height={40} rx={4} fill="rgba(59,31,20,0.25)" />
          <Rect x={0} y={0} width={56} height={40} rx={4} fill="#2F3B33" stroke="#8E5A3C" strokeWidth={2.4} />
          <SvgText x={28} y={10} fontFamily={F.bold} fontSize={7.5} fill="#FFC531" textAnchor="middle">
            MENU
          </SvgText>
          {['Margherita', 'Pepperoni', 'Veggie'].map((name, i) => (
            <G key={name}>
              <Path d={`M5 ${15 + i * 8} l5 0 l-2.5 5 Z`} fill="#FFC531" />
              <Circle cx={7.5} cy={16.6 + i * 8} r={0.8} fill="#E8432E" />
              <SvgText x={12} y={19.6 + i * 8} fontFamily={F.bold} fontSize={5} fill="#FFF4E0">
                {name}
              </SvgText>
              <SvgText x={52} y={19.6 + i * 8} fontFamily={F.bold} fontSize={5} fill="#FFC531" textAnchor="end">
                {`$${[3, 4, 4][i]}`}
              </SvgText>
            </G>
          ))}
          </G>
        </G>
      )}
      {lights.length > 0 && (
        <Path d={`M${P(L + 10, D, WH - 18).join(' ')} Q${P(196.5, D, WH - 38).join(' ')} ${P(R - 10, D, WH - 18).join(' ')}`} stroke={INK} strokeWidth={1} fill="none" />
      )}
      {lights}
      {/* wall decor (decor): posters → framed photos → hand-painted mural */}
      {walls >= 3 &&
        (() => {
          const x0 = L + 26;
          const duct = (lay.ovenCols[0].x0 + lay.ovenCols[lay.ovenCols.length - 1].x1) / 2;
          const x1 = Math.min(lay.counter.x0 - 10, duct - 22, x0 + (lay.counter.x0 - 10 - x0) * 0.6);
          const [ax, ay] = P(x0, D, 204);
          const [bx, by] = P(x1, D, 154);
          const w = bx - ax;
          const h = by - ay;
          return (
            <G>
              <Rect x={ax} y={ay} width={w} height={h} rx={4} fill="#9ED2F0" stroke="#8E5A3C" strokeWidth={2} />
              <Circle cx={ax + w * 0.8} cy={ay + h * 0.3} r={h * 0.16} fill="#FFD866" />
              <Path d={`M${ax} ${ay + h * 0.62} Q${ax + w * 0.25} ${ay + h * 0.3} ${ax + w * 0.5} ${ay + h * 0.58} Q${ax + w * 0.75} ${ay + h * 0.35} ${ax + w} ${ay + h * 0.55} L${ax + w} ${ay + h} L${ax} ${ay + h} Z`} fill="#7DBB5E" />
              <Path d={`M${ax} ${ay + h * 0.8} H${ax + w}`} stroke="#4E9CC9" strokeWidth={h * 0.18} />
              {[0.2, 0.32, 0.6].map((f, i) => (
                <G key={i}>
                  <Rect x={ax + w * f - 3} y={ay + h * 0.36} width={6} height={h * 0.3} fill="#2F6B2F" />
                  <Path d={`M${ax + w * f - 5} ${ay + h * 0.4} L${ax + w * f} ${ay + h * 0.16} L${ax + w * f + 5} ${ay + h * 0.4} Z`} fill="#2F6B2F" />
                </G>
              ))}
              <Rect x={ax + w * 0.42} y={ay + h * 0.42} width={w * 0.1} height={h * 0.2} fill="#F6E7C1" stroke={INK} strokeWidth={0.8} />
              <Path d={`M${ax + w * 0.41} ${ay + h * 0.43} L${ax + w * 0.47} ${ay + h * 0.32} L${ax + w * 0.53} ${ay + h * 0.43} Z`} fill="#C8463A" />
            </G>
          );
        })()}
      {walls >= 1 &&
        walls < 3 &&
        (() => {
          const [ax, ay] = P(L + 10, D, 206);
          const [bx, by] = P(Math.min(lay.prep.x1 + 6, lay.counter.x0 - 40), D, 140);
          const w = Math.min(46, bx - ax);
          return (
            <G>
              <Rect x={ax} y={ay} width={w} height={by - ay} fill="#FFF4E0" stroke={INK} strokeWidth={1.2} />
              <Circle cx={ax + w / 2} cy={ay + (by - ay) * 0.45} r={w * 0.3} fill="#FFC531" stroke={INK} strokeWidth={0.8} />
              {[[-0.1, -0.05], [0.12, 0.02], [0, 0.12]].map(([dx, dy], i) => (
                <Circle key={i} cx={ax + w / 2 + dx * w} cy={ay + (by - ay) * (0.45 + dy)} r={w * 0.05} fill="#E8432E" />
              ))}
              <SvgText x={ax + w / 2} y={by - 5} fontFamily={F.bold} fontSize={7} fill="#D9443A" textAnchor="middle">
                PIZZA!
              </SvgText>
            </G>
          );
        })()}
      {walls === 2 &&
        lay.ovenCols.length > 0 &&
        (() => {
          const xs = [0.2, 0.5, 0.8].map((f) => lay.ovenCols[0].x0 + (lay.ovenCols[lay.ovenCols.length - 1].x1 - lay.ovenCols[0].x0) * f);
          return (
            <G>
              {xs.map((x, i) => {
                const [fx, fy] = P(x, D, 196);
                return (
                  <G key={i}>
                    <Rect x={fx - 10} y={fy} width={20} height={16} fill="#C98F63" stroke={INK} strokeWidth={1} />
                    <Rect x={fx - 7} y={fy + 3} width={14} height={10} fill={['#F6E7C1', '#D6EAF8', '#FADADD'][i]} />
                    <Circle cx={fx} cy={fy + 8} r={2.6} fill="#F2C9A0" />
                  </G>
                );
              })}
            </G>
          );
        })()}
      {plants >= 3 && (
        <G>
          <Path d={`M${P(L, D, WH - 8).join(' ')} L${P(R, D, WH - 8).join(' ')}`} stroke="#3F8F3A" strokeWidth={3} />
          {Array.from({ length: 22 }).map((_, i) => {
            const [vx, vy] = P(L + ((R - L) * (i + 0.5)) / 22, D, WH - 8);
            return <Ellipse key={i} cx={vx} cy={vy + (i % 3) * 3} rx={4} ry={2.6} fill={i % 2 ? '#5DBB5A' : '#3F9A48'} stroke={INK} strokeWidth={0.5} transform={`rotate(${(i % 2 ? 1 : -1) * 30} ${vx} ${vy})`} />;
          })}
          {[0.08, 0.92].map((f) =>
            Array.from({ length: 6 }).map((_, i) => {
              const [vx, vy] = P(L + (R - L) * f, D, WH - 14 - i * 14);
              return <Ellipse key={`${f}${i}`} cx={vx + (i % 2 ? 3 : -3)} cy={vy} rx={4} ry={2.6} fill={i % 2 ? '#5DBB5A' : '#3F9A48'} stroke={INK} strokeWidth={0.5} />;
            }),
          )}
        </G>
      )}
      {/* pantry shelf: flour sacks and tins, kept under the mural too */}
      {true &&
        (() => {
          const sx0 = L + 14;
          const sx1 = L + 104;
          const [ax, ay] = P(sx0, D, 104);
          const [bx] = P(sx1, D, 104);
          const w = bx - ax;
          return (
            <G>
              <Rect x={ax} y={ay} width={w} height={4} rx={1} fill="#8E5A3C" stroke={INK} strokeWidth={0.9} />
              {[0.08, 0.5].map((f) => <Path key={f} d={`M${ax + w * f} ${ay + 4} l4 7 M${ax + w * f} ${ay + 4} v8`} stroke="#5E3A26" strokeWidth={1.4} strokeLinecap="round" />)}
              {[0.14, 0.38].map((f, i) => (
                <G key={i}>
                  <Path d={`M${ax + w * f - 8} ${ay} Q${ax + w * f - 9} ${ay - 16} ${ax + w * f - 4} ${ay - 19} L${ax + w * f + 4} ${ay - 19} Q${ax + w * f + 9} ${ay - 16} ${ax + w * f + 8} ${ay} Z`} fill="#F3ECE2" stroke={INK} strokeWidth={0.9} />
                  <Path d={`M${ax + w * f - 4} ${ay - 19} q4 -3 8 0`} stroke={INK} strokeWidth={0.9} fill="none" />
                  <SvgText x={ax + w * f} y={ay - 6} fontFamily={F.bold} fontSize={4.5} fill="#C8463A" textAnchor="middle">
                    FLOUR
                  </SvgText>
                </G>
              ))}
              {[0.6, 0.74, 0.88].map((f, i) => (
                <G key={f}>
                  <Rect x={ax + w * f - 4.5} y={ay - 12} width={9} height={12} rx={1.2} fill={['#E8432E', '#3FAE5A', '#E8432E'][i]} stroke={INK} strokeWidth={0.8} />
                  <Rect x={ax + w * f - 4.5} y={ay - 8} width={9} height={4} fill="#FFF4E0" />
                </G>
              ))}
            </G>
          );
        })()}
      {walls === 0 && (() => {
        const [px, py] = P(L + 22, D, 168);
        return <LocalProp id={id} x={px} y={py} />;
      })()}
      {/* back window: a brass porthole + fishing net at the Waterfront, trees elsewhere */}
      {id === 'uptown' ? (
        // the arched window sits 20 lower than the plain one so its arch clears the menu board
        <G transform="translate(0 20)">
          <Path d={`M${wx} ${wy + 38} L${wx} ${wy + 14} A20 20 0 0 1 ${wx + 40} ${wy + 14} L${wx + 40} ${wy + 38} Z`} fill="#FBD3AE" stroke="#C9A04A" strokeWidth={2.4} />
          <Path d={`M${wx + 6} ${wy + 38} L${wx + 6} ${wy + 30} L${wx + 12} ${wy + 18} L${wx + 20} ${wy + 26} L${wx + 28} ${wy + 12} L${wx + 34} ${wy + 24} L${wx + 34} ${wy + 38} Z`} fill="#6E6FA0" />
          <Path d={`M${wx + 20} ${wy - 6} V${wy + 38} M${wx} ${wy + 20} H${wx + 40}`} stroke="#C9A04A" strokeWidth={1.6} />
          <Rect x={wx - 3} y={wy + 37} width={46} height={4} fill="#7B1E3A" stroke={INK} strokeWidth={0.8} />
        </G>
      ) : id === 'waterfront' ? (
        <G>
          <Circle cx={wx + 20} cy={wy + 18} r={19} fill="#C9A04A" stroke={INK} strokeWidth={1.2} />
          <Circle cx={wx + 20} cy={wy + 18} r={14} fill="#7CC8EE" stroke={INK} strokeWidth={1} />
          <Path d={`M${wx + 6} ${wy + 22} q7 -3 14 0 t14 0`} stroke="#D6F0FB" strokeWidth={1.6} fill="none" />
          <Path d={`M${wx + 12} ${wy + 9} A10 10 0 0 1 ${wx + 24} ${wy + 6}`} stroke="#fff" strokeWidth={1.6} opacity={0.6} fill="none" strokeLinecap="round" />
          {[0, 90, 180, 270].map((a) => <Circle key={a} cx={wx + 20 + Math.cos((a * Math.PI) / 180) * 16.5} cy={wy + 18 + Math.sin((a * Math.PI) / 180) * 16.5} r={1.2} fill="#8C6A20" />)}
          {/* fishing net gathered on a peg: fans to a sagging hem, uneven mesh, two cork floats */}
          {(() => {
            const ax = wx - 12;
            const ay = wy - 4;
            const hl = wx - 26;
            const hr = wx - 1;
            const hy = wy + 38;
            const sag = 6;
            const hem = (f: number) => [hl + (hr - hl) * f, hy + sag * 4 * f * (1 - f)] as const;
            const strands = [0, 0.18, 0.37, 0.55, 0.78, 1];
            const knots = [0.3, 0.52, 0.71, 0.88];
            return (
              <G>
                <Path d={`M${ax} ${ay} L${hl} ${hy} Q${(hl + hr) / 2} ${hy + sag * 2} ${hr} ${hy} Z`} fill="#B48E5E" opacity={0.16} />
                {strands.map((f) => {
                  const [ex, ey] = hem(f);
                  return <Path key={`ns${f}`} d={`M${ax} ${ay} Q${(ax + ex) / 2 + (f - 0.5) * 3} ${(ay + ey) / 2 + 2} ${ex} ${ey}`} stroke="#B48E5E" strokeWidth={0.8} fill="none" />;
                })}
                {knots.map((k, j) => {
                  const y = ay + (hy - ay) * k;
                  const x0 = ax + (hl - ax) * k;
                  const x1 = ax + (hr - ax) * k;
                  return <Path key={`nk${j}`} d={`M${x0} ${y} Q${(x0 + x1) / 2} ${y + 2 + j * 0.6} ${x1} ${y}`} stroke="#A57E50" strokeWidth={0.7} fill="none" />;
                })}
                <Path d={`M${hl} ${hy} Q${(hl + hr) / 2} ${hy + sag * 2} ${hr} ${hy}`} stroke="#8E5A3C" strokeWidth={1.3} fill="none" />
                <Circle cx={ax} cy={ay} r={1.8} fill="#5E3A26" />
                {[0.28, 0.72].map((f) => {
                  const [fx, fy] = hem(f);
                  return <Ellipse key={`cf${f}`} cx={fx} cy={fy + 1.5} rx={3.4} ry={2.4} fill="#D9A35B" stroke={INK} strokeWidth={0.8} />;
                })}
              </G>
            );
          })()}
        </G>
      ) : (
        <G>
          <Rect x={wx} y={wy} width={40} height={36} rx={3} fill="#BFE3F5" stroke={INK} strokeWidth={1.2} />
          <Circle cx={wx + 14} cy={wy + 26} r={8} fill="#5DAE4B" />
          <Circle cx={wx + 27} cy={wy + 28} r={6} fill="#4FA048" />
          <Path d={`M${wx + 20} ${wy} V${wy + 36} M${wx} ${wy + 18} H${wx + 40}`} stroke="#fff" strokeWidth={2} />
          <Rect x={wx - 2} y={wy + 34} width={44} height={4} fill="#8E5A3C" stroke={INK} strokeWidth={0.8} />
        </G>
      )}
    </G>
  );
});

/**
 * The street face of the shop: brick pilasters at both corners, a fascia beam across the top
 * carrying the sign, a full-width scalloped awning, the brick sill and the entrance on the right.
 */
export const FrontWall = memo(function FrontWall({ lay, name, signage, plants }: { lay: Layout; name: string; signage: number; plants: number }) {
  const { L, R, door } = lay;
  const sill = (x0: number, x1: number) => {
    const [ax, ay] = P(x0, 0);
    const [bx] = P(x1, 0);
    return (
      <G key={x0}>
        <Rect x={ax} y={ay - 7} width={bx - ax} height={13} rx={2} fill="#A24B2C" stroke={INK} strokeWidth={1.2} />
        <Rect x={ax + 1} y={ay - 6} width={bx - ax - 2} height={4} fill="#fff" opacity={0.15} />
        {Array.from({ length: Math.floor((bx - ax) / 20) }).map((_, i) => (
          <Path key={i} d={`M${ax + 10 + i * 20} ${ay - 7} V${ay + 6}`} stroke="#7A3520" strokeWidth={1} />
        ))}
      </G>
    );
  };
  const pilaster = (x0: number, x1: number, inner: 'l' | 'r') => {
    const [ax, ay] = P(x0, 0, 0);
    const [bx, ty] = P(x1, 0, FRONT_TOP);
    const w = bx - ax;
    const rows = Math.floor((ay - ty) / 9);
    return (
      <G key={x0}>
        <Rect x={ax} y={ty} width={w} height={ay - ty + 6} fill="#A24B2C" stroke={INK} strokeWidth={1.3} />
        {Array.from({ length: rows }).map((_, i) => (
          <G key={i}>
            <Path d={`M${ax} ${ty + 9 * (i + 1)} H${bx}`} stroke="#7A3520" strokeWidth={0.8} />
            <Path d={`M${ax + w * (i % 2 ? 0.33 : 0.66)} ${ty + 9 * i} v9`} stroke="#7A3520" strokeWidth={0.8} />
          </G>
        ))}
        <Rect x={inner === 'l' ? bx - 3.5 : ax} y={ty} width={3.5} height={ay - ty + 6} fill="#000" opacity={0.18} />
        <Rect x={inner === 'l' ? ax + 1.5 : bx - 4} y={ty} width={2.5} height={ay - ty + 6} fill="#fff" opacity={0.16} />
        <Rect x={ax - 2} y={ay - 2} width={w + 4} height={8} rx={1.5} fill="#7A3520" stroke={INK} strokeWidth={1} />
      </G>
    );
  };
  // fascia beam + sign
  const [fx0, fTop] = P(L - 6, 0, FRONT_TOP);
  const [fx1, fBot] = P(R + 6, 0, FRONT_TOP - 20);
  const fcx = (fx0 + fx1) / 2;
  const signW = Math.min(fx1 - fx0 - 40, 34 + name.length * 9.6 + 54);
  const board = signage === 0 ? '#8E5A3C' : signage === 1 ? '#1E1630' : '#D9443A';
  const text = signage === 0 ? '#FFF4E0' : signage === 1 ? '#FF8FB8' : '#fff';
  // awning valance under the fascia
  const n = 12;
  const aw = (fx1 - fx0 + 12) / n;
  return (
    <G>
      {sill(L - 4, door.x0)}
      {sill(door.x1, R + 4)}
      {/* entrance set in the front plane: brick jambs + lintel, glazed leaf swung inward,
          and a see-through shop window above it up to the fascia */}
      {(() => {
        const jx0 = door.x0 - 8;
        const jx1 = R - 8;
        const [jax, jay] = P(jx0, 0, 0);
        const [jbx] = P(door.x0, 0, 0);
        const [kbx] = P(jx1, 0, 0);
        const [, lTop] = P(0, 0, 122);
        const [, lBot] = P(0, 0, 108);
        const [, gTop] = P(0, 0, 196);
        const [, bTop] = P(0, 0, FRONT_TOP - 20);
        const brick = (x0: number, x1: number, top: number, bot: number) => (
          <G>
            <Rect x={x0} y={top} width={x1 - x0} height={bot - top} fill="#A24B2C" stroke={INK} strokeWidth={1.1} />
            {Array.from({ length: Math.floor((bot - top) / 8) }).map((_, i) => (
              <Path key={i} d={`M${x0} ${top + 8 * (i + 1)} H${x1}`} stroke="#7A3520" strokeWidth={0.7} />
            ))}
          </G>
        );
        return (
          <G>
            {/* shop window above the entrance */}
            <Rect x={jax} y={gTop} width={kbx - jax} height={lTop - gTop} fill="url(#glass)" />
            <G opacity={0.85}>
            {/* two-tier pizza stand on display in the window */}
            {(() => {
              const cx = (jax + kbx) / 2;
              const by = lTop - 13;
              const tier = (y: number, rx: number) => (
                <G>
                  <Ellipse cx={cx} cy={y} rx={rx} ry={rx * 0.24} fill="#E9E4DC" stroke={INK} strokeWidth={0.8} />
                  <Ellipse cx={cx} cy={y - 1.6} rx={rx * 0.86} ry={rx * 0.21} fill="#E9A64B" stroke={INK} strokeWidth={0.7} />
                  <Ellipse cx={cx} cy={y - 2} rx={rx * 0.7} ry={rx * 0.16} fill="#FFC531" />
                  {[-0.45, 0, 0.45].map((d) => <Circle key={d} cx={cx + d * rx} cy={y - 2 + (d === 0 ? 0.6 : -0.3)} r={1.1} fill="#E8432E" />)}
                </G>
              );
              return (
                <G>
                  <Path d={`M${cx - 3} ${by} L${cx + 3} ${by} L${cx + 1.2} ${by - 22} L${cx - 1.2} ${by - 22} Z`} fill="#C9A04A" stroke={INK} strokeWidth={0.7} />
                  <Ellipse cx={cx} cy={by} rx={7} ry={1.8} fill="#C9A04A" stroke={INK} strokeWidth={0.7} />
                  {tier(by - 8, 17)}
                  {tier(by - 22, 11)}
                </G>
              );
            })()}
            </G>
            <Path d={`M${jax + 7} ${gTop + 30} L${jax + 20} ${gTop + 8}`} stroke="#fff" strokeWidth={2.6} opacity={0.6} strokeLinecap="round" />
            {/* gold arched decal on the glass */}
            {(() => {
              const cx = (jax + kbx) / 2;
              const cy = gTop + (lTop - gTop) * 0.36;
              const r = (kbx - jax) * 0.55;
              const word = 'ROSA’S';
              return (
                <G>
                  {word.split('').map((ch, i) => {
                    const ang = (-26 + (52 * i) / (word.length - 1)) * (Math.PI / 180);
                    const x = cx + Math.sin(ang) * r;
                    const y = cy - Math.cos(ang) * r * 0.5;
                    return (
                      <SvgText key={i} x={x} y={y} fontFamily={F.bold} fontSize={8} fill="#E0B000" stroke="#7A5A00" strokeWidth={0.3} textAnchor="middle" rotation={(ang * 180) / Math.PI} origin={`${x}, ${y}`}>
                        {ch}
                      </SvgText>
                    );
                  })}
                </G>
              );
            })()}
            <Rect x={jax + 2} y={gTop + 2} width={kbx - jax - 4} height={lTop - gTop - 2} fill="none" stroke="#6B4330" strokeWidth={4.5} />
            <Rect x={jax + 2} y={gTop + 2} width={kbx - jax - 4} height={lTop - gTop - 2} fill="none" stroke={INK} strokeWidth={0.8} />
            <Path d={`M${(jax + kbx) / 2} ${gTop} V${(gTop + lTop) / 2 - 14}`} stroke="#6B4330" strokeWidth={3} />
            {brick(jax, kbx, bTop, gTop + 2)}
            <Rect x={jax - 1} y={gTop - 1} width={kbx - jax + 2} height={4} rx={1} fill="#7A3520" stroke={INK} strokeWidth={0.9} />
            <Circle cx={(jax + kbx) / 2 + 4} cy={(bTop + gTop) / 2 - 6} r={8} fill="#FFE7A0" stroke="#6B4330" strokeWidth={2.6} />
            <Path d={`M${(jax + kbx) / 2 + 4} ${(bTop + gTop) / 2 - 14} V${(bTop + gTop) / 2 + 2} M${(jax + kbx) / 2 - 4} ${(bTop + gTop) / 2 - 6} H${(jax + kbx) / 2 + 12}`} stroke="#6B4330" strokeWidth={1.4} />
            {(() => {
              // hangs over the sidewalk off the right pilaster; on the widest shop (no room) it sits on the brick header
              const outside = P(R + 6, 0)[0] + 26 <= SCENE_W - 4;
              const sx = outside ? P(R + 6, 0)[0] + 26 : (jax + kbx) / 2 + 14;
              const sy = outside ? gTop - 22 : (bTop + gTop) / 2 + 14;
              return (
                <G>
                  {outside && (
                    <G>
                      <Path d={`M${sx} ${sy - 16} H${sx - 26}`} stroke={INK} strokeWidth={2.4} fill="none" strokeLinecap="round" />
                      <Path d={`M${sx} ${sy - 16} H${sx - 26}`} stroke="#4A4F57" strokeWidth={1.2} fill="none" strokeLinecap="round" />
                      <Path d={`M${sx - 22} ${sy - 16} v6 M${sx - 6} ${sy - 16} v6`} stroke={INK} strokeWidth={0.8} />
                    </G>
                  )}
                  <Circle cx={sx - 14} cy={sy} r={10.5} fill="#D9443A" stroke={INK} strokeWidth={1.2} />
                  <Circle cx={sx - 14} cy={sy} r={8.4} fill="none" stroke="#FFF4E0" strokeWidth={0.8} />
                  <SvgText x={sx - 14} y={sy + 2} fontFamily={F.bold} fontSize={5.6} fill="#FFF4E0" textAnchor="middle">
                    PIZZA
                  </SvgText>
                  <Path d={`M${sx - 21} ${sy - 4} A8 8 0 0 1 ${sx - 10} ${sy - 7.5}`} stroke="#fff" strokeWidth={1.2} opacity={0.5} fill="none" strokeLinecap="round" />
                </G>
              );
            })()}
            <Path d={`M${jax} ${lTop - 12} H${kbx}`} stroke="#6B4330" strokeWidth={2.4} />
            <Rect x={jax + 2} y={lTop - 11} width={kbx - jax - 4} height={10} fill="#3B1F14" opacity={0.85} />
            <SvgText x={(jax + kbx) / 2} y={lTop - 3.4} fontFamily={F.bold} fontSize={6.5} fill="#E0B000" textAnchor="middle" letterSpacing={1}>
              PIZZERIA
            </SvgText>
            {/* jambs + lintel */}
            {/* the doorway's left side is a slim wooden post, so people walking in aren't hidden behind brick */}
            <Rect x={jbx - 3.2} y={lTop} width={3.2} height={jay + 6 - lTop} fill="#6B4330" stroke={INK} strokeWidth={0.9} />
            <Rect x={jax} y={jay - 2} width={jbx - 3.2 - jax} height={8} fill="#A24B2C" stroke={INK} strokeWidth={0.9} />
            {brick(P(door.x1, 0)[0], kbx, lTop, jay + 6)}
            {brick(jax, kbx, lTop, lBot)}
            <Rect x={jax - 1} y={lTop - 3} width={kbx - jax + 2} height={4} rx={1} fill="#7A3520" stroke={INK} strokeWidth={0.9} />
            <Path d={`M${jbx} ${lBot} V${jay + 4} M${P(door.x1, 0)[0]} ${lBot} V${jay + 4}`} stroke="#5E3A26" strokeWidth={2.4} />
            {/* OPEN plate hanging from the lintel, centred in the doorway, above head height */}
            {(() => {
              const [cx] = P(door.cx, 0);
              return (
                <G>
                  <Rect x={cx - 11} y={(lTop + lBot) / 2 - 4.5} width={22} height={9} rx={2.2} fill="#E8432E" stroke="#fff" strokeWidth={0.9} />
                  <SvgText x={cx} y={(lTop + lBot) / 2 + 2.4} fontFamily={F.bold} fontSize={6.4} fill="#fff" textAnchor="middle">
                    OPEN
                  </SvgText>
                </G>
              );
            })()}
          </G>
        );
      })()}
      {pilaster(L - 6, L + 8, 'l')}
      {pilaster(R - 8, R + 6, 'r')}
      {/* awning: alternating stripes with scalloped edge, under the fascia */}
      <Path d={`M${fx0} ${fBot} L${fx1} ${fBot} L${fx1 + 6} ${fBot + 13} L${fx0 - 6} ${fBot + 13} Z`} fill="#FFF4E0" stroke={INK} strokeWidth={1.1} />
      {Array.from({ length: n }).map((_, i) => {
        const xa = fx0 - 6 + i * aw;
        const ta = fx0 + (i * (fx1 - fx0)) / n;
        const tb = fx0 + ((i + 1) * (fx1 - fx0)) / n;
        return (
          <G key={i}>
            {i % 2 === 0 && <Path d={`M${ta} ${fBot} L${tb} ${fBot} L${xa + aw} ${fBot + 13} L${xa} ${fBot + 13} Z`} fill="#D9443A" />}
            <Path d={`M${xa} ${fBot + 13} q${aw / 2} ${aw * 0.5} ${aw} 0`} fill={i % 2 === 0 ? '#D9443A' : '#FFF4E0'} stroke={INK} strokeWidth={1} />
          </G>
        );
      })}
      <Path d={`M${fx0 - 6} ${fBot + 13} H${fx1 + 6}`} stroke={INK} strokeWidth={1.1} />
      <Rect x={fx0} y={fBot} width={fx1 - fx0} height={3} fill="#000" opacity={0.15} />
      {/* fascia beam */}
      <Rect x={fx0} y={fTop} width={fx1 - fx0} height={fBot - fTop} fill="#5E3A26" stroke={INK} strokeWidth={1.4} />
      <Rect x={fx0 + 1} y={fTop + 1} width={fx1 - fx0 - 2} height={4} fill="#fff" opacity={0.14} />
      {/* hanging ferns from the fascia (plants decor) */}
      {plants >= 2 &&
        [0.04, 0.96].map((f) => {
          const hx = fx0 + (fx1 - fx0) * f;
          const hy = fBot + 30;
          return (
            <G key={f}>
              <Path d={`M${hx} ${fBot + 13} V${hy - 8}`} stroke={INK} strokeWidth={0.8} />
              <Path d={`M${hx - 8} ${hy - 8} L${hx + 8} ${hy - 8} L${hx + 5} ${hy} L${hx - 5} ${hy} Z`} fill="#C2693E" stroke={INK} strokeWidth={0.9} />
              {[-1, -0.5, 0, 0.5, 1].map((d) => {
                const tx = hx + d * 12;
                const ty = hy + 22 - Math.abs(d) * 5;
                return <Path key={d} d={`M${hx + d * 3} ${hy - 1} Q${tx + d * 4 - 4} ${(hy + ty) / 2} ${tx} ${ty} Q${tx + d * 4 + 4} ${(hy + ty) / 2} ${hx + d * 3 + 1.5} ${hy - 1} Z`} fill={Math.abs(d) === 0.5 ? '#3F8A3E' : '#4FA048'} stroke={INK} strokeWidth={0.7} />;
              })}
            </G>
          );
        })}
      {/* rooftop giant pizza (signage 3) */}
      {signage >= 3 && (
        <G>
          <Rect x={fcx - 3} y={fTop - 26} width={6} height={26} fill="#6B6B6B" stroke={INK} strokeWidth={1} />
          <Circle cx={fcx} cy={fTop - 56} r={40} fill="#FFE7A0" opacity={0.35} />
          <Circle cx={fcx} cy={fTop - 56} r={32} fill="#E9A64B" stroke={INK} strokeWidth={1.6} />
          <Circle cx={fcx} cy={fTop - 56} r={26} fill="#FFC531" />
          {[0, 60, 120].map((a) => (
            <Path key={a} d={`M${fcx - 26 * Math.cos((a * Math.PI) / 180)} ${fTop - 56 - 26 * Math.sin((a * Math.PI) / 180)} L${fcx + 26 * Math.cos((a * Math.PI) / 180)} ${fTop - 56 + 26 * Math.sin((a * Math.PI) / 180)}`} stroke="#E9A64B" strokeWidth={1.4} />
          ))}
          {[[-12, -8], [10, -14], [2, 6], [-8, 12], [14, 8], [-14, -20]].map(([dx, dy], i) => (
            <Circle key={i} cx={fcx + dx} cy={fTop - 56 + dy} r={4} fill="#E8432E" stroke={INK} strokeWidth={0.6} />
          ))}
          <Path d={`M${fcx - 20} ${fTop - 74} A26 26 0 0 1 ${fcx + 4} ${fTop - 82}`} stroke="#fff" strokeWidth={2.4} opacity={0.5} fill="none" strokeLinecap="round" />
        </G>
      )}
      {/* sign plate: painted board → neon → marquee bulbs */}
      {signage === 1 && <Rect x={fcx - signW / 2 - 6} y={fTop - 8} width={signW + 12} height={fBot - fTop + 16} rx={12} fill="#FF5E9A" opacity={0.28} />}
      <Rect x={fcx - signW / 2} y={fTop - 5} width={signW} height={fBot - fTop + 10} rx={6} fill={board} stroke={signage === 1 ? '#FF5E9A' : INK} strokeWidth={signage === 1 ? 2 : 1.4} />
      {signage !== 1 && <Rect x={fcx - signW / 2 + 3} y={fTop - 3} width={signW - 6} height={6} rx={3} fill="#fff" opacity={0.2} />}
      {signage >= 2 &&
        Array.from({ length: 18 }).map((_, i) => {
          const top = i < 9;
          const x = fcx - signW / 2 + 8 + (i % 9) * ((signW - 16) / 8);
          return <Circle key={i} cx={x} cy={top ? fTop - 5 : fBot + 5} r={2.2} fill="#FFF3B0" stroke="#E0B000" strokeWidth={0.6} />;
        })}
      <SvgText x={fcx} y={(fTop + fBot) / 2 + 5.5} fontFamily={F.bold} fontSize={16} fill={text} stroke={signage === 0 ? '#3B1F14' : undefined} strokeWidth={signage === 0 ? 0.4 : 0} textAnchor="middle">
        {`Rosa’s · ${name}`}
      </SvgText>
    </G>
  );
});

/** The glazed door leaf, swung ~60° into the room; depth-sorted on its own so walkers pass it correctly. */
export const DoorLeaf = memo(function DoorLeaf({ lay }: { lay: Layout }) {
  // folded right back against the right wall, so it never hides anyone in the room
  const x = lay.door.x1 - 1.5;
  const q = (y: number, z: number) => P(x, y, z);
  return (
    <G>
      <Polygon points={pts([q(1, 0), q(30, 0), q(30, 104), q(1, 104)])} fill="#7E5038" stroke={INK} strokeWidth={1.2} />
      <Polygon points={pts([q(5, 10), q(26, 10), q(26, 94), q(5, 94)])} fill="rgba(191,227,245,0.5)" stroke={INK} strokeWidth={0.8} />
      <Path d={`M${q(8, 80).join(' ')} L${q(22, 40).join(' ')}`} stroke="#fff" strokeWidth={1.4} opacity={0.6} strokeLinecap="round" />
    </G>
  );
});

/** Sidewalk A-frame chalkboard (replaces the doormat walkers kept covering). */
export const ChalkSign = memo(function ChalkSign({ x, y, k = 1 }: { x: number; y: number; k?: number }) {
  const [px, py] = P(x, y);
  return (
    <G transform={`translate(${px} ${py})${k !== 1 ? ` scale(${k})` : ''}`}>
      <Ellipse cx={0} cy={0} rx={15} ry={3.4} fill="rgba(59,31,20,0.25)" />
      <Path d="M-11 0 L-7 -36 L7 -36 L11 0" fill="none" stroke="#8E5A3C" strokeWidth={3} strokeLinejoin="round" />
      <Path d="M-10 -1 L-6.6 -35 L6.6 -35 L10 -1 Z" fill="#8E5A3C" stroke={INK} strokeWidth={1.1} />
      <Path d="M-7.6 -4 L-5 -32 L5 -32 L7.6 -4 Z" fill="#2F3B33" />
      <SvgText x={0} y={-23} fontFamily={F.bold} fontSize={6} fill="#FFF4E0" textAnchor="middle">
        PIZZA
      </SvgText>
      <SvgText x={0} y={-16} fontFamily={F.bold} fontSize={4.6} fill="#FFC531" textAnchor="middle">
        BY THE
      </SvgText>
      <SvgText x={0} y={-10} fontFamily={F.bold} fontSize={6} fill="#FFF4E0" textAnchor="middle">
        SLICE
      </SvgText>
      <Path d="M-4.5 -7 q4.5 2 9 0" stroke="#F28B82" strokeWidth={0.8} fill="none" />
    </G>
  );
});

export const Doormat = memo(function Doormat({ lay }: { lay: Layout }) {
  // lying flat on the sidewalk at the threshold: a perspective trapezoid with fringe
  // people pause outside at DOOR_OUT_Y (−30), beyond the mat, so nobody stands on the lettering
  const a0 = P(lay.door.x0 + 2, -8);
  const a1 = P(lay.door.x1 - 2, -8);
  const b1 = P(lay.door.x1 + 1, -22);
  const b0 = P(lay.door.x0 - 1, -22);
  const cx = (a0[0] + a1[0] + b0[0] + b1[0]) / 4;
  const cy = a0[1] + (b0[1] - a0[1]) * 0.6;
  return (
    <G>
      <Polygon points={pts([a0, a1, b1, b0])} fill="#7A3520" stroke={INK} strokeWidth={0.9} />
      <Polygon points={pts([P(lay.door.x0 + 4, -10), P(lay.door.x1 - 4, -10), P(lay.door.x1 - 1, -20), P(lay.door.x0 + 1, -20)])} fill="none" stroke="#C8643E" strokeWidth={0.8} />
      {[a0, a1].map((pt, i) => <Path key={`f${i}`} d={`M${pt[0] + (i ? 1 : -1)} ${pt[1]} L${pt[0] + (i ? 2.2 : -2.2)} ${pt[1] + 1} M${pt[0] + (i ? 1.4 : -1.4)} ${pt[1] + 3} L${pt[0] + (i ? 2.8 : -2.8)} ${pt[1] + 4}`} stroke="#C8643E" strokeWidth={0.8} />)}
      {[b0, b1].map((pt, i) => <Path key={`g${i}`} d={`M${pt[0] + (i ? 1 : -1)} ${pt[1] - 2} L${pt[0] + (i ? 2.6 : -2.6)} ${pt[1] - 1} M${pt[0] + (i ? 1 : -1)} ${pt[1] - 5} L${pt[0] + (i ? 2.6 : -2.6)} ${pt[1] - 4}`} stroke="#C8643E" strokeWidth={0.8} />)}
      <G transform={`translate(${cx} ${cy + 1.6}) skewX(-18) scale(1 0.62)`}>
        <SvgText x={0} y={2.4} fontFamily={F.bold} fontSize={8} fill="#FFC531" textAnchor="middle">
          WELCOME
        </SvgText>
      </G>
    </G>
  );
});

export const Planter = memo(function Planter({ x, y }: { x: number; y: number }) {
  const [px, py] = P(x, y);
  return (
    <G transform={`translate(${px} ${py})`}>
      <Ellipse cx={0} cy={0} rx={16} ry={4} fill="rgba(59,31,20,0.25)" />
      <Rect x={-12} y={-18} width={24} height={18} rx={3} fill="#A8714B" stroke={INK} strokeWidth={1.1} />
      <Rect x={2} y={-17} width={8} height={16} rx={2} fill="#000" opacity={0.12} />
      <Rect x={-2} y={-36} width={4} height={18} fill="#7A4A26" />
      <Circle cx={0} cy={-42} r={13} fill="#4FA048" stroke={INK} strokeWidth={1.1} />
      <Circle cx={-4} cy={-46} r={5} fill="#7FD06A" />
    </G>
  );
});
