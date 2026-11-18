// The stage figure: the waist-up, cel-shaded figure with a gesture per mood, used by the cut-scene player only.
import { useId } from 'react';
import Svg, { ClipPath, Defs, Ellipse, G, Path, Rect, Text } from 'react-native-svg';

import type { CharacterId, Mood } from '../../content/types';
import { CITY_ART } from '../cities';
import type { CityPortraits } from '../cities/types';
import {
  ARMBAND,
  ARM_FORE,
  CLIPBOARD,
  ARM_INK,
  ARM_SLEEVE,
  ARM_UPPER,
  BLUSH,
  EARS,
  EAR_INNER,
  FACES,
  FOLDS,
  HEAD_SHIFT,
  LIGHT_RIM,
  LIGHT_SHADE_HEAD,
  LIGHT_SHADE_TORSO,
  NAPKIN,
  NECK,
  NECK_SHADOW,
  NOSE,
  SHOULDERS_INK,
  SHOULDERS_SLEEVE,
  STRANDS,
  TORSO,
  gestureFor,
  GROUND,
  HEAD_CLIP,
} from '../cutscene/figure-art';
import { STAGE_VB, poseFor, type Pose } from '../cutscene/staging';
import { F } from '../../theme';
import { type ManagerItem } from '../scene/looks';
import { shade } from '../scene/projection';
import { HairBackStage, HairFront, strandColor } from './hair';
import { FoamWedge, Glasses, Hat, MarkerMustache, Mustache, Pencils } from './hats';
import { INK } from './ink';
import { lookFor } from './look';
import { Outfit } from './outfits';

/** Each registered city's hair drawn behind a head, by character, merged (cities/index.ts). */
const CITY_BEHIND_HEAD: CityPortraits['behindHead'] = Object.assign({}, ...CITY_ART.map((c) => c.portraits.behindHead));

/** Dee's armband and Anton's napkin sit on the left arm, over the sleeve (so drawn after it), at the spot the pose's arm passes through. */
export function ArmWear({ gear, pose, tone }: { gear: ManagerItem | undefined; pose: Pose; tone: (c: string) => string }) {
  if (gear === 'armband') {
    const a = ARM_UPPER[pose];
    return (
      <G transform={`translate(${a.x} ${a.y}) rotate(${a.deg})`}>
        <Path d={ARMBAND.d} fill={tone('#D9443A')} stroke={INK} strokeWidth={1.2} strokeLinejoin="round" />
        <Path d={ARMBAND.stripe} fill={tone('#FFFFFF')} />
      </G>
    );
  }
  if (gear === 'napkin') {
    const a = ARM_FORE[pose];
    return (
      <G transform={`translate(${a.x} ${a.y}) rotate(${a.deg})`}>
        <Path d={NAPKIN.flap} fill={tone('#FFFFFF')} stroke={INK} strokeWidth={1.2} strokeLinejoin="round" />
        <Path d={NAPKIN.d} fill={tone('#FFFFFF')} stroke={INK} strokeWidth={1.3} strokeLinejoin="round" />
        <Path d={NAPKIN.fold} stroke={tone('#C9CED6')} strokeWidth={1.1} />
      </G>
    );
  }
  return null;
}

/** The clipboard the 'clipboard' pose holds (drawn in the figure's own frame, so a flipped figure holds it mirrored). Under the fist and thumb. */
export function HeldClipboard() {
  return (
    <G>
      <Path d={CLIPBOARD.board} fill="#B98550" stroke={INK} strokeWidth={2} strokeLinejoin="round" />
      <Path d={CLIPBOARD.paper} fill="#FFFDF5" stroke={INK} strokeWidth={0.8} />
      <Path d={CLIPBOARD.lines} stroke="#9AA3AE" strokeWidth={1.1} strokeLinecap="round" />
      <Path d={CLIPBOARD.clip} fill="#B8C0CA" stroke={INK} strokeWidth={1.4} strokeLinejoin="round" />
    </G>
  );
}

/** The recipe card Rosa holds up at chest height (drawn un-mirrored even in a flipped figure; it is symmetric about x = 60). */
export function HeldCard({ flip }: { flip: boolean }) {
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

export function Stage({
  id,
  mood,
  size,
  flip,
  dim,
  holding,
  city,
}: {
  id: CharacterId;
  mood: Mood;
  size: number;
  flip: boolean;
  dim: boolean;
  holding?: 'recipe-card';
  city?: string;
}) {
  const L = lookFor(id, city);
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
    <Svg
      accessibilityElementsHidden
      importantForAccessibility="no-hide-descendants"
      width={(size * STAGE_VB.w) / STAGE_VB.h}
      height={size}
      viewBox={`0 0 ${STAGE_VB.w} ${STAGE_VB.h}`}
    >
      <Defs>
        <ClipPath id={clipId}>
          <Ellipse {...HEAD_CLIP} />
        </ClipPath>
      </Defs>
      <Ellipse {...GROUND.outer} fill="#000" opacity={0.14} />
      <Ellipse {...GROUND.inner} fill="#000" opacity={0.16} />
      <G transform={flip ? `translate(${STAGE_VB.w} 0) scale(-1 1)` : undefined}>
        <G transform={HEAD_SHIFT}>
          {CITY_BEHIND_HEAD[id]?.({ hair, tone }) ?? null}
          {L.hairStyle === 'long' || L.hairStyle === 'bob' ? (
            <HairBackStage style={L.hairStyle} hair={hair} shadeColor={tone(L.hairShade ?? shade(L.hair, -0.14))} />
          ) : null}
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
        <ArmWear gear={L.gear} pose={pose} tone={tone} />
        {/* the card's palms sit behind it, its thumbs come over its top corners */}
        {g.back ? <Path d={g.back} fill={skin} stroke={INK} strokeWidth={1.6} strokeLinejoin="round" /> : null}
        {holding === 'recipe-card' ? <HeldCard flip={flip} /> : null}
        {pose === 'clipboard' ? <HeldClipboard /> : null}
        <Path d={g.hands} fill={skin} stroke={INK} strokeWidth={1.6} strokeLinejoin="round" />
        <Path d={g.creases} stroke={skinShade} strokeWidth={1.2} fill="none" strokeLinecap="round" />
        <G transform={HEAD_SHIFT}>
          {L.foam ? <FoamWedge /> : null}
          <Ellipse cx={50} cy={50} rx={24} ry={25} fill={skin} stroke={INK} strokeWidth={2} />
          <Path d={EARS} fill={skin} stroke={INK} strokeWidth={1.8} />
          <Path d={EAR_INNER} stroke={skinShade} strokeWidth={1.4} fill="none" strokeLinecap="round" />
          {L.foam ? null : <HairFront style={L.hairStyle} hair={hair} />}
          {L.gear === 'stopwatch' ? <Pencils /> : null}
          {!L.foam && STRANDS[L.hairStyle] ? (
            <Path d={STRANDS[L.hairStyle]} stroke={strandColor(hair)} strokeWidth={1.3} fill="none" strokeLinecap="round" />
          ) : null}
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
          <Path
            d={face.mouth}
            fill={face.mouthFill ? '#8E2A1E' : 'none'}
            stroke={INK}
            strokeWidth={face.mouthFill ? 2 : 2.6}
            strokeLinecap="round"
            strokeLinejoin="round"
          />
          {face.tongue ? <Path d={face.tongue} fill="#E8766A" /> : null}
          {L.extra === 'glasses' && <Glasses stage />}
          {L.extra === 'mustache' && <Mustache hair={hair} />}
          {L.marker ? <MarkerMustache /> : null}
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
