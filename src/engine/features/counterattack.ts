// Victor's weekly counter-attack (v5.15): once the city's last finale has been seen, every Monday 00:00 (local) MegaSlice targets
// one shop. While the attack is open that shop's value per pizza is x0.8. The player may defend: a 5-minute rush challenge to sell
// ceil(5 min x the shop's current pizza rate x 1.25) pies. A win ends the attack and pays 30 minutes of boost-free citywide income,
// 15 diamonds and (recipes.ts) that shop's card 4; a loss allows a retry 60 real minutes later; an attack nobody defends ends unpaid
// at the week's end. The week number only ever rises: a roll happens when it increases, never because the week's key changed
// (a time-zone change moves the key both ways; lesson C94, as in rewards.ts `refreshRewards`).
import { COUNTERATTACK } from '../../content/endgame';
import type { NeighborhoodId } from '../../content/types';
import { seededUnit } from '../bonus';
import { featureMults, finaleId, shopRate, SHOP_IDS, def, type BuyResult, type GameState } from '../game';
import { minutesToCash, resetCountdown, weekKey } from '../rewards';
import { withoutEvent } from './events';
import type { Feature } from './types';

export interface ChallengeState {
  /** Pies to sell, fixed when it starts. */
  target: number;
  /** The shop's lifetime `sold` when it started: progress = sold - startSold. */
  startSold: number;
  /** Play seconds left (the clock stops while the app is closed). */
  left: number;
}

/** How the last attack ended, for the UI to show once (`ackAttack`). */
export type AttackNews = { kind: 'won'; shopId: NeighborhoodId; cash: number; diamonds: number } | { kind: 'lost'; shopId: NeighborhoodId } | { kind: 'expired'; shopId: NeighborhoodId };

export interface AttackState {
  /** The first week number an attack may roll in; 0 = the finale hasn't been seen yet. */
  armedWeek: number;
  /** The highest week number seen since then: a roll needs a bigger one. */
  seenWeek: number;
  /** Last week's (or this week's) target: the next never repeats it. */
  target: NeighborhoodId | null;
  /** The target's attack is on: undefended and this week. */
  open: boolean;
  /** Shops defended at least once (recipes.ts: card 4). */
  defended: NeighborhoodId[];
  challenge: ChallengeState | null;
  /** Wall ms before which a lost challenge may not be retried. */
  retryAt: number;
  news: AttackNews | null;
}

export const KEY = 'counterattack';

const DAY_MS = 86_400_000;
/** Whole weeks since the first Monday of 1970: only ever grows with real time (the Monday of `ms`'s local week). */
export function weekNumber(ms: number): number {
  const [y, m, d] = weekKey(ms).split('-').map(Number);
  return Math.round((Date.UTC(y, m - 1, d) / DAY_MS - 4) / 7);
}

const fresh = (): AttackState => ({ armedWeek: 0, seenWeek: 0, target: null, open: false, defended: [], challenge: null, retryAt: 0, news: null });
const read = (g: GameState): AttackState => (g.x?.[KEY] as AttackState | undefined) ?? fresh();
const write = (g: GameState, s: AttackState): GameState => ({ ...g, x: { ...g.x, [KEY]: s } });

/** The last finale (the last neighbourhood's beat 4) has played: the attacks may start. */
export const finaleSeen = (g: GameState): boolean => g.seenScenes.includes(finaleId(SHOP_IDS[SHOP_IDS.length - 1]));

/** Shops that have been attacked and defended. */
export const defendedHoods = (g: GameState): readonly NeighborhoodId[] => read(g).defended;

/** This week's target: seeded by the week number, a built shop, never the previous target (unless it is the only one built). */
export function pickTarget(g: GameState, week: number, previous: NeighborhoodId | null): NeighborhoodId | null {
  const built = SHOP_IDS.filter((id) => g.shops[id].built);
  const pool = built.filter((id) => id !== previous);
  const from = pool.length ? pool : built;
  if (!from.length) return null;
  return from[Math.min(from.length - 1, Math.floor(seededUnit(week, from.length, COUNTERATTACK.seedSalt) * from.length))];
}

/** Pies the challenge asks for in `id` right now: ceil(5 min x the shop's current pizza rate x 1.25), at least 1. */
export function challengeTarget(g: GameState, id: NeighborhoodId, now: number): number {
  const rate = shopRate(g.shops[id], g.vehicle, featureMults(g, id, now));
  return Math.max(1, Math.ceil(COUNTERATTACK.challengeSeconds * rate * COUNTERATTACK.targetMargin));
}

/** Pies sold toward the running challenge, 0..target. */
export const challengeProgress = (g: GameState, id: NeighborhoodId, c: ChallengeState): number => Math.max(0, Math.min(c.target, Math.floor(g.shops[id].sold - c.startSold)));

/**
 * What a win pays right now: 30 minutes of citywide income with no boost and no event, and without the attack's own x0.8
 * (a win ends it), plus the diamonds. Cash is computed on a copy of the game where the attack is closed.
 */
function winCash(g: GameState): number {
  const closed = withoutEvent(write(g, { ...read(g), open: false }));
  return Math.floor(minutesToCash(closed, COUNTERATTACK.rewardMinutes));
}

export type AttackPhase = 'none' | 'open' | 'running' | 'retry';

export interface AttackView {
  phase: AttackPhase;
  shopId: NeighborhoodId | null;
  /** The shop's name, for the banner. */
  name: string;
  /** Seconds until the week ends and the attack with it (next Monday 00:00 local). */
  weekEndsIn: number;
  /** Pies the challenge asks for: fixed while it runs, otherwise what it would ask now. */
  target: number;
  /** Pies sold toward it (running only). */
  progress: number;
  /** Seconds of the challenge left (running only). */
  secondsLeft: number;
  /** Seconds until a lost challenge may be tried again (retry only). */
  retryIn: number;
  /** What a win pays now. */
  rewardCash: number;
  rewardDiamonds: number;
  /** The shop's value multiplier while the attack is open. */
  valueMult: number;
  news: AttackNews | null;
}

/** Everything the attack banner and sheet need, pure. `phase` 'none' = no attack (the finale hasn't played, or last week's ended). */
export function attackView(g: GameState, now: number): AttackView {
  const st = read(g);
  const id = st.open ? st.target : null;
  const base = { weekEndsIn: resetCountdown(now, 'week'), rewardDiamonds: COUNTERATTACK.rewardDiamonds, valueMult: COUNTERATTACK.valueMult, news: st.news };
  if (!id) return { ...base, phase: 'none', shopId: null, name: '', target: 0, progress: 0, secondsLeft: 0, retryIn: 0, rewardCash: 0 };
  const common = { ...base, shopId: id, name: def(id).name, rewardCash: winCash(g) };
  if (st.challenge) return { ...common, phase: 'running', target: st.challenge.target, progress: challengeProgress(g, id, st.challenge), secondsLeft: Math.max(0, Math.ceil(st.challenge.left)), retryIn: 0 };
  const wait = Math.max(0, Math.ceil((st.retryAt - now) / 1000));
  return { ...common, phase: wait > 0 ? 'retry' : 'open', target: challengeTarget(g, id, now), progress: 0, secondsLeft: 0, retryIn: wait };
}

/** Start the defence challenge: the attack is open, none is running and any retry wait is over. */
export function startChallenge(g: GameState, now: number): BuyResult {
  const st = read(g);
  const id = st.open ? st.target : null;
  if (!id) return { ok: false, reason: 'No attack to defend' };
  if (st.challenge) return { ok: false, reason: 'Already defending' };
  if (now < st.retryAt) return { ok: false, reason: 'Try again later' };
  const c: ChallengeState = { target: challengeTarget(g, id, now), startSold: Math.floor(g.shops[id].sold), left: COUNTERATTACK.challengeSeconds };
  return { ok: true, state: write(g, { ...st, challenge: c, news: null }) };
}

/** The UI has shown how the last attack ended. */
export function ackAttack(g: GameState): GameState {
  const st = read(g);
  return st.news ? write(g, { ...st, news: null }) : g;
}

/** A challenge won: the attack is over; pay the cash and the diamonds, remember the shop (recipes.ts). */
function win(g: GameState, st: AttackState, id: NeighborhoodId): GameState {
  const cash = winCash(g);
  const r = g.rewards;
  const next: AttackState = { ...st, open: false, challenge: null, retryAt: 0, defended: st.defended.includes(id) ? st.defended : [...st.defended, id], news: { kind: 'won', shopId: id, cash, diamonds: COUNTERATTACK.rewardDiamonds } };
  return write({ ...g, cash: g.cash + cash, totalEarned: g.totalEarned + cash, rewards: { ...r, diamonds: r.diamonds + COUNTERATTACK.rewardDiamonds } }, next);
}

/**
 * Keep the weeks: arm once the finale has been seen, and roll a new attack when the week number has increased.
 * Returns `g` itself when nothing changed.
 */
function weeks(g: GameState, now: number): GameState {
  if (!finaleSeen(g)) return g;
  const st = read(g);
  const w = weekNumber(now);
  if (!st.armedWeek) return write(g, { ...st, armedWeek: w + 1, seenWeek: w });
  if (w <= st.seenWeek) return g;
  if (w < st.armedWeek) return write(g, { ...st, seenWeek: w });
  const target = pickTarget(g, w, st.target);
  const expired = st.open && st.target ? ({ kind: 'expired', shopId: st.target } as const) : null;
  return write(g, { ...st, seenWeek: w, target, open: target !== null, challenge: null, retryAt: 0, news: expired ?? st.news });
}

/** The running challenge: won when the pies are sold, lost when the time runs out. */
function challenge(g: GameState, dt: number, now: number): GameState {
  const st = read(g);
  const c = st.challenge;
  const id = st.target;
  if (!c || !id || !st.open) return g;
  if (challengeProgress(g, id, c) >= c.target) return win(g, st, id);
  const left = c.left - dt;
  if (left > 0) return write(g, { ...st, challenge: { ...c, left } });
  return write(g, { ...st, challenge: null, retryAt: now + COUNTERATTACK.retryMs, news: { kind: 'lost', shopId: id } });
}

export const counterattack: Feature<AttackState> = {
  key: KEY,
  init: () => fresh(),
  migrate(raw) {
    if (!raw || typeof raw !== 'object') return fresh();
    const r = raw as Record<string, unknown>;
    const nat = (v: unknown) => (typeof v === 'number' && Number.isFinite(v) ? Math.max(0, Math.floor(v)) : 0);
    const hood = (v: unknown) => (SHOP_IDS.includes(v as NeighborhoodId) ? (v as NeighborhoodId) : null);
    const target = hood(r.target);
    const c = r.challenge && typeof r.challenge === 'object' ? (r.challenge as Record<string, unknown>) : null;
    const defended = Array.isArray(r.defended) ? [...new Set((r.defended as unknown[]).map(hood).filter((x): x is NeighborhoodId => x !== null))] : [];
    const challengeOk = !!c && nat(c.target) >= 1 && typeof c.left === 'number' && c.left > 0;
    const open = r.open === true && target !== null;
    return {
      armedWeek: nat(r.armedWeek),
      seenWeek: nat(r.seenWeek),
      target,
      open,
      defended,
      challenge: open && challengeOk && c ? { target: nat(c.target), startSold: nat(c.startSold), left: Math.min(COUNTERATTACK.challengeSeconds, c.left as number) } : null,
      retryAt: nat(r.retryAt),
      news: null,
    };
  },
  tick(g, dt, now) {
    return challenge(weeks(g, now), dt, now);
  },
  shopValueMult(g, id) {
    const st = read(g);
    return st.open && st.target === id ? COUNTERATTACK.valueMult : 1;
  },
  onOffline(g, seconds, now) {
    // pies sold while away must not finish a challenge the player wasn't there for: it lapses (no cooldown)
    let next = weeks(g, now);
    const st = read(next);
    if (st.challenge && seconds >= 1) next = write(next, { ...st, challenge: null });
    return next;
  },
};
