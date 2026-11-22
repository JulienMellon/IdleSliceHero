// What the upgrade drawer shows, as plain data (A17, M32). The level-dependent part (every card's title, detail, cost, lock, tone and the
// capacity numbers behind them) is cached on the levels of every shop, the fleet and Nonna's countdown, so the 200 ms tick doesn't rerun the
// what-ifs; only `canBuy` and the header's line depend on cash and time (and the lines of a station the player taps by hand, which move with what
// they made: `drawerCards` redoes those per render from the cached machine numbers, U34). Pure: unit-tested in node.
// v5.22: a station's card says what it handles now and after the buy ("18/min → 22"); nothing here ranks, tints or bundles stations.
//
// The cache key covers everything the drawer reads from the game except cash. A new feature that moves a capacity with some other state
// must add that state to `drawerKey` (the same rule as `stationModels`).
import { DECOR, DECOR_BOOST, DECOR_KINDS, HEAD_KINDS, HEAD_TITLE, type DecorKind, type HeadKind } from '../content/tuning';
import type { NeighborhoodId } from '../content/types';
import { cityOf, hoodIds } from '../content/cities';
import { money } from '../engine/format';
import * as G from '../engine/game';
import { capacityAfter } from '../engine/features/service';
import { aOrAn } from './goal-model';
import { drawerLine } from './report/report-model';
import {
  buttonTone,
  stationCap,
  capacityText,
  capExpandCost,
  headTakes,
  managerTakes,
  perMinute,
  stationCapacity,
  tapsByHand,
  type ButtonTone,
} from './sidewalk-model';

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

/** C137: a card's buy as the one string the memoised card carries ('fleet', 'decor:<kind>', 'up:<upgrade>'), and back to the typed buy. */
export function buyKeyOf(b: DrawerBuy): string {
  return b.t === 'fleet' ? 'fleet' : b.t === 'decor' ? `decor:${b.kind}` : `up:${b.what}`;
}

/** The typed buy a key stands for; null for a key `buyKeyOf` would never write (an unknown decor kind is not guessed). */
export function parseBuyKey(key: string): DrawerBuy | null {
  if (key === 'fleet') return { t: 'fleet' };
  const i = key.indexOf(':');
  const arg = key.slice(i + 1);
  if (i < 0 || !arg) return null;
  if (key.startsWith('decor:')) return (DECOR_KINDS as readonly string[]).includes(arg) ? { t: 'decor', kind: arg as DecorKind } : null;
  if (key.startsWith('up:')) return { t: 'upgrade', what: arg as G.Upgrade };
  return null;
}

export interface DrawerCard {
  key: string;
  testID: string;
  icon: DrawerIcon;
  title: string;
  level?: string;
  detail: string;
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
  /** The shop report's line ("Served 41/min · Missed 7/min") once the shop takes part in it, else null: the header is the shop's title alone. */
  line: string | null;
  /** Show "Without a manager, upgrades here only pay while you tap." */
  idleBanner: boolean;
  /** "★ Marisol’s perk: …" */
  perkBanner: string | null;
  /** The station, fleet and head cards, in order (the night-oven card and the DRAWER_CARDS slot follow). */
  cards: (DrawerCard & { canBuy: boolean })[];
  decorTitle: string;
  decor: (DrawerCard & { canBuy: boolean })[];
  /** Pizzerias built, for the footer. */
  built: number;
}

/** Everything the drawer reads from the game except cash: the cache's key, derived from the one input object. */
export function drawerKey({ game, id }: DrawerInput): string {
  return [
    id,
    ...hoodIds(cityOf(game)).map((i) => G.shopLevelKey(game, i)),
    game.dronesUnlocked ? 'd' : '-',
    id === G.firstHood(cityOf(game)) && !game.shops[id].managed ? G.founderPizzasLeft(game) : '',
  ].join('#');
}

interface LevelPart extends Omit<DrawerView, 'line' | 'cards' | 'decor'> {
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

/** The lines of the three kitchen cards and the grade card, from the capacity numbers (the ones a hand-tapped station moves). */
function handLine(game: G.GameState, id: NeighborhoodId, k: 'prep' | 'ovens' | 'counter'): string {
  const cap = stationCapacity(game, id, k);
  const shop = game.shops[id];
  return k === 'prep' ? `${cap} · batch ${G.tapBatch(shop)} (bigger at Lv ${G.nextBatchLevel(shop)})` : cap;
}
function gradeLine(game: G.GameState, id: NeighborhoodId, next: string): string {
  const m = stationCap(game, id, 'ovens');
  const after = capacityAfter(game, id, 'grade', game.lastSavedAt);
  return `→ ${next} ×2 · Ovens ${capacityText(m.now, after)}`;
}

function buildLevelPart({ game, id }: DrawerInput): LevelPart {
  const shop = game.shops[id];
  const city = cityOf(game);
  const nd = G.def(id, city);
  const v = game.vehicle;
  const { fit } = city;
  const perk = G.perkOf(id, shop, city);
  // Until the stations run themselves, upgrades here only pay while you tap: mute them so the hires stand out (C68).
  const first = id === G.firstHood(city);
  const idleShop = !G.runsItself(shop) && !first;

  const card = (
    what: G.Upgrade,
    props: { icon: DrawerIcon; title: string; level?: string; detail: string; wide?: boolean; costLabel?: string },
  ): DrawerCard => {
    const cost = G.upgradeCostOf(game, id, what);
    const lock = G.upgradeLock(game, id, what);
    const muted = idleShop && what !== 'manager' && !G.isHeadUpgrade(what);
    // D413: a station only the level cap locks offers the Expand buy right on its card, as the sidewalk does
    const expandCost = capExpandCost(game, id, what);
    return {
      key: what,
      testID: `buy-${what}`,
      ...props,
      detail:
        lock && what !== 'manager' ? lock : lock && what === 'manager' && !first ? `${lock} · then ${managerTakes(city.managers[id].name)}` : props.detail,
      muted,
      // D550: the Expand buy is basil like every other buy (the word "Expand" is on its label); amber is the sidewalk's
      tone: buttonTone({ lock: expandCost !== null ? null : lock, muted }),
      cost: expandCost ?? (lock ? null : cost),
      buyLabel: expandCost !== null ? `Expand · ${money(expandCost)}` : undefined,
      costLabel: props.costLabel ?? (lock && !/Finest|Biggest|Max/.test(lock) ? 'Locked' : 'MAX'),
      buy: { t: 'upgrade', what: expandCost !== null ? 'expand' : what },
    };
  };
  // Seating card: when the next visible table arrives
  const nextTableHint = (() => {
    const shown = G.tablesShown(shop, fit);
    for (let l = shop.tables + 1; l <= shop.tables + 400; l++) {
      if (G.tablesShown({ ...shop, tables: l }, fit) > shown) return l === shop.tables + 1 ? 'next level: +1 table' : `+1 table at Lv ${l}`;
    }
    return 'dining room full';
  })();
  const walkIns = capacityText(G.walkInRate(shop) * 60, G.walkInRate({ ...shop, tables: shop.tables + 1 }) * 60);
  const gradeNext = fit.ovenGrades[shop.grade + 1];
  const fpNext = fit.footprints[shop.footprint + 1];
  const fleetLockRaw = G.nextVehicleLock(game);
  const fleetLock = fleetLockRaw ? G.vehicleLockLabel(fleetLockRaw) : null;
  const nextVeh = fit.vehicles[v + 1];
  // the fleet's deliveries a minute now and with the next vehicle: the drivers' capacity scaled by what the vehicle changes
  const deliveries = (() => {
    if (!nextVeh) return null;
    const now = stationCap(game, id, 'drivers').now;
    const cur = G.deliveryRate(shop, v, fit);
    const next = G.deliveryRate(shop, v + 1, fit);
    return capacityText(now, cur > 0 ? (now * next) / cur : next * 60);
  })();

  const cards: DrawerCard[] = [];
  if (!shop.managed) {
    for (const k of HEAD_KINDS) {
      cards.push(
        card(G.HEAD_UPGRADE[k], {
          icon: { t: 'head', kind: k, name: city.heads[id][k] },
          title: `${HEAD_TITLE[k]}: ${city.heads[id][k]}`,
          // what the hire does, in words: "Marco takes the prep table" (D358: short enough not to leave a word alone on its last line)
          detail: headTakes(city.heads[id][k], k),
          wide: true,
          costLabel: 'Hired',
        }),
      );
    }
    cards.push(
      card('manager', {
        icon: first && city.managers[id].id === 'nonna-rosa' ? { t: 'nonna' } : { t: 'gm', name: city.managers[id].id },
        title: first ? `Manager: ${city.managers[id].name}` : `Hire ${aOrAn(nd.name)} ${nd.name} manager`,
        detail: first ? `Keep baking — ${G.founderCountdownText(game)}` : managerTakes(city.managers[id].name),
        wide: true,
        costLabel: first ? 'Soon' : undefined,
      }),
    );
  }
  cards.push(
    card('prep', {
      icon: { t: 'station', what: 'prep' },
      title: 'Prep Cooks',
      level: `Lv ${shop.prep}`,
      detail: handLine(game, id, 'prep'),
    }),
    card('ovens', {
      icon: { t: 'station', what: 'ovens' },
      title: 'Ovens',
      level: `Lv ${shop.ovens}`,
      detail: handLine(game, id, 'ovens'),
    }),
    card('counter', {
      icon: { t: 'station', what: 'counter' },
      title: 'Counter',
      level: `Lv ${shop.counter}`,
      detail: handLine(game, id, 'counter'),
    }),
    card('drivers', {
      icon: { t: 'station', what: 'drivers' },
      title: 'Drivers',
      level: `× ${shop.drivers}`,
      detail: `Deliveries ${stationCapacity(game, id, 'drivers')}`,
    }),
    card('tables', {
      icon: { t: 'station', what: 'tables' },
      title: 'Seating',
      level: `Lv ${shop.tables}`,
      detail:
        nextTableHint === 'dining room full'
          ? `Dining room full · walk-ins ${perMinute(G.walkInRate(shop) * 60)}/min`
          : `Walk-ins ${walkIns} · ${nextTableHint}`,
    }),
    card('grade', {
      icon: { t: 'station', what: 'grade' },
      title: 'Grade',
      level: fit.ovenGrades[shop.grade].name,
      detail: gradeNext ? gradeLine(game, id, gradeNext.name) : 'Finest ovens in town',
    }),
    card('expand', {
      icon: { t: 'station', what: 'expand' },
      title: 'Expand',
      level: `${shop.footprint + 1}/5`,
      detail: fpNext
        ? `×1.5 prep & counter · Lv cap ${G.levelCap(shop)} → ${G.levelCap({ ...shop, footprint: shop.footprint + 1 })}`
        : `${fit.footprints[shop.footprint].name} — biggest it gets`,
    }),
    {
      key: 'fleet',
      testID: 'buy-fleet',
      icon: { t: 'station', what: 'fleet' },
      title: 'Fleet',
      detail: nextVeh
        ? fleetLock
          ? `→ ${nextVeh.name}s · ${fleetLock.charAt(0).toLowerCase()}${fleetLock.slice(1)}`
          : `→ ${nextVeh.name}s, all shops · Deliveries ${deliveries}`
        : `${fit.vehicles[v].name}s — top tier`,
      cost: nextVeh && !fleetLock ? nextVeh.cost : null,
      costLabel: nextVeh ? 'Locked' : 'MAX',
      tone: buttonTone({ lock: !nextVeh || !!fleetLock }),
      buy: { t: 'fleet' },
    },
  );

  const decorPct = Math.round((perk?.decorBoost ?? DECOR_BOOST) * 100);
  const decor: DrawerCard[] = DECOR_KINDS.map((kind) => {
    const d = DECOR[kind];
    const tier = shop.decor[kind];
    const cost = G.decorCost(game, id, kind);
    return {
      key: kind,
      testID: `decor-${kind}`,
      icon: { t: 'decor', kind },
      title: d.name,
      level: `${tier}/3`,
      detail: cost === null ? d.tiers[3] : `→ ${d.tiers[tier + 1]} · +${decorPct}% pizza price`,
      cost,
      costLabel: 'MAX',
      tone: buttonTone({ lock: cost === null, muted: idleShop }),
      muted: idleShop,
      buy: { t: 'decor', kind },
    };
  });

  return {
    title: `Rosa’s · ${nd.name}`,
    idleBanner: idleShop,
    perkBanner: perk ? `★ ${perk.who}’s perk: ${perk.text}` : null,
    cards,
    decorTitle: `Decor · each tier: +${decorPct}% pizza price in this shop`,
    decor,
    built: hoodIds(city).filter((i) => game.shops[i].built).length,
  };
}

const withCash = (c: DrawerCard, cash: number) => ({ ...c, canBuy: G.canAfford({ cash }, c.cost) });

/** The drawer's whole model for one shop: the cached level part plus what cash and time decide (`canBuy`, the header's line). */
export function drawerCards(input: DrawerInput): DrawerView {
  const { game, id } = input;
  const { cards, decor, ...rest } = levelPart(input);
  // a hand-tapped station's numbers move every tick: those cards' lines are made again from the cached machine numbers (U34)
  const byHand = tapsByHand(game, id);
  const fresh = (c: DrawerCard): DrawerCard => {
    const k = c.key;
    if (!byHand || (k !== 'prep' && k !== 'ovens' && k !== 'counter' && k !== 'grade') || G.upgradeLock(game, id, k)) return c;
    const next = game.shops[id] && cityOf(game).fit.ovenGrades[game.shops[id].grade + 1];
    return { ...c, detail: k === 'grade' ? (next ? gradeLine(game, id, next.name) : c.detail) : handLine(game, id, k) };
  };
  return {
    ...rest,
    line: drawerLine(game, id),
    cards: cards.map((c) => withCash(fresh(c), game.cash)),
    decor: decor.map((c) => withCash(c, game.cash)),
  };
}
