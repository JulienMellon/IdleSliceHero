import {
  blockers,
  CARD,
  cardRect,
  CUT,
  HAND,
  handPose,
  HUD_ZONE,
  leaders,
  mergeCuts,
  overlayLayout,
  padCut,
  type Rect,
  type Safe,
  type Screen,
} from '../overlay-model';

const PHONE: Screen = { w: 393, h: 852 };
const PHONE_SAFE: Safe = { top: 59, bottom: 34 };
const SE: Screen = { w: 375, h: 667 };
const SE_SAFE: Safe = { top: 20, bottom: 0 };

const r = (x0: number, y0: number, x1: number, y1: number): Rect => ({ x0, y0, x1, y1 });
const meets = (a: Rect, b: Rect) => a.x0 < b.x1 && a.x1 > b.x0 && a.y0 < b.y1 && a.y1 > b.y0;
const inside = (a: Rect, s: Screen) => a.x0 >= 0 && a.y0 >= 0 && a.x1 <= s.w && a.y1 <= s.h;
const handBox = (x: number, y: number): Rect => r(x - HAND.size / 2, y - HAND.size / 2, x + HAND.size / 2, y + HAND.size / 2);

// the targets of today's nine steps, where the shop puts them on a 393 x 852 phone and a 375 x 667 SE (measured by hand from the fixtures' layout)
const CASES: { name: string; screen: Screen; safe: Safe; targets: Rect[] }[] = [
  { name: 'prep station', screen: PHONE, safe: PHONE_SAFE, targets: [r(24, 330, 128, 440)] },
  { name: 'prep station + dial', screen: PHONE, safe: PHONE_SAFE, targets: [r(24, 330, 128, 440), r(40, 300, 76, 328)] },
  { name: 'oven station + dial', screen: PHONE, safe: PHONE_SAFE, targets: [r(150, 320, 250, 440), r(176, 292, 212, 318)] },
  { name: 'counter station', screen: PHONE, safe: PHONE_SAFE, targets: [r(270, 340, 370, 440)] },
  { name: 'cash pill', screen: PHONE, safe: PHONE_SAFE, targets: [r(96, 62, 256, 106)] },
  { name: 'goal bar', screen: PHONE, safe: PHONE_SAFE, targets: [r(12, 112, 300, 148)] },
  { name: 'walk ovens', screen: PHONE, safe: PHONE_SAFE, targets: [r(108, 646, 196, 701)] },
  { name: 'prep station', screen: SE, safe: SE_SAFE, targets: [r(20, 250, 120, 340)] },
  { name: 'oven station + dial', screen: SE, safe: SE_SAFE, targets: [r(140, 240, 235, 340), r(165, 214, 200, 238)] },
  { name: 'cash pill', screen: SE, safe: SE_SAFE, targets: [r(90, 24, 240, 66)] },
  { name: 'goal bar', screen: SE, safe: SE_SAFE, targets: [r(10, 70, 280, 106)] },
  { name: 'walk ovens', screen: SE, safe: SE_SAFE, targets: [r(100, 548, 185, 603)] },
];

describe('overlayLayout', () => {
  test.each(CASES)('$name on $screen.w x $screen.h: the card never overlaps a cut-out, the hand stays on screen', ({ screen, safe, targets }) => {
    const lay = overlayLayout(targets, screen, safe)!;
    expect(lay.card.fits).toBe(true);
    const card = cardRect(lay.card, screen);
    for (const cut of lay.cuts) expect(meets(card, cut)).toBe(false);
    expect(meets(card, lay.bounds)).toBe(false);
    // the card stays inside the safe area
    expect(card.y0).toBeGreaterThanOrEqual(safe.top);
    expect(card.y1).toBeLessThanOrEqual(screen.h - safe.bottom);
    const hand = handBox(lay.hand.x, lay.hand.y);
    expect(inside(hand, screen)).toBe(true);
    // and the hand never covers the card
    expect(meets(hand, card)).toBe(false);
  });

  test('a cut-out is the target grown by 8 with 12 pt corners', () => {
    const lay = overlayLayout([r(100, 300, 200, 400)], PHONE, PHONE_SAFE)!;
    expect(lay.cuts).toEqual([r(100 - CUT.pad, 300 - CUT.pad, 200 + CUT.pad, 400 + CUT.pad)]);
    expect(CUT).toEqual({ pad: 8, radius: 12 });
  });

  test('a HUD target gets the card right below it; a shop target gets it at the street band; a target too low for that gets it above', () => {
    const hud = overlayLayout([r(96, 62, 256, 106)], PHONE, PHONE_SAFE)!;
    expect(hud.card.dock).toBe('below');
    expect(hud.card.top).toBe(hud.bounds.y1 + CARD.gap);
    expect(hud.bounds.y1).toBeLessThanOrEqual(PHONE.h * HUD_ZONE);
    const shop = overlayLayout([r(100, 300, 200, 400)], PHONE, PHONE_SAFE)!;
    expect(shop.card.dock).toBe('bottom');
    // D526: the street band, y >= 734 on a 852 phone: clear of the shop and its diners
    expect(cardRect(shop.card, PHONE).y0).toBeGreaterThanOrEqual(PHONE.h - PHONE_SAFE.bottom - CARD.margin - CARD.height - 1);
    expect(cardRect(shop.card, PHONE).y0).toBeGreaterThan(700);
    // D526: a sidewalk card on the 852 phone (row bottom 701 + pad) leaves the band below it for the card, so the dining room stays clear
    const row = overlayLayout([r(108, 692, 196, 748)], PHONE, { top: 59, bottom: 0 })!;
    expect(row.card.dock).toBe('bottom');
    const low = overlayLayout([r(100, 600, 200, 655)], SE, SE_SAFE)!;
    expect(low.card.dock).toBe('above');
    expect(cardRect(low.card, SE).y1).toBe(low.bounds.y0 - CARD.gap);
  });

  test('nothing to point at: no layout', () => {
    expect(overlayLayout([], PHONE, PHONE_SAFE)).toBeNull();
  });

  test('a cut-out too tall for either side leaves the card overlapping, and says so', () => {
    const lay = overlayLayout([r(0, 80, 393, 800)], PHONE, PHONE_SAFE)!;
    expect(lay.card.fits).toBe(false);
  });

  test('a target at the screen edge keeps its cut-out inside the screen', () => {
    const lay = overlayLayout([r(0, 0, 60, 44)], PHONE, PHONE_SAFE)!;
    expect(inside(lay.cuts[0], PHONE)).toBe(true);
  });
});

describe('the hand', () => {
  test('on a wide target it is inside the cut-out, centred, 30 up from the bottom edge (the old spotlight rule)', () => {
    const cut = padCut(r(24, 330, 128, 440));
    const hand = handPose(cut, PHONE);
    expect(hand.where).toBe('inside');
    expect(hand.x).toBe((cut.x0 + cut.x1) / 2);
    expect(hand.y).toBe(cut.y1 - HAND.rest);
    expect(hand.rot).toBe(HAND.tilt);
  });

  test('on a narrow target (a dial) it stands above it, pointing down (D525)', () => {
    const cut = padCut(r(40, 300, 66, 328));
    const hand = handPose(cut, PHONE);
    expect(hand.where).toBe('above');
    expect(hand.y + HAND.size / 2).toBeLessThanOrEqual(cut.y0);
    expect(hand.rot).toBe(HAND.down);
  });

  test('on a narrow target with no room above the hand goes below it, pointing up; with the card above it goes below too (D525)', () => {
    const top = padCut(r(40, 10, 66, 38));
    expect(handPose(top, PHONE).where).toBe('below');
    const cut = padCut(r(150, 600, 176, 628));
    const card = { x0: 16, y0: cut.y0 - 12 - 72, x1: 377, y1: cut.y0 - 12 };
    const hand = handPose(cut, PHONE, card);
    expect(hand.where).toBe('below');
    expect(hand.y - HAND.size / 2).toBeGreaterThanOrEqual(cut.y1);
  });

  test('with no room above and the card below, the hand stands beside the target, on the side with room', () => {
    const top = padCut(r(40, 10, 66, 38));
    const card = { x0: 16, y0: top.y1 + 12, x1: 377, y1: top.y1 + 12 + 72 };
    const right = handPose(top, PHONE, card);
    expect(right.where).toBe('right');
    expect(right.x - HAND.size / 2).toBeGreaterThanOrEqual(top.x1);
    const edge = padCut(r(350, 10, 376, 38));
    const hand = handPose(edge, PHONE, { ...card, y0: edge.y1 + 12, y1: edge.y1 + 84 });
    expect(hand.where).toBe('left');
    expect(hand.x + HAND.size / 2).toBeLessThanOrEqual(edge.x0);
    expect(hand.rot).toBeGreaterThan(0);
  });

  test('a dial pill (70 pt wide with its pad) counts as narrow: the hand is above it, clear of the digit (D531)', () => {
    const cut = padCut(r(86, 312, 140, 346));
    const hand = handPose(cut, PHONE);
    expect(hand.where).toBe('above');
    expect(hand.y + HAND.size / 2).toBeLessThanOrEqual(cut.y0);
  });

  test('on the All button the hand is above it, clear of the Drivers card beside it (D525)', () => {
    const all = r(340, 646, 386, 701);
    const lay = overlayLayout([all], PHONE, PHONE_SAFE)!;
    expect(lay.hand.where).toBe('above');
    expect(lay.hand.x).toBeGreaterThan(all.x0);
    // on the short SE the card is above the row: the hand goes below All, still clear of Drivers
    const se = overlayLayout([r(330, 548, 376, 603)], SE, SE_SAFE)!;
    expect(se.card.dock).toBe('above');
    expect(se.hand.where).toBe('below');
  });

  test('on a short bar it rests on the bottom edge, clear of the card 12 pt below', () => {
    const cut = padCut(r(12, 112, 300, 148));
    const hand = handPose(cut, PHONE);
    expect(hand.y + HAND.size / 2).toBeLessThanOrEqual(cut.y1 + CARD.gap);
    expect(hand.x).toBeCloseTo(cut.x0 + (cut.x1 - cut.x0) * HAND.along, 6);
  });

  test('a sidewalk card (55 pt + the pad) counts as short too: the hand leaves its price showing', () => {
    const cut = padCut(r(108, 646, 196, 701));
    expect(handPose(cut, PHONE).y).toBe(cut.y1 - 6);
  });

  test.each([r(0, 0, 20, 20), r(373, 0, 393, 20), r(0, 832, 20, 852), r(373, 832, 393, 852), r(0, 0, 393, 852)])(
    'a target in the corner of the screen: the hand stays inside',
    (t) => {
      const lay = overlayLayout([t], PHONE, PHONE_SAFE)!;
      expect(inside(handBox(lay.hand.x, lay.hand.y), PHONE)).toBe(true);
    },
  );
});

describe('mergeCuts', () => {
  test('overlapping cut-outs become their bounding box; separate ones stay two holes', () => {
    expect(mergeCuts([r(0, 0, 50, 50), r(40, 40, 100, 100)])).toEqual([r(0, 0, 100, 100)]);
    expect(mergeCuts([r(0, 0, 50, 50), r(200, 200, 300, 300)])).toHaveLength(2);
  });

  test('a chain merges all the way', () => {
    expect(mergeCuts([r(0, 0, 50, 50), r(100, 0, 150, 50), r(40, 0, 110, 50)])).toEqual([r(0, 0, 150, 50)]);
  });
});

describe('blockers', () => {
  const area = (rs: Rect[]) => rs.reduce((t, b) => t + (b.x1 - b.x0) * (b.y1 - b.y0), 0);

  test.each([[[r(100, 300, 200, 400)]], [[r(24, 330, 128, 440), r(250, 60, 350, 110)]], [[r(0, 0, 393, 100)]], [[r(0, 0, 393, 852)]]])(
    'with the holes they tile the screen exactly, and none overlaps a hole',
    (cuts) => {
      const pieces = blockers(cuts, PHONE);
      expect(area(pieces) + area(cuts)).toBeCloseTo(PHONE.w * PHONE.h, 6);
      for (const p of pieces) for (const c of cuts) expect(meets(p, c)).toBe(false);
      for (let i = 0; i < pieces.length; i++) for (let j = i + 1; j < pieces.length; j++) expect(meets(pieces[i], pieces[j])).toBe(false);
    },
  );

  test('a touch inside a hole is in no blocker; one outside is in exactly one', () => {
    const cuts = [r(100, 300, 200, 400)];
    const pieces = blockers(cuts, PHONE);
    const hits = (x: number, y: number) => pieces.filter((p) => x >= p.x0 && x < p.x1 && y >= p.y0 && y < p.y1).length;
    expect(hits(150, 350)).toBe(0);
    expect(hits(50, 350)).toBe(1);
    expect(hits(150, 100)).toBe(1);
    expect(hits(150, 500)).toBe(1);
  });
});

describe('wait and look steps (D520)', () => {
  const station = r(24, 330, 128, 440);
  const dial = r(40, 300, 76, 328);

  test('the hand points at the dial, the last target, not the station', () => {
    const wait = overlayLayout([station, dial], PHONE, PHONE_SAFE, 'wait')!;
    expect(wait.hand.where).not.toBe('inside');
    expect(Math.abs(wait.hand.x - 58)).toBeLessThan(40);
    const look = overlayLayout([station, dial], PHONE, PHONE_SAFE, 'look')!;
    expect(look.hand).toEqual(wait.hand);
    const tap = overlayLayout([station, dial], PHONE, PHONE_SAFE, 'tap')!;
    expect(tap.hand.where).toBe('inside');
  });

  test('a single wait target keeps its own pose', () => {
    const lay = overlayLayout([r(96, 62, 256, 106)], PHONE, PHONE_SAFE, 'wait')!;
    expect(lay.hand.where).toBe('inside');
  });
});

describe('the dotted leader (D524)', () => {
  test('one line from the station hole to the dial hole, ending on their edges', () => {
    const a = padCut(r(24, 330, 128, 440));
    const b = padCut(r(40, 250, 76, 278));
    const [l] = leaders([a, b]);
    expect(leaders([a, b])).toHaveLength(1);
    expect(l.y0).toBe(a.y0);
    expect(l.y1).toBe(b.y1);
    expect(l.x0).toBeGreaterThanOrEqual(a.x0);
    expect(l.x1).toBeLessThanOrEqual(b.x1);
  });

  test('one hole has no leader', () => {
    expect(leaders([r(0, 0, 10, 10)])).toEqual([]);
  });
});

describe('a target off the screen (C163)', () => {
  test('a first target fully off the screen gives no layout, so no scrim swallows every touch', () => {
    expect(overlayLayout([r(500, 300, 600, 400)], PHONE, PHONE_SAFE)).toBeNull();
    expect(overlayLayout([r(-200, 300, -100, 400)], PHONE, PHONE_SAFE)).toBeNull();
    expect(overlayLayout([r(100, 900, 200, 1000)], PHONE, PHONE_SAFE)).toBeNull();
  });

  test('a first target that shows keeps its layout; an off-screen second one is dropped', () => {
    const lay = overlayLayout([r(24, 330, 128, 440), r(500, 300, 520, 330)], PHONE, PHONE_SAFE, 'wait')!;
    expect(lay.cuts).toHaveLength(1);
  });

  test('in a tap step the blockers never cover the whole screen', () => {
    for (const t of [r(24, 330, 128, 440), r(0, 0, 20, 20), r(373, 832, 393, 852), r(-5, -5, 5, 5)]) {
      const lay = overlayLayout([t], PHONE, PHONE_SAFE)!;
      const covered = blockers(lay.cuts, PHONE).reduce((n, b) => n + (b.x1 - b.x0) * (b.y1 - b.y0), 0);
      expect(covered).toBeLessThan(PHONE.w * PHONE.h);
    }
  });
});
