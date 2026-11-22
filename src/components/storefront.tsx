// The main-screen scene: a pizzeria seen from the street, with the front wall cut away.
//   sky + clouds + neighbourhood skyline + trees
//   the room in perspective (back wall, side walls, receding floor): prep table, ovens, counter,
//   pickup spots, dining tables, all shaded with floor shadows
//   a front entrance on the right that customers and drivers use
//   the sidewalk (the upgrade buttons sit on it, drawn by the screen) and a street with traffic.
//
// Everything is drawn in a 393×680 "scene" box that is scaled to cover the available area,
// anchored to the bottom so the sidewalk and street are always visible (taller screens show more sky).
import { memo, useEffect, useMemo, useRef, useState, type ComponentRef, type ReactElement } from 'react';
import { Pressable, ScrollView, View } from 'react-native';
import Svg, { Circle, G, Path, Rect, Text as SvgText } from 'react-native-svg';
import { F } from '../theme';
import { cityOf, hoodIds, layerOf, sceneHood } from '../content/cities';
import { LOOKS } from './scene/identity';
import type { NeighborhoodId } from '../content/types';
import * as Game from '../engine/game';
import { useGame } from '../store/game-store';
import { emitAudio } from '../audio/bus';
import { CHEER_SECONDS, emitPayout, onCheer } from './pulse-bus';
import { Backdrop } from './scene/background';
import { useClock, usePerfMarks } from './scene/clock';
import { SceneDefs } from './scene/defs';
import { FRONT_ROW_Y, LEDGE_Y, PROP_Y, SIGN_Y, STOOL_Y, TREE_Y, moreTagRect, waitTagRect, type Layout } from './scene/layout';
import { seatPalette } from './scene/palette';
import { GUEST_SHIRTS, HAIR_COLORS, hash32, Person } from './scene/people';
import { CURB_Y, D, INK, P, drawShift, openScroll, sceneToScreen, sceneView, screenToScene } from './scene/projection';
import { plainOf } from './scene/layout-space';
import { Flip } from './scene/primitives';
import { ScrollCues } from './scroll-cues';
import { clearCueTop, cuesFor, onScrollAsk, queueShown, wantsOf, wrenchRect, type KitchenSpot, type PtRect, type ScrollTarget } from './scroll-cues-model';
import { wrenchSpot, WRENCH } from './layers/shifts/jam-model';
import { shopLayout } from './scene/shop-layout';
import { isTap, shopOpenScroll } from './scene/scroll';
import { Counter, FloorPlant, FloorProp, LedgeBar, Oven, OvenHood, PrepBench, Rug, Stools, Table, WallPlanter } from './scene/props';
import { ovenTier } from './scene/geometry';
import { furnitureDeps, furnitureInputs, ladderInput, type FurnitureInputs } from './scene/furniture-inputs';
import { LadderPiece } from './scene/ladder-props';
import { NEON_W, neonSpot } from './scene/cosmetics';
import { ColdFrost, DuskTint, StringLights } from './scene/event-props';
import { eventLook } from './scene/event-look';
import { activeEvent } from '../engine/features/events';
import { NeonCounterSign } from './scene/cosmetic-props';
import { VISITOR_LOOK, cameoGeom, sayLines, visitLine, visitOf, visitTagLabel } from './scene/cameo';
import { CHIP_RISE, CHIP_SECONDS, bounceStep, bounceTransforms, clearPillX, confettiStep, ladderProps, menuRect, wallRects, type Placed } from './scene/ladder';
import { ChalkSign, DoorLeaf, Doormat, FrontWall, Planter, RoomShell, SceneOverlays, StreetProp } from './scene/room';
import { FasciaSign } from './scene/facade';
import { fasciaSignBox, overlaySpan, slideInto, visibleSpan } from './scene/viewport';
import { SceneViewContext } from './scene/view-context';
import { gameNow } from '../engine/clock';
import { floorYFor, liftLayout, stripTop } from './scene/strip-clear';
import { trafficFor } from './scene/street-props';
import { rivalOpen } from '../engine/features/layers/rival';
import { Car, CARS, Cloud, ParkedVehicle, Sidewalk, sidewalkItems, Street } from './scene/street';
import { buildCast, sidewalkOf } from './scene/cast';
import { queueLabel, waitingText } from './scene/waiting';
import { PILE_KINDS, batchOf, pileCount, pileSpots, type PileKind } from './scene/piles';
import { Pile } from './scene/pile-art';
import { hireOnSidewalk } from './sidewalk-model';
import { LINE, STATIONS_IN_ORDER, type Station } from '../engine/pipeline';
import { HEAD_BARKS } from '../content/heads';
import { getFeature } from '../engine/features';
import { counterattack } from '../engine/features/counterattack';
import { coachTargets, hintsAllowed } from '../engine/tutorial';
import { gainAnchor, ovenGain } from './scene/oven-gain';
import type { BarkTable } from '../content/cities/types';
import { reportActive, reportView, symptomAsks } from '../engine/features/service';
import { jamView } from '../engine/features/layers/shifts';
import {
  heads as headsFeature,
  newBarkMem,
  nextBark,
  rankOf,
  speakerFor,
  stationLevel,
  weekStation,
  type BarkAsk,
  type BarkMem,
} from '../engine/features/heads';
import {
  BadgeRail,
  CameoBubble,
  OvenGainTag,
  CameoTag,
  DeparturePops,
  HireBubble,
  MilestoneBadge,
  RushPill,
  StationBadge,
  rushPillWidth,
} from './scene/kitchen-hud';
import {
  CHIP_ROW_HALF,
  MILE_SECONDS,
  stepMoments,
  type Bounced,
  type Moments,
  ROW_AIR,
  STATION_LABEL,
  bubbleWalls,
  chipAt,
  hidesWaitingPill,
  hudOpacity,
  mileAnchor,
  mileOpacity,
  mileScale,
  mileSpeechY,
  mileSub,
  stationHatTop,
} from './scene/moments';
import { rushCombo, rushPill } from './rush-model';
import { emptyCrew, stepCrew, type CrewState } from './scene/crew';
import { emitCoin } from './pulse-bus';
import { BADGE_R, COIN_FLIGHT, badgeAt, badgeModels, badgeRowY, badgeXs, MIN_TAP_PT, placePops, popsCover, stationAt, stationRects } from './scene/stations';
import { coachReporter, type CoachInput } from './scene/coach-rects';
import { registerTarget } from './coach/targets';

export { CURB_Y, SCENE_H, sceneFit, sceneFrame, sceneView } from './scene/projection';

export type StationKey = 'prep' | 'ovens' | 'counter' | 'drivers';

interface Props {
  id: NeighborhoodId;
  width: number;
  height: number;
  paused: boolean;
  /** A tap on a GM shop (rush). */
  onTap: () => void;
  /** A tap on one station of a shop without a GM; returns why it was refused, or null when it started. */
  onStation: (st: Station) => string | null;
}

/** Everything the still picture depends on: when this changes, the scene re-renders even while paused. */
function sceneKey(g: Game.GameState, id: NeighborhoodId) {
  const s = g.shops[id];
  const d = s.decor;
  return `${s.footprint}|${s.prep}|${s.ovens}|${s.counter}|${s.drivers}|${s.tables}|${s.grade}|${s.managed ? 1 : 0}|${d.tables}${d.plants}${d.flooring}${d.walls}${d.signage}|${g.vehicle}|${g.rewards.worn.join(',')}`;
}

/** Sky drift: three clouds that loop across the scene on the clock. */
const CLOUDS = [
  { x0: 60, y: 34, k: 0.8, v: 4 },
  { x0: 260, y: 20, k: 1.0, v: 3 },
  { x0: 360, y: 70, k: 0.6, v: 5 },
] as const;

/** A city without lines for its heads: one frozen table, not a new `{}` every frame. */
const NO_BARKS: Partial<BarkTable> = Object.freeze({});

const HIRE_LINE: Record<Station, string> = { prep: 'I got the dough, boss!', oven: 'Ovens are mine now.', counter: 'Next customer, please!' };

/** Each shop's last head bubble and the once-only ones already spoken, kept across visits so the 20 s gap and "one star per week" hold when the scene remounts (features/heads.ts `nextBark`). */
const barkMemory = new Map<NeighborhoodId, BarkMem>();

/** Per-shop character seed (stable crowd per neighbourhood). */
const seedFor = (id: string) => Array.from(id).reduce((h, ch) => (h * 31 + ch.charCodeAt(0)) % 997, 7) * 97;

/**
 * Re-renders on its own 15 fps clock (reading the latest game state each frame) and when the shop's
 * upgrades change. The parent's 200 ms game ticks don't re-render it, and a paused scene stays still.
 */
export const Storefront = memo(function Storefront({ id, width, height, paused, onTap, onStation }: Props) {
  // Opt out of React Compiler memoisation: this component deliberately reads the live store
  // (useGame.getState()) on every clock frame, which auto-memoisation could otherwise cache.
  'use no memo';
  usePerfMarks('Storefront');
  const clock = useClock(15, paused);
  useGame((s) => sceneKey(s.game, id));
  // the last rush taps (wall ms, newest last): the store replaces the array on a tap, so this is a stable dependency
  const rushTaps = useGame((s) => s.rushTaps);
  const game = useGame.getState().game;
  // the wall clock, read once for this render (U23): every time-of-render use below shares it
  const nowMs = gameNow();
  const shop = game.shops[id];
  const city = cityOf(game);
  const nd = Game.def(id, city);
  // the shop art: a shop with a look of its own (identity.ts: the home city's and Boston's) wears it; any other falls back to the home hood at its build position. Paint reads `art`, the game reads `id`
  const art = LOOKS[id] ? id : sceneHood(city, id);
  const fp = shop.footprint;
  // where this view sits on the page, for turning a tap's pageX/pageY into scene coordinates
  const viewRef = useRef<ComponentRef<typeof View>>(null);
  const origin = useRef({ x: 0, y: 0 });
  // a wide shop scrolls sideways (scene/scroll.ts): how far it has gone, where the finger went down (a drag past TAP_SLOP is a scroll, never a tap), and the view
  const scrollX = useRef(0);
  // …and the same answer tells the Coach where the stations and their dials are on the screen (scene/coach-rects.ts `coachReporter`), once the origin is known; after this scene is gone
  // a late answer reports nothing (C162, T120). The layout and fit are the latest render's; the scroll is read when the report is made
  const coachIn = useRef<Pick<CoachInput, 'lay' | 'fit'> | null>(null);
  const [reporter] = useState(() => coachReporter(() => ({ ...coachIn.current!, scrollX: scrollX.current }), registerTarget));
  // the tutorial runs: only then does a scroll in motion re-report the targets (the rest of the time a settled scroll does)
  const coachRuns = useRef(false);
  const measureOrigin = () =>
    viewRef.current?.measureInWindow((x: number, y: number) => {
      origin.current = { x, y };
      reporter.setOrigin(x, y);
    });
  const touchAt = useRef({ x: 0, y: 0 });
  const scroller = useRef<ComponentRef<typeof ScrollView>>(null);
  const opened = useRef(false);
  // Mutable per-mount scratch that does not drive rendering on its own: the crew, coin launches, the last
  // departure seen, rush/miss/refusal moments (tap handler) and the queue of hire bubbles (effect).
  const mem = useRef({
    crew: null as CrewState | null,
    /** Departure ids whose coin already launched (≤ maxDepartures kept). Coins launch per id, any order (C80). */
    launched: new Set<number>(),
    lastSold: 0,
    carriers: new Map<number, [number, number]>(),
    wasPaused: false,
    rushAt: -9,
    hintAt: -9,
    /** Wall seconds the `cheer` pulse last fired (pulse-bus.ts, D444). */
    cheerAt: -9,
    refusal: null as null | { st: Station; at: number; text: string },
    heads: null as null | Record<Station, boolean>,
    hires: [] as { st: Station; text: string }[],
    hire: null as null | { st: Station; at: number; text: string },
    /** The oven job's time left last frame (−1: no job), to spot a bake finishing (P3). */
    ovenLeft: -1,
    /** A baked batch sliding out of the oven onto the pass. */
    slide: null as null | { at: number; n: number },
    /** Station speeds last frame, to show what an upgrade did (P5). */
    speeds: null as Moments['speeds'],
    flash: null as Moments['flash'],
    /** Station levels last frame (ovens under 'oven'), to spot a buy: the furniture bounces and a "Lv N" chip rises (v5.11). */
    levels: null as Moments['levels'],
    bounce: null as Moments['bounce'],
    chip: null as Moments['chip'],
    /** A station just reached Lv 25 / 50 / 100: confetti for 1.5 s and the head's line (null text: nobody to say it). */
    mile: null as Moments['mile'],
    /** A head's bark (features/heads.ts): which station speaks, the line and the wall second it began. */
    bark: null as null | { st: Station; text: string; at: number },
    /** The rush pill was a combo last frame: a bark asks when one starts. */
    combo: false,
    /** The scene key and hired heads `stepMoments` last ran for (U21). */
    momentsKey: '',
  });
  const eventAt = useRef({ sec: -1, ev: null as ReturnType<typeof activeEvent> });
  const repAt = useRef({ sec: -1, view: null as ReturnType<typeof reportView> | null, live: false });
  // wall ms when this shop's scene was opened (the scene remounts per shop): the rush hint shows for the start of a visit
  const [visitAt] = useState(() => gameNow());

  // one room for the storefront and every overlay (scene/shop-layout.ts): geometry only changes with upgrades, so `roomLay` stays identical across frames and the
  // memoised layers that take `lay` (room shell, front wall, door, mat, hood) skip re-rendering. A shop on the second floor plan (`NeighborhoodDef.plan`: kitchen on
  // the right, door on the left) is mirrored inside the layout itself (scene/layout-space.ts)
  // (memoised on the scene key, which holds every level the room is planned from, so a 15 fps frame does not even build the layout's cache key, U26)
  const key = sceneKey(game, id);
  // eslint-disable-next-line react-hooks/exhaustive-deps -- `key` covers every level the room depends on
  const { room: roomLay, draw: drawLay } = useMemo(() => shopLayout(id, shop, city), [id, key, city]);
  // …and in the draw space the drawing code's default `P` expects (`drawFrame`): everything below the sky and the street is drawn in a group moved right by `shift`
  // …and lifted clear of the shop report's strip, which hides what stands lower on the sidewalk (strip-clear.ts, D514): the same fit the strip's `bottom` is computed from (app/index.tsx)
  const stripFloor = floorYFor(stripTop(sceneView(width, height, roomLay.frame).fit.s, hireOnSidewalk(shop, id, city)));
  const lay = useMemo(() => liftLayout(drawLay, stripFloor), [drawLay, stripFloor]);
  const running = shop.managed || Game.lineBusy(shop.line);
  const rate = Game.shopRate(shop, game.vehicle, city.fit);
  const pace = running ? Math.min(2.6, 0.8 + Math.log10(1 + rate)) : 0;
  // `frame` is the draw space's (its edges are x0 and x0 + width); `sceneFrame` is the drawing's own, which the scroll view, the sky and the street are laid out in
  const frame = lay.frame;
  const sceneFrame = roomLay.frame;
  const shift = drawShift(sceneFrame);
  const worldT = shift ? `translate(${shift} 0)` : undefined;
  const view = sceneView(width, height, sceneFrame);
  const fit = view.fit;
  // the drawing's own width on the screen: the screen's, unless the frame is wider (then it sits in a scroll view this wide)
  const cw = view.contentW;
  const driftSpan = sceneFrame.width + 200;
  const frontY = P(0, 0)[1];
  const shopSeed = seedFor(id);
  const nIdx = Math.max(
    0,
    city.neighbourhoods.findIndex((n) => n.id === id),
  );
  const pal = useMemo(
    () =>
      seatPalette(
        hash32(shopSeed) % GUEST_SHIRTS.length,
        hash32(shopSeed + 9) % HAIR_COLORS.length,
        GUEST_SHIRTS.length,
        HAIR_COLORS.length,
        lay.tables.length,
      ),
    [shopSeed, lay.tables.length],
  );

  // ---- people (pure cast builder) + furniture, painter-sorted by depth
  type Item = { y: number; el: ReactElement };
  // the day-30 visitor (cameo.ts): in the shop on screen while the visit's boost runs, with a tag of the time left and a line every few minutes
  const visit = visitOf(game.rewards.boosts, nowMs);
  const visitTagText = visit ? visitTagLabel(visit) : '';
  const visitLineNow = visit ? visitLine(visit.visitor, nowMs / 1000) : null;
  // M68: the figure's spot searches the counter for the roomiest x, so it is found when the layout or the tag's text changes, not 15 times a second
  const cameo = useMemo(() => (visitTagText ? cameoGeom(lay, visitTagText) : null), [lay, visitTagText]);
  // drivers and walk-ins follow the departures (crew.ts). The fold is idempotent for the same inputs, so writing the
  // result back to the ref during render is safe on a re-render; a fresh mount starts past the departures already
  // walking, so they don't all start at once (and their coins don't launch in a burst)
  const line = shop.line;
  const m0 = mem.current;
  if (!m0.crew) {
    const top = line.departures.reduce((t, d) => Math.max(t, d.id), 0);
    m0.crew = { ...emptyCrew(), seenId: top };
    for (const d of line.departures) m0.launched.add(d.id);
    m0.lastSold = shop.sold;
  }
  // walk-ins come in while the engine sends them sales (one waits at the register at a time: D336)
  const walkins = Game.walkInFraction(shop, game.vehicle, city.fit) > LINE.minWalkInShare;
  const tickSince = paused ? 0 : Math.max(0, (nowMs - useGame.getState().tickAt) / 1000);
  // `idle`: the sidewalk shows the hire stack exactly when the shop has no GM (D408: a shop with all three heads but no GM
  // still stacks it, so the old `runsItself` test let walkers stand behind the stack); that shop keeps the sidewalk clear
  const crew = paused
    ? m0.crew
    : stepCrew(
        m0.crew,
        { lay, walkins, idle: hireOnSidewalk(shop, id, city), patio: Game.patioTables(shop, city.fit), departures: line.departures, since: tickSince },
        clock,
        frame.width,
      );
  m0.crew = crew;
  // who waits outside: hungry diners and idle drivers (steady state, so only while the shop runs); the patio's tables
  // a running weekly event (D470): the sky goes to dusk, string lights come on, and two more hungry diners stand in the lane while the shop sells
  // (activeEvent is looked up once a second, not on every 15 fps frame: U15)
  const nowSec = Math.floor(nowMs / 1000);
  if (eventAt.current.sec !== nowSec) eventAt.current = { sec: nowSec, ev: activeEvent(nowSec * 1000, game) };
  const evLook = eventLook(eventAt.current.ev, id, running);
  // the shop report once a second too: the cold line's share (step 4) and the symptoms (the workers' poses, the piles, the off-screen cues)
  if (repAt.current.sec !== nowSec) repAt.current = { sec: nowSec, view: reportView(game, id, game.lastSavedAt), live: reportActive(game, id) };
  const rep = repAt.current.view!;
  // from a shop's first head the scene shows its state: the backlog as piles, the workers' poses, the line and its walk-outs (v5.22)
  const live = repAt.current.live;
  // M60/U10/U11: the queue sizes are a function of the levels, grade, seating and vehicle, all in `key`: computed per upgrade, not 15 times a second
  // eslint-disable-next-line react-hooks/exhaustive-deps -- `key` covers every input of queueSizes
  const q0 = useMemo(() => (running ? Game.queueSizes(shop, game.vehicle, city.fit) : undefined), [key, running]);
  const extraDiners = evLook.extraDiners;
  // v5.16: while the shop's line has gone cold the street draws only `queueShare` of it (the report's; scroll-cues-model.ts `queueShown`)
  const queueShare = rep.queueShare;
  const queue = useMemo(
    () => (q0 ? { diners: queueShown(q0.diners + extraDiners, queueShare), drivers: queueShown(q0.drivers, queueShare) } : q0),
    [q0, extraDiners, queueShare],
  );
  const cheer = nowMs / 1000 - m0.cheerAt < CHEER_SECONDS;
  const { cast } = buildCast({ lay, shop, running, pace, clock, shopSeed, nIdx, pal, crew, queue, cold: rep.state === 'cold', cheer, symptoms: rep.symptoms });
  const side = sidewalkOf(lay, crew, queue);
  // each pop rides over the figure carrying its departure (one Map reused per mount, M48)
  const carriers = m0.carriers;
  carriers.clear();
  for (const c of cast) if (c.deps) for (const dep of c.deps) carriers.set(dep, P(c.props.x, c.props.y, 52, frame));
  // the pills over the sidewalk queues; the drivers' one hides while a milestone badge and its confetti are up (D429), and either fades while a "+$" pop would land on it (D439: the pop used to lift above the pill and sit across the faces)
  const popRects = placePops(
    line.departures,
    (d) => Math.max(0, d.left - tickSince),
    (d) => carriers.get(d.id) ?? null,
    P(lay.staff[0] + 12, 70, 78, frame),
    frame.x0 + frame.width,
    [],
    frame.x0,
  ).map((q) => q.rect);
  // U4: while Nonna's coach is up the scene says nothing else (tutorial.ts `hintsAllowed`)
  const hints = hintsAllowed(game);
  // the step's targets (engine/tutorial.ts `coachTargets`: none while the tutorial is not running)
  const ovenLook = coachTargets(game).includes('ovens:all');
  // the pills' words change with the counts only (U10/U11), not with the clock
  const waitWords = useMemo(() => (side.waiting > 0 ? waitingText(side.waiting) : null), [side.waiting]);
  const moreWords = useMemo(() => (side.more > 0 ? queueLabel(side.more, side.diners) : null), [side.more, side.diners]);
  const waitRaw = hints.waiting && waitWords && !(m0.mile && hidesWaitingPill(clock - m0.mile.at)) ? waitWords : null;
  // U21: the pills' rects depend on the layout and the words only (moreTagAt searches the seats and umbrellas), so they are memoised, not rebuilt each frame
  const waitRect = useMemo(() => (waitRaw ? waitTagRect(lay, waitRaw) : null), [lay, waitRaw]);
  const waitText = waitRaw && waitRect && !popsCover(popRects, waitRect) ? waitRaw : null;
  const moreRaw = hints.more ? moreWords : null;
  const moreRect = useMemo(() => (moreRaw ? moreTagRect(lay, moreRaw) : null), [lay, moreRaw]);
  const moreText = moreRaw && moreRect && !popsCover(popRects, moreRect) ? moreRaw : null;
  const fin = furnitureInputs({
    id: art,
    name: nd.name,
    shop,
    running,
    rate,
    vehicle: game.vehicle,
    worn: game.rewards.worn,
    first: id === hoodIds(city)[0],
    piles: live,
  });
  // Furniture only changes with upgrades and the dough/box counts, so it is built once per change (M12), not 15 times a second.
  // The visual ladder (v5.11): the props this shop's levels have earned, placed from the layout; built once per upgrade like the furniture
  // eslint-disable-next-line react-hooks/exhaustive-deps -- deps are lay + every value of `fin`, the builder's only inputs
  const placed = useMemo(() => ladderProps(lay, ladderInput(fin)), [lay, ...furnitureDeps(fin)]);
  // eslint-disable-next-line react-hooks/exhaustive-deps -- deps are lay + every value of `fin`, the builder's only inputs
  const furniture = useMemo(() => buildFurniture(lay, fin, placed), [lay, placed, ...furnitureDeps(fin)]);
  // the backlog as piles (piles.ts): rolled dough on the pass, boxed pies on the counter, bags on the pickup shelf, 0-5 of each from the pies waiting against one batch.
  // The places are found once per layout and ladder (clear of heads, badges, the mat and the ladder's props); the drawing is rebuilt only when a count moves
  const spots = useMemo(
    () =>
      pileSpots(
        lay,
        art,
        placed.map((p) => p.rect),
      ),
    [lay, art, placed],
  );
  const batch = batchOf(Game.tapBatch(shop), rate);
  const nDough = live ? pileCount(line.prepped, batch) : 0;
  const nBoxes = live ? pileCount(line.baked, batch) : 0;
  const nBags = live ? pileCount(line.boxed, batch) : 0;
  const piles = useMemo(() => {
    const n: Record<PileKind, number> = { dough: nDough, boxes: nBoxes, bags: nBags };
    return PILE_KINDS.flatMap((kind) => {
      const sp = spots[kind];
      return sp && n[kind] > 0
        ? [{ y: sp.sortY, el: <Pile key={`pile-${kind}`} kind={kind} n={n[kind]} ax={sp.ax} ay={sp.ay} k={sp.k} stand={sp.stand} /> }]
        : [];
    });
  }, [spots, nDough, nBoxes, nBags]);
  // per-buy bounce: each station's transform strings (one per step, about its base) are built when the layout changes, never per frame
  const bounceT = useMemo(() => {
    const [ox0, ox1] = [lay.ovenCols[0].x0, lay.ovenCols[lay.ovenCols.length - 1].x1];
    return {
      prep: bounceTransforms(P((lay.prep.x0 + lay.prep.x1) / 2, 75, 0, frame)),
      oven: bounceTransforms(P((ox0 + ox1) / 2, D - 6, 0, frame)),
      counter: bounceTransforms(P((lay.counter.x0 + lay.counter.x1) / 2, 74, 0, frame)),
      drivers: bounceTransforms(P(lay.scooter.x, lay.scooter.y, 0, frame)),
    } satisfies Record<Bounced, string[]>;
  }, [lay]);
  const bounceNow = mem.current.bounce ? bounceStep(clock - mem.current.bounce.at) : -1;
  const bouncing = bounceNow >= 0 ? mem.current.bounce!.st : null;
  // what is on screen of a wide shop's drawing (scene/viewport.ts): the shop's bubbles and its name plate stay inside it, 12 pt from the edge (D511, D512)
  const span = visibleSpan(view.scrolls, scrollX.current, width, fit, shift, { x0: frame.x0, x1: frame.x0 + frame.width });
  // the overlays' own span (viewport.ts `overlaySpan`): a context object that changes only when the shop moves a whole point, read by the jam's label alone (U25)
  const ovSpan = overlaySpan(view.scrolls, scrollX.current, width, cw);
  const overlayView = useMemo(() => (ovSpan ? { x0: ovSpan.x0, x1: ovSpan.x1 } : null), [ovSpan?.x0, ovSpan?.x1]); // eslint-disable-line react-hooks/exhaustive-deps -- the primitives are the deps
  const signBox = fasciaSignBox(plainOf(lay), nd.name);
  const signC = lay.mirrored ? 2 * frame.vanishX - signBox.fcx : signBox.fcx;
  const signDraw = view.scrolls
    ? slideInto(
        signC,
        signBox.signW,
        span,
        lay.mirrored ? { x0: 2 * frame.vanishX - signBox.fx1, x1: 2 * frame.vanishX - signBox.fx0 } : { x0: signBox.fx0, x1: signBox.fx1 },
      )
    : 0;
  const items: Item[] = [
    // a bought station's furniture wraps in a group whose transform is the precomputed bounce step (always wrapped, so the tree doesn't change when it starts)
    ...furniture.map((f) =>
      f.st
        ? {
            y: f.y,
            el: (
              <G key={f.el.key} transform={bouncing === f.st ? bounceT[f.st][bounceNow] : undefined}>
                {f.el}
              </G>
            ),
          }
        : f,
    ),
    // the name plate is its own part of the front (after the wall, same depth), so it slides along the beam without the wall redrawing
    {
      y: 0,
      el: (
        <Flip key="fascia" on={lay.mirrored} axis={frame.vanishX}>
          <FasciaSign lay={plainOf(lay)} name={nd.name} signage={fin.signageTier} dx={lay.mirrored ? -signDraw : signDraw} />
        </Flip>
      ),
    },
    ...piles,
    ...sidewalkItems(lay, side.patio, waitText, moreText),
    ...cast.map((c) => ({ y: c.sortY, el: <Person key={c.key} {...c.props} /> })),
    ...(visit && cameo
      ? [
          {
            y: cameo.spot.y,
            el: (
              <Person
                key="cameo"
                x={cameo.spot.x}
                y={cameo.spot.y}
                kind="guest"
                front
                talk={visitLineNow !== null}
                mood="happy"
                {...VISITOR_LOOK[visit.visitor]}
              />
            ),
          },
        ]
      : []),
  ];
  items.sort((a, b) => b.y - a.y);

  useEffect(
    () =>
      onCheer(() => {
        mem.current.cheerAt = gameNow() / 1000;
      }),
    [],
  );
  // ---- departures: a carrier that paid this frame bumps the HUD cash (its coin just landed). Detected after
  // commit; ids only grow, so a remount or the end of a pause never replays old ones.
  useEffect(() => {
    const m = mem.current;
    const asks: BarkAsk[] = [];
    // a departure about to pay launches its coin from the carrier to the HUD cash, timed to land with the cash
    if (!paused)
      for (const d of line.departures) {
        const l = Math.max(0, d.left - Math.max(0, (gameNow() - useGame.getState().tickAt) / 1000));
        if (m.launched.has(d.id) || l > COIN_FLIGHT) continue;
        m.launched.add(d.id);
        if (m.launched.size > 12) m.launched.delete(m.launched.values().next().value as number);
        const [sx, sy] = carriers.get(d.id) ?? geoRegister;
        emitCoin({ x: origin.current.x + sceneToScreen(sx + shift, scrollX.current, fit), y: origin.current.y + fit.oy + (sy - 40) * fit.s, ms: l * 1000 });
      }
    // someone paid: the shop's whole-number sold count went up (C80: departures don't pay in id order). The first
    // frame after a pause skips the emit, so closing the drawer doesn't replay a stale cash sound (C75)
    const paid = shop.sold > m.lastSold;
    m.lastSold = shop.sold;
    if (paid && !paused && !m.wasPaused) {
      emitPayout();
      emitAudio({ type: 'cash' });
    }
    m.wasPaused = paused;
    // a bake finished: the job is gone, or a new one started (its time left jumped up) → slide the pies out
    const ov = line.oven;
    const prevLeft = m.ovenLeft;
    m.ovenLeft = ov ? ov.left : -1;
    if (!paused && prevLeft >= 0 && (!ov || ov.left > prevLeft + 1e-6)) m.slide = { at: clock, n: line.baked + (line.counter?.n ?? 0) };
    // an upgrade sped a station up, or a level went up: flash, bounce, chip and milestone (moments.ts `stepMoments`; A28)
    // U21: only when something it reads changed: the scene key (levels, grade, footprint) or a head hired
    const momentsKey = `${key}|${STATIONS_IN_ORDER.map((st) => (shop.heads[st] ? 1 : 0)).join('')}`;
    if (m.momentsKey !== momentsKey) {
      m.momentsKey = momentsKey;
      const step = stepMoments(
        { speeds: m.speeds, levels: m.levels, flash: m.flash, bounce: m.bounce, chip: m.chip, mile: m.mile },
        {
          speeds: { prep: Game.prepRate(shop), oven: Game.ovenRate(shop, city.fit), counter: Game.counterRate(shop), drivers: shop.drivers },
          levels: { prep: shop.prep, oven: shop.ovens, counter: shop.counter, drivers: shop.drivers },
          hired: shop.heads,
          headNames: city.heads[id],
          founder: id === Game.firstHood(city) ? (city.founder?.name ?? null) : null,
        },
        clock,
      );
      ({ speeds: m.speeds, levels: m.levels, flash: m.flash, bounce: m.bounce, chip: m.chip, mile: m.mile } = step.moments);
      for (const st of step.asks) asks.push({ trigger: 'milestone', station: st });
    }
    // a head just hired says hello over their station; several at once (Nonna brings all three) queue up (C77)
    const heads = shop.heads;
    if (m.heads) for (const st of STATIONS_IN_ORDER) if (heads[st] && !m.heads[st]) m.hires.push({ st, text: `${city.heads[id][st]}: ${HIRE_LINE[st]}` });
    m.heads = heads;
    if ((!m.hire || clock - m.hire.at >= 2.5) && m.hires.length) m.hire = { ...m.hires.shift()!, at: clock };
    // ---- head barks (features/heads.ts): a milestone, a rush combo, an attack on this shop, being Head of the Week. One bubble per shop, so
    // nothing starts while a refusal, a hello or a milestone line is up (or a cut-scene plays); the rest of the rules are `nextBark`'s
    const g = useGame.getState();
    const wall = gameNow() / 1000;
    const week = weekStation(g.game, id);
    if (week) asks.push({ trigger: 'week', station: week, key: `week-${getFeature(g.game, headsFeature)?.week ?? 0}` });
    const atk = getFeature(g.game, counterattack) as ReturnType<typeof counterattack.init> | undefined;
    if (atk?.open && atk.target === id) {
      const sp = speakerFor(shop, atk.seenWeek);
      if (sp) asks.push({ trigger: 'attack', station: sp, key: `attack-${atk.seenWeek}` });
    }
    // what the shop shows has held 10 s: a head speaks about a pile-up or idle hands at their station, the manager about the line and the idle drivers (features/service.ts `symptomAsks`)
    asks.push(...symptomAsks(g.game, id));
    // a rush combo: three quick taps inside the window (rush-model.ts), whether or not the kitchen could still go faster (so the pill may be a hint)
    const combo = rushCombo(rushTaps, gameNow()).n >= 3;
    if (combo && !m.combo) {
      const sp = speakerFor(shop, Math.floor(wall / 7));
      if (sp) asks.push({ trigger: 'rush', station: sp });
    }
    m.combo = combo;
    const cv = visitOf(g.game.rewards.boosts, gameNow());
    const cameoSpeaking = !!cv && visitLine(cv.visitor, wall) !== null;
    const otherBubble =
      cameoSpeaking ||
      !!(m.refusal && clock - m.refusal.at < 1.6) ||
      !!(m.hire && clock - m.hire.at < 2.5) ||
      m.hires.length > 0 ||
      !!(m.mile?.text && m.mile.at !== clock && clock - m.mile.at < 2.5);
    const before = barkMemory.get(id) ?? newBarkMem();
    const { mem: after, bark } = nextBark(
      before,
      id,
      asks,
      wall,
      paused || !!g.playing || otherBubble || !hintsAllowed(g.game).toast,
      city.barks ?? NO_BARKS,
      city.managerBarks,
    ); // a city without lines for the shop has silent heads (Boston's wait for the writer pass, copy.ts BOSTON_BARKS);
    if (after !== before) barkMemory.set(id, after);
    if (bark) {
      if (bark.trigger === 'milestone' && m.mile && m.mile.at === clock) m.mile.text = bark.text;
      else m.bark = { st: bark.station, text: bark.text, at: wall };
    }
  });
  const m = mem.current;
  const barkOn = m.bark && nowMs / 1000 - m.bark.at < HEAD_BARKS.seconds ? m.bark : null;
  const weekSt = weekStation(game, id);
  // job timers move between the engine's 200 ms ticks: interpolate from the tick's wall time, never past 0
  const since = paused ? 0 : Math.max(0, (nowMs - useGame.getState().tickAt) / 1000);
  const leftNow = (left: number) => Math.max(0, left - since);
  const auto = Game.automationOf(shop);
  const next = shop.managed ? null : Game.nextStation(shop);
  // the rush pill (GM shops): decided on a 200 ms bucket of the wall clock and the shop's levels, not rebuilt on every 15 fps frame
  const rushBucket = Math.floor(nowMs / 200);
  // eslint-disable-next-line react-hooks/exhaustive-deps -- `key` covers the levels the rates depend on; `rushBucket` is the time
  const rushModel = useMemo(
    () =>
      rushPill({
        managed: shop.managed,
        taps: rushTaps,
        now: rushBucket * 200,
        visitAt,
        kitchenRate: Math.min(Game.prepRate(shop), Game.ovenRate(shop, city.fit), Game.counterRate(shop)),
        demandRate: Game.demandRate(shop, game.vehicle, city.fit),
      }),
    [key, rushTaps, rushBucket, visitAt],
  );
  // back-wall rects the rush pill keeps clear of: the menu board and the ladder's wall props (D406)
  const pillAvoid = useMemo(() => [...(menuRect(lay) ? [menuRect(lay)!] : []), ...wallRects(placed)], [lay, placed]);
  const badges = badgeModels({ line, auto, managed: shop.managed, next, tapBatch: Game.tapBatch(shop), since });
  // the "tap me" pulse and the miss nudge step on the 7.5 Hz pose clock, 6 levels, so the badge memo holds (M43)
  const poseT = Math.floor(clock * 7.5) / 7.5;
  const pulse = Math.round(((Math.sin(poseT * Math.PI * 2 * 1.2) + 1) / 2) * 5) / 5;
  const nudge = clock - m.hintAt < 0.45 ? Math.round(Math.sin(((clock - m.hintAt) / 0.45) * Math.PI) * 5) / 5 : 0;
  const rushJump = clock - m.rushAt < 0.2 ? Math.round((1 - (clock - m.rushAt) / 0.2) * 4) / 4 : 0;
  const rects = useMemo(() => stationRects(lay, MIN_TAP_PT / fit.s), [lay, fit.s]);
  const bxs = useMemo(() => badgeXs(lay), [lay]);
  const by = badgeRowY();
  const walls = useMemo(() => bubbleWalls(lay), [lay]);
  const geoRegister = useMemo(() => P(lay.staff[0] + 12, 70, 78, frame), [lay, frame]);
  // the pass is the counter's end nearest the ovens, and the "ding!" bubble stands on the counter's side of the bank: the other way round in the mirrored plan
  const geoPass = useMemo(() => P(lay.mirrored ? lay.counter.x1 - 8 : lay.counter.x0 + 8, 70, 40, frame), [lay, frame]);
  const dingAt = useMemo(() => {
    const top = Math.max(...lay.ovens.map((o) => o.z + o.h));
    const bank = lay.mirrored ? lay.ovenCols[0].x0 - 2 : lay.ovenCols[lay.ovenCols.length - 1].x1 + 2;
    return P(bank, D, top * 0.55, frame).map((v, i) => (i === 0 ? v + (lay.mirrored ? -22 : 22) : v)) as [number, number];
  }, [lay]);
  const flicker = running ? Math.sin(clock * 9) * 1.4 : 0;
  const rushK = (clock - m.rushAt) / 0.6;
  const rushC = useMemo(() => P((lay.ovenCols[0].x0 + lay.ovenCols[lay.ovenCols.length - 1].x1) / 2, D - 6, 50, frame), [lay, frame]);
  const refusal = hints.refusal && m.refusal && clock - m.refusal.at < 1.6 ? m.refusal : null;
  // the visitor's line shows only while no head's bubble does (one bubble per shop)
  const visitSays = visitLineNow && !barkOn && !refusal && !(m.hire && clock - m.hire.at < 2.5) ? visitLineNow : null;
  const mileAge = m.mile ? clock - m.mile.at : -1;
  const mileLine = m.mile?.text && mileAge < 2.5 ? m.mile.text : null;
  // D415: the badge's centre (over the station's furniture, below the chip row), and the speed-up pill that rides in it instead of rising over the chips
  const mileAt = m.mile && mileAge < MILE_SECONDS ? mileAnchor(rects[m.mile.st], by, stationHatTop(lay, m.mile.st), frame.x0 + frame.width) : null;
  const mileFlash = m.mile && m.flash && m.flash.st === m.mile.st && m.flash.at === m.mile.at ? m.flash : null;
  const flash = next && clock - m.hintAt < 0.3 ? rects[next] : null;

  // ---- off-screen cues (scroll-cues-model.ts): what wants the player, where it is in the shop, and which side of the screen it is off
  const spotOf = (st: Station): KitchenSpot => (st === 'oven' ? 'ovens' : st);
  const stationXs: Record<KitchenSpot, number> = { prep: bxs.prep + shift, ovens: bxs.oven + shift, counter: bxs.counter + shift };
  const lastOven = lay.ovens[lay.ovens.length - 1];
  const bubbleSt = refusal ? refusal.st : mileLine && m.mile ? m.mile.st : m.hire && clock - m.hire.at < 2.5 ? m.hire.st : barkOn ? barkOn.st : null;
  const jamOn = layerOf(city, id) === 'shifts' && jamView(game).jammed;
  const wants = view.scrolls
    ? wantsOf({
        // the stations with a pile-up
        piling: (['prep', 'ovens', 'counter'] as const).filter((k) => rep.symptoms[k] === 'piling'),
        jam: jamOn,
        bubble: bubbleSt ? spotOf(bubbleSt) : null,
        tap: next ? spotOf(next) : null,
        xs: stationXs,
        jamX: P((lastOven.x0 + lastOven.x1) / 2, D - 6, 0, frame)[0] + shift,
      })
    : [];
  const cues = cuesFor(wants, scrollX.current, width, fit, view.maxScroll);
  // G111: a cue keeps 8 pt clear of the tappables on screen; the jam's wrench (the jam overlay's 44 pt button, placed by the same `wrenchSpot` from the same `shopLayout` the overlay uses, so the two agree wherever it puts it) is the one a cue met
  const avoid: PtRect[] = [];
  if (jamOn) {
    const o = wrenchSpot(drawLay);
    avoid.push(wrenchRect(fit.ox + o.x * fit.s, fit.oy + o.y * fit.s, WRENCH, scrollX.current));
  }
  const cueTop = Math.round(fit.oy + (by + 56) * fit.s);
  const leftTop = cues.left ? clearCueTop('left', cueTop, width, height, avoid) : cueTop;
  const rightTop = cues.right ? clearCueTop('right', cueTop, width, height, avoid) : cueTop;
  // scroll the shop (a tap on a cue, or on a lamp of the shop report: `askScroll`); the position is kept for the session like a drag's
  const goTo = (x: number) => {
    const to = Math.max(0, Math.min(view.maxScroll, x));
    scroller.current?.scrollTo({ x: to, y: 0, animated: true });
    useGame.getState().setSceneScroll(id, to);
  };
  // the Coach's targets (scene/coach-rects.ts): reported after layout and whenever the footprint, the oven count, the screen size or the scroll changes (an event, never a frame);
  // the registry ignores a rect that has not moved, so a settled scroll costs nothing
  coachIn.current = { lay, fit };
  // eslint-disable-next-line react-hooks/exhaustive-deps -- `lay` changes with the footprint and the oven count; the fit with the screen's size
  useEffect(() => {
    measureOrigin();
  }, [lay, fit.s, fit.ox, fit.oy, width, height]);
  useEffect(() => {
    reporter.start();
    return () => reporter.stop();
  }, [reporter]);
  coachRuns.current = game.tutorial >= 1 && game.tutorial < Game.TUTORIAL_DONE;
  const askRef = useRef<(t: ScrollTarget) => void>(() => {});
  askRef.current = (t) => {
    if (!view.scrolls) return;
    const tablesX = lay.tables.length ? lay.tables.reduce((a, tb) => a + tb.x, 0) / lay.tables.length : frame.vanishX;
    const x = t === 'floor' ? P(tablesX, 20, 0, frame)[0] + shift : t === 'door' ? P(lay.door.cx, 0, 0, frame)[0] + shift : stationXs[t];
    goTo(openScroll(x, fit.s, width, view.maxScroll));
  };
  useEffect(() => onScrollAsk((t) => askRef.current(t)), []);
  // where a wide shop opens: the counter in view, or where the player left it (the scroll position is kept in the store for the session, not saved)
  const [startX] = useState(() =>
    shopOpenScroll(useGame.getState().sceneScroll[id], P((lay.counter.x0 + lay.counter.x1) / 2, 74, 0, frame)[0] + shift, fit.s, width, view.maxScroll),
  );
  const drawing = (
    <>
      <Pressable
        testID="shop"
        accessibilityRole="button"
        accessibilityLabel={`${nd.name} pizzeria`}
        accessibilityHint={shop.managed ? 'Double tap to rush the kitchen' : 'Double tap to make the next batch'}
        style={{ position: 'absolute', left: 0, top: 0, width: cw, height }}
        // re-measure on every touch: an ancestor can move without this view's own layout changing (C76)
        onPressIn={(e) => {
          measureOrigin();
          touchAt.current = { x: e?.nativeEvent?.pageX ?? 0, y: e?.nativeEvent?.pageY ?? 0 };
        }}
        onPress={(e) => {
          // page coordinates minus the view's measured origin: `locationX` is relative to whichever SVG child was
          // hit on web, so it can't place a tap on a station (every tap used to land on the oven)
          const ne = e?.nativeEvent;
          const isNum = (v: unknown): v is number => typeof v === 'number' && Number.isFinite(v);
          // a drag that moved the finger TAP_SLOP or more was a scroll of the wide shop, not a tap on it
          if (view.scrolls && isNum(ne?.pageX) && isNum(ne?.pageY) && !isTap(touchAt.current, { x: ne.pageX, y: ne.pageY })) return;
          const lx = isNum(ne?.pageX) ? ne.pageX - origin.current.x : ne?.locationX;
          const ly = isNum(ne?.pageY) ? ne.pageY - origin.current.y : ne?.locationY;
          const x = isNum(lx) ? screenToScene(lx, scrollX.current, fit) - shift : frame.vanishX;
          const y = isNum(ly) ? (ly - fit.oy) / fit.s : 300;
          // a GM shop: any tap is a rush (every running job finishes sooner); otherwise the station under the finger
          if (shop.managed) {
            m.rushAt = clock;
            emitAudio({ type: 'rush' });
            onTap();
            return;
          }
          // a badge counts as its station (G79); a miss nudges the hand and outlines the station to tap
          const st = badgeAt(bxs, by, x, y, MIN_TAP_PT / fit.s) ?? stationAt(rects, x, y);
          if (st) {
            const reason = onStation(st);
            emitAudio({ type: reason ? 'full' : 'tap' });
            m.refusal = reason ? { st, at: clock, text: reason } : null;
          } else {
            m.hintAt = clock;
            emitAudio({ type: 'full' });
          }
        }}
      >
        {/* the drawing is decoration for a screen reader: the pizzeria's name and what a tap does are the Pressable's label */}
        <Svg
          width={cw}
          height={height}
          accessibilityElementsHidden
          importantForAccessibility="no-hide-descendants"
          viewBox={`${-fit.ox / fit.s} ${-fit.oy / fit.s} ${cw / fit.s} ${height / fit.s}`}
        >
          <SceneDefs grades={city.fit.ovenGrades} />
          <Backdrop id={art} L={roomLay.L} R={roomLay.R} w={sceneFrame.width} />
          {CLOUDS.map((c, i) => (
            <Cloud key={i} x={((c.x0 + clock * c.v) % driftSpan) - 100} y={c.y} k={c.k} dusk={art === 'uptown'} />
          ))}
          {evLook.dusk && <DuskTint x={-fit.ox / fit.s} y={-fit.oy / fit.s} w={cw / fit.s} h={frontY + fit.oy / fit.s} />}
          <Sidewalk frontY={frontY} w={sceneFrame.width} />
          <Street w={sceneFrame.width} />
          {/* everything in the room and on the sidewalk is drawn in the draw space (a wide shop's group is moved right by its shift) */}
          <G transform={worldT}>
            {/* the room's walls are handed (the menu board, the window, the pantry): the mirrored plan draws the plain plan's and flips it, its lettering kept upright */}
            <Flip on={lay.mirrored} axis={frame.vanishX}>
              <RoomShell
                id={art}
                lay={plainOf(lay)}
                wall={nd.wall}
                fp={fp}
                flooring={shop.decor.flooring}
                walls={shop.decor.walls}
                signage={shop.decor.signage}
                plants={shop.decor.plants}
              />
            </Flip>
            <OvenHood lay={lay} grade={shop.grade} mural={shop.decor.walls >= 3} tier={ovenTier(shop.ovens)} />
            {/* rush tap: the oven bank pulses (the jobs finish sooner; cash still waits for the pies to leave) */}
            {(() => {
              const pulse = rushK >= 0 && rushK < 0.25 ? 1 + 0.05 * Math.sin((rushK / 0.25) * Math.PI) : 1;
              return (
                <G
                  transform={
                    pulse !== 1
                      ? `translate(${rushC[0]} ${rushC[1]}) scale(${pulse}) translate(${-rushC[0]} ${-rushC[1]})`
                      : bouncing === 'oven'
                        ? bounceT.oven[bounceNow]
                        : undefined
                  }
                >
                  {lay.ovens.map((o, i) => (
                    <Oven
                      key={i}
                      o={o}
                      grade={shop.grade}
                      grades={city.fit.ovenGrades}
                      lit={shop.managed ? running : !!line.oven}
                      hot={!!line.oven}
                      flicker={flicker * (i % 2 ? -1 : 1)}
                      tier={ovenTier(shop.ovens)}
                      skin={fin.ovenSkin}
                    />
                  ))}
                </G>
              );
            })()}
            {items.map((it) => it.el)}
            {/* D522: the tutorial's look at the ovens (its target is `ovens:all`) shows what the upgrade bought, on the oven the coach lights */}
            {ovenLook &&
              (() => {
                const gain = ovenGain(shop, city.fit);
                const at = gain && gainAnchor(lay);
                return gain && at ? <OvenGainTag x={at.x} y={at.y} level={gain.level} pct={gain.pct} /> : null;
              })()}
            {rep.state === 'cold' && <ColdFrost x={frame.x0 - 20} w={frame.width + 40} frontY={frontY} />}
          </G>
          {trafficFor(CARS, rivalOpen(game, id)).map((c, i) => {
            const dir = c.lane === 0 ? -1 : 1;
            const raw = (c.offset + clock * c.speed) % driftSpan;
            const x = dir === 1 ? raw - 100 : sceneFrame.width + 100 - raw;
            return (
              <G key={i} transform={`translate(${x} ${c.lane === 0 ? CURB_Y + 30 : CURB_Y + 70}) scale(0.86)`}>
                <Car x={0} y={0} color={c.color} kind={c.kind} dir={dir as 1 | -1} />
              </G>
            );
          })}
          {evLook.lights && <StringLights x0={8} x1={sceneFrame.width - 8} y={104} />}
          {/* the badges, bubbles and pops sit over the room: the same moved group */}
          <G transform={worldT}>
            {/* the neon counter sign hangs over the register, in front of the wall (cosmetics.ts `neonSpot`; G99) */}
            {fin.neon &&
              (() => {
                const n = neonSpot(lay);
                return (
                  <G transform={`translate(${n.cx} ${n.rect.y1 - 1.2}) scale(${NEON_W / 38})`}>
                    <NeonCounterSign />
                  </G>
                );
              })()}
            {/* the day-30 visitor's tag over their head, and their line above it (cameo.ts), over the front wall */}
            {visit && cameo && <CameoTag x0={cameo.tag.x0} x1={cameo.tag.x1} y0={cameo.tag.y0} y1={cameo.tag.y1} text={visitTagText} />}
            {cameo && visitSays && !mileLine && (
              <CameoBubble
                sceneW={span.x1}
                x0={span.x0}
                tail={cameo.tailX}
                y={cameo.sayY}
                drop={cameo.tailDrop}
                text={sayLines(visitSays).join('\n')}
                wall0={walls.x0}
                wall1={walls.x1}
              />
            )}
            {/* station badges: ring timer, pies in the job, a hand on the station to tap, the head who runs it */}
            {/* a miss outlines the station to tap for a moment (G79) */}
            {flash && (
              <Rect
                x={flash.x0}
                y={flash.y0}
                width={flash.x1 - flash.x0}
                height={flash.y1 - flash.y0}
                rx={8}
                fill="none"
                stroke="#fff"
                strokeWidth={2.5}
                opacity={0.9}
              />
            )}
            {/* the ticket rail the badges hang on (D346) */}
            {/* D415: the whole chip row dims while a milestone badge is up */}
            <G opacity={hudOpacity(mileAge)}>
              <BadgeRail
                x0={lay.mirrored ? bxs.counter - BADGE_R - 40 : bxs.prep - BADGE_R - 8}
                x1={lay.mirrored ? bxs.prep + BADGE_R + 8 : bxs.counter + BADGE_R + 40}
                y={by}
                gm={shop.managed ? (id === Game.firstHood(city) && city.founder ? 'nonna' : city.managers[id].id) : null}
              />
              {/* D523: while a coach step is lit its own hand points; the dial's "tap me" hand and pulse wait */}
              {badges.map((b) => (
                <StationBadge
                  key={b.st}
                  x={bxs[b.st]}
                  y={by}
                  st={b.st}
                  step={b.step}
                  count={b.count}
                  tone={b.tone}
                  ready={b.ready && hints.refusal}
                  pulse={b.ready && hints.refusal ? pulse : 0}
                  nudge={b.ready && hints.refusal ? nudge : 0}
                  face={b.runner === 'head' ? b.st : null}
                  faceName={b.runner === 'gm' ? city.managers[id].id : city.heads[id][b.st]}
                  jump={line[b.st] ? rushJump : 0}
                  rank={shop.heads[b.st] ? rankOf(stationLevel(shop, b.st)) : 0}
                  star={weekSt === b.st}
                />
              ))}
            </G>
            {/* a refused tap says why, just under the station's badge (D348) */}
            {refusal && (
              <HireBubble sceneW={span.x1} x0={span.x0} x={bxs[refusal.st]} y={by + 40} text={refusal.text} wall0={walls.x0} wall1={walls.x1} tone="refusal" />
            )}
            {/* a milestone line (Lv 25 / 50 / 100) from the station's head beats a hello and the rush pill */}
            {/* D415: directly under the badge, over the station's furniture, never over the chip row */}
            {!refusal &&
              mileLine &&
              m.mile &&
              (() => {
                const a = mileAnchor(rects[m.mile.st], by, stationHatTop(lay, m.mile.st), frame.x0 + frame.width);
                return <HireBubble sceneW={span.x1} x0={span.x0} x={a.cx} y={mileSpeechY(a.cy)} text={mileLine} wall0={walls.x0} wall1={walls.x1} />;
              })()}
            {!refusal && !mileLine && m.hire && clock - m.hire.at < 2.5 && (
              <HireBubble sceneW={span.x1} x0={span.x0} x={bxs[m.hire.st]} y={by + 40} text={m.hire.text} wall0={walls.x0} wall1={walls.x1} />
            )}
            {/* a head's bark takes the same spot under its badge, clamped inside the walls (D440); the rush pill gives way to it */}
            {!refusal && !mileLine && !(m.hire && clock - m.hire.at < 2.5) && barkOn && (
              <HireBubble sceneW={span.x1} x0={span.x0} x={bxs[barkOn.st]} y={by + 44} text={barkOn.text} wall0={walls.x0} wall1={walls.x1} />
            )}
            {/* a General Manager shop: "Tap to rush!" until the first tap, then the combo; a head's hello takes the spot while it shows */}
            {/* D406: under the oven chip, ≤ 120 wide, moved clear of the menu board and the ladder's wall props */}
            {rushModel && !refusal && !mileLine && !barkOn && !(m.hire && clock - m.hire.at < 2.5) && (
              <RushPill
                sceneW={span.x1}
                x0={span.x0}
                x={clearPillX(bxs.oven, rushPillWidth(rushModel.text), by + 26, by + 44, pillAvoid, span.x1, span.x0)}
                y={by + 40}
                kind={rushModel.kind}
                text={rushModel.text}
                pulse={rushModel.pulse ? pulse : 0}
              />
            )}
            {/* a finished bake: "ding!" at the oven and the pies slide onto the pass (P3) */}
            {m.slide &&
              clock - m.slide.at < 0.7 &&
              (() => {
                const k = (clock - m.slide.at) / 0.7;
                const [ax, ay] = rushC;
                const [bx, byy] = geoPass;
                const x = ax + (bx - ax) * Math.min(1, k * 1.3);
                const y = ay + (byy - ay) * Math.min(1, k * 1.3) - Math.sin(Math.min(1, k * 1.3) * Math.PI) * 10;
                return (
                  <G opacity={k > 0.8 ? (1 - k) / 0.2 : 1}>
                    <Circle cx={x} cy={y} r={7} fill="#E9A64B" stroke={INK} strokeWidth={1} />
                    <Circle cx={x} cy={y} r={5.2} fill="#FFC531" />
                    <Circle cx={x - 2} cy={y - 1} r={1.3} fill="#E8432E" />
                    <Circle cx={x + 2.2} cy={y + 1.4} r={1.2} fill="#E8432E" />
                    {/* D371: beside the oven bank, its tail pointing at it, never over an oven door */}
                    <G transform={`translate(${dingAt[0]} ${dingAt[1] - k * 6})`}>
                      <Path
                        d="M-17 -2 L-23 1 L-17 4 Z"
                        fill="#fff"
                        stroke={INK}
                        strokeWidth={1.1}
                        strokeLinejoin="round"
                        transform={lay.mirrored ? 'scale(-1 1)' : undefined}
                      />
                      <Rect x={-17} y={-9} width={34} height={16} rx={8} fill="#fff" stroke={INK} strokeWidth={1.1} />
                      <SvgText x={0} y={3} fontFamily={F.bold} fontSize={11} fill={INK} textAnchor="middle">
                        ding!
                      </SvgText>
                    </G>
                  </G>
                );
              })()}
            {/* what an upgrade did: "+50% faster" rising from the station's badge (P5) */}
            {m.flash &&
              clock - m.flash.at < 0.9 &&
              m.flash !== mileFlash &&
              (() => {
                const k = (clock - m.flash.at) / 0.9;
                const fx = m.flash.st === 'door' ? P(lay.door.cx, 0, 80, frame)[0] : bxs[m.flash.st];
                const fy = m.flash.st === 'door' ? P(lay.door.cx, 0, 80, frame)[1] : by + 34 + CHIP_ROW_HALF + ROW_AIR - 4;
                const w = m.flash.text.length * 7 + 16;
                const px = Math.min(frame.x0 + frame.width - 4 - w / 2, Math.max(frame.x0 + 4 + w / 2, fx));
                return (
                  <G transform={`translate(${px} ${fy - k * (m.flash.st === 'door' ? 24 : 14)})`} opacity={k > 0.75 ? (1 - k) / 0.25 : 1}>
                    <Rect x={-w / 2} y={-11} width={w} height={20} rx={10} fill="#2E8B3E" stroke="#fff" strokeWidth={1.4} />
                    <SvgText x={0} y={4} fontFamily={F.bold} fontSize={13} fill="#fff" textAnchor="middle">
                      {m.flash.text}
                    </SvgText>
                  </G>
                );
              })()}
            {/* a station just levelled up: a cream "Lv N" chip rises 20 from its furniture (the drivers': from the door), stopping under the chip row (D418);
              a milestone shows its own badge instead */}
            {m.chip &&
              clock - m.chip.at < CHIP_SECONDS &&
              !(m.mile && m.mile.at === m.chip.at && mileAge < MILE_SECONDS) &&
              (() => {
                const k = (clock - m.chip.at) / CHIP_SECONDS;
                const text = m.chip.text;
                const r = Math.max(13, text.length * 3.4 + 4);
                const door = [P(lay.door.cx, 0, 80, frame)[0] - 34, P(lay.door.cx, 0, 80, frame)[1] - 18] as const;
                const rect = m.chip.st === 'drivers' ? { x0: door[0], x1: door[0], y0: door[1], y1: door[1] } : rects[m.chip.st];
                const at = chipAt(rect, by, r, k, CHIP_RISE);
                return (
                  <G
                    transform={`translate(${Math.min(frame.x0 + frame.width - 4 - r, Math.max(frame.x0 + 4 + r, at.x))} ${at.y})`}
                    opacity={k > 0.75 ? (1 - k) / 0.25 : 1}
                  >
                    <Circle cx={0} cy={0} r={r} fill="#FFF8EA" stroke={INK} strokeWidth={1.1} />
                    <SvgText x={0} y={3.8} fontFamily={F.bold} fontSize={11} fill={INK} textAnchor="middle">
                      {text}
                    </SvgText>
                  </G>
                );
              })()}
            {/* D415: Lv 25 / 50 / 100 on prep, ovens, counter: a 72 pt gold badge centred over the station, confetti bursting from behind it (drawn first, so never over the text) */}
            {m.mile && mileAt && (
              <MilestoneBadge
                x={mileAt.cx}
                y={mileAt.cy}
                level={`Lv ${m.mile.level}`}
                label={STATION_LABEL[m.mile.st]}
                sub={mileSub(mileFlash?.text ?? null)}
                scale={mileScale(mileAge)}
                opacity={mileOpacity(mileAge)}
                step={confettiStep(mileAge)}
                color={city.neighbourhoods[nIdx].color}
              />
            )}
            <DeparturePops
              sceneW={frame.x0 + frame.width}
              x0={frame.x0}
              deps={line.departures}
              left={(d) => leftNow(d.left)}
              anchor={(d) => carriers.get(d.id) ?? null}
              register={geoRegister}
            />
          </G>
        </Svg>
      </Pressable>
      {/* the SCENE_OVERLAYS slot: above the floor and furniture, below the HUD; nothing while the slot is empty */}
      <SceneViewContext.Provider value={overlayView}>
        <SceneOverlays shopId={id} width={cw} height={height} />
      </SceneViewContext.Provider>
    </>
  );
  return (
    <View ref={viewRef} onLayout={measureOrigin} style={{ width, height, overflow: 'hidden' }}>
      {view.scrolls ? (
        // a wide shop: the drawing (and every overlay anchored to a place in it) sits in a sideways scroll view; no vertical scroll, no zoom
        <ScrollView
          ref={scroller}
          horizontal
          testID="shop-scroll"
          showsHorizontalScrollIndicator={false}
          bounces={false}
          alwaysBounceVertical={false}
          scrollEventThrottle={16}
          contentOffset={{ x: startX, y: 0 }}
          onLayout={() => {
            // once, on web (which ignores `contentOffset`): never again, so a later layout cannot pull the shop back from where the player scrolled it
            if (opened.current) return;
            opened.current = true;
            scrollX.current = startX;
            scroller.current?.scrollTo({ x: startX, y: 0, animated: false });
            reporter.report();
          }}
          onScroll={(e) => {
            scrollX.current = e.nativeEvent.contentOffset.x;
            if (coachRuns.current) reporter.report();
          }}
          onScrollEndDrag={(e) => {
            useGame.getState().setSceneScroll(id, e.nativeEvent.contentOffset.x);
            reporter.report();
          }}
          onMomentumScrollEnd={(e) => {
            useGame.getState().setSceneScroll(id, e.nativeEvent.contentOffset.x);
            reporter.report();
          }}
          style={{ width, height }}
          contentContainerStyle={{ width: cw, height }}
        >
          {drawing}
        </ScrollView>
      ) : (
        drawing
      )}
      {view.scrolls && (
        <ScrollCues
          leftKind={cues.left?.kind ?? ''}
          leftWord={cues.left?.word ?? ''}
          leftLabel={cues.left?.label ?? ''}
          leftScroll={cues.left?.scrollTo ?? 0}
          rightKind={cues.right?.kind ?? ''}
          rightWord={cues.right?.word ?? ''}
          rightLabel={cues.right?.label ?? ''}
          rightScroll={cues.right?.scrollTo ?? 0}
          leftTop={leftTop}
          rightTop={rightTop}
          onGo={goTo}
        />
      )}
    </View>
  );
});

/**
 * The static furniture layer, painter-sorted later with the cast. Reads only `lay`, `fin` and the ladder props placed from
 * them, so memoising on those is complete. `st` tags the pieces that bounce when their station is bought.
 */
function buildFurniture(lay: Layout, fin: FurnitureInputs, ladder: readonly Placed[]): { y: number; el: ReactElement; st?: Bounced }[] {
  type Item = { y: number; el: ReactElement; st?: Bounced };
  const f: Item[] = [];
  // tables + seated diners: chairs, then the diner, then the table over their lap
  lay.tables.forEach((tb, i) => {
    if (lay.tables.length === 1) f.push({ y: tb.y + 12, el: <Rug key="rug" x={tb.x} y={tb.y} /> });
    f.push({ y: tb.y + 0.6, el: <Table key={`tb${i}`} x={tb.x} y={tb.y} tier={fin.tableTier} part="back" /> });
    f.push({ y: tb.y - 0.6, el: <Table key={`tf${i}`} x={tb.x} y={tb.y} tier={fin.tableTier} part="front" /> });
  });
  // potted plants (plants decor); the corner fern only stands in a starter room, before a front row of tables
  // (the mirrored plan stands its corner props at the wall far from the door too: that is the right wall there)
  const farWall = (dx: number) => (lay.mirrored ? lay.R - dx : lay.L + dx);
  if (fin.plants >= 1 && !lay.tables.some((tb) => tb.y === FRONT_ROW_Y)) f.push({ y: 2, el: <FloorPlant key="pp1" x={farWall(4)} y={2} k={0.8} /> });
  if (fin.plants >= 3) f.push({ y: 112, el: <WallPlanter key="pp4" lay={lay} /> });
  f.push({ y: 66, st: 'prep', el: <PrepBench key="prep" lay={lay} prep={fin.prep} dough={fin.dough} /> });
  // the wide tiers' second prep table, beside the first: the same bench with no dough and nobody at it (the layout's `prep2` stands where the first one would)
  if (lay.prep2) f.push({ y: 66, st: 'prep', el: <PrepBench key="prep2" lay={{ ...lay, prep: lay.prep2, cooks: [] }} prep={fin.prep} dough={0} /> });
  f.push({ y: 64, st: 'counter', el: <Counter key="counter" lay={lay} boxes={fin.boxes} /> });
  // the visual ladder: bench, counter and street props bounce with their station; the wall ones stay put
  for (const p of ladder)
    f.push({
      y: p.sortY,
      st: p.mount === 'wall' ? undefined : p.station === 'drivers' ? 'drivers' : p.station === 'prep' ? 'prep' : 'counter',
      el: <LadderPiece key={`lp-${p.id}`} id={p.id} ax={p.ax} ay={p.ay} k={p.k} n={p.n} v={fin.vehicle} mint={fin.scooterMint} />,
    });
  // front of the shop + sidewalk props
  // the facade is handed (the doorway's post and brick, the hanging sign): the mirrored plan draws the plain plan's and flips it, its lettering kept upright
  const flip = { on: lay.mirrored, axis: lay.frame.vanishX };
  f.push({
    y: 0,
    el: (
      <Flip key="front" {...flip}>
        <FrontWall
          lay={plainOf(lay)}
          name={fin.name}
          signage={fin.signageTier}
          plants={fin.plants}
          id={fin.id}
          facadeSkin={fin.facadeSkin}
          awningGold={fin.awningGold}
          awningFounder={!!fin.awningFounder}
          plaque={fin.plaque}
        />
      </Flip>
    ),
  });
  f.push({ y: -1, el: <Doormat key="mat" lay={lay} /> });
  if (lay.ledge) {
    f.push({ y: STOOL_Y, el: <Stools key="stools" x0={lay.ledge.x0} x1={lay.ledge.x1} /> });
    f.push({ y: LEDGE_Y, el: <LedgeBar key="ledge" x0={lay.ledge.x0} x1={lay.ledge.x1} /> });
  }
  if (fin.fp === 0) f.push({ y: 8, el: <FloorProp key="fprop" id={fin.id} x={farWall(22)} y={8} /> });
  // a shop with no manager has a taller sidewalk row: its sidewalk props would stand on the front sill (D356), so
  // the sidewalk there stays clear apart from the mat (the hire bar is the focus)
  if (!fin.idleShop) f.push({ y: SIGN_Y, el: <ChalkSign key="sign" x={lay.sign.x} y={SIGN_Y} k={1} /> });
  f.push({
    y: 16,
    el: (
      <Flip key="leaf" {...flip}>
        <DoorLeaf lay={plainOf(lay)} />
      </Flip>
    ),
  });
  if (!fin.idleShop) {
    // the potted tree stays fully on screen (its pot is ~14 wide) in the widest rooms
    f.push({ y: TREE_Y, el: <Planter key="pl" x={lay.tree.x} y={TREE_Y} /> });
    // the neighbourhood's sidewalk signature (v5.0): always drawn now, in the room layout.ts keeps clear for it (D414)
    const [qx, qy] = P(lay.prop.x, PROP_Y, 0, lay.frame);
    f.push({ y: PROP_Y, el: <StreetProp key="street" id={fin.id} x={qx} y={qy} /> });
  }
  if (!fin.idleShop) {
    const [scx, scy] = P(lay.scooter.x, lay.scooter.y, 0, lay.frame);
    f.push({ y: lay.scooter.y, st: 'drivers', el: <ParkedVehicle key="scooter" x={scx} y={scy} v={fin.vehicle} mint={fin.scooterMint} /> });
  }
  return f;
}
