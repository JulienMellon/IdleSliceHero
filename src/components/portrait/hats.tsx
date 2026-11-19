// Head gear and face furniture (100-box head coordinates; the stage figure shifts them by HEAD_SHIFT): hats, glasses, mustaches, pencils, Slicey's foam wedge.
import { Circle, Ellipse, G, Path, Rect } from 'react-native-svg';

import { FEDORA, MARKER_MUSTACHE, SLICEY } from '../cutscene/figure-art';
import { INK } from './ink';
import type { Look } from './look-data';

export function Glasses({ stage }: { stage: boolean }) {
  return (
    <G stroke={INK} strokeWidth={2.2} fill={stage ? 'rgba(255,255,255,0.18)' : 'rgba(255,255,255,0.25)'}>
      <Path d="M35 47a7 7 0 1 0 14 0a7 7 0 1 0 -14 0Z M51 47a7 7 0 1 0 14 0a7 7 0 1 0 -14 0Z M49 47 L51 47" />
    </G>
  );
}

export function Mustache({ hair }: { hair: string }) {
  return <Path d="M38 56 Q44 52 50 56 Q56 52 62 56 Q56 60 50 57 Q44 60 38 56 Z" fill={hair} stroke={INK} strokeWidth={1.4} />;
}

/** Mr. Smith's mustache: one uneven marker stroke, off-centre, so it reads as drawn on. */
export function MarkerMustache() {
  return (
    <G fill="none" strokeLinecap="round" strokeLinejoin="round">
      <Path d={MARKER_MUSTACHE.stroke} stroke="#14100E" strokeWidth={MARKER_MUSTACHE.width} />
      <Path d={MARKER_MUSTACHE.tail} stroke="#14100E" strokeWidth={MARKER_MUSTACHE.width * 0.8} />
    </G>
  );
}

/** Noor's pencils, stuck through her bun. */
export function Pencils() {
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
export function FoamWedge() {
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

export function Hat({ hat, stage }: { hat: NonNullable<Look['hat']>; stage: boolean }) {
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
