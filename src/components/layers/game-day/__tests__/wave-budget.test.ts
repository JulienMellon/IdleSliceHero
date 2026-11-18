/// <reference types="jest" />
// The Game Day wave's crowd budget: simulate the 45 s rush frame by frame at every footprint, with the sidewalk queues standing, and
// check in screen space that the families do not sit on each other, on the queues, or on the WELCOME mat for more than a moment.
import { GAME_DAY } from '../../../../content/layers';
import { layout, type Layout } from '../../../scene/layout';
import { kAt, P } from '../../../scene/projection';
import { WAVE, familiesFor, waveFigures, type WaveFigure } from '../gameday-model';

const FPS = 15;
const DRIVER_SLOTS = [2, 2, 3, 3, 4];

interface Box {
  x0: number;
  x1: number;
  y0: number;
  y1: number;
}
function box(x: number, y: number, scale = 1): Box {
  const [sx, sy] = P(x, y);
  const k = kAt(y) * 1.14 * scale;
  return { x0: sx - 11 * k, x1: sx + 11 * k, y0: sy - 50 * k, y1: sy };
}
const area = (b: Box) => (b.x1 - b.x0) * (b.y1 - b.y0);
function overlap(a: Box, b: Box) {
  const w = Math.min(a.x1, b.x1) - Math.max(a.x0, b.x0);
  const h = Math.min(a.y1, b.y1) - Math.max(a.y0, b.y0);
  return w > 0 && h > 0 ? (w * h) / Math.min(area(a), area(b)) : 0;
}
const figBox = (f: WaveFigure) => box(f.x, f.y, f.props.scale ?? 1);
/** The doormat's screen box, from the same corners Doormat draws (room y -8 ... -22). */
function matBox(lay: Layout): Box {
  const c = [P(lay.door.x0 + 2, -8), P(lay.door.x1 - 2, -8), P(lay.door.x1 + 1, -22), P(lay.door.x0 - 1, -22)];
  return { x0: Math.min(...c.map((p) => p[0])), x1: Math.max(...c.map((p) => p[0])), y0: Math.min(...c.map((p) => p[1])), y1: Math.max(...c.map((p) => p[1])) };
}

function* shops() {
  for (let fp = 0; fp < 5; fp++)
    for (const tables of [1, 3, 6, 8])
      yield { name: `fp${fp} t${tables}`, lay: layout(fp, Math.min(fp + 1, 6), fp === 0 ? 2 : 3, 2, tables, DRIVER_SLOTS[fp], 1) };
}

describe('Game Day wave budget', () => {
  for (const { name, lay } of shops()) {
    test(`${name}: families keep apart from each other, the queues and the mat`, () => {
      const queue = [...lay.queue, ...lay.driverQueue].map(([x, y]) => box(x, y));
      const mat = matBox(lay);
      let peak = 0;
      let worstPair = 0;
      let worstQueue = 0;
      const matFrames = new Map<string, number>();
      for (let f = 0; f <= GAME_DAY.rushSeconds * FPS; f++) {
        const t = f / FPS;
        const figs = waveFigures(lay, t, familiesFor(10_000, lay), t);
        peak = Math.max(peak, figs.length);
        const boxes = figs.map(figBox);
        for (let i = 0; i < boxes.length; i++) {
          for (let j = i + 1; j < boxes.length; j++) worstPair = Math.max(worstPair, overlap(boxes[i], boxes[j]));
          for (const q of queue) worstQueue = Math.max(worstQueue, overlap(boxes[i], q));
          // a figure that is mostly faded no longer counts as standing on the mat
          if (figs[i].props.o! > 0.5 && overlap(boxes[i], mat) > 0.2) matFrames.set(figs[i].key, (matFrames.get(figs[i].key) ?? 0) + 1);
        }
      }
      expect(peak).toBeLessThanOrEqual(2 * WAVE.maxGroups);
      expect(worstPair).toBeLessThanOrEqual(0.15);
      expect(worstQueue).toBeLessThanOrEqual(0.15);
      // a family walks across the mat on its way in (nobody stands still on it: the crowd suite's rule), and is faded before the door: it covers more than 20% of the
      // mat for no more than a second
      for (const frames of matFrames.values()) expect(frames / FPS).toBeLessThanOrEqual(1);
    });
  }
});

describe('the budget can fail', () => {
  test('two families on one spot overlap fully; a child parked on the mat is caught', () => {
    expect(overlap(box(200, -42), box(200, -42))).toBeCloseTo(1, 5);
    const lay = layout(1, 2, 2, 2, 4, 2, 1);
    expect(overlap(box(lay.door.cx, -15), matBox(lay))).toBeGreaterThan(0.2);
    expect(overlap(box(lay.door.cx, -42), box(lay.door.cx + 12, -42))).toBeGreaterThan(0.15);
  });
});
