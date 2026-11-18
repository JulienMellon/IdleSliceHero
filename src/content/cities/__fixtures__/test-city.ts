// A test city (card R0, docs/PLAN-refactor.md P0). It is NOT in CITIES: a test registers it locally (see test-city-smoke.test.ts).
// Every number in its fit differs from the home city's on purpose, so an engine path that still reads the home tables (OVEN_GRADES, FOOTPRINTS,
// VEHICLES in tuning.ts) gives a different answer from the city's own fit, and the smoke test says so.
import type { CharacterId, Scene } from '../../types';
import type { CityBid, CityDef, CityFit, LayerKind, NeighborhoodDef } from '../types';
import type { HeadKind } from '../../tuning';

export const TEST_CITY_ID = 'test-city';
/** The six ids, in build order. None is a home or Boston id (ids are unique across cities). */
export const TEST_IDS = ['tc-alpha', 'tc-bravo', 'tc-charlie', 'tc-delta', 'tc-echo', 'tc-foxtrot'] as const;
type TestId = (typeof TEST_IDS)[number];

const HEAD_COST_FIRST: Record<HeadKind, number> = { prep: 100, oven: 200, counter: 300 };

export const TEST_FIT: CityFit = {
  // home: 1 / 2 / 4 / 8 / 16
  ovenGrades: [
    { name: 'Tin', mult: 1, cost: 0, color: '#999999' },
    { name: 'Clay', mult: 3, cost: 100, color: '#AA7755' },
    { name: 'Iron', mult: 5, cost: 3_000, color: '#667788' },
    { name: 'Glass', mult: 7, cost: 90_000, color: '#88CCDD' },
    { name: 'Star', mult: 9, cost: 900_000_000, color: '#FFDD66' },
  ],
  // home maxTables: 2 / 3 / 4 / 5 / 6
  footprints: [
    { name: 'Stall', cost: 0, maxTables: 1, ovenSlots: 1 },
    { name: 'Kiosk', cost: 300, maxTables: 2, ovenSlots: 2 },
    { name: 'Parlour', cost: 9_000, maxTables: 3, ovenSlots: 2 },
    { name: 'Hall', cost: 300_000, maxTables: 3, ovenSlots: 3 },
    { name: 'Palace', cost: 1_500_000_000, maxTables: 4, ovenSlots: 4 },
  ],
  // home speed: 0.5 / 0.9 / 1.6 / 2.6 / 5, capacity: 2 / 3 / 6 / 14 / 10
  vehicles: [
    { id: 'bike', name: 'Bike', emoji: '🚲', speed: 0.8, capacity: 1, cost: 0 },
    { id: 'scooter', name: 'Scooter', emoji: '🛵', speed: 1.2, capacity: 5, cost: 1_000 },
    { id: 'car', name: 'Car', emoji: '🚗', speed: 2, capacity: 9, cost: 50_000 },
    { id: 'van', name: 'Van', emoji: '🚐', speed: 3, capacity: 20, cost: 400_000 },
    { id: 'drone', name: 'Drone', emoji: '🛸', speed: 7, capacity: 15, cost: 15_000_000 },
  ],
  headCostFirst: HEAD_COST_FIRST,
  takeover: { sceneId: 'tc-alpha-2', pizzas: 100 },
};

const LOOK = ['#C0504D', '#4F81BD', '#8C6A4A', '#3E9B62', '#8E5BB5', '#E0A030'];
const POSITIONS = [
  [22, 39],
  [30, 67],
  [76, 67],
  [18, 9],
  [50, 9],
  [82, 9],
] as const;
const HEADS_COST = [
  HEAD_COST_FIRST.prep + HEAD_COST_FIRST.oven + HEAD_COST_FIRST.counter,
  90_000,
  1_500_000_000,
  50_000_000_000,
  900_000_000_000,
  60_000_000_000_000,
];
const BUILD = [0, 200_000, 400_000_000, 6_000_000_000, 900_000_000_000, 8_000_000_000_000];
const MANAGER = [0, 3_000_000, 6_000_000_000, 250_000_000_000, 40_000_000_000_000, 2_000_000_000_000_000];
const VALUE = [2, 40, 1_800, 150_000, 4_500_000, 45_000_000];
const COST_MULT = [1, 12, 1_800, 150_000, 4_500_000, 45_000_000];

export const TEST_NEIGHBOURHOODS: NeighborhoodDef[] = TEST_IDS.map((id, i) => ({
  id,
  name: `Test ${id.slice(3)}`,
  orderValue: VALUE[i],
  buildCost: BUILD[i],
  costMult: COST_MULT[i],
  managerCost: MANAGER[i],
  headsCost: HEADS_COST[i],
  x: POSITIONS[i][0],
  y: POSITIONS[i][1],
  color: LOOK[i],
  wall: '#EEEEEE',
}));

/** One layer of each kind (the first shop plays none), and the bid is in the boats' shop, as in the home city. */
export const TEST_LAYERS: Record<TestId, LayerKind | null> = {
  'tc-alpha': null,
  'tc-bravo': 'gameDay',
  'tc-charlie': 'boats',
  'tc-delta': 'menu',
  'tc-echo': 'shifts',
  'tc-foxtrot': 'stars',
};

export const TEST_BID: CityBid = { hood: 'tc-charlie', name: 'Test Pier', cost: 90_000_000, unlockPizzas: 5_000, afterScene: 'tc-charlie-3' };

const panel = (hood: string): Scene['panels'][number] => ({
  backdrop: hood,
  cast: [{ id: 'nonna-rosa', mood: 'neutral' }],
  lines: [{ speaker: 'Nonna Rosa', text: 'A test line.' }],
});
const scene = (hood: string, beat: 1 | 2 | 3 | 4, trigger: Scene['trigger'], more: Partial<Scene> = {}): Scene => ({
  id: `${hood}-${beat}`,
  city: TEST_CITY_ID,
  character: 'nonna-rosa' as CharacterId,
  neighborhood: hood,
  beat,
  title: `${hood} ${beat}`,
  trigger,
  panels: [panel(hood)],
  ...more,
});

/** Four beats a neighbourhood, the finale of the bid's shop a `bid` scene; just enough story for the takeover scene and the bid to exist. */
const TEST_SCENES: Scene[] = TEST_IDS.flatMap((h, i) => [
  scene(h, 1, { kind: 'unlock', neighborhood: h }),
  scene(h, 2, { kind: 'deliveries', neighborhood: h, count: 100 }),
  scene(h, 3, { kind: 'deliveries', neighborhood: h, count: h === TEST_BID.hood ? 500 : 1_000 }),
  h === TEST_BID.hood
    ? scene(h, 4, { kind: 'bid', neighborhood: h }, { perk: true })
    : scene(h, 4, { kind: 'challenge', neighborhood: h }, { perk: true, ...(i === TEST_IDS.length - 1 ? { reward: 'city-complete' as const } : {}) }),
]);

export const TEST_CITY: CityDef = {
  id: TEST_CITY_ID,
  name: 'Testville',
  neighbourhoods: TEST_NEIGHBOURHOODS,
  scenes: TEST_SCENES,
  perks: Object.fromEntries(TEST_IDS.map((h) => [h, { who: 'Tester', text: `${h} perk`, priceMult: 1.1 }])),
  layers: TEST_LAYERS,
  heads: Object.fromEntries(TEST_IDS.map((h) => [h, { prep: 'Pat', oven: 'Olly', counter: 'Cass' }])),
  managers: Object.fromEntries(TEST_IDS.map((h) => [h, { id: 'nonna-rosa', name: 'Tess', title: 'General Manager' as const }])),
  lieutenant: { id: 'megaslice-rep', name: 'Todd' },
  bid: TEST_BID,
  theme: 'city_theme',
  fit: TEST_FIT,
};
