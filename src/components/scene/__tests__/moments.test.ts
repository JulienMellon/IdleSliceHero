/// <reference types="jest" />
// The milestone badge and the rising level chip (D415, D418): budgets against the chip row, in scene units.
import { layout } from '../layout';
import { BUBBLE_AIR, CHIP_ROW_HALF, HUD_DIM_OPACITY, HUD_DIM_SECONDS, MILE_EDGE, MILE_HAT_GAP, MILE_PILL_HIDE_S, MILE_R, MILE_SECONDS, MILE_SHIFT, ROW_AIR, STATION_LABEL, bubbleWalls, bubbleWidth, bubbleX, chipAt, hidesWaitingPill, hudOpacity, mileAnchor, mileLevelSize, mileOpacity, mileScale, mileSpeechY, mileSub, stationHatTop } from '../moments';
import { CHIP_RISE, CONFETTI, CONFETTI_N, CONFETTI_SECONDS, CONFETTI_STEPS, confettiOffset, confettiStep } from '../ladder';
import { hash32 } from '../looks';
import { SCENE_H, SCENE_W } from '../projection';
import { badgeRowY, stationRects } from '../stations';

const DRIVER_SLOTS = [2, 2, 3, 3, 4];
const STATIONS = ['prep', 'oven', 'counter'] as const;
const shops = () => [0, 1, 2, 3, 4].map((fp) => ({ fp, lay: layout(fp, Math.min(fp + 1, 6), Math.min(3, fp + 1), 2, 6, DRIVER_SLOTS[fp], 1) }));

describe('the milestone badge (D415)', () => {
  test('it is a 72 pt disc, over the station, wholly on screen and wholly below the chip row, at every footprint', () => {
    expect(MILE_R * 2).toBe(72);
    const by = badgeRowY();
    for (const { fp, lay } of shops())
      for (const scale of [1.6, 1, 0.9]) {
        const rects = stationRects(lay, 44 / scale);
        for (const st of STATIONS) {
          const { cx, cy } = mileAnchor(rects[st], by, stationHatTop(lay, st));
          expect([fp, st, cx - MILE_R >= 0, cx + MILE_R <= SCENE_W]).toEqual([fp, st, true, true]);
          expect([fp, st, cy - MILE_R >= by + CHIP_ROW_HALF + ROW_AIR - 1e-9]).toEqual([fp, st, true]);
          // D440: 20 right of the station's middle, unless that would leave the screen
          expect(cx).toBeCloseTo(Math.min(SCENE_W - MILE_R - MILE_EDGE, (rects[st].x0 + rects[st].x1) / 2 + MILE_SHIFT), 6);
        }
      }
  });
  // D429: at the milestone shot the badge sat on the cook it celebrates. Its lower edge must clear the hats by 30 pt wherever the chip row leaves room
  // (a two-cook bench's second cook stands deeper, so its hat is the tallest and the row leaves 27.6 there).
  test('D429/D440: the badge stands MILE_HAT_GAP − MILE_SHIFT above the hats of the people at the station (≥ 7 when the chip row is the limit); the old anchor sat on them', () => {
    expect(MILE_HAT_GAP).toBe(30);
    const by = badgeRowY();
    let oldCovered = 0;
    for (const { fp, lay } of shops())
      for (const st of STATIONS) {
        const rect = stationRects(lay, 44)[st];
        const hat = stationHatTop(lay, st);
        const { cy } = mileAnchor(rect, by, hat);
        const gap = hat - (cy + MILE_R);
        expect([fp, st, gap >= 27 - MILE_SHIFT]).toEqual([fp, st, true]);
        const atRowLimit = cy - MILE_SHIFT - MILE_R <= by + CHIP_ROW_HALF + ROW_AIR + 1e-9;
        expect([fp, st, atRowLimit || Math.abs(gap - (MILE_HAT_GAP - MILE_SHIFT)) < 1e-6]).toEqual([fp, st, true]);
        // the old rule centred the disc on the furniture (or just under the row): its lower edge was over the hats
        const oldCy = Math.max((rect.y0 + rect.y1) / 2, by + CHIP_ROW_HALF + ROW_AIR + MILE_R);
        if (hat - (oldCy + MILE_R) < MILE_HAT_GAP - 1) oldCovered++;
        expect([fp, st, hat - (cy + MILE_R) >= 0]).toEqual([fp, st, true]); // shifted down, it still never touches a hat
      }
    expect(oldCovered).toBeGreaterThan(6);
  });
  test('D429: the waiting pill is hidden for the moment\'s 1.5 s and back after', () => {
    expect(MILE_PILL_HIDE_S).toBe(1.5);
    expect([-1, 0, 0.7, 1.49, 1.5, 3].map(hidesWaitingPill)).toEqual([false, true, true, true, false, false]);
  });
  // D429: at 0.4 s of the burst the confetti sat behind the 72 pt disc (it flew 24–44 pt from its centre). Pieces now start on the rim
  test('D429: at 0.4 s at least 10 of the 14 confetti pieces are clear of the disc and on screen, at every footprint and station', () => {
    const s = confettiStep(0.4);
    expect(s).toBeGreaterThanOrEqual(0);
    expect(CONFETTI.length).toBe(CONFETTI_N);
    const by = badgeRowY();
    const visible = (cx: number, cy: number, step: number, offset: (st: number, i: number) => { dx: number; dy: number }) => {
      let n = 0;
      for (let i = 0; i < CONFETTI_N; i++) {
        const { dx, dy } = offset(step, i);
        const x = cx + dx;
        const y = cy + dy;
        // clear of the disc (at its biggest pop-in, ×1.12) and inside the scene
        if (Math.hypot(dx, dy) > MILE_R * 1.12 + 5 && x >= 0 && x <= SCENE_W && y >= 0 && y <= SCENE_H) n++;
      }
      return n;
    };
    // the v5.11 burst: out from the centre at 55–100 /s, gravity 150
    const oldOffset = (st: number, i: number) => {
      const t = ((st + 0.5) / CONFETTI_STEPS) * CONFETTI_SECONDS;
      const a = -Math.PI * (0.08 + (0.84 * ((i * 5) % CONFETTI_N)) / (CONFETTI_N - 1));
      const v = 55 + (hash32(i * 31 + 1) % 45);
      return { dx: Math.cos(a) * v * t, dy: Math.sin(a) * v * t + 0.5 * 150 * t * t };
    };
    let oldWorst = Infinity;
    for (const { fp, lay } of shops())
      for (const st of STATIONS) {
        const { cx, cy } = mileAnchor(stationRects(lay, 44)[st], by, stationHatTop(lay, st));
        expect([fp, st, visible(cx, cy, s, confettiOffset) >= 10]).toEqual([fp, st, true]);
        oldWorst = Math.min(oldWorst, visible(cx, cy, s, oldOffset));
      }
    expect(oldWorst).toBeLessThan(6);
  });
  test('the head\'s line hangs directly under the badge: its tail tip is the disc\'s lower edge, and it is nowhere near the chip row', () => {
    const by = badgeRowY();
    for (const { lay } of shops())
      for (const st of STATIONS) {
        const { cy } = mileAnchor(stationRects(lay, 44)[st], by, stationHatTop(lay, st));
        const y = mileSpeechY(cy);
        expect(y - 20).toBe(cy + MILE_R); // the HireBubble's tail tip sits 20 above its y
        expect(y - 20 - by).toBeGreaterThan(CHIP_ROW_HALF);
      }
  });
  test('the chip row dims to 30% for 1.2 s and is back at full strength after', () => {
    expect(HUD_DIM_SECONDS).toBe(1.2);
    expect([-0.1, 0, 0.6, 1.19, 1.2, 2].map(hudOpacity)).toEqual([1, HUD_DIM_OPACITY, HUD_DIM_OPACITY, HUD_DIM_OPACITY, 1, 1]);
    expect(HUD_DIM_OPACITY).toBeLessThan(0.5);
  });
  test('the badge pops in, holds and fades inside the confetti\'s life; the level fits the disc', () => {
    expect(MILE_SECONDS).toBeGreaterThanOrEqual(CONFETTI_SECONDS);
    expect(mileScale(0)).toBeLessThan(1);
    expect(Math.max(...[0.05, 0.1, 0.15, 0.2].map(mileScale))).toBeGreaterThan(1);
    expect(mileScale(0.5)).toBe(1);
    expect(mileScale(MILE_SECONDS)).toBe(0);
    expect([0.2, 1, 1.4, MILE_SECONDS].map(mileOpacity)).toEqual([1, 1, 0.6, 0]);
    expect(mileLevelSize('Lv 25')).toBe(24);
    expect(mileLevelSize('Lv 100')).toBe(20);
    expect(STATION_LABEL.oven).toBe('OVENS');
    expect(mileSub('+108% faster')).toBe('+108%');
    expect(mileSub(null)).toBeNull();
  });
});

describe('the rising "Lv N" chip (D418)', () => {
  const by = badgeRowY();
  test('it starts on the station\'s furniture and never goes up into the chip row, at every footprint and every chip size', () => {
    for (const { fp, lay } of shops())
      for (const scale of [1.6, 1, 0.9]) {
        const rects = stationRects(lay, 44 / scale);
        for (const st of STATIONS)
          for (const r of [13, 21]) {
            const start = chipAt(rects[st], by, r, 0, CHIP_RISE);
            expect([fp, st, start.y]).toEqual([fp, st, Math.max(by + CHIP_ROW_HALF + ROW_AIR + r, (rects[st].y0 + rects[st].y1) / 2)]);
            for (let k = 0; k <= 1.0001; k += 0.1) expect([fp, st, r, k, chipAt(rects[st], by, r, k, CHIP_RISE).y - r >= by + CHIP_ROW_HALF + ROW_AIR]).toEqual([fp, st, r, k, true]);
          }
      }
  });
  test('the check can fail: the v5.11 chip started on the badge (y = row) and rose through the Ovens count', () => {
    const oldY = (k: number) => by - k * CHIP_RISE;
    expect(oldY(0) - 21 >= by + CHIP_ROW_HALF + ROW_AIR).toBe(false);
  });
});

// D440: the badge hid two station chips and the awning corner; Marco's pill poked through the left wall at x 22
describe('the milestone badge clears the corner, the pill stays inside the walls (D440)', () => {
  test('the badge sits exactly MILE_SHIFT (20) down and right of the D429 anchor wherever the screen allows, and always wholly on screen', () => {
    expect(MILE_SHIFT).toBe(20);
    const by = badgeRowY();
    let right = 0;
    for (const { fp, lay } of shops())
      for (const st of STATIONS) {
        const rect = stationRects(lay, 44)[st];
        const hat = stationHatTop(lay, st);
        const { cx, cy } = mileAnchor(rect, by, hat);
        const mid = (rect.y0 + rect.y1) / 2;
        const oldCy = Math.max(by + CHIP_ROW_HALF + ROW_AIR + MILE_R, Math.min(mid, hat - MILE_HAT_GAP - MILE_R));
        const oldCx = (rect.x0 + rect.x1) / 2;
        expect([fp, st, cy]).toEqual([fp, st, oldCy + MILE_SHIFT]);
        expect([fp, st, cx > oldCx || cx + MILE_R >= SCENE_W - MILE_EDGE - 1e-9, cx + MILE_R <= SCENE_W, cx - MILE_R >= 0]).toEqual([fp, st, true, true, true]);
        if (cx > oldCx) right++;
      }
    expect(right).toBeGreaterThan(8);
  });
  test('a speech pill keeps its whole width between the walls at every footprint, for every station chip and the badge, and the old clamp let Marco\'s poke out', () => {
    const lines = ['Marco: Tomatoes crushed, boss!', 'Marco: More dough, more dough!', 'Hello!', 'Nonna: Lv 25, bellissima, keep going!'];
    let oldOut = 0;
    for (const { fp, lay } of shops()) {
      const walls = bubbleWalls(lay);
      expect(walls.x0).toBeCloseTo(((lay.L + 8) * 0.98) + 196.5 * 0.02, 6);
      for (const st of STATIONS) {
        const rect = stationRects(lay, 44)[st];
        const xs = [(rect.x0 + rect.x1) / 2, mileAnchor(rect, badgeRowY(), stationHatTop(lay, st)).cx, 22, 5, SCENE_W - 5];
        for (const text of lines)
          for (const x of xs) {
            const w = bubbleWidth(text);
            const px = bubbleX(x, w, walls);
            expect([fp, st, text, x, px - w / 2 >= walls.x0 + BUBBLE_AIR - 1e-9, px + w / 2 <= walls.x1 - BUBBLE_AIR + 1e-9]).toEqual([fp, st, text, x, true, true]);
            const old = Math.min(SCENE_W - 4 - w / 2, Math.max(4 + w / 2, x));
            if (old - w / 2 < walls.x0) oldOut++;
          }
      }
    }
    expect(oldOut).toBeGreaterThan(10);
    // a pill that fits is not moved
    const walls = bubbleWalls(shops()[4].lay);
    expect(bubbleX(200, 80, walls)).toBe(200);
    // a pill wider than the room is centred rather than pushed through one wall
    const narrow = { x0: 100, x1: 150 };
    expect(bubbleX(0, 80, narrow)).toBe(125);
  });
});
