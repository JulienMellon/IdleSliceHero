// Hair: the back hair of the stage and bust figures, the front hair and the strand-line colour. Head 100-box coordinates; the stage figure shifts them by HEAD_SHIFT.
import { Circle, G, Path } from 'react-native-svg';

import { BUN_KNOT, HAIR_BACK_INK, HAIR_BACK_STAGE, HAIR_FRONT } from '../cutscene/figure-art';
import { shade } from '../scene/projection';
import { INK } from './ink';
import type { Look } from './look-data';

export function HairBackStage({ style, hair, shadeColor }: { style: 'long' | 'bob'; hair: string; shadeColor: string }) {
  const art = HAIR_BACK_STAGE[style];
  return (
    <G>
      <Path d={art.d} fill={hair} stroke={INK} strokeWidth={HAIR_BACK_INK} strokeLinejoin="round" />
      <Path d={art.shade} fill={shadeColor} />
      <Path d={art.strands} stroke={strandColor(hair)} strokeWidth={1.3} fill="none" strokeLinecap="round" />
    </G>
  );
}

export function HairBack({ style, hair }: { style: Look['hairStyle']; hair: string }) {
  if (style === 'long') return <Path d="M24 44 Q22 82 34 90 L66 90 Q78 82 76 44 Z" fill={hair} />;
  if (style === 'bob') return <Path d="M26 42 Q24 70 32 72 L68 72 Q76 70 74 42 Z" fill={hair} />;
  return null;
}

export function HairFront({ style, hair }: { style: Look['hairStyle']; hair: string }) {
  switch (style) {
    case 'bun':
      return (
        <G fill={hair} stroke={INK} strokeWidth={2}>
          <Circle cx={BUN_KNOT.cx} cy={BUN_KNOT.cy} r={BUN_KNOT.r} />
          <Path d={HAIR_FRONT.bun} />
        </G>
      );
    case 'short':
    case 'long':
    case 'bob':
    case 'slick':
    case 'perm':
    case 'crew':
    case 'crop':
      return <Path d={HAIR_FRONT[style]} fill={hair} stroke={INK} strokeWidth={2} />;
    case 'bald':
      // tapered sideburns
      return (
        <G fill={hair} stroke={INK} strokeWidth={1}>
          <Path d="M26.5 40 Q29.5 38.5 30.5 42 L33 53 Q36 55.5 39 56 Q32 58.5 28.5 54 Q26.5 49 26.5 40 Z" />
          <Path d="M73.5 40 Q70.5 38.5 69.5 42 L67 53 Q64 55.5 61 56 Q68 58.5 71.5 54 Q73.5 49 73.5 40 Z" />
        </G>
      );
  }
}

/** Strand lines read darker on light hair and lighter on near-black hair. */
export function strandColor(hair: string) {
  const n = parseInt(hair.slice(1), 16);
  const lum = 0.3 * (n >> 16) + 0.59 * ((n >> 8) & 255) + 0.11 * (n & 255);
  return lum < 60 ? shade(hair, 0.32) : shade(hair, -0.28);
}
