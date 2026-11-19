/// <reference types="jest" />
// Card X3: the committed snapshots (src/dev/snapshots.json, made by scripts/test-snapshots.ts) still load under the current save format and
// tuning. A SAVE_VERSION bump or a tuning change that breaks them fails here; the cure is always `npm run test-snapshots`.
import { CITIES, cityOf } from '../../content/cities';
import { migrate, nextToBuild, SAVE_VERSION, upgradeCostOf, type GameState } from '../../engine/game';
import { loadSnapshot, snapshotFile, type SnapshotRow } from '../jumps';

const FIX = 'Run `npm run test-snapshots` and commit src/dev/snapshots.json.';
const fail = (what: string): never => {
  throw new Error(`${what}. ${FIX}`);
};

const file = snapshotFile();
// a time long after the snapshots were made, as a tester opens the panel
const NOW = Date.UTC(2027, 2, 3, 10, 30);

/** The cost of the player's next purchase in a state: the next shop's build, or (the city complete) the first station level on offer. */
function nextCost(g: GameState): number | null {
  const next = nextToBuild(g);
  if (next) return next.buildCost;
  for (const n of cityOf(g).neighbourhoods) {
    const c = upgradeCostOf(g, n.id, 'prep');
    if (c !== null) return c;
  }
  return null;
}

describe('src/dev/snapshots.json', () => {
  it('was made under the current save version', () => {
    if (file.saveVersion !== SAVE_VERSION) fail(`snapshots.json is saveVersion ${file.saveVersion}, the game is ${SAVE_VERSION}`);
  });

  it('has a "just built" row for every neighbourhood of every city, and a "complete" row for each city', () => {
    for (const city of Object.values(CITIES)) {
      const rows = file.rows.filter((r) => r.city === city.id);
      for (const n of city.neighbourhoods)
        if (!rows.some((r) => r.hood === n.id && r.label === `${n.name} — just built`)) fail(`no row for ${city.id}/${n.id}`);
      if (!rows.some((r) => r.label === `${city.name} — complete`)) fail(`no "complete" row for ${city.id}`);
    }
  });

  it.each(file.rows.map((r): [string, SnapshotRow] => [`${r.city}: ${r.label}`, r]))(
    '%s loads, keeps its city and hood, and has its shop built',
    (_name, row) => {
      let g: GameState | undefined;
      try {
        g = loadSnapshot(row, NOW);
      } catch (e) {
        fail(`${row.label} does not load: ${(e as Error).message}`);
      }
      const loaded = g as GameState;
      const city = cityOf(loaded);
      if (loaded.city !== row.city) fail(`${row.label} loads into ${loaded.city}, not ${row.city}`);
      const ids = city.neighbourhoods.map((n) => n.id);
      if (!ids.includes(row.hood)) fail(`${row.label}: ${row.hood} is not a neighbourhood of ${row.city}`);
      if (!loaded.shops[row.hood]?.built) fail(`${row.label}: ${row.hood} is not built`);
      // "just built" is the newest shop: the next one is not built yet; "complete" has them all and the finale seen
      const complete = row.label === `${city.name} — complete`;
      if (complete) {
        if (!loaded.cityComplete || ids.some((id) => !loaded.shops[id].built)) fail(`${row.label} is not a finished city`);
      } else if (ids.slice(ids.indexOf(row.hood) + 1).some((id) => loaded.shops[id].built)) fail(`${row.label}: a later shop is built too`);
    },
  );

  it.each(file.rows.map((r): [string, SnapshotRow] => [`${r.city}: ${r.label}`, r]))('%s: its next purchase still has a finite cost', (_name, row) => {
    const cost = nextCost(loadSnapshot(row, NOW));
    if (cost === null || !Number.isFinite(cost) || cost <= 0) fail(`${row.label}: the next purchase costs ${cost} under the current tuning`);
  });

  it("migrate on a row's raw state agrees with the loader on the shops it names", () => {
    for (const r of file.rows) expect(Object.keys(migrate(r.state, NOW).shops).sort()).toEqual(Object.keys(loadSnapshot(r, NOW).shops).sort());
  });
});
