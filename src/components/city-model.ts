// What each lot on the City map and list says, as plain data (D305). A lot that is next in line but still held back
// by Nonna's takeover is a padlock with the countdown, not a live "Build $300" the player can't act on. The countdown
// is the same source the build refusal's toast uses (`G.nonnaCountdownText`). Pure: unit-tested in node.
import type { NeighborhoodDef } from '../content/tuning';
import { money, pizzasLeft } from '../engine/format';
import * as G from '../engine/game';

export interface LotView {
  /** built: a pizzeria; buildable: next in line and free to build; nonna: next in line, held until Nonna takes over; queued: waiting for the lot before it. */
  kind: 'built' | 'buildable' | 'nonna' | 'queued';
  /** The caption on the map pin ("" for a built lot, which shows its income instead). */
  pin: string;
  /** The list row's second line (unbuilt lots only). */
  rowSub: string;
  /** The list row's right-hand text; null shows the padlock instead. */
  rowRight: string | null;
  /** Draw the padlock: a lot you can't build yet. */
  locked: boolean;
  /** Dim the pin and the row: the lot is held back, not just waiting. */
  dim: boolean;
  /** The row is tappable (build, or visit when built). */
  tappable: boolean;
}

export function lotView(s: G.GameState, n: NeighborhoodDef): LotView {
  if (s.shops[n.id].built) return { kind: 'built', pin: '', rowSub: '', rowRight: null, locked: false, dim: false, tappable: true };
  const isNext = G.nextToBuild(s)?.id === n.id;
  if (!isNext) return { kind: 'queued', pin: '???', rowSub: 'Build the previous pizzeria first', rowRight: null, locked: true, dim: false, tappable: false };
  // the only lock the next lot can have is Nonna's takeover (the previous lot is built by definition)
  if (G.buildLock(s, n.id) !== null) {
    const left = G.nonnaPizzasLeft(s);
    return { kind: 'nonna', pin: left > 0 ? `Nonna in ${pizzasLeft(left)}` : 'Nonna soon', rowSub: G.nonnaCountdownText(s), rowRight: null, locked: true, dim: true, tappable: false };
  }
  return { kind: 'buildable', pin: `Build ${money(n.buildCost)}`, rowSub: `Pays ${money(n.orderValue)} a pizza · manager ${money(n.managerCost)}`, rowRight: `Build ${money(n.buildCost)}`, locked: false, dim: false, tappable: true };
}
