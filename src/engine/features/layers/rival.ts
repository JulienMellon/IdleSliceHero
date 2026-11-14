// The rival (v5.16): once a neighbourhood's beat 3 has been seen, a MegaSlice shop is open across the street there and that shop's
// value per pizza is x0.8. A challenge becomes available: sell ceil(5 min x the shop's current pizza rate x 1.2) pies in 5 minutes
// (play time). Winning closes the rival for good and sets `challengeWon(g, id)` (the story's beat 4 reads it). Losing costs
// nothing; retry after 2 minutes of play. Existing saves: a neighbourhood whose beat 4 is already seen has the rival closed and the
// challenge won (read from the seen scenes, so no migration has to guess). Inactive until the shop is built.
import { LAYER_KEYS, RIVAL } from '../../../content/layers';
import type { NeighborhoodId } from '../../../content/types';
import { featureMults, finaleId, sceneId, shopRate, SHOP_IDS, type BuyResult, type GameState } from '../../game';
import type { Feature } from '../types';

export interface RivalChallenge {
  hood: NeighborhoodId;
  /** Pies to sell, fixed when it starts. */
  target: number;
  /** The shop's lifetime `sold` when it started: progress = sold - startSold. */
  startSold: number;
  /** Play seconds left. */
  left: number;
}

export interface RivalState {
  /** Neighbourhoods whose challenge was won here (a seen beat 4 counts too: `challengeWon`). */
  won: NeighborhoodId[];
  /** The challenge running, if any (one at a time). */
  challenge: RivalChallenge | null;
  /** Per neighbourhood: the play second before which a lost challenge may not be retried. */
  retryAt: Partial<Record<NeighborhoodId, number>>;
}

const fresh = (): RivalState => ({ won: [], challenge: null, retryAt: {} });
const read = (g: GameState): RivalState => (g.x?.[LAYER_KEYS.rival] as RivalState | undefined) ?? fresh();
const write = (g: GameState, s: RivalState): GameState => ({ ...g, x: { ...g.x, [LAYER_KEYS.rival]: s } });
const beat = (id: NeighborhoodId) => sceneId(id, RIVAL.beat as 3);

/** The neighbourhood's challenge is won (or its finale was already seen, in a save from before the rival). */
export const challengeWon = (g: GameState, id: NeighborhoodId): boolean => read(g).won.includes(id) || g.seenScenes.includes(finaleId(id));

/** The MegaSlice shop across the street is open: beat 3 seen, the shop built and the challenge not yet won. */
export const rivalOpen = (g: GameState, id: NeighborhoodId): boolean => !!g.shops[id]?.built && g.seenScenes.includes(beat(id)) && !challengeWon(g, id);

/** Pies the challenge asks for in `id` right now: ceil(5 min x the shop's current pizza rate x 1.2), at least 1. */
export function rivalTarget(g: GameState, id: NeighborhoodId, now: number): number {
  const rate = shopRate(g.shops[id], g.vehicle, featureMults(g, id, now));
  return Math.max(1, Math.ceil(RIVAL.challengeSeconds * rate * RIVAL.targetMargin));
}

const progressOf = (g: GameState, c: RivalChallenge): number => Math.max(0, Math.min(c.target, Math.floor(g.shops[c.hood].sold - c.startSold)));

export type RivalPhase = 'none' | 'available' | 'running' | 'retry';

export interface RivalView {
  /** The rival's shop is open here (its x0.8 is on). */
  open: boolean;
  won: boolean;
  /** 'available' = may start; 'running'; 'retry' = lost, waiting; 'none' = no rival here (not open, or another challenge is running). */
  phase: RivalPhase;
  /** Pies asked: fixed while it runs, otherwise what it would ask now. */
  target: number;
  progress: number;
  /** Seconds of the challenge left (running only). */
  secondsLeft: number;
  /** Seconds until a retry (retry only). */
  retryIn: number;
  /** The shop's value multiplier while the rival is open. */
  valueMult: number;
}

/** Everything the rival's banner and challenge card need for one shop, pure. */
export function rivalView(g: GameState, id: NeighborhoodId, now: number): RivalView {
  const won = challengeWon(g, id);
  const open = rivalOpen(g, id);
  const base = { open, won, valueMult: open ? RIVAL.valueMult : 1 };
  if (!open) return { ...base, phase: 'none', target: 0, progress: 0, secondsLeft: 0, retryIn: 0 };
  const st = read(g);
  const c = st.challenge;
  if (c && c.hood === id) return { ...base, phase: 'running', target: c.target, progress: progressOf(g, c), secondsLeft: Math.max(0, Math.ceil(c.left)), retryIn: 0 };
  const wait = Math.max(0, Math.ceil((st.retryAt[id] ?? 0) - g.playSeconds));
  return { ...base, phase: wait > 0 ? 'retry' : 'available', target: rivalTarget(g, id, now), progress: 0, secondsLeft: 0, retryIn: wait };
}

/** Start the challenge in `id`: the rival is open, none is running and any retry wait is over. */
export function startRivalChallenge(g: GameState, id: NeighborhoodId, now: number): BuyResult {
  if (!rivalOpen(g, id)) return { ok: false, reason: 'No rival to outsell here' };
  const st = read(g);
  if (st.challenge) return { ok: false, reason: 'Already outselling a rival' };
  if (g.playSeconds < (st.retryAt[id] ?? 0)) return { ok: false, reason: 'Try again later' };
  const c: RivalChallenge = { hood: id, target: rivalTarget(g, id, now), startSold: Math.floor(g.shops[id].sold), left: RIVAL.challengeSeconds };
  return { ok: true, state: write(g, { ...st, challenge: c }) };
}

/** The running challenge: won when the pies are sold, lost when the time runs out. */
function challengeTick(g: GameState, dt: number): GameState {
  const st = read(g);
  const c = st.challenge;
  if (!c) return g;
  if (!rivalOpen(g, c.hood)) return write(g, { ...st, challenge: null });
  if (progressOf(g, c) >= c.target) return write(g, { ...st, challenge: null, won: st.won.includes(c.hood) ? st.won : [...st.won, c.hood] });
  const left = c.left - dt;
  if (left > 0) return write(g, { ...st, challenge: { ...c, left } });
  return write(g, { ...st, challenge: null, retryAt: { ...st.retryAt, [c.hood]: g.playSeconds + RIVAL.retrySeconds } });
}

export const rival: Feature<RivalState> = {
  key: LAYER_KEYS.rival,
  init: fresh,
  migrate(raw) {
    if (!raw || typeof raw !== 'object') return fresh();
    const r = raw as Record<string, unknown>;
    const hood = (v: unknown) => (SHOP_IDS.includes(v as NeighborhoodId) ? (v as NeighborhoodId) : null);
    const nat = (v: unknown) => (typeof v === 'number' && Number.isFinite(v) ? Math.max(0, Math.floor(v)) : 0);
    const won = Array.isArray(r.won) ? [...new Set((r.won as unknown[]).map(hood).filter((x): x is NeighborhoodId => x !== null))] : [];
    const c = r.challenge && typeof r.challenge === 'object' ? (r.challenge as Record<string, unknown>) : null;
    const ch = c && hood(c.hood) && nat(c.target) >= 1 && typeof c.left === 'number' && c.left > 0 ? { hood: hood(c.hood) as NeighborhoodId, target: nat(c.target), startSold: nat(c.startSold), left: Math.min(RIVAL.challengeSeconds, c.left) } : null;
    const retryAt: Partial<Record<NeighborhoodId, number>> = {};
    if (r.retryAt && typeof r.retryAt === 'object') for (const id of SHOP_IDS) if (typeof (r.retryAt as Record<string, unknown>)[id] === 'number') retryAt[id] = nat((r.retryAt as Record<string, unknown>)[id]);
    return { won, challenge: ch, retryAt };
  },
  tick(g, dt) {
    return challengeTick(g, dt);
  },
  shopKey(g, id) {
    return rivalOpen(g, id) ? 'rival' : '';
  },
  shopValueMult(g, id) {
    return rivalOpen(g, id) ? RIVAL.valueMult : 1;
  },
  onOffline(g, _seconds, _now, before) {
    // play time only: the time away does not run the challenge's clock, and the pies the shops sold meanwhile do not count toward it
    const c = read(g).challenge;
    if (!c) return g;
    const away = Math.max(0, Math.floor(g.shops[c.hood].sold) - Math.floor(before.shops[c.hood].sold));
    return away > 0 ? write(g, { ...read(g), challenge: { ...c, startSold: c.startSold + away } }) : g;
  },
};
