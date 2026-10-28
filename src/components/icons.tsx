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
