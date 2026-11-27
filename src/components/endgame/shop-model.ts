// The Shop screen as plain data: tab 1 is the Vanity tab (v5.24, card U6), tab 2 the booster shelf. The Vanity tab reads top to bottom: the Featured
// four, then each set with its progress, then the generic looks by tier. Every card is one `VanityView` (the look's name, tier price and its owned / wear /
// buy state). Cosmetics cost diamonds; boosters are never sold (the shelf only shows the inventory and starts a booster). The rules for wearing are
// engine/rewards.ts (`wear`, `unwear`, `grantCosmetic`); buying and the weekly Featured are engine/vanity.ts; the looks are content/catalog.ts. Pure: unit-tested in node.
import { LOOKS, SETS, TIER_PRICE, type LookDef, type SetId, type Tier } from '../../content/catalog';
import { cityHolding, findHood, hoodIds } from '../../content/cities';
import { t } from '../../content/copy';
import { MASTERY, VANITY_IDS, VANITY_PRICE } from '../../content/endgame';
import { cosmeticName } from '../../content/rewards';
import { canAffordDiamonds, type GameState } from '../../engine/game';
import { featured, isSkin, nextSkin, setProgress } from '../../engine/vanity';
import { spanText } from '../rewards-model';
import { copy } from './copy-text';

// The price, the ids and the buy rule are the engine's (A30: engine/vanity.ts); this file is the views.
export { buyCosmetic, SOLD_SKIN_BASE } from '../../engine/vanity';
export { VANITY_IDS, VANITY_PRICE };

/** The Starter Pack's awning: given, never sold, so it is listed only once owned (after the generic medium looks). */
export const FOUNDER_ID = 'awning-founder';

/** The looks the plain thumbnail tile has no picture for but the Style tab's own art (vanity-art.tsx) does. */
export const OWN_ART: readonly string[] = ['oven-gold', 'oven-woodfired', 'storefront-skin', 'neon-counter', 'plaque-master', FOUNDER_ID];

/** `owned` (not worn), `worn`, `buy` (enough diamonds), `poor` (not enough), `earn` (the plaque: never sold). */
export type VanityState = 'worn' | 'owned' | 'buy' | 'poor' | 'earn';

export interface VanityView {
  /** The catalog id (`storefront-skin` for the numbered skins; `awning-founder` for the Starter Pack's awning). */
  id: string;
  name: string;
  /** A second line: `where` for a set piece, the old flavour line for the older looks, else "". */
  desc: string;
  /** A set piece's "Rosa's classic · shows in Downtown"; "" for a generic look. */
  where: string;
  state: VanityState;
  /** True once the look is the player's, worn or not (the card says "Owned"). */
  owned: boolean;
  /** The button: "150 \u{1F48E}", "Wear", "Worn \u2713", "Earn 18 stars" (copy `shop.look.*`). */
  label: string;
  /** The tier price in diamonds; 0 for a look that is not sold. */
  price: number;
  /** The cosmetic id a tap wears or takes off (the storefront item: the skin the player owns); null when not owned. */
  wearId: string | null;
  /** The cosmetic id a tap buys (the next storefront skin number); null when not for sale. */
  buyId: string | null;
}

/** "150 \u{1F48E}": the tier price as the button reads it. */
export const priceLabel = (n: number): string => t('shop.look.price', { n });

const hoodName = (hood: string): string => findHood(hood)?.name ?? hood;

/** A look's name: the older seven keep their `shop.item` copy, the rest are `look.<id>` (the copy file's section 1). */
export function lookName(id: string): string {
  if (id.startsWith('storefront-skin')) return copy('shop.item.storefront-skin.name');
  if ((VANITY_IDS as readonly string[]).includes(id)) return copy(`shop.item.${id as (typeof VANITY_IDS)[number]}.name`);
  return t(`look.${id}`) === `look.${id}` ? cosmeticName(id) : t(`look.${id}`);
}

/** The owned ids a look stands for: the storefront skins are numbered by gift cycle, so "Fresh Storefront" is any of them. */
const idsOf = (id: string, owned: readonly string[]): string[] => (id === 'storefront-skin' ? owned.filter(isSkin) : owned.filter((o) => o === id));

/** Where a set piece shows: "Rosa's classic \u00B7 shows in Downtown". */
const whereOf = (l: LookDef): string => (l.set ? t('shop.look.shows', { set: t(`set.${l.set}`), hood: hoodName(l.shows) }) : '');

/** The second line of a card: where a set piece shows, or the older look's flavour line. */
function descOf(l: LookDef): string {
  if (l.set) return whereOf(l);
  return (VANITY_IDS as readonly string[]).includes(l.id) ? copy(`shop.item.${l.id as (typeof VANITY_IDS)[number]}.desc`) : '';
}

/** What a screen reader says of a card's button. */
export function buttonA11y(state: VanityState, name: string, price: number, label: string): string {
  if (state === 'worn') return t('shop.look.a11y.worn', { name });
  if (state === 'owned') return t('shop.look.a11y.wear', { name });
  return state === 'earn' ? `${name}: ${label}` : t('shop.look.a11y.buy', { name, n: price });
}

/** One look as a card: owned (worn or not), for sale (enough diamonds or short), or earned. */
export function lookView(g: Pick<GameState, 'rewards'>, l: LookDef): VanityView {
  const { cosmetics, worn, diamonds } = g.rewards;
  const have = idsOf(l.id, cosmetics);
  const wornId = have.find((h) => worn.includes(h)) ?? null;
  const base = { id: l.id, name: lookName(l.id), desc: descOf(l), where: whereOf(l), price: l.sold ? l.price : 0 };
  if (have.length)
    return {
      ...base,
      state: wornId ? 'worn' : 'owned',
      owned: true,
      label: t(wornId ? 'shop.look.worn' : 'shop.look.wear'),
      wearId: wornId ?? have[have.length - 1],
      buyId: null,
    };
  if (!l.sold) return { ...base, state: 'earn', owned: false, label: t('shop.look.earn', { n: MASTERY.masterTotal }), wearId: null, buyId: null };
  return {
    ...base,
    state: canAffordDiamonds(g, l.price) ? 'buy' : 'poor',
    owned: false,
    label: priceLabel(l.price),
    wearId: null,
    buyId: l.id === 'storefront-skin' ? nextSkin(cosmetics) : l.id,
  };
}

/** The founder awning: only when owned, with wear and take-off like the rest. */
function founderView(g: Pick<GameState, 'rewards'>): VanityView | null {
  const { cosmetics, worn } = g.rewards;
  if (!cosmetics.includes(FOUNDER_ID)) return null;
  const on = worn.includes(FOUNDER_ID);
  return {
    id: FOUNDER_ID,
    name: cosmeticName(FOUNDER_ID),
    desc: t('shop.look.founder.desc'),
    where: '',
    state: on ? 'worn' : 'owned',
    owned: true,
    label: t(on ? 'shop.look.worn' : 'shop.look.wear'),
    price: 0,
    wearId: FOUNDER_ID,
    buyId: null,
  };
}

/** Every look as a card, in catalog order, and the founder awning last once owned. */
export function vanityViews(g: Pick<GameState, 'rewards'>): VanityView[] {
  const rows = LOOKS.map((l) => lookView(g, l));
  const founder = founderView(g);
  return founder ? [...rows, founder] : rows;
}

export type SectionKind = 'featured' | 'set' | 'tier';

export interface VanitySection {
  /** `featured`, `set:classic`, `tier:small`: stable, and what the cards' test ids are prefixed from. */
  key: string;
  kind: SectionKind;
  title: string;
  /** "2/4 pieces" for a set; "" for the rest. */
  progress: string;
  /** The set is complete: the title carries a check and `doneLine` is shown. */
  done: boolean;
  /** The set-complete line (copy `set.<set>.done`), "" until the set is complete. */
  doneLine: string;
  /** Who says it: the shop's manager once their hire scene has played (Nonna always), else null: the line stands alone, no name, no spoiler. */
  speaker: string | null;
  cards: VanityView[];
}

const none = { progress: '', done: false, doneLine: '', speaker: null } as const;

/**
 * The manager who says a set's complete line: the first shop's (the story's own, Nonna) always, the rest once their hire scene has been seen (null before:
 * the line is shown nameless, so the hire is not spoiled). The city that holds the neighbourhood supplies the manager.
 */
export function setSpeaker(g: Pick<GameState, 'seenScenes'>, hood: string): string | null {
  const city = cityHolding(hood);
  const name = city?.managers[hood]?.name;
  if (!city || !name) return null;
  return hoodIds(city)[0] === hood || g.seenScenes.includes(`${hood}-hire`) ? name : null;
}

const TIERS: readonly Tier[] = ['small', 'medium', 'large'];

/**
 * The Vanity tab: Featured (this week's four the player does not own, no timer), one section per set with its progress and, once complete, its
 * done line, then the generic looks as `small`, `medium` and `large` (a tier with none is left out). `now` is game time (the week the Featured row is in).
 */
export function vanitySections(g: GameState, now: number): VanitySection[] {
  const out: VanitySection[] = [];
  const picks = featured(g, now);
  if (picks.length) out.push({ key: 'featured', kind: 'featured', title: t('shop.featured'), ...none, cards: picks.map((l) => lookView(g, l)) });
  for (const set of SETS) {
    const p = setProgress(g, set.id as SetId);
    out.push({
      key: `set:${set.id}`,
      kind: 'set',
      title: t(`set.${set.id}`),
      progress: t('shop.set.progress', { have: p.owned, need: p.total }),
      done: p.done,
      doneLine: p.done ? t(`set.${set.id}.done`) : '',
      speaker: p.done ? setSpeaker(g, set.hood) : null,
      cards: LOOKS.filter((l) => l.set === set.id).map((l) => lookView(g, l)),
    });
  }
  const founder = founderView(g);
  for (const tier of TIERS) {
    const cards = LOOKS.filter((l) => !l.set && l.tier === tier).map((l) => lookView(g, l));
    if (tier === 'medium' && founder) cards.push(founder);
    if (cards.length) out.push({ key: `tier:${tier}`, kind: 'tier', title: t(`shop.tier.${tier}`, { n: TIER_PRICE[tier] }), ...none, cards });
  }
  return out;
}

export interface ShelfRow {
  /** Index in `rewards.boosters`: what `startBooster(i)` takes. */
  index: number;
  /** D462: "2× income · 15 m", "2× income · 1 h" (never "1h0m"). */
  label: string;
}

/** The booster shelf: the inventory, one row each. Empty = the empty-shelf line. */
export const boosterShelf = (g: GameState): ShelfRow[] => g.rewards.boosters.map((b, index) => ({ index, label: shelfLabel(b.mult, b.seconds) }));

/** "2× income · 1 h": the shelf's own wording; whole hours and days drop their zero minutes and hours. */
export const shelfLabel = (mult: number, seconds: number): string =>
  `${Number.isInteger(mult) ? mult : Math.round(mult * 10) / 10}\u00D7 income \u00B7 ${tidySpan(seconds)}`;

/** A span as "1 h", "4 h", "15 m", "1 h 5 m": whole hours and days drop their zero minutes and hours. */
export const tidySpan = (seconds: number): string => spanText(seconds).replace(/ 0 m$/, '').replace(/ 0 h$/, '');

export const SHELF_EMPTY = (): string => copy('shop.boosters.empty');

/** Both tabs' titles. */
export const SHOP_TABS = () => [copy('shop.vanity.title'), copy('shop.boosters.title')] as const;

/** The worn button's text, with its tick. */
export const WORN_CHIP = (): string => t('shop.look.worn.chip');

/** The tag on a look the player owns. */
export const OWNED_TAG = (): string => t('shop.look.owned');
