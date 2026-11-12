// What Victor's counter-attack shows, as plain data (v5.15): the banner, the challenge chip and the result lines.
// The rules are engine/features/counterattack.ts (`attackView`); the words are the copy table. Pure: unit-tested in node.
import { ORDER } from '../../content/hooks';
import { COUNTERATTACK } from '../../content/endgame';
import type { CharacterId, NeighborhoodId } from '../../content/types';
// the engine's game module first: game -> features -> game is a cycle, and it only resolves when game loads before a feature
import '../../engine/game';
import { challengeProgress, KEY as ATTACK_KEY, type AttackState, type AttackView } from '../../engine/features/counterattack';
import type { GameState } from '../../engine/game';
import { castOf } from '../../engine/orders';
import { behindPace, clockText, progressText, URGENT_SECONDS } from '../order-model';
import { copy, copyOr, speakerOf } from './copy-text';

/** Bars move in steps of 5% (0..20 steps), so a chip repaints a bar rarely: never once per game tick. */
export const BAR_STEPS = 20;
export const barStep = (share: number): number => Math.round(Math.max(0, Math.min(1, Number.isFinite(share) ? share : 0)) * BAR_STEPS);
export const barPct = (step: number): number => (Math.max(0, Math.min(BAR_STEPS, step)) / BAR_STEPS) * 100;

/** Which face the attack shows: the banner (open, or waiting for a retry), the running chip, or how it ended. */
export type AttackFace = 'none' | 'banner' | 'running' | 'won' | 'lost';

export function attackFace(v: AttackView): AttackFace {
  if (v.phase === 'running') return 'running';
  if (v.news?.kind === 'won') return 'won';
  if (v.news?.kind === 'lost') return 'lost';
  return v.phase === 'open' || v.phase === 'retry' ? 'banner' : 'none';
}

/** "2d 4h" / "5h 10m" / "42m": how long the week leaves the attack open. */
export function weekLeftText(seconds: number): string {
  const s = Math.max(0, Math.ceil(seconds));
  const d = Math.floor(s / 86_400);
  const h = Math.floor((s % 86_400) / 3600);
  const m = Math.floor((s % 3600) / 60);
  if (d > 0) return `${d}d ${h}h`;
  if (h > 0) return `${h}h ${m}m`;
  return `${Math.max(1, m)}m`;
}

/** "Retry in 42m": the wait after a lost challenge. */
export const retryText = (seconds: number): string => `Retry in ${weekLeftText(seconds)}`;

export interface BannerView {
  shopId: NeighborhoodId;
  /** "Suburbs": names the shop. */
  name: string;
  /** "MegaSlice is coming! Defend your shop." */
  title: string;
  /** Victor's announcement for this shop. */
  victor: string;
  /** How long until the week ends the attack. */
  ends: string;
  /** The Defend button: enabled, or waiting for the retry. */
  canDefend: boolean;
  button: string;
}

/** The banner while an attack is open (or its retry wait runs); null otherwise. */
export function bannerView(v: AttackView): BannerView | null {
  if (attackFace(v) !== 'banner' || !v.shopId) return null;
  const wait = v.phase === 'retry';
  return {
    shopId: v.shopId,
    name: v.name,
    title: copy('attack.banner'),
    victor: copyOr(`attack.${v.shopId}.open`) ?? '',
    ends: weekLeftText(v.weekEndsIn),
    canDefend: !wait,
    button: wait ? retryText(v.retryIn) : 'Defend',
  };
}

export interface ChallengeView {
  shopId: NeighborhoodId;
  /** "MegaSlice Counter-Attack". */
  title: string;
  name: string;
  /** "23 / 40 pies". */
  progress: string;
  /** The pies' bar, in 5% steps. */
  fillStep: number;
  /** The draining time bar, in 5% steps (20 = the whole five minutes left). */
  drainStep: number;
  /** "4:12". */
  clock: string;
  urgent: boolean;
  /** The pies are behind the clock: the chip says "tap to rush!" (the same pace rule as the orders, D442). */
  behind: boolean;
  /** "+$12.3K". Spelled out by the chip's own formatter. */
  rewardCash: number;
  rewardDiamonds: number;
}

/**
 * D442's pace rule (order-model `behindPace`, one rule in one place) on the challenge's own clock: the seconds left are scaled to
 * the order window the rule is written for, so "behind" means the same share of the time used in both.
 */
export const behindChallenge = (done: number, target: number, secondsLeft: number): boolean => behindPace(done, target, (secondsLeft * ORDER.windowSeconds) / COUNTERATTACK.challengeSeconds);

/** The running challenge's chip; null unless a challenge is running. */
export function challengeView(v: AttackView): ChallengeView | null {
  if (v.phase !== 'running' || !v.shopId) return null;
  return {
    shopId: v.shopId,
    title: copy('attack.chip.title'),
    name: v.name,
    progress: progressText(v.progress, v.target),
    fillStep: barStep(v.target > 0 ? v.progress / v.target : 0),
    drainStep: barStep(v.secondsLeft / COUNTERATTACK.challengeSeconds),
    clock: clockText(v.secondsLeft),
    urgent: v.secondsLeft <= URGENT_SECONDS,
    behind: behindChallenge(v.progress, v.target, v.secondsLeft),
    rewardCash: v.rewardCash,
    rewardDiamonds: v.rewardDiamonds,
  };
}

export interface ResultView {
  kind: 'won' | 'lost';
  shopId: NeighborhoodId;
  who: CharacterId;
  /** The shop's character, who says the line. */
  speaker: string;
  line: string;
  /** Won only: what it paid ("+15" diamonds are in `diamonds`). */
  cash: number;
  diamonds: number;
}

/** How the last attack ended, for the chip to show once: the shop's character's win or lose line. Null for no news, and for an attack that expired unpaid (no line is written for it). */
export function resultView(v: AttackView): ResultView | null {
  const n = v.news;
  if (!n || n.kind === 'expired') return null;
  const key = `attack.${n.shopId}.${n.kind === 'won' ? 'win' : 'lose'}`;
  const cast = castOf(n.shopId);
  return { kind: n.kind, shopId: n.shopId, who: cast.who, speaker: speakerOf(key) ?? cast.name, line: copyOr(key) ?? '', cash: n.kind === 'won' ? n.cash : 0, diamonds: n.kind === 'won' ? n.diamonds : 0 };
}

/** The "+15 diamonds" line of a win. */
export const winDiamondsText = (n: number): string => `+${Math.floor(n)} diamonds`;

/** How long a result stays on the chip before it is acknowledged (ms). */
export const RESULT_MS = 6000;

/**
 * The attack in a few primitives, read straight off the feature's state (no `attackView`, which prices the win): what the chips
 * subscribe to, so a game tick that changes nothing here repaints nothing. `left` is whole seconds, `step` the pies' bar in 5% steps.
 */
export function attackLite(g: GameState): { face: AttackFace; shopId: NeighborhoodId | null; left: number; step: number } {
  const st = g.x?.[ATTACK_KEY] as AttackState | undefined;
  const id = st?.open ? st.target : null;
  const none = { face: 'none' as AttackFace, shopId: null, left: 0, step: 0 };
  if (!st) return none;
  const c = st.challenge;
  if (id && c) return { face: 'running', shopId: id, left: Math.max(0, Math.ceil(c.left)), step: barStep(c.target > 0 ? challengeProgress(g, id, c) / c.target : 0) };
  if (st.news?.kind === 'won' || st.news?.kind === 'lost') return { face: st.news.kind, shopId: st.news.shopId, left: 0, step: 0 };
  return id ? { face: 'banner', shopId: id, left: 0, step: 0 } : none;
}
