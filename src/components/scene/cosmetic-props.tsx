// The worn cosmetics that are small drawings of their own: the neon counter sign and the master's plaque (v5.15, S1), and the v5.24 looks (card S4): the tip jar on its shelf, the
// door chime, the crew's aprons, the table cloths and the storefronts' trim. What they replace and where they go is in cosmetics.ts and look-art.ts. Memoised on primitives
// (the look is a key into look-art.ts's tables), like every scene piece.
import { memo } from 'react';
import { Circle, Ellipse, G, Path, Rect, Text as SvgText } from 'react-native-svg';

import { F } from '../../theme';
import { GOLD_PLAQUE, PLAQUE_H, PLAQUE_W } from './cosmetics';
import { APRONS, CHIMES, CLOTHS, JARS, JAR_H, JAR_W, type TrimKind } from './look-art';
import { INK } from './projection';

const PINK = '#FF5E9A';
const CYAN = '#6FE8FF';

/** The neon counter sign, in the 38 x 13 box of the ladder's "ORDER HERE" sign it stands in for (origin: bottom centre): a pink tube, a cyan underline and a halo. */
export const NeonCounterSign = memo(function NeonCounterSign() {
  return (
    <G>
      <Rect x={-23} y={-16} width={46} height={19} rx={9} fill={PINK} opacity={0.2} />
      <Rect x={-19} y={-12} width={38} height={13} rx={4} fill="#1E1630" stroke={INK} strokeWidth={1.1} />
      <Rect x={-17} y={-10} width={34} height={9} rx={3} fill="none" stroke={PINK} strokeWidth={1.2} />
      <SvgText x={0} y={-3.4} fontFamily={F.bold} fontSize={6} fill={PINK} stroke={PINK} strokeWidth={1.8} opacity={0.35} textAnchor="middle">
        SLICE
      </SvgText>
      <SvgText x={0} y={-3.4} fontFamily={F.bold} fontSize={6} fill="#FFE3EE" textAnchor="middle">
        SLICE
      </SvgText>
      <Path d="M-9 -1.6 H9" stroke={CYAN} strokeWidth={1} strokeLinecap="round" />
    </G>
  );
});

/** The master's plaque, centred on its own origin, PLAQUE_W x PLAQUE_H (34 x 22): a brass plate with a double rim, corner rivets, MASTER over three stars, and a shine. */
export const GoldPlaque = memo(function GoldPlaque() {
  const w = PLAQUE_W;
  const h = PLAQUE_H;
  const star = (cx: number, cy: number, r: number) =>
    `M${cx} ${cy - r} L${cx + r * 0.3} ${cy - r * 0.32} L${cx + r} ${cy - r * 0.3} L${cx + r * 0.48} ${cy + r * 0.14} L${cx + r * 0.62} ${cy + r * 0.86} L${cx} ${cy + r * 0.48} L${cx - r * 0.62} ${cy + r * 0.86} L${cx - r * 0.48} ${cy + r * 0.14} L${cx - r} ${cy - r * 0.3} L${cx - r * 0.3} ${cy - r * 0.32} Z`;
  return (
    <G>
      <Rect x={-w / 2 + 1.5} y={-h / 2 + 2} width={w} height={h} rx={3} fill="rgba(59,31,20,0.3)" />
      <Rect x={-w / 2} y={-h / 2} width={w} height={h} rx={3} fill={GOLD_PLAQUE.rim} stroke={INK} strokeWidth={1.3} />
      <Rect x={-w / 2 + 2} y={-h / 2 + 2} width={w - 4} height={h - 4} rx={2} fill={GOLD_PLAQUE.face} stroke="#FFE9A0" strokeWidth={0.8} />
      {[
        [-w / 2 + 4.5, -h / 2 + 4.5],
        [w / 2 - 4.5, -h / 2 + 4.5],
        [-w / 2 + 4.5, h / 2 - 4.5],
        [w / 2 - 4.5, h / 2 - 4.5],
      ].map(([x, y], i) => (
        <Circle key={i} cx={x} cy={y} r={1.1} fill={GOLD_PLAQUE.rim} />
      ))}
      <SvgText x={0} y={-1.2} fontFamily={F.bold} fontSize={6.6} fill={GOLD_PLAQUE.text} textAnchor="middle" letterSpacing={0.2}>
        MASTER
      </SvgText>
      {[-7, 0, 7].map((dx) => (
        <Path key={dx} d={star(dx, 5.6, 3.1)} fill={GOLD_PLAQUE.text} stroke="#FFF3B0" strokeWidth={0.3} />
      ))}
      <Path d={`M${-w / 2 + 4} ${-h / 2 + 3.4} L${-w / 2 + 13} ${-h / 2 + 3.4}`} stroke="#fff" strokeWidth={1.4} opacity={0.65} strokeLinecap="round" />
      <Path d={`M${-w / 2 + 4} ${-h / 2 + 3.4} L${-w / 2 + 3.4} ${-h / 2 + 8}`} stroke="#fff" strokeWidth={1.4} opacity={0.5} strokeLinecap="round" />
    </G>
  );
});

// ---------- the v5.24 looks ----------

/** The tip jar on its bracket shelf, origin at the middle of the shelf's top edge (look-art.ts `tipJarSpot`): the box is JAR_W x JAR_H, 17 up and 2 down. */
export const TipJar = memo(function TipJar({ look }: { look: string }) {
  const j = JARS[look];
  if (!j) return null;
  const coins = (cy: number) => (
    <G>
      <Ellipse cx={-1.6} cy={cy} rx={2.3} ry={0.9} fill="#F2C94C" stroke={INK} strokeWidth={0.4} />
      <Ellipse cx={1.8} cy={cy - 0.8} rx={2.3} ry={0.9} fill="#E0B000" stroke={INK} strokeWidth={0.4} />
      <Ellipse cx={0} cy={cy - 1.7} rx={2.3} ry={0.9} fill="#F2C94C" stroke={INK} strokeWidth={0.4} />
    </G>
  );
  return (
    <G>
      {/* the shelf: a board on two brackets, screwed to the counter's front panel */}
      <Path d={`M${-JAR_W / 2 + 3} 2.4 L${-JAR_W / 2 + 3} 0 M${JAR_W / 2 - 3} 2.4 L${JAR_W / 2 - 3} 0`} stroke={INK} strokeWidth={1.6} />
      <Rect x={-JAR_W / 2} y={-0.6} width={JAR_W} height={2.6} rx={0.8} fill="#A8714B" stroke={INK} strokeWidth={0.9} />
      {j.shape === 'jar' && (
        <G>
          <Rect x={-5} y={-12.5} width={10} height={12} rx={2.2} fill={j.body} stroke={INK} strokeWidth={1} opacity={0.92} />
          {coins(-2.4)}
          <Rect x={-1.2} y={-8} width={2.4} height={3} fill={j.accent} opacity={0.9} />
          <Rect x={-5.6} y={-14.8} width={11.2} height={2.6} rx={1} fill={j.lid} stroke={INK} strokeWidth={0.9} />
          <Path d="M-1.6 -13.5 H1.6" stroke={INK} strokeWidth={0.6} />
          <Path d="M-3.4 -10.5 V-4" stroke="#fff" strokeWidth={1} opacity={0.6} strokeLinecap="round" />
        </G>
      )}
      {j.shape === 'pot' && (
        <G>
          <Path d="M-5 -10 L5 -10 L6.2 -0.4 L-6.2 -0.4 Z" fill={j.body} stroke={INK} strokeWidth={1} strokeLinejoin="round" />
          <Ellipse cx={0} cy={-10} rx={5} ry={1.6} fill={j.lid} stroke={INK} strokeWidth={0.9} />
          {coins(-10.4)}
          <Path d="M-4.5 -8 H4.8" stroke={j.accent} strokeWidth={0.9} opacity={0.8} />
          <Path d="M-3.8 -6.8 L-4.6 -1.6" stroke="#fff" strokeWidth={1} opacity={0.55} strokeLinecap="round" />
        </G>
      )}
      {j.shape === 'shake' && (
        <G>
          <Path d="M-5.4 -13 L5.4 -13 L3.8 -0.6 L-3.8 -0.6 Z" fill={j.body} stroke={INK} strokeWidth={1} strokeLinejoin="round" />
          <Path d="M-4.7 -9.5 L4.7 -9.5 L4.2 -6.5 L-4.2 -6.5 Z" fill={j.accent} />
          <Rect x={-6} y={-15} width={12} height={2.6} rx={1.2} fill={j.lid} stroke={INK} strokeWidth={0.9} />
          <Path d="M2 -15 L4.2 -19.5" stroke={j.accent} strokeWidth={1.4} strokeLinecap="round" />
          <Path d="M-3.4 -12 L-2.8 -2.6" stroke="#fff" strokeWidth={1} opacity={0.7} strokeLinecap="round" />
        </G>
      )}
      {j.shape === 'bottle' && (
        <G>
          <Path
            d="M-4.8 -0.6 L-4.8 -8 Q-4.8 -10 -2 -11 L-1.6 -14 L1.6 -14 L2 -11 Q4.8 -10 4.8 -8 L4.8 -0.6 Z"
            fill={j.body}
            stroke={INK}
            strokeWidth={1}
            strokeLinejoin="round"
            opacity={0.95}
          />
          <Rect x={-1.8} y={-16.4} width={3.6} height={2.6} rx={0.8} fill={j.lid} stroke={INK} strokeWidth={0.8} />
          <Path d="M-1.8 -12.6 H1.8 M-1.8 -11.2 H1.8" stroke={j.accent} strokeWidth={1.1} />
          {coins(-1.8)}
          <Path d="M-3.4 -8 L-3.4 -2.5" stroke="#fff" strokeWidth={1} opacity={0.55} strokeLinecap="round" />
        </G>
      )}
    </G>
  );
});

/** The door chime, origin at its hook on the lintel (look-art.ts `chimeSpot`): 14 wide and 24 down at most (shown at CHIME_SCALE). */
export const DoorChime = memo(function DoorChime({ look }: { look: string }) {
  const c = CHIMES[look];
  if (!c) return null;
  return (
    <G>
      <Rect x={-1.2} y={-1} width={2.4} height={2.2} fill={c.cord} stroke={INK} strokeWidth={0.6} />
      {c.shape === 'bell' && (
        <G>
          <Path d="M0 1 V4" stroke={INK} strokeWidth={1} />
          <Path
            d="M-3.6 13.6 Q-3.2 5 0 4 Q3.2 5 3.6 13.6 Q5.4 14 5.4 15.6 H-5.4 Q-5.4 14 -3.6 13.6 Z"
            fill={c.metal}
            stroke={INK}
            strokeWidth={1}
            strokeLinejoin="round"
          />
          <Circle cx={0} cy={17.4} r={1.7} fill="#8A6A1F" stroke={INK} strokeWidth={0.7} />
          <Path d="M-2 7 Q-2.4 10.6 -2.8 13" stroke="#fff" strokeWidth={0.9} opacity={0.6} strokeLinecap="round" fill="none" />
          <Path d="M0 17.4 V21 M-2 21 L0 24 L2 21 Z" stroke={INK} strokeWidth={0.7} fill="#D9443A" />
        </G>
      )}
      {c.shape === 'tubes' && (
        <G>
          <Ellipse cx={0} cy={2.6} rx={6.4} ry={1.7} fill={c.cord} stroke={INK} strokeWidth={0.8} />
          {[
            [-4.6, 14],
            [-1.6, 18],
            [1.6, 20],
            [4.6, 16],
          ].map(([dx, len]) => (
            <G key={dx}>
              <Path d={`M${dx} 3.8 V${len + 3}`} stroke={INK} strokeWidth={0.4} />
              <Rect x={dx - 1.1} y={5.2} width={2.2} height={len - 3} rx={1} fill={c.metal} stroke={INK} strokeWidth={0.7} />
            </G>
          ))}
          <Path d="M0 8 V21" stroke={INK} strokeWidth={0.5} />
          <Rect x={-2.6} y={20.2} width={5.2} height={3.2} rx={1} fill={c.cord} stroke={INK} strokeWidth={0.7} />
        </G>
      )}
      {c.shape === 'ship' && (
        <G>
          <Rect x={-5.4} y={0.4} width={10.8} height={2.4} rx={0.8} fill="#6B4330" stroke={INK} strokeWidth={0.7} />
          <Path
            d="M-4.2 13 Q-3.8 4.4 0 3.4 Q3.8 4.4 4.2 13 Q6.2 13.4 6.2 15 H-6.2 Q-6.2 13.4 -4.2 13 Z"
            fill={c.metal}
            stroke={INK}
            strokeWidth={1}
            strokeLinejoin="round"
          />
          <Path d="M-4.4 9.4 H4.4" stroke="#8A6A1F" strokeWidth={0.8} />
          <Circle cx={0} cy={16.8} r={1.6} fill="#8A6A1F" stroke={INK} strokeWidth={0.7} />
          <Path d="M0 16.8 V20.6" stroke={c.cord} strokeWidth={1.4} />
          <Circle cx={0} cy={22} r={1.8} fill={c.cord} stroke={INK} strokeWidth={0.7} />
        </G>
      )}
    </G>
  );
});

/** The skirt of a table cloth, origin at the table's base like Table's front layer: hangs 6 below the rim with a scalloped hem. */
const SKIRT = 'M-14.6 -15.4 L-13.4 -9 Q-10 -6.4 -6.7 -8.8 Q-3.4 -6.2 0 -8.6 Q3.4 -6.2 6.7 -8.8 Q10 -6.4 13.4 -9 L14.6 -15.4 Z';

/** A table cloth over the table's top, drawn after the rim and the top (props.tsx `Table`, front layer): top ellipse, skirt and the pattern. */
export const TableCloth = memo(function TableCloth({ look }: { look: string }) {
  const c = CLOTHS[look];
  if (!c) return null;
  return (
    <G>
      <Path d={SKIRT} fill={c.cloth} stroke={INK} strokeWidth={1} strokeLinejoin="round" />
      <Path d="M-13.8 -10.4 Q-10 -7.9 -6.7 -10 Q-3.4 -7.4 0 -9.8 Q3.4 -7.4 6.7 -10 Q10 -7.9 13.8 -10.4" stroke={c.alt} strokeWidth={1.4} fill="none" />
      <Path
        d="M-8 -14.4 L-7 -9.6 M0 -14.8 V-9.6 M8 -14.4 L7 -9.6"
        stroke={c.alt}
        strokeWidth={c.pattern === 'check' ? 2 : 0.6}
        opacity={c.pattern === 'check' ? 0.9 : 0.5}
      />
      <Ellipse cx={0} cy={-16} rx={14.4} ry={5.2} fill={c.cloth} stroke={INK} strokeWidth={1.1} />
      {c.pattern === 'check' &&
        [
          [-9.6, -17.4],
          [-3.2, -17.4],
          [3.2, -17.4],
          [-6.4, -14.6],
          [0, -14.6],
          [6.4, -14.6],
          [-10, -15.6],
          [9.6, -17.4],
        ].map(([x, y], i) => <Rect key={i} x={x} y={y} width={3.2} height={2.2} fill={c.alt} opacity={0.85} />)}
      {c.pattern === 'plain' && <Path d="M-9 -16 Q0 -13.6 9 -16" stroke={c.alt} strokeWidth={0.7} fill="none" opacity={0.7} />}
    </G>
  );
});

/**
 * The crew's apron over the torso (people.tsx `FigureBody`), `by` the torso's top and `kind` the worker: the bib starts under the cook's neckerchief and the counter worker's
 * collar. Drawn after the outfit's own details, so it replaces the baker's brown apron.
 */
export const ApronOverlay = memo(function ApronOverlay({ look, by, kind }: { look: string; by: number; kind: string }) {
  const a = APRONS[look];
  if (!a) return null;
  const top = by + (kind === 'cook' ? 8.5 : kind === 'baker' ? 4 : 6);
  const foot = by + 19;
  const rows = 3;
  const rh = (foot - top) / rows;
  return (
    <G>
      <Path d={`M-4.6 ${top} L-3 ${by - 0.4} M5.2 ${top} L3.6 ${by - 0.4}`} stroke={a.strap} strokeWidth={1.3} strokeLinecap="round" />
      <Path d={`M-5.6 ${top} L6.2 ${top} L7 ${foot} L-6.4 ${foot} Z`} fill={a.bib} stroke={INK} strokeWidth={0.9} strokeLinejoin="round" />
      {a.pattern === 'plain' && (
        <G>
          <Path d={`M-6.2 ${foot - 3.4} L6.8 ${foot - 3.4} L7 ${foot} L-6.4 ${foot} Z`} fill={a.alt} />
          <Circle cx={0.3} cy={top + 3} r={0.9} fill={a.strap} stroke={INK} strokeWidth={0.4} />
        </G>
      )}
      {a.pattern === 'check' &&
        Array.from({ length: rows * 3 }).map((_, i) => {
          const r = Math.floor(i / 3);
          const c = i % 3;
          return (r + c) % 2 === 0 ? <Rect key={i} x={-5.6 + c * 3.9} y={top + r * rh} width={3.9} height={rh} fill={a.alt} opacity={0.85} /> : null;
        })}
      {a.pattern === 'stripe' && (
        <Path d={`M-3.6 ${top + 0.6} V${foot - 0.4} M0.3 ${top + 0.6} V${foot - 0.4} M4.2 ${top + 0.6} V${foot - 0.4}`} stroke={a.alt} strokeWidth={1.7} />
      )}
      <Path d={`M-5.6 ${top} L6.2 ${top} L7 ${foot} L-6.4 ${foot} Z`} fill="none" stroke={INK} strokeWidth={0.9} strokeLinejoin="round" />
    </G>
  );
});

/**
 * The storefront theme's line along the fascia's foot, over the fascia beam and under the name plate: `from` and `to` are the beam's screen x, `top` and `bottom` its y.
 * A gold pinstripe, a black and white checker band, or a rope.
 */
export const FasciaTrim = memo(function FasciaTrim({
  kind,
  color,
  alt,
  x0,
  x1,
  top,
  bottom,
}: {
  kind: TrimKind;
  color: string;
  alt: string;
  x0: number;
  x1: number;
  top: number;
  bottom: number;
}) {
  if (kind === 'pinstripe')
    return (
      <G>
        <Path d={`M${x0} ${bottom - 3.6} H${x1}`} stroke={color} strokeWidth={1.4} />
        <Path d={`M${x0} ${top + 4} H${x1}`} stroke={color} strokeWidth={0.8} />
        <Path d={`M${x0} ${bottom - 6} H${x1}`} stroke={alt} strokeWidth={0.5} opacity={0.6} />
      </G>
    );
  if (kind === 'checker')
    return (
      <G>
        <Rect x={x0} y={bottom - 7} width={x1 - x0} height={7} fill={alt} />
        <Path d={`M${x0} ${bottom - 5.2} H${x1}`} stroke={color} strokeWidth={3.5} strokeDasharray="3.5 3.5" />
        <Path d={`M${x0} ${bottom - 1.7} H${x1}`} stroke={color} strokeWidth={3.5} strokeDasharray="3.5 3.5" strokeDashoffset={3.5} />
        <Path d={`M${x0} ${bottom - 7} H${x1}`} stroke={INK} strokeWidth={0.6} />
      </G>
    );
  return (
    <G>
      <Path d={`M${x0} ${bottom - 3.4} H${x1}`} stroke={INK} strokeWidth={3.4} />
      <Path d={`M${x0} ${bottom - 3.4} H${x1}`} stroke={color} strokeWidth={2.4} strokeDasharray="3 1.6" />
      <Path d={`M${x0} ${top + 4} H${x1}`} stroke={alt} strokeWidth={1.2} strokeDasharray="3 1.6" />
    </G>
  );
});
