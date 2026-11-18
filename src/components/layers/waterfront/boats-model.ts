// Waterfront, the boats, the warming rack and the Pier 9 auction, as plain data (v5.16 S2a). The rules are
// engine/features/layers/waterfront-boats.ts (`boatsView`, `rackPrice`) and content/layers.ts (`auctionMult`); the words are the copy table.
// Pure: unit-tested in node.
import { AUCTION, BOATS, LAYER_KEYS, auctionMult } from '../../../content/layers';
import { HOME_BID } from '../../../content/cities/home/data';
import { money } from '../../../engine/format';
import { canAfford, bidAvailable, bidPrice, type GameState } from '../../../engine/game';
import type { BoatsView } from '../../../engine/features/layers/waterfront-boats';
import { mmss } from '../layer-model';
import { dressed } from '../city-dress';
import { LABELS, lc, lcc } from '../layer-text';
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

/**
 * The boat's art: hull half-length 27 at scale 1, drawn at most at 0.85 and at least at 0.3 (a far boat). D482: the waterline is y 190, in
 * the sea band (the backdrop's sea runs from y 176 down to where the beach starts, which in the strip beside the shop is never above
 * y `sandTop` 198), and the wake under the hull reaches `wake` art units below it, so the whole boat floats on water, not on the sand
 * (it used to sit at y 231, on the beach).
 */
export const BOAT_ART = { half: 27, scale: 0.85, minScale: 0.3, waterline: 190, wake: 9, seaTop: 176, sandTop: 198 } as const;

/** Sea left clear on each side of the docked boat, scene units (D482: it touched the wall at 2; the narrowest strip, 21 wide, still leaves 2.4 either side at the smallest boat). */
export const BOAT_PAD = 4;

/**
 * Where the boat docks, and how big it is there (D482). The only sea the backdrop shows is the strip left of the shop's side wall, between
 * the screen's edge and `wallLeft` (the room's front corner on screen): 21 to 64 units wide by footprint. The boat is scaled to fit that
 * strip with a pad on each side and docked in the middle of it, so the whole hull is on screen, off the wall and off the screen edge. It
 * sails in from beyond the left edge and out the same way; on the way the wall hides the part behind it (`clipX`).
 */
export function boatDock(wallLeft: number): { x: number; scale: number; clipX: number; left: number; right: number } {
  const clipX = Math.max(0, wallLeft);
  const fit = (clipX - 2 * BOAT_PAD) / (2 * BOAT_ART.half);
  const scale = Math.max(BOAT_ART.minScale, Math.min(BOAT_ART.scale, fit));
  const x = clipX / 2;
  return { x, scale, clipX, left: x - BOAT_ART.half * scale, right: x + BOAT_ART.half * scale };
}

// ---------- the HUD chip ----------

export interface HarbourChip {
  text: string;
  hot: boolean;
  sheet: 'boat' | 'auction';
}

/** The chip: the boat's stay while it is docked, the auction's next raise while the auction is live, else the next boat; only beside the Waterfront shop (a docked boat shows anywhere). */
export function harbourChip(v: BoatsView, a: AuctionStatus, active: string, city?: string, hood: string = BOATS.hood): HarbourChip | null {
  if (!v.active) return null;
  if (v.boat) return { text: lcc(city, 'layer.waterfront.boat.chip', { time: mmss(v.left) }), hot: true, sheet: 'boat' };
  if (active !== hood) return null;
  if (a.live && !a.maxed) return { text: lc('layer.waterfront.auction.chip', { time: mmss(a.nextIn) }), hot: false, sheet: 'auction' };
  return { text: `${label(city, 'nextBoat')} ${mmss(v.nextIn)}`, hot: false, sheet: 'boat' };
}

export const boatBanner = (v: BoatsView, city?: string): string => (v.active && v.boat ? lcc(city, 'layer.waterfront.boat.banner') : '');

/** A caption of the layer in a city (the supper orders say "Next order" where the harbour says "Next boat"). */
export const label = (city: string | undefined, key: 'nextBoat' | 'boatLeft' | 'rack' | 'rackEmpty' | 'maxed'): string =>
  dressed(city, `label.${key}`, LABELS[key]);

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
 * Where the rack stands: on the back wall at the counter's right end, just behind its pizza boxes, and never past the glazed front's left
 * jamb (D482: it stood on the PIZZERIA window's frame). The back wall is at room y 100, so the rack is drawn at that depth's scale; its
 * widest tier (RACK_W x 1.2) must end `RACK_GAP` short of the jamb, which is where `facade.tsx` starts the window (door.x0 - 8 on the front plane).
 */
export const RACK_GAP = 3;
export function rackBox(lay: Pick<Layout, 'counter' | 'R' | 'door'>): RackBox {
  const y = 100;
  const x = Math.min(lay.counter.x1 + 2, lay.R - 30);
  const k = kAt(y) * 1.1;
  const [sx, sy] = P(x, y);
  const jamb = P(lay.door.x0 - 8, 0)[0] - RACK_GAP;
  return { x: Math.min(sx, jamb - (RACK_W * 1.2 * k) / 2), y: sy, k };
}

/** The rack card in the drawer: its price, its tier name and what it holds. */
export interface RackCard {
  title: string;
  detail: string;
  cost: number | null;
  costLabel: string;
  tier: number;
}

const TIER_KEYS = [
  'upgrade.waterfront.rack.tier.1',
  'upgrade.waterfront.rack.tier.2',
  'upgrade.waterfront.rack.tier.3',
  'upgrade.waterfront.rack.tier.4',
] as const;

/** The name of a tier (1..4). */
export const tierName = (tier: number, city?: string): string => (tier >= 1 && tier <= 4 ? lcc(city, TIER_KEYS[tier - 1]) : '');

export function rackCard(v: BoatsView, city?: string): RackCard {
  const next = v.rackTier + 1;
  const owned = v.rackTier > 0 ? `${tierName(v.rackTier, city)}: holds ${v.rackCapacity}` : label(city, 'rackEmpty');
  const nextName = v.rackPrice !== null ? ` · next ${tierName(next, city)}: ${BOATS.rack.capacity[next - 1]}` : '';
  return {
    title: lcc(city, 'upgrade.waterfront.rack.name'),
    detail: `${owned}${nextName}`,
    cost: v.rackPrice,
    costLabel: label(city, 'maxed'),
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

const openedAtOf = (g: GameState): number => (g.x?.[LAYER_KEYS.boats] as { openedAt?: number } | undefined)?.openedAt ?? -1;

export function auctionStatus(g: GameState): AuctionStatus {
  const openedAt = openedAtOf(g);
  const live = bidAvailable(g) && openedAt >= 0;
  // v5.18 shows the home bid's cost as the base in every city (BUG, reported with R1: fix is the city's own, `cityOf(g).bid?.cost ?? 0`)
  const base = HOME_BID.cost;
  const cap = Math.ceil(base * (1 + AUCTION.maxShare));
  if (!live) return { live: false, price: bidPrice(g), base, cap, raises: 0, maxed: false, nextIn: 0 };
  const since = Math.max(0, g.playSeconds - openedAt);
  const raises = Math.min(Math.round(AUCTION.maxShare / AUCTION.stepShare), Math.floor(since / AUCTION.stepSeconds));
  const maxed = auctionMult(openedAt, g.playSeconds) >= 1 + AUCTION.maxShare - 1e-9;
  return {
    live,
    price: bidPrice(g),
    base,
    cap,
    raises,
    maxed,
    nextIn: maxed ? 0 : Math.max(0, Math.ceil(AUCTION.stepSeconds - (since % AUCTION.stepSeconds))),
  };
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
    canBuy: canAfford({ cash }, a.price),
  };
}

/** The notice for a raise just seen: "Outbid!" when the player could have paid the old price and cannot pay the new one. */
export function raiseNotice(before: number, after: number, cash: number): string {
  if (!(after > before)) return '';
  return cash >= before && cash < after
    ? lc('layer.waterfront.auction.outbid', { bid: money(after) })
    : lc('layer.waterfront.auction.raise', { bid: money(after) });
}
