// The main-screen scene: a pizzeria seen from the street, with the front wall cut away.
//   sky + clouds + neighbourhood skyline + trees
//   the room in perspective (back wall, side walls, receding floor): prep table, ovens, counter,
//   pickup spots, dining tables, all shaded with floor shadows
//   a front entrance on the right that customers and drivers use
//   the sidewalk (the upgrade buttons sit on it, drawn by the screen) and a street with traffic.
//
// Everything is drawn in a 393×680 "scene" box that is scaled to cover the available area,
// anchored to the bottom so the sidewalk and street are always visible (taller screens show more sky).
import { memo, useEffect, useMemo, useRef, type ReactElement } from 'react';
import { Pressable, View } from 'react-native';
import Svg, { Circle, G, Path, Rect, Text as SvgText } from 'react-native-svg';
import { FOOTPRINTS, NEIGHBORHOODS, TUNING } from '../content/tuning';
import type { NeighborhoodId } from '../content/types';
import { money } from '../engine/format';
import * as Game from '../engine/game';
import { useGame } from '../store/game-store';
import { C, F } from '../theme';
import { emitPayout } from './pulse-bus';
import { Backdrop } from './scene/background';
import { useClock } from './scene/clock';
import { SceneDefs } from './scene/defs';
import { FRONT_ROW_Y, LEDGE_Y, SEAT, STOOL_Y, layout } from './scene/layout';
import { seatPalette } from './scene/palette';
import { GUEST_SHIRTS, HAIR_COLORS, hash32, type Mood, Person } from './scene/people';
import { CURB_Y, D, FRONT_TOP, INK, P, SCENE_W, sceneFit, unprojectX } from './scene/projection';
import { Counter, FloorPlant, FloorProp, LedgeBar, Oven, OvenHood, PrepBench, Rug, Stools, Table, WallPlanter } from './scene/props';
import { ChalkSign, DoorLeaf, Doormat, FrontWall, Planter, RoomShell } from './scene/room';
import { Car, CARS, Cloud, ParkedVehicle, Sidewalk, Street } from './scene/street';
import { driverPhase, driverPose, guestPose, payoutCrossed } from './scene/timelines';

export { CURB_Y, SCENE_H, SCENE_W, sceneFit } from './scene/projection';

export type StationKey = 'prep' | 'ovens' | 'counter' | 'drivers';

interface Props {
  id: NeighborhoodId;
  width: number;
  height: number;
  paused: boolean;
  onTap: () => void;
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
const BAKER_SHIRTS = ['#B23A48', '#7E3A8E', '#2E6E8E'];
const BAKER_DOTS = ['#D9443A', '#3FAE5A', '#2D9CDB'];
const STAFF_CAPS = ['#F5C33B', '#F2994A', '#56CCF2', '#BB6BD9', '#6FCF97', '#EB6F92'];
const SEATED_ACTS = ['none', 'slice', 'cup', 'lean'] as const;
const COMPANION_ACTS = ['cup', 'none', 'slice', 'lean'] as const;
const COOK_ACTS = ['pin', 'toss', 'ladle'] as const;
const BAKER_ACTS = ['pizza', 'peel', 'slide'] as const;

type Tap = { at: number; x: number; y: number; text: string; color: string; count: number };


/** Opacity for a figure at screen x: fades over 30 units at both screen edges, starting 30 inside. */
const edgeFade = (sx: number) => Math.max(0, Math.min(1, (SCENE_W - sx) / 30, (sx + 0) / 30));

/** Per-shop character seed (stable crowd per neighbourhood). */
const seedFor = (id: string) => Array.from(id).reduce((h, ch) => (h * 31 + ch.charCodeAt(0)) % 997, 7) * 97;

/**
 * Re-renders on its own 15 fps clock (reading the latest game state each frame) and when the shop's
 * upgrades change. The parent's 200 ms game ticks don't re-render it, and a paused scene stays still.
 */
export const Storefront = memo(function Storefront({ id, width, height, paused, onTap }: Props) {
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
  const mem = useRef({ phases: [] as number[], lastPopAt: 0, lastSold: -1, shopId: '', pop: null as null | { at: number; text: string }, taps: [] as Tap[], rushAt: -9 });

  const ovenCount = Math.min(FOOTPRINTS[fp].ovenSlots, 1 + Math.floor((shop.ovens - 1) / 8));
  const cookCount = Math.min(3, 1 + Math.floor((shop.prep - 1) / 15));
  const staffCount = Math.min(2, 1 + Math.floor((shop.counter - 1) / 15));
  const driverSlots = [2, 2, 3, 3, 4][fp];
  const tablesShown = Game.tablesShown(shop);
  const plants = shop.decor.plants;
  // geometry only changes with upgrades, so the layout object stays identical across frames and the
  // memoised layers that take `lay` (room shell, front wall, door, mat, hood) skip re-rendering
  const lay = useMemo(() => layout(fp, ovenCount, cookCount, staffCount, tablesShown, driverSlots, plants), [fp, ovenCount, cookCount, staffCount, tablesShown, driverSlots, plants]);
  const running = shop.managed || shop.queued > 0.01;
  const rate = Game.shopRate(shop, game.vehicle);
  const pace = running ? Math.min(2.6, 0.8 + Math.log10(1 + rate)) : 0;
  const t = clock * pace;
  // Arm work and eating run on a 7.5 Hz pose clock (every other frame), so a figure's limbs keep the same
  // props across two frames and their memo holds; placement and walking still move at the full 15 fps.
  const poseClock = Math.floor(clock * 7.5) / 7.5;
  const pt = poseClock * pace;
  const fit = sceneFit(width, height);
  const frontY = P(0, 0)[1];
  const shopSeed = seedFor(id);
  const nIdx = Math.max(0, NEIGHBORHOODS.findIndex((n) => n.id === id));
  // a short blink every few seconds per person
  const blinkAt = (sd: number) => (clock + (sd % 37) * 0.31) % 3.7 < 0.13;
  const pal = useMemo(
    () => seatPalette(hash32(shopSeed) % GUEST_SHIRTS.length, hash32(shopSeed + 9) % HAIR_COLORS.length, GUEST_SHIRTS.length, HAIR_COLORS.length, lay.tables.length),
    [shopSeed, lay.tables.length],
  );

  // ---- people
  type Item = { y: number; el: ReactElement };
  const items: Item[] = [];
  const driverCount = Math.min(shop.drivers, lay.spots.length * 3, 2 + fp);
  const phases: number[] = [];
  for (let i = 0; i < driverCount; i++) {
    const jitter = (hash32(shopSeed + i * 17) % 100) / 2500;
    const p = driverPhase(i, driverCount, t, jitter);
    phases.push(p);
    if (!running && i > 0) continue;
    const spot = lay.spots[i % lay.spots.length];
    const dp = running ? driverPose(lay, i, p, SCENE_W) : null;
    const [x, y] = dp ? dp.pos : [spot.x, spot.y];
    // fade out across the right edge of the screen instead of piling up there
    const o = edgeFade(P(x, y)[0]);
    if (o <= 0) continue; // off-screen: don't keep an invisible figure mounted
    const sd = shopSeed + i + 10;
    items.push({
      y,
      el: <Person key={`d${i}`} x={x} y={y} kind="driver" seed={sd} blink={blinkAt(sd)} carry={!!dp?.carry} carryWalk={!!dp && dp.carry && dp.walking} step={dp?.walking ? clock * 12 : 0} arm={0} flip={!!dp?.face} o={o} mood={dp?.leaving ? 'o' : 'smile'} />,
    });
  }
  const guestCount = running ? Math.min(4, Math.ceil(lay.tables.length / 2)) : 0;
  const fixedFill = Math.min(1, 0.4 + shop.tables / 40);
  for (let i = 0; i < guestCount; i++) {
    const cyc = t / 9 + 0.3 + i / Math.max(2, guestCount);
    const lap = Math.floor(cyc);
    const g = guestPose(lay, i, ((cyc % 1) + 1) % 1, SCENE_W);
    // a different customer every visit, and different crowds in every shop
    const gSeed = shopSeed + i * 2 + 3 + lap * 13;
    const seated = g.stage === 'seated';
    const bite = Math.abs(Math.sin(poseClock * 2 + i));
    const mood: Mood = seated ? (bite > 0.7 ? 'chew' : bite < 0.3 ? 'happy' : 'smile') : 'smile';
    const go = edgeFade(P(g.pos[0], g.pos[1])[0]);
    if (go <= 0) continue;
    items.push({
      y: g.pos[1] - 0.3,
      el: <Person key={`g${i}`} x={g.pos[0]} y={g.pos[1]} kind={seated ? 'sit' : 'guest'} seed={gSeed} shirt={GUEST_SHIRTS[pal.walkShirt(i, lap)]} hair={HAIR_COLORS[pal.walkHair(i, lap)]} o={go} flip={g.face} step={g.walking ? clock * 12 : 0} talk={g.stage === 'order' && Math.sin(clock * 9) > -0.2} mood={mood} blink={blinkAt(gSeed)} arm={seated ? bite * 2 : 0} />,
    });
  }
  // tables + seated diners: chairs, then the diner, then the table over their lap
  const regulars = running ? Math.max(1, Math.round(lay.tables.length * fixedFill)) : 1; // someone is always eating
  lay.tables.forEach((tb, i) => {
    if (lay.tables.length === 1) items.push({ y: tb.y + 12, el: <Rug key="rug" x={tb.x} y={tb.y} /> });
    items.push({ y: tb.y + 0.6, el: <Table key={`tb${i}`} x={tb.x} y={tb.y} tier={shop.decor.tables} part="back" /> });
    items.push({ y: tb.y - 0.6, el: <Table key={`tf${i}`} x={tb.x} y={tb.y} tier={shop.decor.tables} part="front" /> });
    if (i >= regulars) return;
    const dSeed = shopSeed + i * 3 + 7 + Math.floor(t / 14 + i * 0.37) * 29;
    const bite = Math.abs(Math.sin(poseClock * 2 + i));
    const act = SEATED_ACTS[(hash32(dSeed) >>> 3) % 4];
    const side = i % 2 ? SEAT : -SEAT;
    items.push({ y: tb.y, el: <Person key={`s${i}`} x={tb.x + side} y={tb.y} kind="sit" flip={i % 2 === 1} seed={dSeed} act={act} shirt={GUEST_SHIRTS[pal.shirt(i)]} hair={HAIR_COLORS[pal.hair(i)]} blink={blinkAt(dSeed)} arm={bite * 2} mood={act === 'slice' || bite > 0.7 ? 'chew' : bite < 0.3 ? 'happy' : 'smile'} /> });
    // a busy room seats a companion opposite, on tables no walk-in is heading for
    const cx = tb.x - side;
    const crowded = lay.tables.some((o) => o !== tb && Math.abs(o.y - tb.y) < 32 && (Math.abs(o.x - SEAT - cx) < 18 || Math.abs(o.x + SEAT - cx) < 18));
    if (running && i >= guestCount && !crowded && (shop.tables >= 13 ? i % 2 === 0 : fixedFill >= 0.6 && hash32(dSeed + 1) % 3 !== 0)) {
      const cSeed = dSeed + 501;
      const cb = Math.abs(Math.sin(poseClock * 2 + i + 1.7));
      items.push({ y: tb.y - 0.1, el: <Person key={`s2${i}`} x={cx} y={tb.y} kind="sit" flip={i % 2 === 0} seed={cSeed} act={COMPANION_ACTS[(hash32(cSeed) >>> 3) % 4]} shirt={GUEST_SHIRTS[pal.companionShirt(i)]} hair={HAIR_COLORS[pal.companionHair(i)]} blink={blinkAt(cSeed)} arm={cb * 2} mood={cb > 0.7 ? 'chew' : cb < 0.3 ? 'happy' : 'smile'} /> });
    }
  });
  // potted plants (plants decor); the corner fern only stands in a starter room, before a front row of tables
  if (plants >= 1 && !lay.tables.some((tb) => tb.y === FRONT_ROW_Y)) items.push({ y: 2, el: <FloorPlant key="pp1" x={lay.L + 4} y={2} k={0.8} /> });
  if (plants >= 3) items.push({ y: 112, el: <WallPlanter key="pp4" lay={lay} /> });
  // kitchen crew + furniture
  const cookY = lay.cooks.length === 1 ? 74 : 92;
  lay.cooks.forEach((x, i) => {
    const sd = shopSeed + i * 4 + 20;
    items.push({ y: cookY + (i % 2) * 8, el: <Person key={`c${i}`} x={x} y={cookY + (i % 2) * 8} kind="cook" gold={shop.prep >= 100} front act={COOK_ACTS[i % 3]} mood={running && Math.sin(pt * 4 + i) > 0.3 ? 'focus' : 'smile'} seed={sd} blink={blinkAt(sd)} arm={running ? Math.abs(Math.sin(pt * 4 + i)) * 3 : 0} /> });
  });
  items.push({ y: 66, el: <PrepBench key="prep" lay={lay} prep={shop.prep} dough={shop.managed ? 3 : Math.max(2, Math.min(8, Math.ceil(shop.queued / 1.5)))} /> });
  // bakers in front of the oven bank; the one by the counter holds the peel upright so it clears the counter
  const bBase = nIdx % 3;
  lay.bakers.forEach((b, i) => {
    const sd = shopSeed + i * 3 + 31 + nIdx * 7;
    const ci = (bBase + i) % 3;
    items.push({ y: b.y, el: <Person key={`b${i}`} x={b.x} y={b.y} shirt={BAKER_SHIRTS[ci]} kind="baker" seed={sd} blink={blinkAt(sd)} arm={running ? Math.abs(Math.sin(pt * 3 + i)) * 2.5 : 0} peelK={b.nearCounter ? 0.7 : 1} act={b.nearCounter ? 'peel' : BAKER_ACTS[(i + bBase) % 3]} dot={BAKER_DOTS[(ci + 1) % 3]} /> });
  });
  lay.staff.forEach((x, i) => {
    const sd = shopSeed + i * 5 + 41;
    items.push({ y: 92, el: <Person key={`st${i}`} x={x} y={92} kind="staff" front alt={i === 1} cap={STAFF_CAPS[nIdx]} seed={sd} blink={blinkAt(sd)} arm={running ? Math.abs(Math.sin(pt * 5 + i * 2)) * 2 : 0} /> });
  });
  items.push({ y: 64, el: <Counter key="counter" lay={lay} boxes={running ? Math.min(5, 1 + Math.round(Math.log2(1 + rate))) : 0} /> });
  // front of the shop + sidewalk props
  items.push({ y: 0, el: <FrontWall key="front" lay={lay} name={nd.name} signage={shop.decor.signage} plants={plants} /> });
  items.push({ y: -1, el: <Doormat key="mat" lay={lay} /> });
  if (lay.ledge) {
    items.push({ y: STOOL_Y, el: <Stools key="stools" x0={lay.ledge.x0} x1={lay.ledge.x1} /> });
    items.push({ y: LEDGE_Y, el: <LedgeBar key="ledge" x0={lay.ledge.x0} x1={lay.ledge.x1} /> });
  }
  // an unmanaged shop's chip strip covers the kerb, so its sidewalk props move up and the vehicle stays home
  const idleShop = !shop.managed && id !== 'downtown';
  if (fp === 0) items.push({ y: 8, el: <FloorProp key="fprop" id={id} x={lay.L + 22} y={8} /> });
  items.push({ y: idleShop ? -18 : -34, el: <ChalkSign key="sign" x={lay.door.x0 - 75} y={idleShop ? -18 : -34} /> });
  items.push({ y: 16, el: <DoorLeaf key="leaf" lay={lay} /> });
  {
    // the potted tree stays fully on screen (its pot is ~14 wide) in the widest rooms
    const py = idleShop ? -22 : -40;
    const px = Math.max(idleShop ? lay.L - 18 : lay.L + 8, unprojectX(20, py));
    items.push({ y: py, el: <Planter key="pl" x={px} y={py} /> });
  }
  if (!idleShop) {
    const [scx, scy] = P(lay.scooter.x, lay.scooter.y);
    items.push({ y: lay.scooter.y, el: <ParkedVehicle key="scooter" x={scx} y={scy} v={game.vehicle} /> });
  }
  items.sort((a, b) => b.y - a.y);

  // ---- cash pop: real earnings since the last pop, detected after commit (render stays pure)
  const valuePer = Game.valuePerPizza(id, shop, game.vehicle);
  useEffect(() => {
    const m = mem.current;
    if (m.shopId !== id || m.lastSold > shop.sold || m.lastSold < 0) {
      m.shopId = id;
      m.lastSold = shop.sold;
      m.pop = null;
      m.phases = phases;
      return;
    }
    const crossed = running && payoutCrossed(m.phases, phases);
    m.phases = phases;
    if (!crossed || paused) return;
    emitPayout();
    if (clock - m.lastPopAt > 0.9) {
      const earned = (shop.sold - m.lastSold) * valuePer;
      if (earned > 0) m.pop = { at: clock, text: `+${money(earned)}` };
      m.lastPopAt = clock;
      m.lastSold = shop.sold;
    }
  });
  const m = mem.current;
  const pop = m.pop && clock - m.pop.at < 1.2 ? { k: (clock - m.pop.at) / 1.2, text: m.pop.text } : null;
  const taps = m.taps.filter((tp) => clock - tp.at < 0.9);
  const flicker = running ? Math.sin(clock * 9) * 1.4 : 0;
  const rushK = (clock - m.rushAt) / 0.6;
  const rushC = P((lay.ovenCols[0].x0 + lay.ovenCols[lay.ovenCols.length - 1].x1) / 2, D - 6, 50);
  // the sky band above the shop carries the feedback pills
  const [, fasciaBottom] = P(0, 0, FRONT_TOP - 20);
  const qy = fasciaBottom + 26;

  return (
    <View style={{ width, height, overflow: 'hidden' }}>
      <Pressable
        testID="shop"
        style={{ position: 'absolute', left: 0, top: 0, width, height }}
        onPress={(e) => {
          const lx = e?.nativeEvent?.locationX;
          const ly = e?.nativeEvent?.locationY;
          const x = typeof lx === 'number' && Number.isFinite(lx) ? (lx - fit.ox) / fit.s : SCENE_W / 2;
          const y = typeof ly === 'number' && Number.isFinite(ly) ? (ly - fit.oy) / fit.s : 300;
          const full = !shop.managed && shop.queued > TUNING.tapQueueMax - 1;
          const text = shop.managed ? `+${money(Game.shopEarnings(game, id) * TUNING.rushSeconds)} rush!` : full ? 'Kitchen full!' : `+${TUNING.tapBatch}`;
          const color = shop.managed ? C.basilDark : full ? INK : C.tomatoDark;
          const live = m.taps.filter((tp) => clock - tp.at < 0.9);
          const last = live[live.length - 1];
          if (last && last.text === text) {
            last.count += 1;
            last.at = clock;
            m.taps = live;
          } else {
            m.taps = [{ at: clock, x: Math.max(70, Math.min(SCENE_W - 70, x)), y: 52, text, color, count: 1 }];
          }
          if (shop.managed) m.rushAt = clock;
          onTap();
        }}>
        <Svg width={width} height={height} viewBox={`${-fit.ox / fit.s} ${-fit.oy / fit.s} ${width / fit.s} ${height / fit.s}`}>
          <SceneDefs />
          <Backdrop id={id} wide={lay.L < 30} />
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
                  <Oven key={i} o={o} grade={shop.grade} lit={running} flicker={flicker * (i % 2 ? -1 : 1)} />
                ))}
              </G>
            );
          })()}
          {items.map((it) => it.el)}
          {/* rush coins fly above everyone */}
          {rushK >= 0 && rushK < 1 &&
                  Array.from({ length: 6 }).map((_, j) => {
                    const ang = -Math.PI / 2 + (j - 2.5) * 0.42;
                    const d = 18 + rushK * 46;
                    const cx = rushC[0] + Math.cos(ang) * d;
                    const cy = rushC[1] + Math.sin(ang) * d + rushK * rushK * 40;
                    return (
                      <G key={j} opacity={rushK > 0.75 ? (1 - rushK) / 0.25 : 1}>
                        <Circle cx={cx} cy={cy} r={5.5} fill="#FFC531" stroke={INK} strokeWidth={1} />
                        <Circle cx={cx} cy={cy} r={3.4} fill="none" stroke="#E0A100" strokeWidth={0.9} />
                        <Circle cx={cx - 1.6} cy={cy - 1.8} r={1.1} fill="#fff" opacity={0.7} />
                      </G>
                    );
                  })}
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
          {/* idle prompt + tap queue, high on the back wall */}
          {!shop.managed && (
            <G>
              {(() => {
                const qx = SCENE_W / 2;
                return (
                  <G>
                    <Rect x={qx - 56} y={qy - 1} width={112} height={14} rx={7} fill="#fff" stroke={INK} strokeWidth={1} />
                    <Rect x={qx - 55} y={qy} width={110 * Math.min(1, shop.queued / TUNING.tapQueueMax)} height={12} rx={6} fill={C.cheese} />
                    <SvgText x={qx} y={qy + 9.5} fontFamily={F.bold} fontSize={10} fill={INK} textAnchor="middle">
                      {`${Math.ceil(shop.queued)} / ${TUNING.tapQueueMax} queued`}
                    </SvgText>
                    {!running && (
                      <G transform={`translate(${qx} ${qy + 36}) scale(${1 + 0.06 * Math.sin(clock * 5)})`}>
                        <Rect x={-70} y={-17} width={140} height={34} rx={17} fill={C.tomato} stroke="#fff" strokeWidth={2.4} />
                        <SvgText x={0} y={7} fontFamily={F.bold} fontSize={18} fill="#fff" textAnchor="middle">
                          TAP TO BAKE!
                        </SvgText>
                      </G>
                    )}
                  </G>
                );
              })()}
            </G>
          )}
          {/* tap feedback pills: repeats merge into one with a ×N counter */}
          {taps.map((tp) => {
            const k = (clock - tp.at) / 0.9;
            const label = tp.count > 1 ? `${tp.text} ×${tp.count}` : tp.text;
            const slice = /^\+\d+$/.test(tp.text);
            const w = label.length * 6.4 + 14 + (slice ? 14 : 0);
            return (
              <G key={`${tp.text}`} opacity={k < 0.7 ? 1 : 1 - (k - 0.7) / 0.3}>
                <Rect x={tp.x - w / 2} y={tp.y - 12 - k * 14} width={w} height={18} rx={9} fill={tp.color} stroke="#fff" strokeWidth={1.4} />
                <SvgText x={tp.x - (slice ? 7 : 0)} y={tp.y + 1.5 - k * 14} fontFamily={F.bold} fontSize={11} fill="#fff" textAnchor="middle">
                  {label}
                </SvgText>
                {slice && (
                  <G transform={`translate(${tp.x - 7 + label.length * 3.3 + 3} ${tp.y - 9 - k * 14})`}>
                    <Path d="M0 1.5 Q6 -1 12 1.5 L6 13 Z" fill="#FFC531" stroke={INK} strokeWidth={0.9} strokeLinejoin="round" />
                    <Path d="M0 1.5 Q6 -1 12 1.5 L11.3 3 Q6 0.8 0.7 3 Z" fill="#E9A64B" />
                    <Circle cx={4.5} cy={4.5} r={1.2} fill="#E8432E" />
                    <Circle cx={7.6} cy={7.2} r={1.1} fill="#E8432E" />
                  </G>
                )}
              </G>
            );
          })}
          {/* cash pop in the sky band, on a basil pill so it reads over any backdrop */}
          {pop && (() => {
            const w = pop.text.length * 10 + 18;
            const x = Math.min(SCENE_W - 6 - w / 2, P(lay.door.cx, 0)[0]) - 30;
            const y = P(0, 0, FRONT_TOP - 62)[1] - pop.k * 20;
            return (
              <G opacity={pop.k > 0.87 ? (1 - pop.k) / 0.13 : 1}>
                <Rect x={x - w / 2} y={y - 15} width={w} height={22} rx={11} fill={C.basilDark} stroke="#fff" strokeWidth={1.8} />
                <SvgText x={x} y={y + 1.5} fontFamily={F.bold} fontSize={15} fill="#fff" textAnchor="middle">
                  {pop.text}
                </SvgText>
              </G>
            );
          })()}
        </Svg>
      </Pressable>
    </View>
  );
});
