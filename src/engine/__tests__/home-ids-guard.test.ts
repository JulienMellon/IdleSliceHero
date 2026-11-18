// T107: the engine and the store read "the current city" from the save. No file under src/engine or src/store may name the home city's
// neighbourhood list (`HOME_HOOD_IDS`) or a home neighbourhood id as a string literal, except the files listed here (and why).
// T109: the models the screens read the city through (drawer, goal, city, ad and mastery) are held to the same rule.
import * as fs from 'fs';
import * as path from 'path';

const ROOT = path.resolve(__dirname, '../..');
/** Files that may name the home city: the feature `init`/`migrate` hooks (no game yet) and the old-save migration. */
const ALLOW = new Set(['engine/game.ts', 'engine/features/service.ts', 'engine/features/mastery.ts']);
const HOME_IDS = ['downtown', 'suburbs', 'waterfront', 'university', 'industrial', 'uptown'];

function walk(dir: string, out: string[] = []): string[] {
  for (const e of fs.readdirSync(dir, { withFileTypes: true })) {
    const p = path.join(dir, e.name);
    if (e.isDirectory()) {
      if (e.name !== '__tests__') walk(p, out);
    } else if (/\.tsx?$/.test(e.name)) out.push(p);
  }
  return out;
}

const MODELS = ['components/drawer-model.ts', 'components/goal-model.ts', 'components/city-model.ts', 'components/store/ad-model.ts', 'components/endgame/mastery-model.ts'].map((m) => path.join(ROOT, m));

describe('no home-city constants in the engine, the store or the screens\' models', () => {
  const files = [...walk(path.join(ROOT, 'engine')), ...walk(path.join(ROOT, 'store')), ...MODELS].map((f) => [path.relative(ROOT, f).split(path.sep).join('/'), f]);
  test.each(files.filter(([rel]) => !ALLOW.has(rel)))('%s', (_rel, file) => {
    const src = fs.readFileSync(file, 'utf8').split('\n').filter((l) => !/^\s*(\/\/|\*|\/\*)/.test(l)).join('\n');
    expect(src).not.toMatch(/\bHOME_HOOD_IDS\b/);
    for (const id of HOME_IDS) expect(src).not.toMatch(new RegExp(`['"\`]${id}['"\`]`));
  });
});
