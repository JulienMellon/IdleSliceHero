// What each sidewalk station button shows, as plain data (A16). The level-dependent part (cost, lock, and the station's capacity now and
// after the buy) is cached on the shop's levels, so the 200 ms tick doesn't rerun the what-ifs (M26); only `affordable` depends on cash.
// v5.22: a card says what its station can handle ("18/min → 22"); nothing here ranks, tints or bundles stations. Pure: unit-tested in node.
import { cityOf, type CityDef } from '../content/cities';
import type { HeadKind } from '../content/tuning';
import type { NeighborhoodId } from '../content/types';
import { BUY_AMOUNTS, buyPlan, isLevelUpgrade, type BuyAmount } from '../engine/buy-many';
import { count, money } from '../engine/format';
import * as G from '../engine/game';
import { fits } from './endgame/fit-model';
import { capacityAfter, flowOf, KEY as SERVICE_KEY, reportActive, reportView, type ServiceStateSlice } from '../engine/features/service';

/** The look of a purchase button: `expand` is the amber Expand buy, which never reads as a station buy (D407). */
export type ButtonTone = 'normal' | 'neutral' | 'nogain' | 'expand';

/**
 * The one rule for a purchase button's tone, shared by the sidewalk and the drawer (C60/G75): a locked or maxed upgrade is never "no gain"
 * (it shows its reason or MAX), and a muted (unmanaged) card stays neutral. v5.22: the station cards and the drawer pass no `gain`, so a
 * card never reads as worth less than its neighbours; a caller that does pass one (the layers' cards) still gets the flat `nogain` look for 0.
 */
export function buttonTone({
  lock,
  gain,
  muted = false,
}: {
  lock: string | null | boolean;
  gain?: number | null;
  muted?: boolean;
}): Exclude<ButtonTone, 'expand'> {
  if (muted) return 'neutral';
  if (lock || gain === undefined) return 'normal';
  return (gain ?? 0) > 1e-9 ? 'normal' : 'nogain';
}

/**
 * The look of an affordable card and its button (D419): a 2 pt crust-brown outline and a solid face in every neighbourhood, so a buy
 * you can make never reads as washed out. v5.22: every card has this one look; nothing frames, tints or saves-for a card.
 */
export const AFFORDABLE_OUTLINE = { color: '#3B1F14', width: 2 } as const;
export interface CardLook {
  borderColor: string;
  borderWidth: number;
  borderStyle: 'solid' | 'dashed';
  backgroundColor: string;
  /** Opacity of the card's label and price (1 whenever the buy can be made). */
  labelOpacity: number;
}
export function cardLook(affordable: boolean): CardLook {
  if (affordable)
    return {
      borderColor: AFFORDABLE_OUTLINE.color,
      borderWidth: AFFORDABLE_OUTLINE.width,
      borderStyle: 'solid',
      backgroundColor: '#FFFFFF',
      labelOpacity: 1,
    };
  return { borderColor: '#3B1F14', borderWidth: 2.5, borderStyle: 'solid', backgroundColor: 'rgba(255,255,255,0.95)', labelOpacity: 1 };
}
/** The border of a button's face: dark and 2 pt whenever the buy can be made (any tone but the flat "no gain"), else none. */
export const buttonOutline = (enabled: boolean, tone: ButtonTone): { borderColor: string; borderWidth: number } | null =>
  enabled && tone !== 'nogain' ? { borderColor: AFFORDABLE_OUTLINE.color, borderWidth: AFFORDABLE_OUTLINE.width } : null;

/**
 * "need $X": what is still missing for a purchase, rounded up so it never reads "need $0" (D359). Null when the
 * player has enough, or there is nothing to buy (a locked or maxed upgrade has no cost).
 */
export function needText(cost: number | null, cash: number): string | null {
  if (cost === null || !Number.isFinite(cost) || G.canAfford({ cash }, cost)) return null;
  return `need ${money(Math.max(1, Math.ceil(cost - cash - 1e-9)))}`;
}

/**
 * What Expand costs when `what` is locked by the level cap alone and the next footprint exists, else null (D413).
 * The one rule for the sidewalk's EXPAND card and the drawer's "Expand" button on a capped station.
 */
export function capExpandCost(s: G.GameState, id: NeighborhoodId, what: G.Upgrade): number | null {
  const shop = s.shops[id];
  const level = what === 'drivers' ? shop.drivers : what === 'prep' || what === 'ovens' || what === 'counter' || what === 'tables' ? shop[what] : null;
  if (level === null || level < G.levelCap(shop)) return null;
  if (G.upgradeLock(s, id, what) === null || G.upgradeLock(s, id, 'expand') !== null) return null;
  return G.upgradeCostOf(s, id, 'expand');
}

export type StationKey = 'prep' | 'ovens' | 'counter' | 'drivers';
export const STATION_KEYS: StationKey[] = ['prep', 'ovens', 'counter', 'drivers'];
const STATION: Record<StationKey, { what: G.Upgrade; name: string }> = {
  prep: { what: 'prep', name: 'PREP' },
  ovens: { what: 'ovens', name: 'OVENS' },
  counter: { what: 'counter', name: 'COUNTER' },
  drivers: { what: 'drivers', name: 'DRIVERS' },
};

// ---------- what a station can handle: "18/min → 22" ----------

/** Pizzas (or deliveries) a minute as a card writes them: whole from 10 up, one decimal below (a counter at 4.5/min is not "5"). */
export const perMinute = (n: number): string => {
  const x = Math.max(0, n);
  return x >= 10 ? count(Math.round(x)) : String(Math.round(x * 10) / 10);
};

/** "18/min → 22": what the station handles now, and after the buy. The spaces around the arrow do not break: a number never wraps alone. */
export const capacityText = (now: number, after: number): string => `${perMinute(now)}/min\u00A0→\u00A0${perMinute(after)}`;

/** A number a minute to `digits` significant figures at most, thousands and millions as K and M ("5.8K"): both ends of a card's line shrink together, never one dropped. */
export function abbreviate(n: number, digits: 1 | 2 | 3): string {
  const x = Math.max(0, n);
  const unit = x >= 1e6 ? 'M' : x >= 1e3 ? 'K' : '';
  const v = unit === 'M' ? x / 1e6 : unit === 'K' ? x / 1e3 : x;
  const places = v >= 100 || digits === 1 ? 0 : v >= 10 ? Math.min(1, digits - 2) : digits - 1;
  return `${Number(v.toFixed(Math.max(0, places)))}${unit}`;
}

/**
 * The line on a sidewalk card, one format: "446→486", no unit (a station's text is about 46 pt wide on a 375 pt phone, 7 characters at 10 pt).
 * When the numbers are too long both are abbreviated together ("5.8K→6.2K", then "6K→6K"); the current value is never dropped, and no line is wider than the card. Never under 10 pt.
 * A pair that still does not fit shares one unit ("124→129K"); a card too narrow even for that shows the current value alone ("124K").
 */
export function capacityFit(c: { now: number; after: number }, width: number): string {
  const lines: string[] = [`${perMinute(c.now)}→${perMinute(c.after)}`];
  for (const d of [2, 1] as const) {
    const a = abbreviate(c.now, d);
    const b = abbreviate(c.after, d);
    lines.push(`${a}→${b}`);
    // same unit on both ends: say it once, after the second number (a six-digit "124K→129K" is 9 characters, wider than a card)
    if (/[KM]$/.test(a) && a.slice(-1) === b.slice(-1)) lines.push(`${a.slice(0, -1)}→${b}`);
  }
  const now = abbreviate(c.now, 1);
  return lines.find((t) => fits(t, width, 10)) ?? (fits(now, width, 10) ? now : lines[lines.length - 1]);
}

/** What a station can handle now with its machines, and after one more level, a minute: no hand-tapped scaling, so it depends on the shop's levels alone. */
type MachineCaps = Record<StationKey, { now: number; after: number }>;

/** `g` with what the player made by hand left out of the service slice, so `capacityAfter` answers with the machines' own rates. */
function withoutMade(g: G.GameState, id: NeighborhoodId): G.GameState {
  const sv = g.x?.[SERVICE_KEY] as ServiceStateSlice | undefined;
  const row = sv?.shops[id];
  if (!sv || !row) return g;
  return { ...g, x: { ...g.x, [SERVICE_KEY]: { ...sv, shops: { ...sv.shops, [id]: { ...row, made: { prep: 0, ovens: 0, counter: 0 } } } } } };
}

let machineKey = '';
let machineVal: MachineCaps | null = null;

/** The machines' capacity now and after, cached on the shop's levels (U34: what a hand-tapped station made is applied per render, in `stationCap`, not in a key). */
function machineCaps(s: G.GameState, id: NeighborhoodId): MachineCaps {
  const key = G.shopLevelKey(s, id);
  if (machineVal && key === machineKey) return machineVal;
  const flow = flowOf(s, id, s.lastSavedAt);
  const bare = withoutMade(s, id);
  const one = (k: StationKey) => ({ now: flow[k] * 60, after: capacityAfter(bare, id, k, s.lastSavedAt) });
  machineVal = { prep: one('prep'), ovens: one('ovens'), counter: one('counter'), drivers: one('drivers') };
  machineKey = key;
  return machineVal;
}

/**
 * A station's capacity now and after one more level (the same number twice for a station at its cap). A station the player taps by hand shows what they
 * made lately, and after the buy that scaled by what the level adds to its machine; the rest is the cached machine numbers.
 */
export function stationCap(s: G.GameState, id: NeighborhoodId, k: StationKey): { now: number; after: number } {
  const m = machineCaps(s, id)[k];
  if (k === 'drivers' || !reportActive(s, id)) return m;
  const v = reportView(s, id, s.lastSavedAt);
  if (!v.you[k]) return m;
  const now = v.capacity[k];
  return { now, after: now > 0 && m.now > 0 ? (now * m.after) / m.now : m.after };
}

/** What a station can handle now, a minute (E3's `capacity` while the report is live, else the flow's own rate: a shop run by hand has no readout yet). */
export function capacityNow(s: G.GameState, id: NeighborhoodId, k: StationKey): number {
  return stationCap(s, id, k).now;
}

/** A station card's capacity line in the drawer: "18/min → 22". */
export function stationCapacity(s: G.GameState, id: NeighborhoodId, k: StationKey): string {
  const c = stationCap(s, id, k);
  return capacityText(c.now, c.after);
}

/** Whether the player taps a kitchen station by hand (its numbers move every tick: the drawer redoes those cards' lines per render). */
export function tapsByHand(s: G.GameState, id: NeighborhoodId): boolean {
  if (!reportActive(s, id)) return false;
  const you = reportView(s, id, s.lastSavedAt).you;
  return you.prep || you.ovens || you.counter;
}

export interface StationModel {
  key: StationKey;
  what: G.Upgrade;
  name: string;
  level: string;
  cost: number | null;
  /** Why it can't be bought (ignoring cash), or null. */
  lock: string | null;
  label: string;
  /** The corner badge: the level, or "MAX" and the level while the button is the Expand buy (G89). */
  badge: string;
  /** Stuck at the level cap while the next footprint exists: the button buys Expand instead (B4). */
  expand: boolean;
  /** The same look on every station card; `expand` is the amber Expand buy. */
  tone: 'normal' | 'expand';
  /** The card shows its capacity: not for the Expand buy, nor a locked or maxed station. */
  shows: boolean;
}

export interface StationView extends StationModel {
  /** What the station handles now and after the buy, pizzas (deliveries) a minute; null where `shows` is false. */
  cap: { now: number; after: number } | null;
  /** The foot line in full: "18/min → 22" (null as `cap`). */
  foot: string | null;
  affordable: boolean;
  /** "need $X" for the 9 pt line under the price: only while the player is short and has some cash (at $0 it would just repeat the price), else null. */
  need: string | null;
}

let cacheKey = '';
let cacheVal: StationModel[] = [];

const levelKey = G.shopLevelKey;

/** The level-dependent part of every station button, cached on the shop's levels. */
export function stationModels(s: G.GameState, id: NeighborhoodId): StationModel[] {
  const key = levelKey(s, id);
  if (key === cacheKey) return cacheVal;
  const shop = s.shops[id];
  cacheVal = STATION_KEYS.map((k) => {
    const { what, name } = STATION[k];
    const stationLock = G.upgradeLock(s, id, what);
    // locked by the level cap alone, and Expand exists: the button buys Expand (amber, the station's name stays), through the ordinary buy path.
    // MAX is left for when nothing can raise the cap.
    const level = k === 'drivers' ? `×${shop.drivers}` : `${shop[k]}`;
    const expandCost = capExpandCost(s, id, what);
    const expand = expandCost !== null;
    const cost = expand ? expandCost : G.upgradeCostOf(s, id, what);
    const lock = expand ? null : stationLock;
    return {
      key: k,
      what: expand ? 'expand' : what,
      name,
      level,
      cost,
      lock,
      // G89: the Expand button shows its real price alone, in the same 15 pt face as every other price; the word is its small title
      // ("EXPAND" beside the station's icon) and "MAX" moves to the badge, because "DRIVERS MAX" / "Expand $500" were both truncated at 78 pt
      label: lock && !expand ? 'MAX' : money(cost ?? 0),
      badge: expand ? `MAX ${level}` : level,
      expand,
      tone: expand ? 'expand' : 'normal',
      shows: !expand && !lock,
    };
  });
  cacheKey = key;
  return cacheVal;
}

/**
 * The small title over a station's price: its name, or "EXPAND" while the button is the Expand buy (D407, G89). The station
 * still shows through its icon beside the title and its badge ("MAX 25"), and the price below is Expand's real one.
 */
export const stationTitle = (v: Pick<StationModel, 'name' | 'expand'>): string => (v.expand ? 'EXPAND' : v.name);

/** Add the cash-dependent part. */
export function stationViews(s: G.GameState, id: NeighborhoodId): StationView[] {
  return stationModels(s, id).map((m) => {
    const cap = m.shows ? stationCap(s, id, m.key) : null;
    return {
      ...m,
      cap,
      foot: cap && capacityText(cap.now, cap.after),
      affordable: !m.lock && G.canAfford(s, m.cost),
      need: m.lock || s.cash <= 0 ? null : needText(m.cost, s.cash),
    };
  });
}

/**
 * The line under a card's price: the ×10 / MAX plan's levels when one is chosen, else the station's capacity; the Expand buy and a locked card
 * (no capacity to show) keep "need $X" while the player is short.
 */
export const footLine = (v: Pick<StationView, 'cap' | 'need'>, many: { foot: string } | null, width: number): string | null =>
  many?.foot ?? (v.cap ? capacityFit(v.cap, width) : v.need);

// ---------- the sidewalk row's slots: stations, and the Expand card that merges the capped ones (D407) ----------

/** A station button in its own slot. */
export interface StationSlot {
  kind: 'station';
  key: StationKey;
  span: 1;
  view: StationView;
}

/**
 * One wider card standing in for several stations' slots: the shop-wide Expand when two or more stations are capped. It takes the first
 * member's place and the row's flex of all of them; the other members' slots are gone, so the row keeps its width and the other cards keep their size.
 */
export interface MergedSlot {
  kind: 'expand';
  keys: StationKey[];
  /** How many slots wide (flex weight). */
  span: number;
  /** The small title over the price. */
  title: string;
  label: string;
  /** The 9 pt line under the price. */
  foot: string | null;
  enabled: boolean;
  /** What a tap buys, in order, through the ordinary buy path. */
  steps: G.Upgrade[];
}

export type SidewalkSlot = StationSlot | MergedSlot;

/** The stations at the level cap, when two or more are: they make the one Expand card. */
export function expandGroup(views: readonly Pick<StationView, 'key' | 'expand'>[]): StationKey[] | null {
  const capped = views.filter((v) => v.expand).map((v) => v.key);
  return capped.length >= 2 ? capped : null;
}

/**
 * The row's cards left to right: one card a station, with the stations at the level cap showing the Expand buy (a wide card for two or more,
 * the amber button on the station's own card for one). Members need not be adjacent: the Expand card sits in the first member's slot and the
 * others' slots collapse into it.
 */
export function sidewalkSlots(s: G.GameState, id: NeighborhoodId): SidewalkSlot[] {
  const views = stationViews(s, id);
  const shop = s.shops[id];
  const next = cityOf(s).fit.footprints[shop.footprint + 1];
  const keys = expandGroup(views);
  let wide: MergedSlot | null = null;
  if (keys && next) {
    const cost = views.find((v) => v.key === keys[0])?.cost ?? 0;
    wide = {
      kind: 'expand',
      keys,
      span: keys.length,
      title: `EXPAND · ${next.name.split(' ')[0]}`, // G102: "EXPAND · Double", one word of the tier's name
      label: money(cost),
      foot: `Lv cap ${G.levelCap(shop)} → ${G.levelCap({ ...shop, footprint: shop.footprint + 1 })}`,
      enabled: G.canAfford(s, cost),
      steps: ['expand'],
    };
  }
  const slots: SidewalkSlot[] = [];
  for (const view of views) {
    if (!wide || !wide.keys.includes(view.key)) slots.push({ kind: 'station', key: view.key, span: 1, view });
    else if (wide.keys[0] === view.key) slots.push(wide);
  }
  return slots;
}

// ---------- what a hire does, in words (no number) ----------

const TAKES: Record<HeadKind, string> = { prep: 'the prep table', oven: 'the ovens', counter: 'the counter' };

/** "Marco takes the prep table": a head's effect in words (the drawer's card and the sidewalk's hire button share it). */
export const headTakes = (name: string, kind: HeadKind): string => `${name} takes ${TAKES[kind]}`;

/** The general manager's effect in words: the whole shop, even while the player is away. */
export const managerTakes = (name: string): string => `${name} takes the whole shop, even while you're away`;

/** The sidewalk's hire button, over its price: "HIRE MARCO · TAKES THE PREP TABLE", or the manager's. `name` is the head's (ignored for the manager). */
export const hireSidewalkLabel = (hire: G.Upgrade, name: string): string =>
  G.isHeadUpgrade(hire) ? `HIRE ${name.toUpperCase()} · TAKES ${TAKES[G.headOf(hire)].toUpperCase()}` : 'HIRE A MANAGER · TAKES THE WHOLE SHOP';

// ---------- who is offered the next hire, and where ----------

/**
 * The sidewalk offers the next hire (each head in turn, then the General Manager) on every pizzeria without a GM,
 * except the city's first, whose GM is its founder via the story. It stays until the GM is hired: three heads do not end the offer (B1).
 */
export const hireOnSidewalk = (shop: Pick<G.Shop, 'managed'>, id: NeighborhoodId, city: CityDef) => !shop.managed && id !== G.firstHood(city);

/**
 * The goal bar skips this shop's own hire only while the sidewalk already offers a head (D341). The GM hire is offered in both
 * places until it is bought (B1).
 */
export const goalHidesOwnHire = (shop: G.Shop, id: NeighborhoodId, city: CityDef) => {
  const hire = G.nextHire(shop);
  return hireOnSidewalk(shop, id, city) && hire !== null && G.isHeadUpgrade(hire);
};

// ---------- the Pier 9 warning on the build chip ----------

/** While the Pier 9 bid is on offer (and not yet won), building spends the cash saved for it: say so under the chip's price. */
export function buildChipHint(s: G.GameState): string | null {
  // reads as a cost, not a reward, and is short enough for the ~94 pt chip at 9 pt (D402)
  return G.bidAvailable(s) ? 'uses bid cash' : null;
}

/**
 * The build chip's second line. While the Pier 9 warning applies the price and the warning share one line, so the chip
 * keeps two lines like its neighbours (D404): "$1.8M · uses bid cash"; otherwise "Build $1.8M".
 */
export const buildChipSub = (cost: number, warn: string | null) => (warn ? `${money(cost)} · ${warn}` : `Build ${money(cost)}`);

// ---------- ×1 / ×10 / MAX (v5.15): one rule for how many levels a station buy takes ----------

// The rules (BuyAmount, buyPlan, buyMany) are the engine's (A30: engine/buy-many.ts); this file keeps the card views.
export { BUY_AMOUNTS, buyMany, buyPlan, isLevelUpgrade, type BuyAmount, type BuyPlan, type LevelUpgrade } from '../engine/buy-many';

/** D456: the amount chip's tap cycles x1 -> x10 -> MAX -> x1. */
export const nextAmount = (a: BuyAmount): BuyAmount => BUY_AMOUNTS[(BUY_AMOUNTS.indexOf(a) + 1) % BUY_AMOUNTS.length];
export const amountLabel = (a: BuyAmount): string => (a === 'max' ? 'MAX' : `×${a}`);

/**
 * How a station card reads for the chosen amount: the total price and the levels gained ("+10 lv"), enabled when the cash covers it.
 * Null leaves the card as it is: ×1, the Expand buy, a locked or maxed station, and every single buy.
 */
export function amountCard(
  s: G.GameState,
  id: NeighborhoodId,
  v: Pick<StationView, 'what' | 'expand'>,
  amount: BuyAmount,
): { label: string; foot: string; enabled: boolean; count: number } | null {
  if (amount === 1 || v.expand || !isLevelUpgrade(v.what)) return null;
  const plan = buyPlan(s, id, v.what, amount);
  if (plan.count === 0) return null;
  return { label: money(plan.total), foot: `+${plan.count} lv`, enabled: plan.affordable, count: plan.count };
}
