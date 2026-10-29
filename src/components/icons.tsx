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
