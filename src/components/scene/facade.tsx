// The street face of the shop (moved out of room.tsx in v5.14 K0b): the front wall, the door leaf, the chalk board, the WELCOME mat,
// the planter and each neighbourhood's street prop. Every part is memoised on its own props; storefront.tsx imports them via room.tsx.
import { memo } from 'react';
import type { NeighborhoodId } from '../../content/types';
import { F } from '../../theme';
import { Circle, Ellipse, G, Path, Polygon, Rect, Text as SvgText } from 'react-native-svg';
import { INK, SCENE_W, FRONT_TOP, P, pts } from './projection';
import type { Layout } from './layout';
import { GoldPlaque } from './cosmetic-props';
import { dressedLook, plaqueRect } from './cosmetics';
import { LOOKS } from './identity';
import { doorwaySignRect } from './stations';
import { Sidewalk } from './street';
import { PICKET } from './street-props';

/**
 * The street face of the shop: brick pilasters at both corners, a fascia beam across the top
 * carrying the sign, a full-width scalloped awning, the brick sill and the entrance on the right.
 */
export const FrontWall = memo(function FrontWall({ lay, name, signage, plants, id, facadeSkin = 0, awningGold = false, plaque = false }: { lay: Layout; name: string; signage: number; plants: number; id: NeighborhoodId; /** Worn cosmetics (cosmetics.ts): the storefront skin's 1-based number (0: none), the gold awning, the master's plaque. */ facadeSkin?: number; awningGold?: boolean; plaque?: boolean }) {
  const { L, R, door } = lay;
  const look = dressedLook(LOOKS[id], { facadeSkin, awningGold });
  const sill = (x0: number, x1: number) => {
    const [ax, ay] = P(x0, 0);
    const [bx] = P(x1, 0);
    return (
      <G key={x0}>
        <Rect x={ax} y={ay - 7} width={bx - ax} height={13} rx={2} fill={look.pilaster} stroke={INK} strokeWidth={1.2} />
        <Rect x={ax + 1} y={ay - 6} width={bx - ax - 2} height={4} fill="#fff" opacity={0.15} />
        {Array.from({ length: Math.floor((bx - ax) / 20) }).map((_, i) => (
          <Path key={i} d={`M${ax + 10 + i * 20} ${ay - 7} V${ay + 6}`} stroke={look.seam} strokeWidth={1} />
        ))}
      </G>
    );
  };
  // the corner pilasters carry most of each neighbourhood's look (v5.0): brick, clapboard, planks, collegiate brick
  // with limestone quoins, corrugated steel or green tile with brass caps
  const pilaster = (x0: number, x1: number, inner: 'l' | 'r') => {
    const [ax, ay] = P(x0, 0, 0);
    const [bx, ty] = P(x1, 0, FRONT_TOP);
    const w = bx - ax;
    const h = ay - ty;
    const rows = Math.floor(h / 9);
    const f = look.facade;
    return (
      <G key={x0}>
        <Rect x={ax} y={ty} width={w} height={h + 6} fill={look.pilaster} stroke={INK} strokeWidth={1.3} />
        {(f === 'brick' || f === 'collegiate') &&
          Array.from({ length: rows }).map((_, i) => (
            <G key={i}>
              <Path d={`M${ax} ${ty + 9 * (i + 1)} H${bx}`} stroke={look.seam} strokeWidth={0.8} />
              <Path d={`M${ax + w * (i % 2 ? 0.33 : 0.66)} ${ty + 9 * i} v9`} stroke={look.seam} strokeWidth={0.8} />
            </G>
          ))}
        {/* limestone quoins: pale blocks alternating on the outer corner */}
        {f === 'collegiate' &&
          Array.from({ length: Math.floor(rows / 2) }).map((_, i) => (
            <Rect key={`q${i}`} x={inner === 'l' ? ax : bx - w * (i % 2 ? 0.45 : 0.7)} y={ty + 18 * i + 1} width={w * (i % 2 ? 0.45 : 0.7)} height={8} fill="#E8E0CC" stroke={look.seam} strokeWidth={0.6} />
          ))}
        {/* clapboard: overlapping horizontal boards */}
        {f === 'clapboard' && Array.from({ length: Math.floor(h / 6) }).map((_, i) => <Path key={i} d={`M${ax} ${ty + 6 * (i + 1)} H${bx}`} stroke={look.seam} strokeWidth={1} />)}
        {/* weathered planks, vertical seams, and a rope trim up each edge */}
        {f === 'planks' && (
          <G>
            {[0.33, 0.66].map((t) => <Path key={t} d={`M${ax + w * t} ${ty} V${ay + 6}`} stroke={look.seam} strokeWidth={1} />)}
            {[ax + 1.5, bx - 1.5].map((rx) => (
              <Path key={rx} d={`M${rx} ${ty} V${ay + 4}`} stroke="#C99A6B" strokeWidth={2.4} strokeDasharray="3 2" />
            ))}
          </G>
        )}
        {/* corrugated steel: vertical ribs, lit and shaded */}
        {f === 'steel' &&
          Array.from({ length: Math.max(2, Math.floor(w / 4)) }).map((_, i) => (
            <G key={i}>
              <Path d={`M${ax + 2 + i * 4} ${ty} V${ay + 6}`} stroke="#A9B1B7" strokeWidth={1.2} />
              <Path d={`M${ax + 3.4 + i * 4} ${ty} V${ay + 6}`} stroke={look.seam} strokeWidth={0.8} />
            </G>
          ))}
        {/* green tile: a fine grid */}
        {f === 'tile' && (
          <G>
            {Array.from({ length: Math.floor(h / 7) }).map((_, i) => <Path key={`h${i}`} d={`M${ax} ${ty + 7 * (i + 1)} H${bx}`} stroke={look.seam} strokeWidth={0.7} />)}
            <Path d={`M${ax + w / 2} ${ty} V${ay + 6}`} stroke={look.seam} strokeWidth={0.7} />
            <Rect x={ax - 2} y={ty} width={w + 4} height={5} rx={1} fill="#D4A84A" stroke={INK} strokeWidth={0.9} />
          </G>
        )}
        <Rect x={inner === 'l' ? bx - 3.5 : ax} y={ty} width={3.5} height={h + 6} fill="#000" opacity={0.18} />
        <Rect x={inner === 'l' ? ax + 1.5 : bx - 4} y={ty} width={2.5} height={h + 6} fill="#fff" opacity={0.16} />
        <Rect x={ax - 2} y={ay - 2} width={w + 4} height={8} rx={1.5} fill={look.plinth} stroke={INK} strokeWidth={1} />
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
        const sign = doorwaySignRect(lay);
        const [, gTop] = P(0, 0, 196);
        const [, bTop] = P(0, 0, FRONT_TOP - 20);
        const brick = (x0: number, x1: number, top: number, bot: number) => (
          <G>
            <Rect x={x0} y={top} width={x1 - x0} height={bot - top} fill={look.pilaster} stroke={INK} strokeWidth={1.1} />
            {Array.from({ length: Math.floor((bot - top) / 8) }).map((_, i) => (
              <Path key={i} d={`M${x0} ${top + 8 * (i + 1)} H${x1}`} stroke={look.seam} strokeWidth={0.7} />
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
            <Rect x={jax - 1} y={gTop - 1} width={kbx - jax + 2} height={4} rx={1} fill={look.plinth} stroke={INK} strokeWidth={0.9} />
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
            {/* C91: the plank is drawn from the rect the crowd budget (D377) guards */}
            <Rect x={sign.x0} y={sign.y0 + 1} width={sign.x1 - sign.x0} height={sign.y1 - sign.y0 - 1} fill="#3B1F14" opacity={0.85} />
            <SvgText x={(sign.x0 + sign.x1) / 2} y={sign.y1 - 2.4} fontFamily={F.bold} fontSize={6.5} fill="#E0B000" textAnchor="middle" letterSpacing={1}>
              PIZZERIA
            </SvgText>
            {/* jambs + lintel */}
            {/* the doorway's left side is a slim wooden post, so people walking in aren't hidden behind brick */}
            <Rect x={jbx - 3.2} y={lTop} width={3.2} height={jay + 6 - lTop} fill="#6B4330" stroke={INK} strokeWidth={0.9} />
            <Rect x={jax} y={jay - 2} width={jbx - 3.2 - jax} height={8} fill={look.pilaster} stroke={INK} strokeWidth={0.9} />
            {brick(P(door.x1, 0)[0], kbx, lTop, jay + 6)}
            {brick(jax, kbx, lTop, lBot)}
            <Rect x={jax - 1} y={lTop - 3} width={kbx - jax + 2} height={4} rx={1} fill={look.plinth} stroke={INK} strokeWidth={0.9} />
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
      {/* the master's plaque: brass on the right pilaster, by the door (cosmetics.ts `plaqueRect`) */}
      {plaque && (() => {
        const r = plaqueRect(lay);
        return (
          <G transform={`translate(${(r.x0 + r.x1) / 2} ${(r.y0 + r.y1) / 2})`}>
            <GoldPlaque />
          </G>
        );
      })()}
      {/* awning under the fascia: each neighbourhood's colours and shape; red stays as the first stripe or the piping */}
      {(() => {
        const [c0, c1] = look.awning;
        const drop = look.shape === 'box' ? 16 : look.shape === 'dome' ? 15 : 13;
        const bulge = look.shape === 'dome' ? 5 : 0;
        return (
          <G>
            <Path d={`M${fx0} ${fBot} L${fx1} ${fBot} L${fx1 + 6} ${fBot + drop} L${fx0 - 6} ${fBot + drop} Z`} fill={c1} stroke={INK} strokeWidth={1.1} />
            {Array.from({ length: n }).map((_, i) => {
              const xa = fx0 - 6 + i * aw;
              const ta = fx0 + (i * (fx1 - fx0)) / n;
              const tb = fx0 + ((i + 1) * (fx1 - fx0)) / n;
              // a dome awning bows out in the middle
              const mid = bulge * Math.sin(((i + 0.5) / n) * Math.PI);
              return (
                <G key={i}>
                  {i % 2 === 0 && <Path d={`M${ta} ${fBot} L${tb} ${fBot} L${xa + aw} ${fBot + drop + mid} L${xa} ${fBot + drop + mid} Z`} fill={c0} />}
                  {look.shape === 'scallop' || look.shape === 'dome' ? (
                    <Path d={`M${xa} ${fBot + drop + mid} q${aw / 2} ${aw * 0.5} ${aw} 0`} fill={i % 2 === 0 ? c0 : c1} stroke={INK} strokeWidth={1} />
                  ) : (
                    // straight and box awnings end in a flat valance
                    <Rect x={xa} y={fBot + drop} width={aw} height={look.shape === 'box' ? 6 : 4} fill={i % 2 === 0 ? c0 : c1} stroke={INK} strokeWidth={0.8} />
                  )}
                </G>
              );
            })}
            <Path d={`M${fx0 - 6} ${fBot + drop} H${fx1 + 6}`} stroke={look.piping ?? INK} strokeWidth={look.piping ? 2.4 : 1.1} />
            {look.piping && <Path d={`M${fx0 - 6} ${fBot + drop - 1.4} H${fx1 + 6}`} stroke={INK} strokeWidth={0.6} opacity={0.6} />}
          </G>
        );
      })()}
      <Rect x={fx0} y={fBot} width={fx1 - fx0} height={3} fill="#000" opacity={0.15} />
      {/* fascia beam */}
      <Rect x={fx0} y={fTop} width={fx1 - fx0} height={fBot - fTop} fill={look.fascia} stroke={INK} strokeWidth={1.4} />
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

/** Each neighbourhood's sidewalk signature (v5.0): drawn standing at screen point (x, y), ~26 units tall. */
export const StreetProp = memo(function StreetProp({ id, x, y }: { id: NeighborhoodId; x: number; y: number }) {
  const kind = LOOKS[id].street;
  return (
    <G transform={`translate(${x} ${y})`}>
      <Ellipse cx={0} cy={1} rx={13} ry={3} fill="#000" opacity={0.15} />
      {kind === 'newsbox' && (
        // a blue newspaper box on legs
        <G>
          <Rect x={-7} y={-6} width={2} height={7} fill="#2B5E86" />
          <Rect x={5} y={-6} width={2} height={7} fill="#2B5E86" />
          <Rect x={-9} y={-27} width={18} height={22} rx={2} fill="#3F7FB0" stroke={INK} strokeWidth={1.1} />
          <Rect x={-6} y={-24} width={12} height={8} rx={1} fill="#DCEBF5" stroke={INK} strokeWidth={0.7} />
          <Rect x={-4} y={-22} width={8} height={1.4} fill="#7A8A96" />
          <Rect x={-4} y={-19.5} width={6} height={1.4} fill="#7A8A96" />
          <Rect x={-9} y={-28.5} width={18} height={3} rx={1.5} fill="#2B5E86" stroke={INK} strokeWidth={0.8} />
        </G>
      )}
      {kind === 'picket' && (
        // a fenced front yard (D432): a lawn strip wider than the fence, the shrubs planted in it behind the pickets, a capped post at each end
        <G>
          <Rect x={PICKET.bed.x0} y={PICKET.bed.y0} width={PICKET.bed.x1 - PICKET.bed.x0} height={PICKET.bed.y1 - PICKET.bed.y0} rx={3} fill="#6FA85A" stroke={INK} strokeWidth={0.9} />
          <Rect x={PICKET.bed.x0 + 3} y={PICKET.bed.y0 + 1.2} width={PICKET.bed.x1 - PICKET.bed.x0 - 6} height={1.6} rx={0.8} fill="#8CC36F" opacity={0.8} />
          <Rect x={PICKET.bed.x0 + 3} y={PICKET.bed.y1 - 3} width={PICKET.bed.x1 - PICKET.bed.x0 - 6} height={1.4} rx={0.7} fill="#4F7F3F" opacity={0.7} />
          {PICKET.shrubs.map((b) => (
            <G key={b.cx}>
              <Circle cx={b.cx} cy={b.cy} r={b.r} fill="#2E7D32" stroke={INK} strokeWidth={0.8} />
              <Circle cx={b.cx - b.r * 0.35} cy={b.cy - b.r * 0.4} r={b.r * 0.38} fill="#58B35D" opacity={0.8} />
            </G>
          ))}
          <Rect x={PICKET.posts[0]} y={-15} width={PICKET.posts[1] - PICKET.posts[0]} height={2.6} fill="#FFFFFF" stroke={INK} strokeWidth={0.7} />
          <Rect x={PICKET.posts[0]} y={-7} width={PICKET.posts[1] - PICKET.posts[0]} height={2.6} fill="#FFFFFF" stroke={INK} strokeWidth={0.7} />
          {PICKET.pickets.map((px) => (
            <Path key={px} d={`M${px - 2} 0 V-17 L${px} -20 L${px + 2} -17 V0 Z`} fill="#FFFFFF" stroke={INK} strokeWidth={0.8} />
          ))}
          {PICKET.posts.map((px) => (
            <G key={`post${px}`}>
              <Rect x={px - PICKET.postW / 2} y={-20} width={PICKET.postW} height={21} rx={0.8} fill="#F4EEE4" stroke={INK} strokeWidth={0.9} />
              <Rect x={px - PICKET.postW / 2 - 0.8} y={-22} width={PICKET.postW + 1.6} height={3} rx={1} fill="#FFFFFF" stroke={INK} strokeWidth={0.8} />
            </G>
          ))}
        </G>
      )}
      {kind === 'bollard' && (
        // a dock bollard with coiled rope
        <G>
          <Path d="M-7 0 V-14 Q-7 -20 0 -20 Q7 -20 7 -14 V0 Z" fill="#3A3F44" stroke={INK} strokeWidth={1.1} />
          <Rect x={-9} y={-18} width={18} height={4} rx={2} fill="#4A5056" stroke={INK} strokeWidth={0.9} />
          <Ellipse cx={-13} cy={-3} rx={7} ry={3.4} fill="none" stroke="#C99A6B" strokeWidth={2.4} />
          <Ellipse cx={-13} cy={-5} rx={5} ry={2.4} fill="none" stroke="#B5844F" strokeWidth={2} />
          <Path d="M-7 -12 Q-10 -9 -12 -6" stroke="#C99A6B" strokeWidth={2.2} fill="none" />
        </G>
      )}
      {kind === 'bikerack' && (
        // two bikes in profile, 44 apart (a bike is ~24 long, so they no longer overlap), each leaning on its own #5A5A5A hoop with its own contact shadow (D363)
        <G>
          {[[-22, '#6A2C9A'], [22, '#E0A800']].map(([bx, col]) => (
            <G key={bx as number} transform={`translate(${bx} 0)`}>
              <Ellipse cx={0} cy={0.5} rx={10} ry={2} fill="#000" opacity={0.2} />
              <Path d="M-5 0 V-12 Q-5 -17 0 -17 Q5 -17 5 -12 V0" stroke="#5A5A5A" strokeWidth={2} fill="none" />
              <G transform="scale(0.75)">
                <Circle cx={-8} cy={-7} r={6.5} fill="none" stroke={INK} strokeWidth={1.5} />
                <Circle cx={8} cy={-7} r={6.5} fill="none" stroke={INK} strokeWidth={1.5} />
                <Circle cx={-8} cy={-7} r={1} fill={INK} />
                <Circle cx={8} cy={-7} r={1} fill={INK} />
                <Path d="M-8 -7 L-2 -16 L6 -16 L8 -7 L-1 -7 Z M-2 -16 L-1 -7" stroke={col as string} strokeWidth={2} fill="none" strokeLinejoin="round" />
                <Path d="M-4 -19 H0 M6 -16 L7 -20 L10 -20" stroke={INK} strokeWidth={1.6} strokeLinecap="round" fill="none" />
              </G>
            </G>
          ))}
        </G>
      )}
      {kind === 'barrel' && (
        // a steel barrel and a traffic cone
        <G>
          <Rect x={-13} y={-22} width={15} height={22} rx={3} fill="#3A6E8C" stroke={INK} strokeWidth={1.1} />
          <Rect x={-13} y={-16} width={15} height={2} fill="#2A5068" />
          <Rect x={-13} y={-7} width={15} height={2} fill="#2A5068" />
          <Ellipse cx={-5.5} cy={-22} rx={7.5} ry={2} fill="#4A86A8" stroke={INK} strokeWidth={0.8} />
          <Path d="M6 0 L9.5 -16 L13 0 Z" fill="#E8742A" stroke={INK} strokeWidth={1} strokeLinejoin="round" />
          <Path d="M7.4 -7 L11.6 -7 L11 -10 L8 -10 Z" fill="#fff" />
          <Rect x={4} y={-1.5} width={11} height={2} rx={1} fill="#C85E1E" stroke={INK} strokeWidth={0.6} />
        </G>
      )}
      {kind === 'topiary' && (
        // a clipped topiary ball in a planter, and a brass rope post
        <G>
          <Rect x={-14} y={-8} width={12} height={8} rx={1.5} fill="#F4F1EC" stroke={INK} strokeWidth={0.9} />
          <Rect x={-9} y={-13} width={2} height={5} fill="#6B4330" />
          <Circle cx={-8} cy={-19} r={7.5} fill="#3F8F4A" stroke={INK} strokeWidth={1} />
          <Circle cx={-10} cy={-21} r={2.2} fill="#5DB36A" opacity={0.8} />
          {[6, 26].map((px) => (
            <G key={px}>
              <Rect x={px} y={-18} width={2.6} height={18} fill="#D4A84A" stroke={INK} strokeWidth={0.7} />
              <Circle cx={px + 1.3} cy={-19} r={2.6} fill="#D4A84A" stroke={INK} strokeWidth={0.7} />
            </G>
          ))}
          <Path d="M7.3 -14 Q17 -5 27.3 -14" stroke="#B5203A" strokeWidth={2.2} fill="none" strokeLinecap="round" />
        </G>
      )}
    </G>
  );
});
