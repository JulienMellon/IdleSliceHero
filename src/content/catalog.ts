// The looks catalog (v5.24, card E7): every look the vanity shop sells (or gives) as one row of data. The list with its reasoning is
// docs/build/v5.24/catalog.md. Pure data and lookups, no engine imports: content/endgame.ts derives `VANITY_IDS` and `VANITY_PRICE`
// from here, engine/vanity.ts sells, wears and rotates them, and the scene and the Vanity tab read the same rows.

/** The three tiers and what each costs, in diamonds. */
export const TIER_PRICE = { small: 60, medium: 150, large: 400 } as const;
export type Tier = keyof typeof TIER_PRICE;

/** The parts of a shop a look dresses. One look per part is worn at a time (per scope: see `slotOf`). */
export const PARTS = ['facade', 'awning', 'oven', 'counter', 'sign', 'scooter', 'menu', 'apron', 'tablecloth', 'tipjar', 'chime', 'plaque'] as const;
export type Part = (typeof PARTS)[number];

/** A set: four looks that show only in its own neighbourhood's shop. One per home neighbourhood. */
export const SETS = [
  { id: 'classic', hood: 'downtown' },
  { id: 'diner', hood: 'suburbs' },
  { id: 'dockside', hood: 'waterfront' },
  { id: 'dorm', hood: 'university' },
  { id: 'brick', hood: 'industrial' },
  { id: 'marble', hood: 'uptown' },
] as const;
export type SetId = (typeof SETS)[number]['id'];

export interface LookDef {
  id: string;
  part: Part;
  tier: Tier;
  /** Diamonds; 0 for a look that is earned, not sold. Always `TIER_PRICE[tier]` for one that is sold. */
  price: number;
  /** The set it belongs to, or null for a generic look. */
  set: SetId | null;
  /** Where it shows: 'all' (every shop) or the one neighbourhood id of its set. */
  shows: 'all' | string;
  /** False for the master's plaque (earned at 18 stars). */
  sold: boolean;
}

const hoodOfSet = (set: SetId): string => SETS.find((s) => s.id === set)?.hood ?? 'all';

function look(id: string, part: Part, tier: Tier, set: SetId | null = null): LookDef {
  return { id, part, tier, price: TIER_PRICE[tier], set, shows: set ? hoodOfSet(set) : 'all', sold: true };
}

/** The 42 looks, in the order the shop lists them: today's seven first, then each set, then the generic small looks. */
export const LOOKS: readonly LookDef[] = [
  // today's seven (all Medium; the plaque is earned)
  look('oven-gold', 'oven', 'medium'),
  look('storefront-skin', 'facade', 'medium'),
  look('oven-woodfired', 'oven', 'medium'),
  look('scooter-mint', 'scooter', 'medium'),
  look('neon-counter', 'counter', 'medium'),
  look('awning-gold', 'awning', 'medium'),
  { ...look('plaque-master', 'plaque', 'medium'), price: 0, sold: false },
  // the six sets: one large storefront theme, one medium, two small
  look('facade-classic', 'facade', 'large', 'classic'),
  look('awning-classic', 'awning', 'medium', 'classic'),
  look('menu-classic', 'menu', 'small', 'classic'),
  look('apron-classic', 'apron', 'small', 'classic'),
  look('facade-diner', 'facade', 'large', 'diner'),
  look('counter-diner', 'counter', 'medium', 'diner'),
  look('tablecloth-diner', 'tablecloth', 'small', 'diner'),
  look('tipjar-diner', 'tipjar', 'small', 'diner'),
  look('facade-dockside', 'facade', 'large', 'dockside'),
  look('sign-dockside', 'sign', 'medium', 'dockside'),
  look('tipjar-dockside', 'tipjar', 'small', 'dockside'),
  look('chime-dockside', 'chime', 'small', 'dockside'),
  look('facade-dorm', 'facade', 'large', 'dorm'),
  look('scooter-dorm', 'scooter', 'medium', 'dorm'),
  look('menu-dorm', 'menu', 'small', 'dorm'),
  look('tablecloth-dorm', 'tablecloth', 'small', 'dorm'),
  look('facade-brick', 'facade', 'large', 'brick'),
  look('oven-brick', 'oven', 'medium', 'brick'),
  look('apron-brick', 'apron', 'small', 'brick'),
  look('chime-brick', 'chime', 'small', 'brick'),
  look('facade-marble', 'facade', 'large', 'marble'),
  look('awning-marble', 'awning', 'medium', 'marble'),
  look('tablecloth-marble', 'tablecloth', 'small', 'marble'),
  look('tipjar-marble', 'tipjar', 'small', 'marble'),
  // generic looks: every shop
  look('menu-chalkboard', 'menu', 'small'),
  look('apron-checkered', 'apron', 'small'),
  look('apron-striped', 'apron', 'small'),
  look('tablecloth-gingham', 'tablecloth', 'small'),
  look('tablecloth-linen', 'tablecloth', 'small'),
  look('tipjar-glass', 'tipjar', 'small'),
  look('tipjar-brass', 'tipjar', 'small'),
  look('chime-bell', 'chime', 'small'),
  look('chime-wind', 'chime', 'small'),
  look('awning-candy', 'awning', 'medium'),
  look('scooter-red', 'scooter', 'medium'),
];

const BY_ID: ReadonlyMap<string, LookDef> = new Map(LOOKS.map((l) => [l.id, l]));

/** The catalog row of an id, or undefined (a gift skin `storefront-skin-3`, the founder awning and unknown ids are not rows). */
export const lookOf = (id: string): LookDef | undefined => BY_ID.get(id);

/** The looks for sale, in shop order. */
export const SOLD_LOOKS: readonly LookDef[] = LOOKS.filter((l) => l.sold);

/** The looks of one set, in catalog order. */
export const setLooks = (set: SetId): readonly LookDef[] => LOOKS.filter((l) => l.set === set);

/** Total diamonds of every look for sale. */
export const CATALOG_TOTAL: number = SOLD_LOOKS.reduce((n, l) => n + l.price, 0);

/** Does a look show in this shop? A generic one everywhere, a set piece only in its own neighbourhood. */
export const showsIn = (l: LookDef, shopId: string): boolean => l.shows === 'all' || l.shows === shopId;
