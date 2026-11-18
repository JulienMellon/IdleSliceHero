// The rival (MegaSlice across the street), as plain data (v5.16 S2a): the "-20% sales" tag, the storefront's place in the scene, the
// challenge card in its three faces (offer, running, result) and the shutters. The rules are engine/features/layers/rival.ts (`rivalView`);
// the words are the copy table (`rival.<hood>.*`). Pure: unit-tested in node.
import { RIVAL } from '../../../content/layers';
import { ORDER } from '../../../content/hooks';
import { cityOf } from '../../../content/cities';
import type { CityDef } from '../../../content/cities/types';
import { castOf } from '../../../engine/orders';
import type { CharacterId, NeighborhoodId } from '../../../content/types';
import type { RivalView } from '../../../engine/features/layers/rival';
import { behindPace } from '../../order-model';
import { CURB_Y } from '../../scene/projection';
import { mmss, step5 } from '../layer-model';
import { LABELS, lc, rivalLine, rivalSpeaker } from '../layer-text';

// ---------- the tag ----------

/** "-20%": how much of the shop's sales the rival takes while it is open (the value multiplier's other side). */
export const rivalPercent = (valueMult: number = RIVAL.valueMult): number => Math.round((1 - valueMult) * 100);

/** The HUD tag's text ("−20% sales", with the real minus sign), or '' when no rival is open here. */
export const rivalTagText = (v: Pick<RivalView, 'open'>): string => (v.open ? lc('rival.tag') : '');

// ---------- the storefront across the street ----------

/**
 * Where the MegaSlice shop stands (D481): across the road from the shop's door, on the far kerb at the screen's foot, drawn WHOLE (sign,
 * awning, window, door, shutter box, kerb) at 60% of its 108 x 52 art, so it is 65 x 31 on screen and its kerb ends 8 units above the
 * scene's last row (the old 96 x 44 shop sat flush on the bottom edge and read as cropped under the road). Small and at the left, away from
 * the door's walk-in lane. It sits below the curb and the sidewalk row (the row, the report strip and the doormat are all above the curb
 * line). Scene units.
 */
export const RIVAL_SHOP = {
  /** The drawing's own size, and how much of it shows. */
  art: { w: 108, h: 52 },
  scale: 0.6,
  /** On screen: the whole shop, sign to foot. */
  w: 65,
  h: 31,
  /** Left edge and top. */
  x: 12,
  top: 635,
  /** The far kerb it stands on, under its foot. */
  kerb: 6,
  /** The pavement slab under it: how far it reaches past the shop on each side, and how far up the shop's foot it rises. */
  slab: 8,
  slabRise: 5,
  /** The sign's text is never drawn under this size, whatever the shop's scale. */
  signFont: 10,
} as const;

/** The rect the rival occupies (scene units): the tests keep it clear of the mat, the strip and the sidewalk row. */
export const rivalRect = () => ({ x0: RIVAL_SHOP.x, x1: RIVAL_SHOP.x + RIVAL_SHOP.w, y0: RIVAL_SHOP.top, y1: RIVAL_SHOP.top + RIVAL_SHOP.h + RIVAL_SHOP.kerb });

/** The road's lower edge is the screen's foot; the rival must stay below the curb. */
export const RIVAL_BELOW = CURB_Y;

// ---------- the shutters ----------

/** Seconds the shutters take to come down, and how long the closed shop stays up before it is taken away. */
export const SHUTTERS = { down: 1.1, hold: 2.4 } as const;

/** How far the shutters have come down, 0..1, `age` seconds after the win. */
export const shutterShare = (age: number): number => Math.max(0, Math.min(1, age / SHUTTERS.down));

/** The closed shop is taken off the scene this long after the win. */
export const SHUTTERS_TOTAL = SHUTTERS.down + SHUTTERS.hold;

// ---------- the challenge card ----------

export type CardFace = 'none' | 'offer' | 'running' | 'won' | 'lost';

export interface RivalCardModel {
  face: CardFace;
  hood: NeighborhoodId;
  who: CharacterId;
  /** Who is speaking on the card. */
  speaker: string;
  /** The opening line (offer), win line or lose line. */
  line: string;
  /** "Bake Them Out: 120 pies in 5 minutes". */
  title: string;
  /** "23 / 120 pies" (running). */
  progress: string;
  fillStep: number;
  drainStep: number;
  clock: string;
  urgent: boolean;
  behind: boolean;
  /** The button of the offer: "Start", or the wait left to retry. */
  button: string;
  canStart: boolean;
}

const HOME = cityOf({});

const NONE = (hood: NeighborhoodId): RivalCardModel => ({
  face: 'none',
  hood,
  who: 'todd-coat',
  speaker: '',
  line: '',
  title: '',
  progress: '',
  fillStep: 0,
  drainStep: 0,
  clock: '',
  urgent: false,
  behind: false,
  button: '',
  canStart: false,
});

/** Todd opens the rival in most places; Victor Crust on the boardwalk and the avenue (the copy file's speakers). */
export function opener(hood: NeighborhoodId, city: CityDef = HOME): CharacterId {
  // another city's rival is opened by its own lieutenant (Boston: Trish Vance)
  if (city !== HOME) return city.lieutenant.id;
  return rivalSpeaker(hood, 'open') === 'Victor Crust' ? 'victor-crust' : 'todd-coat';
}

/** The character who answers the rival in a shop: the home city's cast table, else the neighbourhood's own character from the city's story. */
function answerer(hood: NeighborhoodId, city: CityDef): { who: CharacterId; name: string } {
  const cast = city === HOME ? castOf(hood) : undefined;
  if (cast) return { who: cast.who, name: cast.name };
  const first = city.scenes.find((sc) => sc.neighborhood === hood && sc.beat === 1);
  return { who: first?.character ?? city.lieutenant.id, name: city.managers[hood]?.name ?? 'MegaSlice' };
}

/** The name the opener signs a line with. */
const openerName = (hood: NeighborhoodId, city: CityDef): string => (city === HOME ? (rivalSpeaker(hood, 'open') ?? 'MegaSlice') : city.lieutenant.name);

const URGENT = 15;

/**
 * The card for one shop. `result` is a win or a loss just seen (set by the card's own watcher when a running challenge ends), so the card
 * can say how it ended once; otherwise it shows the offer or the running chip.
 */
export function rivalCard(v: RivalView, hood: NeighborhoodId, result: 'won' | 'lost' | null = null, city: CityDef = HOME): RivalCardModel {
  const id = city.id;
  const title = rivalLine(hood, 'title', { n: v.target }, id);
  const cast = answerer(hood, city);
  if (result === 'won')
    return { ...NONE(hood), face: 'won', who: cast.who, speaker: rivalSpeaker(hood, 'win') ?? cast.name, line: rivalLine(hood, 'win', {}, id) };
  if (result === 'lost' && v.open)
    return { ...NONE(hood), face: 'lost', who: cast.who, speaker: rivalSpeaker(hood, 'lose') ?? cast.name, line: rivalLine(hood, 'lose', {}, id) };
  // 'waiting': the rival is open but the finale wait is not over (engine `challengeOffered`): nothing to start, nothing to show
  if (!v.open || v.phase === 'waiting') return NONE(hood);
  if (v.phase === 'running') {
    const left = v.secondsLeft;
    return {
      ...NONE(hood),
      face: 'running',
      who: opener(hood, city),
      speaker: openerName(hood, city),
      title,
      progress: `${Math.floor(v.progress)} / ${v.target} pies`,
      fillStep: step5(v.target > 0 ? v.progress / v.target : 0),
      drainStep: step5(left / RIVAL.challengeSeconds),
      clock: mmss(left),
      urgent: left <= URGENT,
      behind: behindPace(v.progress, v.target, (left * ORDER.windowSeconds) / RIVAL.challengeSeconds),
    };
  }
  const wait = v.phase === 'retry';
  return {
    ...NONE(hood),
    face: 'offer',
    who: opener(hood, city),
    speaker: openerName(hood, city),
    line: rivalLine(hood, 'open', {}, id),
    title,
    button: wait ? `${LABELS.retryIn} ${mmss(v.retryIn)}` : LABELS.start,
    canStart: !wait,
  };
}

/** How long a result stays on the card before it clears (ms). */
export const RESULT_MS = 6000;

/** The card's state in one string: open, phase, pies asked, seconds left, the pies bar's 5% step and the retry wait. A repaint only when it changes. */
export const rivalLite = (v: RivalView): string =>
  `${v.open ? 1 : 0}|${v.phase}|${v.target}|${v.secondsLeft}|${step5(v.target > 0 ? v.progress / v.target : 0)}|${v.retryIn}`;
