import { memo, type ReactElement } from 'react';
import type { NeighborhoodId } from '../../content/types';
import { F } from '../../theme';
import { Circle, Defs, Ellipse, G, LinearGradient, Path, Polygon, Rect, Stop, Text as SvgText } from 'react-native-svg';
import { INK, D, WH, FRONT_TOP, P, pts, shade } from './projection';
import type { Layout } from './layout';
import { LOOKS } from './identity';
import { hash32 } from './people';
import { SCENE_OVERLAYS, SceneSlots } from '../slots';

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
      <Polygon points={pts([P(L, 0), P(R, 0), P(R, D), P(L, D)])} fill={flooring === 0 ? LOOKS[id].floor : ['#E7D7BE', '#F4EFE6', '#C99A6B', '#E2D6C4'][flooring]} stroke={INK} strokeWidth={1.4} />
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
      {/* each neighbourhood's wall band, at every decor tier (v5.0): subway tile, beadboard, shiplap, panelling, ducts */}
      {(() => {
        const band = LOOKS[id].band;
        const top = 40;
        if (band === 'subway')
          return (
            <G>
              <Polygon points={pts([P(L, D, 0), P(R, D, 0), P(R, D, top), P(L, D, top)])} fill="#F4EFE6" />
              {Array.from({ length: 6 }).map((_, j) => (
                <Path key={`sr${j}`} d={`M${P(L, D, (j + 1) * (top / 6)).join(' ')} L${P(R, D, (j + 1) * (top / 6)).join(' ')}`} stroke="#D4C9B8" strokeWidth={0.7} />
              ))}
              {Array.from({ length: 6 }).map((_, j) =>
                Array.from({ length: Math.floor((R - L) / 12) }).map((__, i) => {
                  const x = L + i * 12 + (j % 2 ? 6 : 0);
                  return <Path key={`sc${j}-${i}`} d={`M${P(x, D, j * (top / 6)).join(' ')} L${P(x, D, (j + 1) * (top / 6)).join(' ')}`} stroke="#D4C9B8" strokeWidth={0.7} />;
                }),
              )}
              <Path d={`M${P(L, D, top).join(' ')} L${P(R, D, top).join(' ')}`} stroke="#B9AE9C" strokeWidth={1.4} />
            </G>
          );
        if (band === 'beadboard' || band === 'shiplap' || band === 'panelling') {
          const fill = band === 'beadboard' ? '#FFFFFF' : band === 'shiplap' ? '#E4F3FA' : '#6B4A36';
          const line = band === 'beadboard' ? '#E3EDE3' : band === 'shiplap' ? '#B9DCEC' : '#4E3426';
          const h = band === 'panelling' ? 50 : top;
          return (
            <G>
              <Polygon points={pts([P(L, D, 0), P(R, D, 0), P(R, D, h), P(L, D, h)])} fill={fill} />
              {band === 'shiplap'
                ? Array.from({ length: Math.floor(h / 8) }).map((_, j) => <Path key={j} d={`M${P(L, D, (j + 1) * 8).join(' ')} L${P(R, D, (j + 1) * 8).join(' ')}`} stroke={line} strokeWidth={1} />)
                : Array.from({ length: Math.floor((R - L) / (band === 'panelling' ? 22 : 6)) }).map((_, i) => {
                    const x = L + (i + 1) * (band === 'panelling' ? 22 : 6);
                    return <Path key={i} d={`M${P(x, D, 2).join(' ')} L${P(x, D, h - 2).join(' ')}`} stroke={line} strokeWidth={band === 'panelling' ? 1.4 : 0.8} />;
                  })}
              <Polygon points={pts([P(L, D, h), P(R, D, h), P(R, D, h + 3), P(L, D, h + 3)])} fill={band === 'panelling' ? '#8E6448' : '#E9DCC8'} stroke={INK} strokeWidth={0.5} />
            </G>
          );
        }
        if (band === 'ducts') {
          // exposed ductwork along the ceiling line, with clamps
          const [ax, ay] = P(L + 4, D, WH - 34);
          const [bx] = P(R - 4, D, WH - 34);
          return (
            <G>
              <Rect x={ax} y={ay} width={bx - ax} height={9} rx={4.5} fill="#B8C0C6" stroke={INK} strokeWidth={0.9} />
              <Rect x={ax + 2} y={ay + 1.5} width={bx - ax - 4} height={2} rx={1} fill="#fff" opacity={0.4} />
              {Array.from({ length: Math.floor((bx - ax) / 30) }).map((_, i) => (
                <Rect key={i} x={ax + 14 + i * 30} y={ay - 1} width={3} height={11} rx={1} fill="#8E979E" stroke={INK} strokeWidth={0.6} />
              ))}
            </G>
          );
        }
        return null;
      })()}
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
          <Circle cx={wx + 20} cy={wy + 24} r={19} fill="#C9A04A" stroke={INK} strokeWidth={1.2} />
          <Circle cx={wx + 20} cy={wy + 24} r={14} fill="#7CC8EE" stroke={INK} strokeWidth={1} />
          <Path d={`M${wx + 6} ${wy + 28} q7 -3 14 0 t14 0`} stroke="#D6F0FB" strokeWidth={1.6} fill="none" />
          <Path d={`M${wx + 12} ${wy + 15} A10 10 0 0 1 ${wx + 24} ${wy + 12}`} stroke="#fff" strokeWidth={1.6} opacity={0.6} fill="none" strokeLinecap="round" />
          {[0, 90, 180, 270].map((a) => <Circle key={a} cx={wx + 20 + Math.cos((a * Math.PI) / 180) * 16.5} cy={wy + 24 + Math.sin((a * Math.PI) / 180) * 16.5} r={1.2} fill="#8C6A20" />)}
          {/* fishing net gathered on a peg: fans to a sagging hem, uneven mesh, two cork floats */}
          {(() => {
            // under the porthole, clear of the menu board (D321: it used to cover the menu's last line)
            const ax = wx + 20;
            const ay = wy + 46;
            const hl = wx + 9;
            const hr = wx + 31;
            const hy = wy + 66;
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
        // each neighbourhood's own view out of the back window (D362)
        <G>
          <Rect x={wx} y={wy} width={40} height={36} rx={3} fill={id === 'industrial' ? '#F2D3AE' : '#BFE3F5'} stroke={INK} strokeWidth={1.2} />
          {id === 'downtown' && (
            // the city skyline
            <G>
              <Rect x={wx + 3} y={wy + 14} width={8} height={22} fill="#8FA7BF" />
              <Rect x={wx + 12} y={wy + 8} width={9} height={28} fill="#7C95AE" />
              <Rect x={wx + 23} y={wy + 17} width={7} height={19} fill="#93ABC2" />
              <Rect x={wx + 31} y={wy + 11} width={7} height={25} fill="#7C95AE" />
              {[0, 1, 2].map((j) => <Rect key={j} x={wx + 14} y={wy + 12 + j * 6} width={2} height={2} fill="#FFE9A8" />)}
            </G>
          )}
          {id === 'suburbs' && (
            // pitched rooftops and a tree
            <G>
              <Path d={`M${wx + 2} ${wy + 36} V${wy + 24} L${wx + 11} ${wy + 16} L${wx + 20} ${wy + 24} V${wy + 36} Z`} fill="#F7F3EA" />
              <Path d={`M${wx} ${wy + 25} L${wx + 11} ${wy + 15} L${wx + 22} ${wy + 25}`} stroke="#C0563A" strokeWidth={2.4} fill="none" />
              <Path d={`M${wx + 22} ${wy + 36} V${wy + 27} L${wx + 30} ${wy + 20} L${wx + 38} ${wy + 27} V${wy + 36} Z`} fill="#DDF2D2" />
              <Path d={`M${wx + 21} ${wy + 28} L${wx + 30} ${wy + 19} L${wx + 39} ${wy + 28}`} stroke="#8A5A3C" strokeWidth={2.2} fill="none" />
              <Circle cx={wx + 33} cy={wy + 31} r={4} fill="#4FA048" />
            </G>
          )}
          {id === 'university' && (
            // the campus spire
            <G>
              <Path d={`M${wx + 5} ${wy + 36} V${wy + 24} H${wx + 35} V${wy + 36} Z`} fill="#B98AD0" />
              <Rect x={wx + 16} y={wy + 14} width={8} height={12} fill="#A877C2" />
              <Path d={`M${wx + 15} ${wy + 14} L${wx + 20} ${wy + 3} L${wx + 25} ${wy + 14} Z`} fill="#8E5BAA" />
              <Circle cx={wx + 20} cy={wy + 19} r={2.2} fill="#FFF4D6" />
            </G>
          )}
          {id === 'industrial' && (
            // a smokestack in a warm haze
            <G>
              <Rect x={wx + 4} y={wy + 26} width={32} height={10} fill="#8E979E" />
              <Rect x={wx + 22} y={wy + 8} width={6} height={20} fill="#6E757B" />
              <Rect x={wx + 22} y={wy + 12} width={6} height={2} fill="#C0392B" />
              <Circle cx={wx + 27} cy={wy + 5} r={4} fill="#E6E1DA" />
              <Circle cx={wx + 32} cy={wy + 3} r={3} fill="#EEEAE4" />
            </G>
          )}
          <Path d={`M${wx + 20} ${wy} V${wy + 36} M${wx} ${wy + 18} H${wx + 40}`} stroke="#fff" strokeWidth={2} />
          <Rect x={wx - 2} y={wy + 34} width={44} height={4} fill="#8E5A3C" stroke={INK} strokeWidth={0.8} />
        </G>
      )}
    </G>
  );
});

// the street face lives in facade.tsx; re-exported so the storefront's import is unchanged
export { ChalkSign, DoorLeaf, Doormat, FrontWall, Planter, StreetProp } from './facade';

// ---------- scene overlays (the SCENE_OVERLAYS slot) ----------
/**
 * Where new features draw inside the shop scene: above the floor and furniture, below the HUD. The storefront mounts it once
 * over the scene (an absolute-fill layer is the overlay's own job). With no entries it renders nothing and adds no view.
 */
export const SceneOverlays = memo(function SceneOverlays({ shopId, width, height }: { shopId: string; width: number; height: number }) {
  return <SceneSlots items={SCENE_OVERLAYS} shopId={shopId} width={width} height={height} />;
});
