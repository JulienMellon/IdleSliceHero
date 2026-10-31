// The main-screen scene: a pizzeria seen from the street, with the front wall cut away.
//   sky + clouds + neighbourhood skyline + trees
//   the room in perspective (back wall, side walls, receding floor): prep table, ovens, counter,
//   pickup spots, dining tables, all shaded with floor shadows
//   a front entrance on the right that customers and drivers use
//   the sidewalk (the upgrade buttons sit on it, drawn by the screen) and a street with traffic.
//
// Everything is drawn in a 393×680 "scene" box that is scaled to cover the available area,
// anchored to the bottom so the sidewalk and street are always visible (taller screens show more sky).
import { memo, useEffect, useMemo, useRef, type ComponentRef, type ReactElement } from 'react';
import { Pressable, View } from 'react-native';
import Svg, { Circle, G, Path, Rect, Text as SvgText } from 'react-native-svg';
import { F } from '../theme';
import { FOOTPRINTS, NEIGHBORHOODS } from '../content/tuning';
import type { NeighborhoodId } from '../content/types';
import * as Game from '../engine/game';
import { useGame } from '../store/game-store';
import { emitAudio } from '../audio/bus';
import { emitPayout } from './pulse-bus';
import { Backdrop } from './scene/background';
import { useClock } from './scene/clock';
import { SceneDefs } from './scene/defs';
import { FRONT_ROW_Y, LEDGE_Y, STOOL_Y, layout, type Layout } from './scene/layout';
import { seatPalette } from './scene/palette';
import { GUEST_SHIRTS, HAIR_COLORS, hash32, Person } from './scene/people';
import { CURB_Y, D, INK, P, SCENE_W, sceneFit, unprojectX } from './scene/projection';
import { Counter, FloorPlant, FloorProp, LedgeBar, Oven, OvenHood, PrepBench, Rug, Stools, Table, WallPlanter } from './scene/props';
import { furnitureDeps, furnitureInputs, type FurnitureInputs } from './scene/furniture-inputs';
import { ChalkSign, DoorLeaf, Doormat, FrontWall, Planter, RoomShell, StreetProp } from './scene/room';
import { Car, CARS, Cloud, ParkedVehicle, Sidewalk, Street } from './scene/street';
import { buildCast } from './scene/cast';
import { LINE, STATIONS_IN_ORDER, type Station } from '../engine/pipeline';
import { HEADS } from '../content/tuning';
import { BadgeRail, DeparturePops, HireBubble, StationBadge } from './scene/kitchen-hud';
import { emptyCrew, stepCrew, type CrewState } from './scene/crew';
import { emitCoin } from './pulse-bus';
import { BADGE_R, COIN_FLIGHT, badgeAt, badgeModels, badgeRowY, badgeXs, MIN_TAP_PT, spotlightCutout, stationAt, stationRects, tutorialHand } from './scene/stations';

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
  return `${s.footprint}|${s.prep}|${s.ovens}|${s.counter}|${s.drivers}|${s.tables}|${s.grade}|${s.managed ? 1 : 0}|${d.tables}${d.plants}${d.flooring}${d.walls}${d.signage}|${g.vehicle}`;
}



/** Sky drift: three clouds that loop across the scene on the clock. */
const CLOUDS = [
  { x0: 60, y: 34, k: 0.8, v: 4 },
  { x0: 260, y: 20, k: 1.0, v: 3 },
  { x0: 360, y: 70, k: 0.6, v: 5 },
] as const;
const DRIFT_SPAN = SCENE_W + 200;

const STAGE_STATION: Record<Game.Stage, Station> = { prep: 'prep', ovens: 'oven', counter: 'counter', customers: 'counter' };
const HIRE_LINE: Record<Station, string> = { prep: 'I got the dough, boss!', oven: 'Ovens are mine now.', counter: 'Next customer, please!' };



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
  });

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
  const crew = paused ? m0.crew : stepCrew(m0.crew, { lay, walkins, idle: !Game.runsItself(shop) && id !== 'downtown', departures: line.departures, since: tickSince }, clock, SCENE_W);
  m0.crew = crew;
  const { cast } = buildCast({ lay, shop, running, pace, clock, shopSeed, nIdx, pal, crew });
  // each pop rides over the figure carrying its departure (one Map reused per mount, M48)
  const carriers = m0.carriers;
  carriers.clear();
  for (const c of cast) if (c.deps) for (const dep of c.deps) carriers.set(dep, P(c.props.x, c.props.y, 52));
  const fin = furnitureInputs({ id, name: nd.name, shop, running, rate, vehicle: game.vehicle });
  // Furniture only changes with upgrades and the dough/box counts, so it is built once per change (M12), not 15 times a second.
  // eslint-disable-next-line react-hooks/exhaustive-deps -- deps are lay + every value of `fin`, the builder's only inputs
  const furniture = useMemo(() => buildFurniture(lay, fin), [lay, ...furnitureDeps(fin)]);
  const items: Item[] = [...furniture, ...cast.map((c) => ({ y: c.sortY, el: <Person key={c.key} {...c.props} /> }))];
  items.sort((a, b) => b.y - a.y);

  // ---- departures: a carrier that paid this frame bumps the HUD cash (its coin just landed). Detected after
  // commit; ids only grow, so a remount or the end of a pause never replays old ones.
  useEffect(() => {
    const m = mem.current;
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
    // a head just hired says hello over their station; several at once (Nonna brings all three) queue up (C77)
    const heads = shop.heads;
    if (m.heads) for (const st of STATIONS_IN_ORDER) if (heads[st] && !m.heads[st]) m.hires.push({ st, text: `${HEADS[id][st]}: ${HIRE_LINE[st]}` });
    m.heads = heads;
    if ((!m.hire || clock - m.hire.at >= 2.5) && m.hires.length) m.hire = { ...m.hires.shift()!, at: clock };
  });
  const m = mem.current;
  // job timers move between the engine's 200 ms ticks: interpolate from the tick's wall time, never past 0
  const since = paused ? 0 : Math.max(0, (Date.now() - useGame.getState().tickAt) / 1000);
  const leftNow = (left: number) => Math.max(0, left - since);
  const auto = Game.automationOf(shop);
  const next = shop.managed ? null : Game.nextStation(shop);
  // the stations tied for the bottleneck only change with upgrades: memo on the scene key (G80, M44)
  const key = sceneKey(game, id);
  // eslint-disable-next-line react-hooks/exhaustive-deps -- `key` covers every level the tie depends on
  const neck = useMemo(() => new Set(Game.tiedStages(shop, game.vehicle).map((st) => STAGE_STATION[st])), [key]);
  const badges = badgeModels({ line, auto, managed: shop.managed, neck, next, tapBatch: Game.tapBatch(shop), since });
  // the "tap me" pulse and the miss nudge step on the 7.5 Hz pose clock, 6 levels, so the badge memo holds (M43)
  const poseT = Math.floor(clock * 7.5) / 7.5;
  const pulse = Math.round(((Math.sin(poseT * Math.PI * 2 * 1.2) + 1) / 2) * 5) / 5;
  const nudge = clock - m.hintAt < 0.45 ? Math.round(Math.sin(((clock - m.hintAt) / 0.45) * Math.PI) * 5) / 5 : 0;
  const rushJump = clock - m.rushAt < 0.2 ? Math.round((1 - (clock - m.rushAt) / 0.2) * 4) / 4 : 0;
  const rects = useMemo(() => stationRects(lay, MIN_TAP_PT / fit.s), [lay, fit.s]);
  const bxs = useMemo(() => badgeXs(lay), [lay]);
  const by = badgeRowY();
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
          <OvenHood lay={lay} grade={shop.grade} mural={shop.decor.walls >= 3} />
          {/* rush tap: the oven bank pulses (the jobs finish sooner; cash still waits for the pies to leave) */}
          {(() => {
            const pulse = rushK >= 0 && rushK < 0.25 ? 1 + 0.05 * Math.sin((rushK / 0.25) * Math.PI) : 1;
            return (
              <G transform={pulse !== 1 ? `translate(${rushC[0]} ${rushC[1]}) scale(${pulse}) translate(${-rushC[0]} ${-rushC[1]})` : undefined}>
                {lay.ovens.map((o, i) => (
                  <Oven key={i} o={o} grade={shop.grade} lit={shop.managed ? running : !!line.oven} hot={!!line.oven} flicker={flicker * (i % 2 ? -1 : 1)} />
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
          {/* station badges: ring timer, pies in the job, a hand on the station to tap, the head who runs it */}
          {/* a miss outlines the station to tap for a moment (G79) */}
          {flash && <Rect x={flash.x0} y={flash.y0} width={flash.x1 - flash.x0} height={flash.y1 - flash.y0} rx={8} fill="none" stroke="#fff" strokeWidth={2.5} opacity={0.9} />}
          {/* the ticket rail the badges hang on (D346) */}
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
            />
          ))}
          {/* a refused tap says why, just under the station's badge (D348) */}
          {refusal && <HireBubble x={bxs[refusal.st]} y={by + 40} text={refusal.text} tone="refusal" />}
          {!refusal && m.hire && clock - m.hire.at < 2.5 && <HireBubble x={bxs[m.hire.st]} y={by + 40} text={m.hire.text} />}
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
          {m.flash && clock - m.flash.at < 0.9 && (() => {
            const k = (clock - m.flash.at) / 0.9;
            const fx = m.flash.st === 'door' ? P(lay.door.cx, 0, 80)[0] : bxs[m.flash.st];
            const fy = m.flash.st === 'door' ? P(lay.door.cx, 0, 80)[1] : by + 34;
            const w = m.flash.text.length * 7 + 16;
            const px = Math.min(SCENE_W - 4 - w / 2, Math.max(4 + w / 2, fx));
            return (
              <G transform={`translate(${px} ${fy - k * 24 - (spotlight ? 28 : 0)})`} opacity={k > 0.75 ? (1 - k) / 0.25 : 1}>
                <Rect x={-w / 2} y={-11} width={w} height={20} rx={10} fill="#2E8B3E" stroke="#fff" strokeWidth={1.4} />
                <SvgText x={0} y={4} fontFamily={F.bold} fontSize={13} fill="#fff" textAnchor="middle">
                  {m.flash.text}
                </SvgText>
              </G>
            );
          })()}
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
    </View>
  );
});

/** The static furniture layer, painter-sorted later with the cast. Reads only `lay` and `fin`, so memoising on those is complete. */
function buildFurniture(lay: Layout, fin: FurnitureInputs): { y: number; el: ReactElement }[] {
  type Item = { y: number; el: ReactElement };
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
  f.push({ y: 66, el: <PrepBench key="prep" lay={lay} prep={fin.prep} dough={fin.dough} /> });
  f.push({ y: 64, el: <Counter key="counter" lay={lay} boxes={fin.boxes} /> });
  // front of the shop + sidewalk props
  f.push({ y: 0, el: <FrontWall key="front" lay={lay} name={fin.name} signage={fin.signageTier} plants={fin.plants} id={fin.id} /> });
  f.push({ y: -1, el: <Doormat key="mat" lay={lay} /> });
  if (lay.ledge) {
    f.push({ y: STOOL_Y, el: <Stools key="stools" x0={lay.ledge.x0} x1={lay.ledge.x1} /> });
    f.push({ y: LEDGE_Y, el: <LedgeBar key="ledge" x0={lay.ledge.x0} x1={lay.ledge.x1} /> });
  }
  if (fin.fp === 0) f.push({ y: 8, el: <FloorProp key="fprop" id={fin.id} x={lay.L + 22} y={8} /> });
  // a shop with no manager has a taller sidewalk row: its sidewalk props would stand on the front sill (D356), so
  // the sidewalk there stays clear apart from the mat (the hire bar is the focus)
  if (!fin.idleShop) f.push({ y: -34, el: <ChalkSign key="sign" x={lay.sign.x} y={-34} k={1} /> });
  f.push({ y: 16, el: <DoorLeaf key="leaf" lay={lay} /> });
  if (!fin.idleShop) {
    // the potted tree stays fully on screen (its pot is ~14 wide) in the widest rooms
    const py = -40;
    const plx = Math.max(lay.L + 8, unprojectX(20, py));
    f.push({ y: py, el: <Planter key="pl" x={plx} y={py} /> });
    // the neighbourhood's sidewalk signature, between the potted tree and the chalkboard (v5.0)
    const px = (plx + 16 + lay.sign.x - 18) / 2;
    if (lay.sign.x - plx > 56) {
      const [qx, qy] = P(px, -36);
      f.push({ y: -36, el: <StreetProp key="street" id={fin.id} x={qx} y={qy} /> });
    }
  }
  if (!fin.idleShop) {
    const [scx, scy] = P(lay.scooter.x, lay.scooter.y);
    f.push({ y: lay.scooter.y, el: <ParkedVehicle key="scooter" x={scx} y={scy} v={fin.vehicle} /> });
  }
  return f;
}
