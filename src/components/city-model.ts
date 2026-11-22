// What each lot on the City map and list says, as plain data (D305). A lot that is next in line but still held back
// by the founder's takeover is a padlock with the countdown, not a live "Build $300" the player can't act on. The countdown
// is the same source the build refusal's toast uses (`G.founderCountdownText`). The founder is the city's (Nonna at home, Father Dom
// in Boston): the words are copy keys with `{founder}` (content/copy/home/lines.ts), never a literal here. Pure: unit-tested in node.
import { t } from '../content/copy';
import type { NeighborhoodDef } from '../content/tuning';
import { money, pizzasLeft } from '../engine/format';
import { cityOf } from '../content/cities';
import { buildChapter, chapterNumber } from '../engine/chapters';
import * as G from '../engine/game';

export interface LotView {
  /** built: a pizzeria; buildable: next in line and free to build; founder: next in line, held until the city's founder takes over; chapter: next in line, held until the chapter of the shop before it has played (E1b); queued: waiting for the lot before it. */
  kind: 'built' | 'buildable' | 'founder' | 'chapter' | 'queued';
  /** The caption on the map pin ("" for a built lot, which shows its income instead). */
  pin: string;
  /** C146: pies the first shop still has to deliver before the founder takes over, as a number (`piesToGo` formats it); null unless the lot is held by the takeover or it is due ("soon"). */
  pinsLeft: number | null;
  /** C146: the founder who holds the lot ("Nonna", "Father Dom"); null unless the lot is held by the takeover. */
  founder: string | null;
  /** The list row's second line (unbuilt lots only). */
  rowSub: string;
  /** The list row's right-hand text; null shows the padlock instead. */
  rowRight: string | null;
  /** Draw the padlock: a lot you can't build yet. */
  locked: boolean;
  /** Dim the pin and the row: the lot is held back, not just waiting. */
  dim: boolean;
  /** The row is tappable (build, or visit when built; a lot held by a chapter opens the Story tab: `LOCKED_LOT_TAP`). */
  tappable: boolean;
}

export function lotView(s: G.GameState, n: NeighborhoodDef): LotView {
  if (s.shops[n.id].built)
    return { kind: 'built', pin: '', pinsLeft: null, founder: null, rowSub: '', rowRight: null, locked: false, dim: false, tappable: true };
  const isNext = G.nextToBuild(s)?.id === n.id;
  if (!isNext)
    return {
      kind: 'queued',
      pin: '???',
      pinsLeft: null,
      founder: null,
      rowSub: 'Build the previous pizzeria first',
      rowRight: null,
      locked: true,
      dim: false,
      tappable: false,
    };
  // the next lot's locks are Nonna's takeover (the second lot) and then the story of the shop before it (E1b); the previous lot is built by definition
  const lock = G.buildLock(s, n.id);
  const city = cityOf(s);
  const takeoverHeld = city.neighbourhoods[1]?.id === n.id && !s.seenScenes.includes(city.fit.takeover.sceneId);
  const held = lock !== null && !takeoverHeld ? buildChapter(s, n.id) : null;
  if (held) {
    return {
      kind: 'chapter',
      pin: `Opens after Ch ${chapterNumber(s, held)}`, // D540: the lot says what opens it (the row's line keeps "Finish Chapter N first")
      pinsLeft: null,
      founder: null,
      rowSub: lock!,
      rowRight: null,
      locked: true,
      dim: true,
      tappable: true,
    };
  }
  if (lock !== null) {
    const left = G.founderPizzasLeft(s);
    const founder = G.founderName(s);
    return {
      kind: 'founder',
      pin: left > 0 ? t('lot.pin.founder', { founder, n: pizzasLeft(left) }, s.city) : t('lot.pin.founder.soon', { founder }, s.city),
      pinsLeft: left > 0 ? left : null,
      founder,
      rowSub: G.founderCountdownText(s),
      rowRight: null,
      locked: true,
      dim: true,
      tappable: false,
    };
  }
  return {
    kind: 'buildable',
    pin: `Build ${money(n.buildCost)}`,
    pinsLeft: null,
    founder: null,
    rowSub: `Pays ${money(n.orderValue)} a pizza · manager ${money(n.managerCost)}`,
    rowRight: `Build ${money(n.buildCost)}`,
    locked: false,
    dim: false,
    tappable: true,
  };
}

/** The countdown under a held lot's tab ("2.21K pies to go", "1 pie to go"), formatted from `LotView.pinsLeft` (C146); the city's own words when it has them. */
export const piesToGo = (left: number, city?: string): string => t(left <= 1 ? 'lot.piesToGo.one' : 'lot.piesToGo', { n: pizzasLeft(left) }, city);

/** Where a tap on a lot held by a chapter goes (`LotView.kind` 'chapter'): the shop, with the task list open on its Story tab (the shop screen reads `tasks`). */
export const LOCKED_LOT_TAP = { pathname: '/', params: { tasks: 'story' } } as const;
