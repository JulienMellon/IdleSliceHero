// Placeholder character art: flat, cartoony SVG busts with mood-driven faces.
import Svg, { Circle, Ellipse, G, Path, Rect } from 'react-native-svg';

import type { CharacterId, Mood } from '../content/types';

interface Look {
  skin: string;
  hair: string;
  shirt: string;
  hairStyle: 'bun' | 'short' | 'long' | 'bald' | 'slick' | 'bob';
  hat?: 'captain' | 'hardhat' | 'cap' | 'beret';
  extra?: 'glasses' | 'mustache' | 'apron' | 'beard' | 'pearls' | 'whistle' | 'tie';
}

export const LOOKS: Record<CharacterId, Look> = {
  'nonna-rosa': { skin: '#F2C9A0', hair: '#E8E4E0', shirt: '#B23A48', hairStyle: 'bun', extra: 'apron' },
  dale: { skin: '#F5D0B0', hair: '#7A4A26', shirt: '#2F80ED', hairStyle: 'short', hat: 'cap', extra: 'whistle' },
  marisol: { skin: '#C98F63', hair: '#F4F1EC', shirt: '#1F4E79', hairStyle: 'long', hat: 'captain' },
  priya: { skin: '#B07A52', hair: '#1E1414', shirt: '#9B51E0', hairStyle: 'long', extra: 'glasses' },
  'big-sal': { skin: '#E8B88E', hair: '#4A3A33', shirt: '#E67E22', hairStyle: 'bald', hat: 'hardhat', extra: 'mustache' },
  genevieve: { skin: '#F6DCC8', hair: '#222222', shirt: '#111111', hairStyle: 'bob', hat: 'beret', extra: 'pearls' },
  'victor-crust': { skin: '#E9C4A6', hair: '#1A1A1A', shirt: '#2C2C3A', hairStyle: 'slick', extra: 'tie' },
  'megaslice-rep': { skin: '#F0C8A8', hair: '#C2A15A', shirt: '#7B2CBF', hairStyle: 'slick', extra: 'tie' },
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

export function Portrait({ id, mood = 'neutral', size = 120, flip = false }: { id: CharacterId; mood?: Mood; size?: number; flip?: boolean }) {
  const L = LOOKS[id];
  return (
    <Svg width={size} height={size} viewBox="0 0 100 100" style={flip ? { transform: [{ scaleX: -1 }] } : undefined}>
      {/* back hair */}
      {L.hairStyle === 'long' && <Path d="M24 44 Q22 82 34 90 L66 90 Q78 82 76 44 Z" fill={L.hair} />}
      {L.hairStyle === 'bob' && <Path d="M26 42 Q24 70 32 72 L68 72 Q76 70 74 42 Z" fill={L.hair} />}
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
      {/* front hair */}
      {L.hairStyle === 'bun' && (
        <G fill={L.hair} stroke={INK} strokeWidth={2}>
          <Circle cx={50} cy={20} r={10} />
          <Path d="M26 46 Q26 24 50 24 Q74 24 74 46 Q66 32 50 32 Q34 32 26 46 Z" />
        </G>
      )}
      {(L.hairStyle === 'short' || L.hairStyle === 'long') && (
        <Path d="M26 46 Q24 22 50 22 Q76 22 74 46 Q70 34 56 32 Q46 38 30 38 Z" fill={L.hair} stroke={INK} strokeWidth={2} />
      )}
      {L.hairStyle === 'bob' && <Path d="M25 48 Q24 22 50 22 Q76 22 75 48 L70 40 Q50 30 30 40 Z" fill={L.hair} stroke={INK} strokeWidth={2} />}
      {L.hairStyle === 'slick' && <Path d="M27 42 Q28 22 52 23 Q74 24 73 42 Q66 30 40 32 Z" fill={L.hair} stroke={INK} strokeWidth={2} />}
      {/* tapered sideburns (critic D148) */}
      {L.hairStyle === 'bald' && (
        <G fill={L.hair} stroke={INK} strokeWidth={1}>
          <Path d="M26.5 40 Q29.5 38.5 30.5 42 L33 53 Q36 55.5 39 56 Q32 58.5 28.5 54 Q26.5 49 26.5 40 Z" />
          <Path d="M73.5 40 Q70.5 38.5 69.5 42 L67 53 Q64 55.5 61 56 Q68 58.5 71.5 54 Q73.5 49 73.5 40 Z" />
        </G>
      )}
      <Face mood={mood} />
      {L.extra === 'glasses' && (
        <G stroke={INK} strokeWidth={2.2} fill="rgba(255,255,255,0.25)">
          <Circle cx={42} cy={47} r={7} />
          <Circle cx={58} cy={47} r={7} />
          <Path d="M49 47 L51 47" />
        </G>
      )}
      {L.extra === 'mustache' && <Path d="M38 56 Q44 52 50 56 Q56 52 62 56 Q56 60 50 57 Q44 60 38 56 Z" fill={L.hair} stroke={INK} strokeWidth={1.4} />}
      {/* hats */}
      {L.hat === 'captain' && (
        <G stroke={INK} strokeWidth={2}>
          <Path d="M24 34 Q50 14 76 34 L72 38 L28 38 Z" fill="#FFFFFF" />
          <Rect x={26} y={36} width={48} height={6} rx={2} fill="#1F2A44" />
          <Circle cx={50} cy={30} r={3.5} fill="#F2C94C" />
        </G>
      )}
      {L.hat === 'hardhat' && (
        <G stroke={INK} strokeWidth={2}>
          <Path d="M27 36 Q28 16 50 16 Q72 16 73 36 Z" fill="#F2C94C" />
          <Rect x={22} y={34} width={56} height={6} rx={3} fill="#F2C94C" />
        </G>
      )}
      {L.hat === 'cap' && (
        <G stroke={INK} strokeWidth={2}>
          <Path d="M27 36 Q28 18 50 18 Q72 18 73 36 Z" fill="#E8432E" />
          <Path d="M50 36 L84 36 Q84 41 72 41 L50 41 Z" fill="#E8432E" />
        </G>
      )}
      {L.hat === 'beret' && <Ellipse cx={46} cy={24} rx={22} ry={8} fill="#B52C1C" stroke={INK} strokeWidth={2} transform="rotate(-10 46 24)" />}
    </Svg>
  );
}
