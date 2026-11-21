import {
  makeTargetRef,
  parseRectsKey,
  rectsKey,
  registerTarget,
  remeasureTargets,
  resetTargets,
  subscribeTargets,
  targetRect,
  type Measurable,
} from '../targets';

/** A node that answers `measureInWindow` with whatever `at` holds now. */
const node = (at: { x: number; y: number; w: number; h: number }): Measurable => ({
  measureInWindow: (cb) => cb(at.x, at.y, at.w, at.h),
});

beforeEach(resetTargets);

describe('the registry', () => {
  test('a registered rect is read back (rounded to half a point); null removes it', () => {
    registerTarget('hud:cash', { x0: 10.2, y0: 20, x1: 110, y1: 60.7 });
    expect(targetRect('hud:cash')).toEqual({ x0: 10, y0: 20, x1: 110, y1: 60.5 });
    registerTarget('hud:cash', null);
    expect(targetRect('hud:cash')).toBeNull();
  });

  test('a subscriber hears only a change of its own target', () => {
    const cash = jest.fn();
    const goal = jest.fn();
    subscribeTargets(['hud:cash'], cash);
    subscribeTargets(['hud:goal'], goal);
    registerTarget('hud:cash', { x0: 0, y0: 0, x1: 10, y1: 10 });
    expect(cash).toHaveBeenCalledTimes(1);
    expect(goal).not.toHaveBeenCalled();
    // the same rect again, and a sub-half-point wobble, wake nobody
    registerTarget('hud:cash', { x0: 0, y0: 0, x1: 10, y1: 10 });
    registerTarget('hud:cash', { x0: 0.1, y0: 0, x1: 10.1, y1: 10 });
    expect(cash).toHaveBeenCalledTimes(1);
    registerTarget('hud:cash', { x0: 0, y0: 0, x1: 12, y1: 10 });
    expect(cash).toHaveBeenCalledTimes(2);
    registerTarget('hud:cash', null);
    registerTarget('hud:cash', null);
    expect(cash).toHaveBeenCalledTimes(3);
  });

  test('unsubscribe stops the calls', () => {
    const fn = jest.fn();
    const off = subscribeTargets(['walk:all'], fn);
    off();
    registerTarget('walk:all', { x0: 0, y0: 0, x1: 1, y1: 1 });
    expect(fn).not.toHaveBeenCalled();
  });

  test('rectsKey is "?" while any target is missing and round-trips otherwise', () => {
    expect(rectsKey([])).toBe('');
    expect(parseRectsKey('')).toEqual([]);
    registerTarget('station:prep', { x0: 1, y0: 2, x1: 3, y1: 4 });
    expect(rectsKey(['station:prep', 'dial:prep'])).toBe('?');
    expect(parseRectsKey('?')).toBeNull();
    registerTarget('dial:prep', { x0: 5, y0: 6, x1: 7, y1: 8.5 });
    const key = rectsKey(['station:prep', 'dial:prep']);
    expect(parseRectsKey(key)).toEqual([
      { x0: 1, y0: 2, x1: 3, y1: 4 },
      { x0: 5, y0: 6, x1: 7, y1: 8.5 },
    ]);
  });
});

describe('the ref callback', () => {
  test('measures when the node attaches, again on layout and remeasure, and unregisters on unmount', () => {
    const at = { x: 10, y: 20, w: 100, h: 40 };
    const ref = makeTargetRef('hud:goal');
    ref(node(at));
    expect(targetRect('hud:goal')).toEqual({ x0: 10, y0: 20, x1: 110, y1: 60 });
    at.x = 30;
    ref.onLayout();
    expect(targetRect('hud:goal')?.x0).toBe(30);
    at.y = 50;
    remeasureTargets(['hud:goal']);
    expect(targetRect('hud:goal')?.y0).toBe(50);
    remeasureTargets();
    ref(null);
    expect(targetRect('hud:goal')).toBeNull();
    // gone: a layout event after unmount registers nothing
    ref.onLayout();
    expect(targetRect('hud:goal')).toBeNull();
  });

  test('a node with no size is not a target', () => {
    makeTargetRef('hud:cash')(node({ x: 0, y: 0, w: 0, h: 0 }));
    expect(targetRect('hud:cash')).toBeNull();
  });

  test('an old ref unmounting after a new one took the id leaves the new one registered', () => {
    const old = makeTargetRef('walk:ovens');
    const next = makeTargetRef('walk:ovens');
    old(node({ x: 0, y: 0, w: 10, h: 10 }));
    next(node({ x: 50, y: 50, w: 10, h: 10 }));
    old(null);
    expect(targetRect('walk:ovens')).toEqual({ x0: 50, y0: 50, x1: 60, y1: 60 });
  });
});
