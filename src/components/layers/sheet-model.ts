// The layers' info sheets as plain data (v5.16 S2a): one per layer, opened from its HUD chip. What it is (the copy file's info body), the
// numbers right now, and what to buy to do better (real purchases with their prices). Pure: unit-tested in node.
import { BOATS, RIVAL } from '../../content/layers';
import { money } from '../../engine/format';
import { upgradeCostOf, type GameState } from '../../engine/game';
import { gameDayView } from '../../engine/features/layers/suburbs-gameday';
import { boatsView } from '../../engine/features/layers/waterfront-boats';
import { rivalTarget, rivalView } from '../../engine/features/layers/rival';
import type { NeighborhoodId } from '../../content/types';
import { auctionStatus, label, tierName } from './waterfront/boats-model';
import { rivalCard, rivalPercent } from './rival/rival-model';
import { cityOf } from '../../content/cities';
import { isDressed } from './city-dress';
import { hoodOf } from './city-layers';
import { mmss } from './layer-model';
import { LABELS, lc, lcc } from './layer-text';
import type { SheetKind } from './sheet-state';

export interface SheetRow {
  key: string;
  label: string;
  value: string;
}
export interface SheetBuy {
  key: string;
  title: string;
  line: string;
}
export interface SheetModel {
  kind: SheetKind;
  title: string;
  body: string;
  /** Who says the body (the rival's sheet quotes its opener), or ''. */
  speaker: string;
  rows: SheetRow[];
  buys: SheetBuy[];
  /** The sheet's one button (the rival's Start), or null. */
  action: { label: string; enabled: boolean } | null;
}

const price = (g: GameState, id: NeighborhoodId, what: 'tables' | 'ovens' | 'counter' | 'drivers' | 'prep'): string => {
  const c = upgradeCostOf(g, id, what);
  return c === null ? 'maxed' : money(c);
};

export function gameDaySheet(g: GameState, now: number): SheetModel {
  const v = gameDayView(g, now);
  const id = hoodOf(g, 'gameDay');
  return {
    kind: 'gameday',
    title: lcc(g.city, 'layer.suburbs.gameday.info.title'),
    body: lcc(g.city, 'layer.suburbs.gameday.info.body'),
    speaker: '',
    action: null,
    rows: [
      { key: 'next', label: v.rush ? LABELS.rushLeft : LABELS.nextGame, value: mmss(v.rush ? v.left : v.nextIn) },
      { key: 'seats', label: LABELS.seatsFree, value: `${v.seatsFree} / ${v.seats}` },
    ],
    buys: [
      { key: 'tables', title: `Seating · ${price(g, id, 'tables')}`, line: 'More tables mean more free seats for the families.' },
      { key: 'counter', title: `Counter · ${price(g, id, 'counter')}`, line: 'A faster counter serves the whole wave.' },
    ],
  };
}

export function boatSheet(g: GameState, now: number): SheetModel {
  const v = boatsView(g, now);
  const id = hoodOf(g, 'boats');
  const city = g.city;
  const rows: SheetRow[] = [
    { key: 'next', label: v.boat ? label(city, 'boatLeft') : label(city, 'nextBoat'), value: mmss(v.boat ? v.left : v.nextIn) },
    { key: 'rack', label: label(city, 'rack'), value: v.rackTier > 0 ? `${v.rackPies} / ${v.rackCapacity} · ${tierName(v.rackTier, city)}` : label(city, 'rackEmpty') },
  ];
  const buys: SheetBuy[] = [];
  if (v.rackPrice !== null) buys.push({ key: 'rack', title: `${tierName(v.rackTier + 1, city)} · ${money(v.rackPrice)}`, line: `Holds ${BOATS.rack.capacity[v.rackTier]} pies ${isDressed(city, 'label.nextBoat') ? 'between orders' : 'between boats'}.` });
  buys.push({ key: 'counter', title: `Counter · ${price(g, id, 'counter')}`, line: 'A faster counter empties the rack faster.' });
  return { kind: 'boat', title: lcc(city, 'layer.waterfront.boat.info.title'), body: `${lcc(city, 'layer.waterfront.boat.info.body')} ${lcc(city, 'upgrade.waterfront.rack.info.body')}`, speaker: '', rows, buys, action: null };
}

export function auctionSheet(g: GameState): SheetModel {
  const a = auctionStatus(g);
  const rows: SheetRow[] = [
    { key: 'now', label: LABELS.bidNow, value: money(a.price) },
    { key: 'base', label: LABELS.bidBase, value: money(a.base) },
    { key: 'cap', label: LABELS.bidCap, value: money(a.cap) },
    { key: 'raises', label: LABELS.raises, value: String(a.raises) },
  ];
  if (a.live && !a.maxed) rows.push({ key: 'next', label: LABELS.nextRaise, value: mmss(a.nextIn) });
  return {
    kind: 'auction',
    title: lc('layer.waterfront.auction.info.title'),
    body: lc('layer.waterfront.auction.info.body'),
    speaker: '',
    action: null,
    rows,
    buys: [
      { key: 'ovens', title: `Ovens · ${price(g, hoodOf(g, 'boats'), 'ovens')}`, line: lc('layer.waterfront.auction.outbid.line') },
      { key: 'drivers', title: `Drivers · ${price(g, hoodOf(g, 'boats'), 'drivers')}`, line: 'More sales means the cash is there before the next raise.' },
    ],
  };
}

export function rivalSheet(g: GameState, id: NeighborhoodId, now: number): SheetModel {
  const v = rivalView(g, id, now);
  // while the rival is still setting up (`waiting`) the view has no target: show what it would ask
  const target = v.target > 0 ? v.target : rivalTarget(g, id, now);
  const timeLabel = v.phase === 'retry' ? LABELS.retryIn : LABELS.timeLeft;
  const rows: SheetRow[] = [
    { key: 'sales', label: LABELS.sales, value: `\u2212${rivalPercent(v.valueMult)}%` },
    { key: 'target', label: LABELS.target, value: `${target} pies` },
  ];
  if (v.phase === 'waiting') rows.push({ key: 'time', label: LABELS.challenge, value: LABELS.soon });
  else rows.push({ key: 'time', label: timeLabel, value: mmss(v.phase === 'running' ? v.secondsLeft : v.phase === 'retry' ? v.retryIn : RIVAL.challengeSeconds) });
  const card = rivalCard(v, id, null, cityOf(g));
  return {
    kind: 'rival',
    title: lc('rival.info.title'),
    body: lc('rival.info.body'),
    speaker: '',
    rows,
    buys: [
      { key: 'rush', title: 'Rush the shop', line: 'The target is 20% above your normal pace: tap to rush while it runs.' },
      { key: 'prep', title: `Prep · ${price(g, id, 'prep')}`, line: 'A faster kitchen clears more pies in five minutes.' },
    ],
    // the Start button: offered, or waiting out a retry (greyed); nothing while setting up or running
    action: v.open && (v.phase === 'available' || v.phase === 'retry') ? { label: card.button, enabled: card.canStart } : null,
  };
}

export function sheetModel(kind: SheetKind, g: GameState, now: number): SheetModel {
  if (kind === 'gameday') return gameDaySheet(g, now);
  if (kind === 'boat') return boatSheet(g, now);
  if (kind === 'auction') return auctionSheet(g);
  return rivalSheet(g, g.active, now);
}
