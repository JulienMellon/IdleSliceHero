// Cut-scene backdrops: one layered SVG set per location. Far layer (hazy, low contrast), mid layer (the location's
// buildings and props), near layer (ground plane, contact line, cast shadows, edge props), then a vignette.
// Light comes from the upper left: right faces are shaded and shadows fall to the right.
// Static per (id, size, prop): the component is memo'd and every path string is built once at module load.
import { memo, useId } from 'react';
import Svg, { Defs, G, LinearGradient, RadialGradient, Rect, Stop } from 'react-native-svg';

import type { Backdrop as BackdropId, NeighborhoodId } from '../../../content/types';
import { CITY_ART } from '../../cities';
import { backdropView, lightsFor, shopLookFor } from '../backdrop-art';
import { DowntownScene, SuburbsScene, UniversityScene, WaterfrontScene } from './home';
import { HqScene, IndustrialScene, RainScene, UptownScene } from './home-more';
import { NameTag, OrderSlip, PhoneFootage, SoldSign, VendingMachine, IconProp, type BackdropProp } from './props';
import { GLOW, SKY, type SceneFn } from './shared';
import { ShopScene } from './shop';
import { ICON_PROP_IDS } from '../backdrop-art';

export type { BackdropProp };

/** Every scene: the home ones, then each registered city's (cities/index.ts). */
const SCENES = {
  shop: ShopScene,
  downtown: DowntownScene,
  suburbs: SuburbsScene,
  waterfront: WaterfrontScene,
  university: UniversityScene,
  industrial: IndustrialScene,
  uptown: UptownScene,
  'megaslice-hq': HqScene,
  'downtown-rain': RainScene,
  ...Object.assign({}, ...CITY_ART.map((c) => c.backdrops.scenes)),
} as Record<BackdropId, SceneFn>;

/** Sky and glow tables: the home ones with every city's merged over them. */
const SKIES = { ...SKY, ...Object.assign({}, ...CITY_ART.map((c) => c.backdrops.sky)) } as Record<BackdropId, [string, string]>;
const GLOWS = { ...GLOW, ...Object.assign({}, ...CITY_ART.map((c) => c.backdrops.glow)) } as Record<BackdropId, string>;

/** Per-scene zoom on the scenery, anchored at the kerb (the rainy opening shot frames Rosa's front). */
const SCENE_ZOOM: Partial<Record<BackdropId, number>> = { 'downtown-rain': 1.15 };

export const Backdrop = memo(function Backdrop({
  id,
  width,
  height,
  prop,
  propText,
  hood,
  captioned = false,
}: {
  id: BackdropId;
  width: number;
  height: number;
  prop?: BackdropProp;
  /** The text on a name tag. */ propText?: string;
  /** The neighbourhood a shop-interior panel is set in: it picks the room (Downtown's when absent). */ hood?: NeighborhoodId;
  captioned?: boolean;
}) {
  const [top, bottom] = id === 'shop' ? shopLookFor(hood).wall : SKIES[id];
  // unique per instance: two backdrops on screen (a panel sliding in over the last) never share gradient ids
  const uid = useId().replace(/[^a-zA-Z0-9]/g, '');
  const ids = { sky: `sky${uid}`, glow: `glow${uid}`, vig: `vig${uid}`, oak: `oak${uid}`, lights: lightsFor(captioned), hood };
  // Art is 400 wide with the ground at y 200 and up to 100 units of sky; a taller frame scales up and crops the sides.
  const { vbH } = backdropView(width, height);
  const Scene = SCENES[id];
  const zoom = SCENE_ZOOM[id];
  return (
    <Svg
      accessibilityElementsHidden
      importantForAccessibility="no-hide-descendants"
      width={width}
      height={height}
      viewBox={`0 ${200 - vbH} 400 ${vbH}`}
      preserveAspectRatio="xMidYMax slice"
    >
      <Defs>
        <LinearGradient id={ids.sky} x1="0" y1="0" x2="0" y2="1">
          <Stop offset="0" stopColor={top} />
          <Stop offset="1" stopColor={bottom} />
        </LinearGradient>
        <RadialGradient id={ids.glow} cx="50%" cy="50%" r="50%">
          <Stop offset="0" stopColor={GLOWS[id]} stopOpacity={0.9} />
          <Stop offset="1" stopColor={GLOWS[id]} stopOpacity={0} />
        </RadialGradient>
        <RadialGradient id={ids.vig} cx="50%" cy="42%" r="72%">
          <Stop offset="0.6" stopColor="#1A0A04" stopOpacity={0} />
          <Stop offset="1" stopColor="#1A0A04" stopOpacity={0.42} />
        </RadialGradient>
      </Defs>
      <Rect x={-20} y={-130} width={440} height={340} fill={`url(#${ids.sky})`} />
      {zoom ? (
        <G transform={`translate(200 200) scale(${zoom}) translate(-200 -200)`}>
          <Scene glow={ids.glow} oak={ids.oak} lights={ids.lights} hood={ids.hood} />
        </G>
      ) : (
        <Scene glow={ids.glow} oak={ids.oak} lights={ids.lights} hood={ids.hood} />
      )}
      {prop === 'vending-machine' && <VendingMachine />}
      {prop === 'sold-sign' && <SoldSign />}
      {prop === 'order-slip' && <OrderSlip />}
      {prop === 'name-tag' && <NameTag text={propText ?? ''} />}
      {prop === 'phone-footage' && <PhoneFootage />}
      {prop && (ICON_PROP_IDS as readonly string[]).includes(prop) && <IconProp id={prop as (typeof ICON_PROP_IDS)[number]} />}
      <Rect x={-20} y={200 - vbH - 10} width={440} height={vbH + 20} fill={`url(#${ids.vig})`} />
    </Svg>
  );
});
