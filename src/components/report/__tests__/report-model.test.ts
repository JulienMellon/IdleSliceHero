// The shop report as data (card P1): which line the strip shows, whose voice, that it fits an iPhone SE beside the manager's face, the
// sheet, and the cards' effect lines.
import { COPY, MANAGER_COPY_KEY, type CopyKey } from '../../../content/service';
import { MANAGERS, NONNA_TAKEOVER } from '../../../content/tuning';
import type { NeighborhoodId } from '../../../content/types';
import { withFeatures } from '../../../engine/features';
import { reportView, service } from '../../../engine/features/service';
import * as G from '../../../engine/game';
import { lampInitial, stripLineHeight, compactEffect, copy, drawerLine, effectLine, fill, HIDDEN_STRIP, lampWord, noGainLine, sheetModel, STRIP, stripFont, stripKind, stripLine, stripModel, stripTextWidth, wrapLines } from '../report-model';

const T0 = 1_800_000_000_000;
const withShop = (g: G.GameState, id: NeighborhoodId, patch: Partial<G.Shop>): G.GameState => ({ ...g, shops: { ...g.shops, [id]: { ...g.shops[id], ...patch } } });
function shop(lv: number, d: number, t: number, patch: Partial<G.Shop> = {}): G.GameState {
  let g = G.newGame(T0);
  g = { ...g, seenScenes: [...g.seenScenes, NONNA_TAKEOVER.sceneId] };
  return withShop(g, 'downtown', { built: true, managed: true, prep: lv, ovens: lv, counter: lv, drivers: d, tables: t, ...patch });
}
function play(g: G.GameState, seconds: number): { g: G.GameState; now: number } {
  let now = T0;
  for (let i = 0; i < seconds; i++) {
    now += 1000;
    g = G.playTick(g, 1, now);
  }
  return { g, now };
}
const only = <T>(fn: () => T): T => withFeatures([service], fn);
const KINDS = ['kitchen', 'quiet', 'tipping', 'cold'] as const;

describe('the copy', () => {
  test('every manager has all four lines and every slot a line uses is one the strip fills', () => {
    for (const id of Object.keys(MANAGERS) as NeighborhoodId[]) {
      for (const k of KINDS) {
        const text = COPY[`report.${MANAGER_COPY_KEY[id]}.${k}` as CopyKey];
        expect(text).toBeTruthy();
        const rest = fill(text, { served: 1, wanted: 1, could: 1, lost: 1 });
        expect(rest).not.toMatch(/\{/);
      }
    }
    expect(fill('{a} of {b}', { a: 1 })).toBe('1 of {b}');
  });
  test('the lamp words come from the copy', () => {
    expect(lampWord('ovens', 'slammed')).toBe('Slammed');
    expect(lampWord('prep', 'idle')).toBe('Idle');
    expect(lampWord('floor', 'full')).toBe('Packed');
    expect(lampWord('floor', 'quiet')).toBe('Quiet');
  });
});

describe('the strip', () => {
  test('kitchen is the limit: served, wanted and the money walking out', () => {
    only(() => {
      const { g, now } = play(shop(5, 10, 1), 3); // wants 168 a minute, serves 126
      const v = reportView(g, 'downtown', now);
      expect(stripKind(v)).toBe('kitchen');
      const m = stripModel(g, 'downtown', now);
      expect(m.show).toBe(true);
      expect(m.text).toContain('126');
      expect(m.text).toContain('168');
      expect(m.text).toMatch(/\$[\d.]+K?\/min/);
      expect(m.ovens).toBe('slammed');
      expect(m.worstDot).toBe('ovens');
      expect(m.word).toBe('Slammed');
    });
  });
  test('the floor is Quiet: what the kitchen could make against the orders coming in', () => {
    only(() => {
      const { g, now } = play(shop(10, 1, 1), 3);
      expect(stripKind(reportView(g, 'downtown', now))).toBe('quiet');
      const m = stripModel(g, 'downtown', now);
      expect(m.text).toBe(copy('report.nonna.quiet', { could: 231, wanted: 33 }));
      expect(m.worstDot).toBe('floor');
      expect(m.word).toBe('Quiet');
    });
  });
  test('tipping: the tip', () => {
    only(() => {
      const { g, now } = play(shop(10, 10, 1), 3);
      expect(stripModel(g, 'downtown', now).text).toBe(COPY['report.nonna.tipping']);
    });
  });
  test('cold: the penalty and what ends it, ahead of the kitchen line', () => {
    only(() => {
      const { g, now } = play(shop(5, 10, 10), 70);
      expect(stripKind(reportView(g, 'downtown', now))).toBe('cold');
      expect(stripModel(g, 'downtown', now).text).toBe(COPY['report.nonna.cold']);
    });
  });
  test('with no manager the neutral copy; with one, their voice and their face', () => {
    only(() => {
      const heads = shop(5, 10, 1, { managed: false, heads: G.allHeads() });
      const { g, now } = play(heads, 3);
      const neutral = stripModel(g, 'downtown', now);
      expect(neutral.manager).toBe('');
      expect(neutral.text).toMatch(/orders a minute/);
      const managed = stripModel(withShop(g, 'downtown', { managed: true }), 'downtown', now);
      expect(managed.manager).toBe(MANAGERS.downtown.id);
      expect(managed.text).toMatch(/cara/);
    });
  });
  test('inactive shops (tapped by hand, or in the tutorial) show nothing new', () => {
    only(() => {
      const by = play(shop(5, 10, 1, { managed: false }), 3);
      expect(stripModel(by.g, 'downtown', by.now)).toBe(HIDDEN_STRIP);
      const tut = play({ ...shop(5, 10, 1), seenScenes: [] }, 3);
      expect(stripModel(tut.g, 'downtown', tut.now).show).toBe(false);
      expect(drawerLine(tut.g, 'downtown')).toBeNull();
    });
  });
  test('the model is primitives only, so a shallow compare tells whether anything changed', () => {
    only(() => {
      const { g, now } = play(shop(5, 10, 1), 3);
      const a = stripModel(g, 'downtown', now);
      const b = stripModel(g, 'downtown', now + 400);
      for (const v of Object.values(a)) expect(['string', 'boolean']).toContain(typeof v);
      expect(b).toEqual(a);
    });
  });
  test('the drawer header is the report line', () => {
    only(() => {
      const { g, now } = play(shop(5, 10, 1), 3);
      expect(drawerLine({ ...g, lastSavedAt: now }, 'downtown')).toBe(stripModel(g, 'downtown', now).text);
    });
  });
});

describe('the strip fits an iPhone SE', () => {
  const SE = 375; // an iPhone SE (375 pt): the narrowest phone the app runs on
  const worst = { served: '99.9K', wanted: '99.9K', could: '99.9K', lost: '$999K/min' };
  test('the strip is a 44 pt touch box with a 28 pt pill (D479): the front wall and the mat show above it', () => {
    expect(STRIP.height).toBe(44);
    expect(STRIP.pill).toBeLessThanOrEqual(28);
    expect(STRIP.pill).toBeLessThan(STRIP.height - 12);
    expect(stripTextWidth(SE, true)).toBeGreaterThan(130);
    // the line's lines, the chips over the word, and the pill's border all fit the pill
    expect(STRIP.maxLines * stripLineHeight(STRIP.fonts[STRIP.fonts.length - 1])).toBeLessThanOrEqual(STRIP.pill - 2 * STRIP.border);
    expect(STRIP.chipH + 11).toBeLessThanOrEqual(STRIP.pill - 2 * STRIP.border);
  });
  test('every lamp chip has an initial, and the strip always has a state word (D492)', () => {
    expect(['prep', 'ovens', 'counter', 'floor'].map((d) => lampInitial(d as 'prep'))).toEqual(['P', 'O', 'C', 'In']);
    only(() => {
      const { g, now } = play(shop(10, 10, 10, { managed: true }), 3);
      const m = stripModel(g, 'downtown', now);
      if (m.show) expect(m.word).not.toBe('');
    });
  });
  test('every manager line, with the longest numbers, takes at most 2 lines at 10 pt or more beside the face', () => {
    for (const id of Object.keys(MANAGERS) as NeighborhoodId[]) {
      for (const k of KINDS) {
        const text = fill(COPY[`report.${MANAGER_COPY_KEY[id]}.${k}` as CopyKey], worst);
        const { size, lines } = stripFont(text, stripTextWidth(SE, true));
        expect(size).toBeGreaterThanOrEqual(10);
        expect(lines).toBeLessThanOrEqual(STRIP.maxLines);
      }
    }
    for (const k of KINDS) {
      const { size, lines } = stripFont(fill(COPY[`report.${k}` as CopyKey], worst), stripTextWidth(SE, false));
      expect(size).toBeGreaterThanOrEqual(10);
      expect(lines).toBeLessThanOrEqual(STRIP.maxLines);
    }
  });
  test('the fit really can fail: one very long line takes more than 2 lines (the test is not vacuous)', () => {
    expect(wrapLines('word '.repeat(40), stripTextWidth(SE, true), 10)).toBeGreaterThan(STRIP.maxLines);
  });
});

describe('the sheet', () => {
  test('each station rate and load, the floor, service with its thresholds, and three ways to fix it', () => {
    only(() => {
      const { g, now } = play(shop(5, 10, 1), 3);
      const s = sheetModel(g, 'downtown', now);
      expect(s.title).toBe('Shop Report');
      expect(s.rows.map((r) => r.key)).toEqual(['prep', 'ovens', 'counter', 'floor']);
      expect(s.rows[1]).toMatchObject({ rate: '126/min', load: '100%', word: 'Slammed' });
      expect(s.rows[3].rate).toBe('168/min');
      expect(s.service).toBe('75%');
      expect(s.tip).toMatch(/90%/);
      expect(s.cold).toMatch(/60%/);
      expect(s.fixes.map((f) => f.key)).toEqual(['faster', 'customers', 'prices']);
      expect(s.fixes.map((f) => f.buys).join(' ')).toMatch(/Ovens.*Seating.*Drivers.*Fleet.*Oven grade.*Decor/);
    });
  });
  test('the cold timer counts down while service is under 60%, and says what ends the cold line', () => {
    only(() => {
      const a = play(shop(5, 10, 10), 21);
      expect(sheetModel(a.g, 'downtown', a.now).timer).toBe('Cold in 40s if it stays under 60%.');
      const b = play(shop(5, 10, 10), 70);
      expect(sheetModel(b.g, 'downtown', b.now).timer).toMatch(/back to 60%/);
    });
  });
});

describe('effect lines', () => {
  test('the gain a minute and the payback time, cost ÷ gain', () => {
    expect(effectLine(5, 3000)).toBe('+$300/min · pays back in 10m');
    expect(effectLine(0.5, 90)).toBe('+$30/min · pays back in 3m');
    expect(effectLine(0, 100)).toBeNull();
    expect(effectLine(null, 100)).toBeNull();
    expect(noGainLine('Prep')).toBe('Prep isn’t holding you back');
  });
  test('a sidewalk card takes the longest form that fits its width', () => {
    expect(compactEffect(5, 3000, 200)).toBe('+$300/min · 10m');
    expect(compactEffect(5, 3000, 60)).toBe('+$300/min');
    expect(compactEffect(5, 3000, 30)).toBe('+$300/m');
    expect(compactEffect(0, 3000, 100)).toBeNull();
  });
});
