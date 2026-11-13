// What each sidewalk station button shows, as plain data (A16). The level-dependent part (cost, lock, gain, which
// stations are tied for the bottleneck) is cached on the shop's levels, so the 200 ms tick doesn't rerun four
// upgrade simulations (M26); only `affordable` depends on cash. Pure: unit-tested in node.
import { FOOTPRINTS } from '../content/tuning';
import type { NeighborhoodId } from '../content/types';
import { BUY_AMOUNTS, buyPlan, isLevelUpgrade, type BuyAmount } from '../engine/buy-many';
import { money } from '../engine/format';
import * as G from '../engine/game';

/** The look of a purchase button: `expand` is the amber Expand buy, which never reads as a station buy (D407). */
export type ButtonTone = 'normal' | 'neutral' | 'nogain' | 'expand';

/**
 * The one rule for a purchase button's tone, shared by the sidewalk and the drawer (C60/G75): a locked or maxed
 * upgrade is never "no gain" (it shows its reason or MAX), and a muted (unmanaged) card stays neutral.
 */
export function buttonTone({ lock, gain, muted = false }: { lock: string | null | boolean; gain: number | null; muted?: boolean }): Exclude<ButtonTone, 'expand'> {
  if (muted) return 'neutral';
  if (lock) return 'normal';
  return (gain ?? 0) > 1e-9 ? 'normal' : 'nogain';
}

/**
 * The look of an affordable card and its button (D419): a 2 pt crust-brown outline and a solid face in every neighbourhood, so a buy
 * you can make never reads as washed out. The bottleneck keeps its signal in the card's tomato fill instead of the outline (the old
 * affordable bottleneck card had a tomato outline on a pale pink face, which read faded beside the dark-outlined cards).
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
export function cardLook(frame: 'hot' | 'waiting' | null, affordable: boolean): CardLook {
  if (affordable) return { borderColor: AFFORDABLE_OUTLINE.color, borderWidth: AFFORDABLE_OUTLINE.width, borderStyle: 'solid', backgroundColor: frame === 'hot' ? '#FFD9CF' : '#FFFFFF', labelOpacity: 1 };
  // not affordable: saving for it is a dashed basil outline, anything else the quiet card
  if (frame === 'waiting') return { borderColor: 'rgba(46,125,62,0.6)', borderWidth: 2.5, borderStyle: 'dashed', backgroundColor: 'rgba(255,255,255,0.95)', labelOpacity: 1 };
  return { borderColor: '#3B1F14', borderWidth: 2.5, borderStyle: 'solid', backgroundColor: 'rgba(255,255,255,0.95)', labelOpacity: 1 };
}
/** The border of a button's face: dark and 2 pt whenever the buy can be made (any tone but the flat "no gain"), else none. */
export const buttonOutline = (enabled: boolean, tone: ButtonTone): { borderColor: string; borderWidth: number } | null =>
  enabled && tone !== 'nogain' ? { borderColor: AFFORDABLE_OUTLINE.color, borderWidth: AFFORDABLE_OUTLINE.width } : null;

/** The unmuted case of `buttonTone` (sidewalk stations are never muted). */
export const stationTone = (lock: string | null, gain: number | null): 'normal' | 'nogain' => (lock || (gain ?? 0) > 1e-9 ? 'normal' : 'nogain');

/**
 * "need $X": what is still missing for a purchase, rounded up so it never reads "need $0" (D359). Null when the
 * player has enough, or there is nothing to buy (a locked or maxed upgrade has no cost).
 */
export function needText(cost: number | null, cash: number): string | null {
  if (cost === null || !Number.isFinite(cost) || cash >= cost) return null;
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
const STATION: Record<StationKey, { what: G.Upgrade; name: string; stage: G.Stage }> = {
  prep: { what: 'prep', name: 'PREP', stage: 'prep' },
  ovens: { what: 'ovens', name: 'OVENS', stage: 'ovens' },
  counter: { what: 'counter', name: 'COUNTER', stage: 'counter' },
  drivers: { what: 'drivers', name: 'DRIVERS', stage: 'customers' },
};

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
  /** `nogain` when an unlocked upgrade adds nothing right now; `expand` is the amber Expand buy. */
  tone: 'normal' | 'nogain' | 'expand';
  /** Tied for the bottleneck and adds income: the station to buy. */
  neck: boolean;
  /** Among the slowest stages, whether or not one upgrade alone would add income (the bundle's stations). */
  tied: boolean;
}

export interface StationView extends StationModel {
  affordable: boolean;
  /** "need $X" for the 9 pt line under the price: only while the player is short and has some cash (at $0 it would just repeat the price), else null. */
  need: string | null;
  /** Card frame: solid red when the bottleneck is affordable, dashed while the player saves for it. */
  frame: 'hot' | 'waiting' | null;
  /** How close the player is to the bottleneck they're saving for, 0–1 (0 unless `frame` is waiting). */
  progress: number;
}

let cacheKey = '';
let cacheVal: StationModel[] = [];

const levelKey = G.shopLevelKey;

/** The level-dependent part of every station button, cached on the shop's levels. */
export function stationModels(s: G.GameState, id: NeighborhoodId): StationModel[] {
  const key = levelKey(s, id);
  if (key === cacheKey) return cacheVal;
  const shop = s.shops[id];
  const rates: Record<G.Stage, number> = { prep: G.prepRate(shop), ovens: G.ovenRate(shop), counter: G.counterRate(shop), customers: G.demandRate(shop, s.vehicle) };
  const min = Math.min(...Object.values(rates));
  cacheVal = STATION_KEYS.map((k) => {
    const { what, name, stage } = STATION[k];
    const stationLock = G.upgradeLock(s, id, what);
    const gain = G.upgradeGain(s, id, what);
    const useful = (gain ?? 0) > 1e-9;
    // locked by the level cap alone, and Expand exists: the button buys Expand (amber, the station's name stays), through the ordinary buy path.
    // MAX is left for when nothing can raise the cap. Expand is worth buying here even though it adds $0/s by itself (as in the drawer).
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
      tone: expand ? 'expand' : stationTone(lock, gain),
      neck: useful && rates[stage] <= min * (1 + 1e-9),
      tied: rates[stage] <= min * (1 + 1e-9),
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
    const affordable = !m.lock && m.cost !== null && s.cash >= m.cost;
    const frame = m.neck ? (affordable ? 'hot' : 'waiting') : null;
    const progress = frame === 'waiting' && m.cost ? Math.min(1, Math.max(0, s.cash / m.cost)) : 0;
    return { ...m, affordable, need: m.lock || s.cash <= 0 ? null : needText(m.cost, s.cash), frame, progress };
  });
}

/**
 * The need line a station button actually draws. A framed card that is saving for its bottleneck already shows a
 * progress bar in the same spot at the foot of the button, so it keeps the bar and skips the text (D402).
 */
export function needLine(v: StationView, framed: boolean): string | null {
  return framed && v.frame === 'waiting' ? null : v.need;
}

// ---------- the tied-stations bundle button (D304) ----------

export interface BundleButton {
  label: string;
  /** Small line above the label: that the stations are tied, what the bundle costs and what it earns (or what is missing). */
  sub: string;
  enabled: boolean;
  steps: G.Upgrade[];
}

/** "+$12/s": what the bundle (or any purchase) adds per second. */
export const gainText = (gain: number): string => `+${money(gain)}/s`;

/** "Buy both $35": the tied-station bundle as a button, in the drawer and merged into the sidewalk row. Disabled with the "need $X" style when short. */
export function bundleButton(hint: G.BundleHint, cash: number): BundleButton {
  const kinds = new Set(hint.steps).size;
  const word = kinds <= 2 ? 'both' : `all ${kinds}`;
  const need = needText(hint.cost, cash);
  return {
    label: `Buy ${word} ${money(hint.cost)}`,
    // D412: the payoff, not "one alone adds $0/s"
    sub: need ? `Tied · ${need} · ${gainText(hint.gain)}` : `Tied: buy ${word} · ${money(hint.cost)} · ${gainText(hint.gain)}`,
    enabled: need === null,
    steps: hint.steps,
  };
}

/** Buy each step through the ordinary buy path; stops at the first refusal. True when every step went through. */
export function buyBundle(steps: readonly G.Upgrade[], buy: (what: G.Upgrade) => boolean): boolean {
  for (const what of steps) if (!buy(what)) return false;
  return steps.length > 0;
}

/** The bundle merges into the row when a bundle exists and the tutorial coach isn't up. */
export const showBundlePill = (hint: G.BundleHint | null, coachUp: boolean) => hint !== null && !coachUp;

// ---------- the sidewalk row's slots: stations, and the cards that merge several of them (D405, D407) ----------

/** A station button in its own slot. */
export interface StationSlot {
  kind: 'station';
  key: StationKey;
  span: 1;
  view: StationView;
}

/**
 * One wider card standing in for several stations' slots: the tied stations' "Buy both" (`bundle`), or the shop-wide
 * Expand when two or more stations are capped (`expand`). It takes the first member's place and the row's flex of all
 * of them; the other members' slots are gone, so the row keeps its width and the other cards keep their size.
 */
export interface MergedSlot {
  kind: 'bundle' | 'expand';
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
  /** Card frame, as on the bottleneck card: solid red when affordable, dashed while the player saves for it. */
  frame: 'hot' | 'waiting' | null;
}

export type SidewalkSlot = StationSlot | MergedSlot;

/**
 * Which stations merge, as plain data (so the priority is testable): Expand first. Two or more capped stations make the
 * expand group; the tied stations make the bundle group only when a bundle exists, two or more are tied, and none of
 * them is capped (the bundle's steps would start with an expansion, which the Expand card already sells).
 */
export function mergeGroups(views: readonly Pick<StationView, 'key' | 'expand' | 'tied'>[], hasBundle: boolean): { expand: StationKey[] | null; bundle: StationKey[] | null } {
  const capped = views.filter((v) => v.expand).map((v) => v.key);
  const tied = views.filter((v) => v.tied);
  return {
    expand: capped.length >= 2 ? capped : null,
    bundle: hasBundle && tied.length >= 2 && !tied.some((v) => v.expand) ? tied.map((v) => v.key) : null,
  };
}

/**
 * The row's cards left to right. Priority is Expand first (`mergeGroups`): stations at the level cap show the Expand buy (a wide
 * card for two or more, the amber button on the station's own card for one), and the tied-stations bundle only merges when none of the tied
 * stations is capped (its steps would start with an expansion). Members need not be adjacent: the merged card sits in
 * the first member's slot and the others' slots collapse into it.
 */
export function sidewalkSlots(s: G.GameState, id: NeighborhoodId, bundle: G.BundleHint | null): SidewalkSlot[] {
  const views = stationViews(s, id);
  const shop = s.shops[id];
  const merged = new Map<StationKey, MergedSlot | null>();
  const place = (slot: MergedSlot) => slot.keys.forEach((k, i) => merged.set(k, i === 0 ? slot : null));
  const groups = mergeGroups(views, bundle !== null);
  const nameOf = (k: StationKey) => STATION[k].name;
  const next = FOOTPRINTS[shop.footprint + 1];
  const expandKeys = groups.expand;
  if (expandKeys && next) {
    const cost = views.find((v) => v.key === expandKeys[0])?.cost ?? 0;
    place({
      kind: 'expand',
      keys: expandKeys,
      span: expandKeys.length,
      title: `EXPAND \u00B7 ${next.name.split(' ')[0]}`, // G102: "EXPAND · Double", one word of the tier's name
      label: money(cost),
      foot: `Lv cap ${G.levelCap(shop)} → ${G.levelCap({ ...shop, footprint: shop.footprint + 1 })}`,
      enabled: s.cash >= cost,
      steps: ['expand'],
      frame: null,
    });
  }
  if (groups.bundle && bundle) {
    const button = bundleButton(bundle, s.cash);
    const need = s.cash > 0 ? needText(bundle.cost, s.cash) : null;
    place({
      kind: 'bundle',
      keys: groups.bundle,
      span: groups.bundle.length,
      title: groups.bundle.map(nameOf).join(' + '),
      label: button.label,
      foot: need ? `${gainText(bundle.gain)} · ${need}` : gainText(bundle.gain),
      enabled: button.enabled,
      steps: bundle.steps,
      frame: button.enabled ? 'hot' : 'waiting',
    });
  }
  const slots: SidewalkSlot[] = [];
  for (const view of views) {
    if (!merged.has(view.key)) slots.push({ kind: 'station', key: view.key, span: 1, view });
    else {
      const m = merged.get(view.key);
      if (m) slots.push(m);
    }
  }
  return slots;
}

// ---------- who is offered the next hire, and where ----------

/**
 * The sidewalk offers the next hire (each head in turn, then the General Manager) on every pizzeria without a GM,
 * except Downtown, whose GM is Nonna via the story. It stays until the GM is hired: three heads do not end the offer (B1).
 */
export const hireOnSidewalk = (shop: Pick<G.Shop, 'managed'>, id: NeighborhoodId) => !shop.managed && id !== 'downtown';

/**
 * The goal bar skips this shop's own hire only while the sidewalk already offers a head (D341). The GM hire is offered in both
 * places until it is bought (B1).
 */
export const goalHidesOwnHire = (shop: G.Shop, id: NeighborhoodId) => {
  const hire = G.nextHire(shop);
  return hireOnSidewalk(shop, id) && hire !== null && G.isHeadUpgrade(hire);
};

// ---------- the Pier 9 warning on the build chip ----------

/** While the Pier 9 bid is on offer (and not yet won), building spends the cash saved for it: say so under the chip's price. */
export function buildChipHint(s: G.GameState): string | null {
  // reads as a cost, not a reward, and is short enough for the ~94 pt chip at 9 pt (D402)
  return G.pier9Available(s) ? 'uses bid cash' : null;
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
export function amountCard(s: G.GameState, id: NeighborhoodId, v: Pick<StationView, 'what' | 'expand'>, amount: BuyAmount): { label: string; foot: string; enabled: boolean; count: number } | null {
  if (amount === 1 || v.expand || !isLevelUpgrade(v.what)) return null;
  const plan = buyPlan(s, id, v.what, amount);
  if (plan.count === 0) return null;
  return { label: money(plan.total), foot: `+${plan.count} lv`, enabled: plan.affordable, count: plan.count };
}
