// A station head's face (D345): a small bust with a role hat, so Finn, Gus and Coral are people, not an icon.
// Drawn at the origin, `size` units across. Looks are seeded from the head's name: the same face everywhere.
// A General Manager's id (`deb`, `skip`, `noor`, `dee`, `anton`) is not seeded: it draws that manager's fixed look (scene/looks.ts
// MANAGER_LOOKS: the same hair, shirt and signature item as the cut-scene portrait).
import { memo } from 'react';
import { Circle, G, Path, Rect } from 'react-native-svg';

import type { HeadKind } from '../../content/tuning';
import { MANAGER_LOOKS, isManagerId, type ManagerLook } from './looks';
import { INK } from './projection';

const SKIN = ['#F2C9A0', '#E0A877', '#C68B59', '#9C6B43', '#7A4E2D', '#FAD9BC'];
const HAIR = ['#3B2416', '#6B3E22', '#C98B3C', '#1E1E1E', '#8A8A8A', '#B5462E'];
const seed = (name: string) => Array.from(name).reduce((h, ch) => (h * 31 + ch.charCodeAt(0)) >>> 0, 7);

/** A manager's hair, over the plain skull cap every face has: Deb's curls, a bun for Noor, Dee's quiff. */
const HAIR_TOP: Record<ManagerLook['hairStyle'], string> = {
  perm: 'M-12 -1 Q-15 -7 -11 -10 Q-9 -17 -3 -14 Q0 -18 4 -14 Q10 -17 11 -10 Q15 -7 12 -1 Q8 -7 0 -7 Q-8 -7 -12 -1 Z',
  crew: 'M-11 -2 Q-12 -12 0 -12 Q12 -12 11 -2 Q8 -7 0 -7 Q-8 -7 -11 -2 Z',
  bun: 'M-11 -2 Q-12 -12 0 -12 Q12 -12 11 -2 Q8 -7 0 -7 Q-8 -7 -11 -2 Z',
  crop: 'M-11 -2 Q-12 -11 -4 -12 Q-1 -17 5 -13 Q12 -11 11 -2 Q8 -7 0 -6 Q-8 -7 -11 -2 Z',
  slick: 'M-11 -2 Q-11 -12 1 -12 Q12 -11 11 -2 Q5 -9 -6 -7 Q-9 -5 -11 -2 Z',
};

/** The signature item on the shoulders (drawn before the head): Deb's whistle, Noor's stopwatch, Dee's armband, Anton's vest and napkin. */
function ManagerBody({ look }: { look: ManagerLook }) {
  switch (look.item) {
    case 'whistle':
      return (
        <G>
          <Path d="M-6 9.5 L0 17 L6 9.5" stroke="#E8432E" strokeWidth={1.4} fill="none" />
          <Rect x={-2.6} y={15.6} width={6} height={3.6} rx={1.4} fill="#C9CED6" stroke={INK} strokeWidth={0.9} />
        </G>
      );
    case 'stopwatch':
      return (
        <G>
          <Path d="M-5 9.5 L-2 15 M5 9.5 L2 15" stroke="#D9443A" strokeWidth={1.2} />
          <Circle cx={0} cy={17} r={3.4} fill="#F4F1EC" stroke={INK} strokeWidth={1.1} />
          <Path d="M0 17 V14.6 M0 17 L1.8 18" stroke={INK} strokeWidth={0.8} strokeLinecap="round" />
        </G>
      );
    case 'armband':
      return (
        <G>
          <Path d="M-15 16.5 H15 V18.8 H-15 Z" fill="#E9EDF0" />
          <Path d="M9 10.5 L14 13.5 L13.4 18 L8.4 15 Z" fill="#D9443A" stroke={INK} strokeWidth={0.9} strokeLinejoin="round" />
        </G>
      );
    case 'napkin':
      return (
        <G>
          <Path d="M-6 9.5 L0 18 L6 9.5 L8.5 20 L-8.5 20 Z" fill="#1E1E24" stroke={INK} strokeWidth={0.9} strokeLinejoin="round" />
          <Path d="M-15 12 L-8 9.8 L-6.6 17.4 L-14.2 19.6 Z" fill="#FFFFFF" stroke={INK} strokeWidth={1} strokeLinejoin="round" />
          <Path d="M-14.4 16 L-7.2 13.8" stroke="#C9CED6" strokeWidth={0.8} />
        </G>
      );
  }
}

/** What sits on the hair (drawn after it): Skip's purser's cap with its brass badge, Noor's pencilled bun. */
function ManagerTop({ look }: { look: ManagerLook }) {
  if (look.item === 'purser-cap') {
    return (
      <G>
        <Path d="M-11.5 -4 Q-12 -15 0 -15 Q12 -15 11.5 -4 Z" fill="#1F2D46" stroke={INK} strokeWidth={1.2} />
        <Path d="M-10 -4.5 Q0 -2.2 10 -4.5 L10 -3.6 Q0 -1.2 -10 -3.6 Z" fill="#101827" stroke={INK} strokeWidth={0.9} />
        <Circle cx={0} cy={-9.6} r={2.4} fill="#F2C94C" stroke={INK} strokeWidth={0.8} />
      </G>
    );
  }
  if (look.item === 'stopwatch') {
    return (
      <G>
        <Path d="M-1.5 -15 L-9 -20 M1.5 -15 L9 -21" stroke={INK} strokeWidth={3} strokeLinecap="round" />
        <Path d="M-1.5 -15 L-9 -20 M1.5 -15 L9 -21" stroke="#F2C94C" strokeWidth={1.5} strokeLinecap="round" />
        <Circle cx={0} cy={-15} r={4.6} fill={look.hair} stroke={INK} strokeWidth={1.1} />
      </G>
    );
  }
  return null;
}

export const HeadFace = memo(function HeadFace({ kind, name, size }: { kind: HeadKind | 'gm'; name: string; size: number }) {
  const h = seed(name);
  const fixed = kind === 'gm' && isManagerId(name) ? MANAGER_LOOKS[name] : null;
  const skin = fixed ? fixed.skin : SKIN[h % SKIN.length];
  const hair = fixed ? fixed.hair : HAIR[(h >>> 4) % HAIR.length];
  const k = size / 40;
  return (
    <G transform={`scale(${k})`}>
      {/* shoulders in the role's colour */}
      <Path
        d="M-15 20 Q-15 9 0 9 Q15 9 15 20 Z"
        fill={fixed ? fixed.shirt : kind === 'oven' ? '#B23A48' : kind === 'counter' ? '#2E8B3E' : kind === 'gm' ? '#3B4A6B' : '#FFFFFF'}
        stroke={INK}
        strokeWidth={1.4}
      />
      {fixed && <ManagerBody look={fixed} />}
      <Circle cx={0} cy={-1} r={11} fill={skin} stroke={INK} strokeWidth={1.4} />
      {/* hair under the hat */}
      <Path
        d={fixed ? HAIR_TOP[fixed.hairStyle] : 'M-11 -2 Q-12 -12 0 -12 Q12 -12 11 -2 Q8 -7 0 -7 Q-8 -7 -11 -2 Z'}
        fill={hair}
        stroke={fixed ? INK : undefined}
        strokeWidth={fixed ? 0.8 : undefined}
      />
      {fixed && <ManagerTop look={fixed} />}
      <Circle cx={-4} cy={0} r={1.4} fill={INK} />
      <Circle cx={4} cy={0} r={1.4} fill={INK} />
      <Path d="M-4 5 Q0 8 4 5" stroke={INK} strokeWidth={1.3} fill="none" strokeLinecap="round" />
      <Circle cx={-7} cy={4} r={1.8} fill="#F08A7A" opacity={0.5} />
      <Circle cx={7} cy={4} r={1.8} fill="#F08A7A" opacity={0.5} />
      {kind === 'prep' && (
        // a tall white cook's cap
        <G>
          <Path d="M-9 -9 Q-13 -18 -6 -20 Q-3 -26 3 -22 Q10 -24 10 -16 Q13 -12 9 -9 Z" fill="#fff" stroke={INK} strokeWidth={1.2} />
          <Rect x={-9} y={-11} width={18} height={4} rx={1.5} fill="#fff" stroke={INK} strokeWidth={1.2} />
        </G>
      )}
      {kind === 'oven' && (
        // a red baker's bandana with a knot
        <G>
          <Path d="M-11 -5 Q-11 -14 0 -14 Q11 -14 11 -5 Q0 -9 -11 -5 Z" fill="#D9443A" stroke={INK} strokeWidth={1.2} />
          <Circle cx={-2} cy={-11} r={0.9} fill="#fff" />
          <Circle cx={4} cy={-10} r={0.9} fill="#fff" />
          <Path d="M10 -6 l5 -3 l-1 5 Z" fill="#D9443A" stroke={INK} strokeWidth={1} strokeLinejoin="round" />
        </G>
      )}
      {kind === 'counter' && (
        // a green cashier's visor
        <G>
          <Path d="M-11 -6 Q0 -11 11 -6 L11 -4 Q0 -8 -11 -4 Z" fill="#3FAE5A" stroke={INK} strokeWidth={1.2} />
          <Path d="M-2 -6 Q8 -7 15 -3 Q8 -2 -1 -4 Z" fill="#2E8B3E" stroke={INK} strokeWidth={1.1} />
        </G>
      )}
      {kind === 'gm' && !fixed && <Path d="M-4 9 L0 15 L4 9 Z" fill="#D9443A" stroke={INK} strokeWidth={1} />}
    </G>
  );
});
