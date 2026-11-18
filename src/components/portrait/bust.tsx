// The bust: the small head-and-shoulders used by the coach card, title card, scrapbook and HUD.
import Svg, { Circle, Ellipse, G, Path, Rect } from 'react-native-svg';

import type { Mood } from '../../content/types';
import { Face } from './face';
import { HairBack, HairFront } from './hair';
import { FoamWedge, Glasses, Hat, MarkerMustache, Mustache, Pencils } from './hats';
import { INK } from './ink';
import type { Look } from './look-data';

/** What a bust wears over its shirt: the trench coat's lapels, or a manager's signature item (the shop badge draws the same ones). */
export function BustGear({ L }: { L: Look }) {
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

export function Bust({ L, mood, size, flip }: { L: Look; mood: Mood; size: number; flip: boolean }) {
  return (
    <Svg
      accessibilityElementsHidden
      importantForAccessibility="no-hide-descendants"
      width={size}
      height={size}
      viewBox="0 0 100 100"
      style={flip ? { transform: [{ scaleX: -1 }] } : undefined}
    >
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
