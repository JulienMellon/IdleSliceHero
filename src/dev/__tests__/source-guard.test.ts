/// <reference types="jest" />
// Card X1: nothing outside src/dev/ may bundle the Test panel into the normal build. The rule (src/dev/README.md): a file outside src/dev/ may
// import src/dev/test-mode, and may reach any other src/dev/ file only through a require() (or import()) inside a block opened by the literal
// `if (process.env.EXPO_PUBLIC_TEST_MODE === '1') {` in the same file. A static import of the panel, an unguarded require, and a require behind an
// imported TEST_MODE constant (Metro collects it before it folds the constant) all fail.
import * as fs from 'fs';
import * as path from 'path';

const REPO = path.resolve(__dirname, '..', '..', '..');
const SRC = path.join(REPO, 'src');
const ALLOWED = 'src/dev/test-mode';
const GUARD = /if\s*\(\s*process\.env\.EXPO_PUBLIC_TEST_MODE\s*===\s*'1'\s*\)\s*\{/g;
// static: `import ... from 'x'` / `export ... from 'x'` (the `from`), and the bare `import 'x'`; dynamic: `require('x')`, `import('x')`
const FROM = /\bfrom\s*(['"])([^'"\n]+)\1/g;
const BARE = /(?:^|[\s;])import\s*(['"])([^'"\n]+)\1/g;
const DYNAMIC = /\b(?:require|import)\s*\(\s*(['"])([^'"\n]+)\1\s*\)/g;

export interface Violation {
  file: string;
  line: number;
  spec: string;
  rule: 'static-import' | 'unguarded-require';
}

/** The `[open, close]` offsets of every block opened by the literal guard (braces counted; fine for the code this repo writes). */
function guardedRanges(source: string): [number, number][] {
  const ranges: [number, number][] = [];
  for (const m of source.matchAll(GUARD)) {
    const open = m.index! + m[0].length - 1;
    let depth = 0;
    for (let i = open; i < source.length; i++) {
      if (source[i] === '{') depth++;
      else if (source[i] === '}' && --depth === 0) {
        ranges.push([open, i]);
        break;
      }
    }
  }
  return ranges;
}

/** The repo-relative path an import specifier points at, or null for a package. */
function resolveSpec(file: string, spec: string): string | null {
  if (spec.startsWith('@/')) return 'src/' + spec.slice(2);
  if (spec.startsWith('.')) return path.posix.normalize(path.posix.join(path.posix.dirname(file), spec));
  return null;
}

const inDev = (p: string) => p === 'src/dev' || p.startsWith('src/dev/');

/** Every break of the rule in one file (`file` is repo-relative with forward slashes). Exported for the fixtures below. */
export function violations(file: string, source: string): Violation[] {
  const found: Violation[] = [];
  const ranges = guardedRanges(source);
  const lineOf = (i: number) => source.slice(0, i).split('\n').length;
  const check = (index: number, spec: string, dynamic: boolean) => {
    const target = resolveSpec(file, spec);
    if (!target || !inDev(target) || target === ALLOWED) return;
    if (!dynamic) return void found.push({ file, line: lineOf(index), spec, rule: 'static-import' });
    if (!ranges.some(([a, b]) => index > a && index < b)) found.push({ file, line: lineOf(index), spec, rule: 'unguarded-require' });
  };
  for (const m of source.matchAll(FROM)) check(m.index!, m[2], false);
  for (const m of source.matchAll(BARE)) check(m.index!, m[2], false);
  for (const m of source.matchAll(DYNAMIC)) check(m.index!, m[2], true);
  return found;
}

function sourceFiles(dir: string, out: string[] = []): string[] {
  for (const e of fs.readdirSync(dir, { withFileTypes: true })) {
    const p = path.join(dir, e.name);
    if (e.isDirectory()) {
      if (e.name === '__tests__' || e.name === '__fixtures__' || p === path.join(SRC, 'dev')) continue;
      sourceFiles(p, out);
    } else if (/\.(ts|tsx|js|jsx)$/.test(e.name) && !e.name.endsWith('.d.ts')) out.push(p);
  }
  return out;
}

describe('the scanner (one failing example per rule)', () => {
  const at = 'src/components/game-ui.tsx';
  it('fails a static import of the panel', () => {
    expect(violations(at, `import { TestPill } from '../dev/panel';`).map((v) => v.rule)).toEqual(['static-import']);
    expect(violations(at, `import '@/dev/panel-sections';`).map((v) => v.rule)).toEqual(['static-import']);
    expect(violations(at, `export { x } from '../dev/panel';`).map((v) => v.rule)).toEqual(['static-import']);
  });
  it('fails a require outside the literal guard', () => {
    expect(violations(at, `const p = require('../dev/panel');`).map((v) => v.rule)).toEqual(['unguarded-require']);
    expect(violations(at, `const p = await import('@/dev/panel');`).map((v) => v.rule)).toEqual(['unguarded-require']);
  });
  it('fails a require behind an imported constant, or a guard written another way', () => {
    expect(violations(at, `if (TEST_MODE) {\n  require('../dev/panel');\n}`).length).toBe(1);
    expect(violations(at, `if (process.env.EXPO_PUBLIC_TEST_MODE) {\n  require('../dev/panel');\n}`).length).toBe(1);
    expect(violations(at, `if (process.env.EXPO_PUBLIC_TEST_MODE === '1') {\n}\nrequire('../dev/panel');`).length).toBe(1);
  });
  it('lets a require inside the literal guard through, and the test-mode import anywhere', () => {
    expect(violations(at, `if (process.env.EXPO_PUBLIC_TEST_MODE === '1') {\n  if (x) {\n    P = require('../dev/panel').TestPill;\n  }\n}`)).toEqual([]);
    expect(violations(at, `import { TEST_MODE } from '../dev/test-mode';\nconst k = require('@/dev/test-mode');`)).toEqual([]);
  });
  it('resolves a relative path from the importing file, and ignores packages', () => {
    expect(violations('src/app/index.tsx', `import x from '../dev/panel';`).length).toBe(1);
    expect(violations('src/app/index.tsx', `import x from './dev/panel';`)).toEqual([]);
    expect(violations('src/app/index.tsx', `import x from 'some-dev/panel';`)).toEqual([]);
  });
});

describe('the app', () => {
  const files = sourceFiles(SRC);
  it('walks the app (not an empty list)', () => {
    expect(files.length).toBeGreaterThan(100);
    expect(files.some((f) => f.endsWith(path.join('components', 'game-ui.tsx')))).toBe(true);
  });
  it('never imports src/dev/ except test-mode, or requires it outside the literal guard', () => {
    const bad = files.flatMap((f) => violations(path.relative(REPO, f).split(path.sep).join('/'), fs.readFileSync(f, 'utf8')));
    expect(bad).toEqual([]);
  });
  it('still reaches the panel from game-ui.tsx (the guard is not vacuous)', () => {
    const src = fs.readFileSync(path.join(SRC, 'components', 'game-ui.tsx'), 'utf8');
    expect(src).toMatch(/process\.env\.EXPO_PUBLIC_TEST_MODE === '1'\) \{[^}]*TestPill = require\('\.\.\/dev\/panel'\)/);
  });
});
