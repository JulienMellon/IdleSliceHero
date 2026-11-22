/// <reference types="jest" />
// v5.18 card V2 step 5: the off-screen cues of a wide shop, and the cold line's short queue (step 4).
import {
  askScroll,
  clearCueTop,
  CUE_EDGE,
  CUE_GAP,
  cueWord,
  wrenchRect,
  CUE_H,
  CUE_URGENCY,
  CUE_W,
  cueLabel,
  cuesFor,
  offScreen,
  onScrollAsk,
  queueShown,
  wantsOf,
  type KitchenSpot,
  type Want,
} from '../scroll-cues-model';
import { sceneView, sceneFrame, sceneToScreen } from '../scene/projection';
import { controlPasses } from '../tap-targets';
import { layout } from '../scene/layout';
import { ovenSpot, WRENCH } from '../layers/shifts/jam-model';

const W = 393;
const H = 852;
const flagship = sceneView(W, H, sceneFrame(4));
const fit = flagship.fit;
const xs: Record<KitchenSpot, number> = { prep: 90, ovens: 330, counter: 560 };
const mk = (over: Partial<Parameters<typeof wantsOf>[0]> = {}) => wantsOf({ slammed: [], jam: false, bubble: null, tap: null, xs, jamX: 380, ...over });

describe('what is off screen', () => {
  test('a place is off the left under CUE_EDGE, off the right past the width less CUE_EDGE, and on screen between', () => {
    expect(offScreen(CUE_EDGE - 1, W)).toBe('left');
    expect(offScreen(CUE_EDGE, W)).toBeNull();
    expect(offScreen(W - CUE_EDGE, W)).toBeNull();
    expect(offScreen(W - CUE_EDGE + 1, W)).toBe('right');
  });
  test('the Flagship scrolls: its content is wider than the screen; a one-screen shop never gets a cue', () => {
    expect(flagship.maxScroll).toBeGreaterThan(200);
    const one = sceneView(W, H, sceneFrame(1));
    expect(cuesFor(mk({ jam: true }), 0, W, one.fit, one.maxScroll)).toEqual({ left: null, right: null });
  });
});

describe('one cue per side, the most urgent', () => {
  const view = (scrollX: number, wants: Want[]) => cuesFor(wants, scrollX, W, fit, flagship.maxScroll);
  test("scrolled to the kitchen's left end, the counter is off the right edge and a counter with orders piling up says so", () => {
    const left = view(0, mk({ slammed: ['counter'] }));
    expect(left.left).toBeNull();
    expect(left.right).toMatchObject({ side: 'right', kind: 'piling', at: 'counter' });
    expect(sceneToScreen(560, 0, fit)).toBeGreaterThan(W);
  });
  test("the order is a jam, then a station with orders piling up, then a head's bubble, then a tap; the first off screen on a side wins", () => {
    expect(CUE_URGENCY.jam).toBeGreaterThan(CUE_URGENCY.piling);
    expect(CUE_URGENCY.piling).toBeGreaterThan(CUE_URGENCY.bubble);
    expect(CUE_URGENCY.bubble).toBeGreaterThan(CUE_URGENCY.tap);
    const all = mk({ slammed: ['counter'], jam: true, bubble: 'counter', tap: 'counter' });
    // both the jammed oven (380) and the counter (560) are off the right edge at scroll 0 in a 393 screen? the oven is at 380 * s: still on or just off
    const r = view(0, all);
    expect(r.right?.kind).toBe(sceneToScreen(380, 0, fit) > W - CUE_EDGE ? 'jam' : 'piling');
    expect(view(0, mk({ bubble: 'counter', tap: 'counter' })).right?.kind).toBe('bubble');
    expect(view(0, mk({ tap: 'counter' })).right?.kind).toBe('tap');
  });
  test('a tie goes to the nearer place; each side has its own cue', () => {
    const far = Math.round(flagship.maxScroll);
    const r = view(far, mk({ slammed: ['prep', 'ovens'], tap: 'prep' }));
    expect(r.left?.at).toBe('ovens');
    expect(r.left?.kind).toBe('piling');
    expect(r.right).toBeNull();
    const both = view(Math.round(far / 2), mk({ slammed: ['prep', 'counter'] }));
    expect([both.left?.at, both.right?.at]).toEqual(['prep', 'counter']);
  });
  test('a tap scrolls there: the place lands in the middle of the screen, inside the content', () => {
    for (const st of ['prep', 'ovens', 'counter'] as const) {
      const c = view(0, mk({ slammed: [st] })).right ?? view(flagship.maxScroll, mk({ slammed: [st] })).left;
      if (!c) continue;
      expect(c.scrollTo).toBeGreaterThanOrEqual(0);
      expect(c.scrollTo).toBeLessThanOrEqual(flagship.maxScroll);
      const sx = sceneToScreen(xs[st], c.scrollTo, fit);
      expect(sx).toBeGreaterThanOrEqual(CUE_EDGE);
      expect(sx).toBeLessThanOrEqual(W - CUE_EDGE);
      // …and once there, no cue points at it any more
      const after = cuesFor(mk({ slammed: [st] }), c.scrollTo, W, fit, flagship.maxScroll);
      expect(after.left?.at === st || after.right?.at === st).toBe(false);
    }
  });
  test('every place in the shop can be brought on screen by taps alone: every want, from every scroll position, has a cue that reaches it', () => {
    const wants = mk({ slammed: ['prep', 'ovens', 'counter'], jam: true, bubble: 'ovens', tap: 'prep' });
    for (const start of [0, flagship.maxScroll / 4, flagship.maxScroll / 2, flagship.maxScroll]) {
      let at = start;
      for (let hops = 0; hops < 6; hops++) {
        const c = cuesFor(wants, at, W, fit, flagship.maxScroll);
        if (!c.left && !c.right) break;
        at = (c.right ?? c.left)!.scrollTo;
      }
      // after the hops, every want is on screen or one cue away from it
      const c = cuesFor(wants, at, W, fit, flagship.maxScroll);
      const hidden = wants.filter((w) => offScreen(sceneToScreen(w.x, at, fit), W)).length;
      expect(hidden === 0 || !!(c.left || c.right)).toBe(true);
    }
  });
});

describe('the cue itself', () => {
  test('it is drawn 52 by 44 pt: a tap target at 44 pt both ways, with no help from a hit slop', () => {
    expect(CUE_W).toBeGreaterThanOrEqual(44);
    expect(CUE_H).toBeGreaterThanOrEqual(44);
    expect(
      controlPasses(
        { drawn: CUE_W, slopBefore: 0, slopAfter: 0, roomBefore: 0, roomAfter: 0 },
        { drawn: CUE_H, slopBefore: 0, slopAfter: 0, roomBefore: 0, roomAfter: 0 },
      ),
    ).toBe(true);
  });
  test('a screen reader hears which way, what and where', () => {
    expect(cueLabel('jam', 'ovens', 'right')).toBe('Scroll right: An oven is jammed at the ovens');
    expect(cueLabel('piling', 'prep', 'left')).toBe('Scroll left: The prep bench has orders piling up');
    expect(cueLabel('tap', 'counter', 'right')).toBe('Scroll right: The counter is ready to tap');
    const c = cuesFor(mk({ slammed: ['counter'] }), 0, W, fit, flagship.maxScroll).right!;
    expect(c.label).toBe(cueLabel('piling', 'counter', 'right'));
    expect(c.word.length).toBeLessThanOrEqual(7);
  });
});

describe('a tap on a lamp of the shop report scrolls the shop (the bus)', () => {
  test('askScroll reaches the listener until it unsubscribes', () => {
    const seen: string[] = [];
    const off = onScrollAsk((t) => seen.push(t));
    askScroll('ovens');
    askScroll('floor');
    off();
    askScroll('counter');
    expect(seen).toEqual(['ovens', 'floor']);
  });
});

describe('the cold line (card V2 step 4)', () => {
  test('the street draws queueShare of its line while cold: a quarter-step down, never fewer than one while anyone waits, never more than the line', () => {
    expect(queueShown(8, 1)).toBe(8);
    expect(queueShown(8, 0.5)).toBe(4);
    expect(queueShown(3, 0.5)).toBe(1);
    expect(queueShown(1, 0.4)).toBe(1);
    expect(queueShown(0, 0.4)).toBe(0);
    for (let n = 0; n < 40; n++) for (const share of [0.25, 0.4, 0.5, 0.75, 1]) expect(queueShown(n, share)).toBeLessThanOrEqual(n);
    // the check can fail: drawing the whole line while the report says cold would show more than the share
    expect(queueShown(10, 0.4)).toBeLessThan(10);
  });
});

describe('G111: a cue keeps 8 pt clear of the tappables on screen', () => {
  // shot 145: the mirrored Industrial Flagship at scroll 0, the jam's wrench on its oven, the right cue at the default top
  const lay = layout(4, 6, 3, 2, 6, 4, 0, undefined, true);
  const o = ovenSpot(lay);
  const wrench = wrenchRect(fit.ox + o.x * fit.s, fit.oy + o.y * fit.s, WRENCH, 0);
  const H_VIEW = 560;
  const defaultTop = Math.round(wrench.y0 + 4);
  const overlaps = (side: 'left' | 'right', top: number, r: typeof wrench, gap: number) => {
    const x0 = side === 'left' ? 0 : W - CUE_W;
    return x0 < r.x1 + gap && x0 + CUE_W > r.x0 - gap && top < r.y1 + gap && top + CUE_H > r.y0 - gap;
  };
  test('the setup is the bug: at its default top the right cue sits on the wrench', () => {
    expect(overlaps('right', defaultTop, wrench, 0)).toBe(true);
  });
  test('the cue slides to a place 8 pt clear of the wrench, inside the view, and the wrench stays whole on screen', () => {
    const top = clearCueTop('right', defaultTop, W, H_VIEW, [wrench]);
    expect(overlaps('right', top, wrench, CUE_GAP)).toBe(false);
    expect(top).toBeGreaterThanOrEqual(0);
    expect(top + CUE_H).toBeLessThanOrEqual(H_VIEW);
  });
  test('a free cue stays where it is; the other side is not moved by a wrench it does not meet', () => {
    expect(clearCueTop('right', 10, W, H_VIEW, [{ x0: 100, y0: 200, x1: 144, y1: 244 }])).toBe(10);
    expect(clearCueTop('left', defaultTop, W, H_VIEW, [wrench])).toBe(defaultTop);
  });
  test('with no room anywhere it keeps the asked-for top', () => {
    expect(clearCueTop('right', 40, W, 60, [{ x0: W - 60, y0: 0, x1: W, y1: 60 }])).toBe(40);
  });
  test('the word names the station, 7 letters at most', () => {
    expect([cueWord('piling', 'ovens'), cueWord('tap', 'prep'), cueWord('bubble', 'counter'), cueWord('jam', 'ovens')]).toEqual([
      'Ovens',
      'Prep',
      'Counter',
      'Jam!',
    ]);
    for (const k of ['jam', 'piling', 'bubble', 'tap'] as const)
      for (const at of ['prep', 'ovens', 'counter', 'floor', 'door'] as const) expect(cueWord(k, at).length).toBeLessThanOrEqual(7);
  });
});
