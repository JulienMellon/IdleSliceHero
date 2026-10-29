// Pure figure and oven geometry, split out of people.tsx / props.tsx so node tests can check it (A9):
// the flame stays inside its window or mouth (T14) and the limbs' hip height follows the body's (T15).
import type { Layout } from './layout';
import type { Act, Kind } from './looks';
import { D, P, kAt } from './projection';
import { bobFor } from './quantise';

// ---------- people ----------
export const isWorker = (kind: Kind) => kind === 'cook' || kind === 'baker' || kind === 'staff' || kind === 'driver';

/** Height of a figure's hip/shoulder line above its feet, at rest (no walk bob); `tall` is the look's height tweak. */
export const bodyBy = (kind: Kind, tall: number) => (kind === 'sit' ? -21 : -30 - tall);

export interface LimbGeomInput {
  kind: Kind;
  act: Act;
  carry: boolean;
  carryWalk: boolean;
  step: number;
  arm: number;
  tall: number;
}

/** Limb geometry from the pose: hip/shoulder height (with walk bob), hand positions and stride. */
export function limbGeom({ kind, act, carry, carryWalk, step, arm, tall }: LimbGeomInput) {
  const pin = act === 'pin';
  const sitting = kind === 'sit';
  const worker = isWorker(kind);
  const walking = step !== 0 && !sitting;
  const sw = walking ? Math.sin(step) : 0;
  // the body is drawn at bodyBy() and lifted by the bob, so the limbs' hip must be exactly that (T15)
  const by = bodyBy(kind, tall) - bobFor(kind, step);
  const hy = by - 9;
  // front-arm hand position: working (arm), carrying, eating, or swinging
  const hand: [number, number] = carry
    ? carryWalk
      ? [5, by + 10]
      : [12, by + 8]
    : sitting
      ? act === 'slice'
        ? [7.5, hy + 5.5]
        : act === 'cup'
          ? [10.5, by + 6.5]
          : [12 + arm, by + 9 - arm]
      : act === 'toss'
        ? [5, hy - 14 - arm]
        : act === 'ladle'
          ? [10, by + 11 - arm]
          : pin
            ? [6 + arm, by + 13 - arm * 1.2]
            : worker && arm > 0
              ? [10 + arm, by + 13 - arm * 2]
              : [9 + sw * 2.5, by + 16];
  // a walking carrier holds the box centred in front, both hands on it
  const bx = carryWalk ? 10 : 3;
  const backHand: [number, number] = carry && carryWalk ? [-4, by + 10] : pin ? [hand[0] - 9, hand[1]] : sitting ? (act === 'lean' ? [-12, by + 3] : [-7, by + 15]) : [-8.5 - sw * 2.5, by + 15.5];
  return { pin, sitting, walking, sw, by, hand, bx, backHand, peel: kind === 'baker' };
}

// ---------- ovens ----------
export type OvenSpec = Layout['ovens'][number];

/** Stacked decks and the Stone grade are box ovens; single decks are domes. */
export const isBoxOven = (o: OvenSpec, grade: number) => o.h < 70 || grade === 1;

/** An oven's front face in screen units: left/right x, base y, centre x, depth scale, top y. */
export function ovenFrame(o: OvenSpec) {
  const y = D - 6;
  const [ax, ay] = P(o.x0, y, o.z);
  const [bx] = P(o.x1, y, o.z);
  const k = kAt(y);
  return { ax, ay, bx, w: bx - ax, cx: (ax + bx) / 2, k, top: ay - o.h * k };
}

/** A box deck oven's body and its glowing door window. */
export function boxOvenGeom(o: OvenSpec) {
  const { ay, w, k, top } = ovenFrame(o);
  const legs = o.z === 0 ? 10 * k : 0;
  const bTop = top;
  const bBot = ay - legs;
  const bh = bBot - bTop;
  const dw = w * 0.74;
  const dh = bh * 0.42;
  const dy = bTop + bh * 0.4;
  return { legs, bTop, bBot, bh, dw, dh, dy };
}

/** A domed oven: brick plinth, arch shoulder and the arched mouth. */
export function domeGeom(o: OvenSpec) {
  const { ay, w, k, top } = ovenFrame(o);
  const plinth = 12 * k;
  const pTop = ay - plinth;
  const ry = Math.min(w * 0.5, (pTop - top) * 0.78);
  const shoulder = top + ry;
  const mw = w * 0.56;
  const mh = Math.min((pTop - top) * 0.5, mw * 0.9);
  return { plinth, pTop, ry, shoulder, mw, mh, mTop: pTop - mh };
}

/** Where an oven's flame sits (screen units): box ovens show it in the door window, domes in the mouth. */
export function flameBox(o: OvenSpec, grade: number) {
  const { cx } = ovenFrame(o);
  if (isBoxOven(o, grade)) {
    const { dw, dh, dy } = boxOvenGeom(o);
    return { mx: cx, my: dy + dh - 3, mw: dw - 6, mh: dh - 6 };
  }
  const { pTop, mw, mh } = domeGeom(o);
  return { mx: cx, my: pTop - 1, mw, mh };
}

/** The opening the flame must stay in: the door window of a box oven, the arched mouth of a dome. */
export function ovenOpening(o: OvenSpec, grade: number) {
  const { cx } = ovenFrame(o);
  if (isBoxOven(o, grade)) {
    const { dw, dh, dy } = boxOvenGeom(o);
    return { x0: cx - dw / 2 + 3, x1: cx + dw / 2 - 3, y0: dy + 3, y1: dy + dh - 3 };
  }
  const { pTop, mw, mTop } = domeGeom(o);
  return { x0: cx - mw / 2, x1: cx + mw / 2, y0: mTop, y1: pTop };
}
