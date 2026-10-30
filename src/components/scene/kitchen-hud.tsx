// The kitchen's feedback layer (playtest 2, v4.8): a ring-timer badge over each station and the "+$X" pop that
// rides out with every departure, turning into a coin that lands on the HUD cash when the cash does.
import { memo } from 'react';
import { Circle, G, Path, Rect, Text as SvgText } from 'react-native-svg';

import { money } from '../../engine/format';
import { LINE, type Departure } from '../../engine/pipeline';
import { F } from '../../theme';
import { BADGE_R, COIN_FLIGHT, popModels, type BadgeTone } from './stations';
import { HeadFace } from './head-face';
import type { HeadKind } from '../../content/tuning';
import { INK, SCENE_W } from './projection';

const BASIL = '#4CAF50';
const TOMATO = '#E5483A';
const TRACK = '#E9DCC3';
const DISC = '#FFF8EA';
const OUTLINE = '#4A2A1A';
const POP_FILL = '#2E8B3E';

/** Arc path for a ring filled to step/24 (clockwise from 12 o'clock). */
function arc(cx: number, cy: number, r: number, step: number) {
  if (step <= 0) return '';
  if (step >= 24) return `M${cx} ${cy - r} A${r} ${r} 0 1 1 ${cx - 0.01} ${cy - r}`;
  const a = (step / 24) * Math.PI * 2;
  const x = cx + r * Math.sin(a);
  const y = cy - r * Math.cos(a);
  return `M${cx} ${cy - r} A${r} ${r} 0 ${a > Math.PI ? 1 : 0} 1 ${x.toFixed(2)} ${y.toFixed(2)}`;
}

const PIE_ICON = 'M-6 -4.5 Q0 -7.5 6 -4.5 L0 7.5 Z';

/** The dark ticket rail the badges hang on, so the row reads as one object instead of pasted on the awning (D346). */
export const BadgeRail = memo(function BadgeRail({ x0, x1, y, gm }: { x0: number; x1: number; y: number; gm: string | null }) {
  return (
    <G>
      <Rect x={x0} y={y - 15} width={x1 - x0} height={30} rx={15} fill={OUTLINE} opacity={0.85} />
      <Rect x={x0 + 6} y={y - 14} width={x1 - x0 - 12} height={2} rx={1} fill="#fff" opacity={0.18} />
      {/* the General Manager runs every station: one chip at the rail's left end, not three clones (D355) */}
      {gm && (
        <G transform={`translate(${x0 - 4} ${y})`}>
          <Circle cx={0} cy={0} r={11} fill="#FFF8EA" stroke={OUTLINE} strokeWidth={1.4} />
          <HeadFace kind="gm" name={gm} size={21} />
        </G>
      )}
    </G>
  );
});

/**
 * One station's badge. Memoised on primitives only (M36/M43): `step` changes at most ~8 times a second and `pulse`
 * / `nudge` / `jump` are quantised, so most frames re-render nothing. `count` is the pies in the job (or waiting,
 * "×4" for the next prep batch); `ready` pulses with a hand (tap me), and `nudge` bounces it after a missed tap;
 * `face` is the head (or GM) who runs the station, drawn as a small bust (D345), or null when the player taps it.
 */
export const StationBadge = memo(function StationBadge({ x, y, step, count, tone, ready, pulse, nudge, face, faceName, jump }: { x: number; y: number; step: number; count: string; tone: BadgeTone; ready: boolean; pulse: number; nudge: number; face: HeadKind | 'gm' | null; faceName: string; jump: number }) {
  const s = (ready ? 1 + 0.12 * pulse : 1) * (1 + 0.18 * jump);
  const r = BADGE_R;
  const pillW = Math.max(18, count.length * 6.2 + 10);
  return (
    <G transform={`translate(${x} ${y})`}>
      <G transform={`scale(${s})`}>
        <Circle cx={0} cy={0} r={r + 1.5} fill={DISC} stroke={OUTLINE} strokeWidth={1.5} />
        <Circle cx={0} cy={0} r={r - 2.5} fill="none" stroke={TRACK} strokeWidth={3} />
        {step > 0 && <Path d={arc(0, 0, r - 2.5, step)} fill="none" stroke={tone === 'tomato' ? TOMATO : BASIL} strokeWidth={3} strokeLinecap="round" />}
        <Path d={PIE_ICON} fill="#FFC531" stroke={INK} strokeWidth={0.9} strokeLinejoin="round" />
        <Path d="M-6 -4.5 Q0 -7.5 6 -4.5 L5.2 -3 Q0 -5.6 -5.2 -3 Z" fill="#E9A64B" />
        <Circle cx={-1.2} cy={-1.4} r={1.2} fill="#E8432E" />
        <Circle cx={1.4} cy={2} r={1} fill="#E8432E" />
      </G>
      {/* the count pill sits to the right of the ring (late-game batches are 4+ digits) */}
      <Rect x={r + 3} y={-7.5} width={pillW} height={15} rx={7.5} fill={INK} stroke="#fff" strokeWidth={1.2} />
      <SvgText x={r + 3 + pillW / 2} y={4} fontFamily={F.bold} fontSize={11} fill="#fff" textAnchor="middle">
        {count}
      </SvgText>
      {ready && (
        // a pointing hand on the ring's lower left: tap this station (bounces 1.4× after a missed tap)
        <G transform={`translate(${-r + 1} ${r - 2}) rotate(-30) scale(${1 + 0.4 * nudge})`}>
          <Path d="M0 -7 Q1.6 -7 1.6 -5 L1.6 -1 L5 -0.4 Q6.6 0 6.2 2 L5 6 Q4.4 7.4 3 7.4 L-2.4 7.4 Q-4 7.4 -4.4 6 L-5.6 1.6 Q-5.8 0 -4.2 0.2 L-1.6 1 L-1.6 -5 Q-1.6 -7 0 -7 Z" fill="#fff" stroke={INK} strokeWidth={1} strokeLinejoin="round" />
        </G>
      )}
      {face && (
        <G transform={`translate(${-r - 1} ${r - 3})`}>
          <Circle cx={0} cy={0} r={9} fill="#FFF8EA" stroke={OUTLINE} strokeWidth={1.2} />
          <HeadFace kind={face} name={faceName} size={17} />
        </G>
      )}
    </G>
  );
});

type Pt = [number, number];

/**
 * The "+$X" pops for this frame (`popModels` picks them). Each rides 40 above its carrier's head (`anchor`; the
 * register for a walk-in with nobody to hand it to), drifting up and fading over its last 0.2 s before it becomes
 * a coin (the coin itself flies in the screen overlay, `CoinLayer`). Nothing is mounted at opacity 0 (M38).
 */
export function DeparturePops({ deps, left, anchor, register }: { deps: readonly Departure[]; left: (d: Departure) => number; anchor: (d: Departure) => Pt | null; register: Pt }) {
  if (deps.length === 0) return null;
  const shown = popModels(deps, left);
  return (
    <G>
      {shown.map(({ dep: d, n, cash }) => {
        const l = left(d);
        const span = d.kind === 'driver' ? LINE.departSeconds - COIN_FLIGHT : LINE.handoffSeconds;
        const rest = d.kind === 'driver' ? l - COIN_FLIGHT : l;
        const k = Math.min(1, Math.max(0, 1 - rest / span));
        const at = anchor(d) ?? register;
        const text = n > 1 ? `×${n} · +${money(cash)}` : `+${money(cash)}`;
        const w = text.length * 6.6 + 14;
        // keep the whole pill on screen (the door is near the right edge in wide rooms)
        const px = Math.min(SCENE_W - 4 - w / 2, Math.max(4 + w / 2, at[0]));
        const py = at[1] - 40 - k * 10;
        const fade = rest < 0.2 ? Math.max(0, rest / 0.2) : 1;
        if (fade <= 0) return null;
        return (
          <G key={d.id} transform={`translate(${px} ${py})`} opacity={fade}>
            <Rect x={-w / 2} y={-18} width={w} height={18} rx={8} fill={POP_FILL} stroke="#fff" strokeWidth={1.4} />
            <SvgText x={0} y={-5} fontFamily={F.bold} fontSize={12} fill="#fff" textAnchor="middle">
              {text}
            </SvgText>
          </G>
        );
      })}
    </G>
  );
}

/**
 * Speech pill under a station's badge: a newly hired head's hello, or (tone "refusal") why a tap didn't start.
 * Clamped to the screen like the pops (C77); the tail points up at the badge.
 */
export const HireBubble = memo(function HireBubble({ x, y, text, tone = 'hire' }: { x: number; y: number; text: string; tone?: 'hire' | 'refusal' }) {
  const w = text.length * 5.6 + 16;
  const px = Math.min(SCENE_W - 4 - w / 2, Math.max(4 + w / 2, x));
  const fill = tone === 'refusal' ? DISC : '#fff';
  return (
    <G transform={`translate(${px} ${y})`}>
      <Path d={`M${x - px - 4} -14 L${x - px} -20 L${x - px + 4} -14 Z`} fill={fill} stroke={INK} strokeWidth={1.2} strokeLinejoin="round" />
      <Rect x={-w / 2} y={-14} width={w} height={18} rx={9} fill={fill} stroke={INK} strokeWidth={1.2} />
      <SvgText x={0} y={-1.5} fontFamily={F.bold} fontSize={10} fill={INK} textAnchor="middle">
        {text}
      </SvgText>
    </G>
  );
});
