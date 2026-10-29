import { OVEN_GRADES } from '../../content/tuning';
import type { NeighborhoodId } from '../../content/types';
import { Circle, Ellipse, G, Path, Rect } from 'react-native-svg';
import { INK, D, WH, P, kAt, shade } from './projection';
import { type Layout, SEAT } from './layout';
import { Box, FloorShadow } from './primitives';

/**
 * An oven against the back wall. Single-deck ovens are domed pizza ovens on a brick plinth
 * with an arched mouth and keystone; stacked decks and the Stone grade are box deck ovens, so grades
 * differ in silhouette as well as finish.
 */
export function Oven({ o, grade, lit, flicker }: { o: Layout['ovens'][number]; grade: number; lit: boolean; flicker: number }) {
  const y = D - 6;
  const [ax, ay] = P(o.x0, y, o.z);
  const [bx] = P(o.x1, y, o.z);
  const w = bx - ax;
  const cx = (ax + bx) / 2;
  const k = kAt(y);
  const h = o.h * k;
  const top = ay - h;
  const base = OVEN_GRADES[grade].color;
  const dark = shade(base, -0.4);
  const fire = lit ? 'url(#ember)' : '#24120A';
  const flame = (mx: number, my: number, mw: number, mh: number) =>
    lit ? (
      <G>
        <Ellipse cx={mx} cy={my - mh * 0.35} rx={mw * 0.5} ry={mh * 0.5} fill="#FFD166" opacity={0.35} />
        <Path d={`M${mx - mw * 0.38} ${my} L${mx - mw * 0.22} ${my - mh * 0.55 - flicker} L${mx - mw * 0.06} ${my - mh * 0.3} L${mx + mw * 0.06} ${my - mh * 0.78 + flicker} L${mx + mw * 0.2} ${my - mh * 0.32} L${mx + mw * 0.32} ${my - mh * 0.55} L${mx + mw * 0.38} ${my} Z`} fill="#FFE08A" opacity={0.9} />
      </G>
    ) : null;
  const box = o.h < 70 || grade === 1;
  if (box) {
    const legs = o.z === 0 ? 10 * k : 0;
    const bTop = top;
    const bBot = ay - legs;
    const bh = bBot - bTop;
    const dw = w * 0.74;
    const dh = bh * 0.42;
    const dy = bTop + bh * 0.4;
    return (
      <G>
        {legs > 0 && [0.12, 0.88].map((f) => <Rect key={f} x={ax + w * f - 2} y={bBot - 1} width={4} height={legs + 1} fill="#4A4F57" stroke={INK} strokeWidth={0.8} />)}
        <Rect x={ax + 3} y={bTop + 3} width={w} height={bh} rx={5} fill={dark} />
        <Rect x={ax} y={bTop} width={w} height={bh} rx={5} fill={`url(#oven${grade})`} stroke={INK} strokeWidth={1.3} />
        <Rect x={ax + 3} y={bTop + 3} width={w - 6} height={bh * 0.18} rx={3} fill="#fff" opacity={0.22} />
        {/* door with a glowing window and a handle bar */}
        <Rect x={cx - dw / 2} y={dy} width={dw} height={dh} rx={3} fill={shade(base, -0.25)} stroke={INK} strokeWidth={1} />
        <Rect x={cx - dw / 2 + 3} y={dy + 3} width={dw - 6} height={dh - 6} rx={2} fill={fire} />
        {flame(cx, dy + dh - 3, dw - 6, dh - 6)}
        <Rect x={cx - dw * 0.3} y={dy - 5} width={dw * 0.6} height={3.4} rx={1.7} fill="#E9E4DC" stroke={INK} strokeWidth={0.8} />
        <Circle cx={ax + w - 6} cy={bTop + bh * 0.22} r={2.2} fill={lit ? '#7FE0A0' : '#9A958E'} stroke={INK} strokeWidth={0.6} />
        {grade >= 4 && <Path d={`M${ax + 4} ${bTop + 2} H${bx - 4}`} stroke="#FFF3B0" strokeWidth={1.6} />}
      </G>
    );
  }
  // domed oven on a brick plinth
  const plinth = 12 * k;
  const pTop = ay - plinth;
  const ry = Math.min(w * 0.5, (pTop - top) * 0.78);
  const shoulder = top + ry;
  const mw = w * 0.56;
  const mh = Math.min((pTop - top) * 0.5, mw * 0.9);
  const mTop = pTop - mh;
  const dome = (dx: number) => `M${ax + dx} ${pTop} L${ax + dx} ${shoulder} A${w / 2} ${ry} 0 0 1 ${bx + dx} ${shoulder} L${bx + dx} ${pTop} Z`;
  return (
    <G>
      {o.chimney && (
        <G>
          <Rect x={cx - w * 0.09} y={top - 16 * k} width={w * 0.18} height={20 * k} fill={grade >= 3 ? shade(base, -0.1) : '#8C7B6A'} stroke={INK} strokeWidth={1} />
          <Rect x={cx - w * 0.12} y={top - 19 * k} width={w * 0.24} height={4 * k} rx={1} fill={grade >= 3 ? shade(base, -0.25) : '#6E5F51'} stroke={INK} strokeWidth={0.8} />
        </G>
      )}
      <Path d={dome(3)} fill={dark} />
      <Path d={dome(0)} fill={`url(#oven${grade})`} stroke={INK} strokeWidth={1.3} />
      {/* brick courses on brick/wood-fired domes, rivet band on copper/gold */}
      {grade === 0 || grade === 2
        ? [0.3, 0.55].map((f) => <Path key={f} d={`M${ax + 2} ${pTop - (pTop - top) * f} Q${cx} ${pTop - (pTop - top) * f - 4} ${bx - 2} ${pTop - (pTop - top) * f}`} stroke={dark} strokeWidth={0.9} fill="none" opacity={0.55} />)
        : (
          <G>
            <Path d={`M${ax + 1} ${shoulder + 4} H${bx - 1}`} stroke={shade(base, -0.3)} strokeWidth={3} />
            {Array.from({ length: 5 }).map((_, i) => <Circle key={i} cx={ax + w * (0.14 + i * 0.18)} cy={shoulder + 4} r={1.1} fill={shade(base, 0.5)} />)}
          </G>
        )}
      <Path d={`M${ax + w * 0.18} ${shoulder} A${w * 0.34} ${ry * 0.72} 0 0 1 ${cx + w * 0.06} ${top + ry * 0.22}`} stroke="#fff" strokeWidth={2.4} fill="none" opacity={0.4} strokeLinecap="round" />
      {/* arched mouth with a brick ring and keystone */}
      <Path d={`M${cx - mw / 2 - 3} ${pTop} L${cx - mw / 2 - 3} ${mTop + mw * 0.3} A${mw / 2 + 3} ${mw * 0.34} 0 0 1 ${cx + mw / 2 + 3} ${mTop + mw * 0.3} L${cx + mw / 2 + 3} ${pTop} Z`} fill={shade(base, -0.3)} stroke={INK} strokeWidth={1} />
      <Path d={`M${cx - mw / 2} ${pTop} L${cx - mw / 2} ${mTop + mw * 0.3} A${mw / 2} ${mw * 0.3} 0 0 1 ${cx + mw / 2} ${mTop + mw * 0.3} L${cx + mw / 2} ${pTop} Z`} fill={fire} />
      {flame(cx, pTop - 1, mw, mh)}
      <Path d={`M${cx - 3.5} ${mTop - 2} L${cx + 3.5} ${mTop - 2} L${cx + 2.5} ${mTop + 5} L${cx - 2.5} ${mTop + 5} Z`} fill={grade >= 3 ? '#FFF3B0' : '#E9C9A0'} stroke={INK} strokeWidth={0.8} />
      {/* plinth */}
      <Rect x={ax - 3} y={pTop} width={w + 6} height={plinth} rx={1.5} fill="#A24B2C" stroke={INK} strokeWidth={1.1} />
      <Path d={`M${ax - 3} ${pTop + plinth / 2} H${bx + 3}`} stroke="#7A3520" strokeWidth={0.8} />
      {Array.from({ length: Math.max(2, Math.floor((w + 6) / 12)) }).map((_, i) => (
        <Path key={i} d={`M${ax + 3 + i * 12 + (i % 2) * 6} ${pTop} v${plinth / 2} M${ax + 9 + i * 12} ${pTop + plinth / 2} v${plinth / 2}`} stroke="#7A3520" strokeWidth={0.8} />
      ))}
      {grade === 2 && (
        <G>
          {[0, 1, 2].map((i) => <Circle key={i} cx={bx + 4 + (i % 2) * 5} cy={ay - 3 - Math.floor(i / 2) * 5} r={2.8} fill="#9C6B3F" stroke={INK} strokeWidth={0.7} />)}
        </G>
      )}
      {grade >= 4 && (
        <G>
          <Path d={`M${ax + 4} ${shoulder - 2} A${w / 2 - 4} ${ry - 4} 0 0 1 ${bx - 4} ${shoulder - 2}`} stroke="#FFF3B0" strokeWidth={1.4} fill="none" />
          <Path d={`M${cx + w * 0.3} ${top + ry * 0.4} l2 -5 l2 5 l5 2 l-5 2 l-2 5 l-2 -5 l-5 -2 Z`} fill="#FFFBE0" />
        </G>
      )}
    </G>
  );
}

/** One stainless hood + flue over a bank of box deck ovens. */
export function OvenHood({ lay, grade, mural }: { lay: Layout; grade: number; mural: boolean }) {
  const boxes = lay.ovens.filter((o) => o.h < 70 || grade === 1);
  if (!boxes.length) return null;
  const top = Math.max(...boxes.map((o) => o.z + o.h));
  const x0 = lay.ovenCols[0].x0 - 6;
  const x1 = lay.ovenCols[lay.ovenCols.length - 1].x1 + 6;
  const y = D - 6;
  const [ax, ay] = P(x0, y, top + 6);
  const [bx, by] = P(x1, y, top + 22);
  const [cx] = P((x0 + x1) / 2, y);
  const [, fyFull] = P(0, D, WH - 24);
  const fy = mural ? by - 12 : fyFull;
  const fw = Math.min(26, (bx - ax) * 0.22);
  return (
    <G>
      <Rect x={cx - fw / 2} y={fy} width={fw} height={by - fy} fill="#BFC4CA" stroke={INK} strokeWidth={1} />
      <Rect x={cx - fw / 2 + 2} y={fy} width={fw * 0.3} height={by - fy} fill="#fff" opacity={0.35} />
      {mural && <Rect x={cx - fw / 2 - 3} y={fy - 4} width={fw + 6} height={5} rx={1.5} fill="#9AA1A8" stroke={INK} strokeWidth={0.9} />}
      <Path d={`M${ax + 8} ${by} L${bx - 8} ${by} L${bx} ${ay} L${ax} ${ay} Z`} fill="#C9CED4" stroke={INK} strokeWidth={1.2} strokeLinejoin="round" />
      <Path d={`M${ax + 10} ${by + 3} L${bx - 10} ${by + 3}`} stroke="#fff" strokeWidth={2} opacity={0.6} />
      <Rect x={ax - 1} y={ay - 2} width={bx - ax + 2} height={4} rx={1.5} fill="#9AA1A8" stroke={INK} strokeWidth={0.8} />
    </G>
  );
}


export const TABLE_STYLE = [
  { top: '#FFFFFF', rim: '#E0DAD2', chair: '#C89B6D', chairDark: '#8E5A3C', leg: '#9A958E' }, // plain wood
  { top: '#FFFFFF', rim: '#D9443A', chair: '#D9443A', chairDark: '#B23A30', leg: INK }, // checked tablecloth
  { top: '#C99A6B', rim: '#8E5A3C', chair: '#7A4A26', chairDark: '#5E3A26', leg: '#5E3A26' }, // wooden bistro
  { top: '#F4F1EC', rim: '#D4AF37', chair: '#7B1E3A', chairDark: '#5A1229', leg: '#D4AF37' }, // marble & candles
];

/**
 * A dining table in two layers so diners really sit: `back` is the floor shadow and both
 * chairs (back rest on the outer side + seat); `front` is the table itself, drawn over the diners' laps.
 */
export function Table({ x, y, tier, part }: { x: number; y: number; tier: number; part: 'back' | 'front' }) {
  const st = TABLE_STYLE[tier];
  const [cx, cy] = P(x, y);
  const k = kAt(y) * 1.1;
  const chair = (dx: number) => {
    const [px, py] = P(x + dx, y);
    const out = dx < 0 ? -1 : 1;
    return (
      <G key={dx} transform={`translate(${px} ${py}) scale(${k})`}>
        <Ellipse cx={0} cy={0} rx={8} ry={2.2} fill="rgba(59,31,20,0.18)" />
        {/* legs: two front, two back (the back pair under the backrest) */}
        {[-6, 6].map((lx) => <Rect key={lx} x={lx - 1} y={-4} width={2} height={4} rx={0.6} fill={st.chairDark} stroke={INK} strokeWidth={0.6} />)}
        {/* backrest rising from the seat's rear edge: two posts, top rail and a slat */}
        {(() => {
          const x0 = out < 0 ? -7.5 : 1.5;
          return (
            <G>
              <Rect x={x0} y={-25} width={1.8} height={19} rx={0.8} fill={st.chairDark} stroke={INK} strokeWidth={0.7} />
              <Rect x={x0 + 4.2} y={-25} width={1.8} height={19} rx={0.8} fill={st.chairDark} stroke={INK} strokeWidth={0.7} />
              <Rect x={x0 - 0.4} y={-26} width={6.8} height={5} rx={1.8} fill={st.chair} stroke={INK} strokeWidth={1.1} />
              <Rect x={x0 + 0.3} y={-25.4} width={5.4} height={1.3} rx={0.6} fill="#fff" opacity={0.3} />
              <Rect x={x0 + 0.2} y={-17} width={5.6} height={2.4} rx={1} fill={st.chair} stroke={INK} strokeWidth={0.8} />
            </G>
          );
        })()}
        <Rect x={-7.5} y={-6.4} width={15} height={3.8} rx={1.6} fill={st.chair} stroke={INK} strokeWidth={1.2} />
        <Rect x={-7.5} y={-3.8} width={15} height={1.2} rx={0.6} fill={st.chairDark} />
        <Rect x={-6.5} y={-6} width={13} height={1.1} rx={0.5} fill="#fff" opacity={0.3} />
      </G>
    );
  };
  if (part === 'back') {
    return (
      <G>
        <FloorShadow x={x} y={y} r={18} />
        {chair(-SEAT)}
        {chair(SEAT)}
      </G>
    );
  }
  return (
    <G>
      <G transform={`translate(${cx} ${cy}) scale(${k})`}>
        <Rect x={-1.6} y={-14} width={3.2} height={14} fill={st.leg} />
        <Ellipse cx={0} cy={-1} rx={6} ry={2} fill={st.leg} />
        <Ellipse cx={0} cy={-15} rx={14} ry={5} fill={st.rim} stroke={INK} strokeWidth={1.1} />
        <Ellipse cx={0} cy={-16} rx={14} ry={5} fill={st.top} stroke={INK} strokeWidth={1.1} />
        {tier === 1 &&
          [-8, -3, 2, 7].map((dx, i) => <Rect key={dx} x={dx} y={-19 + (i % 2) * 2} width={3} height={2} fill="#D9443A" opacity={0.85} />)}
        {tier === 3 && <Path d="M-10 -17 Q0 -19 10 -15" stroke="#C9C3BA" strokeWidth={0.8} fill="none" />}
        <Ellipse cx={-3} cy={-16.5} rx={5} ry={1.8} fill="#FFC531" stroke={INK} strokeWidth={0.6} />
        <Circle cx={-4} cy={-16.8} r={0.8} fill="#E8432E" />
        <Circle cx={-1.5} cy={-16} r={0.8} fill="#E8432E" />
        {tier === 3 && (
          <G>
            <Rect x={5} y={-23} width={2.4} height={6} fill="#FFF8E7" stroke={INK} strokeWidth={0.4} />
            <Path d="M6.2 -23 q-1.6 -2.6 0 -4.6 q1.6 2 0 4.6 Z" fill="#FFB23A" />
            <Circle cx={6.2} cy={-25} r={4} fill="#FFE7A0" opacity={0.35} />
          </G>
        )}
      </G>
    </G>
  );
}

/** A round woven rug under the starter table. */
export function Rug({ x, y }: { x: number; y: number }) {
  const [cx, cy] = P(x, y);
  const k = kAt(y);
  return (
    <G>
      <Ellipse cx={cx} cy={cy} rx={44 * k} ry={13 * k} fill="#C8463A" stroke={INK} strokeWidth={1} />
      <Ellipse cx={cx} cy={cy} rx={36 * k} ry={10.4 * k} fill="none" stroke="#F2C94C" strokeWidth={1.6} />
      <Ellipse cx={cx} cy={cy} rx={26 * k} ry={7.4 * k} fill="#E9A64B" opacity={0.6} />
    </G>
  );
}

/** Tier-3 plants: a trailing planter on the left side wall, up out of the diners' way. */
export function WallPlanter({ lay }: { lay: Layout }) {
  const [bx, by] = P(lay.L, 70, 150);
  const k = kAt(70);
  return (
    <G transform={`translate(${bx} ${by}) scale(${k})`}>
      <Path d="M0 -4 H14 V-1 H0 Z" fill="#5E3A26" stroke={INK} strokeWidth={0.8} />
      <Path d="M2 -16 L16 -16 L14 -4 L4 -4 Z" fill="#C2693E" stroke={INK} strokeWidth={1} />
      {[-30, -5, 20, 45].map((a, i) => (
        <Ellipse key={a} cx={9 + Math.sin((a * Math.PI) / 180) * 7} cy={-24 - Math.cos((a * Math.PI) / 180) * 5} rx={4} ry={8} fill={i % 2 ? '#3F8A3E' : '#4FA048'} stroke={INK} strokeWidth={0.7} transform={`rotate(${a} ${9 + Math.sin((a * Math.PI) / 180) * 7} ${-24 - Math.cos((a * Math.PI) / 180) * 5})`} />
      ))}
      {[4, 10, 15].map((dx, i) => (
        <Path key={dx} d={`M${dx} -5 q${i % 2 ? 4 : -3} 10 ${i % 2 ? 1 : 0} ${18 + i * 5}`} stroke="#4FA048" strokeWidth={2.4} fill="none" strokeLinecap="round" />
      ))}
    </G>
  );
}

/** A small floor prop that makes each starter shop its own place. */
export function FloorProp({ id, x, y }: { id: NeighborhoodId; x: number; y: number }) {
  const [px, py] = P(x, y);
  const k = kAt(y) * 1.4;
  return (
    <G transform={`translate(${px} ${py}) scale(${k})`}>
      <Ellipse cx={0} cy={0} rx={12} ry={3} fill="rgba(59,31,20,0.22)" />
      {id === 'waterfront' && (
        <G>
          <Rect x={-11} y={-14} width={14} height={14} rx={1} fill="#C99A6B" stroke={INK} strokeWidth={0.9} />
          <Path d="M-11 -7 H3 M-4 -14 V0" stroke="#8E5A3C" strokeWidth={0.8} />
          <Ellipse cx={8} cy={-2.5} rx={6} ry={2.5} fill="#E3C89A" stroke={INK} strokeWidth={0.8} />
          <Ellipse cx={8} cy={-3} rx={3.5} ry={1.4} fill="none" stroke="#B48E5E" strokeWidth={0.8} />
        </G>
      )}
      {id === 'downtown' && (
        <G>
          <Rect x={-8} y={-9} width={16} height={9} rx={1} fill="#E9E4DC" stroke={INK} strokeWidth={0.9} />
          <Path d="M-6 -6 H6 M-6 -3.5 H4" stroke="#9A958E" strokeWidth={0.8} />
          <Path d="M-8 -5 H8" stroke="#C8643E" strokeWidth={1.4} />
        </G>
      )}
      {id === 'suburbs' && (
        <G>
          <Path d="M-5 0 L-4 -12 L4 -12 L5 0 Z" fill="#3F7FB0" stroke={INK} strokeWidth={0.9} />
          <Path d="M-1 -12 L-2 -22 M2 -12 L4 -21" stroke={INK} strokeWidth={1.4} strokeLinecap="round" />
          <Path d="M-2 -22 q-3 0 -3 3 M4 -21 q3 0 3 3" stroke={INK} strokeWidth={1} fill="none" />
        </G>
      )}
      {id === 'university' && (
        <G>
          {['#7B2CBF', '#2D9CDB', '#E8432E'].map((c, i) => <Rect key={c} x={-8 + i} y={-4 - i * 4} width={15 - i * 2} height={4} rx={0.6} fill={c} stroke={INK} strokeWidth={0.7} />)}
        </G>
      )}
      {id === 'industrial' && (
        <G>
          <Rect x={-9} y={-9} width={18} height={9} rx={1.5} fill="#D9443A" stroke={INK} strokeWidth={0.9} />
          <Path d="M-4 -9 V-12 H4 V-9" stroke={INK} strokeWidth={1.2} fill="none" />
          <Path d="M-9 -5 H9" stroke="#8C2A20" strokeWidth={0.8} />
        </G>
      )}
      {id === 'uptown' && (
        <G>
          <Path d="M0 0 V-30 M-5 0 H5 M0 -27 L-5 -23 M0 -27 L5 -23" stroke="#5E3A26" strokeWidth={1.6} strokeLinecap="round" />
          <Path d="M-6 -24 q-3 6 0 10 L-2 -14 Z" fill="#7B1E3A" stroke={INK} strokeWidth={0.6} />
        </G>
      )}
    </G>
  );
}

/** A window bar along the inside of the front sill, by the door, for the starter shop. */
export function LedgeBar({ x0, x1 }: { x0: number; x1: number }) {
  return (
    <G>
      {[x0 + 3, x1 - 5].map((lx) => <Box key={lx} x0={lx} x1={lx + 2} y0={4} y1={6} h={20} color="#5E3A26" />)}
      <Box x0={x0} x1={x1} y0={2} y1={9} h={4} z={20} color="#5E3A26" top="#8E5A3C" />
      <Path d={`M${P(x0, 2, 24).join(' ')} L${P(x1, 2, 24).join(' ')}`} stroke="#B07A50" strokeWidth={1} />
    </G>
  );
}
export function Stools({ x0, x1 }: { x0: number; x1: number }) {
  return (
    <G>
      {[x0 + (x1 - x0) * 0.3, x0 + (x1 - x0) * 0.72].map((sx) => {
        const [px, py] = P(sx, 13);
        const k = kAt(13) * 1.1;
        return (
          <G key={sx} transform={`translate(${px} ${py}) scale(${k})`}>
            <Ellipse cx={0} cy={0} rx={6} ry={1.8} fill="rgba(59,31,20,0.22)" />
            <Path d="M-3 0 L-2 -21 M3 0 L2 -21 M-2.6 -8 H2.6" stroke="#5E3A26" strokeWidth={1.4} />
            <Ellipse cx={0} cy={-21.5} rx={5.4} ry={2} fill="#D9443A" stroke={INK} strokeWidth={0.8} />
            <Ellipse cx={-1.4} cy={-22} rx={2} ry={0.6} fill="#fff" opacity={0.4} />
          </G>
        );
      })}
    </G>
  );
}

/** A potted plant standing on the floor at room point (x, y). */
export function FloorPlant({ x, y, big = false, k: kk = 1 }: { x: number; y: number; big?: boolean; k?: number }) {
  const [px, py] = P(x, y);
  const k = kAt(y) * (big ? 1.25 : 1) * kk;
  return (
    <G transform={`translate(${px} ${py}) scale(${k})`}>
      <Ellipse cx={0} cy={0} rx={11} ry={3} fill="rgba(59,31,20,0.25)" />
      <Path d="M-8 -14 L8 -14 L6 0 L-6 0 Z" fill="#C2693E" stroke={INK} strokeWidth={1} />
      <Rect x={-9} y={-16} width={18} height={4} rx={1.5} fill="#A8552F" stroke={INK} strokeWidth={0.9} />
      {[-40, -15, 10, 35, 60].map((a, i) => (
        <Ellipse key={a} cx={Math.sin((a * Math.PI) / 180) * 9} cy={-26 - Math.cos((a * Math.PI) / 180) * 8} rx={4.5} ry={10} fill={i % 2 ? '#3F9A48' : '#5DBB5A'} stroke={INK} strokeWidth={0.8} transform={`rotate(${a} ${Math.sin((a * Math.PI) / 180) * 9} ${-26 - Math.cos((a * Math.PI) / 180) * 8})`} />
      ))}
    </G>
  );
}

/** A proper cash register on the counter top. */
export function Register({ x, y, z }: { x: number; y: number; z: number }) {
  const [rx, ry] = P(x, y, z);
  const k = kAt(y) * 1.1;
  return (
    <G transform={`translate(${rx} ${ry}) scale(${k})`}>
      <Path d="M-11 0 L11 0 L9 -9 L-9 -9 Z" fill="#4A4F57" stroke={INK} strokeWidth={1} />
      <Rect x={-10} y={-3} width={20} height={3} fill="#3A3F46" />
      <Rect x={-2} y={-2.4} width={4} height={1.2} rx={0.6} fill="#C9C3BA" />
      {[-6, -2, 2, 6].map((dx) => [-7, -5].map((dy) => <Rect key={`${dx}${dy}`} x={dx - 1.2} y={dy} width={2.4} height={1.2} rx={0.4} fill="#E9E4DC" />))}
      <Rect x={-2} y={-17} width={4} height={8} fill="#4A4F57" stroke={INK} strokeWidth={0.8} />
      <Rect x={-8} y={-22} width={16} height={7} rx={1.5} fill="#2B2F35" stroke={INK} strokeWidth={0.9} />
      <Rect x={-6.5} y={-20.8} width={13} height={4.6} rx={1} fill="#7FE0A0" />
      <Path d="M-4.5 -18 h4 M1 -18 h3" stroke="#1E6B3A" strokeWidth={1} />
    </G>
  );
}
