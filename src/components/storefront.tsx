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
import { Pressable, View } from 'react-native';
import Svg, { Circle, G, Path, Rect, Text as SvgText } from 'react-native-svg';
import { F } from '../theme';
import { FOOTPRINTS, NEIGHBORHOODS } from '../content/tuning';
import type { NeighborhoodId } from '../content/types';
import * as Game from '../engine/game';
import { useGame } from '../store/game-store';
import { emitAudio } from '../audio/bus';
import { CHEER_SECONDS, emitPayout, onCheer } from './pulse-bus';
import { Backdrop } from './scene/background';
import { useClock } from './scene/clock';
import { SceneDefs } from './scene/defs';
import { FRONT_ROW_Y, LEDGE_Y, PROP_Y, SIGN_Y, STOOL_Y, TREE_Y, layout, moreTagRect, waitTagRect, type Layout } from './scene/layout';
import { seatPalette } from './scene/palette';
import { GUEST_SHIRTS, HAIR_COLORS, hash32, Person } from './scene/people';
import { CURB_Y, D, INK, P, SCENE_W, sceneFit, unprojectX } from './scene/projection';
import { Counter, FloorPlant, FloorProp, LedgeBar, Oven, OvenHood, PrepBench, Rug, Stools, Table, WallPlanter } from './scene/props';
import { ovenTier } from './scene/geometry';
import { furnitureDeps, furnitureInputs, ladderInput, type FurnitureInputs } from './scene/furniture-inputs';
import { LadderPiece } from './scene/ladder-props';
import { neonSpot } from './scene/cosmetics';
import { VISITOR_LOOK, cameoGeom, sayLines, visitLine, visitOf, visitTag } from './scene/cameo';
import {
  CHIP_RISE, CHIP_SECONDS, MILESTONE_LINES, bounceStep, bounceTransforms, clearPillX, confettiStep, crossedMilestone,
  ladderProps, menuRect, milestoneSpeaker, wallRects, type Placed,
} from './scene/ladder';
import { ChalkSign, DoorLeaf, Doormat, FrontWall, Planter, RoomShell, SceneOverlays, StreetProp } from './scene/room';
import { Car, CARS, Cloud, ParkedVehicle, Sidewalk, sidewalkItems, Street } from './scene/street';
import { buildCast, sidewalkOf } from './scene/cast';
import { queueLabel, waitingText } from './scene/waiting';
import { hireOnSidewalk } from './sidewalk-model';
import { LINE, STATIONS_IN_ORDER, type Station } from '../engine/pipeline';
import { HEAD_BARKS } from '../content/heads';
import { getFeature } from '../engine/features';
import { counterattack } from '../engine/features/counterattack';
import { heads as headsFeature, newBarkMem, nextBark, rankOf, speakerFor, stationLevel, weekStation, type BarkAsk, type BarkMem } from '../engine/features/heads';
import { HEADS } from '../content/tuning';
import { BadgeRail, CameoBubble, CameoTag, DeparturePops, HireBubble, MilestoneBadge, RushPill, StationBadge, rushPillWidth } from './scene/kitchen-hud';
import { CHIP_ROW_HALF, MILE_SECONDS, ROW_AIR, STATION_LABEL, bubbleWalls, chipAt, hidesWaitingPill, hudOpacity, mileAnchor, mileOpacity, mileScale, mileSpeechY, mileSub, stationHatTop } from './scene/moments';
import { rushPill } from './rush-model';
import { emptyCrew, stepCrew, type CrewState } from './scene/crew';
import { emitCoin } from './pulse-bus';
import { BADGE_R, COIN_FLIGHT, badgeAt, badgeModels, badgeRowY, badgeXs, MIN_TAP_PT, placePops, popsCover, spotlightCutout, stationAt, stationRects, tutorialHand } from './scene/stations';

export { CURB_Y, SCENE_H, SCENE_W, sceneFit } from './scene/projection';

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
  /** Nonna's tutorial points at this station: dim the rest of the scene around it (D367). */
  spotlight?: Station | null;
  /** The spotlit step is a wait (G83): a breathing ring and a resting hand instead of the tap bounce. */
  spotlightWait?: boolean;
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
const DRIFT_SPAN = SCENE_W + 200;

/** The four stations whose level buys bounce their furniture (v5.11); ovens are 'oven' as everywhere else. */
type Bounced = Station | 'drivers';
const BOUNCED: readonly Bounced[] = ['prep', 'oven', 'counter', 'drivers'];

const STAGE_STATION: Record<Game.Stage, Station> = { prep: 'prep', ovens: 'oven', counter: 'counter', customers: 'counter' };
const HIRE_LINE: Record<Station, string> = { prep: 'I got the dough, boss!', oven: 'Ovens are mine now.', counter: 'Next customer, please!' };



/** Each shop's last head bubble and the once-only ones already spoken, kept across visits so the 20 s gap and "one star per week" hold when the scene remounts (features/heads.ts `nextBark`). */
const barkMemory = new Map<NeighborhoodId, BarkMem>();

/** Per-shop character seed (stable crowd per neighbourhood). */
const seedFor = (id: string) => Array.from(id).reduce((h, ch) => (h * 31 + ch.charCodeAt(0)) % 997, 7) * 97;

/**
 * Re-renders on its own 15 fps clock (reading the latest game state each frame) and when the shop's
 * upgrades change. The parent's 200 ms game ticks don't re-render it, and a paused scene stays still.
 */
export const Storefront = memo(function Storefront({ id, width, height, paused, onTap, onStation, spotlight = null, spotlightWait = false }: Props) {
  // Opt out of React Compiler memoisation: this component deliberately reads the live store
  // (useGame.getState()) on every clock frame, which auto-memoisation could otherwise cache.
  'use no memo';
  const clock = useClock(15, paused);
  useGame((s) => sceneKey(s.game, id));
  // the last rush taps (wall ms, newest last): the store replaces the array on a tap, so this is a stable dependency
  const rushTaps = useGame((s) => s.rushTaps);
  const game = useGame.getState().game;
  const shop = game.shops[id];
  const nd = Game.def(id);
  const fp = shop.footprint;
  // where this view sits on the page, for turning a tap's pageX/pageY into scene coordinates
  const viewRef = useRef<ComponentRef<typeof View>>(null);
  const origin = useRef({ x: 0, y: 0 });
  const measureOrigin = () => viewRef.current?.measureInWindow((x: number, y: number) => {
    origin.current = { x, y };
  });
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
    speeds: null as null | { prep: number; oven: number; counter: number; drivers: number },
    flash: null as null | { st: Station | 'door'; at: number; text: string },
    /** Station levels last frame (ovens under 'oven'), to spot a buy: the furniture bounces and a "Lv N" chip rises (v5.11). */
    levels: null as null | Record<Bounced, number>,
    bounce: null as null | { st: Bounced; at: number },
    chip: null as null | { st: Bounced; at: number; text: string },
    /** A station just reached Lv 25 / 50 / 100: confetti for 1.5 s and the head's line (null text: nobody to say it). */
    mile: null as null | { st: Station; at: number; text: string | null; level: number },
    /** A head's bark (features/heads.ts): which station speaks, the line and the wall second it began. */
    bark: null as null | { st: Station; text: string; at: number },
    /** The rush pill was a combo last frame: a bark asks when one starts. */
    combo: false,
  });
  // wall ms when this shop's scene was opened (the scene remounts per shop): the rush hint shows for the start of a visit
  const [visitAt] = useState(() => Date.now());

  const ovenCount = Math.min(FOOTPRINTS[fp].ovenSlots, 1 + Math.floor((shop.ovens - 1) / 8));
  const cookCount = Math.min(3, 1 + Math.floor((shop.prep - 1) / 15));
  const staffCount = Math.min(2, 1 + Math.floor((shop.counter - 1) / 15));
  const driverSlots = [2, 2, 3, 3, 4][fp];
  const tablesShown = Game.tablesShown(shop);
  const plants = shop.decor.plants;
  // geometry only changes with upgrades, so the layout object stays identical across frames and the
  // memoised layers that take `lay` (room shell, front wall, door, mat, hood) skip re-rendering
  const lay = useMemo(() => layout(fp, ovenCount, cookCount, staffCount, tablesShown, driverSlots, plants), [fp, ovenCount, cookCount, staffCount, tablesShown, driverSlots, plants]);
  const running = shop.managed || Game.lineBusy(shop.line);
  const rate = Game.shopRate(shop, game.vehicle);
  const pace = running ? Math.min(2.6, 0.8 + Math.log10(1 + rate)) : 0;
  const fit = sceneFit(width, height);
  const frontY = P(0, 0)[1];
  const shopSeed = seedFor(id);
  const nIdx = Math.max(0, NEIGHBORHOODS.findIndex((n) => n.id === id));
  const pal = useMemo(
    () => seatPalette(hash32(shopSeed) % GUEST_SHIRTS.length, hash32(shopSeed + 9) % HAIR_COLORS.length, GUEST_SHIRTS.length, HAIR_COLORS.length, lay.tables.length),
    [shopSeed, lay.tables.length],
  );

  // ---- people (pure cast builder) + furniture, painter-sorted by depth
  type Item = { y: number; el: ReactElement };
  // the day-30 visitor (cameo.ts): in the shop on screen while the visit's boost runs, with a tag of the time left and a line every few minutes
  const visit = visitOf(game.rewards.boosts, Date.now());
  const visitTagText = visit ? visitTag(visit.left) : '';
  const visitLineNow = visit ? visitLine(visit.visitor, Date.now() / 1000) : null;
  const cameo = visit ? cameoGeom(lay, visitTagText) : null;
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
  const walkins = Game.walkInFraction(shop, game.vehicle) > LINE.minWalkInShare;
  const tickSince = paused ? 0 : Math.max(0, (Date.now() - useGame.getState().tickAt) / 1000);
  // `idle`: the sidewalk shows the hire stack exactly when the shop has no GM (D408: a shop with all three heads but no GM
  // still stacks it, so the old `runsItself` test let walkers stand behind the stack); that shop keeps the sidewalk clear
  const crew = paused ? m0.crew : stepCrew(m0.crew, { lay, walkins, idle: hireOnSidewalk(shop, id), patio: Game.patioTables(shop), departures: line.departures, since: tickSince }, clock, SCENE_W);
  m0.crew = crew;
  // the stations tied for the bottleneck only change with upgrades: memo on the scene key (G80, M44); the idle drivers' pill names them (D421)
  const key = sceneKey(game, id);
  // eslint-disable-next-line react-hooks/exhaustive-deps -- `key` covers every level the tie depends on
  const slowest = useMemo(() => Game.tiedStages(shop, game.vehicle), [key]);
  // who waits outside: hungry diners and idle drivers (steady state, so only while the shop runs); the patio's tables
  const queue = running ? Game.queueSizes(shop, game.vehicle) : undefined;
  const cheer = Date.now() / 1000 - m0.cheerAt < CHEER_SECONDS;
  const { cast } = buildCast({ lay, shop, running, pace, clock, shopSeed, nIdx, pal, crew, queue, cheer });
  const side = sidewalkOf(lay, crew, queue);
  // each pop rides over the figure carrying its departure (one Map reused per mount, M48)
  const carriers = m0.carriers;
  carriers.clear();
  for (const c of cast) if (c.deps) for (const dep of c.deps) carriers.set(dep, P(c.props.x, c.props.y, 52));
  // the pills over the sidewalk queues; the drivers' one hides while a milestone badge and its confetti are up (D429), and either fades while a "+$" pop would land on it (D439: the pop used to lift above the pill and sit across the faces)
  const popRects = placePops(line.departures, (d) => Math.max(0, d.left - tickSince), (d) => carriers.get(d.id) ?? null, P(lay.staff[0] + 12, 70, 78), SCENE_W).map((q) => q.rect);
  const waitRaw = side.waiting > 0 && !(m0.mile && hidesWaitingPill(clock - m0.mile.at)) ? waitingText(side.waiting, slowest) : null;
  const waitText = waitRaw && !popsCover(popRects, waitTagRect(lay, waitRaw)) ? waitRaw : null;
  const moreRaw = side.more > 0 ? queueLabel(side.more, side.diners) : null;
  const moreText = moreRaw && !popsCover(popRects, moreTagRect(lay, moreRaw)) ? moreRaw : null;
  const fin = furnitureInputs({ id, name: nd.name, shop, running, rate, vehicle: game.vehicle, worn: game.rewards.worn });
  // Furniture only changes with upgrades and the dough/box counts, so it is built once per change (M12), not 15 times a second.
  // The visual ladder (v5.11): the props this shop's levels have earned, placed from the layout; built once per upgrade like the furniture
  // eslint-disable-next-line react-hooks/exhaustive-deps -- deps are lay + every value of `fin`, the builder's only inputs
  const placed = useMemo(() => ladderProps(lay, ladderInput(fin)), [lay, ...furnitureDeps(fin)]);
  // eslint-disable-next-line react-hooks/exhaustive-deps -- deps are lay + every value of `fin`, the builder's only inputs
  const furniture = useMemo(() => buildFurniture(lay, fin, placed), [lay, placed, ...furnitureDeps(fin)]);
  // per-buy bounce: each station's transform strings (one per step, about its base) are built when the layout changes, never per frame
  const bounceT = useMemo(() => {
    const [ox0, ox1] = [lay.ovenCols[0].x0, lay.ovenCols[lay.ovenCols.length - 1].x1];
    return {
      prep: bounceTransforms(P((lay.prep.x0 + lay.prep.x1) / 2, 75)),
      oven: bounceTransforms(P((ox0 + ox1) / 2, D - 6)),
      counter: bounceTransforms(P((lay.counter.x0 + lay.counter.x1) / 2, 74)),
      drivers: bounceTransforms(P(lay.scooter.x, lay.scooter.y)),
    } satisfies Record<Bounced, string[]>;
  }, [lay]);
  const bounceNow = mem.current.bounce ? bounceStep(clock - mem.current.bounce.at) : -1;
  const bouncing = bounceNow >= 0 ? mem.current.bounce!.st : null;
  const items: Item[] = [
    // a bought station's furniture wraps in a group whose transform is the precomputed bounce step (always wrapped, so the tree doesn't change when it starts)
    ...furniture.map((f) => (f.st ? { y: f.y, el: <G key={f.el.key} transform={bouncing === f.st ? bounceT[f.st][bounceNow] : undefined}>{f.el}</G> } : f)),
    ...sidewalkItems(lay, side.patio, waitText, moreText),
    ...cast.map((c) => ({ y: c.sortY, el: <Person key={c.key} {...c.props} /> })),
    ...(visit && cameo ? [{ y: cameo.spot.y, el: <Person key="cameo" x={cameo.spot.x} y={cameo.spot.y} kind="guest" front talk={visitLineNow !== null} mood="happy" {...VISITOR_LOOK[visit.visitor]} /> }] : []),
  ];
  items.sort((a, b) => b.y - a.y);

  useEffect(() => onCheer(() => { mem.current.cheerAt = Date.now() / 1000; }), []);
  // ---- departures: a carrier that paid this frame bumps the HUD cash (its coin just landed). Detected after
  // commit; ids only grow, so a remount or the end of a pause never replays old ones.
  useEffect(() => {
    const m = mem.current;
    const asks: BarkAsk[] = [];
    // a departure about to pay launches its coin from the carrier to the HUD cash, timed to land with the cash
    if (!paused)
      for (const d of line.departures) {
        const l = Math.max(0, d.left - Math.max(0, (Date.now() - useGame.getState().tickAt) / 1000));
        if (m.launched.has(d.id) || l > COIN_FLIGHT) continue;
        m.launched.add(d.id);
        if (m.launched.size > 12) m.launched.delete(m.launched.values().next().value as number);
        const [sx, sy] = carriers.get(d.id) ?? geoRegister;
        emitCoin({ x: origin.current.x + fit.ox + sx * fit.s, y: origin.current.y + fit.oy + (sy - 40) * fit.s, ms: l * 1000 });
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
    // an upgrade sped a station up: say by how much over its badge (drivers: over the door)
    const sp = { prep: Game.prepRate(shop), oven: Game.ovenRate(shop), counter: Game.counterRate(shop), drivers: shop.drivers };
    if (m.speeds) {
      const pct = (a: number, b: number) => Math.round((b / a - 1) * 100);
      if (sp.drivers > m.speeds.drivers) m.flash = { st: 'door', at: clock, text: `+${sp.drivers - m.speeds.drivers} driver${sp.drivers - m.speeds.drivers > 1 ? 's' : ''}` };
      for (const st of STATIONS_IN_ORDER) if (sp[st] > m.speeds[st] * (1 + 1e-9)) m.flash = { st, at: clock, text: `+${pct(m.speeds[st], sp[st])}% faster` };
    }
    m.speeds = sp;
    // a station's level went up: its furniture bounces and a "Lv N" chip rises; a milestone adds confetti and a line (v5.11)
    const lv = { prep: shop.prep, oven: shop.ovens, counter: shop.counter, drivers: shop.drivers };
    if (m.levels) {
      for (const st of BOUNCED) {
        if (lv[st] <= m.levels[st]) continue;
        m.bounce = { st, at: clock };
        m.chip = { st, at: clock, text: `Lv ${lv[st]}` };
        const hit = st === 'drivers' ? null : crossedMilestone(m.levels[st], lv[st]);
        if (hit && st !== 'drivers') {
          const who = milestoneSpeaker(shop.heads[st], HEADS[id][st], id === 'downtown');
          // a hired head speaks the copy's milestone bark (decided below, if the shop's one bubble is free); Nonna, with no head hired Downtown, keeps her own line
          m.mile = { st, at: clock, text: who && !shop.heads[st] ? `${who}: ${MILESTONE_LINES[st][hit]}` : null, level: lv[st] };
          if (shop.heads[st]) asks.push({ trigger: 'milestone', station: st });
        }
      }
    }
    m.levels = lv;
    // a head just hired says hello over their station; several at once (Nonna brings all three) queue up (C77)
    const heads = shop.heads;
    if (m.heads) for (const st of STATIONS_IN_ORDER) if (heads[st] && !m.heads[st]) m.hires.push({ st, text: `${HEADS[id][st]}: ${HIRE_LINE[st]}` });
    m.heads = heads;
    if ((!m.hire || clock - m.hire.at >= 2.5) && m.hires.length) m.hire = { ...m.hires.shift()!, at: clock };
    // ---- head barks (features/heads.ts): a milestone, a rush combo, an attack on this shop, being Head of the Week. One bubble per shop, so
    // nothing starts while a refusal, a hello or a milestone line is up (or a cut-scene plays); the rest of the rules are `nextBark`'s
    const g = useGame.getState();
    const wall = Date.now() / 1000;
    const week = weekStation(g.game, id);
    if (week) asks.push({ trigger: 'week', station: week, key: `week-${getFeature(g.game, headsFeature)?.week ?? 0}` });
    const atk = getFeature(g.game, counterattack) as ReturnType<typeof counterattack.init> | undefined;
    if (atk?.open && atk.target === id) {
      const sp = speakerFor(shop, atk.seenWeek);
      if (sp) asks.push({ trigger: 'attack', station: sp, key: `attack-${atk.seenWeek}` });
    }
    const combo = rushModel?.kind === 'combo';
    if (combo && !m.combo) {
      const sp = speakerFor(shop, Math.floor(wall / 7));
      if (sp) asks.push({ trigger: 'rush', station: sp });
    }
    m.combo = combo;
    const cv = visitOf(g.game.rewards.boosts, Date.now());
    const cameoSpeaking = !!cv && visitLine(cv.visitor, wall) !== null;
    const otherBubble = cameoSpeaking || !!(m.refusal && clock - m.refusal.at < 1.6) || !!(m.hire && clock - m.hire.at < 2.5) || m.hires.length > 0 || !!(m.mile?.text && m.mile.at !== clock && clock - m.mile.at < 2.5);
    const before = barkMemory.get(id) ?? newBarkMem();
    const { mem: after, bark } = nextBark(before, id, asks, wall, paused || !!g.playing || otherBubble);
    if (after !== before) barkMemory.set(id, after);
    if (bark) {
      if (bark.trigger === 'milestone' && m.mile && m.mile.at === clock) m.mile.text = bark.text;
      else m.bark = { st: bark.station, text: bark.text, at: wall };
    }
  });
  const m = mem.current;
  const barkOn = m.bark && Date.now() / 1000 - m.bark.at < HEAD_BARKS.seconds ? m.bark : null;
  const weekSt = weekStation(game, id);
  // job timers move between the engine's 200 ms ticks: interpolate from the tick's wall time, never past 0
  const since = paused ? 0 : Math.max(0, (Date.now() - useGame.getState().tickAt) / 1000);
  const leftNow = (left: number) => Math.max(0, left - since);
  const auto = Game.automationOf(shop);
  const next = shop.managed ? null : Game.nextStation(shop);
  const neck = useMemo(() => new Set(slowest.map((st) => STAGE_STATION[st])), [slowest]);
  // the rush pill (GM shops): decided on a 200 ms bucket of the wall clock and the shop's levels, not rebuilt on every 15 fps frame
  const rushBucket = Math.floor(Date.now() / 200);
  // eslint-disable-next-line react-hooks/exhaustive-deps -- `key` covers the levels the rates depend on; `rushBucket` is the time
  const rushModel = useMemo(
    () => rushPill({ managed: shop.managed, taps: rushTaps, now: rushBucket * 200, visitAt, kitchenRate: Math.min(Game.prepRate(shop), Game.ovenRate(shop), Game.counterRate(shop)), demandRate: Game.demandRate(shop, game.vehicle) }),
    [key, rushTaps, rushBucket, visitAt],
  );
  // back-wall rects the rush pill keeps clear of: the menu board and the ladder's wall props (D406)
  const pillAvoid = useMemo(() => [...(menuRect(lay) ? [menuRect(lay)!] : []), ...wallRects(placed)], [lay, placed]);
  const badges = badgeModels({ line, auto, managed: shop.managed, neck, next, tapBatch: Game.tapBatch(shop), since });
  // the "tap me" pulse and the miss nudge step on the 7.5 Hz pose clock, 6 levels, so the badge memo holds (M43)
  const poseT = Math.floor(clock * 7.5) / 7.5;
  const pulse = Math.round(((Math.sin(poseT * Math.PI * 2 * 1.2) + 1) / 2) * 5) / 5;
  const nudge = clock - m.hintAt < 0.45 ? Math.round(Math.sin(((clock - m.hintAt) / 0.45) * Math.PI) * 5) / 5 : 0;
  const rushJump = clock - m.rushAt < 0.2 ? Math.round((1 - (clock - m.rushAt) / 0.2) * 4) / 4 : 0;
  const rects = useMemo(() => stationRects(lay, MIN_TAP_PT / fit.s), [lay, fit.s]);
  const bxs = useMemo(() => badgeXs(lay), [lay]);
  const by = badgeRowY();
  const walls = useMemo(() => bubbleWalls(lay), [lay]);
  const geoRegister = useMemo(() => P(lay.staff[0] + 12, 70, 78), [lay]);
  const geoPass = useMemo(() => P(lay.counter.x0 + 8, 70, 40), [lay]);
  const dingAt = useMemo(() => {
    const top = Math.max(...lay.ovens.map((o) => o.z + o.h));
    return P(lay.ovenCols[lay.ovenCols.length - 1].x1 + 2, D, top * 0.55).map((v, i) => (i === 0 ? v + 22 : v)) as [number, number];
  }, [lay]);
  const flicker = running ? Math.sin(clock * 9) * 1.4 : 0;
  const rushK = (clock - m.rushAt) / 0.6;
  const rushC = useMemo(() => P((lay.ovenCols[0].x0 + lay.ovenCols[lay.ovenCols.length - 1].x1) / 2, D - 6, 50), [lay]);
  const refusal = m.refusal && clock - m.refusal.at < 1.6 ? m.refusal : null;
  // the visitor's line shows only while no head's bubble does (one bubble per shop)
  const visitSays = visitLineNow && !barkOn && !refusal && !(m.hire && clock - m.hire.at < 2.5) ? visitLineNow : null;
  const mileAge = m.mile ? clock - m.mile.at : -1;
  const mileLine = m.mile?.text && mileAge < 2.5 ? m.mile.text : null;
  // D415: the badge's centre (over the station's furniture, below the chip row), and the speed-up pill that rides in it instead of rising over the chips
  const mileAt = m.mile && mileAge < MILE_SECONDS ? mileAnchor(rects[m.mile.st], by, stationHatTop(lay, m.mile.st)) : null;
  const mileFlash = m.mile && m.flash && m.flash.st === m.mile.st && m.flash.at === m.mile.at ? m.flash : null;
  const flash = next && clock - m.hintAt < 0.3 ? rects[next] : null;

  return (
    <View ref={viewRef} onLayout={measureOrigin} style={{ width, height, overflow: 'hidden' }}>
      <Pressable
        testID="shop"
        style={{ position: 'absolute', left: 0, top: 0, width, height }}
        // re-measure on every touch: an ancestor can move without this view's own layout changing (C76)
        onPressIn={measureOrigin}
        onPress={(e) => {
          // page coordinates minus the view's measured origin: `locationX` is relative to whichever SVG child was
          // hit on web, so it can't place a tap on a station (every tap used to land on the oven)
          const ne = e?.nativeEvent;
          const isNum = (v: unknown): v is number => typeof v === 'number' && Number.isFinite(v);
          const lx = isNum(ne?.pageX) ? ne.pageX - origin.current.x : ne?.locationX;
          const ly = isNum(ne?.pageY) ? ne.pageY - origin.current.y : ne?.locationY;
          const x = isNum(lx) ? (lx - fit.ox) / fit.s : SCENE_W / 2;
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
        }}>
        <Svg width={width} height={height} viewBox={`${-fit.ox / fit.s} ${-fit.oy / fit.s} ${width / fit.s} ${height / fit.s}`}>
          <SceneDefs />
          <Backdrop id={id} L={lay.L} R={lay.R} />
          {CLOUDS.map((c, i) => (
            <Cloud key={i} x={((c.x0 + clock * c.v) % DRIFT_SPAN) - 100} y={c.y} k={c.k} dusk={id === 'uptown'} />
          ))}
          <Sidewalk frontY={frontY} />
          <Street />
          <RoomShell id={id} lay={lay} wall={nd.wall} fp={fp} flooring={shop.decor.flooring} walls={shop.decor.walls} signage={shop.decor.signage} plants={shop.decor.plants} />
          <OvenHood lay={lay} grade={shop.grade} mural={shop.decor.walls >= 3} tier={ovenTier(shop.ovens)} />
          {/* rush tap: the oven bank pulses (the jobs finish sooner; cash still waits for the pies to leave) */}
          {(() => {
            const pulse = rushK >= 0 && rushK < 0.25 ? 1 + 0.05 * Math.sin((rushK / 0.25) * Math.PI) : 1;
            return (
              <G transform={pulse !== 1 ? `translate(${rushC[0]} ${rushC[1]}) scale(${pulse}) translate(${-rushC[0]} ${-rushC[1]})` : bouncing === 'oven' ? bounceT.oven[bounceNow] : undefined}>
                {lay.ovens.map((o, i) => (
                  <Oven key={i} o={o} grade={shop.grade} lit={shop.managed ? running : !!line.oven} hot={!!line.oven} flicker={flicker * (i % 2 ? -1 : 1)} tier={ovenTier(shop.ovens)} skin={fin.ovenSkin} />
                ))}
              </G>
            );
          })()}
          {items.map((it) => it.el)}
          {CARS.map((c, i) => {
            const dir = c.lane === 0 ? -1 : 1;
            const raw = (c.offset + clock * c.speed) % DRIFT_SPAN;
            const x = dir === 1 ? raw - 100 : SCENE_W + 100 - raw;
            return (
              <G key={i} transform={`translate(${x} ${c.lane === 0 ? CURB_Y + 30 : CURB_Y + 70}) scale(0.86)`}>
                <Car x={0} y={0} color={c.color} kind={c.kind} dir={dir as 1 | -1} />
              </G>
            );
          })}
          {/* the day-30 visitor's tag over their head, and their line above it (cameo.ts), over the front wall */}
          {visit && cameo && <CameoTag x0={cameo.tag.x0} x1={cameo.tag.x1} y0={cameo.tag.y0} y1={cameo.tag.y1} text={visitTagText} />}
          {cameo && visitSays && !mileLine && <CameoBubble tail={cameo.tailX} y={cameo.sayY} text={sayLines(visitSays).join('\n')} wall0={walls.x0} wall1={walls.x1} />}
          {/* station badges: ring timer, pies in the job, a hand on the station to tap, the head who runs it */}
          {/* a miss outlines the station to tap for a moment (G79) */}
          {flash && <Rect x={flash.x0} y={flash.y0} width={flash.x1 - flash.x0} height={flash.y1 - flash.y0} rx={8} fill="none" stroke="#fff" strokeWidth={2.5} opacity={0.9} />}
          {/* the ticket rail the badges hang on (D346) */}
          {/* D415: the whole chip row dims while a milestone badge is up */}
          <G opacity={hudOpacity(mileAge)}>
            <BadgeRail x0={bxs.prep - BADGE_R - 8} x1={bxs.counter + BADGE_R + 40} y={by} gm={shop.managed && id !== 'downtown' ? `${id}-gm` : shop.managed ? 'nonna' : null} />
            {badges.map((b) => (
              <StationBadge
                key={b.st}
                x={bxs[b.st]}
                y={by}
                step={b.step}
                count={b.count}
                tone={b.tone}
                ready={b.ready}
                pulse={b.ready ? pulse : 0}
                nudge={b.ready ? nudge : 0}
                face={b.runner === 'head' ? b.st : null}
                faceName={b.runner === 'gm' ? `${id}-gm` : HEADS[id][b.st]}
                jump={line[b.st] ? rushJump : 0}
                rank={shop.heads[b.st] ? rankOf(stationLevel(shop, b.st)) : 0}
                star={weekSt === b.st}
              />
            ))}
          </G>
          {/* a refused tap says why, just under the station's badge (D348) */}
          {refusal && <HireBubble x={bxs[refusal.st]} y={by + 40} text={refusal.text} wall0={walls.x0} wall1={walls.x1} tone="refusal" />}
          {/* a milestone line (Lv 25 / 50 / 100) from the station's head beats a hello and the rush pill */}
          {/* D415: directly under the badge, over the station's furniture, never over the chip row */}
          {!refusal && mileLine && m.mile && (() => { const a = mileAnchor(rects[m.mile.st], by, stationHatTop(lay, m.mile.st)); return <HireBubble x={a.cx} y={mileSpeechY(a.cy)} text={mileLine} wall0={walls.x0} wall1={walls.x1} />; })()}
          {!refusal && !mileLine && m.hire && clock - m.hire.at < 2.5 && <HireBubble x={bxs[m.hire.st]} y={by + 40} text={m.hire.text} wall0={walls.x0} wall1={walls.x1} />}
          {/* a head's bark takes the same spot under its badge, clamped inside the walls (D440); the rush pill gives way to it */}
          {!refusal && !mileLine && !(m.hire && clock - m.hire.at < 2.5) && barkOn && <HireBubble x={bxs[barkOn.st]} y={by + 40} text={barkOn.text} wall0={walls.x0} wall1={walls.x1} />}
          {/* a General Manager shop: "Tap to rush!" until the first tap, then the combo; a head's hello takes the spot while it shows */}
          {/* D406: under the oven chip, ≤ 120 wide, moved clear of the menu board and the ladder's wall props */}
          {rushModel && !refusal && !mileLine && !barkOn && !(m.hire && clock - m.hire.at < 2.5) && (
            <RushPill x={clearPillX(bxs.oven, rushPillWidth(rushModel.text), by + 26, by + 44, pillAvoid)} y={by + 40} kind={rushModel.kind} text={rushModel.text} pulse={rushModel.pulse ? pulse : 0} />
          )}
          {/* a finished bake: "ding!" at the oven and the pies slide onto the pass (P3) */}
          {m.slide && clock - m.slide.at < 0.7 && (() => {
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
                  <Path d="M-17 -2 L-23 1 L-17 4 Z" fill="#fff" stroke={INK} strokeWidth={1.1} strokeLinejoin="round" />
                  <Rect x={-17} y={-9} width={34} height={16} rx={8} fill="#fff" stroke={INK} strokeWidth={1.1} />
                  <SvgText x={0} y={3} fontFamily={F.bold} fontSize={11} fill={INK} textAnchor="middle">
                    ding!
                  </SvgText>
                </G>
              </G>
            );
          })()}
          {/* what an upgrade did: "+50% faster" rising from the station's badge (P5) */}
          {m.flash && clock - m.flash.at < 0.9 && m.flash !== mileFlash && (() => {
            const k = (clock - m.flash.at) / 0.9;
            const fx = m.flash.st === 'door' ? P(lay.door.cx, 0, 80)[0] : bxs[m.flash.st];
            const fy = m.flash.st === 'door' ? P(lay.door.cx, 0, 80)[1] : by + 34 + CHIP_ROW_HALF + ROW_AIR - 4;
            const w = m.flash.text.length * 7 + 16;
            const px = Math.min(SCENE_W - 4 - w / 2, Math.max(4 + w / 2, fx));
            return (
              <G transform={`translate(${px} ${fy - k * (m.flash.st === 'door' ? 24 : 14) - (spotlight ? 28 : 0)})`} opacity={k > 0.75 ? (1 - k) / 0.25 : 1}>
                <Rect x={-w / 2} y={-11} width={w} height={20} rx={10} fill="#2E8B3E" stroke="#fff" strokeWidth={1.4} />
                <SvgText x={0} y={4} fontFamily={F.bold} fontSize={13} fill="#fff" textAnchor="middle">
                  {m.flash.text}
                </SvgText>
              </G>
            );
          })()}
          {/* a station just levelled up: a cream "Lv N" chip rises 20 from its furniture (the drivers': from the door), stopping under the chip row (D418);
              a milestone shows its own badge instead */}
          {m.chip && clock - m.chip.at < CHIP_SECONDS && !(m.mile && m.mile.at === m.chip.at && mileAge < MILE_SECONDS) && (() => {
            const k = (clock - m.chip.at) / CHIP_SECONDS;
            const text = m.chip.text;
            const r = Math.max(13, text.length * 3.4 + 4);
            const door = [P(lay.door.cx, 0, 80)[0] - 34, P(lay.door.cx, 0, 80)[1] - 18] as const;
            const rect = m.chip.st === 'drivers' ? { x0: door[0], x1: door[0], y0: door[1], y1: door[1] } : rects[m.chip.st];
            const at = chipAt(rect, by, r, k, CHIP_RISE);
            return (
              <G transform={`translate(${Math.min(SCENE_W - 4 - r, Math.max(4 + r, at.x))} ${at.y})`} opacity={k > 0.75 ? (1 - k) / 0.25 : 1}>
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
              color={NEIGHBORHOODS[nIdx].color}
            />
          )}
          {/* D367: Nonna's tutorial spotlights its station: a dark scrim with a rounded cut-out, a pulsing gold outline
              and a hand pointing at the station itself */}
          {spotlight &&
            (() => {
              const r = rects[spotlight];
              const { x0, y0, x1, y1 } = spotlightCutout(r);
              const rr = 12;
              const vb = { x: -fit.ox / fit.s, y: -fit.oy / fit.s, w: width / fit.s, h: height / fit.s };
              const hole = `M${x0 + rr} ${y0} H${x1 - rr} Q${x1} ${y0} ${x1} ${y0 + rr} V${y1 - rr} Q${x1} ${y1} ${x1 - rr} ${y1} H${x0 + rr} Q${x0} ${y1} ${x0} ${y1 - rr} V${y0 + rr} Q${x0} ${y0} ${x0 + rr} ${y0} Z`;
              const glow = 0.55 + 0.45 * pulse;
              const { hx, hy, rot, scale: hs } = tutorialHand({ x0, y0, x1, y1 }, spotlightWait ? 0 : 4 * pulse);
              return (
                <G>
                  <Path d={`M${vb.x} ${vb.y} H${vb.x + vb.w} V${vb.y + vb.h} H${vb.x} Z ${hole}`} fill="#2A1408" opacity={0.6} fillRule="evenodd" />
                  {/* D378: a 4 pt soft glow around the cut-out, then the gold outline */}
                  <Path d={hole} fill="none" stroke="#FFD54A" strokeWidth={3 + 2 * 4} opacity={0.28 * glow} strokeLinejoin="round" />
                  <Path d={hole} fill="none" stroke="#FFD54A" strokeWidth={3} opacity={glow} />
                  {/* G83: on a wait step the ring breathes outward so the station being waited on still reads as the focus */}
                  {spotlightWait && <Path d={hole} fill="none" stroke="#fff" strokeWidth={2} opacity={0.75 * (1 - pulse)} transform={`translate(${(x0 + x1) / 2} ${(y0 + y1) / 2}) scale(${1 + 0.05 * pulse}) translate(${-(x0 + x1) / 2} ${-(y0 + y1) / 2})`} />}
                  <G transform={`translate(${hx} ${hy}) rotate(${rot}) scale(${hs})`}>
                    <Path d="M0 -7 Q1.6 -7 1.6 -5 L1.6 -1 L5 -0.4 Q6.6 0 6.2 2 L5 6 Q4.4 7.4 3 7.4 L-2.4 7.4 Q-4 7.4 -4.4 6 L-5.6 1.6 Q-5.8 0 -4.2 0.2 L-1.6 1 L-1.6 -5 Q-1.6 -7 0 -7 Z" fill="#fff" stroke={INK} strokeWidth={1} strokeLinejoin="round" />
                  </G>
                </G>
              );
            })()}
          <DeparturePops deps={line.departures} left={(d) => leftNow(d.left)} anchor={(d) => carriers.get(d.id) ?? null} register={geoRegister} />
        </Svg>
      </Pressable>
      {/* the SCENE_OVERLAYS slot: above the floor and furniture, below the HUD; nothing while the slot is empty */}
      <SceneOverlays shopId={id} width={width} height={height} />
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
  if (fin.plants >= 1 && !lay.tables.some((tb) => tb.y === FRONT_ROW_Y)) f.push({ y: 2, el: <FloorPlant key="pp1" x={lay.L + 4} y={2} k={0.8} /> });
  if (fin.plants >= 3) f.push({ y: 112, el: <WallPlanter key="pp4" lay={lay} /> });
  f.push({ y: 66, st: 'prep', el: <PrepBench key="prep" lay={lay} prep={fin.prep} dough={fin.dough} /> });
  f.push({ y: 64, st: 'counter', el: <Counter key="counter" lay={lay} boxes={fin.boxes} /> });
  // the visual ladder: bench, counter and street props bounce with their station; the wall ones stay put
  for (const p of ladder)
    f.push({ y: p.sortY, st: p.mount === 'wall' ? undefined : p.station === 'drivers' ? 'drivers' : p.station === 'prep' ? 'prep' : 'counter', el: <LadderPiece key={`lp-${p.id}`} id={p.id} ax={p.ax} ay={p.ay} k={p.k} n={p.n} v={fin.vehicle} mint={fin.scooterMint} neon={fin.neon} /> });
  // the neon counter cosmetic: when the Lv 100 sign is not up, the sign takes the same slot (cosmetics.ts `neonSpot`)
  if (fin.neon && !ladder.some((p) => p.id === 'neon')) {
    const spot = neonSpot(lay, fin.id);
    if (spot) f.push({ y: D + 1, el: <LadderPiece key="lp-neon-cosmetic" id="neon" ax={spot.ax} ay={spot.ay} k={spot.k} n={0} v={fin.vehicle} neon /> });
  }
  // front of the shop + sidewalk props
  f.push({ y: 0, el: <FrontWall key="front" lay={lay} name={fin.name} signage={fin.signageTier} plants={fin.plants} id={fin.id} facadeSkin={fin.facadeSkin} awningGold={fin.awningGold} plaque={fin.plaque} /> });
  f.push({ y: -1, el: <Doormat key="mat" lay={lay} /> });
  if (lay.ledge) {
    f.push({ y: STOOL_Y, el: <Stools key="stools" x0={lay.ledge.x0} x1={lay.ledge.x1} /> });
    f.push({ y: LEDGE_Y, el: <LedgeBar key="ledge" x0={lay.ledge.x0} x1={lay.ledge.x1} /> });
  }
  if (fin.fp === 0) f.push({ y: 8, el: <FloorProp key="fprop" id={fin.id} x={lay.L + 22} y={8} /> });
  // a shop with no manager has a taller sidewalk row: its sidewalk props would stand on the front sill (D356), so
  // the sidewalk there stays clear apart from the mat (the hire bar is the focus)
  if (!fin.idleShop) f.push({ y: SIGN_Y, el: <ChalkSign key="sign" x={lay.sign.x} y={SIGN_Y} k={1} /> });
  f.push({ y: 16, el: <DoorLeaf key="leaf" lay={lay} /> });
  if (!fin.idleShop) {
    // the potted tree stays fully on screen (its pot is ~14 wide) in the widest rooms
    const plx = Math.max(lay.L + 8, unprojectX(20, TREE_Y));
    f.push({ y: TREE_Y, el: <Planter key="pl" x={plx} y={TREE_Y} /> });
    // the neighbourhood's sidewalk signature (v5.0): always drawn now, in the room layout.ts keeps clear for it (D414)
    const [qx, qy] = P(lay.prop.x, PROP_Y);
    f.push({ y: PROP_Y, el: <StreetProp key="street" id={fin.id} x={qx} y={qy} /> });
  }
  if (!fin.idleShop) {
    const [scx, scy] = P(lay.scooter.x, lay.scooter.y);
    f.push({ y: lay.scooter.y, st: 'drivers', el: <ParkedVehicle key="scooter" x={scx} y={scy} v={fin.vehicle} mint={fin.scooterMint} /> });
  }
  return f;
}
