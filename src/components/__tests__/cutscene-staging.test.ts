/// <reference types="jest" />
import { CHEST_BOX, FACE_BOX, LISTENER_SCALE, POSE, boxInPanel, panelSize, stageLayout, tailShare } from '../cutscene/staging';

// iPhone SE, 13 mini, 15, 15 Pro Max, iPad mini portrait, a landscape-ish web window
const WINDOWS: [number, number, number][] = [
  [320, 568, 20],
  [375, 812, 47],
  [393, 852, 59],
  [430, 932, 59],
  [744, 1133, 24],
  [900, 600, 0],
];

describe('cut-scene staging', () => {
  test('one figure is centred and about half the panel tall', () => {
    for (const [ww, wh, top] of WINDOWS) {
      const { innerW, innerH } = panelSize(ww, wh, top);
      const [p] = stageLayout(1, innerW, innerH, 0);
      expect(p.cx).toBeCloseTo(innerW / 2);
      expect(p.height / innerH).toBeGreaterThanOrEqual(0.48);
      expect(p.height / innerH).toBeLessThanOrEqual(0.52);
      expect(p.scale).toBe(1);
      expect(p.dim).toBe(false);
    }
  });

  test('two figures stand at 30 % and 70 %, facing each other, the speaker in front', () => {
    const { innerW, innerH } = panelSize(393, 852, 59);
    const [a, b] = stageLayout(2, innerW, innerH, 1);
    expect(a.cx / innerW).toBeCloseTo(0.3);
    expect(b.cx / innerW).toBeCloseTo(0.7);
    expect([a.flip, b.flip]).toEqual([false, true]);
    expect([a.scale, b.scale]).toEqual([LISTENER_SCALE, 1]);
    expect([a.dim, b.dim]).toEqual([true, false]);
    expect(b.z).toBeGreaterThan(a.z);
    // nobody talking (narration over a two-shot): both at full size
    expect(stageLayout(2, innerW, innerH, -1).every((p) => p.scale === 1 && !p.dim)).toBe(true);
  });

  test('no face or chest is cropped by the panel edge or covered by the other figure, on any window', () => {
    for (const [ww, wh, top] of WINDOWS) {
      const { innerW, innerH } = panelSize(ww, wh, top);
      for (const n of [1, 2]) {
        for (const speaker of [-1, 0, 1]) {
          const cast = stageLayout(n, innerW, innerH, speaker);
          const boxes = cast.map((p) => ({ face: boxInPanel(p, FACE_BOX, innerH), chest: boxInPanel(p, CHEST_BOX, innerH) }));
          for (const { face, chest } of boxes) {
            for (const b of [face, chest]) {
              expect(b.x0).toBeGreaterThanOrEqual(0);
              expect(b.x1).toBeLessThanOrEqual(innerW);
              expect(b.y0).toBeGreaterThanOrEqual(0);
              expect(b.y1).toBeLessThanOrEqual(innerH);
            }
            // the top half of the panel is left to the backdrop: the head starts below the upper third
            expect(face.y0).toBeGreaterThan(innerH * 0.45);
          }
          if (n === 2) {
            expect(boxes[0].chest.x1).toBeLessThan(boxes[1].chest.x0);
            expect(boxes[0].face.x1).toBeLessThan(boxes[1].face.x0);
          }
        }
      }
    }
  });

  test('every mood has its own gesture', () => {
    const poses = Object.values(POSE);
    expect(new Set(poses).size).toBe(poses.length);
  });

  test('the bubble tail points at the speaker', () => {
    expect(tailShare(1, 0)).toBe(0.5);
    expect(tailShare(2, 0)).toBe(0.3);
    expect(tailShare(2, 1)).toBe(0.7);
    expect(tailShare(2, -1)).toBe(0.5);
  });
});
