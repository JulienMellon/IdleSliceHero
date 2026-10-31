// Small custom SVG icons where no emoji fits.
import Svg, { Circle, Path, Rect } from 'react-native-svg';

const INK = '#3B1F14';

/** Delivery driver: red cap, holding a pizza box. */
export function DriverIcon({ size = 40 }: { size?: number }) {
  return (
    <Svg width={size} height={size} viewBox="0 0 40 40">
      <Path d="M8 40 Q9 27 20 26 Q31 27 32 40 Z" fill="#E8432E" stroke={INK} strokeWidth={1.6} />
      <Circle cx={20} cy={17} r={8} fill="#F2C9A0" stroke={INK} strokeWidth={1.6} />
      <Path d="M11.5 14.5 Q12 7 20 7 Q28 7 28.5 14.5 Z" fill="#E8432E" stroke={INK} strokeWidth={1.6} />
      <Path d="M20 14 L33 14 Q33 16.5 28 16.5 L20 16.5 Z" fill="#B52C1C" stroke={INK} strokeWidth={1.2} />
      <Circle cx={17} cy={18} r={1.1} fill={INK} />
      <Circle cx={23} cy={18} r={1.1} fill={INK} />
      <Path d="M17 21.5 Q20 24 23 21.5" stroke={INK} strokeWidth={1.3} fill="none" strokeLinecap="round" />
      <Rect x={10} y={28} width={20} height={7} rx={1} fill="#F6E7C1" stroke={INK} strokeWidth={1.5} />
      <Circle cx={20} cy={31.5} r={2} fill="#E8432E" />
    </Svg>
  );
}

/** Chef hat (Prep). */
export function PrepIcon({ size = 20 }: { size?: number }) {
  return (
    <Svg width={size} height={size} viewBox="0 0 20 20">
      <Path d="M5 12 Q1.5 11 2.5 7.5 Q3.5 4.5 6.5 5.5 Q7.5 2 10 2 Q12.5 2 13.5 5.5 Q16.5 4.5 17.5 7.5 Q18.5 11 15 12 Z" fill="#FFFFFF" stroke={INK} strokeWidth={1.2} strokeLinejoin="round" />
      <Rect x={5} y={12} width={10} height={5} rx={1} fill="#F3ECE2" stroke={INK} strokeWidth={1.2} />
      <Path d="M8 12 V16 M12 12 V16" stroke={INK} strokeWidth={0.7} opacity={0.5} />
    </Svg>
  );
}

/** Flame (Ovens). */
export function FlameIcon({ size = 20 }: { size?: number }) {
  return (
    <Svg width={size} height={size} viewBox="0 0 20 20">
      <Path d="M10 1.5 Q15 6 15.5 10.5 Q16 17.5 10 18.5 Q4 17.5 4.5 11 Q5 7.5 7.5 6 Q7.5 9 9 10 Q8 5 10 1.5 Z" fill="#F2994A" stroke={INK} strokeWidth={1.2} strokeLinejoin="round" />
      <Path d="M10 9.5 Q13 12 12.6 14.6 Q12.2 17 10 17.2 Q7.8 17 7.6 14.8 Q7.6 12.6 10 9.5 Z" fill="#FFD166" />
    </Svg>
  );
}

/** Cash register (Counter). */
export function RegisterIcon({ size = 20 }: { size?: number }) {
  return (
    <Svg width={size} height={size} viewBox="0 0 20 20">
      <Rect x={5} y={2.5} width={10} height={5} rx={1} fill="#2B2F35" stroke={INK} strokeWidth={1.1} />
      <Rect x={6.5} y={3.8} width={7} height={2.4} rx={0.5} fill="#7FE0A0" />
      <Path d="M3 17.5 L4.5 9 L15.5 9 L17 17.5 Z" fill="#5C6470" stroke={INK} strokeWidth={1.2} strokeLinejoin="round" />
      <Path d="M6.5 11.5 H8 M9.3 11.5 H10.8 M12 11.5 H13.5 M6.2 13.8 H7.7 M9.3 13.8 H10.8 M12.3 13.8 H13.8" stroke="#E9E4DC" strokeWidth={1.3} strokeLinecap="round" />
      <Rect x={2.5} y={16} width={15} height={2.5} rx={0.8} fill="#3A3F46" stroke={INK} strokeWidth={1} />
    </Svg>
  );
}

/** Chair (Seating). */
export function SeatIcon({ size = 20 }: { size?: number }) {
  return (
    <Svg width={size} height={size} viewBox="0 0 20 20">
      <Rect x={5} y={2} width={10} height={9} rx={2} fill="#D9443A" stroke={INK} strokeWidth={1.2} />
      <Rect x={4} y={10} width={12} height={3.5} rx={1.2} fill="#B23A30" stroke={INK} strokeWidth={1.2} />
      <Path d="M5.5 13.5 L5 18.5 M14.5 13.5 L15 18.5" stroke={INK} strokeWidth={1.6} strokeLinecap="round" />
    </Svg>
  );
}

/** Sparkle (oven Grade). */
export function SparkleIcon({ size = 20 }: { size?: number }) {
  return (
    <Svg width={size} height={size} viewBox="0 0 20 20">
      <Path d="M9 1.5 L10.8 7.2 L16.5 9 L10.8 10.8 L9 16.5 L7.2 10.8 L1.5 9 L7.2 7.2 Z" fill="#FFC531" stroke={INK} strokeWidth={1.1} strokeLinejoin="round" />
      <Path d="M15.5 13 L16.3 15.2 L18.5 16 L16.3 16.8 L15.5 19 L14.7 16.8 L12.5 16 L14.7 15.2 Z" fill="#FFE08A" stroke={INK} strokeWidth={0.8} strokeLinejoin="round" />
    </Svg>
  );
}

/** Brick wall with an arrow (Expand). */
export function ExpandIcon({ size = 20 }: { size?: number }) {
  return (
    <Svg width={size} height={size} viewBox="0 0 20 20">
      <Rect x={2} y={8} width={16} height={10} rx={1} fill="#C8643E" stroke={INK} strokeWidth={1.2} />
      <Path d="M2 13 H18 M7 8 V13 M13 8 V13 M10 13 V18" stroke="#7A3520" strokeWidth={0.9} />
      <Path d="M5 5 H15 M12.5 2.5 L15 5 L12.5 7.5 M7.5 2.5 L5 5 L7.5 7.5" stroke={INK} strokeWidth={1.4} fill="none" strokeLinecap="round" strokeLinejoin="round" />
    </Svg>
  );
}

/** Scooter with a pizza box (Fleet). */
export function ScooterIcon({ size = 20 }: { size?: number }) {
  return (
    <Svg width={size} height={size} viewBox="0 0 20 20">
      <Circle cx={4.5} cy={15} r={2.8} fill="#333" stroke={INK} strokeWidth={1} />
      <Circle cx={15.5} cy={15} r={2.8} fill="#333" stroke={INK} strokeWidth={1} />
      <Path d="M3 13 Q3 9 7 9 L11 9 L13 13 Z" fill="#FFC531" stroke={INK} strokeWidth={1.1} strokeLinejoin="round" />
      <Path d="M12 9 L14.5 4 M13 4 H16.5 M13 13 L15.5 15" stroke={INK} strokeWidth={1.4} strokeLinecap="round" />
      <Rect x={2} y={4} width={7} height={5} rx={0.8} fill="#E8432E" stroke={INK} strokeWidth={1} />
    </Svg>
  );
}

/** Manager with a clipboard. */
export function ManagerIcon({ size = 20 }: { size?: number }) {
  return (
    <Svg width={size} height={size} viewBox="0 0 20 20">
      <Path d="M3 19 Q3.5 12.5 10 12.5 Q16.5 12.5 17 19 Z" fill="#3F7FB0" stroke={INK} strokeWidth={1.1} />
      <Path d="M8.5 12.7 L10 16 L11.5 12.7" fill="#fff" stroke={INK} strokeWidth={0.7} />
      <Circle cx={10} cy={7.5} r={4.5} fill="#F2C9A0" stroke={INK} strokeWidth={1.1} />
      <Path d="M5.5 7 Q5.5 2.5 10 2.5 Q14.5 2.5 14.5 7 Q12 5 7 6 Z" fill="#4A2C1D" />
      <Rect x={12.5} y={13} width={5} height={6} rx={0.8} fill="#F6E7C1" stroke={INK} strokeWidth={0.9} />
    </Svg>
  );
}

/** Decor icons. */
export function DecorIcon({ kind, size = 20 }: { kind: 'plants' | 'flooring' | 'tables' | 'walls' | 'signage'; size?: number }) {
  return (
    <Svg width={size} height={size} viewBox="0 0 20 20">
      {kind === 'plants' && (
        <>
          <Path d="M10 11 Q4 10 3.5 4 Q9 4.5 10 11 Z M10 11 Q16 10 16.5 4 Q11 4.5 10 11 Z M10 11 Q8.5 5 10 1.5 Q11.5 5 10 11 Z" fill="#4FA048" stroke={INK} strokeWidth={1} strokeLinejoin="round" />
          <Path d="M5.5 11 H14.5 L13 18.5 H7 Z" fill="#C2693E" stroke={INK} strokeWidth={1.1} strokeLinejoin="round" />
        </>
      )}
      {kind === 'flooring' && (
        <>
          <Path d="M1.5 17.5 L5 6 H15 L18.5 17.5 Z" fill="#F4EFE6" stroke={INK} strokeWidth={1.1} strokeLinejoin="round" />
          <Path d="M5 6 L6.8 11.8 H10 L10 6 Z M10 11.8 L13.2 11.8 L15 17.5 L10 17.5 Z M1.5 17.5 L3.3 11.8 L6.8 11.8 L6 17.5" fill="#C8463A" />
        </>
      )}
      {kind === 'tables' && (
        <>
          <Path d="M10 9 V17.5 M6 18 H14" stroke={INK} strokeWidth={1.6} strokeLinecap="round" />
          <Path d="M2 7.5 Q10 11 18 7.5 Q10 4.5 2 7.5 Z" fill="#fff" stroke={INK} strokeWidth={1.1} />
          <Path d="M7.5 7.2 Q10 8.6 12.5 7.2 Q10 6 7.5 7.2 Z" fill="#FFC531" />
          <Rect x={13.5} y={2} width={1.6} height={4} fill="#FFF8E7" stroke={INK} strokeWidth={0.5} />
        </>
      )}
      {kind === 'walls' && (
        <>
          <Rect x={2} y={3} width={16} height={14} rx={1} fill="#C98F63" stroke={INK} strokeWidth={1.1} />
          <Rect x={4} y={5} width={12} height={10} fill="#9ED2F0" />
          <Path d="M4 12 Q8 8 11 11.5 Q13.5 9.5 16 11 V15 H4 Z" fill="#7DBB5E" />
          <Circle cx={13} cy={7.5} r={1.5} fill="#FFD866" />
        </>
      )}
      {kind === 'signage' && (
        <>
          <Path d="M7 2 L10 5 L13 2" stroke={INK} strokeWidth={1.1} fill="none" />
          <Rect x={1.5} y={5} width={17} height={9} rx={2} fill="#D9443A" stroke={INK} strokeWidth={1.2} />
          {[4.5, 8.2, 11.8, 15.5].map((x) => <Circle key={x} cx={x} cy={9.5} r={1.3} fill="#FFF3B0" />)}
          <Path d="M5 14 V18.5 M15 14 V18.5" stroke={INK} strokeWidth={1.4} />
        </>
      )}
    </Svg>
  );
}

/** Storybook (Scrapbook button). */
export function BookIcon({ size = 30 }: { size?: number }) {
  return (
    <Svg width={size} height={size} viewBox="0 0 30 30">
      <Path d="M3 7 Q9 4.5 15 7.5 Q21 4.5 27 7 V24 Q21 21.5 15 24.5 Q9 21.5 3 24 Z" fill="#FFF4E0" stroke={INK} strokeWidth={1.8} strokeLinejoin="round" />
      <Path d="M15 7.5 V24.5" stroke={INK} strokeWidth={1.6} />
      <Path d="M6 10.5 Q9.5 9 12.5 10.5 M6 14 Q9.5 12.5 12.5 14 M17.5 10.5 Q20.5 9 24 10.5 M17.5 14 Q20.5 12.5 24 14" stroke="#C9B79E" strokeWidth={1.4} fill="none" strokeLinecap="round" />
      <Path d="M20 17 L22 21 L24 17 Z" fill="#E8432E" />
      <Path d="M3 24 Q9 21.5 15 24.5 Q21 21.5 27 24 V26 Q21 23.5 15 26.5 Q9 23.5 3 26 Z" fill="#E8432E" stroke={INK} strokeWidth={1.4} strokeLinejoin="round" />
    </Svg>
  );
}

/** Folded city map (City button). */
export function MapIcon({ size = 30 }: { size?: number }) {
  return (
    <Svg width={size} height={size} viewBox="0 0 30 30">
      <Path d="M3 7 L10 4.5 L20 7.5 L27 5 V23 L20 25.5 L10 22.5 L3 25 Z" fill="#BFE3A6" stroke={INK} strokeWidth={1.8} strokeLinejoin="round" />
      <Path d="M10 4.5 V22.5 M20 7.5 V25.5" stroke={INK} strokeWidth={1.2} />
      <Path d="M20 7.5 L27 5 V23 L20 25.5 Z" fill="#7CC8EE" opacity={0.85} />
      <Path d="M3 15 Q8 13 12 16 T20 15" stroke="#FFF4E0" strokeWidth={1.8} fill="none" strokeLinecap="round" strokeDasharray="2 1.6" />
      <Path d="M15 9 Q12 9 12 12 Q12 14 15 17.5 Q18 14 18 12 Q18 9 15 9 Z" fill="#E8432E" stroke={INK} strokeWidth={1.1} />
      <Circle cx={15} cy={12} r={1.2} fill="#fff" />
    </Svg>
  );
}

/** Padlock. */
export function LockIcon({ size = 16, color = '#FFF4E0' }: { size?: number; color?: string }) {
  return (
    <Svg width={size} height={size} viewBox="0 0 16 16">
      <Path d="M4.5 7 V5 Q4.5 1.5 8 1.5 Q11.5 1.5 11.5 5 V7" stroke={INK} strokeWidth={1.6} fill="none" />
      <Rect x={2.5} y={6.5} width={11} height={8} rx={2} fill={color} stroke={INK} strokeWidth={1.3} />
      <Circle cx={8} cy={10} r={1.3} fill={INK} />
      <Path d="M8 10 V12.5" stroke={INK} strokeWidth={1.2} strokeLinecap="round" />
    </Svg>
  );
}

/** Trophy. */
export function TrophyIcon({ size = 20 }: { size?: number }) {
  return (
    <Svg width={size} height={size} viewBox="0 0 20 20">
      <Path d="M5 4 Q1.5 4 2 7.5 Q2.5 10 6 10.5 M15 4 Q18.5 4 18 7.5 Q17.5 10 14 10.5" stroke={INK} strokeWidth={1.3} fill="none" />
      <Path d="M5 2.5 H15 V7 Q15 12 10 12.5 Q5 12 5 7 Z" fill="#FFC531" stroke={INK} strokeWidth={1.3} strokeLinejoin="round" />
      <Path d="M7.2 4.5 V7.5" stroke="#fff" strokeWidth={1.3} strokeLinecap="round" opacity={0.7} />
      <Rect x={8.6} y={12.5} width={2.8} height={2.8} fill="#E0A100" stroke={INK} strokeWidth={0.9} />
      <Rect x={5.5} y={15.3} width={9} height={3} rx={0.8} fill="#8E5A3C" stroke={INK} strokeWidth={1.1} />
    </Svg>
  );
}

/** Pizza slice. */
export function SliceIcon({ size = 20 }: { size?: number }) {
  return (
    <Svg width={size} height={size} viewBox="0 0 20 20">
      <Path d="M2.5 4 Q10 0.5 17.5 4 L10 18.5 Z" fill="#FFC531" stroke={INK} strokeWidth={1.3} strokeLinejoin="round" />
      <Path d="M2.5 4 Q10 0.5 17.5 4 L16.6 5.8 Q10 2.6 3.4 5.8 Z" fill="#E9A64B" stroke={INK} strokeWidth={0.9} strokeLinejoin="round" />
      <Circle cx={8} cy={8} r={1.6} fill="#E8432E" />
      <Circle cx={12.5} cy={8.6} r={1.5} fill="#E8432E" />
      <Circle cx={10.2} cy={12.5} r={1.4} fill="#E8432E" />
    </Svg>
  );
}

/** Gold coin. */
export function CoinIcon({ size = 20 }: { size?: number }) {
  return (
    <Svg width={size} height={size} viewBox="0 0 20 20">
      <Circle cx={10} cy={10} r={8} fill="#FFC531" stroke={INK} strokeWidth={1.3} />
      <Circle cx={10} cy={10} r={5.5} fill="none" stroke="#E0A100" strokeWidth={1.2} />
      <Path d="M10 6.5 V13.5 M12 8 Q10 6.8 8.4 8 Q7.6 9.5 10 10 Q12.4 10.5 11.6 12 Q10 13.2 8 12" stroke="#B57E00" strokeWidth={1.2} fill="none" strokeLinecap="round" />
    </Svg>
  );
}

/** Star. */
export function StarIcon({ size = 20 }: { size?: number }) {
  return (
    <Svg width={size} height={size} viewBox="0 0 20 20">
      <Path d="M10 1.8 L12.4 7 L18 7.6 L13.8 11.4 L15 17 L10 14.1 L5 17 L6.2 11.4 L2 7.6 L7.6 7 Z" fill="#FFE08A" stroke={INK} strokeWidth={1.2} strokeLinejoin="round" />
    </Svg>
  );
}

/** Speed lines (offline popup). */
export function WhooshIcon({ size = 30 }: { size?: number }) {
  return (
    <Svg width={size} height={size} viewBox="0 0 30 30">
      <Path d="M4 10 H22 M2 15 H26 M6 20 H20" stroke="#9BC8E6" strokeWidth={3} strokeLinecap="round" />
    </Svg>
  );
}

/** Clipboard with a ticked list (Tasks button). */
export function ClipboardIcon({ size = 30 }: { size?: number }) {
  return (
    <Svg width={size} height={size} viewBox="0 0 30 30">
      <Rect x={5} y={5} width={20} height={22} rx={3} fill="#FFF4E0" stroke={INK} strokeWidth={1.8} />
      <Rect x={10} y={2.5} width={10} height={5.5} rx={2} fill="#C9B79E" stroke={INK} strokeWidth={1.6} />
      <Path d="M8.5 13 L10 14.6 L12.8 11.6" stroke="#3FAE5A" strokeWidth={1.9} fill="none" strokeLinecap="round" strokeLinejoin="round" />
      <Path d="M15 13 H22" stroke="#C9B79E" strokeWidth={1.8} strokeLinecap="round" />
      <Path d="M8.5 19.5 L10 21.1 L12.8 18.1" stroke="#3FAE5A" strokeWidth={1.9} fill="none" strokeLinecap="round" strokeLinejoin="round" />
      <Path d="M15 19.5 H22" stroke="#C9B79E" strokeWidth={1.8} strokeLinecap="round" />
    </Svg>
  );
}

/** Wrapped gift (daily gift button). */
export function GiftIcon({ size = 30 }: { size?: number }) {
  return (
    <Svg width={size} height={size} viewBox="0 0 30 30">
      <Path d="M15 11 Q10 11 9.5 7.5 Q9.5 4.5 12 5 Q14.5 5.5 15 11 Z M15 11 Q20 11 20.5 7.5 Q20.5 4.5 18 5 Q15.5 5.5 15 11 Z" fill="#FFC531" stroke={INK} strokeWidth={1.5} strokeLinejoin="round" />
      <Rect x={3.5} y={11} width={23} height={6} rx={1.5} fill="#E8432E" stroke={INK} strokeWidth={1.8} />
      <Rect x={5} y={17} width={20} height={9.5} rx={1.5} fill="#F26B57" stroke={INK} strokeWidth={1.8} />
      <Path d="M15 11 V26.5" stroke="#FFC531" strokeWidth={4} />
      <Path d="M15 11 V26.5" stroke={INK} strokeWidth={0.8} opacity={0.4} />
    </Svg>
  );
}

/** Cut diamond (the premium currency). */
export function DiamondIcon({ size = 20 }: { size?: number }) {
  return (
    <Svg width={size} height={size} viewBox="0 0 20 20">
      <Path d="M5 3 H15 L19 8 L10 18 L1 8 Z" fill="#7CC8EE" stroke={INK} strokeWidth={1.3} strokeLinejoin="round" />
      <Path d="M1 8 H19 M7 3 L5.5 8 L10 18 M13 3 L14.5 8 L10 18" stroke={INK} strokeWidth={0.8} fill="none" strokeLinejoin="round" />
      <Path d="M6.5 5 L8.5 4.5" stroke="#fff" strokeWidth={1.2} strokeLinecap="round" />
    </Svg>
  );
}

/** Lightning bolt (income boosters). */
export function BoostIcon({ size = 20 }: { size?: number }) {
  return (
    <Svg width={size} height={size} viewBox="0 0 20 20">
      <Path d="M11.5 1.5 L4 11 H9 L7.5 18.5 L16 8.5 H10.5 Z" fill="#FFC531" stroke={INK} strokeWidth={1.3} strokeLinejoin="round" />
    </Svg>
  );
}
