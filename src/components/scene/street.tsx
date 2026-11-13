import { memo, type ReactElement } from 'react';
import { F } from '../../theme';
import { Circle, Ellipse, G, Path, Polygon, Rect, Text as SvgText } from 'react-native-svg';
import { chairBack } from './geometry';
import { PATIO_SEAT, PILL_LAYER_Y, moreTagAt, waitTagAt, type Layout } from './layout';
import { DECK_COLOR, DECK_LINE, RAIL_PT, patioDeck, patioSortYs } from './patio-deck';
import { MINT } from './cosmetics';
import { TABLE_STYLE } from './props';
import { INK, SCENE_W, CURB_Y, P, kAt, shade } from './projection';

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

/** The shop's delivery vehicle parked by the door, drawn in the scene's outlined style. `mint` is the worn mint-scooter cosmetic: the body is repainted whichever tier is parked. */
export const ParkedVehicle = memo(function ParkedVehicle({ x, y, v, mint = false }: { x: number; y: number; v: number; mint?: boolean }) {
  if (v >= 2 && v <= 3) {
    return (
      <G transform={`translate(${x} ${y + 2}) scale(0.62)`}>
        <Car x={0} y={0} color={mint ? MINT.body : v === 3 ? '#D9443A' : '#E8432E'} kind={v === 3 ? 'van' : 'car'} dir={1} label="ROSA’S" labelColor="#FFF4E0" />
      </G>
    );
  }
  if (v === 4) {
    return (
      <G transform={`translate(${x} ${y - 18})`}>
        <Ellipse cx={0} cy={20} rx={14} ry={3} fill="rgba(59,31,20,0.2)" />
        <Path d="M-18 -4 H18" stroke={INK} strokeWidth={2} />
        {[-18, 18].map((dx) => <Ellipse key={dx} cx={dx} cy={-6} rx={9} ry={2} fill="#BFE3F5" stroke={INK} strokeWidth={0.8} />)}
        <Rect x={-10} y={-4} width={20} height={10} rx={4} fill={mint ? MINT.body : '#9B51E0'} stroke={INK} strokeWidth={1} />
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
        <Path d="M-12 -7 L-2 -18 L8 -18 L12 -7 M-2 -18 L2 -7 L8 -18 M8 -18 L6 -24 M-4 -20 H2" stroke={mint ? MINT.dark : '#E8432E'} strokeWidth={2.2} fill="none" strokeLinejoin="round" strokeLinecap="round" />
      ) : (
        <G>
          <Path d="M-16 -9 Q-16 -20 -4 -20 L6 -20 L10 -10 L14 -10 L12 -5 L-16 -5 Z" fill={mint ? MINT.body : '#FFC531'} stroke={INK} strokeWidth={1.1} />
          <Path d="M8 -20 L12 -30 M9 -30 H16" stroke={INK} strokeWidth={1.8} strokeLinecap="round" />
          <Rect x={-18} y={-30} width={14} height={10} rx={1.5} fill={mint ? MINT.dark : '#E8432E'} stroke={INK} strokeWidth={1} />
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

// ---------- the sidewalk patio and the waiting tag (v5.11) ----------
const UMBRELLA = ['#D9443A', '#FFF4E0'];
/** The canopy's radius at table scale: the whole set (canopy and both chairs) is 2 × PATIO_HALF_W wide on screen (layout.ts). */
export const UMBRELLA_R = 24;

/**
 * One small patio table with two chairs and an umbrella, standing on the sidewalk at room (x, y). Three layers so
 * diners really sit: `back` is the shadow and both chairs, `front` the table top over their laps, `umbrella` the
 * canopy over their heads. Chairs sit ±PATIO_SEAT from the table.
 */
export const PatioTable = memo(function PatioTable({ x, y, part }: { x: number; y: number; part: 'deck' | 'back' | 'front' | 'umbrella' | 'rail' }) {
  if (part === 'deck' || part === 'rail') return <PatioDeck x={x} y={y} part={part} />;
  const [cx, cy] = P(x, y);
  const k = kAt(y) * 1.1;
  const st = TABLE_STYLE[0];
  if (part === 'back') {
    const chair = (dx: number) => {
      const out = dx < 0 ? -1 : 1;
      const cb = chairBack(out);
      const [px, py] = P(x + dx, y);
      return (
        <G key={dx} transform={`translate(${px} ${py}) scale(${k})`}>
          <Ellipse cx={0} cy={0} rx={8} ry={2.2} fill="rgba(59,31,20,0.18)" />
          {[-6, 6].map((lx) => <Rect key={lx} x={lx - 1} y={-4} width={2} height={4} rx={0.6} fill={st.chairDark} stroke={INK} strokeWidth={0.6} />)}
          <Rect x={cb.x0} y={cb.top} width={1.8} height={cb.bottom - cb.top} rx={0.8} fill={st.chairDark} stroke={INK} strokeWidth={0.7} />
          <Rect x={cb.x0 + 4.2} y={cb.top} width={1.8} height={cb.bottom - cb.top} rx={0.8} fill={st.chairDark} stroke={INK} strokeWidth={0.7} />
          <Rect x={cb.rail.x0} y={cb.rail.y0} width={cb.rail.x1 - cb.rail.x0} height={cb.rail.y1 - cb.rail.y0} rx={1.8} fill={st.chair} stroke={INK} strokeWidth={1.1} />
          <Rect x={out < 0 ? -13 : -7.5} y={-6.4} width={20.5} height={3.8} rx={1.6} fill={st.chair} stroke={INK} strokeWidth={1.2} />
          <Rect x={out < 0 ? -13 : -7.5} y={-3.8} width={20.5} height={1.2} rx={0.6} fill={st.chairDark} />
        </G>
      );
    };
    return (
      <G>
        <Ellipse cx={cx} cy={cy} rx={30 * k} ry={6 * k} fill="rgba(59,31,20,0.16)" />
        {chair(-PATIO_SEAT)}
        {chair(PATIO_SEAT)}
        {/* D450: the umbrella's pole stands behind the diners (it used to be drawn with the canopy, over their faces) */}
        <Rect x={cx - 0.9 * k} y={cy - 56 * k} width={1.8 * k} height={42 * k} fill="#7A5C48" stroke={INK} strokeWidth={0.6} />
      </G>
    );
  }
  if (part === 'front') {
    return (
      <G transform={`translate(${cx} ${cy}) scale(${k})`}>
        <Rect x={-1.4} y={-14} width={2.8} height={14} fill={st.leg} />
        <Ellipse cx={0} cy={-1} rx={5} ry={1.8} fill={st.leg} />
        <Ellipse cx={0} cy={-15} rx={10} ry={3.6} fill={st.rim} stroke={INK} strokeWidth={1.1} />
        <Ellipse cx={0} cy={-16} rx={10} ry={3.6} fill={st.top} stroke={INK} strokeWidth={1.1} />
        <Ellipse cx={-2} cy={-16.4} rx={3.6} ry={1.3} fill="#FFC531" stroke={INK} strokeWidth={0.5} />
      </G>
    );
  }
  return (
    <G transform={`translate(${cx} ${cy}) scale(${k})`}>
      {/* four wedges of a red-and-cream canopy, a scalloped rim, and the finial */}
      {[0, 1, 2, 3].map((n) => {
        const x0 = -UMBRELLA_R + n * (UMBRELLA_R / 2);
        const w = UMBRELLA_R / 2;
        return <Path key={n} d={`M0 -66 L${x0} -51 Q${x0 + w / 4} -47.5 ${x0 + w / 2} -51 Q${x0 + (3 * w) / 4} -47.5 ${x0 + w} -51 Z`} fill={UMBRELLA[n % 2]} stroke={INK} strokeWidth={1} strokeLinejoin="round" />;
      })}
      <Circle cx={0} cy={-67} r={1.7} fill={INK} />
    </G>
  );
});

const RAIL_COLOR = '#F4EBDD';
const toPts = (q: readonly [number, number][]) => q.map(([a, b]) => `${a.toFixed(1)},${b.toFixed(1)}`).join(' ');
/**
 * The plank deck under a patio set (D428): #C99A6B planks one step (10 pt) down from the shop front, with a lit riser along its back
 * edge, and a low rail round the front and sides with a gap where the guests walk in. `deck` is drawn under the chairs, `rail` over them.
 */
const PatioDeck = memo(function PatioDeck({ x, y, part }: { x: number; y: number; part: 'deck' | 'rail' }) {
  const d = patioDeck({ x, y });
  if (part === 'deck')
    return (
      <G>
        <Polygon points={toPts(d.riser)} fill="#9C7149" stroke={INK} strokeWidth={1} strokeLinejoin="round" />
        <Polygon points={toPts(d.top)} fill={DECK_COLOR} stroke={INK} strokeWidth={1} strokeLinejoin="round" />
        {d.planks.map(([a, b], i) => <Path key={i} d={`M${a[0].toFixed(1)} ${a[1].toFixed(1)} L${b[0].toFixed(1)} ${b[1].toFixed(1)}`} stroke={DECK_LINE} strokeWidth={0.8} opacity={0.8} />)}
      </G>
    );
  return (
    <G>
      {d.rail.posts.map(([px, py], i) => <Rect key={`p${i}`} x={px - 1.1} y={py - RAIL_PT} width={2.2} height={RAIL_PT} rx={0.6} fill={RAIL_COLOR} stroke={INK} strokeWidth={0.8} />)}
      {d.rail.bars.map(([a, b], i) => <Path key={`b${i}`} d={`M${a[0].toFixed(1)} ${a[1].toFixed(1)} L${b[0].toFixed(1)} ${b[1].toFixed(1)}`} stroke={INK} strokeWidth={3.4} strokeLinecap="round" />)}
      {d.rail.bars.map(([a, b], i) => <Path key={`c${i}`} d={`M${a[0].toFixed(1)} ${a[1].toFixed(1)} L${b[0].toFixed(1)} ${b[1].toFixed(1)}`} stroke={RAIL_COLOR} strokeWidth={1.8} strokeLinecap="round" />)}
    </G>
  );
});

/** A small white pill in the scene's style, tail pointing down at `tail` (offset from its centre): "29 drivers idle · buy Ovens", or "+1" over the diner queue. */
export const WaitTag = memo(function WaitTag({ x, y, text, w, tail }: { x: number; y: number; text: string; w: number; tail: number }) {
  const t = Math.max(-w / 2 + 9, Math.min(w / 2 - 9, tail));
  return (
    <G transform={`translate(${x.toFixed(1)} ${y.toFixed(1)})`}>
      <Path d={`M${t - 4} 7 L${t} 12 L${t + 4} 7 Z`} fill="#fff" stroke={INK} strokeWidth={1.1} strokeLinejoin="round" />
      <Rect x={-w / 2} y={-9} width={w} height={17} rx={8.5} fill="#fff" stroke={INK} strokeWidth={1.1} />
      <Rect x={t - 3.4} y={6.4} width={6.8} height={2.4} fill="#fff" />
      <SvgText x={0} y={3} fontFamily={F.bold} fontSize={10} fill={INK} textAnchor="middle">
        {text}
      </SvgText>
    </G>
  );
});

/**
 * The sidewalk's own scenery, depth-sorted with the cast: the patio's tables (with the umbrellas over the diners'
 * heads) and the pills. `patio`: tables standing (0..2); `waiting`: the text of the idle drivers' pill, or null; `more`: the
 * text of the "+N" pill at the end of the diner queue, or null (cast.ts `sidewalkOf`, waiting.ts).
 */
export function sidewalkItems(lay: Layout, patio: number, waiting: string | null, more: string | null = null): { y: number; el: ReactElement }[] {
  const out: { y: number; el: ReactElement }[] = [];
  lay.patio.slice(0, patio).forEach((p, i) => {
    const sy = patioSortYs(p.y);
    out.push({ y: sy.deck, el: <PatioTable key={`pd${i}`} x={p.x} y={p.y} part="deck" /> });
    out.push({ y: sy.rail, el: <PatioTable key={`pr${i}`} x={p.x} y={p.y} part="rail" /> });
    out.push({ y: sy.back, el: <PatioTable key={`pb${i}`} x={p.x} y={p.y} part="back" /> });
    out.push({ y: sy.front, el: <PatioTable key={`pf${i}`} x={p.x} y={p.y} part="front" /> });
    out.push({ y: sy.umbrella, el: <PatioTable key={`pu${i}`} x={p.x} y={p.y} part="umbrella" /> });
  });
  // D450: both pills sit on the layer above the umbrellas (patioSortYs), so a canopy tip never cuts a digit
  if (waiting) {
    const t = waitTagAt(lay, waiting);
    out.push({ y: PILL_LAYER_Y, el: <WaitTag key="wait" x={t.x} y={t.y} text={waiting} w={t.w} tail={t.tail} /> });
  }
  if (more) {
    const t = moreTagAt(lay, more);
    out.push({ y: PILL_LAYER_Y - 0.5, el: <WaitTag key="more" x={t.x} y={t.y} text={more} w={t.w} tail={0} /> });
  }
  return out;
}

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
