// T107: the engine, the store and the screens' models read "the current city" from the save. No non-test `.ts` file under src/engine, src/store or
// src/components may name the home city's neighbourhood list (`HOME_HOOD_IDS`) or a home neighbourhood id as a string literal, except the files in
// ALLOW (and why). T109 widened this from five named models to every module; R0 made the walk cover all of them.
// The list only shrinks: cards R1 and R1L delete entries as they make a file city-generic. A file that leaves the list may not come back (it would
// fail here), and an entry whose file no longer offends fails too, so nobody leaves a stale exemption behind.
import * as fs from 'fs';
import * as path from 'path';

const ROOT = path.resolve(__dirname, '../..');
const DIRS = ['engine', 'store', 'components'];
/** Today's offenders, by path from src/, each with the reason it is allowed (and the card that removes it). */
const ALLOW: Record<string, string> = {
  'engine/game.ts': "defines HOME_HOOD_IDS (the home city's ids) for the old-save migration and the feature `init` hooks, which run before any game exists",
  'engine/features/service.ts': "`init` has no game yet, so it seeds its slice from HOME_HOOD_IDS; `migrate` fills the rest from the save's own city",
  'components/cutscene/backdrop-art.ts':
    'art module: the shop looks are drawn per home neighbourhood, with Downtown as the fallback look (stays until the per-city look registry, plan P6)',
  'components/scene/ladder.ts': "art module: the ladder's height for the Waterfront and Uptown fronts (stays until the shared shop layout, plan P1)",
  'components/sidewalk-model.ts': "the hire spot is not drawn in the first shop: `id !== 'downtown'` becomes `id !== firstHood(city)` (card R1L)",
};
const HOME_IDS = ['downtown', 'suburbs', 'waterfront', 'university', 'industrial', 'uptown'];

const isSource = (name: string) => /\.ts$/.test(name) && !/\.(test|d)\.ts$/.test(name);

function walk(dir: string, out: string[] = []): string[] {
  for (const e of fs.readdirSync(dir, { withFileTypes: true })) {
    const p = path.join(dir, e.name);
    if (e.isDirectory()) {
      if (e.name !== '__tests__' && e.name !== '__fixtures__') walk(p, out);
    } else if (isSource(e.name)) out.push(p);
  }
  return out;
}

/** What a file names of the home city, outside its comments (empty when it is clean). */
function homeNames(file: string): string[] {
  const src = fs
    .readFileSync(file, 'utf8')
    .split('\n')
    .filter((l) => !/^\s*(\/\/|\*|\/\*)/.test(l))
    .join('\n');
  const out: string[] = [];
  if (/\bHOME_HOOD_IDS\b/.test(src)) out.push('HOME_HOOD_IDS');
  for (const id of HOME_IDS) if (new RegExp(`['"\`]${id}['"\`]`).test(src)) out.push(`'${id}'`);
  return out;
}

const files = DIRS.flatMap((d) => walk(path.join(ROOT, d))).map((f): [string, string] => [path.relative(ROOT, f).split(path.sep).join('/'), f]);

describe('no home-city constants in the engine, the store or the components', () => {
  test('the walk covers the engine, the store and the components, and drawer, goal, city, ad and mastery models', () => {
    const rels = files.map(([rel]) => rel);
    for (const d of DIRS) expect(rels.some((r) => r.startsWith(`${d}/`))).toBe(true);
    for (const m of [
      'components/drawer-model.ts',
      'components/goal-model.ts',
      'components/city-model.ts',
      'components/store/ad-model.ts',
      'components/endgame/mastery-model.ts',
    ])
      expect(rels).toContain(m);
    expect(rels.some((r) => /\.test\.ts$/.test(r) || r.includes('__tests__'))).toBe(false);
  });

  test.each(files.filter(([rel]) => !(rel in ALLOW)))('%s', (_rel, file) => {
    expect(homeNames(file)).toEqual([]);
  });

  test('every ALLOW entry is a file that still names the home city (the list only shrinks)', () => {
    const present = new Map(files);
    for (const [rel, why] of Object.entries(ALLOW)) {
      expect([rel, why.length > 0]).toEqual([rel, true]);
      expect([rel, present.has(rel)]).toEqual([rel, true]);
      expect([rel, homeNames(present.get(rel)!).length > 0]).toEqual([rel, true]);
    }
  });
});
