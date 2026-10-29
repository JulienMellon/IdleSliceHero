import { canAdvance, LINE_LOCKOUT_MS, SCENE_GATE_AFTER_TAP_MS, SCENE_LOCKOUT_MS, sceneHeading, sceneMayOpen } from '../cutscene-input';

describe('cut-scene input (playtest bug 1)', () => {
  it('ignores taps right after a line or scene appears', () => {
    expect(canAdvance(100, 5000)).toBe(false); // line only just shown
    expect(canAdvance(5000, 100)).toBe(false); // scene only just opened
    expect(canAdvance(LINE_LOCKOUT_MS, SCENE_LOCKOUT_MS)).toBe(true);
  });
  it('a 5 taps/s player cannot skip a 7-line scene in under 3 s', () => {
    // taps every 200 ms; each accepted tap restarts the line clock
    let lineShown = 0;
    let lines = 0;
    for (let t = 0; t <= 3000; t += 200) {
      if (canAdvance(t - lineShown, t)) {
        lines++;
        lineShown = t;
      }
    }
    expect(lines).toBeLessThan(5);
  });
  it('holds a new scene until kitchen taps have stopped', () => {
    expect(sceneMayOpen(1000, 900)).toBe(false);
    expect(sceneMayOpen(1000 + SCENE_GATE_AFTER_TAP_MS, 1000)).toBe(true);
    expect(sceneMayOpen(5000, 0)).toBe(true);
  });
});

describe('scene heading (playtest bug 3)', () => {
  const scene = { title: 'Brother Sal', neighborhood: 'industrial', beat: 4, panels: [1, 2, 3] } as never;
  it('hides a spoiler title until the last panel', () => {
    expect(sceneHeading(scene, 0, false)).toBe('Industrial · Part 4');
    expect(sceneHeading(scene, 1, false)).toBe('Industrial · Part 4');
    expect(sceneHeading(scene, 2, false)).toBe('Brother Sal');
    expect(sceneHeading(scene, 0, true)).toBe('Brother Sal');
  });
});
