// How the layers talk in a city other than home (v5.18, card T2, step 6). The layer screens say their home lines (Game Day, boats, the stars...);
// in Boston the same layer is dressed in the neighbourhood's own words from the script (content/cities/boston/copy.ts BOSTON_LAYER_COPY). One
// table per city maps a HOME key to the line that replaces it, so a screen still asks for its home key and passes the city: no layer logic
// changes, only the words. A line with no entry keeps its home text. Pure: unit-tested in node.
import { BOSTON_LAYER_COPY as B } from '../../content/cities/boston/copy';

type Table = Readonly<Record<string, string>>;

/**
 * Lines the script has no row for (the flavour of the sheets' bodies, the rack's four sizes, the rival card): written here in the script's voice
 * and listed in the card report as copy asks, so the writer can replace them in one place.
 */
export const BOSTON_ASKS = {
  'layer.suburbs.gameday.info.body':
    'After every Chowderheads game, fans pour in for a little while. They only sit in free seats, so more seating means more pies.',
  'upgrade.waterfront.rack.tier.1': 'Corner Shelf',
  'upgrade.waterfront.rack.tier.2': 'Wide Shelf',
  'upgrade.waterfront.rack.tier.3': 'Pantry Wall',
  'upgrade.waterfront.rack.tier.4': 'Church Pantry',
  'label.nextBoat': 'Next order',
  'label.boatLeft': 'Order due in',
  'label.rackEmpty': 'No shelf yet',
  'label.maxed': 'Biggest shelf',
  'layer.industrial.shift.info.body':
    'Lab crews eat between experiments. Night lab pays best. Ovens blow now and then: tap the wrench, or your Head Baker fixes it in time.',
  'menu.cheese.line': 'Hollis’s order. Steady. Never wrong.',
  'rival.open': 'MegaSlice just opened across the street. Show the block who really feeds it.',
  'rival.title': 'Beat Them: {n} pies in 5 minutes',
  'rival.win': 'The MegaSlice across the street is closing. The block chose you.',
  'rival.lose': 'They won this round. The block has not chosen yet. Go again.',
} as const;

const BOSTON: Table = {
  ...BOSTON_ASKS,
  // Fenway: game day
  'layer.suburbs.gameday.banner': B['layer.fenway.gameday.banner'],
  'layer.suburbs.gameday.chip.rush': `${B['layer.fenway.gameday.chip']} {time}`,
  // Dorchester: the boats are supper orders, the warming rack is the pantry shelf
  'layer.waterfront.boat.banner': B['layer.dorchester.orders.arrive'],
  'layer.waterfront.boat.chip': `${B['layer.dorchester.orders.chip']} {time}`,
  'layer.waterfront.boat.info.title': B['layer.dorchester.orders.title'],
  'layer.waterfront.boat.info.body': B['layer.dorchester.orders.hint'],
  'upgrade.waterfront.rack.name': B['layer.dorchester.shelf.title'],
  'upgrade.waterfront.rack.info.body': B['layer.dorchester.shelf.hint'],
  'label.rack': B['layer.dorchester.shelf.title'],
  // Southie: the stars are "How local is it?"
  'layer.uptown.stars.info.title': B['layer.southie.rating.name'],
  'layer.uptown.stars.info.body': B['layer.southie.rating.hint'],
  'layer.uptown.stars.banner': B['layer.southie.rating.up'],
  'rating.1': B['layer.southie.rating.level.1'],
  'rating.2': B['layer.southie.rating.level.2'],
  'rating.3': B['layer.southie.rating.level.3'],
  'rating.4': B['layer.southie.rating.level.4'],
  'rating.5': B['layer.southie.rating.level.5'],
  // Back Bay: the menu and the zones
  'layer.university.menu.info.title': B['layer.back-bay.menu.title'],
  'layer.university.menu.banner': B['layer.back-bay.menu.new'],
  'layer.university.zones.info.title': B['layer.back-bay.zones.title'],
  'layer.university.zones.info.body': B['layer.back-bay.zones.hint'],
  'zone.dorms.name': B['layer.back-bay.zone.1'],
  'zone.library.name': B['layer.back-bay.zone.2'],
  'zone.stadium.name': B['layer.back-bay.zone.3'],
  // Cambridge: lab hours and the oven that explodes
  'layer.industrial.shift.day': B['layer.cambridge.shift.morning'],
  'layer.industrial.shift.swing': B['layer.cambridge.shift.day'],
  'layer.industrial.shift.night': B['layer.cambridge.shift.night'],
  'layer.industrial.shift.info.title': B['layer.cambridge.shifts.title'],
  'layer.industrial.jam.alert': B['layer.cambridge.breakdown.banner'],
};

const TABLES: Readonly<Record<string, Table>> = { boston: BOSTON };

/** The line a city says for a home key: its own dressing, or `home` (the home text) when it has none. */
export const dressed = (city: string | undefined, key: string, home: string): string => TABLES[city ?? '']?.[key] ?? home;

/** Whether a city dresses a key (a screen that has no home text for it asks this). */
export const isDressed = (city: string | undefined, key: string): boolean => TABLES[city ?? ''] !== undefined && key in TABLES[city ?? ''];
