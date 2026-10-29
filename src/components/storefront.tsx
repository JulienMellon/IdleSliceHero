// The main-screen scene: a pizzeria seen from the street, with the front wall cut away.
//   sky + clouds + neighbourhood skyline + trees
//   the room in perspective (back wall, side walls, receding floor): prep table, ovens, counter,
//   pickup spots, dining tables, all shaded with floor shadows
//   a front entrance on the right that customers and drivers use
//   the sidewalk (the upgrade buttons sit on it, drawn by the screen) and a street with traffic.
//
// Everything is drawn in a 393×680 "scene" box that is scaled to cover the available area,
// anchored to the bottom so the sidewalk and street are always visible (taller screens show more sky).
import { memo, useEffect, useRef, useState, type ReactElement } from 'react';
import { Pressable, View } from 'react-native';
import Svg, { Circle, Defs, Ellipse, G, LinearGradient, Path, Polygon, Rect, Stop, Text as SvgText } from 'react-native-svg';

import { FOOTPRINTS, NEIGHBORHOODS, OVEN_GRADES, TUNING, VEHICLES } from '../content/tuning';
import type { NeighborhoodId } from '../content/types';
import { money } from '../engine/format';
import * as Game from '../engine/game';
import { C, F } from '../theme';
import { emitPayout } from './pulse-bus';

const INK = '#3B1F14';
export const SCENE_W = 393;
export const SCENE_H = 680;
/** y (scene units) of the street curb; the sidewalk runs from the shop front down to here. */
export const CURB_Y = 590;

/** How the 393×680 scene maps onto a w×h area (cover, bottom-anchored). */
export function sceneFit(w: number, h: number) {
  const s = Math.max(w / SCENE_W, h / SCENE_H);
  return { s, ox: (w - SCENE_W * s) / 2, oy: h - SCENE_H * s };
}

// ---------- projection ----------
// Room coordinates: x across (scene units), y = depth (0 = front edge of the floor, 110 = back wall,
// negative = out on the sidewalk), z = height. One-point perspective, then a fixed fit into the scene.
const D = 110;
const WH = 300;
// v2.1 (critic D71): the shop fills the screen — sky band above the back wall is ~95 units.
const SC = 0.98;
const TX = 196.5 * (1 - SC);
const TY = -20;
/** Height of the side walls / front fascia at the street edge. */
const FRONT_TOP = WH + 40;
function P(x: number, y: number, z = 0): [number, number] {
  const f = 1 - y / 520;
  return [TX + (196.5 + (x - 196.5) * f) * SC, TY + (492 - y * 1.25 - z * f) * SC];
}
const kAt = (y: number) => (1 - y / 520) * SC;
const pts = (list: [number, number][]) => list.map((p) => `${p[0].toFixed(1)},${p[1].toFixed(1)}`).join(' ');

function shade(hex: string, k: number) {
  const n = parseInt(hex.slice(1), 16);
  const ch = [n >> 16, (n >> 8) & 255, n & 255].map((c) => Math.max(0, Math.min(255, Math.round(k > 0 ? c + (255 - c) * k : c * (1 + k)))));
  return '#' + ch.map((c) => c.toString(16).padStart(2, '0')).join('');
}

// ---------- layout ----------
const ROOM_W = [270, 295, 320, 340, 358];

interface Layout {
  L: number;
  R: number;
  prep: { x0: number; x1: number };
  cooks: number[];
  ovens: { x0: number; x1: number; z: number; h: number; chimney: boolean }[];
  ovenCols: { x0: number; x1: number }[];
  counter: { x0: number; x1: number };
  staff: number[];
  door: { x0: number; x1: number; cx: number };
  spots: { x: number; y: number }[];
  tables: { x: number; y: number }[];
  scooter: { x: number; y: number };
}

function layout(fp: number, ovenCount: number, cookCount: number, staffCount: number, tableCount: number, driverSlots: number): Layout {
  const RW = ROOM_W[fp];
  const L = 196.5 - RW / 2;
  const R = L + RW;
  const prep = { x0: L + 6, x1: L + 6 + 30 + cookCount * 24 };
  const cooks = Array.from({ length: cookCount }, (_, i) => prep.x0 + 10 + (i * (prep.x1 - prep.x0 - 20)) / Math.max(1, cookCount - 1) + (cookCount === 1 ? (prep.x1 - prep.x0 - 20) / 2 : 0));
  const cw = 56 + 26 * (staffCount - 1);
  const counter = { x0: R - 60 - cw, x1: R - 60 };
  const staff = Array.from({ length: staffCount }, (_, i) => counter.x0 + 16 + i * 28);
  // Ovens along the back wall between prep and counter; stack two decks rather than squeeze (critic G43).
  const zone0 = prep.x1 + 8;
  const zone1 = counter.x0 - 8;
  const zone = Math.max(30, zone1 - zone0);
  const singleW = (zone - (ovenCount - 1) * 6) / ovenCount;
  const decks = singleW >= 40 || ovenCount < 2 ? 1 : 2;
  const cols = Math.ceil(ovenCount / decks);
  const ow = Math.min(60, (zone - (cols - 1) * 6) / cols);
  const ovenCols = Array.from({ length: cols }, (_, c) => ({ x0: zone0 + c * (ow + 6), x1: zone0 + c * (ow + 6) + ow }));
  const ovens: Layout['ovens'] = [];
  for (let i = 0; i < ovenCount; i++) {
    const c = i % cols;
    const deck = Math.floor(i / cols);
    if (decks === 1) ovens.push({ ...ovenCols[c], z: 0, h: 84, chimney: true });
    else ovens.push({ ...ovenCols[c], z: deck * 64, h: 60, chimney: deck === 1 || i + cols >= ovenCount });
  }
  const door = { x0: R - 46, x1: R - 12, cx: R - 29 };
  // Counter front (critic G61/D179): drivers pick up on the left, walk-ins queue on the right, clear of the
  // door leaf. Pickup spots are ≥28 apart; drivers take turns at them rather than crowding.
  const spotCols = Math.max(1, Math.floor((counter.x1 - 46 - (counter.x0 + 12)) / 28) + 1);
  const spots = Array.from({ length: Math.min(driverSlots, spotCols) }, (_, i) => ({ x: counter.x0 + 12 + i * 28, y: 46 }));
  // Dining: tables in front of the prep/oven area, two rows, clear of the left pilaster (critic D180).
  const t0 = L + 44;
  const t1 = counter.x0 - 10;
  const perRow = Math.max(1, Math.floor((t1 - 30 - t0) / 60) + 1);
  const tables: Layout['tables'] = [];
  for (let i = 0; i < Math.min(tableCount, perRow * 2); i++) {
    const row = i % 2;
    const col = Math.floor(i / 2);
    tables.push({ x: t0 + col * 60 + (row ? 30 : 0), y: row ? 34 : 6 });
  }
  // a single starter table sits mid-floor so its diner fills the empty middle (critic D180)
  if (tables.length === 1) tables[0] = { x: (L + counter.x0) / 2, y: 20 };
  return { L, R, prep, cooks, ovens, ovenCols, counter, staff, door, spots, tables, scooter: { x: door.x0 - 30, y: -22 } };
}

// ---------- drawing primitives ----------
/** A solid box: side face (towards the centre), front face, top face. */
function Box({ x0, x1, y0, y1, h, z = 0, color, top }: { x0: number; x1: number; y0: number; y1: number; h: number; z?: number; color: string; top?: string }) {
  const sideX = (x0 + x1) / 2 > 196.5 ? x0 : x1;
  return (
    <G>
      <Polygon points={pts([P(sideX, y0, z), P(sideX, y1, z), P(sideX, y1, z + h), P(sideX, y0, z + h)])} fill={shade(color, -0.25)} stroke={INK} strokeWidth={1} strokeLinejoin="round" />
      <Polygon points={pts([P(x0, y0, z), P(x1, y0, z), P(x1, y0, z + h), P(x0, y0, z + h)])} fill={color} stroke={INK} strokeWidth={1} strokeLinejoin="round" />
      <Polygon points={pts([P(x0, y0, z + h), P(x1, y0, z + h), P(x1, y1, z + h), P(x0, y1, z + h)])} fill={top ?? shade(color, 0.28)} stroke={INK} strokeWidth={1} strokeLinejoin="round" />
    </G>
  );
}

function FloorShadow({ x, y, r }: { x: number; y: number; r: number }) {
  const [sx, sy] = P(x, y);
  const k = kAt(y);
  return <Ellipse cx={sx} cy={sy} rx={r * k} ry={r * k * 0.3} fill="rgba(59,31,20,0.22)" />;
}

type Kind = 'cook' | 'baker' | 'staff' | 'driver' | 'guest' | 'sit';

// ---------- characters (critic round 18: polished chibi figures) ----------
// Light comes from the upper left: every figure has a shadow side on the right, a highlight on the left,
// and the same 1.1 ink outline as the furniture. Figures face +x (flip mirrors them).
const SKINS = ['#F6D3B3', '#EDB98A', '#D69A6A', '#B07446', '#7E4F30'];
const HAIR_COLORS = ['#2B1A12', '#4A2C1D', '#8E5A3C', '#E3C16F', '#B5462E', '#8F8A86'];
const PANTS = ['#3B4A6B', '#5C4033', '#2F3140', '#6B7A8F', '#7A5C8E'];
const GUEST_SHIRTS = ['#F2994A', '#56CCF2', '#BB6BD9', '#6FCF97', '#F2C94C', '#EB6F92', '#3D9970', '#5C6BC0'];

interface Look { skin: string; hair: string; style: number; trait: number; wide: number; pants: string; shirt: string; tall: number; outfit: number }
/** Integer hash (mulberry32 step) so every look field is independent of the others (critic G57). */
function hash32(n: number) {
  let t = (n + 0x6d2b79f5) | 0;
  t = Math.imul(t ^ (t >>> 15), t | 1);
  t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
  return (t ^ (t >>> 14)) >>> 0;
}
/** Traits: 0 none · 1 glasses · 2 moustache · 3 freckles · 4 hair tuft. Workers always get one (critic D125). */
function lookFor(seed: number, worker = false): Look {
  const n = Math.abs(Math.floor(seed));
  const pick = (field: number, m: number) => hash32(n * 131 + field * 7919) % m;
  return {
    skin: SKINS[pick(1, SKINS.length)],
    hair: HAIR_COLORS[pick(2, HAIR_COLORS.length)],
    style: pick(3, 6),
    trait: worker ? 1 + pick(4, 4) : [0, 0, 1, 2, 3][pick(4, 5)],
    wide: pick(5, 3) - 1,
    pants: PANTS[pick(6, PANTS.length)],
    shirt: GUEST_SHIRTS[pick(7, GUEST_SHIRTS.length)],
    tall: pick(8, 5) - 2,
    outfit: pick(9, 3),
  };
}

const OUT = { stroke: INK, strokeWidth: 1.1, strokeLinejoin: 'round' as const };

/** An outlined limb: ink stroke under a coloured stroke, ending in a hand or shoe. */
function Limb({ d, color, w = 4.4 }: { d: string; color: string; w?: number }) {
  return (
    <G>
      <Path d={d} stroke={INK} strokeWidth={w + 2.2} fill="none" strokeLinecap="round" strokeLinejoin="round" />
      <Path d={d} stroke={color} strokeWidth={w} fill="none" strokeLinecap="round" strokeLinejoin="round" />
    </G>
  );
}

function Hair({ style, color, hy, part }: { style: number; color: string; hy: number; part: 'back' | 'front' }) {
  if (part === 'back') {
    if (style === 1) return <Path d={`M-9.6 ${hy - 2} Q-11.2 ${hy + 9} -5 ${hy + 9.5} L-1 ${hy + 9} Q-4 ${hy + 3} -3 ${hy - 4} Z`} fill={color} {...OUT} />;
    if (style === 3) return <G>{[[-6, -6, 6], [-9, 0, 5.5], [-7, 6, 5], [0, -9, 6.5], [6, -7, 6]].map(([dx, dy, r], i) => <Circle key={i} cx={dx} cy={hy + dy} r={r} fill={color} {...OUT} />)}</G>;
    if (style === 4) return <Path d={`M-8 ${hy - 4} Q-15 ${hy - 2} -13 ${hy + 8} Q-11 ${hy + 4} -7.5 ${hy + 1} Z`} fill={color} {...OUT} />;
    return null;
  }
  if (style === 5) {
    // bald on top, trimmed sides and a beard
    return (
      <G>
        <Path d={`M-9.3 ${hy - 1} Q-9.8 ${hy + 4} -7 ${hy + 6} L-6 ${hy} Z`} fill={color} />
        <Path d={`M1.5 ${hy + 5.5} Q4.5 ${hy + 10.6} 8.5 ${hy + 8} Q10 ${hy + 6.5} 9.8 ${hy + 4} Q8 ${hy + 7.4} 5 ${hy + 7.4} Q3 ${hy + 7.2} 1.5 ${hy + 5.5} Z`} fill={color} {...OUT} strokeWidth={0.7} />
        <Path d={`M-3 ${hy - 7.5} Q1 ${hy - 9.5} 5 ${hy - 7.5}`} stroke="#fff" strokeWidth={1.6} opacity={0.35} fill="none" strokeLinecap="round" />
      </G>
    );
  }
  if (style === 3) {
    return <G>{[[-5, -8.5, 3.6], [-0.5, -10, 3.8], [4, -9, 3.6], [7.5, -6, 3.2]].map(([dx, dy, r], i) => <Circle key={i} cx={dx + 0.5} cy={hy + dy} r={r} fill={color} {...OUT} strokeWidth={0.9} />)}</G>;
  }
  // short / bob / bun / ponytail share a cap with a side-swept fringe
  return (
    <G>
      <Path d={`M-9.2 ${hy + 1} Q-10.4 ${hy - 11.5} 1 ${hy - 10.6} Q10.6 ${hy - 10.2} 10 ${hy - 2} Q7.5 ${hy - 6.8} 2.5 ${hy - 6.4} Q-1.5 ${hy - 6} -4 ${hy - 3} Q-5.5 ${hy - 1} -6.2 ${hy + 2} Z`} fill={color} {...OUT} />
      <Path d={`M-5 ${hy - 8} Q0 ${hy - 10.5} 5 ${hy - 8.5}`} stroke="#fff" strokeWidth={1.4} opacity={0.25} fill="none" strokeLinecap="round" />
      {style === 2 && <Circle cx={-3} cy={hy - 11} r={3.8} fill={color} {...OUT} />}
    </G>
  );
}

/** Hats and headwear that make each job readable at a glance. */
function Headwear({ kind, hy, front = false, alt = false, dot = '#D9443A', cap }: { kind: Kind; hy: number; front?: boolean; alt?: boolean; dot?: string; cap?: string }) {
  if (kind === 'cook') {
    return (
      <G>
        {[[-3.4, -15.6, 4.2], [0.8, -18.2, 4.8], [5, -15.4, 4]].map(([dx, dy, r], i) => <Circle key={i} cx={dx} cy={hy + dy} r={r} fill="#FBF8F3" {...OUT} />)}
        <Circle cx={-0.8} cy={hy - 19.4} r={1.6} fill="#fff" />
        <Rect x={-6.2} y={hy - 12.8} width={13.6} height={5} rx={1.6} fill="#F1ECE4" {...OUT} />
        <Rect x={3} y={hy - 12.2} width={4} height={3.8} fill="#000" opacity={0.08} />
      </G>
    );
  }
  if (kind === 'baker') {
    return (
      <G>
        <Path d={`M-10 ${hy - 1} Q-9.4 ${hy - 12.2} 1 ${hy - 11.6} Q10.4 ${hy - 11} 10.2 ${hy - 2.2} Q1.5 ${hy - 6.5} -10 ${hy - 1} Z`} fill="#F3ECE2" {...OUT} />
        {[[-4, -8], [1, -9.5], [6, -7.5], [-7, -4], [3.5, -5.6]].map(([dx, dy], i) => <Circle key={i} cx={dx} cy={hy + dy} r={1.1} fill={dot} />)}
        <Circle cx={-10.4} cy={hy - 2} r={2} fill="#F3ECE2" {...OUT} strokeWidth={0.8} />
        <Path d={`M-11.5 ${hy - 1.5} l-3.6 -3.4 l-0.6 4.6 Z M-11.4 ${hy - 1} l-2.6 4.4 l3.8 -0.2 Z`} fill="#F3ECE2" {...OUT} strokeWidth={0.8} />
      </G>
    );
  }
  if (kind === 'staff' && alt) {
    return (
      <G>
        <Path d={`M-9.4 ${hy - 5.5} Q0.5 ${hy - 9.5} 10.2 ${hy - 5.5} L10.2 ${hy - 3.6} Q0.5 ${hy - 7.4} -9.4 ${hy - 3.6} Z`} fill="#2E7D4A" {...OUT} strokeWidth={0.9} />
        <Path d={`M-7 ${hy - 4.4} Q0.5 ${hy - 1} 9 ${hy - 4.4} Q0.5 ${hy - 2.4} -7 ${hy - 4.4} Z`} fill="#256B3E" {...OUT} strokeWidth={0.8} />
      </G>
    );
  }
  if (kind === 'staff' || kind === 'driver') {
    const c = kind === 'staff' ? cap ?? '#F5C33B' : '#D9443A';
    return (
      <G>
        <Path d={`M-9.2 ${hy - 3} Q-9.2 ${hy - 12.6} 0.5 ${hy - 12.6} Q10 ${hy - 12.6} 10 ${hy - 4} Z`} fill={c} {...OUT} />
        {front ? (
          <Path d={`M-8 ${hy - 4} Q0.5 ${hy - 6} 9 ${hy - 4} Q9 ${hy - 1.6} 0.5 ${hy - 1.8} Q-8 ${hy - 1.6} -8 ${hy - 4} Z`} fill={shade(c, -0.18)} {...OUT} strokeWidth={0.9} />
        ) : (
          <Path d={`M7 ${hy - 4.4} Q14 ${hy - 4.6} 15.5 ${hy - 2.6} Q11 ${hy - 1.6} 6.5 ${hy - 2.6} Z`} fill={shade(c, -0.18)} {...OUT} strokeWidth={0.9} />
        )}
        <Path d={`M-5.5 ${hy - 9.5} Q0 ${hy - 12} 5 ${hy - 10}`} stroke="#fff" strokeWidth={1.4} opacity={0.35} fill="none" strokeLinecap="round" />
        <Circle cx={1.5} cy={hy - 8} r={2} fill={kind === 'staff' ? '#3FAE5A' : '#FFF4E0'} stroke={INK} strokeWidth={0.6} />
      </G>
    );
  }
  return null;
}

/** A polished chibi worker or customer with a contact shadow, feet at room point (x, y). */
type Mood = 'smile' | 'focus' | 'happy' | 'o' | 'chew';
/** What a worker's hands are doing (critic D138): cooks roll / toss / ladle; bakers hold an empty peel, a pizza, or slide one in. */
type Act = 'none' | 'pin' | 'toss' | 'ladle' | 'peel' | 'pizza' | 'slide' | 'slice' | 'cup' | 'lean';

function Person({ x, y, kind, shirt, arm = 0, flip = false, carry = false, step = 0, seed = 0, o = 1, front = false, blink = false, talk = false, act = 'none', mood = 'smile', alt = false, dot = '#D9443A', cap }: { x: number; y: number; kind: Kind; shirt?: string; arm?: number; flip?: boolean; carry?: boolean; step?: number; seed?: number; o?: number; front?: boolean; blink?: boolean; talk?: boolean; act?: Act; mood?: Mood; alt?: boolean; dot?: string; cap?: string }) {
  const pin = act === 'pin';
  const [sx, sy] = P(x, y);
  const k = kAt(y) * 1.14;
  const sitting = kind === 'sit';
  const worker = kind === 'cook' || kind === 'baker' || kind === 'staff' || kind === 'driver';
  const look = lookFor(seed, worker);
  // keep the light coming from the upper left on mirrored figures (critic D130)
  const unflipBody = flip ? 'translate(0.5 0) scale(-1 1)' : undefined;
  const unflipHead = flip ? 'translate(1 0) scale(-1 1)' : undefined;
  const top = kind === 'cook' ? '#FBF8F3' : kind === 'baker' ? shirt ?? '#B23A48' : kind === 'staff' ? '#3FAE5A' : kind === 'driver' ? '#2F80ED' : shirt ?? look.shirt;
  const sleeve = top;
  const pants = kind === 'cook' ? '#4A4A6E' : kind === 'baker' ? '#3B3B5C' : kind === 'staff' ? '#8C7356' : kind === 'driver' ? '#2E3A59' : look.pants;
  const skin = look.skin;
  const walking = step !== 0 && !sitting;
  const sw = walking ? Math.sin(step) : 0;
  const bob = walking ? Math.abs(Math.cos(step)) * 1.2 : 0;
  const by = (sitting ? -21 : -30) - bob - (sitting ? 0 : look.tall);
  const hy = by - 9;
  const ww = worker ? (look.wide > 0 ? 0.9 : 0) : look.wide * 1.1;
  // face layout: three-quarter (features toward +x) or front-facing (centred, ears both sides)
  const eyeX = front ? [-1.9, 2.9] : [2.4, 6.9];
  const fx = front ? 0.5 : 4.65;
  const torso = `M${-8 - ww} ${by + 3.5} Q${-8 - ww} ${by} ${-4.5} ${by} L5 ${by} Q${8.5 + ww} ${by} ${8.5 + ww} ${by + 3.5} L${8 + ww} ${by + 16.5} Q${8 + ww} ${by + 19} ${5.5 + ww} ${by + 19} L${-5.5 - ww} ${by + 19} Q${-7.6 - ww} ${by + 19} ${-7.6 - ww} ${by + 16.5} Z`;
  // front-arm hand position: working (arm), carrying, eating, or swinging
  const hand: [number, number] = carry
    ? [12, by + 8]
    : sitting
      ? act === 'slice'
        ? [7.5, hy + 5.5]
        : act === 'cup'
          ? [10.5, by + 6.5]
          : [12 + arm, by + 9 - arm]
      : act === 'toss'
        ? [5, hy - 4 - arm]
        : act === 'ladle'
          ? [10, by + 11 - arm]
          : pin
            ? [6 + arm, by + 13 - arm * 1.2]
            : worker && arm > 0
              ? [10 + arm, by + 13 - arm * 2]
              : [9 + sw * 2.5, by + 16];
  const backHand: [number, number] = pin ? [hand[0] - 9, hand[1]] : sitting ? (act === 'lean' ? [-12, by + 3] : [-7, by + 15]) : [-8.5 - sw * 2.5, by + 15.5];
  const peel = kind === 'baker';
  return (
    <G opacity={o} transform={`translate(${sx.toFixed(1)} ${sy.toFixed(1)}) scale(${(flip ? -k : k).toFixed(3)} ${k.toFixed(3)})`}>
      {!sitting && <Ellipse cx={0.5} cy={0} rx={11.5} ry={3.4} fill="rgba(59,31,20,0.26)" />}
      {/* legs */}
      {sitting ? (
        <G>
          <Limb d={`M-2 ${by + 16} L8 ${by + 17}`} color={pants} w={6} />
          <Limb d={`M8.5 ${by + 17} L9.5 -2`} color={pants} w={5} />
          <Ellipse cx={11.4} cy={-1.6} rx={3.8} ry={2} fill="#3A2A24" {...OUT} strokeWidth={0.8} />
        </G>
      ) : (
        [-1, 1].map((side) => {
          const lx = side * 3.2 + (walking ? -side * sw * 2.8 : 0);
          const lift = walking ? Math.max(0, side * sw) * 1.6 : 0;
          return (
            <G key={side}>
              <Limb d={`M${side * 3} ${by + 17} L${lx} ${-2.5 - lift}`} color={side < 0 ? shade(pants, -0.12) : pants} w={4.8} />
              <Ellipse cx={lx + 1.6} cy={-1.4 - lift} rx={3.7} ry={2.1} fill="#3A2A24" {...OUT} strokeWidth={0.8} />
              <Ellipse cx={lx + 0.6} cy={-2.2 - lift} rx={1.4} ry={0.6} fill="#fff" opacity={0.3} />
            </G>
          );
        })
      )}
      {/* back arm */}
      <Limb d={`M-6 ${by + 4} Q${-8.5} ${by + 10} ${backHand[0]} ${backHand[1]}`} color={shade(sleeve, -0.18)} />
      <Circle cx={backHand[0]} cy={backHand[1]} r={2.3} fill={shade(skin, -0.12)} {...OUT} strokeWidth={0.8} />
      {/* back hair (behind the head) */}
      <Hair style={look.style === 5 ? 0 : look.style} color={look.hair} hy={hy} part="back" />
      {/* torso with shadow side and highlight */}
      <Path d={torso} fill={top} {...OUT} />
      <G transform={unflipBody}>
        <Path d={`M3.5 ${by} L5 ${by} Q${8.5 + ww} ${by} ${8.5 + ww} ${by + 3.5} L${8 + ww} ${by + 16.5} Q${8 + ww} ${by + 19} ${5.5 + ww} ${by + 19} L3.5 ${by + 19} Z`} fill="#000" opacity={0.13} />
        <Rect x={-6.2 - ww} y={by + 2.5} width={2.4} height={9} rx={1.2} fill="#fff" opacity={0.25} />
      </G>
      {/* outfit details */}
      {kind === 'cook' && (
        <G>
          <Path d={`M-4 ${by} L4.5 ${by} L0.3 ${by + 5} Z`} fill="#E8432E" {...OUT} strokeWidth={0.8} />
          {[[-2.2, 7], [-2.2, 12], [3, 7], [3, 12]].map(([dx, dy], i) => <Circle key={i} cx={dx} cy={by + dy} r={0.9} fill="#C9C3BA" />)}
          <Path d={`M0.4 ${by + 5} V${by + 19}`} stroke="#E1DAD0" strokeWidth={0.8} />
        </G>
      )}
      {kind === 'baker' && (
        <G>
          <Path d={`M-5.5 ${by + 4} L6 ${by + 4} L6.8 ${by + 19} L-6.2 ${by + 19} Z`} fill="#8C5A3C" {...OUT} strokeWidth={0.9} />
          <Path d={`M-5 ${by + 4} L-3 ${by} M5.5 ${by + 4} L3.6 ${by}`} stroke="#8C5A3C" strokeWidth={1.4} />
          <Rect x={-3} y={by + 9} width={6.5} height={4} rx={1} fill="#A8714B" stroke={INK} strokeWidth={0.6} />
          <Path d={`M-2.5 ${by} Q0.5 ${by + 2.5} 3.5 ${by}`} fill={skin} />
        </G>
      )}
      {kind === 'staff' && alt && <Path d={`M-5.5 ${by + 6} L6 ${by + 6} L6.6 ${by + 19} L-6 ${by + 19} Z`} fill="#2E7D4A" {...OUT} strokeWidth={0.9} />}
      {kind === 'staff' && (
        <G>
          <Path d={`M-4 ${by} L0.5 ${by + 4} L5 ${by} L3 ${by - 0.5} L0.5 ${by + 2} L-2 ${by - 0.5} Z`} fill="#fff" {...OUT} strokeWidth={0.7} />
          <Rect x={-6} y={by + 6} width={5} height={3.2} rx={0.8} fill="#fff" stroke={INK} strokeWidth={0.6} />
          <Path d={`M-5 ${by + 7.6} h3`} stroke="#3FAE5A" strokeWidth={0.8} />
        </G>
      )}
      {kind === 'driver' && (
        <G>
          <Path d={`M0.5 ${by + 1} V${by + 19}`} stroke="#1F5FB8" strokeWidth={1.2} />
          <Path d={`M-3.5 ${by} L0.5 ${by + 3} L4.5 ${by}`} fill="none" stroke="#fff" strokeWidth={1.2} />
          <Circle cx={-4} cy={by + 8} r={2.4} fill="#D9443A" stroke="#fff" strokeWidth={0.7} />
          <Path d={`M-8 ${by + 14} H${8.5}`} stroke="#1F5FB8" strokeWidth={1.4} opacity={0.7} />
        </G>
      )}
      {/* guest outfits: tee, striped tee, or hoodie with a pocket (critic D172) */}
      {!worker && look.outfit === 1 && [6, 10.5, 15].map((d) => <Path key={d} d={`M${-7.6 - ww} ${by + d} H${8 + ww}`} stroke="#fff" strokeWidth={1.6} opacity={0.55} />)}
      {!worker && look.outfit === 2 && (
        <G>
          <Path d={`M-6 ${by + 1} Q0.5 ${by + 7} 7 ${by + 1}`} fill={shade(top, -0.15)} stroke={INK} strokeWidth={0.8} />
          <Rect x={-4.5 - ww * 0.5} y={by + 11} width={10 + ww} height={5} rx={1.6} fill={shade(top, -0.12)} stroke={INK} strokeWidth={0.6} />
          <Path d={`M-1 ${by + 4} v4 M2 ${by + 4} v4`} stroke="#fff" strokeWidth={0.8} />
        </G>
      )}
      {!worker && look.outfit !== 2 && <Path d={`M-2.6 ${by} Q0.5 ${by + 3.4} 3.6 ${by}`} fill={skin} stroke={INK} strokeWidth={0.7} />}
      {/* head */}
      <Circle cx={0.5} cy={hy} r={9.6} fill={skin} {...OUT} />
      <G transform={unflipHead}>
        <Path d={`M5.3 ${hy - 8.3} A9.6 9.6 0 0 1 3.8 ${hy + 9} Q8 ${hy} 5.3 ${hy - 8.3} Z`} fill="#000" opacity={0.09} />
        <Circle cx={-2.8} cy={hy - 4.2} r={2.6} fill="#fff" opacity={0.28} />
      </G>
      {(front ? [-9, 10] : [-6]).map((ex) => (
        <G key={ex}>
          <Circle cx={ex} cy={hy + 1.2} r={2.3} fill={skin} {...OUT} strokeWidth={0.9} />
          <Path d={`M${ex - 0.6} ${hy + 0.4} q0.8 0.9 0 1.8`} stroke={shade(skin, -0.25)} strokeWidth={0.7} fill="none" />
        </G>
      ))}
      {/* face: eyes with catchlights (or a blink), brows, nose, mouth, blush */}
      {eyeX.map((ex) => (
        <G key={ex}>
          {blink ? (
            <Path d={`M${ex - 1.3} ${hy - 0.2} q1.3 0.9 2.6 0`} stroke={INK} strokeWidth={0.9} fill="none" strokeLinecap="round" />
          ) : mood === 'happy' ? (
            <Path d={`M${ex - 1.3} ${hy + 0.2} q1.3 -2 2.6 0`} stroke={INK} strokeWidth={1} fill="none" strokeLinecap="round" />
          ) : (
            <G>
              <Ellipse cx={ex} cy={hy - 0.4} rx={1.25} ry={1.65} fill={INK} />
              <Circle cx={ex + 0.4} cy={hy - 1} r={0.5} fill="#fff" />
            </G>
          )}
          <Path d={mood === 'focus' ? (ex === eyeX[0] ? `M${ex - 1.4} ${hy - 4.2} l2.8 0.9` : `M${ex - 1.4} ${hy - 3.3} l2.8 -0.9`) : `M${ex - 1.4} ${hy - 3.6} q1.4 -0.9 2.8 0`} stroke={worker ? INK : look.hair} strokeWidth={0.9} fill="none" strokeLinecap="round" />
        </G>
      ))}
      {look.trait === 1 && (
        <G>
          <Circle cx={eyeX[0]} cy={hy - 0.4} r={2.5} fill="rgba(255,255,255,0.35)" stroke={INK} strokeWidth={1.1} />
          <Circle cx={eyeX[1]} cy={hy - 0.4} r={2.5} fill="rgba(255,255,255,0.35)" stroke={INK} strokeWidth={1.1} />
          <Path d={`M${eyeX[0] + 2.5} ${hy - 0.7} L${eyeX[1] - 2.5} ${hy - 0.7}`} stroke={INK} strokeWidth={1.1} />
        </G>
      )}
      <Ellipse cx={front ? 0.5 : 8.6} cy={hy + 1.6} rx={0.9} ry={0.75} fill={shade(skin, -0.2)} />
      {talk || mood === 'o' ? (
        <Ellipse cx={fx} cy={hy + 4.4} rx={1.3} ry={1.6} fill="#B5462E" stroke={INK} strokeWidth={0.8} />
      ) : mood === 'focus' ? (
        <Path d={`M${fx - 1.5} ${hy + 4.2} h3`} stroke={INK} strokeWidth={0.95} strokeLinecap="round" />
      ) : mood === 'chew' ? (
        <Path d={`M${fx - 1.2} ${hy + 4} q1.2 0.8 2.4 0`} stroke={INK} strokeWidth={0.95} fill="none" strokeLinecap="round" />
      ) : (
        <Path d={`M${fx - 1.9} ${hy + 3.6} q1.9 ${mood === 'happy' ? 2.6 : 1.9} 3.8 0`} stroke={INK} strokeWidth={0.95} fill={mood === 'happy' ? '#B5462E' : 'none'} strokeLinecap="round" />
      )}
      {mood === 'chew' && (
        <G>
          <Circle cx={front ? -3.4 : 1} cy={hy + 3} r={2.2} fill={skin} stroke={INK} strokeWidth={0.6} />
          <Circle cx={front ? 4.4 : 9} cy={hy + 2.8} r={2} fill={skin} stroke={INK} strokeWidth={0.6} />
        </G>
      )}
      <Ellipse cx={front ? -3.6 : 0.8} cy={hy + 2.6} rx={1.5} ry={0.95} fill="#F28B82" opacity={0.55} />
      <Ellipse cx={front ? 4.6 : 9.2} cy={hy + 2.4} rx={front ? 1.5 : 1.1} ry={0.9} fill="#F28B82" opacity={0.5} />
      {look.trait === 2 && <Path d={`M${fx - 4.2} ${hy + 3.2} q2.1 -2.3 4.2 -0.5 q2.1 -1.8 4.2 0.5 q-2.1 1.5 -4.2 0.3 q-2.1 1.2 -4.2 -0.3 Z`} fill={look.hair} stroke={INK} strokeWidth={0.9} />}
      {look.trait === 3 &&
        [[-1.4, 1.6], [-0.4, 2.4], [0.6, 1.5], [1.6, 2.3]].map(([dx, dy], i) => (
          <Circle key={i} cx={(front ? -3.6 : 0.8) + dx * 1.2} cy={hy + dy} r={0.7} fill="#A8552F" opacity={0.85} />
        ))}
      {/* hair + headwear */}
      {worker ? <Path d={`M-9.4 ${hy + 0.5} Q-9.8 ${hy - 4} -7.5 ${hy - 5} L-6 ${hy + 0.5} Z`} fill={look.hair} /> : <Hair style={look.style} color={look.hair} hy={hy} part="front" />}
      {/* hair shows under every hat (critic D139) */}
      {worker && kind !== 'baker' && (
        <Path
          d={front ? `M-7 ${hy - 6.4} Q-6 ${hy - 3} -3.5 ${hy - 4.4} Q-1.5 ${hy - 2.6} 0.8 ${hy - 4.3} Q3 ${hy - 2.6} 5.2 ${hy - 4.4} Q7.5 ${hy - 3} 8.2 ${hy - 6.4} Z` : `M-2 ${hy - 6.6} Q1 ${hy - 3.2} 4 ${hy - 4.8} Q6.5 ${hy - 3} 9.2 ${hy - 5.4} L9 ${hy - 7} Z`}
          fill={look.hair}
          stroke={INK}
          strokeWidth={0.6}
        />
      )}
      {kind === 'baker' && <Circle cx={-9.5} cy={hy + 4.5} r={3.6} fill={look.hair} {...OUT} strokeWidth={0.8} />}
      <Headwear kind={kind} hy={hy} front={front} alt={alt} dot={dot} cap={cap} />
      {worker && look.trait === 4 && <Path d={`M${front ? -1 : 3} ${hy - 6.5} q-2.5 2.6 -0.4 4 q0.6 -2 2.6 -2.2 q-0.2 2 1.6 2.6 q0.8 -2.4 -1 -4.4 Z`} fill={look.hair} stroke={INK} strokeWidth={0.6} />}
      {/* front arm + props */}
      {peel && (
        <G transform={act === 'slide' ? `rotate(62 ${hand[0]} ${hand[1]})` : `rotate(-8 ${hand[0]} ${hand[1]})`}>
          <Path d={`M${hand[0] + 1} ${hand[1] + 9} L${hand[0] + 2.5} ${hand[1] - 18}`} stroke={INK} strokeWidth={3.4} strokeLinecap="round" />
          <Path d={`M${hand[0] + 1} ${hand[1] + 9} L${hand[0] + 2.5} ${hand[1] - 18}`} stroke="#C99A6B" strokeWidth={1.8} strokeLinecap="round" />
          <Path d={`M${hand[0] - 1.5} ${hand[1] - 17} Q${hand[0] - 2} ${hand[1] - 29} ${hand[0] + 3} ${hand[1] - 29} Q${hand[0] + 8} ${hand[1] - 29} ${hand[0] + 7} ${hand[1] - 17} Z`} fill="#D9B48A" {...OUT} strokeWidth={0.9} />
          {act !== 'peel' && (
            <G>
              <Ellipse cx={hand[0] + 2.7} cy={hand[1] - 23} rx={4.6} ry={4.4} fill="#E9A64B" {...OUT} strokeWidth={0.7} />
              <Ellipse cx={hand[0] + 2.7} cy={hand[1] - 23} rx={3.5} ry={3.3} fill="#FFC531" />
              {[[-1.2, -1], [1.4, 0.4], [-0.4, 1.6]].map(([dx, dy], i) => <Circle key={i} cx={hand[0] + 2.7 + dx} cy={hand[1] - 23 + dy} r={0.8} fill="#E8432E" />)}
            </G>
          )}
        </G>
      )}
      <Limb d={`M6.5 ${by + 4} Q${9.5} ${by + 9} ${hand[0]} ${hand[1]}`} color={sleeve} />
      {kind === 'cook' || kind === 'baker' ? <Path d={`M${hand[0] - 2.4} ${hand[1] - 2.2} l2.8 -1`} stroke={kind === 'cook' ? '#E1DAD0' : '#7E2A35'} strokeWidth={1.2} /> : null}
      {pin && (
        <G>
          <Rect x={hand[0] - 10.5} y={hand[1] - 1.8} width={14} height={3.6} rx={1.8} fill="#E2B985" {...OUT} strokeWidth={0.8} />
          <Rect x={hand[0] - 9.5} y={hand[1] - 1.4} width={12} height={1.1} rx={0.5} fill="#fff" opacity={0.4} />
        </G>
      )}
      {act === 'toss' && (
        <G>
          <Ellipse cx={hand[0] + 0.5} cy={hand[1] - 5 - arm * 2} rx={6.5} ry={1.9} fill="#FBEFD6" {...OUT} strokeWidth={0.8} />
          <Ellipse cx={hand[0] - 0.8} cy={hand[1] - 5.5 - arm * 2} rx={3} ry={0.7} fill="#fff" opacity={0.6} />
        </G>
      )}
      {act === 'ladle' && (
        <G>
          <Path d={`M${hand[0]} ${hand[1]} L${hand[0] + 4} ${hand[1] + 8}`} stroke={INK} strokeWidth={2.2} strokeLinecap="round" />
          <Path d={`M${hand[0]} ${hand[1]} L${hand[0] + 4} ${hand[1] + 8}`} stroke="#BFC4CA" strokeWidth={1} strokeLinecap="round" />
          <Path d={`M${hand[0] + 1} ${hand[1] + 8} Q${hand[0] + 4} ${hand[1] + 13} ${hand[0] + 7.5} ${hand[1] + 8} Z`} fill="#D9443A" {...OUT} strokeWidth={0.8} />
        </G>
      )}
      <Circle cx={hand[0]} cy={hand[1]} r={2.4} fill={skin} {...OUT} strokeWidth={0.8} />
      {pin && <Circle cx={hand[0] - 9} cy={hand[1]} r={2.1} fill={shade(skin, -0.08)} {...OUT} strokeWidth={0.7} />}
      {/* seated poses (critic D181): a slice raised to the mouth, or a mug */}
      {act === 'slice' && (
        <G>
          <Path d={`M${hand[0] - 1} ${hand[1] - 1} L${hand[0] + 6} ${hand[1] - 5} L${hand[0] + 4} ${hand[1] + 3} Z`} fill="#FFC531" stroke={INK} strokeWidth={0.7} strokeLinejoin="round" />
          <Circle cx={hand[0] + 3.4} cy={hand[1] - 1.4} r={0.8} fill="#E8432E" />
        </G>
      )}
      {act === 'cup' && (
        <G>
          <Rect x={hand[0] - 1} y={hand[1] - 5.5} width={4.5} height={5.5} rx={0.8} fill="#FFFFFF" stroke={INK} strokeWidth={0.8} />
          <Path d={`M${hand[0] + 3.5} ${hand[1] - 4.5} q2 0.5 0 3`} stroke={INK} strokeWidth={0.8} fill="none" />
          <Path d={`M${hand[0]} ${hand[1] - 7.5} q1 -1.5 0 -3 M${hand[0] + 2.2} ${hand[1] - 7.5} q1 -1.5 0 -3`} stroke="#C9C3BA" strokeWidth={0.6} fill="none" />
        </G>
      )}
      {carry && (
        <G>
          <Rect x={hand[0] - 3} y={hand[1] - 6.5} width={17} height={6} rx={1.2} fill="#F6E7C1" {...OUT} strokeWidth={0.9} />
          <Rect x={hand[0] - 3} y={hand[1] - 6.5} width={17} height={1.8} rx={0.9} fill="#fff" opacity={0.5} />
          <Circle cx={hand[0] + 5.5} cy={hand[1] - 3.5} r={1.7} fill="#E8432E" />
        </G>
      )}
    </G>
  );
}

/**
 * An oven against the back wall (critic D74). Single-deck ovens are domed pizza ovens on a brick plinth
 * with an arched mouth and keystone; stacked decks and the Stone grade are box deck ovens, so grades
 * differ in silhouette as well as finish.
 */
function Oven({ o, grade, lit, flicker }: { o: Layout['ovens'][number]; grade: number; lit: boolean; flicker: number }) {
  const y = D - 6;
  const [ax, ay] = P(o.x0, y, o.z);
  const [bx] = P(o.x1, y, o.z);
  const w = bx - ax;
  const cx = (ax + bx) / 2;
  const k = kAt(y);
  const h = o.h * k;
  const top = ay - h;
  const base = OVEN_GRADES[grade].color;
  const dark = shade(base, -0.4);
  const fire = lit ? 'url(#ember)' : '#24120A';
  const flame = (mx: number, my: number, mw: number, mh: number) =>
    lit ? (
      <G>
        <Ellipse cx={mx} cy={my - mh * 0.35} rx={mw * 0.5} ry={mh * 0.5} fill="#FFD166" opacity={0.35} />
        <Path d={`M${mx - mw * 0.38} ${my} L${mx - mw * 0.22} ${my - mh * 0.55 - flicker} L${mx - mw * 0.06} ${my - mh * 0.3} L${mx + mw * 0.06} ${my - mh * 0.78 + flicker} L${mx + mw * 0.2} ${my - mh * 0.32} L${mx + mw * 0.32} ${my - mh * 0.55} L${mx + mw * 0.38} ${my} Z`} fill="#FFE08A" opacity={0.9} />
      </G>
    ) : null;
  const box = o.h < 70 || grade === 1;
  if (box) {
    const legs = o.z === 0 ? 10 * k : 0;
    const bTop = top;
    const bBot = ay - legs;
    const bh = bBot - bTop;
    const dw = w * 0.74;
    const dh = bh * 0.42;
    const dy = bTop + bh * 0.4;
    return (
      <G>
        {legs > 0 && [0.12, 0.88].map((f) => <Rect key={f} x={ax + w * f - 2} y={bBot - 1} width={4} height={legs + 1} fill="#4A4F57" stroke={INK} strokeWidth={0.8} />)}
        <Rect x={ax + 3} y={bTop + 3} width={w} height={bh} rx={5} fill={dark} />
        <Rect x={ax} y={bTop} width={w} height={bh} rx={5} fill={`url(#oven${grade})`} stroke={INK} strokeWidth={1.3} />
        <Rect x={ax + 3} y={bTop + 3} width={w - 6} height={bh * 0.18} rx={3} fill="#fff" opacity={0.22} />
        {/* door with a glowing window and a handle bar */}
        <Rect x={cx - dw / 2} y={dy} width={dw} height={dh} rx={3} fill={shade(base, -0.25)} stroke={INK} strokeWidth={1} />
        <Rect x={cx - dw / 2 + 3} y={dy + 3} width={dw - 6} height={dh - 6} rx={2} fill={fire} />
        {flame(cx, dy + dh - 3, dw - 6, dh - 6)}
        <Rect x={cx - dw * 0.3} y={dy - 5} width={dw * 0.6} height={3.4} rx={1.7} fill="#E9E4DC" stroke={INK} strokeWidth={0.8} />
        <Circle cx={ax + w - 6} cy={bTop + bh * 0.22} r={2.2} fill={lit ? '#7FE0A0' : '#9A958E'} stroke={INK} strokeWidth={0.6} />
        {grade >= 4 && <Path d={`M${ax + 4} ${bTop + 2} H${bx - 4}`} stroke="#FFF3B0" strokeWidth={1.6} />}
      </G>
    );
  }
  // domed oven on a brick plinth
  const plinth = 12 * k;
  const pTop = ay - plinth;
  const ry = Math.min(w * 0.5, (pTop - top) * 0.78);
  const shoulder = top + ry;
  const mw = w * 0.56;
  const mh = Math.min((pTop - top) * 0.5, mw * 0.9);
  const mTop = pTop - mh;
  const dome = (dx: number) => `M${ax + dx} ${pTop} L${ax + dx} ${shoulder} A${w / 2} ${ry} 0 0 1 ${bx + dx} ${shoulder} L${bx + dx} ${pTop} Z`;
  return (
    <G>
      {o.chimney && (
        <G>
          <Rect x={cx - w * 0.09} y={top - 16 * k} width={w * 0.18} height={20 * k} fill={grade >= 3 ? shade(base, -0.1) : '#8C7B6A'} stroke={INK} strokeWidth={1} />
          <Rect x={cx - w * 0.12} y={top - 19 * k} width={w * 0.24} height={4 * k} rx={1} fill={grade >= 3 ? shade(base, -0.25) : '#6E5F51'} stroke={INK} strokeWidth={0.8} />
        </G>
      )}
      <Path d={dome(3)} fill={dark} />
      <Path d={dome(0)} fill={`url(#oven${grade})`} stroke={INK} strokeWidth={1.3} />
      {/* brick courses on brick/wood-fired domes, rivet band on copper/gold */}
      {grade === 0 || grade === 2
        ? [0.3, 0.55].map((f) => <Path key={f} d={`M${ax + 2} ${pTop - (pTop - top) * f} Q${cx} ${pTop - (pTop - top) * f - 4} ${bx - 2} ${pTop - (pTop - top) * f}`} stroke={dark} strokeWidth={0.9} fill="none" opacity={0.55} />)
        : (
          <G>
            <Path d={`M${ax + 1} ${shoulder + 4} H${bx - 1}`} stroke={shade(base, -0.3)} strokeWidth={3} />
            {Array.from({ length: 5 }).map((_, i) => <Circle key={i} cx={ax + w * (0.14 + i * 0.18)} cy={shoulder + 4} r={1.1} fill={shade(base, 0.5)} />)}
          </G>
        )}
      <Path d={`M${ax + w * 0.18} ${shoulder} A${w * 0.34} ${ry * 0.72} 0 0 1 ${cx + w * 0.06} ${top + ry * 0.22}`} stroke="#fff" strokeWidth={2.4} fill="none" opacity={0.4} strokeLinecap="round" />
      {/* arched mouth with a brick ring and keystone */}
      <Path d={`M${cx - mw / 2 - 3} ${pTop} L${cx - mw / 2 - 3} ${mTop + mw * 0.3} A${mw / 2 + 3} ${mw * 0.34} 0 0 1 ${cx + mw / 2 + 3} ${mTop + mw * 0.3} L${cx + mw / 2 + 3} ${pTop} Z`} fill={shade(base, -0.3)} stroke={INK} strokeWidth={1} />
      <Path d={`M${cx - mw / 2} ${pTop} L${cx - mw / 2} ${mTop + mw * 0.3} A${mw / 2} ${mw * 0.3} 0 0 1 ${cx + mw / 2} ${mTop + mw * 0.3} L${cx + mw / 2} ${pTop} Z`} fill={fire} />
      {flame(cx, pTop - 1, mw, mh)}
      <Path d={`M${cx - 3.5} ${mTop - 2} L${cx + 3.5} ${mTop - 2} L${cx + 2.5} ${mTop + 5} L${cx - 2.5} ${mTop + 5} Z`} fill={grade >= 3 ? '#FFF3B0' : '#E9C9A0'} stroke={INK} strokeWidth={0.8} />
      {/* plinth */}
      <Rect x={ax - 3} y={pTop} width={w + 6} height={plinth} rx={1.5} fill="#A24B2C" stroke={INK} strokeWidth={1.1} />
      <Path d={`M${ax - 3} ${pTop + plinth / 2} H${bx + 3}`} stroke="#7A3520" strokeWidth={0.8} />
      {Array.from({ length: Math.max(2, Math.floor((w + 6) / 12)) }).map((_, i) => (
        <Path key={i} d={`M${ax + 3 + i * 12 + (i % 2) * 6} ${pTop} v${plinth / 2} M${ax + 9 + i * 12} ${pTop + plinth / 2} v${plinth / 2}`} stroke="#7A3520" strokeWidth={0.8} />
      ))}
      {grade === 2 && (
        <G>
          {[0, 1, 2].map((i) => <Circle key={i} cx={bx + 4 + (i % 2) * 5} cy={ay - 3 - Math.floor(i / 2) * 5} r={2.8} fill="#9C6B3F" stroke={INK} strokeWidth={0.7} />)}
        </G>
      )}
      {grade >= 4 && (
        <G>
          <Path d={`M${ax + 4} ${shoulder - 2} A${w / 2 - 4} ${ry - 4} 0 0 1 ${bx - 4} ${shoulder - 2}`} stroke="#FFF3B0" strokeWidth={1.4} fill="none" />
          <Path d={`M${cx + w * 0.3} ${top + ry * 0.4} l2 -5 l2 5 l5 2 l-5 2 l-2 5 l-2 -5 l-5 -2 Z`} fill="#FFFBE0" />
        </G>
      )}
    </G>
  );
}

/** One stainless hood + flue over a bank of box deck ovens (critic D94). */
function OvenHood({ lay, grade, mural }: { lay: Layout; grade: number; mural: boolean }) {
  const boxes = lay.ovens.filter((o) => o.h < 70 || grade === 1);
  if (!boxes.length) return null;
  const top = Math.max(...boxes.map((o) => o.z + o.h));
  const x0 = lay.ovenCols[0].x0 - 6;
  const x1 = lay.ovenCols[lay.ovenCols.length - 1].x1 + 6;
  const y = D - 6;
  const [ax, ay] = P(x0, y, top + 6);
  const [bx, by] = P(x1, y, top + 22);
  const [cx] = P((x0 + x1) / 2, y);
  const [, fyFull] = P(0, D, WH - 24);
  const fy = mural ? by - 12 : fyFull;
  const fw = Math.min(26, (bx - ax) * 0.22);
  return (
    <G>
      <Rect x={cx - fw / 2} y={fy} width={fw} height={by - fy} fill="#BFC4CA" stroke={INK} strokeWidth={1} />
      <Rect x={cx - fw / 2 + 2} y={fy} width={fw * 0.3} height={by - fy} fill="#fff" opacity={0.35} />
      {mural && <Rect x={cx - fw / 2 - 3} y={fy - 4} width={fw + 6} height={5} rx={1.5} fill="#9AA1A8" stroke={INK} strokeWidth={0.9} />}
      <Path d={`M${ax + 8} ${by} L${bx - 8} ${by} L${bx} ${ay} L${ax} ${ay} Z`} fill="#C9CED4" stroke={INK} strokeWidth={1.2} strokeLinejoin="round" />
      <Path d={`M${ax + 10} ${by + 3} L${bx - 10} ${by + 3}`} stroke="#fff" strokeWidth={2} opacity={0.6} />
      <Rect x={ax - 1} y={ay - 2} width={bx - ax + 2} height={4} rx={1.5} fill="#9AA1A8" stroke={INK} strokeWidth={0.8} />
    </G>
  );
}

const TABLE_STYLE = [
  { top: '#FFFFFF', rim: '#E0DAD2', chair: '#C89B6D', chairDark: '#8E5A3C', leg: '#9A958E' }, // plain wood
  { top: '#FFFFFF', rim: '#D9443A', chair: '#D9443A', chairDark: '#B23A30', leg: INK }, // checked tablecloth
  { top: '#C99A6B', rim: '#8E5A3C', chair: '#7A4A26', chairDark: '#5E3A26', leg: '#5E3A26' }, // wooden bistro
  { top: '#F4F1EC', rim: '#D4AF37', chair: '#7B1E3A', chairDark: '#5A1229', leg: '#D4AF37' }, // marble & candles
];

/**
 * A dining table in two layers so diners really sit (critic D114): `back` is the floor shadow and both
 * chairs (back rest on the outer side + seat); `front` is the table itself, drawn over the diners' laps.
 */
function Table({ x, y, tier, part }: { x: number; y: number; tier: number; part: 'back' | 'front' }) {
  const st = TABLE_STYLE[tier];
  const [cx, cy] = P(x, y);
  const k = kAt(y) * 1.1;
  const chair = (dx: number) => {
    const [px, py] = P(x + dx, y);
    const out = dx < 0 ? -1 : 1;
    return (
      <G key={dx} transform={`translate(${px} ${py}) scale(${k})`}>
        <Ellipse cx={0} cy={0} rx={8} ry={2.2} fill="rgba(59,31,20,0.18)" />
        {/* legs: two front, two back (the back pair under the backrest) */}
        {[-6, 6].map((lx) => <Rect key={lx} x={lx - 1} y={-4} width={2} height={4} rx={0.6} fill={st.chairDark} stroke={INK} strokeWidth={0.6} />)}
        {/* backrest rising from the seat's rear edge: two posts, top rail and a slat */}
        {(() => {
          const x0 = out < 0 ? -7.5 : 1.5;
          return (
            <G>
              <Rect x={x0} y={-25} width={1.8} height={19} rx={0.8} fill={st.chairDark} stroke={INK} strokeWidth={0.7} />
              <Rect x={x0 + 4.2} y={-25} width={1.8} height={19} rx={0.8} fill={st.chairDark} stroke={INK} strokeWidth={0.7} />
              <Rect x={x0 - 0.4} y={-26} width={6.8} height={5} rx={1.8} fill={st.chair} stroke={INK} strokeWidth={1.1} />
              <Rect x={x0 + 0.3} y={-25.4} width={5.4} height={1.3} rx={0.6} fill="#fff" opacity={0.3} />
              <Rect x={x0 + 0.2} y={-17} width={5.6} height={2.4} rx={1} fill={st.chair} stroke={INK} strokeWidth={0.8} />
            </G>
          );
        })()}
        <Rect x={-7.5} y={-6.4} width={15} height={3.8} rx={1.6} fill={st.chair} stroke={INK} strokeWidth={1.2} />
        <Rect x={-7.5} y={-3.8} width={15} height={1.2} rx={0.6} fill={st.chairDark} />
        <Rect x={-6.5} y={-6} width={13} height={1.1} rx={0.5} fill="#fff" opacity={0.3} />
      </G>
    );
  };
  if (part === 'back') {
    return (
      <G>
        <FloorShadow x={x} y={y} r={18} />
        {chair(-17)}
        {chair(17)}
      </G>
    );
  }
  return (
    <G>
      <G transform={`translate(${cx} ${cy}) scale(${k})`}>
        <Rect x={-1.6} y={-14} width={3.2} height={14} fill={st.leg} />
        <Ellipse cx={0} cy={-1} rx={6} ry={2} fill={st.leg} />
        <Ellipse cx={0} cy={-15} rx={14} ry={5} fill={st.rim} stroke={INK} strokeWidth={1.1} />
        <Ellipse cx={0} cy={-16} rx={14} ry={5} fill={st.top} stroke={INK} strokeWidth={1.1} />
        {tier === 1 &&
          [-8, -3, 2, 7].map((dx, i) => <Rect key={dx} x={dx} y={-19 + (i % 2) * 2} width={3} height={2} fill="#D9443A" opacity={0.85} />)}
        {tier === 3 && <Path d="M-10 -17 Q0 -19 10 -15" stroke="#C9C3BA" strokeWidth={0.8} fill="none" />}
        <Ellipse cx={-3} cy={-16.5} rx={5} ry={1.8} fill="#FFC531" stroke={INK} strokeWidth={0.6} />
        <Circle cx={-4} cy={-16.8} r={0.8} fill="#E8432E" />
        <Circle cx={-1.5} cy={-16} r={0.8} fill="#E8432E" />
        {tier === 3 && (
          <G>
            <Rect x={5} y={-23} width={2.4} height={6} fill="#FFF8E7" stroke={INK} strokeWidth={0.4} />
            <Path d="M6.2 -23 q-1.6 -2.6 0 -4.6 q1.6 2 0 4.6 Z" fill="#FFB23A" />
            <Circle cx={6.2} cy={-25} r={4} fill="#FFE7A0" opacity={0.35} />
          </G>
        )}
      </G>
    </G>
  );
}

/** A potted plant standing on the floor at room point (x, y). */
function FloorPlant({ x, y, big = false }: { x: number; y: number; big?: boolean }) {
  const [px, py] = P(x, y);
  const k = kAt(y) * (big ? 1.25 : 1);
  return (
    <G transform={`translate(${px} ${py}) scale(${k})`}>
      <Ellipse cx={0} cy={0} rx={11} ry={3} fill="rgba(59,31,20,0.25)" />
      <Path d="M-8 -14 L8 -14 L6 0 L-6 0 Z" fill="#C2693E" stroke={INK} strokeWidth={1} />
      <Rect x={-9} y={-16} width={18} height={4} rx={1.5} fill="#A8552F" stroke={INK} strokeWidth={0.9} />
      {[-40, -15, 10, 35, 60].map((a, i) => (
        <Ellipse key={a} cx={Math.sin((a * Math.PI) / 180) * 9} cy={-26 - Math.cos((a * Math.PI) / 180) * 8} rx={4.5} ry={10} fill={i % 2 ? '#3F9A48' : '#5DBB5A'} stroke={INK} strokeWidth={0.8} transform={`rotate(${a} ${Math.sin((a * Math.PI) / 180) * 9} ${-26 - Math.cos((a * Math.PI) / 180) * 8})`} />
      ))}
    </G>
  );
}

/** A proper cash register on the counter top. */
function Register({ x, y, z }: { x: number; y: number; z: number }) {
  const [rx, ry] = P(x, y, z);
  const k = kAt(y) * 1.1;
  return (
    <G transform={`translate(${rx} ${ry}) scale(${k})`}>
      <Path d="M-11 0 L11 0 L9 -9 L-9 -9 Z" fill="#4A4F57" stroke={INK} strokeWidth={1} />
      <Rect x={-10} y={-3} width={20} height={3} fill="#3A3F46" />
      <Rect x={-2} y={-2.4} width={4} height={1.2} rx={0.6} fill="#C9C3BA" />
      {[-6, -2, 2, 6].map((dx) => [-7, -5].map((dy) => <Rect key={`${dx}${dy}`} x={dx - 1.2} y={dy} width={2.4} height={1.2} rx={0.4} fill="#E9E4DC" />))}
      <Rect x={-2} y={-17} width={4} height={8} fill="#4A4F57" stroke={INK} strokeWidth={0.8} />
      <Rect x={-8} y={-22} width={16} height={7} rx={1.5} fill="#2B2F35" stroke={INK} strokeWidth={0.9} />
      <Rect x={-6.5} y={-20.8} width={13} height={4.6} rx={1} fill="#7FE0A0" />
      <Path d="M-4.5 -18 h4 M1 -18 h3" stroke="#1E6B3A" strokeWidth={1} />
    </G>
  );
}

// ---------- background: sky, skyline, trees ----------
function Tree({ x, y, k, c = '#4FA048', palm = false }: { x: number; y: number; k: number; c?: string; palm?: boolean }) {
  if (palm) {
    return (
      <G transform={`translate(${x} ${y}) scale(${k})`}>
        <Path d="M-2 40 Q-6 10 2 -26 L6 -26 Q2 10 4 40 Z" fill="#9C6B3F" stroke={INK} strokeWidth={1} />
        {[-60, -25, 15, 50, 85].map((a) => (
          <Path key={a} d={`M4 -28 q${Math.cos((a * Math.PI) / 180) * 18} ${-10 + Math.sin((a * Math.PI) / 180) * 6} ${Math.cos((a * Math.PI) / 180) * 30} ${Math.sin((a * Math.PI) / 180) * 14}`} stroke={c} strokeWidth={7} fill="none" strokeLinecap="round" />
        ))}
      </G>
    );
  }
  return (
    <G transform={`translate(${x} ${y}) scale(${k})`}>
      <Rect x={-4} y={-6} width={8} height={44} fill="#7A4A26" stroke={INK} strokeWidth={1} />
      <Circle cx={0} cy={-22} r={22} fill={shade(c, -0.15)} stroke={INK} strokeWidth={1.1} />
      <Circle cx={-12} cy={-12} r={15} fill={c} stroke={INK} strokeWidth={1.1} />
      <Circle cx={12} cy={-14} r={16} fill={c} stroke={INK} strokeWidth={1.1} />
      <Circle cx={-4} cy={-30} r={14} fill={shade(c, 0.18)} />
      <Circle cx={-7} cy={-33} r={5} fill={shade(c, 0.4)} opacity={0.7} />
    </G>
  );
}

// Each neighbourhood gets its own sky, ground, skyline and side props (critic D75).
const LOOK: Record<NeighborhoodId, { sky: [string, string, string]; ground: string; ground2: string }> = {
  downtown: { sky: ['#5FA8E8', '#B9DEF8', '#EAF6FF'], ground: '#9CCB86', ground2: '#86BA72' },
  suburbs: { sky: ['#72BDF0', '#CDE9FA', '#FFF3DC'], ground: '#A6D48A', ground2: '#8FC475' },
  waterfront: { sky: ['#4FB3EA', '#BDE7FA', '#E9FAFF'], ground: '#E8D7A8', ground2: '#D9C48E' },
  university: { sky: ['#8A86DE', '#C9C2F2', '#F6EEFF'], ground: '#97C786', ground2: '#7FB471' },
  industrial: { sky: ['#8E9DAA', '#B8C2C9', '#DDE2E5'], ground: '#A8A497', ground2: '#949082' },
  uptown: { sky: ['#3E4A8C', '#C98BA8', '#FBD3AE'], ground: '#8FBF7E', ground2: '#78AA6B' },
};

function Windows({ x, y, w, h, c }: { x: number; y: number; w: number; h: number; c: string }) {
  const cols = Math.max(1, Math.floor((w - 6) / 9));
  const rows = Math.max(1, Math.floor((h - 8) / 12));
  return (
    <G>
      {Array.from({ length: cols * rows }).map((_, i) => (
        <Rect key={i} x={x + 5 + (i % cols) * 9} y={y + 6 + Math.floor(i / cols) * 12} width={4.5} height={6} rx={0.8} fill={c} />
      ))}
    </G>
  );
}

const SKYLINE: Record<NeighborhoodId, () => ReactElement> = {
  downtown: () => (
    <G>
      {[[-6, 150, 40], [36, 186, 34], [72, 120, 30], [292, 170, 36], [330, 130, 30], [362, 196, 40]].map(([x, h, w], i) => (
        <G key={i}>
          <Rect x={x} y={200 - h} width={w} height={h} fill={i % 2 ? '#93A6C4' : '#A9B8D0'} stroke="#7F92B0" strokeWidth={0.8} />
          <Windows x={x} y={200 - h} w={w} h={h} c="#D8E3F2" />
        </G>
      ))}
    </G>
  ),
  suburbs: () => (
    <G>
      {[[-4, '#F6E7C1', 118], [306, '#FADADD', 104], [352, '#D6EAF8', 128]].map(([x, c, top], i) => {
        const X = x as number;
        const T = top as number;
        return (
          <G key={i}>
            <Rect x={X} y={T} width={46} height={214 - T} fill={c as string} stroke="#B9A78E" strokeWidth={0.8} />
            <Path d={`M${X - 6} ${T + 2} L${X + 23} ${T - 26} L${X + 52} ${T + 2} Z`} fill="#C9775F" stroke="#A85E49" strokeWidth={0.8} />
            <Rect x={X + 30} y={T - 22} width={7} height={12} fill="#A85E49" />
            {[0, 1].map((r) => [0, 1].map((cc) => <Rect key={`${r}${cc}`} x={X + 7 + cc * 20} y={T + 12 + r * 30} width={11} height={12} fill="#BFE3F5" stroke="#8E7A62" strokeWidth={0.6} />))}
          </G>
        );
      })}
      {/* picket fences and a mailbox in the yards */}
      {[[-10, 64], [326, 404]].map(([x0, x1]) => (
        <G key={x0}>
          <Path d={`M${x0} 300 H${x1} M${x0} 310 H${x1}`} stroke="#E9E4DC" strokeWidth={2.2} />
          {Array.from({ length: Math.ceil((x1 - x0) / 9) }).map((_, i) => (
            <Path key={i} d={`M${x0 + i * 9 + 1} 318 V296 l2.5 -4 l2.5 4 V318 Z`} fill="#FFFFFF" stroke="#B9B2A8" strokeWidth={0.7} />
          ))}
        </G>
      ))}
      <Rect x={368} y={282} width={3} height={36} fill="#7A4A26" />
      <Path d="M360 272 h18 v10 h-18 Z" fill="#3F7FB0" stroke={INK} strokeWidth={0.9} />
      <Path d="M376 268 v-8 h6 v4 h-6" fill="#E8432E" stroke={INK} strokeWidth={0.7} />
    </G>
  ),
  waterfront: () => (
    <G>
      <Rect x={-20} y={176} width={440} height={60} fill="#5BB8E8" />
      <Rect x={-20} y={176} width={440} height={8} fill="#8FD3F4" />
      {[192, 210, 226].map((yy, j) => (
        <Path key={yy} d={`M${-10 + j * 14} ${yy} ${Array.from({ length: 12 }).map((_, i) => `q10 -4 20 0 t20 0`).join(' ')}`} stroke="#D6F0FB" strokeWidth={1.6} fill="none" opacity={0.8} />
      ))}
      {/* sailboat and pier at the sides */}
      <Path d="M8 176 L48 176 L42 186 L14 186 Z M28 174 L28 136 L50 172 Z" fill="#fff" stroke="#7FA6C0" strokeWidth={1} />
      <Rect x={330} y={226} width={80} height={6} fill="#A8714B" stroke={INK} strokeWidth={0.8} />
      {[336, 356, 376, 396].map((px) => <Rect key={px} x={px} y={230} width={4} height={18} fill="#7A4A26" />)}
      <Rect x={-20} y={226} width={70} height={6} fill="#A8714B" stroke={INK} strokeWidth={0.8} />
      {[-4, 16, 36].map((px) => <Rect key={px} x={px} y={230} width={4} height={18} fill="#7A4A26" />)}
    </G>
  ),
  university: () => (
    <G fill="#B9A6DE" stroke="#9A86C4" strokeWidth={0.8}>
      <Rect x={-10} y={120} width={84} height={84} />
      <Path d="M-16 122 L32 92 L80 122 Z" />
      <Windows x={-10} y={126} w={84} h={70} c="#EDE4FF" />
      <Rect x={310} y={76} width={26} height={128} />
      <Path d="M306 78 L323 50 L340 78 Z" />
      <Circle cx={323} cy={96} r={7} fill="#fff" />
      <Rect x={346} y={140} width={60} height={64} />
      <Windows x={346} y={140} w={60} h={60} c="#EDE4FF" />
    </G>
  ),
  industrial: () => (
    <G>
      <Path d="M-10 204 L-10 150 L26 166 L26 150 L62 166 L62 150 L98 166 L98 204 Z" fill="#9A968E" stroke="#827E76" strokeWidth={0.8} />
      {[[300, 40], [330, 70], [362, 30]].map(([x, top], i) => (
        <G key={i}>
          <Rect x={x} y={top} width={16} height={204 - top} fill="#8E8A83" stroke="#76726B" strokeWidth={0.8} />
          <Rect x={x} y={top + 10} width={16} height={6} fill="#C8463A" />
          <Circle cx={x + 8} cy={top - 10} r={10} fill="#ECEAE6" opacity={0.75} />
          <Circle cx={x + 18} cy={top - 26} r={14} fill="#ECEAE6" opacity={0.5} />
        </G>
      ))}
      <Rect x={10} y={120} width={14} height={84} fill="#8E8A83" stroke="#76726B" strokeWidth={0.8} />
      <Circle cx={17} cy={108} r={11} fill="#ECEAE6" opacity={0.7} />
    </G>
  ),
  uptown: () => (
    <G>
      {[[-6, 190, 36], [30, 230, 34], [64, 160, 30], [288, 210, 34], [322, 250, 36], [358, 180, 40]].map(([x, h, w], i) => (
        <G key={i}>
          <Rect x={x} y={204 - h} width={w} height={h} fill={i % 2 ? '#6E6FA0' : '#8487B5'} stroke="#5B5C8C" strokeWidth={0.8} />
          <Windows x={x} y={204 - h} w={w} h={h} c="#FFE7A0" />
        </G>
      ))}
    </G>
  ),
};

/** Chain-link fence segment (Industrial). */
function Fence({ x0, x1, y }: { x0: number; x1: number; y: number }) {
  return (
    <G>
      <Rect x={x0} y={y - 34} width={x1 - x0} height={34} fill="none" />
      {Array.from({ length: Math.ceil((x1 - x0) / 8) }).map((_, i) => (
        <Path key={i} d={`M${x0 + i * 8} ${y} l8 -34 M${x0 + i * 8 + 8} ${y} l-8 -34`} stroke="#8E959B" strokeWidth={0.7} />
      ))}
      {Array.from({ length: Math.ceil((x1 - x0) / 32) + 1 }).map((_, i) => (
        <Rect key={i} x={x0 + i * 32 - 1.5} y={y - 36} width={3} height={36} fill="#6E757B" />
      ))}
      <Path d={`M${x0} ${y - 34} H${x1}`} stroke="#6E757B" strokeWidth={2} />
    </G>
  );
}

const Backdrop = memo(function Backdrop({ id }: { id: NeighborhoodId }) {
  const look = LOOK[id];
  const palm = id === 'waterfront';
  const treeC = id === 'uptown' ? '#3F8F4A' : '#4FA048';
  const trees = id !== 'industrial';
  return (
    <G>
      <Defs>
        <LinearGradient id="sky" x1="0" y1="-40" x2="0" y2="300" gradientUnits="userSpaceOnUse">
          <Stop offset="0" stopColor={look.sky[0]} />
          <Stop offset="0.55" stopColor={look.sky[1]} />
          <Stop offset="1" stopColor={look.sky[2]} />
        </LinearGradient>
      </Defs>
      <Rect x={-20} y={-400} width={SCENE_W + 40} height={1100} fill="url(#sky)" />
      {id === 'uptown' && <Circle cx={60} cy={150} r={26} fill="#FFD8A0" opacity={0.85} />}
      {SKYLINE[id]()}
      <Path d={`M-10 214 Q60 186 130 206 Q200 180 270 204 Q330 184 403 202 L403 700 L-10 700 Z`} fill={look.ground} />
      <Path d={`M-10 262 Q90 246 196 258 Q300 246 403 260 L403 700 L-10 700 Z`} fill={look.ground2} />
      {trees && (
        <G>
          <Tree x={14} y={262} k={1.15} c={treeC} palm={palm} />
          <Tree x={46} y={330} k={0.9} c={shade(treeC, 0.1)} palm={palm} />
          <Tree x={352} y={252} k={1.0} c={shade(treeC, 0.1)} palm={palm} />
          <Tree x={382} y={330} k={1.2} c={treeC} palm={palm} />
        </G>
      )}
      {id === 'industrial' && (
        <G>
          <Fence x0={-10} x1={70} y={330} />
          <Fence x0={326} x1={404} y={330} />
          {[[20, 380], [360, 370]].map(([x, y]) => (
            <G key={x}>
              <Rect x={x - 12} y={y - 22} width={24} height={22} rx={2} fill="#3F7FB0" stroke={INK} strokeWidth={1} />
              {[0, 7, 14].map((d) => <Path key={d} d={`M${x - 12} ${y - 18 + d} H${x + 12}`} stroke="#2E6690" strokeWidth={1.4} />)}
            </G>
          ))}
        </G>
      )}
    </G>
  );
});

// ---------- the room shell (static per layout) ----------
const RoomShell = memo(function RoomShell({ lay, wall, fp, flooring, walls, signage, plants }: { lay: Layout; wall: string; fp: number; flooring: number; walls: number; signage: number; plants: number }) {
  const { L, R } = lay;
  const sideTop = FRONT_TOP;
  const lights: ReactElement[] = [];
  if (fp >= 2 && signage < 2) {
    const n = 12;
    for (let i = 0; i <= n; i++) {
      const x = L + 10 + ((R - L - 20) * i) / n;
      const [lx, ly] = P(x, D, WH - 18 - Math.sin((i / n) * Math.PI) * 8);
      lights.push(<Circle key={i} cx={lx} cy={ly} r={3.2} fill={['#FFC531', '#E8432E', '#3FAE5A'][i % 3]} stroke={INK} strokeWidth={0.7} />);
    }
  }
  const [wx, wy] = P(lay.counter.x1 - 50, D, 132);
  const [mx, my] = P(lay.counter.x0 + 4, D, 180);
  return (
    <G>
      <Defs>
        <LinearGradient id="bw" x1="0" y1="0" x2="0" y2="1">
          <Stop offset="0" stopColor={shade(wall, -0.1)} />
          <Stop offset="1" stopColor={shade(wall, 0.06)} />
        </LinearGradient>
        <LinearGradient id="lw" x1="0" y1="0" x2="1" y2="0">
          <Stop offset="0" stopColor={shade(wall, -0.26)} />
          <Stop offset="1" stopColor={shade(wall, -0.1)} />
        </LinearGradient>
        <LinearGradient id="rw" x1="0" y1="0" x2="1" y2="0">
          <Stop offset="0" stopColor={shade(wall, -0.04)} />
          <Stop offset="1" stopColor={shade(wall, -0.18)} />
        </LinearGradient>
      </Defs>
      {/* back wall with kitchen tiles below a rail */}
      <Polygon points={pts([P(L, D, 0), P(R, D, 0), P(R, D, WH), P(L, D, WH)])} fill="url(#bw)" stroke={INK} strokeWidth={1.4} />
      <Polygon points={pts([P(L, D, WH - 22), P(R, D, WH - 22), P(R, D, WH), P(L, D, WH)])} fill="rgba(59,31,20,0.12)" />
      <Path d={`M${P(L, D, WH - 22).join(' ')} L${P(R, D, WH - 22).join(' ')}`} stroke={shade(wall, -0.3)} strokeWidth={2.2} />
      <Polygon points={pts([P(L, D, 0), P(R, D, 0), P(R, D, 60), P(L, D, 60)])} fill="#fff" opacity={0.35} />
      {Array.from({ length: Math.floor((R - L) / 12) }).map((_, i) => {
        const [x0, y0] = P(L + 6 + i * 12, D, 0);
        const [, y1] = P(0, D, 60);
        return <Path key={i} d={`M${x0} ${y0} V${y1}`} stroke={shade(wall, -0.12)} strokeWidth={1} />;
      })}
      <Path d={`M${P(L, D, 60).join(' ')} L${P(R, D, 60).join(' ')}`} stroke={shade(wall, -0.3)} strokeWidth={2} />
      {/* side walls */}
      <Polygon points={pts([P(L, 0, 0), P(L, D, 0), P(L, D, WH), P(L, 0, sideTop)])} fill="url(#lw)" stroke={INK} strokeWidth={1.4} />
      <Polygon points={pts([P(R, 0, 0), P(R, D, 0), P(R, D, WH), P(R, 0, sideTop)])} fill="url(#rw)" stroke={INK} strokeWidth={1.4} />
      {/* wall caps along the cut tops */}
      <Path d={`M${P(L, 0, sideTop).join(' ')} L${P(L, D, WH).join(' ')} L${P(R, D, WH).join(' ')} L${P(R, 0, sideTop).join(' ')}`} stroke="#5E3A26" strokeWidth={4.5} strokeLinejoin="round" fill="none" />
      <Path d={`M${P(L, 0, sideTop).join(' ')} L${P(L, D, WH).join(' ')} L${P(R, D, WH).join(' ')} L${P(R, 0, sideTop).join(' ')}`} stroke="#8E5A3C" strokeWidth={1.4} strokeLinejoin="round" fill="none" />
      {/* floor: plain tile → checkerboard → wood parquet → marble (decor) */}
      <Polygon points={pts([P(L, 0), P(R, 0), P(R, D), P(L, D)])} fill={['#E7D7BE', '#F4EFE6', '#C99A6B', '#E2D6C4'][flooring]} stroke={INK} strokeWidth={1.4} />
      {flooring === 1 &&
        Array.from({ length: 20 * 6 }).map((_, i) => {
          const c = i % 20;
          const r = Math.floor(i / 20);
          if ((c + r) % 2) return null;
          const xa = L + ((R - L) * c) / 20;
          const xb = L + ((R - L) * (c + 1)) / 20;
          return <Polygon key={`ch${i}`} points={pts([P(xa, r * 18.3), P(xb, r * 18.3), P(xb, (r + 1) * 18.3), P(xa, (r + 1) * 18.3)])} fill="#C8463A" />;
        })}
      {flooring === 2 &&
        Array.from({ length: 12 }).map((_, j) => (
          <G key={`pl${j}`}>
            <Path d={`M${P(L, j * 9.2).join(' ')} L${P(R, j * 9.2).join(' ')}`} stroke="#A8784E" strokeWidth={1} />
            {Array.from({ length: 6 }).map((__, i) => {
              const x = L + ((R - L) * (i + (j % 2) * 0.5)) / 6;
              return <Path key={i} d={`M${P(x, j * 9.2).join(' ')} L${P(x, (j + 1) * 9.2).join(' ')}`} stroke="#A8784E" strokeWidth={0.8} />;
            })}
          </G>
        ))}
      {/* marble (critic D128): two-tone tiles with grout, real veins, a brass border and a soft sheen */}
      {flooring === 3 && (
        <G>
          {Array.from({ length: 8 * 6 }).map((_, i) => {
            const c = i % 8;
            const r = Math.floor(i / 8);
            if ((c + r) % 2) return null;
            const xa = L + ((R - L) * c) / 8;
            const xb = L + ((R - L) * (c + 1)) / 8;
            return <Polygon key={`mt${i}`} points={pts([P(xa, r * 18.3), P(xb, r * 18.3), P(xb, (r + 1) * 18.3), P(xa, (r + 1) * 18.3)])} fill="#C9BBA6" />;
          })}
          {Array.from({ length: 9 }).map((_, i) => {
            const x = L + ((R - L) * i) / 8;
            return <Path key={`mv${i}`} d={`M${P(x, 0).join(' ')} L${P(x, D).join(' ')}`} stroke="#C8BEB0" strokeWidth={1} />;
          })}
          {Array.from({ length: 7 }).map((_, j) => (
            <Path key={`mh${j}`} d={`M${P(L, j * 18.3).join(' ')} L${P(R, j * 18.3).join(' ')}`} stroke="#C8BEB0" strokeWidth={1} />
          ))}
          {Array.from({ length: 8 * 6 }).map((_, i) => {
            const c = i % 8;
            const r = Math.floor(i / 8);
            const h = hash32(i * 7 + 3);
            if (h % 2 === 0 && h % 3 === 0) return null;
            const xa = L + ((R - L) * (c + 0.2 + (h % 5) * 0.08)) / 8;
            const ya = r * 18.3 + 4 + (h % 7);
            const xb = xa + (R - L) / 8 * 0.45;
            const yb = ya + 5 + (h % 4);
            return <Path key={`vein${i}`} d={`M${P(xa, ya).join(' ')} L${P((xa + xb) / 2, ya + 4).join(' ')} L${P(xb, yb).join(' ')}`} stroke="#8F8577" strokeWidth={1.1} fill="none" opacity={1} strokeLinejoin="round" />;
          })}
          <Polygon points={pts([P(L, 0), P(R, 0), P(R, D), P(L, D)])} fill="url(#sheen)" />
          <Polygon points={pts([P(L, D - 5), P(R, D - 5), P(R, D), P(L, D)])} fill="#C9A04A" stroke="#9C7A2E" strokeWidth={0.6} />
          <Polygon points={pts([P(L, 2), P(R, 2), P(R, 6), P(L, 6)])} fill="#C9A04A" stroke="#9C7A2E" strokeWidth={0.6} />
          <Path d={`M${P(L, 4).join(' ')} L${P(R, 4).join(' ')}`} stroke="#FFF3B0" strokeWidth={0.8} opacity={0.7} />
          <Polygon points={pts([P(L, 0), P(L + 5, 0), P(L + 5, D - 5), P(L, D)])} fill="#C9A04A" stroke="#9C7A2E" strokeWidth={0.6} />
          <Polygon points={pts([P(R - 5, 0), P(R, 0), P(R, D), P(R - 5, D - 5)])} fill="#C9A04A" stroke="#9C7A2E" strokeWidth={0.6} />
        </G>
      )}
      {flooring === 0 &&
        Array.from({ length: 21 }).map((_, i) => {
          const x = L + ((R - L) * i) / 20;
          return <Path key={`v${i}`} d={`M${P(x, 0).join(' ')} L${P(x, D).join(' ')}`} stroke="#D4C1A3" strokeWidth={1} />;
        })}
      {flooring < 2 &&
        Array.from({ length: 7 }).map((_, j) => (
          <Path key={`h${j}`} d={`M${P(L, j * 18.3).join(' ')} L${P(R, j * 18.3).join(' ')}`} stroke={flooring === 1 ? '#B53A30' : flooring === 3 ? '#DCD6CE' : '#D4C1A3'} strokeWidth={flooring === 1 ? 0.5 : 1} />
        ))}
      {/* a soft strip marks where the kitchen floor starts (critic D168) */}
      <Polygon points={pts([P(L, 57), P(lay.counter.x0 - 4, 57), P(lay.counter.x0 - 4, 60), P(L, 60)])} fill="#000" opacity={0.14} />
      <Path d={`M${P(L, 56.6).join(' ')} L${P(lay.counter.x0 - 4, 56.6).join(' ')}`} stroke="#FFFFFF" strokeWidth={1} opacity={0.3} />
      {/* ambient occlusion where the walls meet the floor (critic D73) */}
      <Polygon points={pts([P(L, D - 10), P(R, D - 10), P(R, D), P(L, D)])} fill="rgba(59,31,20,0.16)" />
      <Polygon points={pts([P(L, 0), P(L + 10, 0), P(L + 10, D), P(L, D)])} fill="rgba(59,31,20,0.14)" />
      <Polygon points={pts([P(R - 10, 0), P(R, 0), P(R, D), P(R - 10, D)])} fill="rgba(59,31,20,0.1)" />
      <Polygon points={pts([P(L, D, 0), P(R, D, 0), P(R, D, 10), P(L, D, 10)])} fill="rgba(59,31,20,0.12)" />
      {/* decor grows with the shop */}
      {/* a hole-in-the-wall: branching crack and a chipped patch showing bricks (critic D121) */}
      {fp === 0 && (
        <G>
          <Path d={`M${mx - 26} ${my + 18} l5 9 l-3 7 l6 9 M${mx - 24} ${my + 32} l-6 5 M${mx - 18} ${my + 43} l5 4`} stroke={shade(wall, -0.35)} strokeWidth={1.2} fill="none" strokeLinecap="round" strokeLinejoin="round" />
          {(() => {
            const [px, py] = P(L + 60, D, 150);
            return (
              <G>
                <Path d={`M${px} ${py} q9 -4 18 1 q3 7 -2 13 q-9 4 -16 -1 q-4 -6 0 -13 Z`} fill="#C8643E" stroke={shade(wall, -0.35)} strokeWidth={1} />
                <Path d={`M${px + 1} ${py + 6} H${px + 18} M${px + 8} ${py} V${py + 6} M${px + 4} ${py + 6} V${py + 12} M${px + 13} ${py + 6} V${py + 13}`} stroke="#8C3F22" strokeWidth={0.8} />
              </G>
            );
          })()}
        </G>
      )}
      {/* menu board: header, slices and prices (critic D116) */}
      {fp >= 1 && (
        <G>
          <Rect x={mx + 2} y={my + 2} width={56} height={40} rx={4} fill="rgba(59,31,20,0.25)" />
          <Rect x={mx} y={my} width={56} height={40} rx={4} fill="#2F3B33" stroke="#8E5A3C" strokeWidth={2.4} />
          <SvgText x={mx + 28} y={my + 10} fontFamily={F.bold} fontSize={7.5} fill="#FFC531" textAnchor="middle">
            MENU
          </SvgText>
          {['Margherita', 'Pepperoni', 'Veggie'].map((name, i) => (
            <G key={name}>
              <Path d={`M${mx + 5} ${my + 15 + i * 8} l5 0 l-2.5 5 Z`} fill="#FFC531" />
              <Circle cx={mx + 7.5} cy={my + 16.6 + i * 8} r={0.8} fill="#E8432E" />
              <SvgText x={mx + 12} y={my + 19.6 + i * 8} fontFamily={F.bold} fontSize={5} fill="#FFF4E0">
                {name}
              </SvgText>
              <SvgText x={mx + 52} y={my + 19.6 + i * 8} fontFamily={F.bold} fontSize={5} fill="#FFC531" textAnchor="end">
                {`$${[3, 4, 4][i]}`}
              </SvgText>
            </G>
          ))}
        </G>
      )}
      {lights.length > 0 && (
        <Path d={`M${P(L + 10, D, WH - 18).join(' ')} Q${P(196.5, D, WH - 38).join(' ')} ${P(R - 10, D, WH - 18).join(' ')}`} stroke={INK} strokeWidth={1} fill="none" />
      )}
      {lights}
      {/* wall decor (decor): posters → framed photos → hand-painted mural */}
      {walls >= 3 &&
        (() => {
          const x0 = L + 26;
          const duct = (lay.ovenCols[0].x0 + lay.ovenCols[lay.ovenCols.length - 1].x1) / 2;
          const x1 = Math.min(lay.counter.x0 - 10, duct - 22, x0 + (lay.counter.x0 - 10 - x0) * 0.6);
          const [ax, ay] = P(x0, D, 204);
          const [bx, by] = P(x1, D, 154);
          const w = bx - ax;
          const h = by - ay;
          return (
            <G>
              <Rect x={ax} y={ay} width={w} height={h} rx={4} fill="#9ED2F0" stroke="#8E5A3C" strokeWidth={2} />
              <Circle cx={ax + w * 0.8} cy={ay + h * 0.3} r={h * 0.16} fill="#FFD866" />
              <Path d={`M${ax} ${ay + h * 0.62} Q${ax + w * 0.25} ${ay + h * 0.3} ${ax + w * 0.5} ${ay + h * 0.58} Q${ax + w * 0.75} ${ay + h * 0.35} ${ax + w} ${ay + h * 0.55} L${ax + w} ${ay + h} L${ax} ${ay + h} Z`} fill="#7DBB5E" />
              <Path d={`M${ax} ${ay + h * 0.8} H${ax + w}`} stroke="#4E9CC9" strokeWidth={h * 0.18} />
              {[0.2, 0.32, 0.6].map((f, i) => (
                <G key={i}>
                  <Rect x={ax + w * f - 3} y={ay + h * 0.36} width={6} height={h * 0.3} fill="#2F6B2F" />
                  <Path d={`M${ax + w * f - 5} ${ay + h * 0.4} L${ax + w * f} ${ay + h * 0.16} L${ax + w * f + 5} ${ay + h * 0.4} Z`} fill="#2F6B2F" />
                </G>
              ))}
              <Rect x={ax + w * 0.42} y={ay + h * 0.42} width={w * 0.1} height={h * 0.2} fill="#F6E7C1" stroke={INK} strokeWidth={0.8} />
              <Path d={`M${ax + w * 0.41} ${ay + h * 0.43} L${ax + w * 0.47} ${ay + h * 0.32} L${ax + w * 0.53} ${ay + h * 0.43} Z`} fill="#C8463A" />
            </G>
          );
        })()}
      {walls >= 1 &&
        walls < 3 &&
        (() => {
          const [ax, ay] = P(L + 10, D, 206);
          const [bx, by] = P(Math.min(lay.prep.x1 + 6, lay.counter.x0 - 40), D, 140);
          const w = Math.min(46, bx - ax);
          return (
            <G>
              <Rect x={ax} y={ay} width={w} height={by - ay} fill="#FFF4E0" stroke={INK} strokeWidth={1.2} />
              <Circle cx={ax + w / 2} cy={ay + (by - ay) * 0.45} r={w * 0.3} fill="#FFC531" stroke={INK} strokeWidth={0.8} />
              {[[-0.1, -0.05], [0.12, 0.02], [0, 0.12]].map(([dx, dy], i) => (
                <Circle key={i} cx={ax + w / 2 + dx * w} cy={ay + (by - ay) * (0.45 + dy)} r={w * 0.05} fill="#E8432E" />
              ))}
              <SvgText x={ax + w / 2} y={by - 5} fontFamily={F.bold} fontSize={7} fill="#D9443A" textAnchor="middle">
                PIZZA!
              </SvgText>
            </G>
          );
        })()}
      {walls === 2 &&
        lay.ovenCols.length > 0 &&
        (() => {
          const xs = [0.2, 0.5, 0.8].map((f) => lay.ovenCols[0].x0 + (lay.ovenCols[lay.ovenCols.length - 1].x1 - lay.ovenCols[0].x0) * f);
          return (
            <G>
              {xs.map((x, i) => {
                const [fx, fy] = P(x, D, 196);
                return (
                  <G key={i}>
                    <Rect x={fx - 10} y={fy} width={20} height={16} fill="#C98F63" stroke={INK} strokeWidth={1} />
                    <Rect x={fx - 7} y={fy + 3} width={14} height={10} fill={['#F6E7C1', '#D6EAF8', '#FADADD'][i]} />
                    <Circle cx={fx} cy={fy + 8} r={2.6} fill="#F2C9A0" />
                  </G>
                );
              })}
            </G>
          );
        })()}
      {plants >= 3 && (
        <G>
          <Path d={`M${P(L, D, WH - 8).join(' ')} L${P(R, D, WH - 8).join(' ')}`} stroke="#3F8F3A" strokeWidth={3} />
          {Array.from({ length: 22 }).map((_, i) => {
            const [vx, vy] = P(L + ((R - L) * (i + 0.5)) / 22, D, WH - 8);
            return <Ellipse key={i} cx={vx} cy={vy + (i % 3) * 3} rx={4} ry={2.6} fill={i % 2 ? '#5DBB5A' : '#3F9A48'} stroke={INK} strokeWidth={0.5} transform={`rotate(${(i % 2 ? 1 : -1) * 30} ${vx} ${vy})`} />;
          })}
          {[0.08, 0.92].map((f) =>
            Array.from({ length: 6 }).map((_, i) => {
              const [vx, vy] = P(L + (R - L) * f, D, WH - 14 - i * 14);
              return <Ellipse key={`${f}${i}`} cx={vx + (i % 2 ? 3 : -3)} cy={vy} rx={4} ry={2.6} fill={i % 2 ? '#5DBB5A' : '#3F9A48'} stroke={INK} strokeWidth={0.5} />;
            }),
          )}
        </G>
      )}
      {/* pantry shelf: flour sacks and tins (critic D95) */}
      {walls < 3 &&
        (() => {
          const sx0 = L + 14;
          const sx1 = L + 104;
          const [ax, ay] = P(sx0, D, 104);
          const [bx] = P(sx1, D, 104);
          const w = bx - ax;
          return (
            <G>
              <Rect x={ax} y={ay} width={w} height={4} rx={1} fill="#8E5A3C" stroke={INK} strokeWidth={0.9} />
              {[0.08, 0.5].map((f) => <Path key={f} d={`M${ax + w * f} ${ay + 4} l4 7 M${ax + w * f} ${ay + 4} v8`} stroke="#5E3A26" strokeWidth={1.4} strokeLinecap="round" />)}
              {[0.14, 0.38].map((f, i) => (
                <G key={i}>
                  <Path d={`M${ax + w * f - 8} ${ay} Q${ax + w * f - 9} ${ay - 16} ${ax + w * f - 4} ${ay - 19} L${ax + w * f + 4} ${ay - 19} Q${ax + w * f + 9} ${ay - 16} ${ax + w * f + 8} ${ay} Z`} fill="#F3ECE2" stroke={INK} strokeWidth={0.9} />
                  <Path d={`M${ax + w * f - 4} ${ay - 19} q4 -3 8 0`} stroke={INK} strokeWidth={0.9} fill="none" />
                  <SvgText x={ax + w * f} y={ay - 6} fontFamily={F.bold} fontSize={4.5} fill="#C8463A" textAnchor="middle">
                    FLOUR
                  </SvgText>
                </G>
              ))}
              {[0.6, 0.74, 0.88].map((f, i) => (
                <G key={f}>
                  <Rect x={ax + w * f - 4.5} y={ay - 12} width={9} height={12} rx={1.2} fill={['#E8432E', '#3FAE5A', '#E8432E'][i]} stroke={INK} strokeWidth={0.8} />
                  <Rect x={ax + w * f - 4.5} y={ay - 8} width={9} height={4} fill="#FFF4E0" />
                </G>
              ))}
            </G>
          );
        })()}
      {/* back window with trees outside */}
      <Rect x={wx} y={wy} width={40} height={36} rx={3} fill="#BFE3F5" stroke={INK} strokeWidth={1.2} />
      <Circle cx={wx + 14} cy={wy + 26} r={8} fill="#5DAE4B" />
      <Circle cx={wx + 27} cy={wy + 28} r={6} fill="#4FA048" />
      <Path d={`M${wx + 20} ${wy} V${wy + 36} M${wx} ${wy + 18} H${wx + 40}`} stroke="#fff" strokeWidth={2} />
      <Rect x={wx - 2} y={wy + 34} width={44} height={4} fill="#8E5A3C" stroke={INK} strokeWidth={0.8} />
    </G>
  );
});

/**
 * The street face of the shop (critic D72): brick pilasters at both corners, a fascia beam across the top
 * carrying the sign, a full-width scalloped awning, the brick sill and the entrance on the right.
 */
function FrontWall({ lay, name, signage, plants }: { lay: Layout; name: string; signage: number; plants: number }) {
  const { L, R, door } = lay;
  const sill = (x0: number, x1: number) => {
    const [ax, ay] = P(x0, 0);
    const [bx] = P(x1, 0);
    return (
      <G key={x0}>
        <Rect x={ax} y={ay - 7} width={bx - ax} height={13} rx={2} fill="#A24B2C" stroke={INK} strokeWidth={1.2} />
        <Rect x={ax + 1} y={ay - 6} width={bx - ax - 2} height={4} fill="#fff" opacity={0.15} />
        {Array.from({ length: Math.floor((bx - ax) / 20) }).map((_, i) => (
          <Path key={i} d={`M${ax + 10 + i * 20} ${ay - 7} V${ay + 6}`} stroke="#7A3520" strokeWidth={1} />
        ))}
      </G>
    );
  };
  const pilaster = (x0: number, x1: number, inner: 'l' | 'r') => {
    const [ax, ay] = P(x0, 0, 0);
    const [bx, ty] = P(x1, 0, FRONT_TOP);
    const w = bx - ax;
    const rows = Math.floor((ay - ty) / 9);
    return (
      <G key={x0}>
        <Rect x={ax} y={ty} width={w} height={ay - ty + 6} fill="#A24B2C" stroke={INK} strokeWidth={1.3} />
        {Array.from({ length: rows }).map((_, i) => (
          <G key={i}>
            <Path d={`M${ax} ${ty + 9 * (i + 1)} H${bx}`} stroke="#7A3520" strokeWidth={0.8} />
            <Path d={`M${ax + w * (i % 2 ? 0.33 : 0.66)} ${ty + 9 * i} v9`} stroke="#7A3520" strokeWidth={0.8} />
          </G>
        ))}
        <Rect x={inner === 'l' ? bx - 3.5 : ax} y={ty} width={3.5} height={ay - ty + 6} fill="#000" opacity={0.18} />
        <Rect x={inner === 'l' ? ax + 1.5 : bx - 4} y={ty} width={2.5} height={ay - ty + 6} fill="#fff" opacity={0.16} />
        <Rect x={ax - 2} y={ay - 2} width={w + 4} height={8} rx={1.5} fill="#7A3520" stroke={INK} strokeWidth={1} />
      </G>
    );
  };
  // fascia beam + sign
  const [fx0, fTop] = P(L - 6, 0, FRONT_TOP);
  const [fx1, fBot] = P(R + 6, 0, FRONT_TOP - 20);
  const fcx = (fx0 + fx1) / 2;
  const signW = Math.min(fx1 - fx0 - 40, 34 + name.length * 9.6 + 54);
  const board = signage === 0 ? '#8E5A3C' : signage === 1 ? '#1E1630' : '#D9443A';
  const text = signage === 0 ? '#FFF4E0' : signage === 1 ? '#FF8FB8' : '#fff';
  // awning valance under the fascia
  const n = 12;
  const aw = (fx1 - fx0 + 12) / n;
  return (
    <G>
      {sill(L - 4, door.x0)}
      {sill(door.x1, R + 4)}
      {/* entrance set in the front plane (critic D90): brick jambs + lintel, glazed leaf swung inward,
          and a see-through shop window above it up to the fascia */}
      {(() => {
        const jx0 = door.x0 - 8;
        const jx1 = R - 8;
        const [jax, jay] = P(jx0, 0, 0);
        const [jbx] = P(door.x0, 0, 0);
        const [kbx] = P(jx1, 0, 0);
        const [, lTop] = P(0, 0, 122);
        const [, lBot] = P(0, 0, 108);
        const [, gTop] = P(0, 0, 196);
        const [, bTop] = P(0, 0, FRONT_TOP - 20);
        const brick = (x0: number, x1: number, top: number, bot: number) => (
          <G>
            <Rect x={x0} y={top} width={x1 - x0} height={bot - top} fill="#A24B2C" stroke={INK} strokeWidth={1.1} />
            {Array.from({ length: Math.floor((bot - top) / 8) }).map((_, i) => (
              <Path key={i} d={`M${x0} ${top + 8 * (i + 1)} H${x1}`} stroke="#7A3520" strokeWidth={0.7} />
            ))}
          </G>
        );
        return (
          <G>
            {/* shop window above the entrance */}
            <Rect x={jax} y={gTop} width={kbx - jax} height={lTop - gTop} fill="url(#glass)" />
            <G opacity={0.85}>
            {/* two-tier pizza stand on display in the window (critic D141/D158) */}
            {(() => {
              const cx = (jax + kbx) / 2;
              const by = lTop - 13;
              const tier = (y: number, rx: number) => (
                <G>
                  <Ellipse cx={cx} cy={y} rx={rx} ry={rx * 0.24} fill="#E9E4DC" stroke={INK} strokeWidth={0.8} />
                  <Ellipse cx={cx} cy={y - 1.6} rx={rx * 0.86} ry={rx * 0.21} fill="#E9A64B" stroke={INK} strokeWidth={0.7} />
                  <Ellipse cx={cx} cy={y - 2} rx={rx * 0.7} ry={rx * 0.16} fill="#FFC531" />
                  {[-0.45, 0, 0.45].map((d) => <Circle key={d} cx={cx + d * rx} cy={y - 2 + (d === 0 ? 0.6 : -0.3)} r={1.1} fill="#E8432E" />)}
                </G>
              );
              return (
                <G>
                  <Path d={`M${cx - 3} ${by} L${cx + 3} ${by} L${cx + 1.2} ${by - 22} L${cx - 1.2} ${by - 22} Z`} fill="#C9A04A" stroke={INK} strokeWidth={0.7} />
                  <Ellipse cx={cx} cy={by} rx={7} ry={1.8} fill="#C9A04A" stroke={INK} strokeWidth={0.7} />
                  {tier(by - 8, 17)}
                  {tier(by - 22, 11)}
                </G>
              );
            })()}
            </G>
            <Path d={`M${jax + 7} ${gTop + 30} L${jax + 20} ${gTop + 8}`} stroke="#fff" strokeWidth={2.6} opacity={0.6} strokeLinecap="round" />
            {/* gold arched decal on the glass */}
            {(() => {
              const cx = (jax + kbx) / 2;
              const cy = gTop + (lTop - gTop) * 0.36;
              const r = (kbx - jax) * 0.55;
              const word = 'ROSA’S';
              return (
                <G>
                  {word.split('').map((ch, i) => {
                    const ang = (-26 + (52 * i) / (word.length - 1)) * (Math.PI / 180);
                    const x = cx + Math.sin(ang) * r;
                    const y = cy - Math.cos(ang) * r * 0.5;
                    return (
                      <SvgText key={i} x={x} y={y} fontFamily={F.bold} fontSize={8} fill="#E0B000" stroke="#7A5A00" strokeWidth={0.3} textAnchor="middle" rotation={(ang * 180) / Math.PI} origin={`${x}, ${y}`}>
                        {ch}
                      </SvgText>
                    );
                  })}
                </G>
              );
            })()}
            <Rect x={jax + 2} y={gTop + 2} width={kbx - jax - 4} height={lTop - gTop - 2} fill="none" stroke="#6B4330" strokeWidth={4.5} />
            <Rect x={jax + 2} y={gTop + 2} width={kbx - jax - 4} height={lTop - gTop - 2} fill="none" stroke={INK} strokeWidth={0.8} />
            <Path d={`M${(jax + kbx) / 2} ${gTop} V${(gTop + lTop) / 2 - 14}`} stroke="#6B4330" strokeWidth={3} />
            {brick(jax, kbx, bTop, gTop + 2)}
            <Rect x={jax - 1} y={gTop - 1} width={kbx - jax + 2} height={4} rx={1} fill="#7A3520" stroke={INK} strokeWidth={0.9} />
            <Circle cx={(jax + kbx) / 2 + 4} cy={(bTop + gTop) / 2 - 6} r={8} fill="#FFE7A0" stroke="#6B4330" strokeWidth={2.6} />
            <Path d={`M${(jax + kbx) / 2 + 4} ${(bTop + gTop) / 2 - 14} V${(bTop + gTop) / 2 + 2} M${(jax + kbx) / 2 - 4} ${(bTop + gTop) / 2 - 6} H${(jax + kbx) / 2 + 12}`} stroke="#6B4330" strokeWidth={1.4} />
            {(() => {
              // hangs over the sidewalk off the right pilaster; on the widest shop (no room) it sits on the brick header
              const outside = P(R + 6, 0)[0] + 26 <= SCENE_W - 4;
              const sx = outside ? P(R + 6, 0)[0] + 26 : (jax + kbx) / 2 + 14;
              const sy = outside ? gTop - 22 : (bTop + gTop) / 2 + 14;
              return (
                <G>
                  {outside && (
                    <G>
                      <Path d={`M${sx} ${sy - 16} H${sx - 26}`} stroke={INK} strokeWidth={2.4} fill="none" strokeLinecap="round" />
                      <Path d={`M${sx} ${sy - 16} H${sx - 26}`} stroke="#4A4F57" strokeWidth={1.2} fill="none" strokeLinecap="round" />
                      <Path d={`M${sx - 22} ${sy - 16} v6 M${sx - 6} ${sy - 16} v6`} stroke={INK} strokeWidth={0.8} />
                    </G>
                  )}
                  <Circle cx={sx - 14} cy={sy} r={10.5} fill="#D9443A" stroke={INK} strokeWidth={1.2} />
                  <Circle cx={sx - 14} cy={sy} r={8.4} fill="none" stroke="#FFF4E0" strokeWidth={0.8} />
                  <SvgText x={sx - 14} y={sy + 2} fontFamily={F.bold} fontSize={5.6} fill="#FFF4E0" textAnchor="middle">
                    PIZZA
                  </SvgText>
                  <Path d={`M${sx - 21} ${sy - 4} A8 8 0 0 1 ${sx - 10} ${sy - 7.5}`} stroke="#fff" strokeWidth={1.2} opacity={0.5} fill="none" strokeLinecap="round" />
                </G>
              );
            })()}
            <Path d={`M${jax} ${lTop - 12} H${kbx}`} stroke="#6B4330" strokeWidth={2.4} />
            <Rect x={jax + 2} y={lTop - 11} width={kbx - jax - 4} height={10} fill="#3B1F14" opacity={0.85} />
            <SvgText x={(jax + kbx) / 2} y={lTop - 3.4} fontFamily={F.bold} fontSize={6.5} fill="#E0B000" textAnchor="middle" letterSpacing={1}>
              PIZZERIA
            </SvgText>
            {/* jambs + lintel */}
            {brick(jax, jbx, lTop, jay + 6)}
            {brick(P(door.x1, 0)[0], kbx, lTop, jay + 6)}
            {brick(jax, kbx, lTop, lBot)}
            <Rect x={jax - 1} y={lTop - 3} width={kbx - jax + 2} height={4} rx={1} fill="#7A3520" stroke={INK} strokeWidth={0.9} />
            <Path d={`M${jbx} ${lBot} V${jay + 4} M${P(door.x1, 0)[0]} ${lBot} V${jay + 4}`} stroke="#5E3A26" strokeWidth={2.4} />
          </G>
        );
      })()}
      {pilaster(L - 6, L + 8, 'l')}
      {pilaster(R - 8, R + 6, 'r')}
      {/* awning: alternating stripes with scalloped edge, under the fascia */}
      <Path d={`M${fx0} ${fBot} L${fx1} ${fBot} L${fx1 + 6} ${fBot + 13} L${fx0 - 6} ${fBot + 13} Z`} fill="#FFF4E0" stroke={INK} strokeWidth={1.1} />
      {Array.from({ length: n }).map((_, i) => {
        const xa = fx0 - 6 + i * aw;
        const ta = fx0 + (i * (fx1 - fx0)) / n;
        const tb = fx0 + ((i + 1) * (fx1 - fx0)) / n;
        return (
          <G key={i}>
            {i % 2 === 0 && <Path d={`M${ta} ${fBot} L${tb} ${fBot} L${xa + aw} ${fBot + 13} L${xa} ${fBot + 13} Z`} fill="#D9443A" />}
            <Path d={`M${xa} ${fBot + 13} q${aw / 2} ${aw * 0.5} ${aw} 0`} fill={i % 2 === 0 ? '#D9443A' : '#FFF4E0'} stroke={INK} strokeWidth={1} />
          </G>
        );
      })}
      <Path d={`M${fx0 - 6} ${fBot + 13} H${fx1 + 6}`} stroke={INK} strokeWidth={1.1} />
      <Rect x={fx0} y={fBot} width={fx1 - fx0} height={3} fill="#000" opacity={0.15} />
      {/* fascia beam */}
      <Rect x={fx0} y={fTop} width={fx1 - fx0} height={fBot - fTop} fill="#5E3A26" stroke={INK} strokeWidth={1.4} />
      <Rect x={fx0 + 1} y={fTop + 1} width={fx1 - fx0 - 2} height={4} fill="#fff" opacity={0.14} />
      {/* hanging ferns from the fascia (plants decor) */}
      {plants >= 2 &&
        [0.04, 0.96].map((f) => {
          const hx = fx0 + (fx1 - fx0) * f;
          const hy = fBot + 30;
          return (
            <G key={f}>
              <Path d={`M${hx} ${fBot + 13} V${hy - 8}`} stroke={INK} strokeWidth={0.8} />
              <Path d={`M${hx - 8} ${hy - 8} L${hx + 8} ${hy - 8} L${hx + 5} ${hy} L${hx - 5} ${hy} Z`} fill="#C2693E" stroke={INK} strokeWidth={0.9} />
              {[-1, -0.5, 0, 0.5, 1].map((d) => {
                const tx = hx + d * 12;
                const ty = hy + 22 - Math.abs(d) * 5;
                return <Path key={d} d={`M${hx + d * 3} ${hy - 1} Q${tx + d * 4 - 4} ${(hy + ty) / 2} ${tx} ${ty} Q${tx + d * 4 + 4} ${(hy + ty) / 2} ${hx + d * 3 + 1.5} ${hy - 1} Z`} fill={Math.abs(d) === 0.5 ? '#3F8A3E' : '#4FA048'} stroke={INK} strokeWidth={0.7} />;
              })}
            </G>
          );
        })}
      {/* rooftop giant pizza (signage 3) */}
      {signage >= 3 && (
        <G>
          <Rect x={fcx - 3} y={fTop - 26} width={6} height={26} fill="#6B6B6B" stroke={INK} strokeWidth={1} />
          <Circle cx={fcx} cy={fTop - 56} r={40} fill="#FFE7A0" opacity={0.35} />
          <Circle cx={fcx} cy={fTop - 56} r={32} fill="#E9A64B" stroke={INK} strokeWidth={1.6} />
          <Circle cx={fcx} cy={fTop - 56} r={26} fill="#FFC531" />
          {[0, 60, 120].map((a) => (
            <Path key={a} d={`M${fcx - 26 * Math.cos((a * Math.PI) / 180)} ${fTop - 56 - 26 * Math.sin((a * Math.PI) / 180)} L${fcx + 26 * Math.cos((a * Math.PI) / 180)} ${fTop - 56 + 26 * Math.sin((a * Math.PI) / 180)}`} stroke="#E9A64B" strokeWidth={1.4} />
          ))}
          {[[-12, -8], [10, -14], [2, 6], [-8, 12], [14, 8], [-14, -20]].map(([dx, dy], i) => (
            <Circle key={i} cx={fcx + dx} cy={fTop - 56 + dy} r={4} fill="#E8432E" stroke={INK} strokeWidth={0.6} />
          ))}
          <Path d={`M${fcx - 20} ${fTop - 74} A26 26 0 0 1 ${fcx + 4} ${fTop - 82}`} stroke="#fff" strokeWidth={2.4} opacity={0.5} fill="none" strokeLinecap="round" />
        </G>
      )}
      {/* sign plate: painted board → neon → marquee bulbs */}
      {signage === 1 && <Rect x={fcx - signW / 2 - 6} y={fTop - 8} width={signW + 12} height={fBot - fTop + 16} rx={12} fill="#FF5E9A" opacity={0.28} />}
      <Rect x={fcx - signW / 2} y={fTop - 5} width={signW} height={fBot - fTop + 10} rx={6} fill={board} stroke={signage === 1 ? '#FF5E9A' : INK} strokeWidth={signage === 1 ? 2 : 1.4} />
      {signage !== 1 && <Rect x={fcx - signW / 2 + 3} y={fTop - 3} width={signW - 6} height={6} rx={3} fill="#fff" opacity={0.2} />}
      {signage >= 2 &&
        Array.from({ length: 18 }).map((_, i) => {
          const top = i < 9;
          const x = fcx - signW / 2 + 8 + (i % 9) * ((signW - 16) / 8);
          return <Circle key={i} cx={x} cy={top ? fTop - 5 : fBot + 5} r={2.2} fill="#FFF3B0" stroke="#E0B000" strokeWidth={0.6} />;
        })}
      <SvgText x={fcx} y={(fTop + fBot) / 2 + 5.5} fontFamily={F.bold} fontSize={16} fill={text} stroke={signage === 0 ? '#3B1F14' : undefined} strokeWidth={signage === 0 ? 0.4 : 0} textAnchor="middle">
        {`Rosa’s · ${name}`}
      </SvgText>
    </G>
  );
}

/** The glazed door leaf, swung ~60° into the room; depth-sorted on its own so walkers pass it correctly (critic G53). */
function DoorLeaf({ lay }: { lay: Layout }) {
  const { door } = lay;
  const hinge0 = P(door.x0, 0, 0);
  const hinge1 = P(door.x0, 0, 104);
  const tip0 = P(door.x0 - 24, 22, 0);
  const tip1 = P(door.x0 - 24, 22, 104);
  const g0 = P(door.x0 - 10, 9, 8);
  const g1 = P(door.x0 - 21, 19.5, 8);
  const g2 = P(door.x0 - 21, 19.5, 94);
  const g3 = P(door.x0 - 10, 9, 94);
  const [ox, oy] = P(door.x0 - 16, 15, 86);
  return (
    <G>
      <Polygon points={pts([hinge0, tip0, tip1, hinge1])} fill="#7E5038" stroke={INK} strokeWidth={1.2} />
      <Polygon points={pts([g0, g1, g2, g3])} fill="rgba(191,227,245,0.45)" stroke={INK} strokeWidth={0.8} />
      <Path d={`M${g0[0] - 2} ${g3[1] + 10} L${g1[0] + 3} ${g2[1] + 4}`} stroke="#fff" strokeWidth={1.6} opacity={0.6} strokeLinecap="round" />
      <Rect x={ox - 9} y={oy - 4.5} width={18} height={9} rx={2} fill="#E8432E" stroke="#fff" strokeWidth={0.8} />
      <SvgText x={ox} y={oy + 2.3} fontFamily={F.bold} fontSize={6} fill="#fff" textAnchor="middle">
        OPEN
      </SvgText>
    </G>
  );
}

/** Sidewalk A-frame chalkboard (replaces the doormat walkers kept covering, critic D118). */
function ChalkSign({ x, y }: { x: number; y: number }) {
  const [px, py] = P(x, y);
  return (
    <G transform={`translate(${px} ${py})`}>
      <Ellipse cx={0} cy={0} rx={15} ry={3.4} fill="rgba(59,31,20,0.25)" />
      <Path d="M-11 0 L-7 -36 L7 -36 L11 0" fill="none" stroke="#8E5A3C" strokeWidth={3} strokeLinejoin="round" />
      <Path d="M-10 -1 L-6.6 -35 L6.6 -35 L10 -1 Z" fill="#8E5A3C" stroke={INK} strokeWidth={1.1} />
      <Path d="M-7.6 -4 L-5 -32 L5 -32 L7.6 -4 Z" fill="#2F3B33" />
      <SvgText x={0} y={-23} fontFamily={F.bold} fontSize={6} fill="#FFF4E0" textAnchor="middle">
        PIZZA
      </SvgText>
      <SvgText x={0} y={-16} fontFamily={F.bold} fontSize={4.6} fill="#FFC531" textAnchor="middle">
        BY THE
      </SvgText>
      <SvgText x={0} y={-10} fontFamily={F.bold} fontSize={6} fill="#FFF4E0" textAnchor="middle">
        SLICE
      </SvgText>
      <Path d="M-4.5 -7 q4.5 2 9 0" stroke="#F28B82" strokeWidth={0.8} fill="none" />
    </G>
  );
}

function Doormat({ lay }: { lay: Layout }) {
  // lying flat on the sidewalk at the threshold: a perspective trapezoid with fringe (critic D143)
  const a0 = P(lay.door.x0 + 2, -2);
  const a1 = P(lay.door.x1 - 2, -2);
  const b1 = P(lay.door.x1 + 1, -14);
  const b0 = P(lay.door.x0 - 1, -14);
  const cx = (a0[0] + a1[0] + b0[0] + b1[0]) / 4;
  const cy = (a0[1] + b0[1]) / 2;
  return (
    <G>
      <Polygon points={pts([a0, a1, b1, b0])} fill="#7A3520" stroke={INK} strokeWidth={0.9} />
      <Polygon points={pts([P(lay.door.x0 + 4, -4), P(lay.door.x1 - 4, -4), P(lay.door.x1 - 1, -12), P(lay.door.x0 + 1, -12)])} fill="none" stroke="#C8643E" strokeWidth={0.8} />
      {[a0, a1].map((pt, i) => <Path key={`f${i}`} d={`M${pt[0] + (i ? 1 : -1)} ${pt[1]} L${pt[0] + (i ? 2.2 : -2.2)} ${pt[1] + 1} M${pt[0] + (i ? 1.4 : -1.4)} ${pt[1] + 3} L${pt[0] + (i ? 2.8 : -2.8)} ${pt[1] + 4}`} stroke="#C8643E" strokeWidth={0.8} />)}
      {[b0, b1].map((pt, i) => <Path key={`g${i}`} d={`M${pt[0] + (i ? 1 : -1)} ${pt[1] - 2} L${pt[0] + (i ? 2.6 : -2.6)} ${pt[1] - 1} M${pt[0] + (i ? 1 : -1)} ${pt[1] - 5} L${pt[0] + (i ? 2.6 : -2.6)} ${pt[1] - 4}`} stroke="#C8643E" strokeWidth={0.8} />)}
      <SvgText x={cx} y={cy + 2.2} fontFamily={F.bold} fontSize={6} fill="#FFC531" textAnchor="middle">
        WELCOME
      </SvgText>
    </G>
  );
}

function Planter({ x, y }: { x: number; y: number }) {
  const [px, py] = P(x, y);
  return (
    <G transform={`translate(${px} ${py})`}>
      <Ellipse cx={0} cy={0} rx={16} ry={4} fill="rgba(59,31,20,0.25)" />
      <Rect x={-12} y={-18} width={24} height={18} rx={3} fill="#A8714B" stroke={INK} strokeWidth={1.1} />
      <Rect x={2} y={-17} width={8} height={16} rx={2} fill="#000" opacity={0.12} />
      <Rect x={-2} y={-36} width={4} height={18} fill="#7A4A26" />
      <Circle cx={0} cy={-42} r={13} fill="#4FA048" stroke={INK} strokeWidth={1.1} />
      <Circle cx={-4} cy={-46} r={5} fill="#7FD06A" />
    </G>
  );
}

// ---------- street + traffic ----------
const CARS = [
  { lane: 0, speed: 46, offset: 40, color: '#56CCF2', kind: 'car' as const },
  { lane: 0, speed: 46, offset: 330, color: '#7B2CBF', kind: 'van' as const },
  { lane: 1, speed: 62, offset: 120, color: '#FFC531', kind: 'taxi' as const },
  { lane: 1, speed: 62, offset: 420, color: '#E8432E', kind: 'car' as const },
];

function Car({ x, y, color, kind, dir, label = 'MEGASLICE', labelColor = '#FFC531' }: { x: number; y: number; color: string; kind: 'car' | 'van' | 'taxi'; dir: 1 | -1; label?: string; labelColor?: string }) {
  const len = kind === 'van' ? 74 : 56;
  const h = kind === 'van' ? 30 : 22;
  return (
    <G transform={`translate(${x} ${y}) scale(${dir} 1) translate(${-len / 2} 0)`}>
      <Ellipse cx={len / 2} cy={1} rx={len / 2 + 4} ry={4} fill="rgba(0,0,0,0.3)" />
      <Rect x={0} y={-h - 4} width={len} height={h} rx={7} fill={color} stroke={INK} strokeWidth={1.2} />
      <Rect x={2} y={-h + 2} width={len - 4} height={4} rx={2} fill="#fff" opacity={0.25} />
      <Rect x={2} y={-10} width={len - 4} height={5} rx={2} fill="#000" opacity={0.15} />
      {kind !== 'van' ? (
        <G>
          <Path d={`M${len * 0.2} ${-h - 3} L${len * 0.3} ${-h - 15} L${len * 0.72} ${-h - 15} L${len * 0.86} ${-h - 3} Z`} fill={shade(color, 0.1)} stroke={INK} strokeWidth={1.2} />
          <Path d={`M${len * 0.32} ${-h - 4} L${len * 0.38} ${-h - 12} L${len * 0.5} ${-h - 12} L${len * 0.5} ${-h - 4} Z M${len * 0.55} ${-h - 4} L${len * 0.55} ${-h - 12} L${len * 0.68} ${-h - 12} L${len * 0.78} ${-h - 4} Z`} fill="#BFE3F5" stroke={INK} strokeWidth={0.8} />
        </G>
      ) : (
        <G>
          <Rect x={len * 0.68} y={-h} width={len * 0.26} height={h * 0.45} rx={3} fill="#BFE3F5" stroke={INK} strokeWidth={0.8} />
          <G transform={dir === -1 ? `translate(${len * 0.68} 0) scale(-1 1)` : undefined}>
            <SvgText x={len * 0.34} y={-h * 0.42} fontFamily={F.bold} fontSize={9} fill={labelColor} textAnchor="middle">
              {label}
            </SvgText>
          </G>
        </G>
      )}
      {kind === 'taxi' && <Rect x={len * 0.4} y={-h - 21} width={len * 0.2} height={6} rx={2} fill="#fff" stroke={INK} strokeWidth={0.8} />}
      {[0.22, 0.78].map((f) => (
        <G key={f}>
          <Circle cx={len * f} cy={-3} r={7} fill="#222" stroke={INK} strokeWidth={1} />
          <Circle cx={len * f} cy={-3} r={2.6} fill="#bbb" />
        </G>
      ))}
      <Rect x={len - 4} y={-h + 2} width={4} height={5} rx={1} fill="#FFF3B0" />
    </G>
  );
}

/** The shop's delivery vehicle parked by the door, drawn in the scene's outlined style. */
function ParkedVehicle({ x, y, v }: { x: number; y: number; v: number }) {
  if (v >= 2 && v <= 3) {
    return (
      <G transform={`translate(${x} ${y + 2}) scale(0.62)`}>
        <Car x={0} y={0} color={v === 3 ? '#D9443A' : '#E8432E'} kind={v === 3 ? 'van' : 'car'} dir={1} label="ROSA’S" labelColor="#FFF4E0" />
      </G>
    );
  }
  if (v === 4) {
    return (
      <G transform={`translate(${x} ${y - 18})`}>
        <Ellipse cx={0} cy={20} rx={14} ry={3} fill="rgba(59,31,20,0.2)" />
        <Path d="M-18 -4 H18" stroke={INK} strokeWidth={2} />
        {[-18, 18].map((dx) => <Ellipse key={dx} cx={dx} cy={-6} rx={9} ry={2} fill="#BFE3F5" stroke={INK} strokeWidth={0.8} />)}
        <Rect x={-10} y={-4} width={20} height={10} rx={4} fill="#9B51E0" stroke={INK} strokeWidth={1} />
        <Rect x={-6} y={6} width={12} height={8} rx={1} fill="#F6E7C1" stroke={INK} strokeWidth={0.8} />
      </G>
    );
  }
  const bike = v === 0;
  return (
    <G transform={`translate(${x} ${y})`}>
      <Ellipse cx={0} cy={1} rx={20} ry={3.5} fill="rgba(59,31,20,0.25)" />
      {[-12, 12].map((dx) => (
        <G key={dx}>
          <Circle cx={dx} cy={-7} r={bike ? 8 : 6.5} fill={bike ? 'none' : '#222'} stroke={INK} strokeWidth={bike ? 2 : 1} />
          <Circle cx={dx} cy={-7} r={2} fill="#bbb" />
        </G>
      ))}
      {bike ? (
        <Path d="M-12 -7 L-2 -18 L8 -18 L12 -7 M-2 -18 L2 -7 L8 -18 M8 -18 L6 -24 M-4 -20 H2" stroke="#E8432E" strokeWidth={2.2} fill="none" strokeLinejoin="round" strokeLinecap="round" />
      ) : (
        <G>
          <Path d="M-16 -9 Q-16 -20 -4 -20 L6 -20 L10 -10 L14 -10 L12 -5 L-16 -5 Z" fill="#FFC531" stroke={INK} strokeWidth={1.1} />
          <Path d="M8 -20 L12 -30 M9 -30 H16" stroke={INK} strokeWidth={1.8} strokeLinecap="round" />
          <Rect x={-18} y={-30} width={14} height={10} rx={1.5} fill="#E8432E" stroke={INK} strokeWidth={1} />
          <Rect x={-14} y={-27} width={6} height={3} rx={1} fill="#fff" opacity={0.8} />
        </G>
      )}
    </G>
  );
}

const Street = memo(function Street() {
  return (
    <G>
      <Rect x={-20} y={CURB_Y} width={SCENE_W + 40} height={8} fill="#9B9386" stroke={INK} strokeWidth={0.8} />
      <Rect x={-20} y={CURB_Y + 8} width={SCENE_W + 40} height={120} fill="#4C5056" />
      <Rect x={-20} y={CURB_Y + 8} width={SCENE_W + 40} height={10} fill="#000" opacity={0.15} />
      {Array.from({ length: 10 }).map((_, i) => (
        <Rect key={i} x={i * 48 - 20} y={CURB_Y + 40} width={26} height={3.5} rx={1.5} fill="#F2D15C" />
      ))}
    </G>
  );
});

const Sidewalk = memo(function Sidewalk({ frontY }: { frontY: number }) {
  return (
    <G>
      <Rect x={-20} y={frontY} width={SCENE_W + 40} height={CURB_Y - frontY} fill="#D3CCC0" />
      <Rect x={-20} y={frontY} width={SCENE_W + 40} height={16} fill="#000" opacity={0.06} />
      {Array.from({ length: 12 }).map((_, i) => (
        <Path key={i} d={`M${i * 40 - 6} ${frontY + 8} L${i * 40 - 32} ${CURB_Y}`} stroke="#B5AD9F" strokeWidth={1.1} />
      ))}
      <Path d={`M-20 ${frontY + 62} H${SCENE_W + 20}`} stroke="#B5AD9F" strokeWidth={1.1} />
    </G>
  );
});

function Cloud({ x, y, k, dusk = false }: { x: number; y: number; k: number; dusk?: boolean }) {
  const c = dusk ? '#F6C6A8' : '#fff';
  return (
    <G transform={`translate(${x} ${y}) scale(${k})`}>
      <Ellipse cx={0} cy={8} rx={34} ry={12} fill={c} />
      <Circle cx={-14} cy={0} r={14} fill={c} />
      <Circle cx={6} cy={-6} r={19} fill={c} />
      <Circle cx={24} cy={2} r={13} fill={c} />
      <Ellipse cx={0} cy={13} rx={30} ry={5} fill={dusk ? '#B9A3C9' : '#DCEBF7'} />
    </G>
  );
}

// ---------- animation clock ----------
function useClock(fps: number, paused: boolean) {
  const [t, setT] = useState(0);
  const base = useRef({ wall: Date.now(), t: 0 });
  useEffect(() => {
    if (paused) return;
    base.current = { wall: Date.now(), t: base.current.t };
    const id = setInterval(() => setT(base.current.t + (Date.now() - base.current.wall) / 1000), 1000 / fps);
    return () => {
      base.current.t += (Date.now() - base.current.wall) / 1000;
      clearInterval(id);
    };
  }, [fps, paused]);
  return t;
}

/** Linear interpolation along a polyline at fraction k (0..1) of its length. */
function along(path: [number, number][], k: number): [number, number] {
  const segs = path.slice(1).map((p, i) => Math.hypot(p[0] - path[i][0], p[1] - path[i][1]));
  const total = segs.reduce((a, b) => a + b, 0) || 1;
  let d = Math.max(0, Math.min(1, k)) * total;
  for (let i = 0; i < segs.length; i++) {
    if (d <= segs[i] || i === segs.length - 1) {
      const f = segs[i] ? Math.min(1, d / segs[i]) : 1;
      return [path[i][0] + (path[i + 1][0] - path[i][0]) * f, path[i][1] + (path[i + 1][1] - path[i][1]) * f];
    }
    d -= segs[i];
  }
  return path[path.length - 1];
}

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
  const lay = layout(fp, ovenCount, cookCount, staffCount, Game.tablesShown(shop), driverSlots);
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
    const offStreet: [number, number] = [SCENE_W + 50, -30 - lane];
    // drivers use the right half of the doorway, walk-ins the left (critic D179)
    const outsideDoor: [number, number] = [lay.door.cx + 6, -24 - lane];
    const insideDoor: [number, number] = [lay.door.cx + 6, 8];
    const via: [number, number] = [lay.door.x0 + 4, 30];
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
    const o = 1;
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
  // walk-ins order at the front-right of the counter, a second one queues toward the door (critic D166)
  const orderSpot = (i: number): [number, number] => [lay.counter.x1 - 18, i % 2 ? 32 : 48];
  for (let i = 0; i < guestCount; i++) {
    const cyc = t / 9 + 0.3 + i / Math.max(2, guestCount);
    const p = ((cyc % 1) + 1) % 1;
    // a different customer every visit, and different crowds in every shop (critic D112)
    const gSeed = shopSeed + i * 2 + 3 + Math.floor(cyc) * 13;
    const table = lay.tables[i];
    const seat: [number, number] = [table.x + 17, table.y];
    const start: [number, number] = [-30, -44];
    let pos: [number, number];
    let kind: Kind = 'guest';
    let walking = true;
    let o = 1;
    let face = false;
    let talking = false;
    const via: [number, number] = [lay.door.x0 + 4, 30];
    const orderAt = orderSpot(i);
    const gIn: [number, number] = [lay.door.cx - 6, 8];
    const gOut: [number, number] = [lay.door.cx - 6, -24];
    let mood: Mood = 'smile';
    if (p < 0.18) pos = along([start, [gOut[0], -44], gOut], p / 0.18);
    else if (p < 0.24) pos = along([gOut, gIn], (p - 0.18) / 0.06);
    else if (p < 0.34) {
      pos = along([gIn, orderAt], (p - 0.24) / 0.1);
      face = true;
    } else if (p < 0.42) {
      pos = orderAt;
      walking = false;
      talking = Math.sin(clock * 9) > -0.2;
    } else if (p < 0.5) {
      pos = along([orderAt, [seat[0] + 10, seat[1] + 8], seat], (p - 0.42) / 0.08);
      face = true;
    } else if (p < 0.8) {
      // seated on the right-hand chair, facing the table (critic G51)
      pos = seat;
      kind = 'sit';
      walking = false;
      face = true;
      const bite = Math.abs(Math.sin(clock * 2 + i));
      mood = bite > 1.4 / 2 ? 'chew' : bite < 0.3 ? 'happy' : 'smile';
    } else if (p < 0.88) pos = along([seat, via, gIn], (p - 0.8) / 0.08);
    else if (p < 0.92) pos = along([gIn, gOut], (p - 0.88) / 0.04);
    else pos = along([gOut, [SCENE_W + 50, -44]], (p - 0.92) / 0.08);
    o = 1;
    items.push({ y: pos[1] - 0.3, el: <Person key={`g${i}`} x={pos[0]} y={pos[1]} kind={kind} seed={gSeed} shirt={GUEST_SHIRTS[(shirtBase + i + Math.floor(cyc)) % GUEST_SHIRTS.length]} flip={face} step={walking ? clock * 12 : 0} o={o} talk={talking} mood={mood} blink={blinkAt(gSeed)} arm={kind === 'sit' ? Math.abs(Math.sin(clock * 2 + i)) * 2 : 0} /> });
  }
  // tables + seated diners: chairs, then the diner, then the table over their lap (critic D114)
  lay.tables.forEach((tb, i) => {
    items.push({ y: tb.y + 0.6, el: <Table key={`tb${i}`} x={tb.x} y={tb.y} tier={shop.decor.tables} part="back" /> });
    items.push({ y: tb.y - 0.6, el: <Table key={`tf${i}`} x={tb.x} y={tb.y} tier={shop.decor.tables} part="front" /> });
    const fixedIdx = i;
    // at least one customer is always eating, even on the very first screen (critic D177)
    if (fixedIdx < (running ? Math.max(1, Math.round(lay.tables.length * fixedFill)) : 1)) {
      const dSeed = shopSeed + i * 3 + 7 + Math.floor(t / 14 + i * 0.37) * 29;
      const bite = Math.abs(Math.sin(clock * 2 + i));
      const pose = (['none', 'slice', 'cup', 'lean'] as const)[(hash32(dSeed) >>> 3) % 4];
      items.push({ y: tb.y, el: <Person key={`s${i}`} x={tb.x - 17} y={tb.y} kind="sit" seed={dSeed} act={pose} shirt={GUEST_SHIRTS[(shirtBase + guestCount + fixedIdx * 3 + 1) % GUEST_SHIRTS.length]} blink={blinkAt(dSeed)} arm={bite * 2} mood={pose === 'slice' ? 'chew' : bite > 0.7 ? 'chew' : bite < 0.3 ? 'happy' : 'smile'} /> });
      // a busy room seats a companion opposite, on tables no walk-in is heading for
      if (running && fixedFill >= 0.6 && i >= guestCount && (hash32(dSeed + 1) % 3) !== 0) {
        const cSeed = dSeed + 501;
        const cPose = (['cup', 'none', 'slice', 'lean'] as const)[(hash32(cSeed) >>> 3) % 4];
        const cb = Math.abs(Math.sin(clock * 2 + i + 1.7));
        items.push({ y: tb.y - 0.1, el: <Person key={`s2${i}`} x={tb.x + 17} y={tb.y} kind="sit" flip seed={cSeed} act={cPose} shirt={GUEST_SHIRTS[(shirtBase + guestCount + fixedIdx * 3 + 5) % GUEST_SHIRTS.length]} blink={blinkAt(cSeed)} arm={cb * 2} mood={cb > 0.7 ? 'chew' : cb < 0.3 ? 'happy' : 'smile'} /> });
      }
    }
  });
  // potted plants (plants decor)
  if (shop.decor.plants >= 1) {
    items.push({ y: 30, el: <FloorPlant key="pp1" x={lay.L + 12} y={30} /> });
    items.push({ y: 100, el: <FloorPlant key="pp2" x={lay.R - 54} y={100} /> });
  }
  if (shop.decor.plants >= 3) items.push({ y: 100, el: <FloorPlant key="pp4" x={lay.L + 14} y={100} big /> });
  // kitchen crew + furniture
  lay.cooks.forEach((x, i) => items.push({ y: 92 + (i % 2) * 8, el: <Person key={`c${i}`} x={x} y={92 + (i % 2) * 8} kind="cook" front act={(['pin', 'toss', 'ladle'] as const)[i % 3]} mood={running && Math.sin(t * 4 + i) > 0.3 ? 'focus' : 'smile'} seed={shopSeed + i * 4 + 20} blink={blinkAt(shopSeed + i * 4 + 20)} arm={running ? Math.abs(Math.sin(t * 4 + i)) * 3 : 0} /> }));
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
              {[0.12, 0.88].map((f, i) => {
                const [sx, sy] = P(x0 + (x1 - x0) * f, 74, 6);
                const kk = kAt(74) * 1.4;
                return (
                  <G key={`sk${i}`} transform={`translate(${sx} ${sy}) scale(${kk})`}>
                    <Ellipse cx={0} cy={0.5} rx={8} ry={1.8} fill="#000" opacity={0.18} />
                    <Path d="M-7 0 Q-8 -9 -4 -11 L4 -11 Q8 -9 7 0 Z" fill="#E3C89A" stroke={INK} strokeWidth={0.9} />
                    <Path d="M2.5 -11 L4 -11 Q8 -9 7 0 L2 0 Q4.5 -5 2.5 -11 Z" fill="#B48E5E" />
                    <Path d="M-4 -11 q4 -2.5 8 0" stroke={INK} strokeWidth={0.8} fill="none" />
                    <Rect x={-4} y={-6.5} width={8} height={2.6} fill="#C8463A" opacity={0.8} />
                  </G>
                );
              })}
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
              {shop.prep >= 25 && (() => {
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
        {Array.from({ length: shop.managed ? 3 : Math.min(8, Math.ceil(shop.queued / 1.5)) }).map((_, i) => {
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
      const bx = b0 + ((b1 - b0) * (i + 0.5)) / nb;
      const by = i % 2 ? 60 : 72;
      const sd = shopSeed + i * 3 + 31 + nIdx * 7;
      const ci = (bBase + i) % 3;
      items.push({ y: by, el: <Person key={`b${i}`} x={bx} y={by} shirt={['#B23A48', '#7E3A8E', '#2E6E8E'][ci]} kind="baker" seed={sd} blink={blinkAt(sd)} arm={running ? Math.abs(Math.sin(t * 3 + i)) * 2.5 : 0} act={(['pizza', 'peel', 'slide'] as const)[(i + bBase) % 3]} dot={['#D9443A', '#3FAE5A', '#2D9CDB'][(ci + 1) % 3]} /> });
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
  items.push({ y: -34, el: <ChalkSign key="sign" x={lay.door.x0 - 75} y={-34} /> });
  items.push({ y: 11, el: <DoorLeaf key="leaf" lay={lay} /> });
  items.push({ y: -40, el: <Planter key="pl" x={lay.L + 8} y={-40} /> });
  const [scx, scy] = P(lay.scooter.x, lay.scooter.y);
  items.push({
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
          <RoomShell lay={lay} wall={nd.wall} fp={fp} flooring={shop.decor.flooring} walls={shop.decor.walls} signage={shop.decor.signage} plants={shop.decor.plants} />
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
