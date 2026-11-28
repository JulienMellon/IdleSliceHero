// Shop renovation's lines (v5.25, card T3), copied byte for byte from docs/story/COPY-v5.25.md section 1 (written by card W6). Hand-kept like store-copy.ts,
// not generated: change the copy file and this table together. Placeholders (the code fills them, `t(key, vars)`): {shop} the neighbourhood's name,
// {mult} the renovation's income multiplier (2, 3 or 4), {numeral} I / II / III (RENO_NUMERALS), {fixture} a `reno.name.<id>` fixture name, {cash} money(),
// {n} a whole count. Item names are keyed by the ids of content/renovation.ts (`reno<level>-<shop>-<thing>`): the fixtures and the decor; a plaque's words are `reno.plaque.<level>`.
// The barks are spoken by the Downtown heads (reno.bark.1 Marco, .2 Lucia, .3 Benny): play one only once its head is hired.

/** The longest item name (characters): the decor card and the confirm screen's "New fixture" line have no room for more. */
export const RENO_NAME_MAX = 18;

/** The numeral for a renovation level (index = level): the `{numeral}` placeholder. */
export const RENO_NUMERALS = ['', 'I', 'II', 'III'] as const;

/** The placeholders each renovation line may carry. */
export interface RenoVars {
  shop: string;
  mult: number;
  numeral: (typeof RENO_NUMERALS)[number];
  fixture: string;
  cash: string;
  n: number;
}

/** Every line, by its key in the copy file. */
export const COPY = {
  // 1.1 Offer
  'reno.offer': 'Renovate {shop} for {mult}x income',
  // 1.2 Confirm screen
  'reno.confirm.title': 'Renovate {shop}?',
  'reno.confirm.level': 'Renovation {numeral}',
  'reno.confirm.resets.head': 'Starts over',
  'reno.confirm.resets.1': 'Station levels start over',
  'reno.confirm.keeps.head': 'You keep',
  'reno.confirm.keeps.1': 'Your cash',
  'reno.confirm.keeps.2': 'Your whole staff',
  'reno.confirm.keeps.3': 'Every neighborhood you’ve opened',
  'reno.confirm.keeps.4': 'Decor you’ve already bought',
  'reno.confirm.gains.head': 'You gain',
  'reno.confirm.gains.1': '{mult}x income in {shop}',
  'reno.confirm.gains.2': 'Plaque {numeral} by the door',
  'reno.confirm.gains.3': 'New fixture: {fixture}',
  'reno.confirm.gains.4': '{n} new decor items to buy',
  'reno.confirm.cost': 'Cost: {cash}',
  // 1.3 Buttons
  'reno.button.offer': 'Renovate',
  'reno.button.confirm': 'Renovate for {cash}',
  'reno.button.short': 'Need {cash}',
  'reno.button.cancel': 'Not yet',
  'reno.button.done': 'Back to work',
  'reno.button.maxed': 'Fully renovated',
  // 1.4 Reward banners
  'reno.banner.1': 'Bronze plaque up! {mult}x income',
  'reno.banner.2': 'Silver plaque up! {mult}x income',
  'reno.banner.3': 'Gold plaque up! {mult}x income',
  // 1.5 Cast barks
  'reno.bark.1': 'So shiny! Don’t worry, I’ll get flour on it soon.',
  'reno.bark.2': 'New paint, same fire. Nobody touches my oven. Still.',
  'reno.bark.3': 'Mrs. Russo says the gold plaque is crooked. It isn’t.',
  // 1.6 Plaque text
  'reno.plaque.1': '{shop} · I · Built by hand',
  'reno.plaque.2': '{shop} · II · Built to last',
  'reno.plaque.3': '{shop} · III · Still not for sale',
  // 1.7 Fixture and decor names: Downtown
  'reno.name.reno1-downtown-awning': 'Scalloped awning',
  'reno.name.reno1-downtown-espresso': 'Steaming espresso',
  'reno.name.reno1-downtown-wine-rack': 'Lattice wine rack',
  'reno.name.reno1-downtown-chalkboard': 'Sidewalk specials',
  'reno.name.reno2-downtown-oven-arch': 'Lucia’s brick arch',
  'reno.name.reno2-downtown-pendant-lamps': 'Drop-cord globes',
  'reno.name.reno2-downtown-vespa': 'Bread scooter',
  'reno.name.reno2-downtown-herb-box': 'Basil window box',
  'reno.name.reno3-downtown-gold-sign': 'Gold-leaf sign',
  'reno.name.reno3-downtown-chandelier': 'Crystal chandelier',
  'reno.name.reno3-downtown-medallion': 'Compass-star tiles',
  'reno.name.reno3-downtown-bust': 'Bust of Nonna',
  // 1.8 Fixture and decor names: Suburbs
  'reno.name.reno1-suburbs-neon-open': 'Pink neon OPEN',
  'reno.name.reno1-suburbs-jukebox': 'Bubble jukebox',
  'reno.name.reno1-suburbs-stools': 'Red-seat stools',
  'reno.name.reno1-suburbs-pie-case': 'Bake-sale pie dome',
  'reno.name.reno2-suburbs-chrome-counter': 'Checkered counter',
  'reno.name.reno2-suburbs-booth': 'Teal vinyl booth',
  'reno.name.reno2-suburbs-pennants': 'Mudhens pennants',
  'reno.name.reno2-suburbs-gumball': 'Gumball globe',
  'reno.name.reno3-suburbs-roof-sign': 'Starburst pylon',
  'reno.name.reno3-suburbs-cadillac': 'Pink tail-fin car',
  'reno.name.reno3-suburbs-trophy-case': 'Trophy cabinet',
  'reno.name.reno3-suburbs-popcorn-cart': 'Halftime popcorn',
  // 1.9 Fixture and decor names: Waterfront
  'reno.name.reno1-waterfront-rope-rail': 'Rope-and-post rail',
  'reno.name.reno1-waterfront-crates': 'Lobster crates',
  'reno.name.reno1-waterfront-life-ring': 'Spare life ring',
  'reno.name.reno1-waterfront-anchor': 'Dropped anchor',
  'reno.name.reno2-waterfront-plank-deck': 'Weathered deck',
  'reno.name.reno2-waterfront-net-buoys': 'Net of buoys',
  'reno.name.reno2-waterfront-rowboat': 'Rowboat bench',
  'reno.name.reno2-waterfront-lantern-post': 'Ship’s lantern',
  'reno.name.reno3-waterfront-beacon': 'Rooftop lighthouse',
  'reno.name.reno3-waterfront-helm': 'Ship’s wheel',
  'reno.name.reno3-waterfront-mast': 'Signal-flag mast',
  'reno.name.reno3-waterfront-barrel-table': 'Barrel table',
  // 1.10 Fixture and decor names: University
  'reno.name.reno1-university-banner': 'Crest banner',
  'reno.name.reno1-university-bulletin-board': 'Cork flyer board',
  'reno.name.reno1-university-bean-bag': 'Slumped bean bag',
  'reno.name.reno1-university-string-lights': 'Warm string lights',
  'reno.name.reno2-university-lounge-counter': 'Stickered counter',
  'reno.name.reno2-university-couch': 'Hand-me-down sofa',
  'reno.name.reno2-university-vending': 'Snack machine',
  'reno.name.reno2-university-bike-rack': 'Bike loop rack',
  'reno.name.reno3-university-clock-tower': 'Roof clock tower',
  'reno.name.reno3-university-globe': 'Tilted globe',
  'reno.name.reno3-university-library-ladder': 'Library ladder',
  'reno.name.reno3-university-telescope': 'Stargazer scope',
  // 1.11 Fixture and decor names: Industrial
  'reno.name.reno1-industrial-steel-shutter': 'Roll-up shutter',
  'reno.name.reno1-industrial-pipe-run': 'Valve-wheel pipes',
  'reno.name.reno1-industrial-drums': 'Striped oil drums',
  'reno.name.reno1-industrial-pegboard': 'Tool pegboard',
  'reno.name.reno2-industrial-chimney': 'Brick smokestack',
  'reno.name.reno2-industrial-flour-pallet': 'Flour pallet',
  'reno.name.reno2-industrial-gear-clock': 'Cog-wheel clock',
  'reno.name.reno2-industrial-work-lamp': 'Caged work lamp',
  'reno.name.reno3-industrial-gantry': 'Gantry crane',
  'reno.name.reno3-industrial-boiler': 'Riveted boiler',
  'reno.name.reno3-industrial-conveyor': 'Pizza-box conveyor',
  'reno.name.reno3-industrial-anvil-table': 'Ox’s anvil table',
  // 1.12 Fixture and decor names: Uptown
  'reno.name.reno1-uptown-brass-door': 'Revolving door',
  'reno.name.reno1-uptown-velvet-rope': 'Velvet rope line',
  'reno.name.reno1-uptown-orchid': 'Orchid spray',
  'reno.name.reno1-uptown-lectern': 'Reservation stand',
  'reno.name.reno2-uptown-marble-counter': 'Veined marble top',
  'reno.name.reno2-uptown-columns': 'Fluted columns',
  'reno.name.reno2-uptown-piano': 'Grand piano',
  'reno.name.reno2-uptown-portrait': 'Portrait of Madame',
  'reno.name.reno3-uptown-crown-sign': 'Gold crown sign',
  'reno.name.reno3-uptown-ice-swan': 'Ice swan',
  'reno.name.reno3-uptown-champagne-tower': 'Coupe-glass tower',
  'reno.name.reno3-uptown-deco-arch': 'Sunburst mirror',
} as const;

/** A renovation line's key. */
export type RenoKey = keyof typeof COPY;

/** The key of an item's name (a fixture or a decor item; plaques have no name, their words are `reno.plaque.<level>`). */
export const renoNameKey = (id: string): string => `reno.name.${id}`;
