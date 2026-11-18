// R7a: a city is its pack. Outside a pack's own folders (src/content/cities/<id>/ and its art, src/components/cities/<id>/) no source file names an
// id, a display name or a `BOSTON_`-style identifier of a pack that is not the home city. The rule of home-ids-guard.test.ts, turned round: that one
// keeps the home city out of the engine, this one keeps every other city out of core content, the engine, the store, the audio and the screens.
// What a pack is called is read from the pack itself (CITIES), so a new city is guarded the day it is registered, with no edit here.
// Comments don't count. The lists only shrink: a file that leaves ALLOW may not come back, and an entry whose file no longer offends fails too.
import * as fs from 'fs';
import * as path from 'path';

import { CITIES, HOME_ID } from '../../content/cities';
import { HOME_CAST } from '../../content/cities/home/cast';

const ROOT = path.resolve(__dirname, '../..');

/** Files that still name a pack, each with its reason. Empty since card R7b moved the art into src/components/cities/<id>/; it only shrinks, so it stays empty. */
const ALLOW: Record<string, string> = {};

/** The files that are the registry itself: the lines a new city adds (cities/README.md lists them). They name the pack once, by design. */
const REGISTRY: Record<string, string> = {
  'content/cities/index.ts': 'CITIES: one import and one entry per city',
  'content/cast.ts': 'CHARACTER_IDS: one import and one line per city',
  'content/franchise.ts': 'CITY_ORDER: the order cities are franchised in',
  'components/cities/index.ts': 'CITY_ART: one import and one entry per city (R6)',
  'components/cities/data.ts': 'CITY_DATA: the pure half of the art registry, one import per art file and one entry per city (R7b)',
};

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

const rel = (f: string) => path.relative(ROOT, f).split(path.sep).join('/');

const packs = Object.values(CITIES).filter((c) => c.id !== HOME_ID);
/**
 * A pack's own folders. The home city's words also live in content/copy/home/ (card R5c): the home city names the city after it in its own voice
 * ("To Boston.", and the soon.boston.* lines until card R7b deletes them), so that folder is home's.
 */
const packFolders = [...Object.values(CITIES).flatMap((c) => [`content/cities/${c.id}/`, `components/cities/${c.id}/`]), 'content/copy/home/'];

/** Every way a pack can be named: its id and display names as string literals, and its `BOSTON_`-style identifier prefix. */
function namesOf(city: (typeof packs)[number]): { literals: string[]; prefix: RegExp } {
  const literals = new Set<string>([city.id, city.name]);
  for (const n of city.neighbourhoods) literals.add(n.id), literals.add(n.name);
  for (const c of city.cast) if (!(HOME_CAST as readonly string[]).includes(c)) literals.add(c);
  // the city's id as a word in an identifier or a key, in any of its cases: BOSTON_FIT, BostonSheet, 'city-boston', 'soon.boston.title'
  const word = city.id.replace(/[^a-z0-9]/gi, '');
  const cased = [word.toLowerCase(), word.toUpperCase(), word.charAt(0).toUpperCase() + word.slice(1).toLowerCase()];
  return { literals: [...literals], prefix: new RegExp(`(?<![A-Za-z])(${cased.join('|')})(?![a-z])`) };
}

const escape = (s: string) => s.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');

/** What a file names of the packs, outside its comments (empty when it is clean). */
export function packNames(src: string): string[] {
  const code = src
    .split('\n')
    .filter((l) => !/^\s*(\/\/|\*|\/\*)/.test(l))
    .join('\n')
    // a trailing line comment is a comment too
    .replace(/(^|[^:'"`])\/\/[^\n]*/g, '$1');
  const out: string[] = [];
  for (const city of packs) {
    const { literals, prefix } = namesOf(city);
    const m = code.match(new RegExp(prefix.source, 'g'));
    if (m) out.push(...new Set(m));
    for (const l of literals) if (new RegExp(`(['"\`])${escape(l)}\\1`).test(code)) out.push(`'${l}'`);
  }
  return out;
}

const files = walk(ROOT)
  .map((f): [string, string] => [rel(f), f])
  .filter(([r]) => !packFolders.some((d) => r.startsWith(d)));
const offends = (f: string) => packNames(fs.readFileSync(f, 'utf8'));

describe('no city pack is named outside its own folders', () => {
  test('the walk covers the engine, the store, the audio, the components and the content, and skips the packs', () => {
    const rels = files.map(([r]) => r);
    for (const d of ['engine', 'store', 'audio', 'components', 'content']) expect(rels.some((r) => r.startsWith(`${d}/`))).toBe(true);
    expect(rels).toContain('content/franchise.ts');
    expect(rels.some((r) => r.startsWith('content/cities/boston/'))).toBe(false);
    expect(rels.some((r) => r.startsWith('content/cities/home/'))).toBe(false);
    expect(rels.some((r) => /\.test\.tsx?$/.test(r) || r.includes('__tests__'))).toBe(false);
  });

  test('the checker sees a pack by id, by display name and by identifier, and not in a comment', () => {
    expect(packNames("const a = 'boston';")).toContain("'boston'");
    expect(packNames('const a = "North End";')).toEqual(["'North End'"]);
    expect(packNames('import { BOSTON_FIT } from "./x";')).toEqual(['BOSTON']);
    expect(packNames('<BostonSheet />')).toEqual(['Boston']);
    expect(packNames("copy('soon.boston.title')")).toEqual(['boston']);
    expect(packNames("const a = 'father-dom';")).toEqual(["'father-dom'"]);
    expect(packNames("// 'boston' and BOSTON_FIT\n/** 'southie' */\n * 'fenway'\nconst a = 1; // 'boston'")).toEqual([]);
    expect(packNames("import { x } from './cities/boston/cast';")).toEqual(['boston']); // an import of a pack is a naming too
    expect(packNames("const a = 'downtown';")).toEqual([]);
  });

  test.each(files.filter(([r]) => !(r in ALLOW) && !(r in REGISTRY)))('%s', (_r, file) => {
    expect(offends(file)).toEqual([]);
  });

  test('every ALLOW and REGISTRY entry is a file that still names a pack (the lists only shrink)', () => {
    const present = new Map(files);
    for (const [r, why] of [...Object.entries(ALLOW), ...Object.entries(REGISTRY)]) {
      expect([r, why.length > 0]).toEqual([r, true]);
      expect([r, present.has(r)]).toEqual([r, true]);
      expect([r, offends(present.get(r)!).length > 0]).toEqual([r, true]);
    }
  });
});
