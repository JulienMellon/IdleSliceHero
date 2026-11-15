// Character art: flat, cartoony SVG figures with mood-driven faces.
// variant 'bust' (default): the small head-and-shoulders used by the coach card, title card, scrapbook and HUD.
// variant 'stage': the waist-up, cel-shaded figure with a gesture per mood, used by the cut-scene player only.
import { memo, useId } from 'react';
import Svg, { ClipPath, Circle, Defs, Ellipse, G, Path, Rect, Text } from 'react-native-svg';

import type { CharacterId, Mood } from '../content/types';
import { ARMBAND, ARM_FORE, CLIPBOARD, ARM_INK, ARM_SLEEVE, ARM_UPPER, BLUSH, BUN_KNOT, FEDORA, HAIR_BACK_INK, HAIR_BACK_STAGE, HAIR_FRONT, EARS, EAR_INNER, FACES, FOLDS, GROUND, HEAD_CLIP, HEAD_SHIFT, LIGHT_RIM, LIGHT_SHADE_HEAD, LIGHT_SHADE_TORSO, MARKER_MUSTACHE, NAPKIN, NECK, NECK_SHADOW, NOSE, OUTFIT, SHOULDERS_INK, SHOULDERS_SLEEVE, SLICEY, STRANDS, TORSO, gestureFor, type HairStyle } from './cutscene/figure-art';
import { STAGE_VB, poseFor, type Pose } from './cutscene/staging';
import { F } from '../theme';
import { MANAGER_LOOKS, type ManagerId, type ManagerItem } from './scene/looks';
import { shade } from './scene/projection';

interface Look {
  skin: string;
  hair: string;
  shirt: string;
  /** Iris colour (stage figures). */
  eye: string;
  hairStyle: HairStyle;
  /** The shade on the side of the back hair away from the light (stage figures); defaults to the hair darkened a little. */
  hairShade?: string;
  hat?: 'captain' | 'hardhat' | 'cap' | 'beret' | 'fedora' | 'purser';
  extra?: 'glasses' | 'mustache' | 'apron' | 'beard' | 'pearls' | 'whistle' | 'tie';
  /** A manager's signature item (scene/looks.ts MANAGER_LOOKS, so the shop badge draws the same one). */
  gear?: ManagerItem;
  /** Todd's trench coat over the shirt. */
  coat?: 'trench';
  /** A mustache drawn on in marker (Mr. Smith). */
  marker?: boolean;
  /** Slicey's foam cheese wedge around the face. */
  foam?: boolean;
}

/** A manager's look: the fixed table's skin, hair, shirt and signature item, plus the eye colour and the hat the table doesn't carry. */
function managerLook(id: ManagerId, eye: string, hat?: Look['hat']): Look {
  const m = MANAGER_LOOKS[id];
  return { skin: m.skin, hair: m.hair, shirt: m.shirt, eye, hairStyle: m.hairStyle, hat, gear: m.item };
}

/** The Todd family are variants of the MegaSlice rep's bust (same face and build): Mr. Smith in a trench coat and fedora with a marker mustache, Todd in the coat without it. */
const REP: Look = { skin: '#F0C8A8', hair: '#C2A15A', shirt: '#7B2CBF', eye: '#5A3A80', hairStyle: 'slick', extra: 'tie' };
const TRENCH: Look = { ...REP, hair: '#3B2B22', shirt: '#C8A878', eye: '#4A3B2A', extra: undefined, hat: 'fedora', coat: 'trench' };

export const LOOKS: Record<CharacterId, Look> = {
  'nonna-rosa': { skin: '#F2C9A0', hair: '#E8E4E0', shirt: '#B23A48', eye: '#6B4A2E', hairStyle: 'bun', extra: 'apron' },
  dale: { skin: '#F5D0B0', hair: '#7A4A26', shirt: '#2F80ED', eye: '#3E7CB1', hairStyle: 'short', hat: 'cap', extra: 'whistle' },
  marisol: { skin: '#C98F63', hair: '#F4F1EC', hairShade: '#d9d4cc', shirt: '#1F4E79', eye: '#4A2C1A', hairStyle: 'long', hat: 'captain' },
  priya: { skin: '#B07A52', hair: '#1E1414', shirt: '#9B51E0', eye: '#3A2416', hairStyle: 'long', extra: 'glasses' },
  'big-sal': { skin: '#E8B88E', hair: '#4A3A33', shirt: '#E67E22', eye: '#5A3A22', hairStyle: 'bald', hat: 'hardhat', extra: 'mustache' },
  genevieve: { skin: '#F6DCC8', hair: '#222222', shirt: '#111111', eye: '#2F7A5A', hairStyle: 'bob', hat: 'beret', extra: 'pearls' },
  'victor-crust': { skin: '#E9C4A6', hair: '#1A1A1A', shirt: '#2C2C3A', eye: '#5F87A3', hairStyle: 'slick', extra: 'tie' },
  'megaslice-rep': { skin: '#F0C8A8', hair: '#C2A15A', shirt: '#7B2CBF', eye: '#5A3A80', hairStyle: 'slick', extra: 'tie' },
  // v5.16 (card T1b): Todd's three looks (variants of the rep's bust) and the five General Managers (their look lines, COPY section 6)
  'mr-smith': { ...TRENCH, marker: true },
  'todd-coat': TRENCH,
  slicey: { ...REP, extra: undefined, hairStyle: 'bald', foam: true },
  deb: managerLook('deb', '#4F7F8C'),
  skip: managerLook('skip', '#3F5E7A', 'purser'),
  noor: managerLook('noor', '#3A2416'),
  dee: managerLook('dee', '#3F6B3A'),
  anton: managerLook('anton', '#5F87A3'),
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
  'mr-smith': 'Mr. Smith',
  'todd-coat': 'Todd',
  slicey: 'Slicey',
  deb: 'Deb',
  skip: 'Skip',
  noor: 'Noor',
  dee: 'Dee',
  anton: 'Anton',
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

/** Mr. Smith's mustache: one uneven marker stroke, off-centre, so it reads as drawn on. */
function MarkerMustache() {
  return (
    <G fill="none" strokeLinecap="round" strokeLinejoin="round">
      <Path d={MARKER_MUSTACHE.stroke} stroke="#14100E" strokeWidth={MARKER_MUSTACHE.width} />
      <Path d={MARKER_MUSTACHE.tail} stroke="#14100E" strokeWidth={MARKER_MUSTACHE.width * 0.8} />
    </G>
  );
}

/** Noor's pencils, stuck through her bun. */
function Pencils() {
  return (
    <G strokeLinecap="round" fill="none">
      {['M45 19 L31 11', 'M55 18 L69 10', 'M51 15 L57 9'].map((d) => (
        <G key={d}>
          <Path d={d} stroke={INK} strokeWidth={4.2} />
          <Path d={d} stroke="#F2C94C" strokeWidth={2.4} />
        </G>
      ))}
    </G>
  );
}

/** Slicey's cheese wedge, point down, behind the head: a crust band across the top, pepperoni, holes and the cut-out ring the face shows through. */
function FoamWedge() {
  const c = SLICEY.cutout;
  return (
    <G>
      <Path d={SLICEY.wedge} fill="#FFC531" stroke={INK} strokeWidth={2} strokeLinejoin="round" />
      <Path d={SLICEY.holes} fill="#E3A800" />
      <Ellipse cx={c.cx} cy={c.cy} rx={c.rx} ry={c.ry} fill="#D99A00" stroke={INK} strokeWidth={1.6} />
      {SLICEY.pepperoni.map(([cx, cy, r]) => (
        <G key={`${cx}-${cy}`}>
          <Circle cx={cx} cy={cy} r={r} fill="#D9443A" stroke={INK} strokeWidth={1.4} />
          <Circle cx={cx - r * 0.3} cy={cy - r * 0.3} r={r * 0.28} fill="#F27A6A" />
        </G>
      ))}
      <Path d={SLICEY.crust} fill="#D9953F" stroke={INK} strokeWidth={2} strokeLinejoin="round" />
      <Path d={SLICEY.crustBumps} fill="#B87428" />
    </G>
  );
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
    case 'purser':
      // Skip's purser's cap: a navy flat-topped crown, a gold braid and a big brass badge, a short peak over the brow
      return (
        <G stroke={INK} strokeWidth={2}>
          <Path d="M25 36 Q26 17 50 17 Q74 17 75 36 Z" fill="#1F2D46" />
          <Path d="M29 38 Q50 47 71 38 L72 41 Q50 50 28 41 Z" fill="#101827" />
          <Rect x={24} y={33} width={52} height={7} rx={3} fill="#17223A" />
          {stage && <Path d="M26 36.5 H74" fill="none" stroke="#F2C94C" strokeWidth={1.4} />}
          <Ellipse cx={50} cy={26.5} rx={6} ry={5} fill="#F2C94C" />
          <Path d="M50 22.5 V30.5 M46.5 26.5 H53.5" fill="none" stroke={INK} strokeWidth={1.2} strokeLinecap="round" />
        </G>
      );
    case 'fedora':
      return (
        <G stroke={INK} strokeWidth={2} strokeLinejoin="round">
          <Path d={FEDORA.crown} fill="#8A7358" />
          <Path d={FEDORA.dent} fill="none" strokeWidth={1.4} />
          <Ellipse {...FEDORA.brim} fill="#7A6548" />
          <Path d={FEDORA.band} fill="#3E2C21" strokeWidth={1.2} />
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

/** What a bust wears over its shirt: the trench coat's lapels, or a manager's signature item (the shop badge draws the same ones). */
function BustGear({ L }: { L: Look }) {
  if (L.coat === 'trench') {
    return (
      <G>
        <Path d="M43 73 L57 73 L50 92 Z" fill="#F4F1EC" stroke={INK} strokeWidth={1.4} strokeLinejoin="round" />
        <Path d="M47 76 L53 76 L54.5 94 L50 98 L45.5 94 Z" fill="#6B3A22" stroke={INK} strokeWidth={1.2} strokeLinejoin="round" />
        <Path d="M43 73 L50 94 L38 99 L27 80 Z M57 73 L50 94 L62 99 L73 80 Z" fill="#A98557" stroke={INK} strokeWidth={1.6} strokeLinejoin="round" />
      </G>
    );
  }
  switch (L.gear) {
    case 'whistle':
      // Deb: a red lanyard and a big silver whistle on a cream blouse
      return (
        <G>
          <Path d="M43 73 L57 73 L50 88 Z" fill="#F4F1EC" stroke={INK} strokeWidth={1.2} strokeLinejoin="round" />
          <Path d="M38 74 L50 90 L62 74" stroke="#E8432E" strokeWidth={2.2} fill="none" />
          <Rect x={45} y={88} width={11} height={7} rx={3} fill="#C9CED6" stroke={INK} strokeWidth={1.4} />
          <Circle cx={48.2} cy={91.5} r={1.3} fill={INK} />
        </G>
      );
    case 'purser-cap':
      // Skip: a cream shirt, a dark tie and a column of brass buttons down a grey jacket
      return (
        <G>
          <Path d="M43 73 L57 73 L50 90 Z" fill="#F4F1EC" stroke={INK} strokeWidth={1.2} strokeLinejoin="round" />
          <Path d="M47.5 76 L52.5 76 L53.5 90 L50 94 L46.5 90 Z" fill="#1F2D46" stroke={INK} strokeWidth={1} />
          <G fill="#F2C94C" stroke={INK} strokeWidth={0.8}>
            {[96, 91.5].map((y) => (
              <Circle key={y} cx={50} cy={y} r={1.9} />
            ))}
            <Circle cx={36} cy={86} r={1.9} />
            <Circle cx={64} cy={86} r={1.9} />
          </G>
        </G>
      );
    case 'stopwatch':
      // Noor: a stopwatch on a lanyard
      return (
        <G>
          <Path d="M42 74 L47 87 M58 74 L53 87" stroke="#D9443A" strokeWidth={2} fill="none" />
          <Rect x={48} y={84} width={4} height={3} fill="#C9CED6" stroke={INK} strokeWidth={1} />
          <Circle cx={50} cy={93.5} r={7.5} fill="#F4F1EC" stroke={INK} strokeWidth={1.8} />
          <Path d="M50 93.5 V88.6 M50 93.5 L53.6 95.4" stroke={INK} strokeWidth={1.4} fill="none" strokeLinecap="round" />
        </G>
      );
    case 'armband':
      // Dee: a hi-vis vest (a silver tape across the chest) and the steward's red armband on the shoulder
      return (
        <G>
          <Path d="M19.5 90 H80.5 V94 H19.5 Z" fill="#E9EDF0" stroke={INK} strokeWidth={0.8} />
          <Path d="M42 73.5 L50 88 L58 73.5" fill="#26354F" stroke={INK} strokeWidth={1.2} strokeLinejoin="round" />
          <Path d="M66 75.5 L76 79 L78.5 89 L68 85 Z" fill="#D9443A" stroke={INK} strokeWidth={1.4} strokeLinejoin="round" />
          <Path d="M67.6 79.6 L77.2 83.6" stroke="#FFFFFF" strokeWidth={1.6} />
        </G>
      );
    case 'napkin':
      // Anton: a black waistcoat over a white shirt, a bow tie and a white napkin over the forearm (here, the shoulder)
      return (
        <G>
          <Path d="M36 76 L50 98 L64 76 L69 100 L31 100 Z" fill="#1E1E24" stroke={INK} strokeWidth={1.4} strokeLinejoin="round" />
          <Path d="M50 76.5 L42.5 72.5 L42.5 80.5 Z M50 76.5 L57.5 72.5 L57.5 80.5 Z" fill="#B52C1C" stroke={INK} strokeWidth={1} strokeLinejoin="round" />
          <Path d="M20 81 L34 76 L36.5 87 L22.5 92 Z" fill="#FFFFFF" stroke={INK} strokeWidth={1.4} strokeLinejoin="round" />
          <Path d="M21 86.5 L35.2 81.5" stroke="#C9CED6" strokeWidth={1.2} />
        </G>
      );
    default:
      return null;
  }
}

function Bust({ L, mood, size, flip }: { L: Look; mood: Mood; size: number; flip: boolean }) {
  return (
    <Svg width={size} height={size} viewBox="0 0 100 100" style={flip ? { transform: [{ scaleX: -1 }] } : undefined}>
      <HairBack style={L.hairStyle} hair={L.hair} />
      {/* body */}
      <Path d="M18 100 Q20 74 50 72 Q80 74 82 100 Z" fill={L.shirt} stroke={INK} strokeWidth={1.8} />
      <Path d="M62 74 Q80 76 82 100 L64 100 Q66 84 62 74 Z" fill="#000" opacity={0.14} />
      <Path d="M26 86 Q30 78 40 75" stroke="#fff" strokeWidth={3} opacity={0.22} fill="none" strokeLinecap="round" />
      <BustGear L={L} />
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
      {L.foam && <FoamWedge />}
      <Ellipse cx={50} cy={50} rx={24} ry={25} fill={L.skin} stroke={INK} strokeWidth={1.8} />
      <Path d="M62 29 A24 25 0 0 1 60 72.5 Q71 52 62 29 Z" fill="#000" opacity={0.08} />
      <Ellipse cx={40} cy={36} rx={7} ry={4.5} fill="#fff" opacity={0.22} transform="rotate(-20 40 36)" />
      <Ellipse cx={26.5} cy={52} rx={4} ry={6} fill={L.skin} stroke={INK} strokeWidth={2} />
      <Ellipse cx={73.5} cy={52} rx={4} ry={6} fill={L.skin} stroke={INK} strokeWidth={2} />
      {!L.foam && <HairFront style={L.hairStyle} hair={L.hair} />}
      {L.gear === 'stopwatch' && <Pencils />}
      <Face mood={mood} />
      {L.extra === 'glasses' && <Glasses stage={false} />}
      {L.extra === 'mustache' && <Mustache hair={L.hair} />}
      {L.marker && <MarkerMustache />}
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
    case 'mr-smith':
    case 'todd-coat':
      // a tan trench coat: a cream shirt and a dark tie between two wide lapels, a belt with a brass buckle
      return (
        <G>
          <Path d={OUTFIT.suitV} fill={tone('#F4F1EC')} {...thin} />
          <Path d={OUTFIT.tie} fill={tone('#6B3A22')} {...thin} strokeWidth={1.3} />
          <Path d={OUTFIT.trenchLapels} fill={tone('#A98557')} {...thin} />
          <Path d={OUTFIT.trenchBelt} fill={tone('#7A5632')} {...thin} />
          <Path d={OUTFIT.trenchSeam} stroke={INK} strokeWidth={1.2} fill="none" />
          <Path d={OUTFIT.trenchBuckle} fill={tone('#F2C94C')} {...thin} strokeWidth={1.2} />
        </G>
      );
    case 'deb':
      // a cream blouse, the whistle Dale gave her on a red lanyard
      return (
        <G>
          <Path d={OUTFIT.shirtV} fill={tone('#F4F1EC')} {...thin} />
          <Path d={OUTFIT.lanyard} stroke={tone('#E8432E')} strokeWidth={2.4} fill="none" />
          <Path d={OUTFIT.whistle} fill={tone('#C9CED6')} {...thin} strokeWidth={1.3} />
        </G>
      );
    case 'skip':
      // a grey purser's jacket: cream shirt, dark tie, a column of brass buttons
      return (
        <G>
          <Path d={OUTFIT.suitV} fill={tone('#F4F1EC')} {...thin} />
          <Path d={OUTFIT.tie} fill={tone('#1F2D46')} {...thin} strokeWidth={1.3} />
          <Path d={OUTFIT.lapels} fill={tone(shade(shirt, -0.22))} {...thin} />
          <Path d={OUTFIT.brassColumn} fill={tone('#F2C94C')} stroke={INK} strokeWidth={0.9} />
        </G>
      );
    case 'noor':
      // a mustard cardigan, the stopwatch on its red lanyard
      return (
        <G>
          <Path d={OUTFIT.teeStrip} fill={tone('#F4F1EC')} {...thin} />
          <Path d={OUTFIT.watchCord} stroke={tone('#D9443A')} strokeWidth={2.2} fill="none" />
          <Path d={OUTFIT.watchCrown} fill={tone('#C9CED6')} {...thin} strokeWidth={1.2} />
          <Path d={OUTFIT.watchBody} fill={tone('#F4F1EC')} stroke={INK} strokeWidth={2} />
          <Path d={OUTFIT.watchHands} stroke={INK} strokeWidth={1.6} fill="none" strokeLinecap="round" />
        </G>
      );
    case 'dee':
      // a hi-vis vest over a navy shirt, with the silver tape
      return (
        <G>
          <Path d={OUTFIT.shirtV} fill={tone('#26354F')} {...thin} />
          <Path d={OUTFIT.vestStripes} fill={tone('#E9EDF0')} stroke={INK} strokeWidth={1} />
        </G>
      );
    case 'anton':
      // a black waistcoat and bow tie over a white shirt
      return (
        <G>
          <Path d={OUTFIT.waistcoat} fill={tone('#1E1E24')} {...thin} />
          <Path d={OUTFIT.waistcoatButtons} fill={tone('#C9CED6')} />
          <Path d={OUTFIT.bowTie} fill={tone('#B52C1C')} {...thin} strokeWidth={1.2} />
          <Path d={OUTFIT.bowKnot} fill={tone('#8E2A1E')} stroke={INK} strokeWidth={1} />
        </G>
      );
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

/** Dee's armband and Anton's napkin sit on the left arm, over the sleeve (so drawn after it), at the spot the pose's arm passes through. */
function ArmWear({ gear, pose, tone }: { gear: ManagerItem | undefined; pose: Pose; tone: (c: string) => string }) {
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
function HeldClipboard() {
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
          {!L.foam && STRANDS[L.hairStyle] ? <Path d={STRANDS[L.hairStyle]} stroke={strandColor(hair)} strokeWidth={1.3} fill="none" strokeLinecap="round" /> : null}
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
