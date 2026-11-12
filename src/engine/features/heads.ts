// Station heads come alive (v5.15): barks, rank pins and the Head of the Week. All pure; the scene (storefront.tsx) draws the result.
//   - A head speaks on four things: its station's milestone, a rush combo, an attack on its shop, and being Head of the Week
//     (`nextBark`: one bubble per shop, 2.5 s each, 20 s apart, never during a cut-scene).
//   - A head wears a rank pin once its station is Lv 25 / 50 / 100 (`rankOf`).
//   - Each week one hired head is Head of the Week: seeded by the week number, rolled only when the week number rises (the same rule
//     as counterattack.ts; lesson C94). It wears a gold star and its station's daily tasks are starred (`starredKinds`).
//   No income effect: this feature has no value or demand hook.
import { BARKS, HEAD_BARKS, STATION_TASKS, type BarkStation, type BarkTrigger } from '../../content/heads';
import type { NeighborhoodId } from '../../content/types';
import { seededUnit } from '../bonus';
import { SHOP_IDS, type GameState, type Shop } from '../game';
import { weekNumber } from './counterattack';
import type { Feature } from './types';

export const KEY = 'heads';
export const STATIONS: readonly BarkStation[] = ['prep', 'oven', 'counter'];

export interface HeadPick {
  shopId: NeighborhoodId;
  station: BarkStation;
}

export interface HeadsState {
  /** The highest week number rolled: a roll needs a bigger one. */
  week: number;
  /** This week's Head of the Week; null while no head is hired (it is rolled again until one is). */
  pick: HeadPick | null;
}

const fresh = (): HeadsState => ({ week: 0, pick: null });
const read = (g: GameState): HeadsState => (g.x?.[KEY] as HeadsState | undefined) ?? fresh();
const write = (g: GameState, s: HeadsState): GameState => ({ ...g, x: { ...g.x, [KEY]: s } });

/** Every hired head in a built shop, in shop then station order. */
export function hiredHeads(g: Pick<GameState, 'shops'>): HeadPick[] {
  const out: HeadPick[] = [];
  for (const shopId of SHOP_IDS) {
    const shop = g.shops[shopId];
    if (!shop.built) continue;
    for (const station of STATIONS) if (shop.heads[station]) out.push({ shopId, station });
  }
  return out;
}

/** The pick for a week: seeded by the week number from the hired heads (null when there are none). */
export function pickHead(g: Pick<GameState, 'shops'>, week: number): HeadPick | null {
  const pool = hiredHeads(g);
  if (!pool.length) return null;
  return pool[Math.min(pool.length - 1, Math.floor(seededUnit(week, pool.length, HEAD_BARKS.seedSalt) * pool.length))];
}

/** The Head of the Week right now, or null. */
export const headOfWeek = (g: GameState): HeadPick | null => read(g).pick;

/** The station of `shopId`'s head that is Head of the Week, or null. */
export function weekStation(g: GameState, shopId: NeighborhoodId): BarkStation | null {
  const p = read(g).pick;
  return p && p.shopId === shopId && g.shops[shopId].heads[p.station] ? p.station : null;
}

/** The daily-task kinds starred for this week's head (its station's, see STATION_TASKS); none when there is no pick. */
export function starredKinds(g: GameState): readonly string[] {
  const p = read(g).pick;
  return p ? STATION_TASKS[p.station] : [];
}

/** Whether a daily task of `kind` is starred (the tasks drawer asks this per row). */
export const isStarredTask = (g: GameState, kind: string): boolean => starredKinds(g).includes(kind);

/** The rank pin a head wears: 0 none, 1 at Lv 25, 2 at Lv 50, 3 at Lv 100 (HEAD_BARKS.rankLevels). */
export const rankOf = (level: number): 0 | 1 | 2 | 3 => HEAD_BARKS.rankLevels.filter((l) => level >= l).length as 0 | 1 | 2 | 3;

/** A station's level in a shop (ovens are `ovens`). */
export const stationLevel = (shop: Pick<Shop, 'prep' | 'ovens' | 'counter'>, st: BarkStation): number => (st === 'prep' ? shop.prep : st === 'oven' ? shop.ovens : shop.counter);

/** Roll on a new week; while the week has no pick (nobody hired yet) look again. `g` itself when nothing changed. */
function roll(g: GameState, now: number): GameState {
  const st = read(g);
  const w = weekNumber(now);
  if (w > st.week) return write(g, { week: w, pick: pickHead(g, w) });
  if (w === st.week && !st.pick) {
    const pick = pickHead(g, w);
    if (pick) return write(g, { ...st, pick });
  }
  return g;
}

export const heads: Feature<HeadsState> = {
  key: KEY,
  init: () => fresh(),
  migrate(raw) {
    if (!raw || typeof raw !== 'object') return fresh();
    const r = raw as Record<string, unknown>;
    const week = typeof r.week === 'number' && Number.isFinite(r.week) ? Math.max(0, Math.floor(r.week)) : 0;
    const p = r.pick && typeof r.pick === 'object' ? (r.pick as Record<string, unknown>) : null;
    const pick = p && SHOP_IDS.includes(p.shopId as NeighborhoodId) && STATIONS.includes(p.station as BarkStation) ? { shopId: p.shopId as NeighborhoodId, station: p.station as BarkStation } : null;
    return { week, pick };
  },
  tick: (g, _dt, now) => roll(g, now),
};

// ---------- barks ----------

/** What a head says: the copy's line for the shop, station and trigger. */
export const barkText = (shopId: NeighborhoodId, station: BarkStation, trigger: BarkTrigger): string => BARKS[shopId][station][trigger];

/** One request to speak. `key` makes it once-only (a week's star, an attack's first day); moments carry no key. */
export interface BarkAsk {
  trigger: BarkTrigger;
  station: BarkStation;
  key?: string;
}

export interface BarkMem {
  /** Wall seconds the last bubble started (−Infinity: none yet). */
  at: number;
  /** Once-only keys already spoken (the newest 16). */
  seen: readonly string[];
}

export const newBarkMem = (): BarkMem => ({ at: Number.NEGATIVE_INFINITY, seen: [] });

export interface Bark extends BarkAsk {
  text: string;
}

/**
 * Decide this frame's bubble for one shop. Nothing while a cut-scene plays (`blocked`) or within HEAD_BARKS.gap of the last bubble
 * (so two never overlap: the gap is longer than a bubble's life); otherwise the best ask by priority, whose key (if any) is then spent.
 * Asks that arrive while it is too soon are dropped, except keyed ones, which the caller offers again every frame.
 */
export function nextBark(mem: BarkMem, shopId: NeighborhoodId, asks: readonly BarkAsk[], now: number, blocked: boolean): { mem: BarkMem; bark: Bark | null } {
  if (blocked || now - mem.at < HEAD_BARKS.gap) return { mem, bark: null };
  const open = asks.filter((a) => !a.key || !mem.seen.includes(a.key));
  if (!open.length) return { mem, bark: null };
  const best = open.reduce((b, a) => (HEAD_BARKS.priority.indexOf(a.trigger) < HEAD_BARKS.priority.indexOf(b.trigger) ? a : b));
  const seen = best.key ? [...mem.seen, best.key].slice(-16) : mem.seen;
  return { mem: { at: now, seen }, bark: { ...best, text: barkText(shopId, best.station, best.trigger) } };
}

/** The bubble is up for HEAD_BARKS.seconds after it starts. */
export const barkShowing = (mem: BarkMem, now: number): boolean => now - mem.at >= 0 && now - mem.at < HEAD_BARKS.seconds;

/** Which hired head speaks for something that belongs to the whole shop (a rush, an attack): rotated by `salt`, null when nobody is hired. */
export function speakerFor(shop: Pick<Shop, 'heads'>, salt: number): BarkStation | null {
  const hired = STATIONS.filter((st) => shop.heads[st]);
  return hired.length ? hired[Math.abs(Math.floor(salt)) % hired.length] : null;
}
