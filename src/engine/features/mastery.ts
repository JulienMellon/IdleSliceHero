// Shop mastery (v5.15): three stars per shop, 18 in the city. A star is earned by hiring all three station heads, growing to the
// top footprint (the Flagship), and installing the top oven grade (the Golden oven). Each star pays 10 diamonds once and raises a
// `mastery` pulse (the UI reads `fresh`); the totals 6 and 12 give the next weekly-rotation cosmetic the player doesn't own, and 18
// gives the master plaque. Pure rules: the state is only what has been paid, the stars themselves are read off the shops.
import { MASTERY, MASTERY_STARS, type MasteryStar } from '../../content/endgame';
import { WEEKLY_COSMETICS } from '../../content/rewards';
import { FOOTPRINTS, HEAD_KINDS, NEIGHBORHOODS, OVEN_GRADES } from '../../content/tuning';
import type { NeighborhoodId } from '../../content/types';
import { allHeadsHired, SHOP_IDS, type GameState, type Shop } from '../game';
import { grantCosmetic } from '../rewards';
import type { Feature } from './types';

/** One thing the UI should celebrate once: a star just earned, or a cosmetic a milestone just gave. */
export type MasteryNews = { kind: 'star'; shopId: NeighborhoodId; star: MasteryStar } | { kind: 'cosmetic'; id: string };

/** What the one-time catch-up on an old save paid. */
export interface MasterySummary {
  stars: number;
  diamonds: number;
  cosmetics: string[];
}

export interface MasteryState {
  /** `${shopId}:${star}` of every star already paid. */
  announced: string[];
  /** The totals (6, 12, 18) whose cosmetic has been given. */
  granted: number[];
  /** Paid but not yet shown: the UI drains these with `ackMastery`. */
  fresh: MasteryNews[];
  /** False until the first tick or catch-up after the feature first loads: it grants the stars already earned silently. */
  synced: boolean;
  /** The silent catch-up's one summary, until the UI shows it and calls `ackMastery`. */
  summary: MasterySummary | null;
}

export const KEY = 'mastery';

const MILESTONES: readonly number[] = [...MASTERY.cosmeticTotals, MASTERY.masterTotal];
const TOP_FOOTPRINT = FOOTPRINTS.length - 1;
const TOP_GRADE = OVEN_GRADES.length - 1;

export const starKey = (shopId: NeighborhoodId, star: MasteryStar) => `${shopId}:${star}`;

/** Which of a shop's three stars it has. */
export function masteryStars(shop: Shop): Record<MasteryStar, boolean> {
  return { heads: allHeadsHired(shop), flagship: shop.footprint >= TOP_FOOTPRINT, golden: shop.grade >= TOP_GRADE };
}

/** Stars a shop has, 0..3. */
export const shopStars = (shop: Shop): number => MASTERY_STARS.filter((k) => masteryStars(shop)[k]).length;

/** Stars in the whole city, 0..18. */
export function masteryTotal(g: GameState): number {
  return SHOP_IDS.reduce((t, id) => t + shopStars(g.shops[id]), 0);
}

// from the tuning list, not SHOP_IDS: game.ts loads this file while it is still being evaluated
export const MASTERY_MAX = NEIGHBORHOODS.length * MASTERY_STARS.length;

/** How far a star is: `have` of `need` steps (heads hired, footprint tier, oven grade), for "2 of 3 heads". */
function starProgress(shop: Shop, star: MasteryStar): { have: number; need: number } {
  if (star === 'heads') return { have: HEAD_KINDS.filter((k) => shop.heads[k]).length, need: HEAD_KINDS.length };
  if (star === 'flagship') return { have: shop.footprint, need: TOP_FOOTPRINT };
  return { have: shop.grade, need: TOP_GRADE };
}

export interface NextStar {
  shopId: NeighborhoodId;
  star: MasteryStar;
  /** The inputs of the progress line: steps done and steps needed. */
  have: number;
  need: number;
}

/**
 * The star closest to done (most of its steps made; ties go to the earlier shop, then star), among built shops: the goal to
 * show. Null when every star is earned.
 */
export function nextStar(g: GameState): NextStar | null {
  let best: NextStar | null = null;
  let bestShare = -1;
  for (const shopId of SHOP_IDS) {
    const shop = g.shops[shopId];
    if (!shop.built) continue;
    const have = masteryStars(shop);
    for (const star of MASTERY_STARS) {
      if (have[star]) continue;
      const p = starProgress(shop, star);
      const share = p.have / p.need;
      if (share > bestShare + 1e-12) {
        best = { shopId, star, ...p };
        bestShare = share;
      }
    }
  }
  return best;
}

const empty = (): MasteryState => ({ announced: [], granted: [], fresh: [], synced: false, summary: null });

const strings = (v: unknown, max: number): string[] => (Array.isArray(v) ? [...new Set(v.filter((x): x is string => typeof x === 'string' && x.length > 0 && x.length <= 60))].slice(0, max) : []);

const read = (g: GameState): MasteryState => (g.x?.[KEY] as MasteryState | undefined) ?? empty();
const write = (g: GameState, s: MasteryState): GameState => ({ ...g, x: { ...g.x, [KEY]: s } });

/** Every star the shops have right now, as keys. */
function earnedKeys(g: GameState): { key: string; shopId: NeighborhoodId; star: MasteryStar }[] {
  const out: { key: string; shopId: NeighborhoodId; star: MasteryStar }[] = [];
  for (const shopId of SHOP_IDS) {
    const have = masteryStars(g.shops[shopId]);
    for (const star of MASTERY_STARS) if (have[star]) out.push({ key: starKey(shopId, star), shopId, star });
  }
  return out;
}

/** The cosmetic a milestone total gives: the first weekly-rotation one not owned, or the master plaque; null when none is left. */
function milestoneCosmetic(g: GameState, total: number): string | null {
  if (total >= MASTERY.masterTotal) return MASTERY.masterCosmetic;
  return WEEKLY_COSMETICS.find((id) => !g.rewards.cosmetics.includes(id)) ?? null;
}

/**
 * Pay every star not yet paid, then every milestone not yet given. `silent`: the first catch-up on a save from before the
 * feature (no news, one summary). Returns `g` itself when nothing is owed.
 */
function settle(g: GameState): GameState {
  const st = read(g);
  const earned = earnedKeys(g);
  const fresh = earned.filter((e) => !st.announced.includes(e.key));
  const total = earned.length;
  const owed = MILESTONES.filter((t) => total >= t && !st.granted.includes(t));
  if (st.synced && !fresh.length && !owed.length) return g;
  const silent = !st.synced;
  let rewards = g.rewards;
  const news: MasteryNews[] = [];
  const cosmetics: string[] = [];
  for (const e of fresh) news.push({ kind: 'star', shopId: e.shopId, star: e.star });
  const diamonds = fresh.length * MASTERY.starDiamonds;
  const granted = [...st.granted];
  for (const t of owed) {
    granted.push(t);
    const id = milestoneCosmetic({ ...g, rewards }, t);
    if (!id) continue;
    rewards = { ...rewards, ...grantCosmetic(rewards, id) };
    cosmetics.push(id);
    news.push({ kind: 'cosmetic', id });
  }
  if (diamonds) rewards = { ...rewards, diamonds: rewards.diamonds + diamonds };
  const next: MasteryState = {
    announced: [...st.announced, ...fresh.map((e) => e.key)],
    granted,
    fresh: silent ? st.fresh : [...st.fresh, ...news],
    synced: true,
    summary: silent && (fresh.length || cosmetics.length) ? { stars: fresh.length, diamonds, cosmetics } : st.summary,
  };
  return write({ ...g, rewards }, next);
}

/** The UI has shown what was new: clear the news and the summary. `g` itself when there is none. */
export function ackMastery(g: GameState): GameState {
  const st = read(g);
  return st.fresh.length || st.summary ? write(g, { ...st, fresh: [], summary: null }) : g;
}

export const mastery: Feature<MasteryState> = {
  key: KEY,
  init: () => empty(),
  migrate(raw) {
    if (!raw || typeof raw !== 'object') return empty();
    const r = raw as Record<string, unknown>;
    const nums = Array.isArray(r.granted) ? [...new Set((r.granted as unknown[]).filter((x): x is number => typeof x === 'number'))] : [];
    const sum = r.summary && typeof r.summary === 'object' ? (r.summary as Record<string, unknown>) : null;
    return {
      announced: strings(r.announced, 64),
      granted: nums.filter((t) => MILESTONES.includes(t)),
      // news is a moment, not a record: it isn't kept across a reload
      fresh: [],
      synced: r.synced === true,
      summary: sum && typeof sum.stars === 'number' && typeof sum.diamonds === 'number' ? { stars: Math.max(0, sum.stars), diamonds: Math.max(0, sum.diamonds), cosmetics: strings(sum.cosmetics, 8) } : null,
    };
  },
  tick: (g) => settle(g),
  onOffline: (g) => settle(g),
};
