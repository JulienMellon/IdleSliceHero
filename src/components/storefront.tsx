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
import { FOOTPRINTS, NEIGHBORHOODS, TUNING } from '../content/tuning';
import type { NeighborhoodId } from '../content/types';
import { money } from '../engine/format';
import * as Game from '../engine/game';
import { useGame } from '../store/game-store';
import { C, F } from '../theme';
import { emitAudio } from '../audio/bus';
import { emitPayout } from './pulse-bus';
import { Backdrop } from './scene/background';
import { useClock } from './scene/clock';
import { SceneDefs } from './scene/defs';
import { FRONT_ROW_Y, LEDGE_Y, STOOL_Y, layout, type Layout } from './scene/layout';
import { seatPalette } from './scene/palette';
import { GUEST_SHIRTS, HAIR_COLORS, hash32, Person } from './scene/people';
import { CURB_Y, D, FRONT_TOP, INK, P, SCENE_W, sceneFit, unprojectX } from './scene/projection';
import { Counter, FloorPlant, FloorProp, LedgeBar, Oven, OvenHood, PrepBench, Rug, Stools, Table, WallPlanter } from './scene/props';
import { furnitureDeps, furnitureInputs, type FurnitureInputs } from './scene/furniture-inputs';
import { ChalkSign, DoorLeaf, Doormat, FrontWall, Planter, RoomShell } from './scene/room';
import { Car, CARS, Cloud, ParkedVehicle, Sidewalk, Street } from './scene/street';
import { buildCast } from './scene/cast';
import { STATIONS_IN_ORDER, type Station } from '../engine/pipeline';
import { pizzas } from '../engine/format';
import { HEADS } from '../content/tuning';
import { DeparturePops, HireBubble, StationBadge, type DepartureGeometry } from './scene/kitchen-hud';
import { badgeRowY, badgeXs, MIN_TAP_PT, progressStep, stationAt, stationRects } from './scene/stations';
import { DOOR_IN_Y, DOOR_OUT_Y } from './scene/layout';

export { CURB_Y, SCENE_H, SCENE_W, sceneFit } from './scene/projection';

export type StationKey = 'prep' | 'ovens' | 'counter' | 'drivers';

interface Props {
  id: NeighborhoodId;
  width: number;
  height: number;
  paused: boolean;
  /** A tap on a GM shop (rush). */
  onTap: () => void;
  /** A tap on one station of a shop without a GM. */
  onStation: (st: Station) => void;
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

const STATION_STAGE: Record<Station, Game.Stage[]> = { prep: ['prep'], oven: ['ovens'], counter: ['counter', 'customers'] };
const HIRE_LINE: Record<Station, string> = { prep: 'I got the dough, boss!', oven: 'Ovens are mine now.', counter: 'Next customer, please!' };



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
  const clock = useClock(15, paused);
  useGame((s) => sceneKey(s.game, id));
  const game = useGame.getState().game;
  const shop = game.shops[id];
  const nd = Game.def(id);
  const fp = shop.footprint;
  // Mutable per-mount scratch that does not drive rendering on its own: tap pills and the rush burst
  // (written in the tap handler) and the cash pop (written in the payout effect below).
  // where this view sits on the page, for turning a tap's pageX/pageY into scene coordinates
  const viewRef = useRef<ComponentRef<typeof View>>(null);
  const origin = useRef({ x: 0, y: 0 });
  const measureOrigin = () => viewRef.current?.measureInWindow((x: number, y: number) => {
    origin.current = { x, y };
  });
  const mem = useRef({ depIds: [] as number[], rushAt: -9, hintAt: -9, heads: null as null | Record<Station, boolean>, hire: null as null | { st: Station; at: number; text: string } });

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
  const { cast } = buildCast({ lay, shop, running, pace, clock, shopSeed, nIdx, pal });
  const fin = furnitureInputs({ id, name: nd.name, shop, running, rate, vehicle: game.vehicle });
  // Furniture only changes with upgrades and the dough/box counts, so it is built once per change (M12), not 15 times a second.
  // eslint-disable-next-line react-hooks/exhaustive-deps -- deps are lay + every value of `fin`, the builder's only inputs
  const furniture = useMemo(() => buildFurniture(lay, fin), [lay, ...furnitureDeps(fin)]);
  const items: Item[] = [...furniture, ...cast.map((c) => ({ y: c.sortY, el: <Person key={c.key} {...c.props} /> }))];
  items.sort((a, b) => b.y - a.y);

  // ---- departures: a carrier that paid this frame bumps the HUD cash (its coin just landed). Detected after
  // commit so render stays pure; ids only grow, so a remount or the end of a pause never replays old ones.
  const line = shop.line;
  useEffect(() => {
    const m = mem.current;
    const ids = line.departures.map((d) => d.id);
    const paid = m.depIds.some((i) => !ids.includes(i));
    m.depIds = ids;
    if (paid && !paused) {
      emitPayout();
      emitAudio({ type: 'cash' });
    }
    // a head just hired says hello over their station
    const auto = Game.automationOf(shop);
    if (m.heads) for (const st of STATIONS_IN_ORDER) if (auto[st] && !m.heads[st] && !shop.managed) m.hire = { st, at: clock, text: `${HEADS[id][st]}: ${HIRE_LINE[st]}` };
    m.heads = { ...auto };
  });
  const m = mem.current;
  // job timers move between the engine's 200 ms ticks: interpolate from the tick's wall time, never past 0
  const since = paused ? 0 : Math.max(0, (Date.now() - useGame.getState().tickAt) / 1000);
  const leftNow = (left: number) => Math.max(0, left - since);
  const auto = Game.automationOf(shop);
  const neckStage = Game.bottleneck(shop, game.vehicle);
  const next = shop.managed ? null : Game.nextStation(shop);
  const hinting = clock - m.hintAt < 1.2;
  const pulse = (Math.sin(clock * Math.PI * 2 * 1.2) + 1) / 2;
  const rushJump = clock - m.rushAt < 0.2 ? 1 - (clock - m.rushAt) / 0.2 : 0;
  const rects = useMemo(() => stationRects(lay, MIN_TAP_PT / fit.s), [lay, fit.s]);
  const bxs = useMemo(() => badgeXs(lay), [lay]);
  const by = badgeRowY();
  const waiting: Record<Station, number> = { prep: Game.tapBatch(shop), oven: line.prepped, counter: line.baked };
  const geo: DepartureGeometry = {
    driverPath: [P(lay.spots[0].x, lay.spots[0].y, 62), P(lay.door.lanes.driverX, DOOR_IN_Y, 62), P(lay.door.lanes.driverPauseX, DOOR_OUT_Y, 62)],
    register: P(lay.staff[0] + 12, 70, 78),
    hud: [SCENE_W / 2, -fit.oy / fit.s + 6],
  };
  const flicker = running ? Math.sin(clock * 9) * 1.4 : 0;
  const rushK = (clock - m.rushAt) / 0.6;
  const rushC = P((lay.ovenCols[0].x0 + lay.ovenCols[lay.ovenCols.length - 1].x1) / 2, D - 6, 50);
  // the sky band above the shop carries the feedback pills
  const [, fasciaBottom] = P(0, 0, FRONT_TOP - 20);
  const qy = fasciaBottom + 26;

  return (
    <View ref={viewRef} onLayout={measureOrigin} style={{ width, height, overflow: 'hidden' }}>
      <Pressable
        testID="shop"
        style={{ position: 'absolute', left: 0, top: 0, width, height }}
        onPress={(e) => {
          // page coordinates minus the view's measured origin: `locationX` is relative to whichever SVG child was
          // hit on web, so it can't place a tap on a station (every tap used to land on the oven)
          const ne = e?.nativeEvent;
          const fin = (v: unknown): v is number => typeof v === 'number' && Number.isFinite(v);
          const lx = fin(ne?.pageX) ? ne.pageX - origin.current.x : ne?.locationX;
          const ly = fin(ne?.pageY) ? ne.pageY - origin.current.y : ne?.locationY;
          const x = fin(lx) ? (lx - fit.ox) / fit.s : SCENE_W / 2;
          const y = fin(ly) ? (ly - fit.oy) / fit.s : 300;
          // a GM shop: any tap is a rush (every running job finishes sooner); otherwise the station under the finger
          if (shop.managed) {
            m.rushAt = clock;
            emitAudio({ type: 'rush' });
            onTap();
            return;
          }
          const st = stationAt(rects, x, y);
          if (st) {
            emitAudio({ type: 'tap' });
            onStation(st);
          } else m.hintAt = clock; // a miss points the hand at the station to tap
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
          {/* rush tap: the oven bank pulses and throws a burst of coins */}
          {(() => {
            const pulse = rushK >= 0 && rushK < 0.25 ? 1 + 0.05 * Math.sin((rushK / 0.25) * Math.PI) : 1;
            return (
              <G transform={pulse !== 1 ? `translate(${rushC[0]} ${rushC[1]}) scale(${pulse}) translate(${-rushC[0]} ${-rushC[1]})` : undefined}>
                {lay.ovens.map((o, i) => (
                  <Oven key={i} o={o} grade={shop.grade} lit={shop.managed ? running : !!line.oven} flicker={flicker * (i % 2 ? -1 : 1)} />
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
          {STATIONS_IN_ORDER.map((st) => {
            const job = line[st];
            const ready = !auto[st] && (next === st || (hinting && next === st));
            return (
              <StationBadge
                key={st}
                x={bxs[st]}
                y={by}
                step={job ? progressStep(1 - leftNow(job.left) / job.total) : 0}
                count={pizzas(job ? job.n : waiting[st])}
                tone={STATION_STAGE[st].includes(neckStage) ? 'tomato' : 'basil'}
                ready={ready}
                pulse={ready ? pulse : 0}
                head={auto[st] ? (shop.managed && id === 'downtown' ? 'N' : HEADS[id][st][0]) : ''}
                jump={job ? rushJump : 0}
              />
            );
          })}
          {m.hire && clock - m.hire.at < 2.5 && <HireBubble x={bxs[m.hire.st]} y={by + 34} text={m.hire.text} />}
          <DeparturePops deps={line.departures} left={(d) => leftNow(d.left)} geo={geo} />
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
  f.push({ y: 0, el: <FrontWall key="front" lay={lay} name={fin.name} signage={fin.signageTier} plants={fin.plants} /> });
  f.push({ y: -1, el: <Doormat key="mat" lay={lay} /> });
  if (lay.ledge) {
    f.push({ y: STOOL_Y, el: <Stools key="stools" x0={lay.ledge.x0} x1={lay.ledge.x1} /> });
    f.push({ y: LEDGE_Y, el: <LedgeBar key="ledge" x0={lay.ledge.x0} x1={lay.ledge.x1} /> });
  }
  if (fin.fp === 0) f.push({ y: 8, el: <FloorProp key="fprop" id={fin.id} x={lay.L + 22} y={8} /> });
  // an unmanaged shop's taller column sits higher: its board moves right, into the gap by the mat, and shrinks (D315)
  f.push({ y: fin.idleShop ? -18 : -34, el: <ChalkSign key="sign" x={fin.idleShop ? lay.sign.x + 10 : lay.sign.x} y={fin.idleShop ? -18 : -34} k={fin.idleShop ? 0.85 : 1} /> });
  f.push({ y: 16, el: <DoorLeaf key="leaf" lay={lay} /> });
  {
    // the potted tree stays fully on screen (its pot is ~14 wide) in the widest rooms
    const py = fin.idleShop ? -22 : -40;
    const px = Math.max(fin.idleShop ? lay.L - 18 : lay.L + 8, unprojectX(20, py));
    f.push({ y: py, el: <Planter key="pl" x={px} y={py} /> });
  }
  if (!fin.idleShop) {
    const [scx, scy] = P(lay.scooter.x, lay.scooter.y);
    f.push({ y: lay.scooter.y, el: <ParkedVehicle key="scooter" x={scx} y={scy} v={fin.vehicle} /> });
  }
  return f;
}
