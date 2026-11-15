/// <reference types="jest" />
import { cashWidth } from '../endgame/fit-model';
import {
  type Axis,
  axisPasses,
  BUTTON_H,
  CLOSE_SLOP,
  controlPasses,
  DRAWER_HEAD,
  GOAL_BAR_H,
  GOAL_TAP_H,
  GOAL_TAP_ROOM,
  HUD_BUTTON_SLOP,
  HUD_GAP,
  HUD_ICON,
  HUD_PAD,
  HUD_ROW_H,
  HUD_STACK,
  hudRow,
  IDLE_STACK_GAP,
  MIN_DRAWN,
  MIN_HIT,
  reach,
  SIDEWALK_ROW,
  SIDEWALK_SLOP,
  STATION_CARD,
  TAP,
  hitSize,
} from '../tap-targets';

describe('tap targets', () => {
  test('every control reaches 44 pt', () => {
    expect(TAP.min).toBe(44);
    for (const [name, c] of Object.entries(TAP.controls)) expect([name, hitSize(c) >= TAP.min]).toEqual([name, true]);
  });
  test("a hit margin never reaches outside its parent (iOS doesn't deliver those touches) (T33)", () => {
    for (const [name, c] of Object.entries(TAP.controls)) {
      expect([name, c.slopTop <= c.roomTop]).toEqual([name, true]);
      expect([name, c.slopBottom <= c.roomBottom]).toEqual([name, true]);
    }
    expect(CLOSE_SLOP.left).toBeLessThanOrEqual(DRAWER_HEAD.padX);
    expect(CLOSE_SLOP.right).toBeLessThanOrEqual(DRAWER_HEAD.padX);
  });
  test('the sidewalk buttons are drawn at 44 pt, with no margin reaching into the scene (T34)', () => {
    expect(TAP.controls.compactButton.height).toBe(BUTTON_H);
    expect(TAP.controls.compactButton.slopTop + TAP.controls.compactButton.slopBottom).toBe(0);
  });
  test('row geometry is derived from the style constants (T36)', () => {
    expect(SIDEWALK_ROW.cardHeight).toBe(44 + 2 * (STATION_CARD.border + STATION_CARD.padding));
    expect(SIDEWALK_ROW.idleStackHeight).toBe(2 * BUTTON_H + IDLE_STACK_GAP);
    expect(TAP.controls.closeButton.roomTop).toBe(DRAWER_HEAD.padTop);
    expect(TAP.controls.closeButton.roomBottom).toBe(DRAWER_HEAD.padBottom);
  });
});

const axis = (drawn: number, slopBefore: number, slopAfter: number, roomBefore: number, roomAfter: number): Axis => ({ drawn, slopBefore, slopAfter, roomBefore, roomAfter });

describe('the rule (U5): 44 pt drawn, or 40 pt drawn and a slop that reaches 44 pt inside the parent', () => {
  test('the numbers', () => {
    expect(MIN_DRAWN).toBe(40);
    expect(MIN_HIT).toBe(44);
  });
  test('44 pt drawn passes with no slop; 40 pt needs 4 pt of slop the parent owns; under 40 never passes', () => {
    expect(axisPasses(axis(44, 0, 0, 0, 0))).toBe(true);
    expect(axisPasses(axis(40, 0, 0, 10, 10))).toBe(false);
    expect(axisPasses(axis(40, 2, 2, 2, 2))).toBe(true);
    expect(axisPasses(axis(40, 4, 0, 4, 0))).toBe(true);
    // the slop reaches outside what the parent owns: iOS never delivers that touch
    expect(axisPasses(axis(40, 4, 0, 3, 0))).toBe(false);
    expect(axisPasses(axis(40, 2, 2, 0, 4))).toBe(false);
    // 39 and 36 pt drawn fail however large the slop
    expect(axisPasses(axis(39, 5, 5, 9, 9))).toBe(false);
    expect(axisPasses(axis(36, 4, 4, 4, 4))).toBe(false);
  });
  test('reach counts only the slop the parent lets through', () => {
    expect(reach(axis(40, 4, 4, 2, 4))).toBe(46);
    expect(controlPasses(axis(44, 0, 0, 0, 0), axis(40, 2, 2, 2, 2))).toBe(true);
    expect(controlPasses(axis(44, 0, 0, 0, 0), axis(40, 0, 0, 2, 2))).toBe(false);
  });
});

describe('the HUD top row: five round buttons of 40 pt, each reaching 44 pt inside the row', () => {
  const FULL = { tasks: true, gift: true, topChips: 1 };
  const BEFORE_REWARDS = { tasks: false, gift: false, topChips: 0 };
  const widths = [393, 375, 320];

  test('the row is built from the StyleSheet\u2019s own constants: 40 pt buttons, a 6 pt gap, 12 pt of padding, at least 48 pt tall', () => {
    expect([HUD_ICON, HUD_GAP, HUD_PAD, HUD_ROW_H]).toEqual([40, 6, 12, 48]);
    // 40 pt drawn needs 4 pt of room above and below inside the row
    expect((HUD_ROW_H - HUD_ICON) / 2).toBeGreaterThanOrEqual(HUD_BUTTON_SLOP.city.top);
  });

  test.each(widths)('at %i pt every button reaches 44 pt in both directions, using only the row\u2019s own space', (screen) => {
    for (const mode of [FULL, BEFORE_REWARDS]) {
      const row = hudRow(screen, mode);
      expect(row.buttons.map((b) => b.key)).toEqual(mode === FULL ? ['scrapbook', 'tasks', 'gift', 'shop', 'city'] : ['scrapbook', 'city']);
      for (const b of row.buttons) {
        const x = axis(b.width, b.slop.left, b.slop.right, b.x, row.rowW - (b.x + b.width));
        const y = axis(HUD_ICON, b.slop.top, b.slop.bottom, (row.rowH - HUD_ICON) / 2, (row.rowH - HUD_ICON) / 2);
        expect([screen, b.key, axisPasses(x), reach(x) >= 44]).toEqual([screen, b.key, true, true]);
        expect([screen, b.key, axisPasses(y), reach(y) >= 44]).toEqual([screen, b.key, true, true]);
      }
    }
  });

  test.each(widths)('at %i pt two neighbours\u2019 slops never overlap by more than the gap between them allows (they sum to at most the gap)', (screen) => {
    const row = hudRow(screen, FULL);
    for (let i = 1; i < row.buttons.length; i++) {
      const a = row.buttons[i - 1];
      const b = row.buttons[i];
      const between = b.x - (a.x + a.width);
      expect([a.key, b.key, a.slop.right + b.slop.left <= between]).toEqual([a.key, b.key, true]);
    }
    // the book is the row's left end and the map its right end: no slop outside the row
    expect(row.buttons[0].slop.left).toBe(0);
    expect(row.buttons[row.buttons.length - 1].slop.right).toBe(0);
    // the cash pill sits between two buttons and is wider than the slops that reach into it
    expect(row.cash.width).toBeGreaterThan(HUD_BUTTON_SLOP.tasks.right + HUD_BUTTON_SLOP.gift.left);
  });

  test('the row adds up: padding, buttons, gaps and the cash pill fill the screen; and it is the width fit-model gives the cash (G101)', () => {
    for (const screen of widths) {
      for (const mode of [FULL, BEFORE_REWARDS]) {
        const row = hudRow(screen, mode);
        expect(row.cash.width).toBe(cashWidth(screen, mode));
        const last = row.buttons[row.buttons.length - 1];
        expect(last.x + last.width).toBe(row.rowW);
      }
    }
    // the cash is the most important number on the screen: five buttons leave it 139 pt at 393 (G101), and the slops took none of it
    expect(hudRow(393, FULL).cash.width).toBeGreaterThanOrEqual(139);
  });
});

describe('the sidewalk row\u2019s end buttons: ×1 / ×10 / MAX (40 pt) and All (42 pt)', () => {
  const R = SIDEWALK_ROW;
  test('both reach 44 pt in width using only the row\u2019s own 5 pt gaps, and are the row\u2019s full height', () => {
    // the amount chip is the row's left end (nothing owned to its left) with the first card's gap on its right
    const amount = axis(R.amountWidth, SIDEWALK_SLOP.amount.left, SIDEWALK_SLOP.amount.right, 0, R.gap);
    // All is the right end: the gap before it is the room
    const all = axis(R.allWidth, SIDEWALK_SLOP.all.left, SIDEWALK_SLOP.all.right, R.gap, 0);
    expect(controlPasses(amount, axis(R.cardHeight, 0, 0, 0, 0))).toBe(true);
    expect(controlPasses(all, axis(R.cardHeight, 0, 0, 0, 0))).toBe(true);
    expect(reach(amount)).toBe(44);
    expect(reach(all)).toBe(44);
    // the idle shop's All is 44 pt tall (BUTTON_H), also drawn
    expect(axisPasses(axis(BUTTON_H, 0, 0, 0, 0))).toBe(true);
  });
  test('a card between them is never reached by their slops', () => {
    // two buttons with a card between: the slop is inside a gap and the card has none
    expect(SIDEWALK_SLOP.amount.right).toBeLessThanOrEqual(R.gap);
    expect(SIDEWALK_SLOP.all.left).toBeLessThanOrEqual(R.gap);
  });
});

describe('the goal bar: a 30 pt bar inside a 44 pt button', () => {
  test('the button is drawn 44 pt and its row takes the extra space back from what the HUD owns', () => {
    expect(GOAL_BAR_H).toBe(30);
    expect(GOAL_TAP_H).toBe(44);
    expect(axisPasses(axis(GOAL_TAP_H, 0, 0, 0, 0))).toBe(true);
    // the row's negative margin pulls the button's 7 pt into the HUD's 8 pt gap above and its 10 pt of padding below
    expect(GOAL_TAP_ROOM).toBeLessThanOrEqual(HUD_STACK.gap);
    expect(GOAL_TAP_ROOM).toBeLessThanOrEqual(HUD_STACK.padBottom);
    expect(GOAL_TAP_H - 2 * GOAL_TAP_ROOM).toBe(GOAL_BAR_H);
  });
});
