// What the upgrade drawer shows, as plain data (A17, M32). The level-dependent part (every card's title, detail, cost, lock, tone and the
// what-if gains behind them) is cached on the levels of every shop, the fleet and Nonna's countdown, so the 200 ms tick doesn't rerun the
// ~7 upgrade, 3 decor and 1 fleet simulations; only `canBuy` and the tied-stations bundle button depend on cash. Pure: unit-tested in node.
//
// The cache key covers everything the drawer reads from the game except cash. A new feature that moves a gain with some other state
// must add that state to `drawerKey` (the same rule as `stationModels`).
import { DECOR, DECOR_BOOST, DECOR_KINDS, FOOTPRINTS, HEAD_KINDS, HEAD_TITLE, HEADS, OVEN_GRADES, VEHICLES, type DecorKind, type HeadKind } from '../content/tuning';
import type { NeighborhoodId } from '../content/types';
import { money, rate } from '../engine/format';
import * as G from '../engine/game';
import { aOrAn } from './goal-model';
import { bundleButton, buttonTone, capExpandCost, gainText, type BundleButton, type ButtonTone } from './sidewalk-model';

/** The one typed input of the drawer model. */
export interface DrawerInput {
  game: G.GameState;
  id: NeighborhoodId;
}

/** What a card draws as its icon; the screen maps it to an SVG. */
export type DrawerIcon =
  | { t: 'head'; kind: HeadKind; name: string }
  | { t: 'gm'; name: string }
  | { t: 'nonna' }
  | { t: 'station'; what: 'prep' | 'ovens' | 'counter' | 'drivers' | 'tables' | 'grade' | 'expand' | 'fleet' }
  | { t: 'decor'; kind: DecorKind };

/** What a card's buy button does, through the ordinary buy path. */
export type DrawerBuy = { t: 'upgrade'; what: G.Upgrade } | { t: 'fleet' } | { t: 'decor'; kind: DecorKind };

export interface DrawerCard {
  key: string;
  testID: string;
  icon: DrawerIcon;
  title: string;
  level?: string;
  detail: string;
  hot?: boolean;
  wide?: boolean;
  muted?: boolean;
  tone: ButtonTone;
  /** The price on the button; null while locked or maxed. */
  cost: number | null;
  buyLabel?: string;
  costLabel: string;
  buy: DrawerBuy;
}

export interface DrawerView {
  title: string;
  /** "Bottleneck: prep + ovens" */
  bottleneck: string;
  /** Show "Without a manager, upgrades here only pay while you tap." */
  idleBanner: boolean;
  /** "★ Marisol’s perk: …" */
  perkBanner: string | null;
  /** The tied-stations bundle button (D304), cash-dependent; null when fewer than two stations are tied. */
  bundle: BundleButton | null;
  /** The station, fleet and head cards, in order (the night-oven card and the DRAWER_CARDS slot follow). */
  cards: (DrawerCard & { canBuy: boolean })[];
  decorTitle: string;
  decor: (DrawerCard & { canBuy: boolean })[];
  /** Pizzerias built, for the footer. */
  built: number;
}

export const STAGE_NAME: Record<G.Stage, string> = { prep: 'prep', ovens: 'ovens', counter: 'counter', customers: 'drivers & seats' };

/** The tied-stations bundle for the sidewalk row and the drawer: only when two or more stations share the bottleneck. */
export function tiedBundle(game: G.GameState, id: NeighborhoodId): G.BundleHint | null {
  const shop = game.shops[id];
  const rates = stageRateMap(shop, game.vehicle);
  const min = Math.min(...Object.values(rates));
  const tiedCount = (Object.keys(rates) as G.Stage[]).filter((st) => rates[st] <= min * (1 + 1e-9)).length;
  return tiedCount >= 2 ? G.bundleHint(game, id) : null;
}

const stageRateMap = (shop: G.Shop, v: number): Record<G.Stage, number> => ({ prep: G.prepRate(shop), ovens: G.ovenRate(shop), counter: G.counterRate(shop), customers: G.demandRate(shop, v) });

/** Everything the drawer reads from the game except cash: the cache's key, derived from the one input object. */
export function drawerKey({ game, id }: DrawerInput): string {
  return [id, ...G.SHOP_IDS.map((i) => G.shopLevelKey(game, i)), game.dronesUnlocked ? 'd' : '-', id === 'downtown' && !game.shops.downtown.managed ? G.nonnaPizzasLeft(game) : ''].join('#');
}

interface LevelPart extends Omit<DrawerView, 'bundle' | 'cards' | 'decor'> {
  bundleHint: G.BundleHint | null;
  cards: DrawerCard[];
  decor: DrawerCard[];
}

let cacheKey = '';
let cacheVal: LevelPart | null = null;

/** The level-dependent part of the drawer, cached on `drawerKey`. */
function levelPart(input: DrawerInput): LevelPart {
  const key = drawerKey(input);
  if (cacheVal && key === cacheKey) return cacheVal;
  cacheVal = buildLevelPart(input);
  cacheKey = key;
  return cacheVal;
}

function buildLevelPart({ game, id }: DrawerInput): LevelPart {
  const shop = game.shops[id];
  const nd = G.def(id);
  const v = game.vehicle;
  const rates = stageRateMap(shop, v);
  const minRate = Math.min(...Object.values(rates));
  const tied = (st: G.Stage) => rates[st] <= minRate * (1 + 1e-9);
  const perk = G.perkOf(id, shop);
  // Until the stations run themselves, upgrades here only pay while you tap: mute them so the hires stand out (C68).
  const idleShop = !G.runsItself(shop) && id !== 'downtown';
  // Expand is still worth it when a station is stuck at its level cap.
  const atCap = (['prep', 'ovens', 'counter', 'tables'] as const).some((w) => shop[w] >= G.levelCap(shop));
  const plus = gainText;

  const card = (what: G.Upgrade, props: { icon: DrawerIcon; title: string; level?: string; detail: string; hot?: boolean; wide?: boolean; costLabel?: string }): DrawerCard => {
    const cost = G.upgradeCostOf(game, id, what);
    const lock = G.upgradeLock(game, id, what);
    const muted = idleShop && what !== 'manager' && !G.isHeadUpgrade(what);
    // Expand is still worth buying when a station is stuck at its level cap, even though it adds $0/s by itself
    const gain = what === 'manager' || G.isHeadUpgrade(what) || (what === 'expand' && atCap) ? 1 : G.upgradeGain(game, id, what);
    // D413: a station only the level cap locks offers the Expand buy right on its card, as the sidewalk does
    const expandCost = capExpandCost(game, id, what);
    return {
      key: what,
      testID: `buy-${what}`,
      ...props,
      detail: lock && what !== 'manager' ? lock : lock && what === 'manager' && id !== 'downtown' ? `${lock} · then ×2 income here, and it earns while you're away` : props.detail,
      hot: muted ? false : props.hot,
      muted,
      tone: expandCost !== null ? 'expand' : buttonTone({ lock, gain, muted }),
      cost: expandCost ?? (lock ? null : cost),
      buyLabel: expandCost !== null ? `Expand · ${money(expandCost)}` : undefined,
      costLabel: props.costLabel ?? (lock && !/Finest|Biggest|Max/.test(lock) ? 'Locked' : 'MAX'),
      buy: { t: 'upgrade', what: expandCost !== null ? 'expand' : what },
    };
  };
  // Seating card: when the next visible table arrives
  const nextTableHint = (() => {
    const shown = G.tablesShown(shop);
    for (let l = shop.tables + 1; l <= shop.tables + 400; l++) {
      if (G.tablesShown({ ...shop, tables: l }) > shown) return l === shop.tables + 1 ? 'next level: +1 table' : `+1 table at Lv ${l}`;
    }
    return 'dining room full';
  })();
  const stationDetail = (st: G.Stage, what: G.Upgrade, rateText: string) => {
    const g = G.upgradeGain(game, id, what) ?? 0;
    if (g > 1e-9) return `${rateText} · ${plus(g)}`;
    if (tied(st)) {
      const others = (Object.keys(rates) as G.Stage[]).filter((x) => x !== st && tied(x)).map((x) => STAGE_NAME[x]);
      return `${rateText} · tied with ${others.join(' & ')}`;
    }
    // the shared reason ("waiting on …") is shown once in the drawer header; the button already says "no gain now" (D324)
    return rateText;
  };
  const gradeNext = OVEN_GRADES[shop.grade + 1];
  const fpNext = FOOTPRINTS[shop.footprint + 1];
  const gradeGain = G.upgradeGain(game, id, 'grade') ?? 0;
  const expandGain = G.upgradeGain(game, id, 'expand') ?? 0;
  const fleetLockRaw = G.nextVehicleLock(game);
  const fleetLock = fleetLockRaw ? G.vehicleLockLabel(fleetLockRaw) : null;
  const nextVeh = VEHICLES[v + 1];
  const vg = G.vehicleGain(game);

  const cards: DrawerCard[] = [];
  if (!shop.managed) {
    for (const k of HEAD_KINDS) {
      cards.push(
        card(G.HEAD_UPGRADE[k], {
          icon: { t: 'head', kind: k, name: HEADS[id][k] },
          title: `${HEAD_TITLE[k]}: ${HEADS[id][k]}`,
          // short enough not to leave a word alone on its last line (D358)
          detail: `Runs the ${k === 'prep' ? 'prep table' : k === 'oven' ? 'ovens' : 'counter'} for you`,
          wide: true,
          costLabel: 'Hired',
        }),
      );
    }
    cards.push(
      card('manager', {
        icon: id === 'downtown' ? { t: 'nonna' } : { t: 'gm', name: `${id}-gm` },
        title: id === 'downtown' ? 'Manager: Nonna Rosa' : `Hire ${aOrAn(nd.name)} ${nd.name} manager`,
        detail: id === 'downtown' ? `Keep baking — ${G.nonnaCountdownText(game)}` : `General Manager: ×2 income here, and it earns while you're away (${plus(G.shopEarnings(game, id))})`,
        wide: true,
        costLabel: id === 'downtown' ? 'Soon' : undefined,
      }),
    );
  }
  cards.push(
    card('prep', { icon: { t: 'station', what: 'prep' }, title: 'Prep Cooks', level: `Lv ${shop.prep}`, detail: `${stationDetail('prep', 'prep', `${rate(rates.prep)}/s`)} · batch ${G.tapBatch(shop)} (bigger at Lv ${G.nextBatchLevel(shop)})`, hot: tied('prep') }),
    card('ovens', { icon: { t: 'station', what: 'ovens' }, title: 'Ovens', level: `Lv ${shop.ovens}`, detail: stationDetail('ovens', 'ovens', `${rate(rates.ovens)}/s`), hot: tied('ovens') }),
    card('counter', { icon: { t: 'station', what: 'counter' }, title: 'Counter', level: `Lv ${shop.counter}`, detail: stationDetail('counter', 'counter', `${rate(rates.counter)}/s`), hot: tied('counter') }),
    card('drivers', { icon: { t: 'station', what: 'drivers' }, title: 'Drivers', level: `× ${shop.drivers}`, detail: stationDetail('customers', 'drivers', `${rate(G.deliveryRate(shop, v))}/s`), hot: tied('customers') }),
    card('tables', { icon: { t: 'station', what: 'tables' }, title: 'Seating', level: `Lv ${shop.tables}`, detail: nextTableHint === 'dining room full' ? `Dining room full · ${rate(G.walkInRate(shop))} walk‑ins/s` : `${stationDetail('customers', 'tables', `${rate(G.walkInRate(shop))} walk‑ins/s`)} · ${nextTableHint}`, hot: tied('customers') }),
    card('grade', { icon: { t: 'station', what: 'grade' }, title: 'Grade', level: OVEN_GRADES[shop.grade].name, detail: gradeNext ? (gradeGain > 1e-9 ? `→ ${gradeNext.name} ×2 · ${plus(gradeGain)}` : `→ ${gradeNext.name} ×2`) : 'Finest ovens in town' }),
    card('expand', { icon: { t: 'station', what: 'expand' }, title: 'Expand', level: `${shop.footprint + 1}/5`, detail: fpNext ? `×1.5 prep & counter${expandGain > 1e-9 ? ` · ${plus(expandGain)}` : atCap ? ` · Lv cap → ${G.levelCap(shop) + 25}` : ''}` : `${FOOTPRINTS[shop.footprint].name} — biggest it gets` }),
    {
      key: 'fleet',
      testID: 'buy-fleet',
      icon: { t: 'station', what: 'fleet' },
      title: 'Fleet',
      detail: nextVeh ? (fleetLock ? `→ ${nextVeh.name}s · ${fleetLock.charAt(0).toLowerCase()}${fleetLock.slice(1)}` : `→ ${nextVeh.name}s, all shops${vg && vg > 0 ? ` · ${plus(vg)}` : ''}`) : `${VEHICLES[v].name}s — top tier`,
      cost: nextVeh && !fleetLock ? nextVeh.cost : null,
      costLabel: nextVeh ? 'Locked' : 'MAX',
      tone: buttonTone({ lock: !nextVeh || !!fleetLock, gain: vg }),
      buy: { t: 'fleet' },
    },
  );

  const decor: DrawerCard[] = DECOR_KINDS.map((kind) => {
    const d = DECOR[kind];
    const tier = shop.decor[kind];
    const cost = G.decorCost(game, id, kind);
    const gain = G.decorGain(game, id, kind) ?? 0;
    return {
      key: kind,
      testID: `decor-${kind}`,
      icon: { t: 'decor', kind },
      title: d.name,
      level: `${tier}/3`,
      detail: cost === null ? d.tiers[3] : `→ ${d.tiers[tier + 1]} · ${plus(gain)}`,
      cost,
      costLabel: 'MAX',
      tone: buttonTone({ lock: cost === null, gain, muted: idleShop }),
      muted: idleShop,
      buy: { t: 'decor', kind },
    };
  });

  return {
    title: `Rosa’s · ${nd.name}`,
    bottleneck: `Bottleneck: ${G.tiedStages(shop, v).map((st) => STAGE_NAME[st]).join(' + ')}`,
    idleBanner: idleShop,
    perkBanner: perk ? `★ ${perk.who}’s perk: ${perk.text}` : null,
    bundleHint: tiedBundle(game, id),
    cards,
    decorTitle: `Decor · each tier: +${Math.round((perk?.decorBoost ?? DECOR_BOOST) * 100)}% pizza price in this shop`,
    decor,
    built: G.SHOP_IDS.filter((i) => game.shops[i].built).length,
  };
}

const withCash = (c: DrawerCard, cash: number) => ({ ...c, canBuy: c.cost !== null && cash >= c.cost });

/** The drawer's whole model for one shop: the cached level part plus what cash decides (`canBuy`, the bundle button). */
export function drawerCards(input: DrawerInput): DrawerView {
  const { game, id } = input;
  const p = levelPart(input);
  const { bundleHint, cards, decor, ...rest } = p;
  return { ...rest, bundle: bundleHint ? bundleButton(bundleHint, game.cash) : null, cards: cards.map((c) => withCash(c, game.cash)), decor: decor.map((c) => withCash(c, game.cash)) };
}
