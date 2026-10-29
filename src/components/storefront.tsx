// The main-screen scene: a pizzeria seen from the street, with the front wall cut away.
//   sky + clouds + neighbourhood skyline + trees
//   the room in perspective (back wall, side walls, receding floor): prep table, ovens, counter,
//   pickup spots, dining tables, all shaded with floor shadows
//   a front entrance on the right that customers and drivers use
//   the sidewalk (the upgrade buttons sit on it, drawn by the screen) and a street with traffic.
//
// Everything is drawn in a 393×680 "scene" box that is scaled to cover the available area,
// anchored to the bottom so the sidewalk and street are always visible (taller screens show more sky).
import { useEffect, useRef, type ReactElement } from 'react';
import { Pressable, View } from 'react-native';
import { FOOTPRINTS, NEIGHBORHOODS, OVEN_GRADES, TUNING } from '../content/tuning';
import type { NeighborhoodId } from '../content/types';
import { money } from '../engine/format';
import { C, F } from '../theme';
import { emitPayout } from './pulse-bus';
import Svg, { Circle, Defs, Ellipse, G, LinearGradient, Path, Rect, Stop, Text as SvgText } from 'react-native-svg';
import * as Game from '../engine/game';
import { INK, SCENE_W, CURB_Y, sceneFit, D, FRONT_TOP, P, kAt, shade } from './scene/projection';
import { layout, SEAT } from './scene/layout';
import { Box, FloorShadow } from './scene/primitives';
import { Kind, HAIR_COLORS, GUEST_SHIRTS, hash32, Mood, Person } from './scene/people';
import { Oven, OvenHood, Table, Rug, WallPlanter, FloorProp, LedgeBar, Stools, FloorPlant, Register } from './scene/props';
import { Backdrop } from './scene/background';
import { RoomShell, FrontWall, DoorLeaf, ChalkSign, Doormat, Planter } from './scene/room';
import { CARS, Car, ParkedVehicle, Street, Sidewalk, Cloud } from './scene/street';
import { useClock, along } from './scene/timelines';

export { CURB_Y, SCENE_H, SCENE_W, sceneFit } from './scene/projection';

export type StationKey = 'prep' | 'ovens' | 'counter' | 'drivers';

interface Props {
  game: Game.GameState;
  id: NeighborhoodId;
  width: number;
  height: number;
  paused: boolean;
  onTap: () => void;
  /** Tapping a station's tag opens its upgrade. */
  onStation: (s: StationKey) => void;
}

export function Storefront({ game, id, width, height, paused, onTap, onStation }: Props) {
  const clock = useClock(15, paused);
  const shop = game.shops[id];
  const nd = Game.def(id);
  const fp = shop.footprint;
  const mem = useRef({ phase: {} as Record<string, number>, lastPopAt: 0, lastSold: -1, shopId: '', pop: null as null | { at: number; text: string }, taps: [] as { at: number; x: number; y: number; text: string; color: string; count: number }[], rushAt: -9 });

  const ovenCount = Math.min(FOOTPRINTS[fp].ovenSlots, 1 + Math.floor((shop.ovens - 1) / 8));
  const cookCount = Math.min(3, 1 + Math.floor((shop.prep - 1) / 15));
  const staffCount = Math.min(2, 1 + Math.floor((shop.counter - 1) / 15));
  const driverSlots = [2, 2, 3, 3, 4][fp];
  const lay = layout(fp, ovenCount, cookCount, staffCount, Game.tablesShown(shop), driverSlots, shop.decor.plants);
  const running = shop.managed || shop.queued > 0.01;
  const rate = Game.shopRate(shop, game.vehicle);
  const neck = Game.bottleneck(shop, game.vehicle);
  const pace = running ? Math.min(2.6, 0.8 + Math.log10(1 + rate)) : 0;
  const t = clock * pace;
  const fit = sceneFit(width, height);
  const frontY = P(0, 0)[1];
  // per-shop character seeds, and a short blink every few seconds per person (critic D112/D113)
  const shopSeed = Array.from(id).reduce((h, ch) => (h * 31 + ch.charCodeAt(0)) % 997, 7) * 97;
  const nIdx = Math.max(0, NEIGHBORHOODS.findIndex((n) => n.id === id));
  const blinkAt = (sd: number) => ((clock + (sd % 37) * 0.31) % 3.7) < 0.13;

  // ---- people
  type Item = { y: number; el: ReactElement };
  const items: Item[] = [];
  const insideDoor: [number, number] = [lay.door.cx, 8];
  const outsideDoor: [number, number] = [lay.door.cx, -24];
  const driverCount = Math.min(shop.drivers, lay.spots.length * 3, 2 + fp);
  let payout = false;
  for (let i = 0; i < driverCount; i++) {
    const spot = lay.spots[i % lay.spots.length];
    const jitter = (hash32(shopSeed + i * 17) % 100) / 2500;
    const p = ((t / 6 + i / driverCount + jitter) % 1 + 1) % 1;
    const lane = (i % 3) * 6;
    // drivers walk in from up the street, pick up, and hurry off with the box: never fading (critic G55);
    // inside they route past the swung-in door leaf (critic G53)
    const offStreet: [number, number] = [SCENE_W + 50 + (i % 3) * 18, -30 - lane];
    // drivers use the right half of the doorway, walk-ins the left (critic D179)
    const outsideDoor: [number, number] = [lay.door.x1 - 6, -24 - lane];
    const insideDoor: [number, number] = [lay.door.x1 - 6, 8];
    const via: [number, number] = [lay.door.x1 - 8, 44];
    let pos: [number, number];
    let walking = true;
    let face = false;
    // a short wait at the spot (0.26–0.46) so drivers sharing a spot never overlap (critic D179)
    if (p < 0.12) {
      pos = along([offStreet, outsideDoor], p / 0.12);
      face = true;
    } else if (p < 0.18) pos = along([outsideDoor, insideDoor], (p - 0.12) / 0.06);
    else if (p < 0.26) {
      pos = along([insideDoor, via, [spot.x, spot.y]], (p - 0.18) / 0.08);
      face = true;
    } else if (p < 0.46) {
      pos = [spot.x, spot.y];
      walking = false;
    } else if (p < 0.54) pos = along([[spot.x, spot.y], via, insideDoor], (p - 0.46) / 0.08);
    else if (p < 0.6) pos = along([insideDoor, outsideDoor], (p - 0.54) / 0.06);
    else pos = along([outsideDoor, offStreet], (p - 0.6) / 0.4);
    // fade out past the right edge of the screen instead of piling up there (critic D192)
    const sxNow = P(pos[0], pos[1])[0];
    const o = Math.max(0, Math.min(1, (SCENE_W - 10 + 30 - sxNow) / 30));
    const prev = mem.current.phase[`d${i}`];
    if (running && prev !== undefined && prev < 0.54 && p >= 0.54) payout = true;
    mem.current.phase[`d${i}`] = p;
    if (running || i === 0) {
      const standing = !running ? true : !walking;
      items.push({
        y: running ? pos[1] : spot.y,
        el: <Person key={`d${i}`} x={running ? pos[0] : spot.x} y={running ? pos[1] : spot.y} kind="driver" seed={shopSeed + i + 10} blink={blinkAt(shopSeed + i + 10)} carry={running && p >= 0.46} step={standing ? 0 : clock * 12} arm={0} flip={running && face} o={o} mood={running && p >= 0.54 ? 'o' : 'smile'} />,
      });
    }
  }
  const guestCount = running ? Math.min(4, Math.ceil(lay.tables.length / 2)) : 0;
  const fixedFill = Math.min(1, 0.4 + shop.tables / 40);
  // concurrent people never share a shirt colour (critic D156)
  const shirtBase = hash32(shopSeed) % GUEST_SHIRTS.length;
  const hairBase = hash32(shopSeed + 9) % HAIR_COLORS.length;
  // seat i: shirt base+i, hair base+i; its companion +4 / +3 — neighbours never match (critic G67)
  const seatShirt = (i: number) => (shirtBase + i) % GUEST_SHIRTS.length;
  const seatHair = (i: number) => (hairBase + i) % HAIR_COLORS.length;
  /** A walk-in's colour, avoiding the diners (and companions) at its table and the two beside it. */
  const pickAvoid = (start: number, m: number, used: number[]) => {
    for (let k = 0; k < m; k++) if (!used.includes((start + k) % m)) return (start + k) % m;
    return start % m;
  };
  const near = (i: number) => [i - 1, i, i + 1].filter((j) => j >= 0 && j < lay.tables.length);
  const walkShirt = (i: number, cy: number) => pickAvoid(shirtBase + i * 3 + cy * 5, GUEST_SHIRTS.length, near(i).flatMap((j) => [seatShirt(j), (seatShirt(j) + 4) % GUEST_SHIRTS.length]));
  const walkHair = (i: number, cy: number) => pickAvoid(hairBase + i * 2 + cy * 5, HAIR_COLORS.length, near(i).flatMap((j) => [seatHair(j)]));
  // walk-ins order at the front-right of the counter, a second one queues toward the door (critic D166)
  // walk-ins order at the counter's right end, away from the door lanes and the pickup line (critic D189)
  const orderSpot = (i: number): [number, number] => [lay.counter.x1 - 4 + (i % 2) * 8, 58 - (i % 2) * 10];
  for (let i = 0; i < guestCount; i++) {
    const cyc = t / 9 + 0.3 + i / Math.max(2, guestCount);
    const p = ((cyc % 1) + 1) % 1;
    // a different customer every visit, and different crowds in every shop (critic D112)
    const gSeed = shopSeed + i * 2 + 3 + Math.floor(cyc) * 13;
    const table = lay.tables[i];
    const side = i % 2 ? 1 : -1; // the fixed diner's side at this table (critic D228)
    const seat: [number, number] = [table.x - side * SEAT, table.y];
    const start: [number, number] = [-30, -46];
    let pos: [number, number];
    let kind: Kind = 'guest';
    let walking = true;
    let o = 1;
    let face = false;
    let talking = false;
    const via: [number, number] = [lay.door.x0 + 16, 44];
    const orderAt = orderSpot(i);
    const gIn: [number, number] = [lay.door.x0 + 13, 8];
    const gOut: [number, number] = [lay.door.x0 + 13, -24];
    let mood: Mood = 'smile';
    if (p < 0.18) pos = along([start, [gOut[0], -46], gOut], p / 0.18);
    else if (p < 0.24) pos = along([gOut, gIn], (p - 0.18) / 0.06);
    else if (p < 0.34) {
      pos = along([gIn, via, orderAt], (p - 0.24) / 0.1);
    } else if (p < 0.42) {
      pos = orderAt;
      walking = false;
      face = true;
      talking = Math.sin(clock * 9) > -0.2;
    } else if (p < 0.5) {
      pos = along([orderAt, [seat[0] + 10, seat[1] + 8], seat], (p - 0.42) / 0.08);
      face = true;
    } else if (p < 0.8) {
      // seated on the chair opposite the table's regular, facing the table (critic G51/D228)
      pos = seat;
      kind = 'sit';
      walking = false;
      face = side < 0;
      const bite = Math.abs(Math.sin(clock * 2 + i));
      mood = bite > 1.4 / 2 ? 'chew' : bite < 0.3 ? 'happy' : 'smile';
    } else if (p < 0.88) pos = along([seat, via, gIn], (p - 0.8) / 0.08);
    else if (p < 0.92) pos = along([gIn, gOut], (p - 0.88) / 0.04);
    else pos = along([gOut, [SCENE_W + 50, -44]], (p - 0.92) / 0.08);
    o = 1;
    items.push({ y: pos[1] - 0.3, el: <Person key={`g${i}`} x={pos[0]} y={pos[1]} kind={kind} seed={gSeed} shirt={GUEST_SHIRTS[walkShirt(i, Math.floor(cyc))]} hair={HAIR_COLORS[walkHair(i, Math.floor(cyc))]} flip={face} step={walking ? clock * 12 : 0} o={o} talk={talking} mood={mood} blink={blinkAt(gSeed)} arm={kind === 'sit' ? Math.abs(Math.sin(clock * 2 + i)) * 2 : 0} /> });
  }
  // tables + seated diners: chairs, then the diner, then the table over their lap (critic D114)
  lay.tables.forEach((tb, i) => {
    if (lay.tables.length === 1) items.push({ y: tb.y + 12, el: <Rug key="rug" x={tb.x} y={tb.y} /> });
    items.push({ y: tb.y + 0.6, el: <Table key={`tb${i}`} x={tb.x} y={tb.y} tier={shop.decor.tables} part="back" /> });
    items.push({ y: tb.y - 0.6, el: <Table key={`tf${i}`} x={tb.x} y={tb.y} tier={shop.decor.tables} part="front" /> });
    const fixedIdx = i;
    // at least one customer is always eating, even on the very first screen (critic D177)
    if (fixedIdx < (running ? Math.max(1, Math.round(lay.tables.length * fixedFill)) : 1)) {
      const dSeed = shopSeed + i * 3 + 7 + Math.floor(t / 14 + i * 0.37) * 29;
      const bite = Math.abs(Math.sin(clock * 2 + i));
      const pose = (['none', 'slice', 'cup', 'lean'] as const)[(hash32(dSeed) >>> 3) % 4];
      items.push({ y: tb.y, el: <Person key={`s${i}`} x={tb.x + (i % 2 ? SEAT : -SEAT)} y={tb.y} kind="sit" flip={i % 2 === 1} seed={dSeed} act={pose} shirt={GUEST_SHIRTS[seatShirt(i)]} hair={HAIR_COLORS[seatHair(i)]} blink={blinkAt(dSeed)} arm={bite * 2} mood={pose === 'slice' ? 'chew' : bite > 0.7 ? 'chew' : bite < 0.3 ? 'happy' : 'smile'} /> });
      // a busy room seats a companion opposite, on tables no walk-in is heading for
      const cx = tb.x - (i % 2 ? SEAT : -SEAT);
      const crowded = lay.tables.some((o) => o !== tb && [o.x - SEAT, o.x + SEAT].some((sx) => Math.abs(sx - cx) < 18 && Math.abs(o.y - tb.y) < 32));
      if (running && i >= guestCount && !crowded && (shop.tables >= 13 ? i % 2 === 0 : fixedFill >= 0.6 && hash32(dSeed + 1) % 3 !== 0)) {
        const cSeed = dSeed + 501;
        const cPose = (['cup', 'none', 'slice', 'lean'] as const)[(hash32(cSeed) >>> 3) % 4];
        const cb = Math.abs(Math.sin(clock * 2 + i + 1.7));
        items.push({ y: tb.y - 0.1, el: <Person key={`s2${i}`} x={cx} y={tb.y} kind="sit" flip={i % 2 === 0} seed={cSeed} act={cPose} shirt={GUEST_SHIRTS[(seatShirt(i) + 4) % GUEST_SHIRTS.length]} hair={HAIR_COLORS[(seatHair(i) + 3) % HAIR_COLORS.length]} blink={blinkAt(cSeed)} arm={cb * 2} mood={cb > 0.7 ? 'chew' : cb < 0.3 ? 'happy' : 'smile'} /> });
      }
    }
  });
  // potted plants (plants decor)
  if (shop.decor.plants >= 1) {
    items.push({ y: 2, el: <FloorPlant key="pp1" x={lay.L + 4} y={2} k={0.8} /> });
  }
  if (shop.decor.plants >= 3) items.push({ y: 112, el: <WallPlanter key="pp4" lay={lay} /> });
  // kitchen crew + furniture
  lay.cooks.forEach((x, i) => items.push({ y: (lay.cooks.length === 1 ? 74 : 92) + (i % 2) * 8, el: <Person key={`c${i}`} x={x} y={(lay.cooks.length === 1 ? 74 : 92) + (i % 2) * 8} kind="cook" gold={shop.prep >= 100} front act={(['pin', 'toss', 'ladle'] as const)[i % 3]} mood={running && Math.sin(t * 4 + i) > 0.3 ? 'focus' : 'smile'} seed={shopSeed + i * 4 + 20} blink={blinkAt(shopSeed + i * 4 + 20)} arm={running ? Math.abs(Math.sin(t * 4 + i)) * 3 : 0} /> }));
  items.push({
    y: 66,
    el: (
      <G key="prep">
        <FloorShadow x={(lay.prep.x0 + lay.prep.x1) / 2} y={64} r={(lay.prep.x1 - lay.prep.x0) * 0.6} />
        {/* steel-topped wooden prep bench with legs and an undershelf of flour sacks (critic D155) */}
        {(() => {
          const { x0, x1 } = lay.prep;
          const [fa, fb] = [P(x0, 66, 18), P(x1, 66, 25)];
          const planks = Math.max(2, Math.floor((x1 - x0) / 14));
          return (
            <G>
              {[x0 + 1, x1 - 4].map((lx) => <Box key={`bl${lx}`} x0={lx} x1={lx + 3} y0={81} y1={84} h={18} color="#6B4330" />)}
              <Box x0={x0 + 2} x1={x1 - 2} y0={68} y1={82} h={2} z={4} color="#8E5A3C" />
              {[x0 + 1, x1 - 4].map((lx) => <Box key={`fl${lx}`} x0={lx} x1={lx + 3} y0={66} y1={69} h={18} color="#7A4A26" />)}
              <Box x0={x0} x1={x1} y0={66} y1={84} h={7} z={18} color="#9A6A44" top="#B07A50" />
              {Array.from({ length: planks - 1 }).map((_, i) => {
                const x = x0 + ((x1 - x0) * (i + 1)) / planks;
                const [px, py0] = P(x, 66, 18);
                const [, py1] = P(x, 66, 25);
                return <Path key={`pl${i}`} d={`M${px} ${py0} V${py1}`} stroke="#6B4330" strokeWidth={0.8} />;
              })}
              <Path d={`M${fa[0]} ${fa[1] - 3.4} H${fb[0]}`} stroke="#7A4A26" strokeWidth={0.6} opacity={0.6} />
              <Box x0={x0 - 1} x1={x1 + 1} y0={65} y1={85} h={3} z={25} color="#AEB4BB" top="#DDE2E7" />
              <Path d={`M${P(x0, 65, 28).join(' ')} L${P(x1, 65, 28).join(' ')}`} stroke="#fff" strokeWidth={1.4} opacity={0.8} />
              {(shop.prep >= 25 || lay.cooks.length === 1) && (() => {
                const [rx, ry] = P(x1 - 14, 70, 28);
                const kk = kAt(70);
                return (
                  <G transform={`translate(${rx} ${ry}) scale(${kk})`}>
                    <Rect x={-9} y={-3.4} width={18} height={3.4} rx={1.7} fill="#E2B985" stroke={INK} strokeWidth={0.8} />
                    <Rect x={-12} y={-2.6} width={3.4} height={1.8} rx={0.9} fill="#B07A50" stroke={INK} strokeWidth={0.6} />
                    <Rect x={8.6} y={-2.6} width={3.4} height={1.8} rx={0.9} fill="#B07A50" stroke={INK} strokeWidth={0.6} />
                  </G>
                );
              })()}
              {shop.prep >= 75 && (() => {
                const [rx, ry] = P(x0 + (x1 - x0) * 0.72, 80, 28);
                const kk = kAt(80) * 1.1;
                return (
                  <G transform={`translate(${rx} ${ry}) scale(${kk})`}>
                    {/* solid stand mixer: base, column, head, steel bowl (critic D226) */}
                    <Rect x={-7} y={-3.5} width={14} height={3.5} rx={1.2} fill="#D9443A" stroke={INK} strokeWidth={0.8} />
                    <Path d="M-6 -3.5 L-6 -17 Q-6 -21 -2 -21 L8 -21 Q10 -21 10 -18.5 L10 -15 L-1 -15 L-1 -3.5 Z" fill="#D9443A" stroke={INK} strokeWidth={0.9} strokeLinejoin="round" />
                    <Path d="M-4.6 -5 L-4.6 -17 Q-4.6 -19.4 -2.4 -19.6" stroke="#F26B5E" strokeWidth={1.4} fill="none" strokeLinecap="round" />
                    <Path d="M1 -3.5 Q1 -11 5.5 -11 Q10 -11 10 -3.5 Z" fill="#AEB6BE" stroke="#7C858E" strokeWidth={1} />
                    <Path d="M2.5 -5 Q3 -9 5.5 -9.4" stroke="#fff" strokeWidth={0.9} fill="none" strokeLinecap="round" />
                    <Path d="M5.5 -15 V-11" stroke="#7C858E" strokeWidth={1.2} />
                  </G>
                );
              })()}
              {shop.prep >= 50 && (() => {
                const [rx, ry] = P(x0 + 9, 80, 28);
                const kk = kAt(80);
                return (
                  <G transform={`translate(${rx} ${ry}) scale(${kk})`}>
                    <Path d="M-7 0 L-7.5 -9 L7.5 -9 L7 0 Z" fill="#9AA1A8" stroke={INK} strokeWidth={0.9} />
                    <Ellipse cx={0} cy={-9} rx={7.5} ry={2} fill="#C8463A" stroke={INK} strokeWidth={0.8} />
                    <Path d="M-7.5 -7 h-2.5 M7.5 -7 h2.5" stroke={INK} strokeWidth={1.2} />
                  </G>
                );
              })()}
            </G>
          );
        })()}
        {Array.from({ length: shop.managed ? 3 : Math.max(2, Math.min(8, Math.ceil(shop.queued / 1.5))) }).map((_, i) => {
          const [px, py] = P(lay.prep.x0 + 10 + (i % 4) * ((lay.prep.x1 - lay.prep.x0 - 20) / 3), 72 + Math.floor(i / 4) * 8, 28);
          return <Ellipse key={i} cx={px} cy={py} rx={7} ry={2.8} fill="#FBEFD6" stroke={INK} strokeWidth={0.8} />;
        })}
      </G>
    ),
  });
  // bakers stand centred in front of the oven bank, one per ~40 units, alternating depth (critic D167)
  {
    const b0 = lay.ovenCols[0].x0;
    const b1 = lay.ovenCols[lay.ovenCols.length - 1].x1;
    const nb = Math.max(1, Math.min(3, Math.floor((b1 - b0) / 40)));
    const bBase = nIdx % 3;
    for (let i = 0; i < nb; i++) {
      const bx = Math.min(b0 + ((b1 - b0) * (i + 0.5)) / nb, lay.counter.x0 - 26);
      const by = i % 2 ? 60 : 72;
      const sd = shopSeed + i * 3 + 31 + nIdx * 7;
      const ci = (bBase + i) % 3;
      items.push({ y: by, el: <Person key={`b${i}`} x={bx} y={by} shirt={['#B23A48', '#7E3A8E', '#2E6E8E'][ci]} kind="baker" seed={sd} blink={blinkAt(sd)} arm={running ? Math.abs(Math.sin(t * 3 + i)) * 2.5 : 0} peelK={i === nb - 1 && nb > 1 ? 0.7 : 1} act={(['pizza', 'peel', 'slide'] as const)[(i + bBase) % 3]} dot={['#D9443A', '#3FAE5A', '#2D9CDB'][(ci + 1) % 3]} /> });
    }
  }
  lay.staff.forEach((x, i) => items.push({ y: 92, el: <Person key={`st${i}`} x={x} y={92} kind="staff" front alt={i === 1} cap={['#F5C33B', '#F2994A', '#56CCF2', '#BB6BD9', '#6FCF97', '#EB6F92'][nIdx]} seed={shopSeed + i * 5 + 41} blink={blinkAt(shopSeed + i * 5 + 41)} arm={running ? Math.abs(Math.sin(t * 5 + i * 2)) * 2 : 0} /> }));
  const boxes = running ? Math.min(5, 1 + Math.round(Math.log2(1 + rate))) : 0;
  items.push({
    y: 64,
    el: (
      <G key="counter">
        <FloorShadow x={(lay.counter.x0 + lay.counter.x1) / 2} y={62} r={(lay.counter.x1 - lay.counter.x0) * 0.6} />
        <Box x0={lay.counter.x0} x1={lay.counter.x1} y0={64} y1={84} h={38} color="#B0653A" top="#E9DCC8" />
        {/* front panel trim */}
        {(() => {
          const [ax, ay] = P(lay.counter.x0 + 3, 64, 6);
          const [bx, by] = P(lay.counter.x1 - 3, 64, 32);
          return <Rect x={ax} y={by} width={bx - ax} height={ay - by} rx={3} fill="none" stroke="#8C4A26" strokeWidth={1.2} />;
        })()}
        {lay.staff.slice(0, 1).map((x, i) => (
          <Register key={i} x={x + 12} y={70} z={38} />
        ))}
        {Array.from({ length: boxes }).map((_, i) => (
          <Box key={`bx${i}`} x0={lay.counter.x1 - 24} x1={lay.counter.x1 - 6} y0={68} y1={80} h={5} z={38 + i * 6} color="#F6E7C1" top="#FFF6E5" />
        ))}
      </G>
    ),
  });
  // front of the shop + sidewalk props
  items.push({ y: 0, el: <FrontWall key="front" lay={lay} name={nd.name} signage={shop.decor.signage} plants={shop.decor.plants} /> });
  items.push({ y: -1, el: <Doormat key="mat" lay={lay} /> });
  {
    // window bar + stools fill the front-right floor until the front row of tables reaches it (critic D243)
    const frontRight = Math.max(-1e9, ...lay.tables.filter((tb) => tb.y < 20).map((tb) => tb.x + SEAT + 14));
    const lx0 = Math.max(lay.counter.x0 + 4, frontRight);
    const lx1 = lay.door.x0 - 12;
    if (lx1 - lx0 > 30) {
      items.push({ y: 13, el: <Stools key="stools" x0={lx0} x1={lx1} /> });
      items.push({ y: 5, el: <LedgeBar key="ledge" x0={lx0} x1={lx1} /> });
    }
  }
  const idleShop = !shop.managed && id !== 'downtown';
  if (fp === 0) items.push({ y: 8, el: <FloorProp key="fprop" id={id} x={lay.L + 22} y={8} /> });
  items.push({ y: idleShop ? -18 : -34, el: <ChalkSign key="sign" x={lay.door.x0 - 75} y={idleShop ? -18 : -34} /> });
  items.push({ y: 16, el: <DoorLeaf key="leaf" lay={lay} /> });
  items.push({ y: idleShop ? -22 : -40, el: <Planter key="pl" x={idleShop ? lay.L - 18 : lay.L + 8} y={idleShop ? -22 : -40} /> });
  const [scx, scy] = P(lay.scooter.x, lay.scooter.y);
  // the parked vehicle stays home while the unmanaged chip strip covers the kerb (critic D240)
  if (!idleShop) items.push({
    y: lay.scooter.y,
    el: (
      <G key="scooter">
        <ParkedVehicle x={scx} y={scy} v={game.vehicle} />
      </G>
    ),
  });
  items.sort((a, b) => b.y - a.y);

  // ---- cash pop: real earnings since the last pop (critic G19)
  const m = mem.current;
  if (m.shopId !== id || m.lastSold > shop.sold || m.lastSold < 0) {
    m.shopId = id;
    m.lastSold = shop.sold;
    m.pop = null;
  }
  if (payout && clock - m.lastPopAt > 0.9) {
    const earned = (shop.sold - m.lastSold) * Game.valuePerPizza(id, shop, game.vehicle);
    if (earned > 0) m.pop = { at: clock, text: `+${money(earned)}` };
    m.lastPopAt = clock;
    m.lastSold = shop.sold;
  }
  useEffect(() => {
    if (payout && !paused) emitPayout();
  });
  const pop = m.pop && clock - m.pop.at < 1.2 ? { k: (clock - m.pop.at) / 1.2, text: m.pop.text } : null;
  const taps = m.taps.filter((tp) => clock - tp.at < 0.9);
  const flicker = running ? Math.sin(clock * 9) * 1.4 : 0;

  const rushK = (clock - m.rushAt) / 0.6;
  const rushC = P((lay.ovenCols[0].x0 + lay.ovenCols[lay.ovenCols.length - 1].x1) / 2, D - 6, 50);
  // ---- driver-count badge above the pickup strip
  // ---- the sky band above the shop carries the feedback pills (critic D77)
  const [, fasciaBottom] = P(0, 0, FRONT_TOP - 20);
  const qy = fasciaBottom + 26;

  // Clouds and cars move on the clock even when the shop is idle.
  const cloudXs = [
    { x0: 60, y: 34, k: 0.8, v: 4 },
    { x0: 260, y: 20, k: 1.0, v: 3 },
    { x0: 360, y: 70, k: 0.6, v: 5 },
  ];
  const span = SCENE_W + 200;

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
          <Defs>
            <LinearGradient id="sheen" x1="0" y1="0" x2="1" y2="1">
              <Stop offset="0" stopColor="#FFFFFF" stopOpacity={0} />
              <Stop offset="0.45" stopColor="#FFFFFF" stopOpacity={0.35} />
              <Stop offset="0.6" stopColor="#FFFFFF" stopOpacity={0} />
            </LinearGradient>
            <LinearGradient id="glass" x1="0" y1="0" x2="0" y2="1">
              <Stop offset="0" stopColor="#A9D4EC" stopOpacity={0.6} />
              <Stop offset="1" stopColor="#A9D4EC" stopOpacity={0.4} />
            </LinearGradient>
            <LinearGradient id="ember" x1="0" y1="0" x2="0" y2="1">
              <Stop offset="0" stopColor="#5A1A0A" />
              <Stop offset="0.45" stopColor="#E8432E" />
              <Stop offset="1" stopColor="#FFB23A" />
            </LinearGradient>
            {OVEN_GRADES.map((g, i) => (
              <LinearGradient key={i} id={`oven${i}`} x1="0" y1="0" x2="1" y2="0">
                <Stop offset="0" stopColor={shade(g.color, 0.3)} />
                <Stop offset="0.5" stopColor={g.color} />
                <Stop offset="1" stopColor={shade(g.color, -0.35)} />
              </LinearGradient>
            ))}
          </Defs>
          <Backdrop id={id} />
          {cloudXs.map((c, i) => (
            <Cloud key={i} x={((c.x0 + clock * c.v) % span) - 100} y={c.y} k={c.k} dusk={id === 'uptown'} />
          ))}
          <Sidewalk frontY={frontY} />
          <Street />
          <RoomShell id={id} lay={lay} wall={nd.wall} fp={fp} flooring={shop.decor.flooring} walls={shop.decor.walls} signage={shop.decor.signage} plants={shop.decor.plants} />
          <OvenHood lay={lay} grade={shop.grade} mural={shop.decor.walls >= 3} />
          {/* rush tap: the oven bank pulses and throws a burst of coins (critic D163) */}
          {(() => {
            const rk = (clock - m.rushAt) / 0.6;
            const [ocx, ocy] = P((lay.ovenCols[0].x0 + lay.ovenCols[lay.ovenCols.length - 1].x1) / 2, D - 6, 50);
            const pulse = rk >= 0 && rk < 0.25 ? 1 + 0.05 * Math.sin((rk / 0.25) * Math.PI) : 1;
            return (
              <G>
                <G transform={pulse !== 1 ? `translate(${ocx} ${ocy}) scale(${pulse}) translate(${-ocx} ${-ocy})` : undefined}>
          {lay.ovens.map((o, i) => (
            <Oven key={i} o={o} grade={shop.grade} lit={running} flicker={flicker * (i % 2 ? -1 : 1)} />
          ))}
                </G>
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
            const raw = (c.offset + clock * c.speed) % span;
            const x = dir === 1 ? raw - 100 : SCENE_W + 100 - raw;
            return (
              <G key={i} transform={`translate(${x} ${c.lane === 0 ? CURB_Y + 30 : CURB_Y + 62}) scale(0.86)`}>
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
          {/* cash pop in the sky band, on a basil pill so it reads over any backdrop (critic D107) */}
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
}
