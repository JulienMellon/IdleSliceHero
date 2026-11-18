/// <reference types="jest" />
// Budgets for the notices of card S2b: every headline fits one line and every pill stays on screen, on a 320 pt phone and a 393 pt one.
import { money } from '../../../../engine/format';
import { moment, arrival, targetChip } from '../../stars/critic-model';
import { COPY as INDUSTRIAL } from '../copy';
import { pillBox, jamLabel } from '../jam-model';
import { whistle } from '../shift-model';

const EM = 0.6; // endgame/fit-model FIT_EM: bold, errs wide
const SIDE = 8;
/** The notice's headline line: the screen, the stack's side margins, the notice's padding and border. */
const headlineWidth = (screenW: number) => screenW - 2 * SIDE - 2 * 12 - 4;

describe('the notices fit one line (13 pt headline)', () => {
  const lines = (): string[] => {
    const out = [arrival().text, whistle('day')!.text, whistle('swing')!.text, whistle('night')!.text];
    // the widest cash a critic could pay: money() tops out near $999.99T
    for (const cash of [0, 123, 1234, 12_345_678, 999.99e12]) {
      for (const hit of [true, false]) out.push(moment({ target: 4, stars: 5, hit, cash: hit ? cash : 0 }).headline);
    }
    return out;
  };
  it.each([320, 393])('on a %i pt screen', (w) => {
    for (const l of lines()) expect(l.length * 13 * EM).toBeLessThanOrEqual(headlineWidth(w));
  });
  it('writes money the way the HUD does', () => {
    expect(money(999.99e12).length).toBeLessThanOrEqual(8);
  });
});

describe('a pill stays on the screen', () => {
  it.each([320, 393])('whatever its centre, on a %i pt screen', (w) => {
    for (const text of [INDUSTRIAL['layer.industrial.jam.alert'], 'Head Baker fixing… 30s', targetChip(5)]) {
      for (const cx of [-50, 0, 30, w / 2, w - 30, w, w + 80]) {
        const b = pillBox(w, cx, text);
        expect(b.left).toBeGreaterThanOrEqual(8);
        expect(b.left + b.width).toBeLessThanOrEqual(w - 8);
        // 10 pt text fits the box
        expect(text.length * 10 * 0.55).toBeLessThanOrEqual(b.width - 8);
      }
    }
  });
  // D512: in a wide shop that is scrolled, the pill slides inside the part on screen (12 pt in), not inside the whole drawing
  it.each([0, 150, 247])('stays inside the part of a 640 pt shop on screen at scroll %i', (scroll) => {
    const view = { x0: scroll + 12, x1: scroll + 393 - 12 };
    for (const text of [INDUSTRIAL['layer.industrial.jam.alert'], 'Head Baker fixing… 30s']) {
      for (const cx of [0, 60, scroll + 5, scroll + 196, scroll + 390, 600, 700]) {
        const b = pillBox(640, cx, text, 8, view);
        expect(b.left).toBeGreaterThanOrEqual(view.x0);
        expect(b.left + b.width).toBeLessThanOrEqual(view.x1);
        // the old box, centred on cx inside the whole drawing, left the screen for a centre near its edge
      }
    }
    expect(pillBox(640, scroll + 393, 'Oven jammed! Tap the wrench.', 8).left + 200).toBeGreaterThan(scroll + 393 - 12);
  });
  it('says "Head Baker fixing…" with a count, and the alert without one', () => {
    expect(jamLabel({ jammed: true, autoFixIn: 7 })).toBe('Head Baker fixing… 7s');
    expect(jamLabel({ jammed: true, autoFixIn: null })).toBe('Oven jammed! Tap the wrench.');
  });
});
