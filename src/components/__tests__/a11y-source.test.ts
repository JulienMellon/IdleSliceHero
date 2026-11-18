// Step 3 (accessibility), source level: every <Pressable> says what it is (accessibilityRole) and what it does (a label of its own, or text inside),
// and the scene's drawing is hidden from the screen reader. Reads the .tsx files as text: Jest here runs in node and cannot render them.
import * as fs from 'fs';
import * as path from 'path';

const SRC = path.resolve(__dirname, '../..');

function files(dir: string, out: string[] = []): string[] {
  for (const f of fs.readdirSync(dir)) {
    const p = path.join(dir, f);
    if (fs.statSync(p).isDirectory()) {
      if (f !== '__tests__' && f !== 'node_modules') files(p, out);
    } else if (p.endsWith('.tsx')) out.push(p);
  }
  return out;
}

export interface Found {
  file: string;
  line: number;
  /** The opening tag, from `<Pressable` to its `>`. */
  tag: string;
  /** What is between the opening and closing tags ('' for a self-closing one). */
  body: string;
}

/** Every `<Pressable ...>` in a source text, with its opening tag and its body (braces and strings in props are skipped over). */
export function pressables(src: string, file = ''): Found[] {
  const found: Found[] = [];
  const re = /<Pressable(?=[\s>/])/g;
  let m: RegExpExecArray | null;
  while ((m = re.exec(src))) {
    let i = m.index + m[0].length;
    let depth = 0;
    let quote = '';
    for (; i < src.length; i++) {
      const c = src[i];
      if (quote) {
        if (c === quote && src[i - 1] !== '\\') quote = '';
      } else if (depth === 0 && (c === '"' || c === "'")) quote = c;
      else if (c === '{') depth++;
      else if (c === '}') depth--;
      else if (depth > 0 && (c === '"' || c === "'" || c === '`')) quote = c;
      else if (c === '>' && depth === 0 && src[i - 1] !== '=') break;
    }
    const tag = src.slice(m.index, i + 1);
    let body = '';
    if (!tag.endsWith('/>')) {
      const close = src.indexOf('</Pressable>', i);
      body = close < 0 ? '' : src.slice(i + 1, close);
    }
    found.push({ file, line: src.slice(0, m.index).split('\n').length, tag, body });
  }
  return found;
}

/** Screens that another card is rewriting at the same time: their Pressables are checked once that card lands (the test below fails when an entry is no longer needed, so the list can only shrink). */
const OTHER_CARDS: Record<string, string> = {};

const every = files(SRC).flatMap((f) => pressables(fs.readFileSync(f, 'utf8'), path.relative(SRC, f)));
const all = every.filter((f) => !(f.file in OTHER_CARDS));
const where = (f: Found) => `${f.file}:${f.line}`;
const lacks = (f: Found) => (!/accessibilityRole\s*=/.test(f.tag) || (!/accessibilityLabel\s*=/.test(f.tag) && !/<Text[\s>]/.test(f.body))) && !/\{\.\.\./.test(f.tag);

describe('pressables', () => {
  it('finds them (the walker itself works)', () => {
    expect(all.length).toBeGreaterThan(60);
    const one = pressables('<Pressable onPress={() => a > b} style={{ a: 1 }} accessibilityRole="button"><Text>Go</Text></Pressable>');
    expect(one).toHaveLength(1);
    expect(one[0].tag.endsWith('accessibilityRole="button">')).toBe(true);
    expect(one[0].body).toBe('<Text>Go</Text>');
  });

  it('every Pressable has an accessibilityRole', () => {
    const bare = all.filter((f) => !/accessibilityRole\s*=/.test(f.tag) && !/\{\.\.\./.test(f.tag)).map(where);
    expect(bare).toEqual([]);
  });

  it('every Pressable has a label: its own accessibilityLabel, or text inside it that the reader can speak', () => {
    const mute = all.filter((f) => !/accessibilityLabel\s*=/.test(f.tag) && !/<Text[\s>]/.test(f.body) && !/\{\.\.\./.test(f.tag)).map(where);
    expect(mute).toEqual([]);
  });

  it('a toggle or a disabled control says its state', () => {
    const bad = all
      .filter((f) => /accessibilityRole\s*=\s*"(switch|checkbox|radio|tab)"/.test(f.tag) && !/accessibilityState\s*=/.test(f.tag))
      .map(where);
    expect(bad).toEqual([]);
  });
});

describe('motion', () => {
  const read = (rel: string) => fs.readFileSync(path.join(SRC, rel), 'utf8');

  it('every file that loops an animation asks useMotion first (Reduce Motion and the background stop it)', () => {
    const loopers = files(SRC).filter((f) => /Animated\.loop\(/.test(fs.readFileSync(f, 'utf8')));
    expect(loopers.length).toBeGreaterThan(4);
    const bare = loopers.filter((f) => !/useMotion\(\)/.test(fs.readFileSync(f, 'utf8'))).map((f) => path.relative(SRC, f));
    expect(bare).toEqual([]);
  });

  it('the coin layer, the buy button and the cut-scene player honour Reduce Motion', () => {
    for (const rel of ['components/coin-layer.tsx', 'components/game-ui.tsx', 'components/cutscene-player.tsx']) expect(read(rel)).toMatch(/useMotion\(\)|useReducedMotion\(\)/);
  });

  it('the scene clock and the game tick stop in the background', () => {
    expect(read('components/scene/clock.ts')).toMatch(/useAppActive\(\)/);
    // C134: the one AppState owner (GameRunner) sets it; the game screen subscribes to nothing of its own
    expect(read('app/_layout.tsx')).toMatch(/setBackground\(!isForeground\(/);
    expect(read('app/index.tsx')).not.toMatch(/AppState/);
  });
});

describe('exemptions', () => {
  if (Object.keys(OTHER_CARDS).length > 0) it.each(Object.entries(OTHER_CARDS))('%s (card %s) is still not done: remove it from OTHER_CARDS when it is', (file) => {
    const mine = every.filter((f) => f.file === file);
    expect(mine.some(lacks)).toBe(true);
  });
});

describe('the scene drawing', () => {
  const read = (rel: string) => fs.readFileSync(path.join(SRC, rel), 'utf8');

  it('the storefront hides its SVG from the reader and says what it is once', () => {
    const s = read('components/storefront.tsx');
    expect(s).toMatch(/importantForAccessibility="no-hide-descendants"/);
    expect(s).toMatch(/accessibilityLabel=/);
  });

  it('the shared icon and art SVGs are hidden when they are decoration', () => {
    for (const rel of ['components/icons.tsx', 'components/endgame/recipe-art.tsx']) {
      expect(read(rel)).toMatch(/importantForAccessibility="no-hide-descendants"|accessibilityElementsHidden/);
    }
  });
});
