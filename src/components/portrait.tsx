// Character art: flat, cartoony SVG figures with mood-driven faces.
// variant 'bust' (default): the small head-and-shoulders used by the coach card, title card, scrapbook and HUD.
// variant 'stage': the waist-up, cel-shaded figure with a gesture per mood, used by the cut-scene player only.
import { memo, useId } from 'react';
import Svg, { ClipPath, Circle, Defs, Ellipse, G, Path, Rect, Text } from 'react-native-svg';

import type { CharacterId, Mood } from '../content/types';
import { ARM_INK, ARM_SLEEVE, BLUSH, BUN_KNOT, HAIR_BACK_INK, HAIR_BACK_STAGE, HAIR_FRONT, EARS, EAR_INNER, FACES, FOLDS, GROUND, HEAD_CLIP, HEAD_SHIFT, LIGHT_RIM, LIGHT_SHADE_HEAD, LIGHT_SHADE_TORSO, NECK, NECK_SHADOW, NOSE, OUTFIT, SHOULDERS_INK, SHOULDERS_SLEEVE, STRANDS, TORSO, gestureFor } from './cutscene/figure-art';
import { STAGE_VB, poseFor } from './cutscene/staging';
import { F } from '../theme';
import { shade } from './scene/projection';

interface Look {
  skin: string;
  hair: string;
  shirt: string;
  /** Iris colour (stage figures). */
  eye: string;
  hairStyle: 'bun' | 'short' | 'long' | 'bald' | 'slick' | 'bob';
  /** The shade on the side of the back hair away from the light (stage figures); defaults to the hair darkened a little. */
  hairShade?: string;
  hat?: 'captain' | 'hardhat' | 'cap' | 'beret';
  extra?: 'glasses' | 'mustache' | 'apron' | 'beard' | 'pearls' | 'whistle' | 'tie';
}

export const LOOKS: Record<CharacterId, Look> = {
  'nonna-rosa': { skin: '#F2C9A0', hair: '#E8E4E0', shirt: '#B23A48', eye: '#6B4A2E', hairStyle: 'bun', extra: 'apron' },
  dale: { skin: '#F5D0B0', hair: '#7A4A26', shirt: '#2F80ED', eye: '#3E7CB1', hairStyle: 'short', hat: 'cap', extra: 'whistle' },
  marisol: { skin: '#C98F63', hair: '#F4F1EC', hairShade: '#d9d4cc', shirt: '#1F4E79', eye: '#4A2C1A', hairStyle: 'long', hat: 'captain' },
  priya: { skin: '#B07A52', hair: '#1E1414', shirt: '#9B51E0', eye: '#3A2416', hairStyle: 'long', extra: 'glasses' },
  'big-sal': { skin: '#E8B88E', hair: '#4A3A33', shirt: '#E67E22', eye: '#5A3A22', hairStyle: 'bald', hat: 'hardhat', extra: 'mustache' },
  genevieve: { skin: '#F6DCC8', hair: '#222222', shirt: '#111111', eye: '#2F7A5A', hairStyle: 'bob', hat: 'beret', extra: 'pearls' },
  'victor-crust': { skin: '#E9C4A6', hair: '#1A1A1A', shirt: '#2C2C3A', eye: '#5F87A3', hairStyle: 'slick', extra: 'tie' },
  'megaslice-rep': { skin: '#F0C8A8', hair: '#C2A15A', shirt: '#7B2CBF', eye: '#5A3A80', hairStyle: 'slick', extra: 'tie' },
};

export const DISPLAY_NAMES: Record<CharacterId, string> = {
  'nonna-rosa': 'Nonna Rosa',
  dale: 'Coach Dale',
  marisol: 'Captain Marisol',
  priya: 'Priya',
  'big-sal': 'Big Sal',
  genevieve: 'Genevieve',
  'victor-crust': 'Victor Crust',
  'megaslice-rep': 'MegaSlice Rep',
};

const INK = '#3B1F14';

// ---- shared head gear (100-box head coordinates; the stage figure shifts them by HEAD_SHIFT) ----

/** The stage figures' back hair: outlined, shaded on the shadow side, with strand lines (D401). Hidden behind the head, so never on the face. */
function HairBackStage({ style, hair, shadeColor }: { style: 'long' | 'bob'; hair: string; shadeColor: string }) {
  const art = HAIR_BACK_STAGE[style];
  return (
    <G>
      <Path d={art.d} fill={hair} stroke={INK} strokeWidth={HAIR_BACK_INK} strokeLinejoin="round" />
      <Path d={art.shade} fill={shadeColor} />
      <Path d={art.strands} stroke={strandColor(hair)} strokeWidth={1.3} fill="none" strokeLinecap="round" />
    </G>
  );
}

function HairBack({ style, hair }: { style: Look['hairStyle']; hair: string }) {
  if (style === 'long') return <Path d="M24 44 Q22 82 34 90 L66 90 Q78 82 76 44 Z" fill={hair} />;
  if (style === 'bob') return <Path d="M26 42 Q24 70 32 72 L68 72 Q76 70 74 42 Z" fill={hair} />;
  return null;
}

function HairFront({ style, hair }: { style: Look['hairStyle']; hair: string }) {
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

function Glasses({ stage }: { stage: boolean }) {
  return (
    <G stroke={INK} strokeWidth={2.2} fill={stage ? 'rgba(255,255,255,0.18)' : 'rgba(255,255,255,0.25)'}>
      <Path d="M35 47a7 7 0 1 0 14 0a7 7 0 1 0 -14 0Z M51 47a7 7 0 1 0 14 0a7 7 0 1 0 -14 0Z M49 47 L51 47" />
    </G>
  );
}

function Mustache({ hair }: { hair: string }) {
  return <Path d="M38 56 Q44 52 50 56 Q56 52 62 56 Q56 60 50 57 Q44 60 38 56 Z" fill={hair} stroke={INK} strokeWidth={1.4} />;
}

function Hat({ hat, stage }: { hat: NonNullable<Look['hat']>; stage: boolean }) {
  switch (hat) {
    case 'captain':
      return (
        <G stroke={INK} strokeWidth={2}>
          <Path d="M24 34 Q50 14 76 34 L72 38 L28 38 Z" fill="#FFFFFF" />
          <Rect x={26} y={36} width={48} height={6} rx={2} fill="#1F2A44" />
          {stage && <Path d="M28 39 H72" fill="none" stroke="#F2C94C" strokeWidth={1.6} />}
          <Circle cx={50} cy={30} r={3.5} fill="#F2C94C" />
        </G>
      );
    case 'hardhat':
      return (
        <G stroke={INK} strokeWidth={2}>
          <Path d="M27 36 Q28 16 50 16 Q72 16 73 36 Z" fill="#F2C94C" />
          {stage && <Path d="M44 17.5 Q43 26 44 35 L56 35 Q57 26 56 17.5 Z" fill="#F7D96B" strokeWidth={1.4} />}
          <Rect x={22} y={34} width={56} height={6} rx={3} fill="#F2C94C" />
        </G>
      );
    case 'cap':
      return (
        <G stroke={INK} strokeWidth={2}>
          <Path d="M27 36 Q28 18 50 18 Q72 18 73 36 Z" fill="#E8432E" />
          {stage && <Path d="M50 18.5 L50 35 M38 22 Q36 28 37 35" fill="none" stroke="#B52C1C" strokeWidth={1.4} />}
          <Path d="M50 36 L84 36 Q84 41 72 41 L50 41 Z" fill="#E8432E" />
        </G>
      );
    case 'beret':
      return (
        <G>
          <Ellipse cx={46} cy={24} rx={22} ry={8} fill="#B52C1C" stroke={INK} strokeWidth={2} transform="rotate(-10 46 24)" />
          {stage && <Path d="M47 16.5 l1 -4.5" stroke={INK} strokeWidth={2.4} strokeLinecap="round" />}
        </G>
      );
  }
}

// ---- bust (small callers) ----

function Face({ mood }: { mood: Mood }) {
  // Eyes
  const eyes =
    mood === 'happy' ? (
      <G stroke={INK} strokeWidth={2.6} fill="none" strokeLinecap="round">
        <Path d="M38 47 q4 -5 8 0" />
        <Path d="M54 47 q4 -5 8 0" />
      </G>
    ) : mood === 'surprised' ? (
      <G>
        <Circle cx={42} cy={46} r={3.8} fill={INK} />
        <Circle cx={58} cy={46} r={3.8} fill={INK} />
        <Circle cx={43.3} cy={44.6} r={1.3} fill="#fff" />
        <Circle cx={59.3} cy={44.6} r={1.3} fill="#fff" />
      </G>
    ) : (
      <G>
        <Ellipse cx={42} cy={47} rx={2.8} ry={3.5} fill={INK} />
        <Ellipse cx={58} cy={47} rx={2.8} ry={3.5} fill={INK} />
        <Circle cx={43} cy={45.6} r={1.1} fill="#fff" />
        <Circle cx={59} cy={45.6} r={1.1} fill="#fff" />
      </G>
    );
  const brows =
    mood === 'angry' ? (
      <G stroke={INK} strokeWidth={3} strokeLinecap="round">
        <Path d="M36 38 L47 42" />
        <Path d="M64 38 L53 42" />
      </G>
    ) : mood === 'sad' ? (
      <G stroke={INK} strokeWidth={3} strokeLinecap="round">
        <Path d="M37 41 L47 38" />
        <Path d="M63 41 L53 38" />
      </G>
    ) : mood === 'surprised' ? (
      <G stroke={INK} strokeWidth={3} strokeLinecap="round" fill="none">
        <Path d="M36 37 q6 -4 11 0" />
        <Path d="M53 37 q6 -4 11 0" />
      </G>
    ) : null;
  const mouth =
    mood === 'happy' ? (
      <Path d="M41 58 Q50 68 59 58 Z" fill="#8E2A1E" stroke={INK} strokeWidth={2} strokeLinejoin="round" />
    ) : mood === 'sad' ? (
      <Path d="M43 63 Q50 57 57 63" stroke={INK} strokeWidth={2.6} fill="none" strokeLinecap="round" />
    ) : mood === 'angry' ? (
      <Path d="M42 62 L58 62" stroke={INK} strokeWidth={3} strokeLinecap="round" />
    ) : mood === 'surprised' ? (
      <Ellipse cx={50} cy={61} rx={4.5} ry={5.5} fill="#8E2A1E" stroke={INK} strokeWidth={2} />
    ) : (
      <Path d="M43 60 Q50 64 57 60" stroke={INK} strokeWidth={2.6} fill="none" strokeLinecap="round" />
    );
  return (
    <G>
      {brows}
      {eyes}
      <G fill="#F28B82" opacity={mood === 'happy' || mood === 'angry' ? 0.6 : 0.35}>
        <Ellipse cx={35.5} cy={55} rx={4.4} ry={3} />
        <Ellipse cx={64.5} cy={55} rx={4.4} ry={3} />
      </G>
      <Ellipse cx={50} cy={53} rx={1.6} ry={1.2} fill="#000" opacity={0.1} />
      {mouth}
    </G>
  );
}

function Bust({ L, mood, size, flip }: { L: Look; mood: Mood; size: number; flip: boolean }) {
  return (
    <Svg width={size} height={size} viewBox="0 0 100 100" style={flip ? { transform: [{ scaleX: -1 }] } : undefined}>
      <HairBack style={L.hairStyle} hair={L.hair} />
      {/* body */}
      <Path d="M18 100 Q20 74 50 72 Q80 74 82 100 Z" fill={L.shirt} stroke={INK} strokeWidth={1.8} />
      <Path d="M62 74 Q80 76 82 100 L64 100 Q66 84 62 74 Z" fill="#000" opacity={0.14} />
      <Path d="M26 86 Q30 78 40 75" stroke="#fff" strokeWidth={3} opacity={0.22} fill="none" strokeLinecap="round" />
      {L.extra === 'apron' && <Path d="M36 100 L38 80 L62 80 L64 100 Z" fill="#FFFFFF" stroke={INK} strokeWidth={2} />}
      {L.extra === 'tie' && <Path d="M47 74 L53 74 L55 96 L50 100 L45 96 Z" fill="#E8432E" stroke={INK} strokeWidth={1.6} />}
      {L.extra === 'pearls' && (
        <G fill="#FFFFFF" stroke={INK} strokeWidth={0.8}>
          {[36, 41, 46, 50, 54, 59, 64].map((x, i) => (
            <Circle key={x} cx={x} cy={77 + Math.abs(i - 3) * -1 + 3} r={2.2} />
          ))}
        </G>
      )}
      {L.extra === 'whistle' && (
        <G>
          <Path d="M38 74 L50 88 L62 74" stroke="#F2C94C" strokeWidth={2} fill="none" />
          <Rect x={46} y={86} width={9} height={6} rx={2} fill="#BDBDBD" stroke={INK} strokeWidth={1.4} />
        </G>
      )}
      {/* neck + head */}
      <Rect x={43} y={64} width={14} height={12} fill={L.skin} />
      <Ellipse cx={50} cy={50} rx={24} ry={25} fill={L.skin} stroke={INK} strokeWidth={1.8} />
      <Path d="M62 29 A24 25 0 0 1 60 72.5 Q71 52 62 29 Z" fill="#000" opacity={0.08} />
      <Ellipse cx={40} cy={36} rx={7} ry={4.5} fill="#fff" opacity={0.22} transform="rotate(-20 40 36)" />
      <Ellipse cx={26.5} cy={52} rx={4} ry={6} fill={L.skin} stroke={INK} strokeWidth={2} />
      <Ellipse cx={73.5} cy={52} rx={4} ry={6} fill={L.skin} stroke={INK} strokeWidth={2} />
      <HairFront style={L.hairStyle} hair={L.hair} />
      <Face mood={mood} />
      {L.extra === 'glasses' && <Glasses stage={false} />}
      {L.extra === 'mustache' && <Mustache hair={L.hair} />}
      {L.hat && <Hat hat={L.hat} stage={false} />}
    </Svg>
  );
}

// ---- stage (cut-scene) ----

/** Strand lines read darker on light hair and lighter on near-black hair. */
function strandColor(hair: string) {
  const n = parseInt(hair.slice(1), 16);
  const lum = 0.3 * (n >> 16) + 0.59 * ((n >> 8) & 255) + 0.11 * (n & 255);
  return lum < 60 ? shade(hair, 0.32) : shade(hair, -0.28);
}

function Outfit({ who, shirt, tone }: { who: CharacterId; shirt: string; tone: (c: string) => string }) {
  const thin = { stroke: INK, strokeWidth: 1.5, strokeLinejoin: 'round' as const };
  switch (who) {
    case 'nonna-rosa':
      return (
        <G>
          <Path d={OUTFIT.apronStraps} stroke={INK} strokeWidth={5.4} strokeLinecap="round" fill="none" />
          <Path d={OUTFIT.apronStraps} stroke={tone('#FFFFFF')} strokeWidth={3} strokeLinecap="round" fill="none" />
          <Path d={OUTFIT.apronBib} fill={tone('#FFFFFF')} {...thin} strokeWidth={1.8} />
          <Path d={OUTFIT.apronPocket} fill="none" stroke={tone('#D9CFC4')} strokeWidth={1.6} />
        </G>
      );
    case 'dale':
      return (
        <G>
          <Path d={OUTFIT.poloCollar} fill={tone(shade(shirt, 0.25))} {...thin} />
          <Path d={OUTFIT.lanyard} stroke={tone('#F2C94C')} strokeWidth={2.2} fill="none" />
          <Path d={OUTFIT.whistle} fill={tone('#C9CED6')} {...thin} strokeWidth={1.3} />
        </G>
      );
    case 'victor-crust':
    case 'megaslice-rep': {
      const rep = who === 'megaslice-rep';
      return (
        <G>
          <Path d={OUTFIT.suitV} fill={tone('#F4F1EC')} {...thin} />
          <Path d={OUTFIT.tie} fill={tone(rep ? '#FFC531' : '#E8432E')} {...thin} strokeWidth={1.3} />
          <Path d={OUTFIT.lapels} fill={tone(shade(shirt, -0.22))} {...thin} />
          <Path d={rep ? OUTFIT.nameBadge : OUTFIT.pocketSquare} fill={tone(rep ? '#FFC531' : '#F4F1EC')} {...thin} strokeWidth={1.1} />
        </G>
      );
    }
    case 'genevieve':
      return (
        <G>
          <Path d={OUTFIT.turtleneck} fill={tone('#1C1C1C')} {...thin} />
          <Path d={OUTFIT.turtleFolds} stroke={tone('#3A3A3A')} strokeWidth={1.2} fill="none" />
          <Path d={OUTFIT.pearls} fill={tone('#FFFDF5')} stroke={INK} strokeWidth={0.8} />
        </G>
      );
    case 'priya':
      // Priya: cardigan over a tee, campus lanyard
      return (
        <G>
          <Path d={OUTFIT.teeStrip} fill={tone('#F4F1EC')} {...thin} />
          <Path d={OUTFIT.badgeCord} stroke={tone('#2F80ED')} strokeWidth={2} fill="none" />
          <Path d={OUTFIT.badge} fill={tone('#FFFFFF')} {...thin} strokeWidth={1.2} />
        </G>
      );
    case 'big-sal':
      // Big Sal: hi-vis work shirt with reflective tape
      return <Path d={OUTFIT.vestStripes} fill={tone('#E9EDF0')} stroke={INK} strokeWidth={1} />;
    case 'marisol':
      // Captain Marisol: double-breasted jacket, brass buttons and epaulettes
      return (
        <G>
          <Path d={OUTFIT.shirtV} fill={tone('#F4F1EC')} {...thin} />
          <Path d={OUTFIT.jacketLine} stroke={INK} strokeWidth={1.4} fill="none" />
          <Path d={OUTFIT.brass} fill={tone('#F2C94C')} stroke={INK} strokeWidth={0.9} />
        </G>
      );
  }
}

/** The recipe card Rosa holds up at chest height (drawn un-mirrored even in a flipped figure; it is symmetric about x = 60). */
function HeldCard({ flip }: { flip: boolean }) {
  return (
    <G transform={flip ? `translate(${STAGE_VB.w} 0) scale(-1 1)` : undefined}>
      <G transform="rotate(-3 60 103)">
        <Rect x={44} y={89} width={32} height={27} rx={2.5} fill="#FFF4D6" stroke={INK} strokeWidth={2} />
        <Text x={60} y={100} fontSize={5.4} fontFamily={F.bold} fill="#E8432E" textAnchor="middle">
          ROSA’S
        </Text>
        <Text x={60} y={106} fontSize={5.4} fontFamily={F.bold} fill="#E8432E" textAnchor="middle">
          SAUCE
        </Text>
        <Path d="M48.5 109.5h23M48.5 113h16" stroke={INK} strokeWidth={1.4} opacity={0.5} strokeLinecap="round" />
      </G>
    </G>
  );
}

function Stage({ id, mood, size, flip, dim, holding }: { id: CharacterId; mood: Mood; size: number; flip: boolean; dim: boolean; holding?: 'recipe-card' }) {
  const L = LOOKS[id];
  const tone = (c: string) => (dim ? shade(c, -0.2) : c);
  const skin = tone(L.skin);
  const hair = tone(L.hair);
  const shirt = tone(L.shirt);
  const face = FACES[mood];
  const pose = poseFor(id, mood, holding);
  const g = gestureFor(pose);
  const skinShade = shade(skin, -0.22);
  // light shade and rim are clipped to the head (unique per instance, like the backdrop's gradients)
  const clipId = `head${useId().replace(/[^a-zA-Z0-9]/g, '')}`;
  return (
    <Svg width={(size * STAGE_VB.w) / STAGE_VB.h} height={size} viewBox={`0 0 ${STAGE_VB.w} ${STAGE_VB.h}`}>
      <Defs>
        <ClipPath id={clipId}>
          <Ellipse {...HEAD_CLIP} />
        </ClipPath>
      </Defs>
      <Ellipse {...GROUND.outer} fill="#000" opacity={0.14} />
      <Ellipse {...GROUND.inner} fill="#000" opacity={0.16} />
      <G transform={flip ? `translate(${STAGE_VB.w} 0) scale(-1 1)` : undefined}>
        <G transform={HEAD_SHIFT}>
          {L.hairStyle === 'long' || L.hairStyle === 'bob' ? <HairBackStage style={L.hairStyle} hair={hair} shadeColor={tone(L.hairShade ?? shade(L.hair, -0.14))} /> : null}
        </G>
        <Path d={NECK} fill={skin} />
        <Path d={NECK_SHADOW} fill={skinShade} />
        <Path d={TORSO} fill={shirt} stroke={INK} strokeWidth={2} strokeLinejoin="round" />
        <Path d={FOLDS} stroke={shade(shirt, -0.3)} strokeWidth={1.4} fill="none" strokeLinecap="round" />
        <Outfit who={id} shirt={L.shirt} tone={tone} />
        {/* arms: butt-capped so each cuff ends flat against its hand; the shoulder discs round the other end */}
        <Path d={g.arms} stroke={INK} strokeWidth={ARM_INK} strokeLinecap="butt" strokeLinejoin="round" fill="none" />
        <Path d={SHOULDERS_INK} fill={INK} />
        <Path d={g.arms} stroke={shirt} strokeWidth={ARM_SLEEVE} strokeLinecap="butt" strokeLinejoin="round" fill="none" />
        <Path d={SHOULDERS_SLEEVE} fill={shirt} />
        {/* the card's palms sit behind it, its thumbs come over its top corners */}
        {g.back ? <Path d={g.back} fill={skin} stroke={INK} strokeWidth={1.6} strokeLinejoin="round" /> : null}
        {holding === 'recipe-card' ? <HeldCard flip={flip} /> : null}
        <Path d={g.hands} fill={skin} stroke={INK} strokeWidth={1.6} strokeLinejoin="round" />
        <Path d={g.creases} stroke={skinShade} strokeWidth={1.2} fill="none" strokeLinecap="round" />
        <G transform={HEAD_SHIFT}>
          <Ellipse cx={50} cy={50} rx={24} ry={25} fill={skin} stroke={INK} strokeWidth={2} />
          <Path d={EARS} fill={skin} stroke={INK} strokeWidth={1.8} />
          <Path d={EAR_INNER} stroke={skinShade} strokeWidth={1.4} fill="none" strokeLinecap="round" />
          <HairFront style={L.hairStyle} hair={hair} />
          {STRANDS[L.hairStyle] ? <Path d={STRANDS[L.hairStyle]} stroke={strandColor(hair)} strokeWidth={1.3} fill="none" strokeLinecap="round" /> : null}
          <Path d={BLUSH} fill="#F28B82" opacity={mood === 'happy' || mood === 'angry' ? 0.55 : 0.32} />
          <Path d={face.brows} stroke={INK} strokeWidth={face.browW} strokeLinecap="round" fill="none" />
          {face.sclera ? (
            <>
              <Path d={face.sclera} fill={tone('#FFFFFF')} />
              <Path d={face.iris} fill={tone(L.eye)} />
              <Path d={face.pupil} fill="#160A05" />
              <Path d={face.glints} fill="#FFFFFF" />
            </>
          ) : null}
          <Path d={face.lids} stroke={INK} strokeWidth={face.lidW ?? 1.9} strokeLinecap="round" fill="none" />
          <Path d={NOSE} stroke={skinShade} strokeWidth={1.7} strokeLinecap="round" fill="none" />
          <Path d={face.mouth} fill={face.mouthFill ? '#8E2A1E' : 'none'} stroke={INK} strokeWidth={face.mouthFill ? 2 : 2.6} strokeLinecap="round" strokeLinejoin="round" />
          {face.tongue ? <Path d={face.tongue} fill="#E8766A" /> : null}
          {L.extra === 'glasses' && <Glasses stage />}
          {L.extra === 'mustache' && <Mustache hair={hair} />}
          {L.hat && <Hat hat={L.hat} stage />}
        </G>
      </G>
      {/* light from the upper left, never mirrored: the head's shade and rim stay inside the head */}
      <Path d={LIGHT_SHADE_TORSO} fill="#000" opacity={0.13} />
      <G clipPath={`url(#${clipId})`}>
        <Path d={LIGHT_SHADE_HEAD} fill="#000" opacity={0.13} />
        <Path d={LIGHT_RIM} stroke="#FFFFFF" strokeWidth={2} opacity={0.4} fill="none" strokeLinecap="round" />
      </G>
    </Svg>
  );
}

/**
 * A character. `size` is the bust's square size, or the stage figure's height (its width is 0.8 × size).
 * `dim` (stage only) shades a listener down a little; `holding` (stage only) puts the prop in the figure's hands.
 */
export const Portrait = memo(function Portrait({
  id,
  mood = 'neutral',
  size = 120,
  flip = false,
  variant = 'bust',
  dim = false,
  holding,
}: {
  id: CharacterId;
  mood?: Mood;
  size?: number;
  flip?: boolean;
  variant?: 'bust' | 'stage';
  dim?: boolean;
  /** Stage only: a prop the figure holds up at chest height. */
  holding?: 'recipe-card';
}) {
  const L = LOOKS[id];
  return variant === 'stage' ? <Stage id={id} mood={mood} size={size} flip={flip} dim={dim} holding={holding} /> : <Bust L={L} mood={mood} size={size} flip={flip} />;
});
