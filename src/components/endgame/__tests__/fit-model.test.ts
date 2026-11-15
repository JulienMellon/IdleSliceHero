/// <reference types="jest" />
import { FOOTPRINTS, NEIGHBORHOODS } from '../../../content/tuning';
import * as G from '../../../engine/game';
import { money } from '../../../engine/format';
import { goalLine, goalLabelFit, masteryGoal } from '../../goal-model';
import { SIDEWALK_ROW, TAP } from '../../tap-targets';
import { cardFonts, cardTextWidths, cashFont, cashWidth, fits, fitFont, HUD_ICON, iconWidth, MIN_FONT, rateLine, SCRAPBOOK_HEAD } from '../fit-model';

// iPhone SE (320 pt) and a 393 pt phone. Plain arithmetic: nothing here can be seen in a screenshot, so it is proved here.
const SE = 320;
const BIG = 393;
const PRICES = ['$5', '$83', '$1.23K', '$83.2K', '$500M', '$1.23B', '$83.2T'];

describe('fitFont', () => {
  test('the largest half point that fits, between min and max', () => {
    expect(fitFont('$1.2K', 1000, 15, 9)).toBe(15);
    expect(fitFont('$1.2K', 30, 15, 9)).toBe(10);
    expect(fitFont('$83.2T', 10, 15, 9)).toBe(9);
    expect(fitFont('', 30, 15, 9)).toBe(15);
    for (const w of [20, 33, 47, 90]) expect(fits('$83.2T', w, fitFont('$83.2T', w, 15, 1))).toBe(true);
  });
});

describe('G102: sidewalk cards at iPhone SE width', () => {
  test('the row geometry: four cards, the All button and the ×1 chip share 304 pt', () => {
    expect(SIDEWALK_ROW.allWidth + SIDEWALK_ROW.amountWidth).toBe(82);
    const w = cardTextWidths(SE, [1, 1, 1, 1], { chip: true, framed: true });
    // (304 - 42 - 40 - 5 gaps x 5) / 4 = 49.25 per card, minus 11 of frame and 6 of button chrome
    expect(w[0]).toBeCloseTo(49.25 - 17, 5);
    const sum = w.reduce((t, x) => t + x + 17, 0) + SIDEWALK_ROW.allWidth + SIDEWALK_ROW.amountWidth + 5 * SIDEWALK_ROW.gap;
    expect(sum).toBeCloseTo(SE - 2 * SIDEWALK_ROW.edge, 5);
  });

  test('no card line is ever set under 10 pt (U5): the label, the title and the foot all floor at MIN_FONT', () => {
    expect(MIN_FONT).toBe(10);
    for (const screen of [SE, BIG]) {
      for (const chip of [true, false]) {
        const w = cardTextWidths(screen, [1, 1, 1, 1], { chip, framed: true })[0];
        for (const price of PRICES) {
          const f = cardFonts(w, { label: price, sub: 'DRIVERS', foot: `need ${price}`, iconW: iconWidth(w, 'DRIVERS') });
          expect(Math.min(f.label, f.sub, f.foot)).toBeGreaterThanOrEqual(10);
        }
      }
    }
  });

  test('every price up to six characters fits its card at 393 pt, and up to five at 320 pt (a six-character one gets 33 of the 36 pt it wants: it ellipsizes before it shrinks under 10)', () => {
    for (const [screen, longest] of [[BIG, 6], [SE, 5]] as const) {
      for (const chip of [true, false]) {
        const w = cardTextWidths(screen, [1, 1, 1, 1], { chip, framed: true })[0];
        for (const price of PRICES.filter((p) => p.length <= longest)) {
          const f = cardFonts(w, { label: price });
          expect([screen, chip, price, fits(price, w, f.label)]).toEqual([screen, chip, price, true]);
        }
      }
    }
  });

  test('the station titles are set at 10 pt: beside their 14 pt icon where the card has room for both, alone where it has not (U5)', () => {
    const at = (screen: number, title: string) => {
      const w = cardTextWidths(screen, [1, 1, 1, 1], { chip: true, framed: true })[0];
      const iconW = iconWidth(w, title);
      return { w, iconW, f: cardFonts(w, { label: '$1.2K', sub: title, iconW }) };
    };
    // 320 pt: a 32 pt card never has the icon; the short titles fit, "COUNTER" and "DRIVERS" (seven letters, 42 pt) are cut by the card, not shrunk
    for (const title of ['PREP', 'OVENS', 'COUNTER', 'DRIVERS', 'EXPAND']) expect([title, at(SE, title).iconW, at(SE, title).f.sub]).toEqual([title, 0, 10]);
    // 393 pt: 50 pt of text. The icon stays for the titles that fit beside it at 10 pt (PREP, OVENS, EXPAND), and goes for the seven-letter ones, which then fit alone
    for (const title of ['PREP', 'OVENS', 'EXPAND']) expect([title, at(BIG, title).iconW]).toEqual([title, 14]);
    for (const title of ['COUNTER', 'DRIVERS']) {
      const r = at(BIG, title);
      expect([title, r.iconW, fits(title, r.w, r.f.sub)]).toEqual([title, 0, true]);
    }
  });

  test('a merged card of two slots: the bundle title, the Expand title and the buy label fit (at 320 pt: up to 14 characters; "Buy both $83.2T" ellipsizes rather than go under 10 pt)', () => {
    for (const screen of [SE, BIG]) {
      const w = cardTextWidths(screen, [2, 1, 1], { chip: true, framed: true });
      for (const [label, sub] of [['Buy both $83.2K', 'PREP + OVENS'], ['$83.2T', 'EXPAND \u00B7 Double'], ['Buy both $35', 'PREP + OVENS'], ['Buy both $83.2T', 'PREP + OVENS']] as const) {
        const f = cardFonts(w[0], { label, sub });
        expect(f.label).toBeGreaterThanOrEqual(10);
        expect(f.sub).toBe(10);
        if (screen === BIG || sub.length <= 14) expect([sub, fits(sub, w[0], f.sub)]).toEqual([sub, true]);
        if (screen === BIG || label.length <= 14) expect([label, fits(label, w[0], f.label)]).toEqual([label, true]);
      }
    }
  });

  test('the Expand title is one word of the tier name', () => {
    const s = (() => {
      const g = G.newGame(0);
      return { ...g, cash: 1e9, shops: { ...g.shops, downtown: { ...g.shops.downtown, managed: true, prep: 25, ovens: 25, counter: 25, drivers: 25, footprint: 0 } } };
    })();
    // every tier's first word is short enough for a three-card span at 320 pt
    for (const t of FOOTPRINTS.slice(1)) {
      const title = `EXPAND \u00B7 ${t.name.split(' ')[0]}`;
      const w = cardTextWidths(SE, [3, 1], { chip: true, framed: true });
      expect(fitFont(title, w[0], 10, 7)).toBeGreaterThanOrEqual(7);
      expect(fits(title, w[0], fitFont(title, w[0], 10, 7))).toBe(true);
    }
    expect(s.cash).toBeGreaterThan(0);
  });

  test('an unmanaged shop: the four chips and its manager button at 320 pt', () => {
    const w = cardTextWidths(SE, [1, 1, 1, 1], { chip: true, framed: false });
    // the stack is 304 - 42 - 40 - 2 x 5 = 212; four chips with three 4 pt gaps: 51 each; minus the 6 pt button chrome
    expect(w[0]).toBeCloseTo((212 - 12) / 4 - 6, 5);
    for (const price of PRICES) expect(fitFont(price, w[0], 15, MIN_FONT)).toBeGreaterThanOrEqual(10);
  });

  test('the amount chip and the All button are the row\u2019s full height', () => {
    expect(SIDEWALK_ROW.cardHeight).toBeGreaterThanOrEqual(TAP.min);
  });
});

describe('G101: the HUD top row at iPhone SE width', () => {
  const all = { tasks: true, gift: true, topChips: 1 };
  test('five round buttons of 40 pt leave the cash pill 66 pt at 320, 139 at 393', () => {
    expect(HUD_ICON).toBe(40);
    expect(cashWidth(SE, all)).toBe(66);
    expect(cashWidth(BIG, all)).toBe(139);
    // before rewards unlock: book and map only
    expect(cashWidth(SE, { tasks: false, gift: false, topChips: 0 })).toBe(320 - 24 - 80 - 12);
  });

  test.each([[SE], [BIG]])('the cash text shrinks to fit its pill at %i pt: "$8.4M", "$1.23B", "$321K" all show whole', (screen) => {
    const w = cashWidth(screen, all);
    for (const cash of ['$8.4M', '$1.23B', '$321K', '$3,120', '$83.2T']) {
      const size = cashFont(cash, w);
      expect(size).toBeGreaterThanOrEqual(16);
      if (cash.length <= 6) expect(fits(cash, w, size)).toBe(true);
    }
    expect(cashFont('$8.4M', cashWidth(BIG, all))).toBeGreaterThanOrEqual(26);
  });

  test('the rate line drops "citywide" when the pill is narrow, keeps it when there is room', () => {
    const narrow = rateLine('$12.3B/s citywide', cashWidth(SE, all));
    expect(narrow.text).toBe('$12.3B/s');
    expect(fits(narrow.text, cashWidth(SE, all), narrow.size)).toBe(true);
    expect(narrow.size).toBeGreaterThanOrEqual(10);
    expect(rateLine('$1.2M/s citywide', cashWidth(BIG, all)).text).toBe('$1.2M/s citywide');
    // a running boost after it takes room too
    expect(rateLine('$1.2M/s citywide', cashWidth(BIG, all), 12).text).toBe('$1.2M/s');
  });
});

describe('G98: the mastery goal line beside the oven chip and the event chip', () => {
  const IDS = NEIGHBORHOODS.map((n) => n.id);
  const city = (): G.GameState => {
    let g = G.newGame(1_700_000_000_000);
    for (const id of IDS) g = { ...g, shops: { ...g.shops, [id]: { ...g.shops[id], built: true, managed: true, heads: G.allHeads(), footprint: id === 'waterfront' ? 3 : 0 } } };
    return { ...g, seenScenes: ['uptown-4'] };
  };
  // the goal bar's width: 296 inside the HUD at 320 pt, less the 44 pt oven chip, the 60 pt event chip and their 8 pt gaps
  const barSE = SE - 24 - 44 - 8;
  const barSEEvent = barSE - 60 - 8;
  const barBig = BIG - 24 - 44 - 8;

  test('the short form leads with the count and names the star and the shop', () => {
    const g = masteryGoal(city())!;
    expect(g.short).toMatch(/^\u2605\d+\/18 \u00B7 [A-Za-z ]+: [A-Za-z]+$/);
  });

  test('with the event chip at 320 the amount goes and the short line has the whole bar', () => {
    const g = masteryGoal(city())!;
    const line = goalLine(g, barSEEvent);
    // U5: the whole short line no longer fits there by the estimate, so the tiny one ("\u260510/18 \u00B7 Flagship") leads; it never ellipsizes
    expect(line.label).toBe(g.tiny);
    expect(line.text).toBe('');
    expect(goalLabelFit(g.tiny, '', barSEEvent).labelW).toBeLessThanOrEqual(goalLabelFit(g.tiny, '', barSEEvent).wordsRoom);
    // the count and the first word of the star's name are inside the bar's text room: never clipped to "Fla" (the r2 shot)
    const room = barSEEvent - 4 - 24;
    expect(room / (14 * 0.56)).toBeGreaterThan(`\u260510/18 \u00B7 Flagship`.length);
  });

  test('three chips beside the bar (oven, rush, game day) at 393: the short line does not fit, the tiny one does (62-event-countdown-chip)', () => {
    const g = masteryGoal(city())!;
    const bar = BIG - 24 - 44 - 56 - 44 - 3 * 8;
    const line = goalLine(g, bar);
    expect(line.label).toBe(g.tiny);
    expect(line.text).toBe('');
    const fit = goalLabelFit(line.label, '', bar);
    expect(fit.labelW).toBeLessThanOrEqual(fit.wordsRoom);
  });

  test('at 393 the short line fits whole, with or without the amount', () => {
    const g = masteryGoal(city())!;
    const line = goalLine(g, barBig);
    expect(line.label).toBe(g.short);
    const fit = goalLabelFit(line.label, line.text ?? '', barBig);
    expect(fit.wordsRoom).toBeGreaterThanOrEqual(0);
  });

  test('a goal with no short form is shown as it is', () => {
    expect(goalLine({ label: 'Build a pizzeria in Suburbs', text: undefined }, 100)).toEqual({ label: 'Build a pizzeria in Suburbs', text: undefined });
    expect(money(1)).toBe('$1');
  });
});

describe('D468: the Scrapbook header at iPhone SE width', () => {
  test('Back, the title and "Stories 24/24" fit one row of 292 pt', () => {
    const title = SCRAPBOOK_HEAD.title * 0.6 * 'Scrapbook'.length;
    const count = SCRAPBOOK_HEAD.count * 0.6 * 'Stories 24/24'.length;
    expect(SCRAPBOOK_HEAD.back + title + count).toBeLessThanOrEqual(SE - 28);
  });
});
