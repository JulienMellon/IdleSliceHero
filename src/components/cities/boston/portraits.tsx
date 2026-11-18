// Boston's characters (card T2): their outfit pieces over the torso and Kayla's ponytail behind her head. Their looks and names are data in looks.ts.
import { G, Path } from 'react-native-svg';

import { HAIR_BACK_INK, OUTFIT, ell } from '../../cutscene/figure-art';
import { shade } from '../../scene/projection';
import { INK, THIN } from '../../portrait/ink';
import type { CityPortraits } from '../types';
import { BOSTON_LOOKS_DATA } from './looks';

const thin = THIN;

/** v5.18 (D509): one silhouette piece per Boston lead, in figure coordinates (the torso is x 40 to 80, y 73 to 151; the ponytail is in head 100-box coordinates). */
const BOSTON_OUTFIT = {
  collarTab: 'M55.5 73.5 h9 v7 h-9 Z',
  crossBar: 'M59 94 h2 v12 h-2 Z M55 98 h10 v2 h-10 Z',
  ponytail: 'M64 27 Q94 22 90 52 Q88 68 79 76 Q82 58 78 48 Q74 38 62 36 Z',
  ponytailBand: 'M69 28.5 Q74 27 77 30.5 L75 36.5 Q71 35 66.5 36 Z',
  blazerLapels: 'M51 73.5 L60 106 L52 110 L41 80 Z M69 73.5 L60 106 L68 110 L79 80 Z',
  blazerButtons: ell(60, 120, 1.7) + ell(60, 132, 1.7),
  trayDish: 'M28 121 L92 121 L86 131 L34 131 Z',
  trayPizza: ell(60, 118, 17, 5.4),
  trayDots: ell(52, 117.5, 1.7) + ell(62, 119.5, 1.7) + ell(68, 116.8, 1.7),
  coatLapels: 'M49 73.5 L58 112 L48 118 L38 84 Z M71 73.5 L62 112 L72 118 L82 84 Z',
  coatPocket: 'M68 116 h11 v12 h-11 Z',
  coatPens: 'M70.5 116 v-4 M73.5 116 v-5 M76.5 116 v-3.5',
  cardiganLine: 'M60 100 L60 151',
  cardiganButtons: ell(60, 108, 1.5) + ell(60, 120, 1.5) + ell(60, 132, 1.5),
};

/** Boston's outfit pieces: one per lead who has one (Kayla's is her ponytail, drawn behind the head). */
const OUTFITS: CityPortraits['outfits'] = {
  'father-dom': ({ shirt, tone }) => {
    // black clerical shirt with the white tab collar, a small silver cross on a chain
    return (
      <G>
        <Path d={BOSTON_OUTFIT.collarTab} fill={tone('#FFFFFF')} {...thin} />
        <Path d={OUTFIT.lanyard} stroke={tone('#C9CED6')} strokeWidth={1.4} fill="none" />
        <Path d={BOSTON_OUTFIT.crossBar} fill={tone('#C9CED6')} {...thin} strokeWidth={1.1} />
      </G>
    );
  },
  preston: ({ shirt, tone }) => {
    // a navy blazer over a pale shirt: lapels, a burgundy tie, a pocket square, two gold buttons
    return (
      <G>
        <Path d={OUTFIT.suitV} fill={tone('#DDE8F4')} {...thin} />
        <Path d={OUTFIT.tie} fill={tone('#8E2A3A')} {...thin} strokeWidth={1.3} />
        <Path d={BOSTON_OUTFIT.blazerLapels} fill={tone(shade(shirt, 0.16))} {...thin} />
        <Path d={OUTFIT.pocketSquare} fill={tone('#F4F1EC')} {...thin} strokeWidth={1.1} />
        <Path d={BOSTON_OUTFIT.blazerButtons} fill={tone('#F2C94C')} stroke={INK} strokeWidth={0.8} />
      </G>
    );
  },
  manny: ({ tone }) => {
    // a tray of pizza held at the hip, a green apron strap over the shoulders
    return (
      <G>
        <Path d={OUTFIT.apronStraps} stroke={tone('#1F4A2B')} strokeWidth={3} strokeLinecap="round" fill="none" />
        <Path d={BOSTON_OUTFIT.trayDish} fill={tone('#C9CED6')} {...thin} />
        <Path d={BOSTON_OUTFIT.trayPizza} fill={tone('#E9A23B')} stroke={INK} strokeWidth={1.4} />
        <Path d={BOSTON_OUTFIT.trayDots} fill={tone('#B5352A')} />
      </G>
    );
  },
  'lena-ko': ({ tone }) => {
    // an open white lab coat over a teal top, pens in the breast pocket
    return (
      <G>
        <Path d={OUTFIT.shirtV} fill={tone('#4F9DA6')} {...thin} />
        <Path d={BOSTON_OUTFIT.coatLapels} fill={tone('#FFFFFF')} {...thin} />
        <Path d={BOSTON_OUTFIT.coatPocket} fill="none" stroke={INK} strokeWidth={1.3} />
        <Path d={BOSTON_OUTFIT.coatPens} stroke={tone('#2F80ED')} strokeWidth={1.6} strokeLinecap="round" fill="none" />
      </G>
    );
  },
  'grandma-bea': ({ tone }) => {
    // a cardigan buttoned down the front and a string of pearls
    return (
      <G>
        <Path d={BOSTON_OUTFIT.cardiganLine} stroke={INK} strokeWidth={1.3} fill="none" />
        <Path d={BOSTON_OUTFIT.cardiganButtons} fill={tone('#F4F1EC')} stroke={INK} strokeWidth={0.8} />
        <Path d={OUTFIT.pearls} fill={tone('#FFFDF5')} stroke={INK} strokeWidth={0.8} />
      </G>
    );
  },
  'trish-vance': ({ shirt, tone }) => {
    // a MegaSlice blazer with a yellow name badge
    return (
      <G>
        <Path d={OUTFIT.suitV} fill={tone('#F4F1EC')} {...thin} />
        <Path d={OUTFIT.lapels} fill={tone(shade(shirt, -0.22))} {...thin} />
        <Path d={OUTFIT.nameBadge} fill={tone('#FFC531')} {...thin} strokeWidth={1.1} />
      </G>
    );
  },
};

const BEHIND_HEAD: CityPortraits['behindHead'] = {
  'kayla-dunn': ({ hair, tone }) => (
    <G>
      <Path d={BOSTON_OUTFIT.ponytail} fill={hair} stroke={INK} strokeWidth={HAIR_BACK_INK} strokeLinejoin="round" />
      <Path d={BOSTON_OUTFIT.ponytailBand} fill={tone('#F2C94C')} stroke={INK} strokeWidth={1.2} strokeLinejoin="round" />
    </G>
  ),
};

/** Boston's portraits, registered in cities/index.ts: the cast's looks (looks.ts) and the drawing of their outfits. */
export const BOSTON_PORTRAITS: CityPortraits = { ...BOSTON_LOOKS_DATA, outfits: OUTFITS, behindHead: BEHIND_HEAD };
