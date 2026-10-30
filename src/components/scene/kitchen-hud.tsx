// The kitchen's feedback layer (playtest 2, v4.8): a ring-timer badge over each station and the "+$X" pop that
// rides out with every departure, turning into a coin that lands on the HUD cash when the cash does.
import { memo } from 'react';
import { Circle, G, Path, Rect, Text as SvgText } from 'react-native-svg';

import { money } from '../../engine/format';
import { LINE, type Departure } from '../../engine/pipeline';
import { F } from '../../theme';
import { along } from './timelines';
import { BADGE_R } from './stations';
import { INK, SCENE_W } from './projection';

const BASIL = '#4CAF50';
const TOMATO = '#E5483A';
const TRACK = '#E9DCC3';
const DISC = '#FFF8EA';
const OUTLINE = '#4A2A1A';
const POP_FILL = '#2E8B3E';
const COIN = '#F6C343';
const COIN_RIM = '#B8860B';

export type BadgeTone = 'basil' | 'tomato';

/** Arc path for a ring filled to step/24 (clockwise from 12 o'clock). */
function arc(cx: number, cy: number, r: number, step: number) {
  if (step <= 0) return '';
  if (step >= 24) return `M${cx} ${cy - r} A${r} ${r} 0 1 1 ${cx - 0.01} ${cy - r}`;
  const a = (step / 24) * Math.PI * 2;
  const x = cx + r * Math.sin(a);
  const y = cy - r * Math.cos(a);
  return `M${cx} ${cy - r} A${r} ${r} 0 ${a > Math.PI ? 1 : 0} 1 ${x.toFixed(2)} ${y.toFixed(2)}`;
}

const PIE_ICON = 'M-4 -3 Q0 -5 4 -3 L0 5 Z';

/**
 * One station's badge. Memoised on primitives only (M36): `step` is the ring progress snapped to 1/24, so most
 * frames re-render nothing. `count` is the pies in the job (or waiting); `ready` pulses with a hand (tap me);
 * `head` is the initial of the head who runs it (a basil chip), or '' when the player taps it.
 */
export const StationBadge = memo(function StationBadge({ x, y, step, count, tone, ready, pulse, head, jump }: { x: number; y: number; step: number; count: string; tone: BadgeTone; ready: boolean; pulse: number; head: string; jump: number }) {
  const s = (ready ? 1 + 0.12 * pulse : 1) * (1 + 0.18 * jump);
  const r = BADGE_R;
  const pillW = Math.max(18, count.length * 6.2 + 10);
  return (
    <G transform={`translate(${x} ${y}) scale(${s})`}>
      <Circle cx={0} cy={0} r={r + 1.5} fill={DISC} stroke={OUTLINE} strokeWidth={1.5} />
      <Circle cx={0} cy={0} r={r - 2.5} fill="none" stroke={TRACK} strokeWidth={3} />
      {step > 0 && <Path d={arc(0, 0, r - 2.5, step)} fill="none" stroke={tone === 'tomato' ? TOMATO : BASIL} strokeWidth={3} strokeLinecap="round" />}
      <Path d={PIE_ICON} fill="#FFC531" stroke={INK} strokeWidth={0.8} strokeLinejoin="round" />
      <Circle cx={-0.8} cy={-1.2} r={0.9} fill="#E8432E" />
      {/* the count pill sits to the right of the ring (late-game batches are 4+ digits) */}
      <Rect x={r + 2} y={-7.5} width={pillW} height={15} rx={7.5} fill={INK} stroke="#fff" strokeWidth={1.2} />
      <SvgText x={r + 2 + pillW / 2} y={4} fontFamily={F.bold} fontSize={11} fill="#fff" textAnchor="middle">
        {count}
      </SvgText>
      {ready && (
        // a pointing hand on the ring's lower left: tap this station
        <G transform={`translate(${-r + 1} ${r - 2}) rotate(-30)`}>
          <Path d="M0 -7 Q1.6 -7 1.6 -5 L1.6 -1 L5 -0.4 Q6.6 0 6.2 2 L5 6 Q4.4 7.4 3 7.4 L-2.4 7.4 Q-4 7.4 -4.4 6 L-5.6 1.6 Q-5.8 0 -4.2 0.2 L-1.6 1 L-1.6 -5 Q-1.6 -7 0 -7 Z" fill="#fff" stroke={INK} strokeWidth={1} strokeLinejoin="round" />
        </G>
      )}
      {!!head && (
        <G transform={`translate(${-r + 2} ${-r + 2})`}>
          <Circle cx={0} cy={0} r={6.5} fill={BASIL} stroke="#fff" strokeWidth={1.2} />
          <SvgText x={0} y={3.2} fontFamily={F.bold} fontSize={8.5} fill="#fff" textAnchor="middle">
            {head}
          </SvgText>
        </G>
      )}
    </G>
  );
});

/** Seconds of a departure spent as a coin flying to the HUD (it lands when the engine pays). */
export const COIN_FLIGHT = 0.55;

type Pt = [number, number];

export interface DepartureGeometry {
  /** Screen points a driver's pop rides along: counter pickup → inside the door → out on the sidewalk. */
  driverPath: Pt[];
  /** Where a walk-in's pop shows: over the register. */
  register: Pt;
  /** Where the coin lands: the HUD cash, at the top edge of the scene's view. */
  hud: Pt;
}

/** Interpolate a coin's arc from `a` to `b` at k (0..1): eases in and bows to the left of the goal bar. */
function coinAt(a: Pt, b: Pt, k: number): Pt {
  const e = k * k;
  const bow = Math.sin(k * Math.PI) * -40;
  return [a[0] + (b[0] - a[0]) * e + bow, a[1] + (b[1] - a[1]) * e];
}

/**
 * The pops and coins for this frame. `left(d)` is the departure's time to payment interpolated from the last
 * engine tick, so the coin lands exactly when the cash does. At most 2 pops (the older carriers' cash merges into
 * the newest number) and 3 coins are drawn; nothing is mounted at opacity 0 (M38).
 */
export function DeparturePops({ deps, left, geo }: { deps: readonly Departure[]; left: (d: Departure) => number; geo: DepartureGeometry }) {
  if (deps.length === 0) return null;
  const pops: Departure[] = [];
  const coins: Departure[] = [];
  for (let i = deps.length - 1; i >= 0; i--) {
    const d = deps[i];
    const l = left(d);
    if (l <= COIN_FLIGHT) {
      if (coins.length < 3) coins.push(d);
    } else pops.push(d);
  }
  const shownPops = pops.slice(0, 2);
  const merged = pops.slice(2).reduce((t, d) => ({ n: t.n + d.n, cash: t.cash + d.cash }), { n: 0, cash: 0 });
  return (
    <G>
      {shownPops.map((d, i) => {
        const l = left(d);
        const k = d.kind === 'driver' ? Math.min(1, Math.max(0, 1 - (l - COIN_FLIGHT) / (LINE.departSeconds - COIN_FLIGHT))) : 0;
        const [x, y] = d.kind === 'driver' ? along(geo.driverPath, k) : geo.register;
        const n = d.n + (i === 0 ? merged.n : 0);
        const cash = d.cash + (i === 0 ? merged.cash : 0);
        const text = n > 1 ? `×${n} · +${money(cash)}` : `+${money(cash)}`;
        const w = text.length * 6.6 + 14;
        // keep the whole pill on screen (the door is near the right edge in wide rooms)
        const px = Math.min(SCENE_W - 4 - w / 2, Math.max(4 + w / 2, x));
        return (
          <G key={d.id} transform={`translate(${px} ${y - 6})`}>
            <Rect x={-w / 2} y={-18} width={w} height={18} rx={8} fill={POP_FILL} stroke="#fff" strokeWidth={1.4} />
            <SvgText x={0} y={-5} fontFamily={F.bold} fontSize={12} fill="#fff" textAnchor="middle">
              {text}
            </SvgText>
          </G>
        );
      })}
      {coins.map((d) => {
        const start = d.kind === 'driver' ? geo.driverPath[geo.driverPath.length - 1] : geo.register;
        const k = Math.min(1, Math.max(0, 1 - left(d) / Math.min(COIN_FLIGHT, d.kind === 'driver' ? COIN_FLIGHT : LINE.handoffSeconds)));
        const [x, y] = coinAt([start[0], start[1] - 18], geo.hud, k);
        return (
          <G key={d.id}>
            <Circle cx={x} cy={y} r={7} fill={COIN} stroke={COIN_RIM} strokeWidth={1.6} />
            <Circle cx={x} cy={y} r={4.2} fill="none" stroke={COIN_RIM} strokeWidth={0.9} />
            <Circle cx={x - 2} cy={y - 2.2} r={1.3} fill="#fff" opacity={0.75} />
          </G>
        );
      })}
    </G>
  );
}

/** Speech pill a newly hired head says over their station for a moment. */
export const HireBubble = memo(function HireBubble({ x, y, text }: { x: number; y: number; text: string }) {
  const w = text.length * 5.6 + 16;
  return (
    <G transform={`translate(${x} ${y})`}>
      <Rect x={-w / 2} y={-14} width={w} height={18} rx={9} fill="#fff" stroke={INK} strokeWidth={1.2} />
      <Path d="M-4 4 L0 10 L4 4 Z" fill="#fff" stroke={INK} strokeWidth={1.2} strokeLinejoin="round" />
      <Rect x={-5} y={2.5} width={10} height={2.4} fill="#fff" />
      <SvgText x={0} y={-1.5} fontFamily={F.bold} fontSize={10} fill={INK} textAnchor="middle">
        {text}
      </SvgText>
    </G>
  );
});
