// Waterfront, the boats, the warming rack and the Pier 9 auction, as plain data (v5.16 S2a). The rules are
// engine/features/layers/waterfront-boats.ts (`boatsView`, `rackPrice`) and content/layers.ts (`auctionMult`); the words are the copy table.
// Pure: unit-tested in node.
import { AUCTION, BOATS, LAYER_KEYS, auctionMult } from '../../../content/layers';
import { PIER9_BID } from '../../../content/tuning';
import { money } from '../../../engine/format';
import { pier9Available, pier9Price, type GameState } from '../../../engine/game';
import type { BoatsView } from '../../../engine/features/layers/waterfront-boats';
import { mmss } from '../layer-model';
import { LABELS, lc } from '../layer-text';
import type { Layout } from '../../scene/layout';
import { P, kAt } from '../../scene/projection';

// ---------- the boat in the harbour ----------

/** Seconds a boat takes to sail in and to sail out; it sits at the dock for the rest of its stay. */
export const BOAT = { sailIn: 4, sailOut: 4, stay: BOATS.rushSeconds } as const;

export type BoatPhase = 'away' | 'arriving' | 'docked' | 'leaving';
export interface BoatPose {
  phase: BoatPhase;
  /** 0 (off the right edge) .. 1 (at the dock). */
  along: number;
}

/**
 * Where the boat is. It sails in during the last `sailIn` seconds before the engine's rush starts (`untilNext`, fractional seconds to
 * the next boat), is docked exactly while the crew orders (`docked`: the engine's `boat`), and sails out for `sailOut` seconds after
 * (`sinceLeft`: seconds since it left the dock, or -1 when it did not just leave). The ease is a smooth step, so it slows into the dock.
 */
export function boatPose(a: { active: boolean; docked: boolean; untilNext: number }, sinceLeft = -1): BoatPose {
  const ease = (k: number) => k * k * (3 - 2 * k);
  if (!a.active) return { phase: 'away', along: 0 };
  if (a.docked) return { phase: 'docked', along: 1 };
  if (a.untilNext > 0 && a.untilNext <= BOAT.sailIn) return { phase: 'arriving', along: ease(1 - a.untilNext / BOAT.sailIn) };
  if (sinceLeft >= 0 && sinceLeft < BOAT.sailOut) return { phase: 'leaving', along: ease(1 - sinceLeft / BOAT.sailOut) };
  return { phase: 'away', along: 0 };
}

/** Fractional seconds to the next boat docking (Infinity when none is scheduled), `sinceTick` seconds after the last game tick. */
export function untilNextBoat(g: GameState, sinceTick = 0): number {
  const st = g.x?.[LAYER_KEYS.boats] as { nextAt?: number } | undefined;
  if (!st || typeof st.nextAt !== 'number' || st.nextAt < 0) return Infinity;
  return st.nextAt - g.playSeconds - sinceTick;
}

/** The boat's size in the harbour: hull length 50 at scale 0.85. */
export const BOAT_ART = { half: 25, scale: 0.85, waterline: 231 } as const;

/**
 * Where the boat docks and where the shop's side wall hides it. D482: the boat docks at the LEFT pier (the backdrop's pier runs x -20..50,
 * out at sea beyond the room's left wall), not at the right, where the shop's sign and the door's pillar stand. `wallLeft` (the room's front
 * corner on screen) is the right edge of what shows: the wall stands between the viewer and the sea, so a boat wider than the margin is
 * clipped there, not drawn over the shop. It sails in from beyond the left edge, bow first.
 */
export function boatDock(wallLeft: number): { x: number; clipX: number; visible: number } {
  const half = BOAT_ART.half * BOAT_ART.scale;
  const x = half;
  const clipX = Math.max(0, wallLeft);
  return { x, clipX, visible: Math.max(0, Math.min(clipX, x + half) - Math.max(0, x - half)) };
}

// ---------- the HUD chip ----------

export interface HarbourChip {
  text: string;
  hot: boolean;
  sheet: 'boat' | 'auction';
}

/** The chip: the boat's stay while it is docked, the auction's next raise while the auction is live, else the next boat; only beside the Waterfront shop (a docked boat shows anywhere). */
export function harbourChip(v: BoatsView, a: AuctionStatus, active: string): HarbourChip | null {
  if (!v.active) return null;
  if (v.boat) return { text: lc('layer.waterfront.boat.chip', { time: mmss(v.left) }), hot: true, sheet: 'boat' };
  if (active !== BOATS.hood) return null;
  if (a.live && !a.maxed) return { text: lc('layer.waterfront.auction.chip', { time: mmss(a.nextIn) }), hot: false, sheet: 'auction' };
  return { text: `${LABELS.nextBoat} ${mmss(v.nextIn)}`, hot: false, sheet: 'boat' };
}

export const boatBanner = (v: BoatsView): string => (v.active && v.boat ? lc('layer.waterfront.boat.banner') : '');

// ---------- the warming rack ----------

/** The rack is drawn in four steps; 0 = empty. */
export const RACK_STEPS = 4;

/** How full the rack looks, 0..4: a pie on the rack shows the first step, and only a full rack shows the fourth. */
export function rackStep(pies: number, capacity: number): number {
  if (!(capacity > 0) || !(pies > 0)) return 0;
  if (pies >= capacity) return RACK_STEPS;
  return Math.max(1, Math.min(RACK_STEPS - 1, Math.floor((pies / capacity) * RACK_STEPS)));
}

export interface RackBox {
  /** Screen position of the rack's foot (scene units) and its scale. */
  x: number;
  y: number;
  k: number;
}

/** Wall width of the rack in scene units at k = 1. */
export const RACK_W = 30;

/**
 * Where the rack stands: on the back wall at the counter's right end, just behind its pizza boxes (D482: further right it stood on the
 * PIZZERIA window of the front). The back wall is at room y 100, so the rack stands there and is drawn at that depth's scale.
 */
export function rackBox(lay: Pick<Layout, 'counter' | 'R'>): RackBox {
  const y = 100;
  const x = Math.min(lay.counter.x1 + 2, lay.R - 30);
  const [sx, sy] = P(x, y);
  return { x: sx, y: sy, k: kAt(y) * 1.1 };
}

/** The rack card in the drawer: its price, its tier name and what it holds. */
export interface RackCard {
  title: string;
  detail: string;
  cost: number | null;
  costLabel: string;
  tier: number;
}

const TIER_KEYS = ['upgrade.waterfront.rack.tier.1', 'upgrade.waterfront.rack.tier.2', 'upgrade.waterfront.rack.tier.3', 'upgrade.waterfront.rack.tier.4'] as const;

/** The name of a tier (1..4). */
export const tierName = (tier: number): string => (tier >= 1 && tier <= 4 ? lc(TIER_KEYS[tier - 1]) : '');

export function rackCard(v: BoatsView): RackCard {
  const next = v.rackTier + 1;
  const owned = v.rackTier > 0 ? `${tierName(v.rackTier)}: holds ${v.rackCapacity}` : LABELS.rackEmpty;
  const nextName = v.rackPrice !== null ? ` · next ${tierName(next)}: ${BOATS.rack.capacity[next - 1]}` : '';
  return {
    title: lc('upgrade.waterfront.rack.name'),
    detail: `${owned}${nextName}`,
    cost: v.rackPrice,
    costLabel: LABELS.maxed,
    tier: v.rackTier,
  };
}

// ---------- the Pier 9 auction ----------

export interface AuctionStatus {
  /** The bid is open and MegaSlice is raising. */
  live: boolean;
  /** What the bid costs now. */
  price: number;
  /** The starting bid. */
  base: number;
  /** The most it can reach. */
  cap: number;
  /** Raises so far. */
  raises: number;
  /** The price has reached the cap. */
  maxed: boolean;
  /** Seconds to the next raise (0 at the cap). */
  nextIn: number;
}

const openedAtOf = (g: GameState): number => ((g.x?.[LAYER_KEYS.boats] as { openedAt?: number } | undefined)?.openedAt ?? -1);

export function auctionStatus(g: GameState): AuctionStatus {
  const openedAt = openedAtOf(g);
  const live = pier9Available(g) && openedAt >= 0;
  const base = PIER9_BID.cost;
  const cap = Math.ceil(base * (1 + AUCTION.maxShare));
  if (!live) return { live: false, price: pier9Price(g), base, cap, raises: 0, maxed: false, nextIn: 0 };
  const since = Math.max(0, g.playSeconds - openedAt);
  const raises = Math.min(Math.round(AUCTION.maxShare / AUCTION.stepShare), Math.floor(since / AUCTION.stepSeconds));
  const maxed = auctionMult(openedAt, g.playSeconds) >= 1 + AUCTION.maxShare - 1e-9;
  return { live, price: pier9Price(g), base, cap, raises, maxed, nextIn: maxed ? 0 : Math.max(0, Math.ceil(AUCTION.stepSeconds - (since % AUCTION.stepSeconds))) };
}

export interface AuctionCard {
  title: string;
  /** "MegaSlice raised it. $126M wins Pier 9": none before the first raise. */
  raised: string;
  /** "Next raise 1:42" (none at the cap). */
  next: string;
  /** "Bid cap $180M". */
  cap: string;
  price: number;
  canBuy: boolean;
}

export function auctionCard(a: AuctionStatus, cash: number): AuctionCard {
  return {
    title: 'Pier 9 auction',
    raised: a.raises > 0 ? lc('layer.waterfront.auction.raise', { bid: money(a.price) }) : '',
    next: a.maxed ? '' : lc('layer.waterfront.auction.chip', { time: mmss(a.nextIn) }),
    cap: `${LABELS.bidCap} ${money(a.cap)}`,
    price: a.price,
    canBuy: cash >= a.price,
  };
}

/** The notice for a raise just seen: "Outbid!" when the player could have paid the old price and cannot pay the new one. */
export function raiseNotice(before: number, after: number, cash: number): string {
  if (!(after > before)) return '';
  return cash >= before && cash < after ? lc('layer.waterfront.auction.outbid', { bid: money(after) }) : lc('layer.waterfront.auction.raise', { bid: money(after) });
}
