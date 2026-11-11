// What the order chip shows, as plain data (the chip is components/order-chip.tsx). Kept in .ts so it is tested in node.
import { ORDER_FAIL_LINE } from '../content/hooks';
import type { CharacterId, NeighborhoodId } from '../content/types';
import { money, pizzas } from '../engine/format';
import type { GameState } from '../engine/game';
import { castOf, offerLine, orderProgress, orderReward } from '../engine/orders';

export type ChipPhase = 'none' | 'offer' | 'active' | 'done' | 'failed';

/** Which chip is up. An order in progress wins over everything; a result shows only once the order is over. */
export function chipPhase(s: GameState): ChipPhase {
  const o = s.order;
  if (o.active) return 'active';
  if (o.offer) return 'offer';
  return o.result ? o.result.kind : 'none';
}

/** "1:05": the clock on the active chip. */
export function clockText(seconds: number): string {
  const t = Math.max(0, Math.ceil(seconds));
  return `${Math.floor(t / 60)}:${String(t % 60).padStart(2, '0')}`;
}

/** "23 / 40 pies". */
export const progressText = (done: number, target: number): string => `${pizzas(done)} / ${pizzas(target)} pies`;

/** The last 15 seconds: the clock turns red. */
export const URGENT_SECONDS = 15;

export interface ChipView {
  phase: Exclude<ChipPhase, 'none'>;
  hood: NeighborhoodId;
  who: CharacterId;
  name: string;
  /** Offer: what they ask · done: their thanks · failed: the quiet line. Not shown on the active chip. */
  line: string;
  /** Active: pies sold, the target, the bar's fill 0..1, the words under it. */
  done: number;
  target: number;
  fill: number;
  progress: string;
  /** Active: the clock. */
  clock: string;
  urgent: boolean;
  /** Active: what finishing pays now · done: what it paid. "+$X" */
  reward: string;
}

/** The chip for the current state, or null when there is nothing to show. */
export function chipView(s: GameState): ChipView | null {
  const o = s.order;
  const phase = chipPhase(s);
  if (phase === 'none') return null;
  const base = { done: 0, target: 0, fill: 0, progress: '', clock: '', urgent: false, reward: '', line: '' };
  if (phase === 'active' && o.active) {
    const a = o.active;
    const cast = castOf(a.hood);
    const done = orderProgress(s, a);
    return { ...base, phase, hood: a.hood, who: cast.who, name: cast.name, done, target: a.target, fill: a.target > 0 ? done / a.target : 0, progress: progressText(done, a.target), clock: clockText(a.left), urgent: a.left <= URGENT_SECONDS, reward: `+${money(orderReward(s))}` };
  }
  if (phase === 'offer' && o.offer) {
    const f = o.offer;
    const cast = castOf(f.hood);
    return { ...base, phase, hood: f.hood, who: cast.who, name: cast.name, line: offerLine(cast, f.variant, f.target), target: f.target, reward: `+${money(orderReward(s))}` };
  }
  const r = o.result;
  if (!r) return null;
  const cast = castOf(r.hood);
  return { ...base, phase: r.kind, hood: r.hood, who: cast.who, name: cast.name, line: r.kind === 'done' ? cast.thanks[r.variant] : ORDER_FAIL_LINE, reward: r.kind === 'done' ? `+${money(r.reward)}` : '' };
}
