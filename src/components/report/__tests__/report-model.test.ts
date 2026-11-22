// The shop report as data (card U3, v5.22): one bar per station and one for the drivers, the dashed line at the customers a minute, the served/missed
// strip, that it fits an iPhone SE beside the manager's face, and the cards' effect lines.
import * as fs from 'fs';
import * as path from 'path';

import { MANAGERS } from '../../../content/cities/home/data';
import { NONNA_TAKEOVER } from '../../../content/cities/home/fit';
import { t } from '../../../content/copy';
import { COPY as REPORT_COPY } from '../../../content/copy/home/report';
import type { NeighborhoodId } from '../../../content/types';
import { withFeatures } from '../../../engine/features';
import { reportView, service } from '../../../engine/features/service';
import { markMissedZeroShown, saveOf } from '../../../engine/chapters';
import * as G from '../../../engine/game';
import {
  BAR_KEYS,
  barRows,
  drawerLine,
  fill,
  MISSED_ZERO_HOLD_S,
  missedZeroPlays,
  HIDDEN_STRIP,
  REPORT_TARGET,
  REPORT_TARGETS,
  reportLine,
  sheetModel,
  STRIP,
  stripFont,
  stripKind,
  markMissedZeroSeen,
  missedZeroSeen,
  PAYOFF,
  resetMissedZeroSeen,
  stripLineHeight,
  stripModel,
  stripTextWidth,
  wrapLines,
} from '../report-model';

const T0 = 1_800_000_000_000;
const withShop = (g: G.GameState, id: NeighborhoodId, patch: Partial<G.Shop>): G.GameState => ({
  ...g,
  shops: { ...g.shops, [id]: { ...g.shops[id], ...patch } },
});
function shop(prep: number, ovens: number, counter: number, drivers: number, tables: number, patch: Partial<G.Shop> = {}): G.GameState {
  let g = G.newGame(T0);
  g = { ...g, seenScenes: [...g.seenScenes, NONNA_TAKEOVER.sceneId] };
  return withShop(g, 'downtown', { built: true, managed: true, prep, ovens, counter, drivers, tables, ...patch });
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
// the four shops of the card: short on ovens, short on drivers, balanced, and one whose ovens the player taps by hand
const shortOvens = () => play(shop(10, 5, 10, 10, 1), 3);
const shortDrivers = () => play(shop(10, 10, 10, 1, 1), 3);
const balanced = () => play(shop(8, 8, 8, 4, 4), 3);
const byHand = () => play(shop(10, 5, 10, 10, 1, { managed: false, heads: { prep: true, oven: false, counter: true } }), 3);

describe('the copy', () => {
  test('every report word is in the home copy, and every slot a line uses is one the report fills', () => {
    for (const [key, text] of Object.entries(REPORT_COPY)) {
      expect(t(key)).toBe(text);
      expect(fill(text, { n: 1, served: 1, missed: 1, drivers: 1, seats: 1 })).not.toMatch(/\{/);
    }
    expect(t('report.strip', { served: 41, missed: 7 })).toBe('Served 41/min · Missed 7/min');
    expect(fill('{a} of {b}', { a: 1 })).toBe('1 of {b}');
  });
  test('the retired copy is gone from the report: no lamp words, no fix rows, no manager voices, no source reader of the deprecated fields', () => {
    const dir = path.resolve(__dirname, '..');
    for (const f of ['report-model.ts', 'report-sheet.tsx', 'report-strip.tsx']) {
      const src = fs.readFileSync(path.join(dir, f), 'utf8');
      expect(src).not.toMatch(/LAMP_|lampWord|lampInitial|FIX_ROWS|MANAGER_COPY_KEY|kitchenLimits|\.lamps\b|\.worst\b|report\.sheet\.fix|report\.nonna|lamp\./);
    }
  });
});

describe('the bars', () => {
  test('short on ovens: the ovens bar is shorter than the line, the others are longer; one bar per kitchen station, then the customers row', () => {
    only(() => {
      const { g, now } = shortOvens();
      const s = sheetModel(g, 'downtown', now);
      expect(s.bars.map((b) => b.key)).toEqual(['prep', 'ovens', 'counter']);
      expect(s.bars.map((b) => b.name)).toEqual(['Prep', 'Ovens', 'Counter']);
      expect(s.customers.name).toBe('Hungry crowd'); // S98: the row's name; the dashed line keeps "Customers"
      expect(s.demand.label).toMatch(/^Customers /);
      const by = Object.fromEntries(s.bars.map((b) => [b.key, b]));
      expect(by.ovens.value).toBe('126/min');
      expect(by.ovens.frac).toBeLessThan(s.demand.frac);
      for (const k of ['prep', 'counter']) expect(by[k].frac).toBeGreaterThan(s.demand.frac);
      expect(s.demand.label).toBe('Customers 168/min');
      expect(s.served).toBe('Served 126/min');
      expect(s.missed).toBe('Missed 42/min');
    });
  });
  test('G119 / S90: the customers are one stacked bar, deliveries then seats, that ends exactly at the dashed line; no lone Drivers bar to fall short of it', () => {
    only(() => {
      for (const play of [shortOvens, shortDrivers, balanced]) {
        const { g, now } = play();
        const s = sheetModel(g, 'downtown', now);
        expect(s.bars.map((b) => b.name)).not.toContain('Drivers');
        expect(s.customers.deliveries + s.customers.seats).toBeCloseTo(s.demand.frac, 9);
        const v = reportView(g, 'downtown', now);
        expect(v.capacity.drivers + v.walkIns).toBeCloseTo(v.wanted, 6);
      }
      // short on drivers (one driver): the numbers of shot 183, 15 a minute by driver and 18 by seat make the 33 the line asks for, and nothing is missed
      const { g, now } = shortDrivers();
      const s = sheetModel(g, 'downtown', now);
      expect(s.customers.value).toBe('33/min');
      expect(s.customers.split).toBe('Drivers 15/min · Seats 18/min');
      expect(s.missed).toBe('Missed 0/min');
      for (const b of s.bars) expect(b.frac).toBeGreaterThan(s.demand.frac); // every bar that stops short of the line would mean missed customers
    });
  });
  test('balanced: every bar reaches the line, nothing is missed', () => {
    only(() => {
      const { g, now } = balanced();
      const s = sheetModel(g, 'downtown', now);
      expect(s.missed).toBe('Missed 0/min');
      for (const b of s.bars) expect(b.frac).toBeGreaterThanOrEqual(s.demand.frac);
      expect(s.customers.deliveries + s.customers.seats).toBeCloseTo(s.demand.frac, 9);
    });
  });
  test('D556: the strip plays the "Missed reached 0" payoff once per shop per session, only while Missed is 0; the save records it too', () => {
    only(() => {
      resetMissedZeroSeen();
      const bal = balanced();
      expect(stripModel(bal.g, 'downtown', bal.now).zero).toBe(true);
      expect(sheetModel(bal.g, 'downtown', bal.now).zero).toBe(true);
      expect(stripModel(shortOvens().g, 'downtown', shortOvens().now).zero).toBe(false);
      expect(saveOf(bal.g).missedZero).toBe(false);
      expect(missedZeroPlays(true, missedZeroSeen('downtown'))).toBe(true);
      markMissedZeroSeen('downtown');
      expect(missedZeroPlays(true, missedZeroSeen('downtown'))).toBe(false);
      expect(missedZeroPlays(true, missedZeroSeen('suburbs' as NeighborhoodId))).toBe(true); // another shop has its own
      resetMissedZeroSeen();
      expect(missedZeroSeen('downtown')).toBe(false);
      const after = markMissedZeroShown(bal.g); // what the store's `missedZeroShown` does once the payoff has played
      expect(saveOf(after).missedZero).toBe(true);
      expect(markMissedZeroShown(after)).toBe(after);
      expect(missedZeroPlays(false, false)).toBe(false);
      expect(MISSED_ZERO_HOLD_S).toBe(10);
      expect(PAYOFF.coins).toBe(6);
      expect(t('report.missedZero')).toBe('Not one missed, cara. Like the old days.');
    });
  });
  test('a hand-tapped station says "You tap" on its bar, and no other bar does', () => {
    only(() => {
      const { g, now } = byHand();
      const s = sheetModel(g, 'downtown', now);
      expect(s.bars.filter((b) => b.you).map((b) => [b.key, b.you])).toEqual([['ovens', 'You tap']]);
      const c = shortOvens();
      expect(sheetModel(c.g, 'downtown', c.now).bars.every((b) => b.you === '')).toBe(true);
    });
  });
  test('the longest of the bars and the line fills the track; a longer line shortens every bar', () => {
    const you = { prep: false, ovens: false, counter: false };
    const bars = barRows({ capacity: { prep: 10, ovens: 20, counter: 5, drivers: 8 }, walkIns: 4, wanted: 12, you });
    expect(bars.bars.map((b) => b.frac)).toEqual([0.5, 1, 0.25]);
    expect(bars.demandFrac).toBe(0.6);
    expect(bars.customers.deliveries).toBe(0.4);
    expect(bars.customers.seats).toBeCloseTo(0.2, 9); // 8 + 4 = 12, the line
    const wide = barRows({ capacity: { prep: 10, ovens: 20, counter: 5, drivers: 8 }, walkIns: 32, wanted: 40, you });
    expect(wide.demandFrac).toBe(1);
    expect(wide.bars.map((b) => b.frac)).toEqual([0.25, 0.5, 0.125]);
    expect(wide.customers.deliveries).toBe(0.2);
    expect(wide.customers.seats).toBeCloseTo(0.8, 9);
    const none = barRows({ capacity: { prep: 0, ovens: 0, counter: 0, drivers: 0 }, walkIns: 0, wanted: 0, you });
    expect([none.demandFrac, ...none.bars.map((b) => b.frac), none.customers.deliveries, none.customers.seats]).toEqual([0, 0, 0, 0, 0, 0]);
  });
  test('no bar carries a colour or a lamp: a bar is its name, value, length and "You tap"', () => {
    only(() => {
      const { g, now } = shortOvens();
      for (const b of sheetModel(g, 'downtown', now).bars) expect(Object.keys(b).sort()).toEqual(['frac', 'key', 'name', 'target', 'value', 'you']);
    });
  });
  test('the coach finds the strip, every bar, the dashed line and Close', () => {
    expect(REPORT_TARGETS).toEqual(['report:strip', 'report:demand', 'report:close', 'report:bar:prep', 'report:bar:ovens', 'report:bar:counter']);
    expect(BAR_KEYS.map(REPORT_TARGET.bar)).toContain('report:bar:ovens');
    only(() => {
      const { g, now } = shortOvens();
      expect(sheetModel(g, 'downtown', now).bars.map((b) => b.target)).toEqual(REPORT_TARGETS.slice(3));
    });
    // each id is really drawn: the sheet registers the line, Close and every bar; the strip registers itself
    const dir = path.resolve(__dirname, '..');
    const sheet = fs.readFileSync(path.join(dir, 'report-sheet.tsx'), 'utf8');
    const strip = fs.readFileSync(path.join(dir, 'report-strip.tsx'), 'utf8');
    for (const id of ['demand', 'close']) expect(sheet).toContain(`REPORT_TARGET.${id}`);
    // S92: the "customers" look covers the dashed line, not just its label: the target wraps the legend and the bars box
    expect(sheet).toMatch(/ref=\{demandTarget\}[^>]*testID="report-demand">\s*<View style=\{styles\.legend\}>[\s\S]*<DemandLine/);
    expect(sheet).toContain('useCoachTarget(id)');
    expect(strip).toContain('REPORT_TARGET.strip');
  });
});

describe('the sheet', () => {
  test('served and missed, the service score, and a neutral word for the tip', () => {
    only(() => {
      const a = shortOvens();
      const s = sheetModel(a.g, 'downtown', a.now);
      expect(s.title).toBe('Shop Report');
      expect(s.service).toBe('Service 75%');
      expect(s.stateWord).toBe('');
      expect(s.tip).toMatch(/90%/);
      expect(s.cold).toMatch(/60%/);
      const b = balanced();
      expect(sheetModel(b.g, 'downtown', b.now).stateWord).toBe('Tips up');
    });
  });
  test('the cold timer counts down while service is under 60%, and the cold line has a neutral word', () => {
    only(() => {
      const a = play(shop(5, 5, 5, 10, 10), 21);
      expect(sheetModel(a.g, 'downtown', a.now).timer).toBe('Cold in 40s if it stays under 60%.');
      const b = play(shop(5, 5, 5, 10, 10), 70);
      const s = sheetModel(b.g, 'downtown', b.now);
      expect(s.timer).toMatch(/back to 60%/);
      expect(s.stateWord).toBe('Line’s gone cold');
      expect(stripKind(reportView(b.g, 'downtown', b.now))).toBe('cold');
      // D554: the strip carries the neutral suffix for the cold line, as for the tip, from the same stripKind
      expect(stripModel(b.g, 'downtown', b.now).text).toMatch(/ · Word’s spreading$/);
    });
  });
  test('nothing in the sheet names a station as the limit', () => {
    only(() => {
      const { g, now } = shortOvens();
      const s = sheetModel(g, 'downtown', now);
      const words = [s.stateWord, s.served, s.missed, s.service, s.demand.label, s.tip, s.cold].join(' ');
      expect(words).not.toMatch(/slammed|bottleneck|limit|holding you back|faster stations/i);
    });
  });
});

describe('the strip', () => {
  test('one line: served and missed a minute, and nothing else', () => {
    only(() => {
      const { g, now } = shortOvens();
      const m = stripModel(g, 'downtown', now);
      expect(m).toEqual({ show: true, text: 'Served 126/min · Missed 42/min', manager: MANAGERS.downtown.id, zero: false });
      expect(m.text).not.toMatch(/prep|oven|counter|driver|slammed|quiet|tip|cold/i);
      expect(reportLine(reportView(g, 'downtown', now))).toBe(m.text);
    });
  });
  test('the same numbers in every state: tipping and cold only add a neutral word after them', () => {
    only(() => {
      const a = balanced();
      expect(stripModel(a.g, 'downtown', a.now).text).toMatch(/^Served \d+\/min · Missed 0\/min · Tips up$/);
      const c = play(shop(5, 5, 5, 10, 10), 70);
      expect(stripModel(c.g, 'downtown', c.now).text).toMatch(/^Served \d+\/min · Missed \d+\/min( · Word’s spreading)?$/);
    });
  });
  test('shown from the first head: with no manager there is no face; with no head and no manager it is hidden', () => {
    only(() => {
      const heads = byHand();
      expect(stripModel(heads.g, 'downtown', heads.now)).toMatchObject({ show: true, manager: '' });
      const none = play(shop(5, 5, 5, 10, 1, { managed: false }), 3);
      expect(stripModel(none.g, 'downtown', none.now)).toBe(HIDDEN_STRIP);
      expect(drawerLine(none.g, 'downtown')).toBeNull();
    });
  });
  test('the model is primitives only, so a shallow compare tells whether anything changed', () => {
    only(() => {
      const { g, now } = shortOvens();
      const a = stripModel(g, 'downtown', now);
      const b = stripModel(g, 'downtown', now + 400);
      for (const v of Object.values(a)) expect(['string', 'boolean']).toContain(typeof v);
      expect(b).toEqual(a);
    });
  });
  test('D554: a tipping shop says "Tips up" on the strip and a cold one "Word’s spreading", neutral words; nothing else adds a suffix', () => {
    expect(reportLine({ served: 41, missed: 7, state: 'tipping' })).toBe('Served 41/min · Missed 7/min · Tips up');
    expect(reportLine({ served: 41, missed: 7, state: 'cold' })).toBe('Served 41/min · Missed 7/min · Word’s spreading');
    expect(reportLine({ served: 41, missed: 7, state: 'normal' })).toBe('Served 41/min · Missed 7/min');
    expect(reportLine({ served: 41, missed: 7, state: 'inactive' })).toBe('Served 41/min · Missed 7/min');
    only(() => {
      const { g, now } = balanced();
      expect(reportView(g, 'downtown', now).state).toBe('tipping');
      expect(stripModel(g, 'downtown', now).text).toMatch(/ · Tips up$/);
    });
  });
  test('the drawer header is the report line', () => {
    only(() => {
      const { g, now } = shortOvens();
      expect(drawerLine({ ...g, lastSavedAt: now }, 'downtown')).toBe(stripModel(g, 'downtown', now).text);
    });
  });
});

describe('the strip fits an iPhone SE', () => {
  const SE = 375; // an iPhone SE (375 pt): the narrowest phone the app runs on
  const worst = `${t('report.strip', { served: '99.9K', missed: '99.9K' })} ${t('report.strip.cold.word')}`; // the longest: a cold line adds a word (D554)
  test('the strip is a 44 pt touch box with a 28 pt pill (D479): the front wall and the mat show above it', () => {
    expect(STRIP.height).toBe(44);
    expect(STRIP.pill).toBeLessThanOrEqual(28);
    expect(STRIP.pill).toBeLessThan(STRIP.height - 12);
    expect(stripTextWidth(SE, true)).toBeGreaterThan(200);
    // the line's lines and the pill's border all fit the pill
    expect(STRIP.maxLines * stripLineHeight(STRIP.fonts[STRIP.fonts.length - 1])).toBeLessThanOrEqual(STRIP.pill - 2 * STRIP.border);
  });
  test('the line, with the longest numbers, takes at most 2 lines at 10 pt or more beside the face or without it', () => {
    for (const badge of [true, false]) {
      const { size, lines } = stripFont(worst, stripTextWidth(SE, badge));
      expect(size).toBeGreaterThanOrEqual(10);
      expect(lines).toBeLessThanOrEqual(STRIP.maxLines);
    }
    // an ordinary line is one line at the largest font
    expect(stripFont('Served 41/min · Missed 7/min', stripTextWidth(SE, true))).toEqual({ size: STRIP.fonts[0], lines: 1 });
  });
  test('the fit really can fail: one very long line takes more than 2 lines (the test is not vacuous)', () => {
    expect(wrapLines('word '.repeat(40), stripTextWidth(SE, true), 10)).toBeGreaterThan(STRIP.maxLines);
  });
});

describe('the strip in Boston', () => {
  test('a managed Boston shop has its strip line and its own manager, not the home manager tables', () => {
    const g0 = G.newGame(0, 'boston');
    const g = { ...g0, shops: { ...g0.shops, 'north-end': { ...g0.shops['north-end'], built: true, managed: true } } };
    const m = stripModel(g, 'north-end', 0);
    expect(m.show).toBe(true);
    expect(m.text).toMatch(/^Served \d+\/min · Missed \d+\/min$/);
    expect(m.manager === '' || m.manager === 'father-dom').toBe(true);
  });
});
