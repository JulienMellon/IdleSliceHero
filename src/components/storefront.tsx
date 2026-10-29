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

import { FOOTPRINTS, OVEN_GRADES, TUNING, VEHICLES } from '../content/tuning';
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
const SC = 0.86;
const TX = 27.5;
const TY = 37;
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
const ROOM_W = [250, 285, 320, 350, 377];

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
  const prep = { x0: L + 6, x1: L + 6 + 30 + cookCount * 14 };
  const cooks = Array.from({ length: cookCount }, (_, i) => prep.x0 + 10 + (i * (prep.x1 - prep.x0 - 20)) / Math.max(1, cookCount - 1) + (cookCount === 1 ? (prep.x1 - prep.x0 - 20) / 2 : 0));
  const cw = 56 + 12 * (staffCount - 1);
  const counter = { x0: R - 60 - cw, x1: R - 60 };
  const staff = Array.from({ length: staffCount }, (_, i) => counter.x0 + 14 + i * 20);
  // Ovens along the back wall between prep and counter; stack two decks rather than squeeze (critic G43).
  const zone0 = prep.x1 + 8;
  const zone1 = counter.x0 - 8;
  const zone = Math.max(30, zone1 - zone0);
  const singleW = (zone - (ovenCount - 1) * 6) / ovenCount;
  const decks = singleW >= 30 || ovenCount < 2 ? 1 : 2;
  const cols = Math.ceil(ovenCount / decks);
  const ow = Math.min(42, (zone - (cols - 1) * 6) / cols);
  const ovenCols = Array.from({ length: cols }, (_, c) => ({ x0: zone0 + c * (ow + 6), x1: zone0 + c * (ow + 6) + ow }));
  const ovens: Layout['ovens'] = [];
  for (let i = 0; i < ovenCount; i++) {
    const c = i % cols;
    const deck = Math.floor(i / cols);
    if (decks === 1) ovens.push({ ...ovenCols[c], z: 0, h: 118, chimney: true });
    else ovens.push({ ...ovenCols[c], z: deck * 62, h: 58, chimney: deck === 1 || i + cols >= ovenCount });
  }
  const door = { x0: R - 46, x1: R - 12, cx: R - 29 };
  // Pickup spots in front of the counter, two staggered depth rows 12 apart.
  const spots = Array.from({ length: driverSlots }, (_, i) => ({ x: counter.x0 + cw * 0.45 + i * 17, y: i % 2 ? 34 : 46 }));
  // Dining: tables in front of the prep/oven area, two rows, 52 apart.
  const t0 = L + 26;
  const t1 = counter.x0 - 10;
  const perRow = Math.max(1, Math.floor((t1 - t0) / 52) + 1);
  const tables: Layout['tables'] = [];
  for (let i = 0; i < Math.min(tableCount, perRow * 2); i++) {
    const row = i % 2;
    const col = Math.floor(i / 2);
    tables.push({ x: t0 + col * 52 + (row ? 14 : 0), y: row ? 40 : 14 });
  }
  return { L, R, prep, cooks, ovens, ovenCols, counter, staff, door, spots, tables, scooter: { x: R - 92, y: -52 } };
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
const SHIRT: Record<string, string> = { cook: '#E8432E', baker: '#B23A48', staff: '#3FAE5A', driver: '#2F80ED' };

/** A shaded, rounded worker or customer with a floor shadow, feet at room point (x, y). */
function Person({ x, y, kind, shirt, arm = 0, flip = false, carry = false, step = 0, hair = '#4A2C1D', skin, o = 1 }: { x: number; y: number; kind: Kind; shirt?: string; arm?: number; flip?: boolean; carry?: boolean; step?: number; hair?: string; skin?: string; o?: number }) {
  const [sx, sy] = P(x, y);
  const k = kAt(y) * 1.12;
  const sh = shirt ?? SHIRT[kind] ?? '#9B51E0';
  const sk = skin ?? (kind === 'guest' || kind === 'sit' ? '#C98F63' : '#F2C9A0');
  const sitting = kind === 'sit';
  const by = sitting ? -20 : -30;
  const leg = Math.sin(step) * 3;
  return (
    <G opacity={o} transform={`translate(${sx.toFixed(1)} ${sy.toFixed(1)}) scale(${(flip ? -k : k).toFixed(3)} ${k.toFixed(3)})`}>
      {!sitting && <Ellipse cx={0} cy={0} rx={11} ry={3.6} fill="rgba(59,31,20,0.25)" />}
      {!sitting && (
        <G>
          <Rect x={-5.5 + leg * 0.4} y={-12} width={4.6} height={12} rx={2.2} fill="#4A4A6E" stroke={INK} strokeWidth={0.8} />
          <Rect x={0.9 - leg * 0.4} y={-12} width={4.6} height={12} rx={2.2} fill="#3B3B5C" stroke={INK} strokeWidth={0.8} />
        </G>
      )}
      <Rect x={-8.5} y={by} width={17} height={20} rx={7} fill={sh} stroke={INK} strokeWidth={1.1} />
      <Rect x={2} y={by + 2} width={6} height={16} rx={3} fill="#000" opacity={0.14} />
      <Rect x={-7} y={by + 2} width={3} height={10} rx={1.5} fill="#fff" opacity={0.22} />
      {(kind === 'cook' || kind === 'baker' || kind === 'staff') && <Rect x={-6} y={by + 6} width={12} height={13} rx={3} fill="#fff" stroke={INK} strokeWidth={0.7} opacity={0.95} />}
      <Path d={`M6 ${by + 6} Q12 ${by + 10 - arm} ${13 + arm} ${by + 14 - arm * 2}`} stroke={sk} strokeWidth={4} fill="none" strokeLinecap="round" />
      {carry && (
        <G>
          <Rect x={9} y={by + 6} width={16} height={6} rx={1.2} fill="#F6E7C1" stroke={INK} strokeWidth={0.9} />
          <Circle cx={17} cy={by + 9} r={1.6} fill="#E8432E" />
        </G>
      )}
      <Circle cx={0} cy={by - 8} r={8.5} fill={sk} stroke={INK} strokeWidth={1.1} />
      <Path d={`M4 ${by - 14} A8.5 8.5 0 0 1 4 ${by - 2}`} fill="none" stroke="#000" strokeWidth={3} opacity={0.08} />
      <Circle cx={-3} cy={by - 11} r={2.6} fill="#fff" opacity={0.3} />
      <Circle cx={3} cy={by - 9} r={1.1} fill={INK} />
      <Path d={`M2 ${by - 4.5} q2.5 1.6 5 0`} stroke={INK} strokeWidth={0.9} fill="none" strokeLinecap="round" />
      <Ellipse cx={5.6} cy={by - 6} rx={1.6} ry={1} fill="#F28B82" opacity={0.6} />
      {(kind === 'cook' || kind === 'baker') && <Path d={`M-7 ${by - 12} Q-9 ${by - 24} -3 ${by - 22} Q0 ${by - 28} 3 ${by - 22} Q9 ${by - 24} 7 ${by - 12} Z`} fill="#FBF8F3" stroke={INK} strokeWidth={1} />}
      {kind === 'driver' && <Path d={`M-8.5 ${by - 10} Q-8.5 ${by - 19} 0 ${by - 19} Q8.5 ${by - 19} 8.5 ${by - 10} L15 ${by - 10} L15 ${by - 7.8} L-8.5 ${by - 7.8} Z`} fill="#D9443A" stroke={INK} strokeWidth={1} />}
      {kind === 'staff' && <Path d={`M-8.5 ${by - 10} Q-8.5 ${by - 18} 0 ${by - 18} Q8.5 ${by - 18} 8.5 ${by - 10} Z`} fill="#F5C33B" stroke={INK} strokeWidth={1} />}
      {(kind === 'guest' || kind === 'sit') && <Path d={`M-8.5 ${by - 9} Q-9 ${by - 18} 0 ${by - 18} Q8 ${by - 18} 8.5 ${by - 12} Q2 ${by - 15} -8.5 ${by - 9} Z`} fill={hair} />}
    </G>
  );
}

function Oven({ o, grade, lit, flicker }: { o: Layout['ovens'][number]; grade: number; lit: boolean; flicker: number }) {
  const y = D - 6;
  const [ax, ay] = P(o.x0, y, o.z);
  const [bx] = P(o.x1, y, o.z);
  const w = bx - ax;
  const cx = (ax + bx) / 2;
  const k = kAt(y);
  const h = o.h * k + (o.h > 100 ? grade * 3 : 0);
  const top = ay - h;
  const arch = Math.min(w * 0.32, h * 0.4);
  const base = OVEN_GRADES[grade].color;
  const mw = w * 0.52;
  const mh = h * 0.42;
  return (
    <G>
      {o.chimney && <Rect x={cx - w * 0.12 + 2} y={top - 20 * k} width={w * 0.24} height={24 * k} fill={grade >= 3 ? shade(base, -0.1) : '#9C8B7A'} stroke={INK} strokeWidth={1} />}
      <Path d={`M${ax + 3} ${ay} L${ax + 3} ${top + arch} Q${cx + 3} ${top - arch} ${bx + 3} ${top + arch} L${bx + 3} ${ay} Z`} fill={shade(base, -0.45)} stroke={INK} strokeWidth={1} />
      <Path d={`M${ax} ${ay} L${ax} ${top + arch} Q${cx} ${top - arch} ${bx} ${top + arch} L${bx} ${ay} Z`} fill={`url(#oven${grade})`} stroke={INK} strokeWidth={1.3} />
      {[1, 2, 3].map((r) => (
        <Path key={r} d={`M${ax + 2} ${ay - r * h * 0.2} H${bx - 2}`} stroke={shade(base, -0.35)} strokeWidth={0.8} opacity={0.45} />
      ))}
      <Path d={`M${ax + w * 0.2} ${top + arch} Q${cx - w * 0.05} ${top - arch * 0.3} ${cx + w * 0.12} ${top - arch * 0.1}`} stroke="#fff" strokeWidth={2} fill="none" opacity={0.35} strokeLinecap="round" />
      {grade >= 4 && <Path d={`M${ax + 3} ${top + arch + 4} Q${cx} ${top - arch * 0.4} ${bx - 3} ${top + arch + 4}`} stroke="#FFF3B0" strokeWidth={1.4} fill="none" />}
      <Path d={`M${cx - mw / 2} ${ay - 2} L${cx - mw / 2} ${ay - mh * 0.6} Q${cx} ${ay - mh * 1.2} ${cx + mw / 2} ${ay - mh * 0.6} L${cx + mw / 2} ${ay - 2} Z`} fill="#24120A" />
      {lit && (
        <G>
          <Ellipse cx={cx} cy={ay - mh * 0.3} rx={mw * 0.45} ry={mh * 0.45} fill="#FF9F1C" opacity={0.35} />
          <Path d={`M${cx - mw * 0.4} ${ay - 2} L${cx - mw * 0.25} ${ay - mh * 0.5 - flicker} L${cx - mw * 0.08} ${ay - mh * 0.28} L${cx + mw * 0.05} ${ay - mh * 0.72 + flicker} L${cx + mw * 0.2} ${ay - mh * 0.3} L${cx + mw * 0.33} ${ay - mh * 0.5} L${cx + mw * 0.4} ${ay - 2} Z`} fill="#FFB23A" />
        </G>
      )}
      <Rect x={ax - 3} y={ay - 3} width={w + 6} height={6} rx={2} fill="#6B4A3A" stroke={INK} strokeWidth={1} />
    </G>
  );
}

const TABLE_STYLE = [
  { top: '#FFFFFF', rim: '#E0DAD2', chair: '#F1EEEA', chairDark: '#C9C3BA', leg: '#9A958E' }, // plastic
  { top: '#FFFFFF', rim: '#D9443A', chair: '#D9443A', chairDark: '#B23A30', leg: INK }, // checked tablecloth
  { top: '#C99A6B', rim: '#8E5A3C', chair: '#7A4A26', chairDark: '#5E3A26', leg: '#5E3A26' }, // wooden bistro
  { top: '#F4F1EC', rim: '#D4AF37', chair: '#7B1E3A', chairDark: '#5A1229', leg: '#D4AF37' }, // marble & candles
];

function Table({ x, y, tier }: { x: number; y: number; tier: number }) {
  const st = TABLE_STYLE[tier];
  const [cx, cy] = P(x, y);
  const k = kAt(y) * 1.1;
  const chair = (dx: number) => {
    const [px, py] = P(x + dx, y);
    return (
      <G key={dx} transform={`translate(${px} ${py}) scale(${k})`}>
        <Rect x={-5} y={-16} width={10} height={16} rx={2.5} fill={st.chair} stroke={INK} strokeWidth={1} />
        <Rect x={-6} y={-9} width={12} height={3.5} rx={1.5} fill={st.chairDark} stroke={INK} strokeWidth={0.8} />
      </G>
    );
  };
  return (
    <G>
      <FloorShadow x={x} y={y} r={18} />
      {chair(-17)}
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
      {chair(17)}
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

const SKYLINE: Record<NeighborhoodId, (L: number, R: number) => ReactElement> = {
  downtown: () => (
    <G fill="#A9B8D0">
      {[[10, 90], [46, 130], [92, 70], [300, 120], [340, 85]].map(([x, h], i) => (
        <Rect key={i} x={x} y={230 - h} width={34} height={h} />
      ))}
    </G>
  ),
  suburbs: () => (
    <G>
      {[20, 110, 300].map((x, i) => (
        <G key={x}>
          <Rect x={x} y={196} width={50} height={34} fill={['#F6E7C1', '#FADADD', '#D6EAF8'][i]} opacity={0.85} />
          <Path d={`M${x - 6} 198 L${x + 25} 176 L${x + 56} 198 Z`} fill="#C9775F" opacity={0.85} />
        </G>
      ))}
    </G>
  ),
  waterfront: () => (
    <G>
      <Rect x={-10} y={196} width={420} height={40} fill="#7CC8EE" />
      <Path d="M0 206 q20 -5 40 0 t40 0 t40 0 t40 0 t40 0 t40 0 t40 0 t40 0 t40 0 t40 0" stroke="#D6F0FB" strokeWidth={2} fill="none" />
      <Path d="M300 196 L350 196 L344 186 L306 186 Z M322 186 L322 150 L344 182 Z" fill="#fff" stroke="#9BBAD0" strokeWidth={1} />
    </G>
  ),
  university: () => (
    <G fill="#C9B6E4">
      <Rect x={20} y={150} width={90} height={80} />
      <Path d="M14 152 L65 120 L116 152 Z" />
      <Rect x={300} y={110} width={26} height={120} />
      <Path d="M296 112 L313 86 L330 112 Z" />
      <Circle cx={313} cy={130} r={7} fill="#fff" />
    </G>
  ),
  industrial: () => (
    <G fill="#A7A39C">
      <Path d="M0 230 L0 180 L40 196 L40 180 L80 196 L80 180 L120 196 L120 230 Z" />
      <Rect x={300} y={100} width={18} height={130} />
      <Rect x={334} y={124} width={18} height={106} />
      <Circle cx={312} cy={88} r={12} fill="#E5E2DD" opacity={0.8} />
      <Circle cx={326} cy={70} r={16} fill="#E5E2DD" opacity={0.6} />
    </G>
  ),
  uptown: () => (
    <G fill="#8C8FB8">
      {[[0, 170], [36, 210], [80, 150], [290, 190], [330, 230], [366, 160]].map(([x, h], i) => (
        <Rect key={i} x={x} y={230 - h} width={32} height={h} />
      ))}
    </G>
  ),
};

const Backdrop = memo(function Backdrop({ id, L, R }: { id: NeighborhoodId; L: number; R: number }) {
  const palm = id === 'waterfront';
  const treeC = id === 'industrial' ? '#6F9E58' : '#4FA048';
  return (
    <G>
      <Rect x={-20} y={-400} width={SCENE_W + 40} height={1100} fill="url(#sky)" />
      {SKYLINE[id](L, R)}
      <Path d={`M-10 220 Q60 150 130 196 Q200 140 270 190 Q330 150 403 186 L403 700 L-10 700 Z`} fill={id === 'industrial' ? '#A9B58F' : '#9CCB86'} />
      <Tree x={12} y={214} k={1.1} c={treeC} palm={palm} />
      <Tree x={66} y={150} k={0.85} c={shade(treeC, 0.1)} palm={palm} />
      <Tree x={322} y={142} k={0.95} c={shade(treeC, 0.1)} palm={palm} />
      <Tree x={384} y={210} k={1.15} c={treeC} palm={palm} />
      <Tree x={196} y={132} k={0.7} c={shade(treeC, 0.2)} />
    </G>
  );
});

// ---------- the room shell (static per layout) ----------
const RoomShell = memo(function RoomShell({ lay, wall, fp, name, flooring, walls, signage, plants }: { lay: Layout; wall: string; fp: number; name: string; flooring: number; walls: number; signage: number; plants: number }) {
  const { L, R } = lay;
  const sideTop = WH + 30;
  const [sx, sy] = P(196.5, D, WH);
  const lights: ReactElement[] = [];
  if (fp >= 2) {
    const n = 12;
    for (let i = 0; i <= n; i++) {
      const x = L + 10 + ((R - L - 20) * i) / n;
      const [lx, ly] = P(x, D, WH - 46 - Math.sin((i / n) * Math.PI) * 8);
      lights.push(<Circle key={i} cx={lx} cy={ly} r={3.2} fill={['#FFC531', '#E8432E', '#3FAE5A'][i % 3]} stroke={INK} strokeWidth={0.7} />);
    }
  }
  const [wx, wy] = P(lay.counter.x1 - 8, D, 150);
  const [mx, my] = P(lay.counter.x0 + 4, D, 180);
  return (
    <G>
      {/* back wall with kitchen tiles below a rail */}
      <Polygon points={pts([P(L, D, 0), P(R, D, 0), P(R, D, WH), P(L, D, WH)])} fill={wall} stroke={INK} strokeWidth={1.4} />
      <Polygon points={pts([P(L, D, 0), P(R, D, 0), P(R, D, 60), P(L, D, 60)])} fill="#fff" opacity={0.35} />
      {Array.from({ length: Math.floor((R - L) / 12) }).map((_, i) => {
        const [x0, y0] = P(L + 6 + i * 12, D, 0);
        const [, y1] = P(0, D, 60);
        return <Path key={i} d={`M${x0} ${y0} V${y1}`} stroke={shade(wall, -0.12)} strokeWidth={1} />;
      })}
      <Path d={`M${P(L, D, 60).join(' ')} L${P(R, D, 60).join(' ')}`} stroke={shade(wall, -0.3)} strokeWidth={2} />
      {/* side walls */}
      <Polygon points={pts([P(L, 0, 0), P(L, D, 0), P(L, D, WH), P(L, 0, sideTop)])} fill={shade(wall, -0.12)} stroke={INK} strokeWidth={1.4} />
      <Polygon points={pts([P(R, 0, 0), P(R, D, 0), P(R, D, WH), P(R, 0, sideTop)])} fill={shade(wall, -0.06)} stroke={INK} strokeWidth={1.4} />
      {/* floor: plain tile → checkerboard → wood parquet → marble (decor) */}
      <Polygon points={pts([P(L, 0), P(R, 0), P(R, D), P(L, D)])} fill={['#E7D7BE', '#F4EFE6', '#C99A6B', '#F1EEEA'][flooring]} stroke={INK} strokeWidth={1.4} />
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
      {flooring === 3 && (
        <G>
          {Array.from({ length: 9 }).map((_, i) => {
            const x = L + ((R - L) * i) / 8;
            return <Path key={`mv${i}`} d={`M${P(x, 0).join(' ')} L${P(x, D).join(' ')}`} stroke="#DCD6CE" strokeWidth={1} />;
          })}
          {[[0.15, 20], [0.45, 60], [0.7, 30], [0.3, 90], [0.85, 75]].map(([fx, fy], i) => {
            const x = L + (R - L) * fx;
            return <Path key={`vein${i}`} d={`M${P(x, fy).join(' ')} Q${P(x + 20, fy + 6).join(' ')} ${P(x + 34, fy - 4).join(' ')}`} stroke="#B9B2A8" strokeWidth={1} fill="none" opacity={0.7} />;
          })}
        </G>
      )}
      {flooring === 0 &&
        Array.from({ length: 21 }).map((_, i) => {
          const x = L + ((R - L) * i) / 20;
          return <Path key={`v${i}`} d={`M${P(x, 0).join(' ')} L${P(x, D).join(' ')}`} stroke="#D4C1A3" strokeWidth={1} />;
        })}
      {flooring !== 2 &&
        Array.from({ length: 7 }).map((_, j) => (
          <Path key={`h${j}`} d={`M${P(L, j * 18.3).join(' ')} L${P(R, j * 18.3).join(' ')}`} stroke={flooring === 1 ? '#B53A30' : flooring === 3 ? '#DCD6CE' : '#D4C1A3'} strokeWidth={flooring === 1 ? 0.5 : 1} />
        ))}
      {/* decor grows with the shop */}
      {fp === 0 && <Path d={`M${mx - 30} ${my + 30} l6 12 l-4 8 l6 10`} stroke={shade(wall, -0.3)} strokeWidth={1.2} fill="none" />}
      {fp >= 1 && (
        <G>
          <Rect x={mx} y={my} width={52} height={34} rx={4} fill={INK} />
          {[7, 15, 23].map((d, i) => (
            <Rect key={d} x={mx + 6} y={my + d} width={[38, 28, 33][i]} height={3} rx={1.5} fill="#FFF4E0" />
          ))}
        </G>
      )}
      {lights.length > 0 && (
        <Path d={`M${P(L + 10, D, WH - 46).join(' ')} Q${P(196.5, D, WH - 66).join(' ')} ${P(R - 10, D, WH - 46).join(' ')}`} stroke={INK} strokeWidth={1} fill="none" />
      )}
      {lights}
      {/* wall decor (decor): posters → framed photos → hand-painted mural */}
      {walls >= 3 &&
        (() => {
          const x0 = L + 6;
          const x1 = lay.counter.x0 - 6;
          const [ax, ay] = P(x0, D, 238);
          const [bx, by] = P(x1, D, 150);
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
          const [ax, ay] = P(L + 10, D, 228);
          const [bx, by] = P(Math.min(lay.prep.x1 + 6, lay.counter.x0 - 40), D, 160);
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
      {walls >= 2 &&
        lay.ovenCols.length > 0 &&
        (() => {
          const xs = [0.2, 0.5, 0.8].map((f) => lay.ovenCols[0].x0 + (lay.ovenCols[lay.ovenCols.length - 1].x1 - lay.ovenCols[0].x0) * f);
          return (
            <G>
              {xs.map((x, i) => {
                const [fx, fy] = P(x, D, 236);
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
      {/* hanging ferns and an ivy rail (plants decor) */}
      {plants >= 2 &&
        [0.2, 0.5, 0.8].map((f, i) => {
          const x = L + (R - L) * f;
          const [hx, hy] = P(x, 70, 250);
          const [, ty] = P(x, 70, WH + 20);
          return (
            <G key={`fern${i}`}>
              <Path d={`M${hx} ${ty} V${hy - 8}`} stroke={INK} strokeWidth={0.8} />
              <Path d={`M${hx - 8} ${hy - 8} L${hx + 8} ${hy - 8} L${hx + 5} ${hy} L${hx - 5} ${hy} Z`} fill="#C2693E" stroke={INK} strokeWidth={0.9} />
              {[-1, -0.5, 0, 0.5, 1].map((d) => (
                <Path key={d} d={`M${hx + d * 6} ${hy - 2} q${d * 8} 10 ${d * 6} 22`} stroke="#4FA048" strokeWidth={3} fill="none" strokeLinecap="round" />
              ))}
            </G>
          );
        })}
      {plants >= 3 && (
        <G>
          <Path d={`M${P(L, D, WH - 20).join(' ')} L${P(R, D, WH - 20).join(' ')}`} stroke="#3F8F3A" strokeWidth={3} />
          {Array.from({ length: 22 }).map((_, i) => {
            const [vx, vy] = P(L + ((R - L) * (i + 0.5)) / 22, D, WH - 20);
            return <Ellipse key={i} cx={vx} cy={vy + (i % 3) * 3} rx={4} ry={2.6} fill={i % 2 ? '#5DBB5A' : '#3F9A48'} stroke={INK} strokeWidth={0.5} transform={`rotate(${(i % 2 ? 1 : -1) * 30} ${vx} ${vy})`} />;
          })}
          {[0.08, 0.92].map((f) =>
            Array.from({ length: 6 }).map((_, i) => {
              const [vx, vy] = P(L + (R - L) * f, D, WH - 26 - i * 14);
              return <Ellipse key={`${f}${i}`} cx={vx + (i % 2 ? 3 : -3)} cy={vy} rx={4} ry={2.6} fill={i % 2 ? '#5DBB5A' : '#3F9A48'} stroke={INK} strokeWidth={0.5} />;
            }),
          )}
        </G>
      )}
      {fp >= 4 && (
        <G>
          <Path d={`M${sx} ${sy + 40} v14`} stroke={INK} strokeWidth={1} />
          <Path d={`M${sx - 16} ${sy + 56} Q${sx} ${sy + 68} ${sx + 16} ${sy + 56} Z`} fill="#E0B000" stroke={INK} strokeWidth={1} />
        </G>
      )}
      {/* back window with trees outside */}
      <Rect x={wx} y={wy} width={40} height={36} rx={3} fill="#BFE3F5" stroke={INK} strokeWidth={1.2} />
      <Circle cx={wx + 14} cy={wy + 26} r={8} fill="#5DAE4B" />
      <Circle cx={wx + 27} cy={wy + 28} r={6} fill="#4FA048" />
      <Path d={`M${wx + 20} ${wy} V${wy + 36} M${wx} ${wy + 18} H${wx + 40}`} stroke="#fff" strokeWidth={2} />
      <Rect x={wx - 2} y={wy + 34} width={44} height={4} fill="#8E5A3C" stroke={INK} strokeWidth={0.8} />
      {/* sign (decor): painted board → neon → marquee bulbs → giant rooftop pizza */}
      {signage >= 3 && (
        <G>
          <Rect x={sx - 3} y={sy - 52} width={6} height={52} fill="#6B6B6B" stroke={INK} strokeWidth={1} />
          <Circle cx={sx} cy={sy - 70} r={34} fill="#E9A64B" stroke={INK} strokeWidth={1.6} />
          <Circle cx={sx} cy={sy - 70} r={28} fill="#FFC531" />
          {[[-12, -8], [10, -14], [2, 6], [-8, 12], [14, 8], [-16, -22]].map(([dx, dy], i) => (
            <Circle key={i} cx={sx + dx} cy={sy - 70 + dy} r={4} fill="#E8432E" stroke={INK} strokeWidth={0.6} />
          ))}
          {[0, 60, 120].map((a) => (
            <Path key={a} d={`M${sx - 28 * Math.cos((a * Math.PI) / 180)} ${sy - 70 - 28 * Math.sin((a * Math.PI) / 180)} L${sx + 28 * Math.cos((a * Math.PI) / 180)} ${sy - 70 + 28 * Math.sin((a * Math.PI) / 180)}`} stroke="#E9A64B" strokeWidth={1.4} />
          ))}
        </G>
      )}
      {signage === 1 && <Rect x={sx - 80} y={sy} width={160} height={36} rx={10} fill="#FF5E9A" opacity={0.25} />}
      <Rect x={sx - 74} y={sy + 6} width={148} height={24} rx={6} fill={signage === 0 ? '#8E5A3C' : signage === 1 ? '#1E1630' : '#D9443A'} stroke={signage === 1 ? '#FF5E9A' : INK} strokeWidth={signage === 1 ? 2 : 1.4} />
      {signage !== 1 && <Rect x={sx - 72} y={sy + 7} width={144} height={8} rx={4} fill="#fff" opacity={0.18} />}
      {signage >= 2 &&
        Array.from({ length: 16 }).map((_, i) => {
          const top = i < 8;
          const x = sx - 68 + (i % 8) * (136 / 7);
          return <Circle key={i} cx={x} cy={top ? sy + 5 : sy + 31} r={2.2} fill="#FFF3B0" stroke="#E0B000" strokeWidth={0.6} />;
        })}
      <SvgText x={sx} y={sy + 23} fontFamily={F.bold} fontSize={14} fill={signage === 0 ? '#FFF4E0' : signage === 1 ? '#FF8FB8' : '#fff'} textAnchor="middle">
        {`Rosa’s · ${name}`}
      </SvgText>
    </G>
  );
});

/** Brick sill along the cut front wall, with the entrance on the right. */
function FrontWall({ lay }: { lay: Layout }) {
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
  const [d0x, d0y] = P(door.x0, 0, 0);
  const [d1x] = P(door.x1, 0, 0);
  const [, topY] = P(door.x0, 0, 78);
  return (
    <G>
      {sill(L - 4, door.x0)}
      {sill(door.x1, R + 4)}
      {/* door frame + awning */}
      <Rect x={d0x - 4} y={topY} width={7} height={d0y - topY + 6} fill="#6B4330" stroke={INK} strokeWidth={1.1} />
      <Rect x={d1x - 3} y={topY} width={7} height={d0y - topY + 6} fill="#6B4330" stroke={INK} strokeWidth={1.1} />
      <Rect x={d0x - 6} y={topY - 5} width={d1x - d0x + 12} height={7} rx={2} fill="#5E3A26" stroke={INK} strokeWidth={1.1} />
      <Path d={`M${d0x - 12} ${topY - 10} L${d1x + 12} ${topY - 10} L${d1x + 18} ${topY + 2} L${d0x - 18} ${topY + 2} Z`} fill="#D9443A" stroke={INK} strokeWidth={1.1} />
      {Array.from({ length: 5 }).map((_, i) => {
        const w = (d1x - d0x + 36) / 5;
        const x = d0x - 18 + i * w;
        return <Path key={i} d={`M${x} ${topY + 2} q${w / 2} ${w * 0.5} ${w} 0`} fill={i % 2 ? '#D9443A' : '#fff'} stroke={INK} strokeWidth={0.9} />;
      })}
      {/* door swung open onto the sidewalk, with an OPEN sign */}
      <Path d={`M${d1x + 4} ${d0y + 4} L${d1x + 30} ${d0y + 18} L${d1x + 30} ${topY + 16} L${d1x + 4} ${topY + 6} Z`} fill="#7E5038" stroke={INK} strokeWidth={1.2} />
      <Path d={`M${d1x + 9} ${d0y + 4} L${d1x + 26} ${d0y + 12} L${d1x + 26} ${topY + 24} L${d1x + 9} ${topY + 16} Z`} fill="#BFE3F5" stroke={INK} strokeWidth={1} />
      <G transform={`translate(${d1x + 18} ${topY + 34}) skewY(26)`}>
        <Rect x={-10} y={-5} width={20} height={10} rx={2} fill="#E8432E" stroke="#fff" strokeWidth={0.8} />
        <SvgText x={0} y={2.5} fontFamily={F.bold} fontSize={6} fill="#fff" textAnchor="middle">
          OPEN
        </SvgText>
      </G>
    </G>
  );
}

function Doormat({ lay }: { lay: Layout }) {
  const [d0x, d0y] = P(lay.door.x0 + 2, -1);
  const [d1x] = P(lay.door.x1 - 2, -1);
  return (
    <G>
      <Rect x={d0x} y={d0y + 4} width={d1x - d0x} height={9} rx={2} fill="#7A3520" stroke={INK} strokeWidth={0.9} />
      <SvgText x={(d0x + d1x) / 2} y={d0y + 11} fontFamily={F.bold} fontSize={6} fill="#FFC531" textAnchor="middle">
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

function Car({ x, y, color, kind, dir }: { x: number; y: number; color: string; kind: 'car' | 'van' | 'taxi'; dir: 1 | -1 }) {
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
            <SvgText x={len * 0.34} y={-h * 0.42} fontFamily={F.bold} fontSize={9} fill="#FFC531" textAnchor="middle">
              MEGASLICE
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

const Street = memo(function Street() {
  return (
    <G>
      <Rect x={-20} y={CURB_Y} width={SCENE_W + 40} height={8} fill="#9B9386" stroke={INK} strokeWidth={0.8} />
      <Rect x={-20} y={CURB_Y + 8} width={SCENE_W + 40} height={120} fill="#4C5056" />
      <Rect x={-20} y={CURB_Y + 8} width={SCENE_W + 40} height={10} fill="#000" opacity={0.15} />
      {Array.from({ length: 10 }).map((_, i) => (
        <Rect key={i} x={i * 48 - 20} y={CURB_Y + 47} width={26} height={3.5} rx={1.5} fill="#F2D15C" />
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

function Cloud({ x, y, k }: { x: number; y: number; k: number }) {
  return (
    <G transform={`translate(${x} ${y}) scale(${k})`}>
      <Ellipse cx={0} cy={8} rx={34} ry={12} fill="#fff" />
      <Circle cx={-14} cy={0} r={14} fill="#fff" />
      <Circle cx={6} cy={-6} r={19} fill="#fff" />
      <Circle cx={24} cy={2} r={13} fill="#fff" />
      <Ellipse cx={0} cy={13} rx={30} ry={5} fill="#DCEBF7" />
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
  const mem = useRef({ phase: {} as Record<string, number>, lastPopAt: 0, lastSold: -1, shopId: '', pop: null as null | { at: number; text: string }, taps: [] as { at: number; x: number; y: number; text: string; color: string; count: number }[] });

  const ovenCount = Math.min(FOOTPRINTS[fp].ovenSlots, 1 + Math.floor((shop.ovens - 1) / 8));
  const cookCount = Math.min(4, 1 + Math.floor((shop.prep - 1) / 15));
  const staffCount = Math.min(3, 1 + Math.floor((shop.counter - 1) / 15));
  const driverSlots = [2, 2, 3, 3, 4][fp];
  const lay = layout(fp, ovenCount, cookCount, staffCount, Game.tablesShown(shop), driverSlots);
  const running = shop.managed || shop.queued > 0.01;
  const rate = Game.shopRate(shop, game.vehicle);
  const neck = Game.bottleneck(shop, game.vehicle);
  const pace = running ? Math.min(2.6, 0.8 + Math.log10(1 + rate)) : 0;
  const t = clock * pace;
  const fit = sceneFit(width, height);
  const frontY = P(0, 0)[1];

  // ---- people
  type Item = { y: number; el: ReactElement };
  const items: Item[] = [];
  const insideDoor: [number, number] = [lay.door.cx, 8];
  const outsideDoor: [number, number] = [lay.door.cx, -24];
  const driverCount = Math.min(driverSlots, shop.drivers);
  let payout = false;
  for (let i = 0; i < driverCount; i++) {
    const spot = lay.spots[i];
    const p = ((t / 6 + i / driverCount) % 1 + 1) % 1;
    let pos: [number, number];
    let walking = true;
    let o = 1;
    if (p < 0.14) {
      pos = along([insideDoor, [spot.x, spot.y]], p / 0.14);
      o = Math.min(1, p / 0.03);
    } else if (p < 0.62) {
      pos = [spot.x, spot.y];
      walking = false;
    } else if (p < 0.76) pos = along([[spot.x, spot.y], insideDoor], (p - 0.62) / 0.14);
    else if (p < 0.84) pos = along([insideDoor, outsideDoor], (p - 0.76) / 0.08);
    else {
      pos = along([outsideDoor, [lay.scooter.x + 16, lay.scooter.y + 6]], (p - 0.84) / 0.16);
      o = p > 0.95 ? (1 - p) / 0.05 : 1;
    }
    const prev = mem.current.phase[`d${i}`];
    if (running && prev !== undefined && prev < 0.76 && p >= 0.76) payout = true;
    mem.current.phase[`d${i}`] = p;
    if (running || i === 0) {
      const standing = !running ? true : !walking;
      items.push({
        y: running ? pos[1] : spot.y,
        el: <Person key={`d${i}`} x={running ? pos[0] : spot.x} y={running ? pos[1] : spot.y} kind="driver" carry={running && p >= 0.62} step={standing ? 0 : clock * 12} arm={running ? 1.5 : 0} flip={running && p < 0.14} o={running ? o : 1} />,
      });
    }
  }
  const guestCount = running ? Math.min(2, lay.tables.length) : 0;
  const HAIR = ['#2B1A12', '#8E5A3C', '#E3C16F', '#4A2C1D'];
  const SHIRTS = ['#F2994A', '#56CCF2', '#BB6BD9', '#6FCF97', '#9B51E0', '#27AE60'];
  const orderAt: [number, number] = [lay.counter.x0 + 12, 54];
  for (let i = 0; i < guestCount; i++) {
    const p = ((t / 9 + 0.3 + i * 0.5) % 1 + 1) % 1;
    const table = lay.tables[i];
    const seat: [number, number] = [table.x + 17, table.y + 1];
    const start: [number, number] = [lay.L + 40, -36];
    let pos: [number, number];
    let kind: Kind = 'guest';
    let walking = true;
    let o = 1;
    if (p < 0.22) {
      pos = along([start, [outsideDoor[0], -36], outsideDoor], p / 0.22);
      o = Math.min(1, p / 0.04);
    } else if (p < 0.3) pos = along([outsideDoor, insideDoor], (p - 0.22) / 0.08);
    else if (p < 0.42) pos = along([insideDoor, [insideDoor[0] - 20, 60], orderAt], (p - 0.3) / 0.12);
    else if (p < 0.5) {
      pos = orderAt;
      walking = false;
    } else if (p < 0.6) pos = along([orderAt, [seat[0] + 10, seat[1] + 8], seat], (p - 0.5) / 0.1);
    else {
      pos = seat;
      kind = 'sit';
      walking = false;
      o = p > 0.92 ? (1 - p) / 0.08 : 1;
    }
    items.push({ y: pos[1] - 0.5, el: <Person key={`g${i}`} x={pos[0]} y={pos[1]} kind={kind} shirt={SHIRTS[i]} hair={HAIR[i]} flip={kind === 'sit' || p < 0.3} step={walking ? clock * 12 : 0} o={o} /> });
  }
  // tables + seated diners
  lay.tables.forEach((tb, i) => {
    items.push({ y: tb.y, el: <Table key={`t${i}`} x={tb.x} y={tb.y} tier={shop.decor.tables} /> });
    if (running && i >= guestCount) items.push({ y: tb.y - 1, el: <Person key={`s${i}`} x={tb.x - 17} y={tb.y + 1} kind="sit" shirt={SHIRTS[(i + 2) % SHIRTS.length]} hair={HAIR[i % HAIR.length]} arm={Math.abs(Math.sin(clock * 2 + i)) * 2} /> });
  });
  // potted plants (plants decor)
  if (shop.decor.plants >= 1) {
    items.push({ y: 6, el: <FloorPlant key="pp1" x={lay.L + 10} y={6} /> });
    items.push({ y: 20, el: <FloorPlant key="pp2" x={lay.R - 8} y={20} /> });
    items.push({ y: -30, el: <FloorPlant key="pp3" x={lay.door.x0 - 14} y={-30} big /> });
  }
  if (shop.decor.plants >= 3) items.push({ y: 58, el: <FloorPlant key="pp4" x={lay.counter.x0 - 10} y={58} big /> });
  // kitchen crew + furniture
  lay.cooks.forEach((x, i) => items.push({ y: 92 + (i % 2) * 3, el: <Person key={`c${i}`} x={x} y={92 + (i % 2) * 3} kind="cook" shirt={i % 2 ? '#D9534F' : '#E8432E'} arm={running ? Math.abs(Math.sin(t * 4 + i)) * 3 : 0} /> }));
  items.push({
    y: 66,
    el: (
      <G key="prep">
        <FloorShadow x={(lay.prep.x0 + lay.prep.x1) / 2} y={64} r={(lay.prep.x1 - lay.prep.x0) * 0.6} />
        <Box x0={lay.prep.x0} x1={lay.prep.x1} y0={66} y1={84} h={44} color="#D9B48A" top="#EED3AE" />
        {Array.from({ length: shop.managed ? 3 : Math.min(8, Math.ceil(shop.queued / 1.5)) }).map((_, i) => {
          const [px, py] = P(lay.prep.x0 + 10 + (i % 4) * ((lay.prep.x1 - lay.prep.x0 - 20) / 3), 72 + Math.floor(i / 4) * 8, 44);
          return <Ellipse key={i} cx={px} cy={py} rx={7} ry={2.8} fill="#FBEFD6" stroke={INK} strokeWidth={0.8} />;
        })}
      </G>
    ),
  });
  lay.ovenCols.forEach((c, i) => items.push({ y: 76, el: <Person key={`b${i}`} x={c.x1 + 2} y={76} kind="baker" arm={running ? Math.abs(Math.sin(t * 3 + i)) * 2.5 : 0} flip={i % 2 === 1} /> }));
  lay.staff.forEach((x, i) => items.push({ y: 92, el: <Person key={`st${i}`} x={x} y={92} kind="staff" arm={running ? Math.abs(Math.sin(t * 5 + i * 2)) * 2 : 0} /> }));
  const boxes = running ? Math.min(5, 1 + Math.round(Math.log2(1 + rate))) : 0;
  items.push({
    y: 64,
    el: (
      <G key="counter">
        <FloorShadow x={(lay.counter.x0 + lay.counter.x1) / 2} y={62} r={(lay.counter.x1 - lay.counter.x0) * 0.6} />
        <Box x0={lay.counter.x0} x1={lay.counter.x1} y0={64} y1={84} h={52} color="#B0653A" top="#E9DCC8" />
        {lay.staff.map((x, i) => (
          <Register key={i} x={x} y={70} z={52} />
        ))}
        {Array.from({ length: boxes }).map((_, i) => (
          <Box key={`bx${i}`} x0={lay.counter.x1 - 24} x1={lay.counter.x1 - 6} y0={68} y1={80} h={5} z={52 + i * 6} color="#F6E7C1" top="#FFF6E5" />
        ))}
      </G>
    ),
  });
  // front of the shop + sidewalk props
  items.push({ y: 0, el: <FrontWall key="front" lay={lay} /> });
  items.push({ y: -1, el: <Doormat key="mat" lay={lay} /> });
  items.push({ y: -40, el: <Planter key="pl" x={lay.L + 8} y={-40} /> });
  const [scx, scy] = P(lay.scooter.x, lay.scooter.y);
  items.push({
    y: lay.scooter.y,
    el: (
      <G key="scooter">
        <Ellipse cx={scx} cy={scy + 2} rx={18} ry={4} fill="rgba(59,31,20,0.25)" />
        <SvgText x={scx} y={scy} fontSize={32} textAnchor="middle">
          {VEHICLES[game.vehicle].emoji}
        </SvgText>
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

  // ---- tags (screen positions also used for the tap targets)
  const ovenMid = (lay.ovenCols[0].x0 + lay.ovenCols[lay.ovenCols.length - 1].x1) / 2;
  const ovenTopZ = Math.max(...lay.ovens.map((o) => o.z + o.h)) + 34;
  const tagPos: Record<StationKey, [number, number]> = {
    prep: P((lay.prep.x0 + lay.prep.x1) / 2, 84, 84),
    ovens: P(ovenMid, D - 6, ovenTopZ),
    counter: P((lay.counter.x0 + lay.counter.x1) / 2, 76, 100),
    drivers: P(lay.spots[0].x + 10, 40, 80),
  };
  const tagLabel: Record<StationKey, string> = { prep: `PREP ${shop.prep}`, ovens: `OVENS ${shop.ovens}`, counter: `COUNTER ${shop.counter}`, drivers: `DRIVERS ${shop.drivers}` };
  const hot: Record<StationKey, boolean> = { prep: neck === 'prep', ovens: neck === 'ovens', counter: neck === 'counter', drivers: neck === 'customers' };

  // Clouds and cars move on the clock even when the shop is idle.
  const cloudXs = [
    { x0: 60, y: 60, k: 0.9, v: 4 },
    { x0: 260, y: 40, k: 1.1, v: 3 },
    { x0: 360, y: 100, k: 0.7, v: 5 },
    { x0: 160, y: 108, k: 0.55, v: 6 },
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
          const text = shop.managed ? `+${money(Game.shopEarnings(game, id) * TUNING.rushSeconds)} rush!` : full ? 'Kitchen full!' : `+${TUNING.tapBatch} 🍕`;
          const color = shop.managed ? C.basilDark : full ? INK : C.tomatoDark;
          const live = m.taps.filter((tp) => clock - tp.at < 0.9);
          const last = live[live.length - 1];
          if (last && last.text === text) {
            last.count += 1;
            last.at = clock;
            m.taps = live;
          } else {
            m.taps = [...live.slice(-1), { at: clock, x: Math.max(60, Math.min(SCENE_W - 60, x)), y: Math.max(140, Math.min(frontY - 60, y)), text, color, count: 1 }];
          }
          onTap();
        }}>
        <Svg width={width} height={height} viewBox={`${-fit.ox / fit.s} ${-fit.oy / fit.s} ${width / fit.s} ${height / fit.s}`}>
          <Defs>
            <LinearGradient id="sky" x1="0" y1="0" x2="0" y2="1">
              <Stop offset="0" stopColor="#6AAEE6" />
              <Stop offset="0.55" stopColor="#BFE0F7" />
              <Stop offset="1" stopColor="#E6F4FE" />
            </LinearGradient>
            {OVEN_GRADES.map((g, i) => (
              <LinearGradient key={i} id={`oven${i}`} x1="0" y1="0" x2="1" y2="0">
                <Stop offset="0" stopColor={shade(g.color, 0.3)} />
                <Stop offset="0.5" stopColor={g.color} />
                <Stop offset="1" stopColor={shade(g.color, -0.35)} />
              </LinearGradient>
            ))}
          </Defs>
          <Backdrop id={id} L={lay.L} R={lay.R} />
          {cloudXs.map((c, i) => (
            <Cloud key={i} x={((c.x0 + clock * c.v) % span) - 100} y={c.y} k={c.k} />
          ))}
          <Sidewalk frontY={frontY} />
          <Street />
          <RoomShell lay={lay} wall={nd.wall} fp={fp} name={nd.name} flooring={shop.decor.flooring} walls={shop.decor.walls} signage={shop.decor.signage} plants={shop.decor.plants} />
          {lay.ovens.map((o, i) => (
            <Oven key={i} o={o} grade={shop.grade} lit={running} flicker={flicker * (i % 2 ? -1 : 1)} />
          ))}
          {items.map((it) => it.el)}
          {CARS.map((c, i) => {
            const dir = c.lane === 0 ? -1 : 1;
            const raw = (c.offset + clock * c.speed) % span;
            const x = dir === 1 ? raw - 100 : SCENE_W + 100 - raw;
            return <Car key={i} x={x} y={c.lane === 0 ? CURB_Y + 42 : CURB_Y + 86} color={c.color} kind={c.kind} dir={dir as 1 | -1} />;
          })}
          {/* station tags: the bottleneck lights up red */}
          {(Object.keys(tagPos) as StationKey[]).map((k) => {
            const [x, y] = tagPos[k];
            const label = tagLabel[k];
            const w = label.length * 6.2 + 14;
            return (
              <G key={k}>
                <Rect x={x - w / 2} y={y - 11} width={w} height={16} rx={8} fill={hot[k] ? '#E8432E' : 'rgba(255,255,255,0.95)'} stroke={INK} strokeWidth={1.1} />
                <SvgText x={x} y={y + 1.5} fontFamily={F.bold} fontSize={10} fill={hot[k] ? '#fff' : INK} textAnchor="middle">
                  {label}
                </SvgText>
              </G>
            );
          })}
          {/* the real number of drivers when there are more than we can draw */}
          {shop.drivers > driverCount && (
            <G>
              <Rect x={tagPos.drivers[0] - 26} y={tagPos.drivers[1] - 32} width={52} height={17} rx={8.5} fill="#2F80ED" stroke="#fff" strokeWidth={1.4} />
              <SvgText x={tagPos.drivers[0]} y={tagPos.drivers[1] - 19.5} fontFamily={F.bold} fontSize={10.5} fill="#fff" textAnchor="middle">
                {`${VEHICLES[game.vehicle].emoji} ×${shop.drivers}`}
              </SvgText>
            </G>
          )}
          {/* idle prompt + tap queue, high on the back wall */}
          {!shop.managed && (
            <G>
              {(() => {
                const [qx, qy] = P(196.5, D, 232);
                return (
                  <G>
                    <Rect x={qx - 52} y={qy} width={104} height={12} rx={6} fill="#fff" stroke={INK} strokeWidth={1} />
                    <Rect x={qx - 51} y={qy + 1} width={102 * Math.min(1, shop.queued / TUNING.tapQueueMax)} height={10} rx={5} fill={C.cheese} />
                    <SvgText x={qx} y={qy + 9} fontFamily={F.bold} fontSize={8} fill={INK} textAnchor="middle">
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
            const w = label.length * 6.4 + 14;
            return (
              <G key={`${tp.text}`} opacity={k < 0.7 ? 1 : 1 - (k - 0.7) / 0.3}>
                <Rect x={tp.x - w / 2} y={tp.y - 12 - k * 14} width={w} height={18} rx={9} fill={tp.color} stroke="#fff" strokeWidth={1.4} />
                <SvgText x={tp.x} y={tp.y + 1.5 - k * 14} fontFamily={F.bold} fontSize={11} fill="#fff" textAnchor="middle">
                  {label}
                </SvgText>
              </G>
            );
          })}
          {/* cash pop above the door */}
          {pop && (
            <G opacity={1 - pop.k * pop.k}>
              <SvgText x={Math.min(P(lay.door.cx, 0)[0], SCENE_W - pop.text.length * 5)} y={P(lay.door.cx, 0, 110)[1] - pop.k * 14} fontFamily={F.bold} fontSize={17} fill="#fff" stroke={C.basilDark} strokeWidth={4} textAnchor="middle">
                {pop.text}
              </SvgText>
              <SvgText x={Math.min(P(lay.door.cx, 0)[0], SCENE_W - pop.text.length * 5)} y={P(lay.door.cx, 0, 110)[1] - pop.k * 14} fontFamily={F.bold} fontSize={17} fill="#fff" textAnchor="middle">
                {pop.text}
              </SvgText>
            </G>
          )}
        </Svg>
      </Pressable>
      {/* tap targets over the station tags: open that station's upgrade */}
      {(Object.keys(tagPos) as StationKey[]).map((k) => {
        const [x, y] = tagPos[k];
        const w = (tagLabel[k].length * 6.2 + 26) * fit.s;
        return <Pressable key={k} testID={`tag-${k}`} onPress={() => onStation(k)} style={{ position: 'absolute', left: fit.ox + x * fit.s - w / 2, top: fit.oy + (y - 16) * fit.s, width: w, height: 26 * fit.s }} />;
      })}
    </View>
  );
}
