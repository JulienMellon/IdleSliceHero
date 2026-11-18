// The bust's face: eyes, brows, blush and mouth per mood.
import { Circle, Ellipse, G, Path } from 'react-native-svg';

import type { Mood } from '../../content/types';
import { INK } from './ink';

export function Face({ mood }: { mood: Mood }) {
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
