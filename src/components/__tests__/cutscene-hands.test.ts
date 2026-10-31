/// <reference types="jest" />
// T76 (C101, D392): the hands. The staging boxes match the art, every pair of poses stood side by side keeps its hands and arms
// 8 pt clear of each other and of the other figure, nothing is cropped by the panel edge, and the gestures are distinct.
import { CHEST_BOX, FACE_BOX, HANDS_BOX, LIMBS_BOX, LIMB_CLEARANCE, POSE, boxInPanel, panelSize, poseFor, stageLayout, type Box, type Pose } from '../cutscene/staging';
import { ARM_INK, FACES, GESTURES, HAIR_FRONT, BUN_KNOT, STRANDS } from '../cutscene/figure-art';
import { boundsOf, pathPoints } from './path-bounds';

// iPhone SE, 13 mini, 15, 15 Pro Max, iPad mini portrait, a landscape-ish web window
const WINDOWS: [number, number, number][] = [
  [320, 568, 20],
  [375, 812, 47],
  [393, 852, 59],
  [430, 932, 59],
  [744, 1133, 24],
  [900, 600, 0],
];
const POSES = Object.keys(GESTURES) as Pose[];

/** Gap between two boxes in px (0 when they touch or overlap). */
function gap(a: Box, b: Box) {
  const dx = Math.max(a.x0 - b.x1, b.x0 - a.x1, 0);
  const dy = Math.max(a.y0 - b.y1, b.y0 - a.y1, 0);
  return Math.hypot(dx, dy);
}

describe('T76 hands and limbs', () => {
  test('HANDS_BOX and LIMBS_BOX contain the art they describe, and are no looser than 0.2 units', () => {
    for (const pose of POSES) {
      const hands = boundsOf(GESTURES[pose].hands, 0.8); // ink outline
      const arms = boundsOf(GESTURES[pose].arms, ARM_INK / 2);
      const limbs = { x0: Math.min(hands.x0, arms.x0), y0: Math.min(hands.y0, arms.y0), x1: Math.max(hands.x1, arms.x1), y1: Math.max(hands.y1, arms.y1) };
      for (const [name, box, art] of [['hands', HANDS_BOX[pose], hands], ['limbs', LIMBS_BOX[pose], limbs]] as const) {
        expect([pose, name, box.x0 <= art.x0 + 0.05, box.x1 >= art.x1 - 0.05, box.y0 <= art.y0 + 0.05, box.y1 >= art.y1 - 0.05]).toEqual([pose, name, true, true, true, true]);
        expect(art.x0 - box.x0).toBeLessThan(0.2);
        expect(box.x1 - art.x1).toBeLessThan(0.2);
        expect(art.y0 - box.y0).toBeLessThan(0.2);
        expect(box.y1 - art.y1).toBeLessThan(0.2);
      }
    }
  });

  test('every pair of poses stood side by side keeps hands, arms and the other figure 8 pt apart, on every window and speaker', () => {
    for (const [ww, wh, top] of WINDOWS) {
      const { innerW, innerH } = panelSize(ww, wh, top);
      for (const a of POSES) {
        for (const b of POSES) {
          for (const speaker of [-1, 0, 1]) {
            const [pa, pb] = stageLayout(2, innerW, innerH, speaker, [a, b]);
            const at = (p: typeof pa, box: Box) => boxInPanel(p, box, innerH);
            const body = (p: typeof pa) => [at(p, FACE_BOX), at(p, CHEST_BOX)];
            const label = `${ww}px ${a}+${b} speaker ${speaker}`;
            // hands and arms of each figure against the other's hands/arms, head and chest
            for (const [p, q, pose, other] of [[pa, pb, a, b], [pb, pa, b, a]] as const) {
              const limbs = at(p, LIMBS_BOX[pose]);
              const hands = at(p, HANDS_BOX[pose]);
              for (const target of [at(q, LIMBS_BOX[other]), ...body(q)]) {
                expect([label, gap(limbs, target) >= LIMB_CLEARANCE - 1e-3]).toEqual([label, true]);
                expect([label, gap(hands, target) >= LIMB_CLEARANCE - 1e-3]).toEqual([label, true]);
              }
              // and nothing is cropped by the panel edge
              expect([label, limbs.x0 >= 0, limbs.x1 <= innerW, limbs.y1 <= innerH]).toEqual([label, true, true, true]);
            }
          }
        }
      }
    }
  });

  test('two surprised figures on an iPad mini panel no longer overlap palms', () => {
    const { innerW, innerH } = panelSize(744, 1133, 24);
    const [a, b] = stageLayout(2, innerW, innerH, 0, ['hands-up', 'hands-up']);
    expect(gap(boxInPanel(a, HANDS_BOX['hands-up'], innerH), boxInPanel(b, HANDS_BOX['hands-up'], innerH))).toBeGreaterThanOrEqual(LIMB_CLEARANCE - 1e-3);
  });

  test('a lone figure in any pose keeps its limbs inside the panel', () => {
    for (const [ww, wh, top] of WINDOWS) {
      const { innerW, innerH } = panelSize(ww, wh, top);
      for (const pose of POSES) {
        const [p] = stageLayout(1, innerW, innerH, 0, [pose]);
        const limbs = boxInPanel(p, LIMBS_BOX[pose], innerH);
        expect([ww, pose, limbs.x0 >= 0, limbs.x1 <= innerW, limbs.y0 >= 0, limbs.y1 <= innerH]).toEqual([ww, pose, true, true, true, true]);
      }
    }
  });

  test('D392: Nonna and Marisol do not share a worried pose; the clasp is three interlaced finger arcs, not a hash', () => {
    expect(poseFor('nonna-rosa', 'sad')).toBe('clasp');
    expect(poseFor('marisol', 'sad')).toBe('collar');
    expect(poseFor('marisol', 'happy')).toBe(POSE.happy);
    expect(GESTURES.clasp.creases.match(/M/g)).toHaveLength(3);
    expect(GESTURES.clasp.creases).not.toMatch(/[hv]/); // curves only: no straight "#" bars
    // collar: one hand up at the chest, the other hanging
    const hand = boundsOf(GESTURES.collar.hands);
    expect(hand.y0).toBeLessThan(90);
    expect(poseFor('nonna-rosa', 'neutral', 'recipe-card')).toBe('card');
  });

  test('D392: open palms have four fingers (three gaps) and a thumb', () => {
    expect(GESTURES['hands-up'].creases.match(/M/g)).toHaveLength(6); // three gaps per hand
  });
});

describe('D393 / D395 face art', () => {
  test('every strand lies inside its hair style, never on the face', () => {
    for (const style of Object.keys(STRANDS) as (keyof typeof STRANDS)[]) {
      if (!STRANDS[style]) continue;
      const hair = style === 'bald' ? [] : pathPoints(HAIR_FRONT[style as Exclude<typeof style, 'bald'>]);
      const inside = (x: number, y: number) => {
        if (style === 'bun' && Math.hypot(x - BUN_KNOT.cx, y - BUN_KNOT.cy) <= BUN_KNOT.r - 0.5) return true;
        let c = false;
        for (let i = 0, j = hair.length - 1; i < hair.length; j = i++) {
          const [xi, yi] = hair[i];
          const [xj, yj] = hair[j];
          if (yi > y !== yj > y && x < ((xj - xi) * (y - yi)) / (yj - yi) + xi) c = !c;
        }
        return c;
      };
      // sample along each stroke; a 0.7 unit halo (half the stroke) must stay inside too
      for (const [x, y] of pathPoints(STRANDS[style])) {
        for (const [dx, dy] of [[0, 0], [0.7, 0], [-0.7, 0], [0, 0.7], [0, -0.7]]) {
          expect([style, x, y, dx, dy, inside(x + dx, y + dy)]).toEqual([style, x, y, dx, dy, true]);
        }
      }
    }
  });

  test('a happy face has closed eyes (no sclera, iris or pupil), a win never reads as a stare', () => {
    expect(FACES.happy.sclera).toBe('');
    expect(FACES.happy.iris).toBe('');
    expect(FACES.happy.lids).not.toBe('');
    for (const mood of ['neutral', 'sad', 'angry', 'surprised'] as const) expect(FACES[mood].sclera).not.toBe('');
  });
});
