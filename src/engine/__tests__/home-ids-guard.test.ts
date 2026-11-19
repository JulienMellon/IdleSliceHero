// T107: the engine, the store and the screens (.ts and .tsx, A39) read "the current city" from the save. No non-test `.ts` file under src/engine, src/store or
// src/components may name the home city's neighbourhood list (`HOME_HOOD_IDS`, which no longer exists) or a home neighbourhood id as a string literal, except the files in
// ALLOW (and why). T109 widened this from five named models to every module; R0 made the walk cover all of them; R1 deleted `HOME_HOOD_IDS`.
// The list only shrinks: card R1 left the art modules (scene/**, cutscene/**, backdrop-art.ts) and three painters (storefront, city-map, report-strip), which draw the home shops by id; R1L and the per-city look registry (P6) take those. A file that leaves the list may not come back (it would
// fail here), and an entry whose file no longer offends fails too, so nobody leaves a stale exemption behind.
import * as fs from 'fs';
import * as path from 'path';

const ROOT = path.resolve(__dirname, '../..');
const DIRS = ['engine', 'store', 'components'];
/** Today's offenders, by path from src/, each with the reason it is allowed (and the card that removes it). */
const ALLOW: Record<string, string> = {
  'components/cutscene/backdrop-art.ts':
    'art module: the shop looks are drawn per home neighbourhood, with Downtown as the fallback look (stays until the per-city look registry, plan P6)',
  'components/scene/background.tsx': 'art module: the Uptown look of the shop backdrop (stays until the per-city look registry, plan P6)',
  'components/scene/props.tsx': 'art module: the floor props are drawn per home neighbourhood (stays until the per-city look registry, plan P6)',
  'components/scene/room.tsx': 'art module: the shop rooms are drawn per home neighbourhood (stays until the per-city look registry, plan P6)',
  'components/cutscene/backdrops/shop.tsx':
    'art module: the cutscene shop looks are drawn per home neighbourhood (stays until the per-city look registry, plan P6)',
  'components/storefront.tsx':
    "painter: the Uptown dusk sky is chosen by the look id `art === 'uptown'` (stays until the per-city look registry, plan P6; its other home ids are gone)",
  'components/city-map.tsx':
    "painter: a Boston lot's mini shop borrows the home look by index (`lookId`, stays until the per-city look registry, plan P6). NOT an art module: R1L/P6 moves it",
  'components/report/report-strip.tsx':
    "painter: Nonna's portrait on the Downtown report strip (outside card R1's files; fix is `firstHood(city)` and the city's founder portrait)",
  'components/scene/ladder.ts': "art module: the ladder's height for the Waterfront and Uptown fronts (stays until the shared shop layout, plan P1)",
};
const HOME_IDS = ['downtown', 'suburbs', 'waterfront', 'university', 'industrial', 'uptown'];

const isSource = (name: string) => /\.tsx?$/.test(name) && !/\.(test|d)\.tsx?$/.test(name);

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
  // A39: a module that imports the home pack's folder (content/cities/home) reads the home city's tables whatever it names them
  if (/from\s+['"][^'"]*cities\/home(\/[^'"]*)?['"]/.test(src)) out.push('import of content/cities/home');
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
