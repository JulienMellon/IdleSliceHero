// Shared pieces of the cut-scene backdrops: palette, sky and glow tables, the ground plane, the billboard, clouds and the far skyline. No city is named here.
import type { ReactElement } from 'react';
import { G, Path, Rect, Text } from 'react-native-svg';

import type { Backdrop as BackdropId, NeighborhoodId } from '../../../content/types';
import { F } from '../../../theme';
import { INDUSTRIAL_POSTS, cloud, lightsFor, rect, skyline, windows } from '../backdrop-art';

export const INK = '#3B1F14';

/** The home scenes' sky (or wall) gradient, top → horizon; each city's art adds its own (cities/). */
export const SKY: Partial<Record<BackdropId, [string, string]>> = {
  shop: ['#F3CB94', '#F2B880'],
  downtown: ['#8FBFEA', '#DCEEFB'],
  suburbs: ['#94D3F2', '#EAF8FF'],
  waterfront: ['#F49A7A', '#FFE2B8'],
  university: ['#A894E0', '#ECE3FF'],
  industrial: ['#7F8298', '#DDC6A8'],
  uptown: ['#1F2852', '#6A5ACD'],
  'megaslice-hq': ['#25093A', '#7B2CBF'],
  'downtown-rain': ['#232548', '#5C5470'],
};

/** Warm or cool light for lamp glows per home scene; each city's art adds its own. */
export const GLOW: Partial<Record<BackdropId, string>> = {
  shop: '#FFD98A',
  downtown: '#FFF1C2',
  suburbs: '#FFF6C8',
  waterfront: '#FFD27A',
  university: '#FFF1C2',
  industrial: '#FFD27A',
  uptown: '#FFD27A',
  'megaslice-hq': '#E2B8FF',
  'downtown-rain': '#FFC46B',
};

export type Ids = {
  glow: string;
  oak: string;
  lights: ReturnType<typeof lightsFor>;
  /** The neighbourhood a shop-interior panel is set in (its room, window and signature object). */ hood?: NeighborhoodId;
};

/** A scene: one layered SVG set for a backdrop id. */
export type SceneFn = (ids: Ids) => ReactElement;

// ---------------------------------------------------------------------------------------------------------------
// Shared pieces

// Both banks sit inside x 106..274 and below y -92, so every panel crop (narrowest: a tall frame shows about x 103..297 and y -100..200) holds them whole: a cloud cut by the frame edge read as a pale rectangle or a stray dot (D510).
export const CLOUDS = cloud(118, -52, 0.9) + cloud(214, -66, 1);

export const FAR_CITY = skyline(140, [
  [-10, 34, 150],
  [22, 26, 196],
  [46, 30, 170],
  [74, 22, 214],
  [94, 34, 160],
  [126, 28, 230],
  [152, 30, 190],
  [180, 24, 240],
  [202, 34, 176],
  [234, 26, 226],
  [258, 32, 200],
  [288, 24, 248],
  [310, 34, 186],
  [342, 28, 216],
  [368, 40, 170],
]);
export const FAR_CITY_WINDOWS = [
  [26, 196],
  [78, 214],
  [130, 230],
  [184, 240],
  [238, 226],
  [292, 248],
  [346, 216],
]
  .map(([x, h]) => windows(x + 4, 140 - h + 14, 2, Math.floor((h - 40) / 16), 4, 6, 9, 16, (c, r) => (c + r + x) % 3 === 0))
  .join('');

export function Ground({ y, fill, line = INK }: { y: number; fill: string; line?: string }) {
  return (
    <G>
      <Rect x={-20} y={y} width={440} height={230 - y} fill={fill} />
      <Rect x={-20} y={y} width={440} height={6} fill="#000" opacity={0.12} />
      <Path d={`M-20 ${y}H420`} stroke={line} strokeWidth={2} />
    </G>
  );
}

/** The MEGASLICE billboard: on two dark posts standing on a roof (industrial skyline) or, without `posts`, bolted to a facade (uptown). */
export function Billboard({ x, y, w, h, posts }: { x: number; y: number; w: number; h: number; posts?: typeof INDUSTRIAL_POSTS }) {
  const fs = Math.round(w / 10);
  return (
    <G>
      {posts ? (
        <Path d={posts.xs.map((px) => rect(px - 2.5, y + h, 5, posts.baseY - (y + h))).join('')} fill={posts.color} stroke={INK} strokeWidth={1.2} />
      ) : (
        <Path d={`M${x + 8} ${y + h}v5h8v-5M${x + w - 16} ${y + h}v5h8v-5`} fill="#2A2233" />
      )}
      <Rect x={x} y={y} width={w} height={h} rx={3} fill="#7B2CBF" stroke={INK} strokeWidth={2} />
      <Path d={`M${x + 4} ${y + 4}h${w - 8}v5h${8 - w}Z`} fill="#fff" opacity={0.18} />
      <Path d={`M${x + 8} ${y + h - 8}l9 -12l9 12Z`} fill="#FFC531" stroke={INK} strokeWidth={1.4} strokeLinejoin="round" />
      <Text x={x + (w + 26) / 2} y={y + h / 2 + fs * 0.36} fontSize={fs} fontFamily={F.bold} fill="#FFC531" stroke={INK} strokeWidth={0.8} textAnchor="middle">
        MEGASLICE
      </Text>
    </G>
  );
}
