// The colour rule for buy buttons, as a source scan (v5.23b U7): green (basil) means "this adds income"; amber is the sidewalk's single-cap Expand alone (D407);
// tomato is only for the bottleneck the report names, never on a label that sells something. The critic log shows each new buy surface breaking this
// (D42, D53, D263, D313, D319, G75, D550, D553), so a buy button takes its colour from `buttonTone` -> `BuyButton`, or from nowhere. Jest runs in node, so this reads
// the .ts/.tsx files as text; `scan` is pure and the last tests feed it a deliberate amber Expand to prove it fails.
import * as fs from 'fs';
import * as path from 'path';

const SRC = path.resolve(__dirname, '../..');

function files(dir: string, out: string[] = []): string[] {
  for (const f of fs.readdirSync(dir)) {
    const p = path.join(dir, f);
    if (fs.statSync(p).isDirectory()) {
      if (f !== '__tests__' && f !== 'node_modules') files(p, out);
    } else if (/\.tsx?$/.test(p)) out.push(p);
  }
  return out;
}

/** A palette colour a buy button must never take on its own: basil, tomato, or an amber hex. */
const PALETTE = /\bC\.(?:basil|tomato)\w*|#F2A51A\b|#B9780B\b|\bEXPAND_AMBER\b/i;
const AMBER = /#F2A51A\b|#B9780B\b|\bEXPAND_AMBER\b/i;
/** A style entry whose name says it is a buy / purchase / expand / upgrade surface. */
const BUY_KEY = /buy|purchase|expand|upgrade/i;
const COLOUR_PROP = /\b(?:backgroundColor|border\w*Color)\s*:\s*([^,}]+)/g;
/** What a `tone=` on a `<BuyButton>` may be: the shared rule, a model's `tone` field, or one of the flat literals. */
const TONE_OK = /^(?:buttonTone\(|props\.tone$|\w+\.tone$|'(?:normal|neutral|nogain)'$|\w+\.lock \? 'nogain' : 'normal'$)/;

export interface Hit {
  file: string;
  rule: 'palette-on-buy-style' | 'amber-outside-buybutton' | 'tone-outside-buttontone' | 'expand-tone-outside-sidewalk';
  text: string;
}

/**
 * Entries that may break the rule, each with its reason. A hit is matched by file and by a substring of its text.
 * Adding one needs a reason a reviewer can check; a bare colour on a buy button is never one.
 */
export const ALLOWLIST: readonly { file: string; rule: Hit['rule']; text: string; reason: string }[] = [
  {
    file: 'components/game-ui.tsx',
    rule: 'amber-outside-buybutton',
    text: 'EXPAND_AMBER',
    reason: 'BuyButton itself: the one place the tone `expand` becomes amber (D407); every other file asks for the tone',
  },
  {
    file: 'components/game-ui.tsx',
    rule: 'amber-outside-buybutton',
    text: '#B9780B',
    reason: "BuyButton itself: the Expand button's darker lip",
  },
  {
    file: 'components/layers/stars/stars-sheet.tsx',
    rule: 'palette-on-buy-style',
    text: 'buy: backgroundColor: C.basil',
    reason:
      "the Uptown stars sheet's ingredients buy is a plain Pressable (no BuyButton) that raises income, so it is basil, greyed by `buyOff` when it cannot be bought",
  },
  {
    file: 'components/store/store-tab.tsx',
    rule: 'palette-on-buy-style',
    text: 'btnBuy',
    reason:
      "the Store's diamond and pack buys are real purchases drawn basil with the same crust lip as BuyButton's normal tone; the Store draws its own layout",
  },
];

const allowed = (h: Hit) => ALLOWLIST.some((a) => a.file === h.file && a.rule === h.rule && h.text.includes(a.text));

/** Every break of the colour rule in one file's source. */
export function scan(file: string, src: string): Hit[] {
  const hits: Hit[] = [];
  const add = (rule: Hit['rule'], text: string) => hits.push({ file, rule, text: text.replace(/\s+/g, ' ').trim() });
  // 1. a buy / expand style entry whose background or border is a palette colour
  for (const m of src.matchAll(/(\w+)\s*:\s*\{([^{}]*)\}/g)) {
    if (!BUY_KEY.test(m[1])) continue;
    for (const c of m[2].matchAll(COLOUR_PROP)) if (PALETTE.test(c[1])) add('palette-on-buy-style', `${m[1]}: ${c[0]}`);
  }
  // 2. amber anywhere but BuyButton
  for (const [i, line] of src.split('\n').entries()) if (AMBER.test(line) && !line.trim().startsWith('//')) add('amber-outside-buybutton', `${i + 1}: ${line}`);
  // 3. a <BuyButton>'s tone is the shared rule's answer; "expand" is the sidewalk row's alone; no palette colour in its own style
  for (const m of src.matchAll(/<BuyButton\b((?:[^<>{}]|\{(?:[^{}]|\{[^{}]*\})*\})*)>/g)) {
    const tone = m[1].match(/\btone=(?:\{((?:[^{}]|\{[^{}]*\})*)\}|"([^"]*)")/);
    const value = tone ? (tone[1] !== undefined ? tone[1].trim() : `'${tone[2]}'`) : null;
    if (value === "'expand'" || value === '"expand"') {
      if (file !== 'components/sidewalk-row.tsx') add('expand-tone-outside-sidewalk', m[0]);
    } else if (value !== null && !TONE_OK.test(value)) add('tone-outside-buttontone', `tone=${value}`);
    if (PALETTE.test(m[1].replace(/\btone=(?:\{(?:[^{}]|\{[^{}]*\})*\}|"[^"]*")/, ''))) add('palette-on-buy-style', m[0]);
  }
  // 4. the models: the drawer's cards take `buttonTone` alone (D550), the sidewalk's only 'normal' or 'expand'
  if (file === 'components/drawer-model.ts')
    for (const m of src.matchAll(/\btone:\s*([^\n]*)/g))
      if (!/^(?:buttonTone\(|ButtonTone)/.test(m[1].trim()) && !/^\w+;?$/.test(m[1].trim())) add('tone-outside-buttontone', `tone: ${m[1]}`);
  return hits;
}

const all = (): Hit[] =>
  files(SRC)
    .filter((f) => /\/(components|app)\//.test(f))
    .flatMap((f) => scan(path.relative(SRC, f), fs.readFileSync(f, 'utf8')));

describe('a buy button takes its colour from buttonTone, nowhere else (v5.23b U7)', () => {
  test('no buy surface in src/components or src/app takes a basil, tomato or amber colour outside the allowlist', () => {
    const bad = all().filter((h) => !allowed(h));
    expect(bad).toEqual([]);
  });
  test('every allowlist entry is still needed and has a reason', () => {
    const hits = all();
    for (const a of ALLOWLIST) {
      expect(a.reason.length).toBeGreaterThan(20);
      expect(hits.some((h) => h.file === a.file && h.rule === a.rule && h.text.includes(a.text))).toBe(true);
    }
  });
  test('the sidewalk row keeps the one amber Expand (D407): tone "expand" is drawn there and nowhere else', () => {
    const row = fs.readFileSync(path.join(SRC, 'components/sidewalk-row.tsx'), 'utf8');
    expect(row).toMatch(/tone="expand"/);
    expect(all().filter((h) => h.rule === 'expand-tone-outside-sidewalk')).toEqual([]);
  });
  test('proof it bites: a drawer Expand drawn amber, or a buy style in basil/tomato, or a hand-made tone, is caught', () => {
    const amberExpand = `const styles = { expandBuy: { backgroundColor: '#F2A51A', borderColor: '#B9780B' } };`;
    const hits = scan('components/drawer-ui.tsx', amberExpand);
    expect(hits.map((h) => h.rule)).toContain('palette-on-buy-style');
    expect(hits.map((h) => h.rule)).toContain('amber-outside-buybutton');
    expect(scan('components/x.tsx', `const s = { buyBtn: { borderColor: C.tomato } };`)).toHaveLength(1);
    expect(scan('components/x.tsx', `const s = { upgradeBtn: { backgroundColor: C.basilDark } };`)).toHaveLength(1);
    expect(scan('components/x.tsx', `<BuyButton label="Expand" tone="expand" enabled onPress={f} />`).map((h) => h.rule)).toEqual([
      'expand-tone-outside-sidewalk',
    ]);
    expect(scan('components/x.tsx', `<BuyButton label="x" tone={cost > 5 ? 'amber' : 'normal'} onPress={f} />`).map((h) => h.rule)).toEqual([
      'tone-outside-buttontone',
    ]);
    expect(scan('components/x.tsx', `<BuyButton label="x" style={{ backgroundColor: C.tomato }} onPress={f} />`).map((h) => h.rule)).toEqual([
      'palette-on-buy-style',
    ]);
    expect(scan('components/drawer-model.ts', `  tone: expandCost ? 'expand' : 'normal',`).map((h) => h.rule)).toEqual(['tone-outside-buttontone']);
  });
  test('the clean cases pass: buttonTone, a model field, the flat literals, a non-buy style in basil', () => {
    const ok = `<BuyButton tone={buttonTone({ lock: false, gain: 1 })} />\n<BuyButton tone={props.tone} />\n<BuyButton tone={v.tone} />\n<BuyButton tone={next.lock ? 'nogain' : 'normal'} />\n<BuyButton tone="neutral" />\nconst s = { bar: { backgroundColor: C.basil } };`;
    expect(scan('components/x.tsx', ok)).toEqual([]);
  });
});
