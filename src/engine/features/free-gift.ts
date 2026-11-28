// The free gift (v5.25, card E9). A gift waits in the shop 120 s into active play, then one is ready 4 hours of real (wall) time after the last
// was claimed. The time counts while the app is closed, but one waits at most: a long absence does not bank more. Claiming it pays cash worth
// 5 minutes of the shop's income at that moment (whole dollars) and, on every third claim, 10 diamonds; `claimFreeGift` returns a
// `free_gift_claimed { cash, diamonds }` event for the scene, the sheet and the sounds. The save is the slice `x.freeGift` (a franchise keeps it:
// it is the player's clock, not the city's). Numbers: content/free-gift.ts.
import { FREE_GIFT } from '../../content/free-gift';
import type { GameState } from '../game';
import { clockBehind, minutesToCash } from '../rewards';
import type { Feature } from './types';

export const KEY = 'freeGift';

export interface FreeGiftState {
  /** Wall ms the next gift is ready; 0 until the first has been claimed (the first one waits for `firstAtPlaySeconds` of play instead). */
  nextAt: number;
  /** Gifts claimed so far (every `diamondsEvery`-th holds diamonds). */
  count: number;
  /** A gift is waiting. Never more than one. */
  ready: boolean;
}

/** What `claimFreeGift` emits for the scene, the sheet and the sounds. */
export interface FreeGiftClaimedEvent {
  type: 'free_gift_claimed';
  cash: number;
  diamonds: number;
}
export type ClaimFreeGiftResult = { ok: true; state: GameState; event: FreeGiftClaimedEvent } | { ok: false; reason: string };

const fresh = (): FreeGiftState => ({ nextAt: 0, count: 0, ready: false });
const read = (g: GameState): FreeGiftState => (g.x?.[KEY] as FreeGiftState | undefined) ?? fresh();
const write = (g: GameState, s: FreeGiftState): GameState => ({ ...g, x: { ...g.x, [KEY]: s } });

/** The gift is due at `now`: the first one at 120 s of play, the later ones when their wall time has come. */
const due = (g: GameState, s: FreeGiftState, now: number): boolean => (s.nextAt === 0 ? g.playSeconds >= FREE_GIFT.firstAtPlaySeconds : now >= s.nextAt);

/** A free gift is waiting in the shop at `now`. */
export const freeGiftReady = (g: GameState, now: number): boolean => {
  const s = read(g);
  return s.ready || due(g, s, now);
};

/** Seconds until the next gift is ready, 0 when one is waiting (the first one counts play seconds, the later ones real time). */
export function freeGiftIn(g: GameState, now: number): number {
  const s = read(g);
  if (s.ready || due(g, s, now)) return 0;
  return Math.ceil(s.nextAt === 0 ? FREE_GIFT.firstAtPlaySeconds - g.playSeconds : (s.nextAt - now) / 1000);
}

/** The cash the gift would pay now: 5 minutes of the shop's income, whole dollars, at least $1. */
export const freeGiftCash = (g: GameState): number => Math.max(1, Math.floor(minutesToCash(g, FREE_GIFT.cashMinutes)));

/** Diamonds the next claim holds: 10 on every third claim, else 0. */
export const freeGiftDiamonds = (g: GameState): number => ((read(g).count + 1) % FREE_GIFT.diamondsEvery === 0 ? FREE_GIFT.diamonds : 0);

/** Claim the waiting gift at `now`. A refusal (none waiting, the clock set back) takes and gives nothing. */
export function claimFreeGift(g: GameState, now: number): ClaimFreeGiftResult {
  if (!freeGiftReady(g, now)) return { ok: false, reason: 'No gift waiting' };
  if (clockBehind(g, now)) return { ok: false, reason: 'Check your clock' };
  const s = read(g);
  const cash = freeGiftCash(g);
  const diamonds = freeGiftDiamonds(g);
  const paid: GameState = {
    ...g,
    cash: g.cash + cash,
    totalEarned: g.totalEarned + cash,
    rewards: { ...g.rewards, diamonds: g.rewards.diamonds + diamonds, lastSeen: Math.max(g.rewards.lastSeen, now) },
  };
  const state = write(paid, { nextAt: now + FREE_GIFT.everyMs, count: s.count + 1, ready: false });
  return { ok: true, state, event: { type: 'free_gift_claimed', cash, diamonds } };
}

/** A gift becomes ready (once; none stacks), and a next time set further ahead than one wait (a clock wound back after a claim) is pulled in. */
function step(g: GameState, now: number): GameState {
  const s = read(g);
  const nextAt = s.nextAt > now + FREE_GIFT.everyMs ? now + FREE_GIFT.everyMs : s.nextAt;
  const ready = s.ready || due(g, { ...s, nextAt }, now);
  return ready === s.ready && nextAt === s.nextAt && g.x?.[KEY] ? g : write(g, { ...s, nextAt, ready });
}

export const freeGiftFeature: Feature<FreeGiftState> = {
  key: KEY,
  init: fresh,
  migrate(raw) {
    if (!raw || typeof raw !== 'object') return fresh();
    const r = raw as Record<string, unknown>;
    const num = (v: unknown) => (typeof v === 'number' && Number.isFinite(v) ? Math.max(0, v) : 0);
    return { nextAt: Math.floor(num(r.nextAt)), count: Math.floor(num(r.count)), ready: r.ready === true };
  },
  tick: (g, _dt, now) => step(g, now),
  // the time away counts: a gift whose time came while the app was closed is waiting on return
  onOffline: (g, _seconds, now) => step(g, now),
};
