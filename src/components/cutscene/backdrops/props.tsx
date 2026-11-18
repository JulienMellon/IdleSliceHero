// The props a panel can show over a backdrop (scene-specific foreground pieces) and the shared icon props.
import type { ReactElement } from 'react';
import { Circle, G, Path, Rect, Text } from 'react-native-svg';

import { F } from '../../../theme';
import { PROP_FONT, fitPropText, lineFont } from '../prop-text';
import { ICON_PROP_BOX, ICON_PROP_IDS, NAME_TAG_FIELD, ORDER_SLIP, PROP_BOXES, n as n1, circle, gridLines, windows } from '../backdrop-art';
import { INK } from './shared';

// ---------------------------------------------------------------------------------------------------------------
// Props (scene-specific foreground pieces, in the top half, clear of the cast's heads; Rosa's recipe card is held by the figure, see Portrait)

/** Pier 9 sign: board above the speaker's cap, its post planted in the dock left of her. */
export function SoldSign() {
  return (
    <G>
      <Path d="M124 4h8v146h-8Z" fill="#6B4423" stroke={INK} strokeWidth={2} />
      <Path d="M132 150 L154 150 L146 156 L126 156 Z" fill="#000" opacity={0.2} />
      <Path d="M110 -40h100v46h-100Z" fill="#000" opacity={0.18} />
      <Rect x={106} y={-44} width={100} height={46} rx={4} fill="#F2E2B8" stroke={INK} strokeWidth={3} />
      <Path d="M110 -40h92" stroke="#fff" strokeWidth={3} opacity={0.5} />
      <Text x={156} y={-22} fontSize={14} fontFamily={F.bold} fill="#E8432E" textAnchor="middle">
        SOLD SOON
      </Text>
      <Text x={156} y={-7} fontSize={8} fontFamily={F.bold} fill={INK} textAnchor="middle">
        FUTURE MEGASTORE
      </Text>
    </G>
  );
}

/** MegaSlice vending machine, tall enough that its snack rows show between and above two heads. (No header sign: the billboard behind it carries the brand, D399.) */
const VEND = {
  rows: gridLines(180, 26, 216, 92, 400, 13),
  snacks: windows(183, 16, 3, 5, 9, 9, 11.5, 13),
  snackHi: windows(184, 17, 3, 5, 3, 3, 11.5, 13),
};
export function VendingMachine() {
  return (
    <G>
      <Path d="M236 140 L262 140 L252 148 L226 148 Z" fill="#000" opacity={0.2} />
      <Rect x={168} y={-6} width={68} height={146} rx={5} fill="#7B2CBF" stroke={INK} strokeWidth={3} />
      <Path d="M226 -4h8v142h-8Z" fill="#000" opacity={0.18} />
      <Rect x={177} y={6} width={42} height={88} fill="#D9C8EE" stroke={INK} strokeWidth={2} />
      <Path d={VEND.snacks} fill="#FFC531" stroke={INK} strokeWidth={0.9} />
      <Path d={VEND.snackHi} fill="#fff" opacity={0.6} />
      <Path d={VEND.rows} stroke="#8E6AB8" strokeWidth={1.4} />
      <Path d="M180 90 L198 8 L206 8 L188 90 Z" fill="#fff" opacity={0.18} />
      <Rect x={222} y={10} width={8} height={30} rx={2} fill="#3A1450" />
      <Rect x={178} y={102} width={42} height={16} fill="#2A0A3A" />
    </G>
  );
}

/** The props a panel can show over the backdrop (the recipe card is held by Rosa's figure instead). */
export type BackdropProp = 'vending-machine' | 'sold-sign' | 'order-slip' | 'name-tag' | 'phone-footage' | (typeof ICON_PROP_IDS)[number];

const SLIP = (() => {
  // a receipt's torn bottom edge: a zigzag of 10 teeth
  const w = PROP_BOXES['order-slip'].w;
  const h = PROP_BOXES['order-slip'].h;
  const tooth = w / 10;
  let edge = '';
  for (let i = 0; i < 10; i++) edge += `l${-tooth / 2} 6l${-tooth / 2} -6`;
  return { paper: `M0 0H${w}V${h - 6}${edge}Z`, price: lineFont(ORDER_SLIP.lines[1], ORDER_SLIP.w, 11), name: lineFont(ORDER_SLIP.lines[0], ORDER_SLIP.w, 13) };
})();

/** Mr. Smith's order slip: a paper receipt taped up, tilted a little. */
export function OrderSlip() {
  const b = PROP_BOXES['order-slip'];
  return (
    <G transform={`translate(${b.x} ${b.y}) rotate(-3 ${b.w / 2} ${b.h / 2})`}>
      <Path d={SLIP.paper} transform="translate(3 4)" fill="#000" opacity={0.2} />
      <Path d={SLIP.paper} fill="#FFFDF5" stroke={INK} strokeWidth={2} strokeLinejoin="round" />
      <Text x={b.w / 2} y={16} fontSize={PROP_FONT.min} fontFamily={F.bold} fill="#D9443A" textAnchor="middle">
        ORDER
      </Text>
      <Path d={`M8 22H${b.w - 8}`} stroke={INK} strokeWidth={1} strokeDasharray="3 2.5" />
      <Text x={b.w / 2} y={42} fontSize={SLIP.name} fontFamily={F.bold} fill={INK} textAnchor="middle">
        {ORDER_SLIP.lines[0]}
      </Text>
      <Text x={b.w / 2} y={60} fontSize={SLIP.price} fontFamily={F.bold} fill={INK} textAnchor="middle">
        {ORDER_SLIP.lines[1]}
      </Text>
      <Path d={`M8 67H${b.w - 8}`} stroke={INK} strokeWidth={1} strokeDasharray="3 2.5" />
      <Rect x={b.w / 2 - 15} y={-3} width={30} height={9} fill="#FFE27A" opacity={0.85} stroke="#C9A93A" strokeWidth={0.8} />
    </G>
  );
}

/** A name tag in close-up: a red HELLO band over a white field with the name in marker, fitted to the field (prop-text.ts). */
export function NameTag({ text }: { text: string }) {
  const b = PROP_BOXES['name-tag'];
  const f = NAME_TAG_FIELD;
  const fit = fitPropText(text, f.w, f.h);
  const block = fit.lines.length * fit.fontSize * 1.18;
  const top = f.y + (f.h - block) / 2;
  return (
    <G transform={`translate(${b.x} ${b.y}) rotate(2 ${b.w / 2} ${b.h / 2})`}>
      <Rect x={3} y={4} width={b.w} height={b.h} rx={8} fill="#000" opacity={0.2} />
      <Rect x={0} y={0} width={b.w} height={b.h} rx={8} fill="#FFFFFF" stroke={INK} strokeWidth={2.4} />
      <Path d={`M1.2 26V9.2Q1.2 1.2 9.2 1.2H${b.w - 9.2}Q${b.w - 1.2} 1.2 ${b.w - 1.2} 9.2V26Z`} fill="#D9443A" />
      <Text x={b.w / 2} y={20} fontSize={14} fontFamily={F.bold} fill="#FFFFFF" textAnchor="middle">
        HELLO
      </Text>
      {fit.lines.map((line, i) => (
        <Text
          key={i}
          x={b.w / 2}
          y={top + i * fit.fontSize * 1.18 + fit.fontSize * 0.92}
          fontSize={fit.fontSize}
          fontFamily={F.bold}
          fill="#1E2A5A"
          textAnchor="middle"
        >
          {line}
        </Text>
      ))}
    </G>
  );
}

const PHONE = {
  screen: { x: 4, y: 6, w: 48, h: 68 },
  grain: gridLines(4, 6, 52, 74, 400, 3),
  // a stairwell: stepped landings climbing to the right, a rail along them, and a figure standing on the middle landing
  stairs: 'M4 74V58H18V50H30V42H42V34H52V74Z',
  rail: 'M18 46L30 38L42 30L52 24',
  figure: circle(30, 29, 3.6) + 'M25 41Q25 33 30 33Q35 33 35 41Z',
};
/** The phone-footage insert: a phone held up, its grainy screen showing a stairwell and a figure on the landing, a red REC dot. */
export function PhoneFootage() {
  const b = PROP_BOXES['phone-footage'];
  const s = PHONE.screen;
  return (
    <G transform={`translate(${b.x} ${b.y}) rotate(-4 ${b.w / 2} ${b.h / 2})`}>
      <Rect x={3} y={4} width={b.w} height={b.h} rx={8} fill="#000" opacity={0.22} />
      <Rect x={0} y={0} width={b.w} height={b.h} rx={8} fill="#1B1B22" stroke={INK} strokeWidth={2.4} />
      <Rect x={s.x} y={s.y} width={s.w} height={s.h} rx={2} fill="#8E9A93" />
      <Path d={PHONE.stairs} fill="#3B4540" />
      <Path d={PHONE.rail} stroke="#2A312D" strokeWidth={1.6} fill="none" />
      <Path d={PHONE.figure} fill="#232A27" />
      <Path d={PHONE.grain} stroke="#fff" strokeWidth={1} opacity={0.16} />
      <Path d={PHONE.grain} stroke="#000" strokeWidth={0.8} opacity={0.12} transform="translate(0 1.5)" />
      <Circle cx={10} cy={13} r={3.2} fill="#E8432E" />
      <Text x={16} y={16.4} fontSize={PROP_FONT.min} fontFamily={F.bold} fill="#FFFFFF" textAnchor="start">
        REC
      </Text>
      <Rect x={b.w / 2 - 8} y={b.h - 5} width={16} height={2.4} rx={1.2} fill="#5A5A66" />
    </G>
  );
}

// ---- Boston's props: small objects held up in one shared box (ICON_PROP_BOX, 100 x 72), tilted like the name tag ----

const star5 = (cx: number, cy: number, r: number) => {
  let d = '';
  for (let i = 0; i < 10; i++) {
    const a = -Math.PI / 2 + (i * Math.PI) / 5;
    const rr = i % 2 ? r * 0.45 : r;
    d += `${i ? 'L' : 'M'}${n1(cx + rr * Math.cos(a))} ${n1(cy + rr * Math.sin(a))}`;
  }
  return d + 'Z';
};

export function IconProp({ id }: { id: (typeof ICON_PROP_IDS)[number] }) {
  const b = ICON_PROP_BOX;
  let art: ReactElement;
  switch (id) {
    case 'coupon':
      art = (
        <G>
          <Rect x={8} y={14} width={84} height={44} rx={4} fill="#FFE27A" stroke={INK} strokeWidth={2.2} />
          <Rect x={13} y={19} width={74} height={34} rx={2} fill="none" stroke="#D9443A" strokeWidth={1.4} strokeDasharray="4 3" />
          <Text x={50} y={34} fontSize={15} fontFamily={F.bold} fill="#D9443A" textAnchor="middle">
            FREE
          </Text>
          <Text x={50} y={49} fontSize={12} fontFamily={F.bold} fill={INK} textAnchor="middle">
            MEGASLICE
          </Text>
        </G>
      );
      break;
    case 'envelope':
      art = (
        <G>
          <Rect x={10} y={14} width={80} height={48} rx={3} fill="#FFFDF5" stroke={INK} strokeWidth={2.2} />
          <Path d="M10 14L50 42L90 14" stroke={INK} strokeWidth={2} fill="none" strokeLinejoin="round" />
          <Path d="M10 62L38 36M90 62L62 36" stroke={INK} strokeWidth={1.2} opacity={0.5} />
          <Circle cx={50} cy={42} r={6.5} fill="#D9443A" stroke={INK} strokeWidth={1.2} />
          <Text x={50} y={46.4} fontSize={11} fontFamily={F.bold} fill="#FFFFFF" textAnchor="middle">
            P.
          </Text>
        </G>
      );
      break;
    case 'apron':
      art = (
        <G>
          <Path d="M36 4H64L61 24H76L84 68H16L24 24H39Z" fill="#F4F1EC" stroke={INK} strokeWidth={2.2} strokeLinejoin="round" />
          <Path d="M38 4Q50 -6 62 4" stroke={INK} strokeWidth={2} fill="none" />
          <Rect x={36} y={42} width={28} height={16} rx={2} fill="#E8E1CC" stroke={INK} strokeWidth={1.4} />
          <Path d="M24 24L12 30M76 24L88 30" stroke={INK} strokeWidth={1.8} strokeLinecap="round" />
        </G>
      );
      break;
    case 'contract':
      art = (
        <G>
          <Rect x={22} y={2} width={56} height={68} rx={2} fill="#FFFDF5" stroke={INK} strokeWidth={2.2} />
          <Path d="M30 14H70M30 22H70M30 30H62M30 38H70M30 46H56" stroke="#9AA3AE" strokeWidth={1.6} />
          <Path d="M30 60Q36 50 40 60T50 58T62 58" stroke="#1E2A5A" strokeWidth={2} fill="none" strokeLinecap="round" />
          <Path d="M66 56L74 66L70 68Z" fill="#F2C94C" stroke={INK} strokeWidth={1} />
        </G>
      );
      break;
    case 'clipboard':
      art = (
        <G>
          <Rect x={24} y={4} width={52} height={66} rx={3} fill="#B98550" stroke={INK} strokeWidth={2.2} />
          <Rect x={30} y={12} width={40} height={52} fill="#FFFDF5" stroke={INK} strokeWidth={1} />
          <Path d="M35 24H65M35 32H65M35 40H65M35 48H55" stroke="#9AA3AE" strokeWidth={1.6} />
          <Rect x={40} y={0} width={20} height={9} rx={2} fill="#B8C0CA" stroke={INK} strokeWidth={1.4} />
        </G>
      );
      break;
    case 'phone':
      art = (
        <G>
          <Rect x={30} y={2} width={40} height={68} rx={6} fill="#1B1B22" stroke={INK} strokeWidth={2.2} />
          <Rect x={34} y={9} width={32} height={50} rx={1.5} fill="#DDE7F0" />
          <Rect x={37} y={14} width={20} height={8} rx={3} fill="#2F80ED" />
          <Rect x={43} y={26} width={20} height={8} rx={3} fill="#FFFFFF" stroke="#9AA3AE" strokeWidth={0.8} />
          <Rect x={37} y={38} width={18} height={8} rx={3} fill="#2F80ED" />
          <Circle cx={50} cy={64} r={2.4} fill="#5A5A66" />
        </G>
      );
      break;
    case 'photo':
      art = (
        <G>
          <Rect x={12} y={8} width={76} height={58} fill="#FFFFFF" stroke={INK} strokeWidth={2.2} />
          <Rect x={17} y={13} width={66} height={42} fill="#B5C8E4" />
          <Path d="M17 55V44Q40 38 83 46V55Z" fill="#6FBF5A" />
          <Path d={circle(36, 28, 5)} fill="#F0C8A8" stroke={INK} strokeWidth={0.8} />
          <Path d="M24 22Q36 12 48 22Z" fill="#B23A48" stroke={INK} strokeWidth={0.8} />
          <Path d="M28 46Q28 34 36 34Q44 34 44 46Z" fill="#7A4A26" />
          <Path d={circle(62, 36, 4)} fill="#F0C8A8" stroke={INK} strokeWidth={0.8} />
          <Path d="M57 49Q57 40 62 40Q67 40 67 49Z" fill="#2F80ED" />
          <Path d="M67 38L74 46" stroke={INK} strokeWidth={1.6} />
          <Text x={50} y={64} fontSize={10} fontFamily={F.bold} fill={INK} textAnchor="middle">
            SUNDAYS
          </Text>
        </G>
      );
      break;
    case 'thermometer':
      art = (
        <G>
          <Rect x={42} y={2} width={16} height={50} rx={8} fill="#F4F1EC" stroke={INK} strokeWidth={2.2} />
          <Circle cx={50} cy={58} r={11} fill="#F4F1EC" stroke={INK} strokeWidth={2.2} />
          <Circle cx={50} cy={58} r={6.5} fill="#D9443A" />
          <Rect x={47.5} y={14} width={5} height={42} fill="#D9443A" />
          <Path d="M62 12L72 6M64 22L76 22M62 32L72 38M38 12L28 6M36 22L24 22M38 32L28 38" stroke="#F2C94C" strokeWidth={2.2} strokeLinecap="round" />
        </G>
      );
      break;
    case 'pantry-shelf':
      art = (
        <G>
          <Rect x={8} y={26} width={84} height={5} fill="#9A6A3A" stroke={INK} strokeWidth={1.4} />
          <Rect x={8} y={58} width={84} height={5} fill="#9A6A3A" stroke={INK} strokeWidth={1.4} />
          {[0, 1].map((i) => (
            <Rect key={i} x={14 + i * 20} y={8} width={14} height={18} rx={2} fill={['#E8432E', '#F2C94C'][i]} stroke={INK} strokeWidth={1.2} />
          ))}
          {[0, 1].map((i) => (
            <Rect key={i} x={14 + i * 20} y={39} width={14} height={19} rx={2} fill={['#BFC6CE', '#3FAE5A'][i]} stroke={INK} strokeWidth={1.2} />
          ))}
          <Path d="M62 40H88M62 10H88" stroke={INK} strokeWidth={1.2} strokeDasharray="3 3" opacity={0.5} />
        </G>
      );
      break;
    case 'half-ladle':
      art = (
        <G>
          <Path d="M50 14A24 24 0 0 0 50 62Z" fill="#E0B000" stroke={INK} strokeWidth={2.2} strokeLinejoin="round" />
          <Path d="M50 14V62" stroke={INK} strokeWidth={1.4} strokeDasharray="3 2.5" />
          <Path d="M50 22L88 8" stroke="#E0B000" strokeWidth={7} strokeLinecap="round" />
          <Path d="M50 22L88 8" stroke={INK} strokeWidth={1.4} fill="none" opacity={0.5} />
        </G>
      );
      break;
    case 'golden-ladle':
      art = (
        <G>
          <Circle cx={36} cy={44} r={22} fill="#E0B000" stroke={INK} strokeWidth={2.2} />
          <Path d="M20 40Q36 54 52 40" fill="#B8860B" opacity={0.5} />
          <Path d="M52 34L90 10" stroke="#E0B000" strokeWidth={7} strokeLinecap="round" />
          <Path d={star5(78, 36, 8)} fill="#FFF3B0" stroke={INK} strokeWidth={1} strokeLinejoin="round" />
          <Path d={star5(24, 14, 6)} fill="#FFF3B0" stroke={INK} strokeWidth={1} strokeLinejoin="round" />
        </G>
      );
      break;
    case 'scorecard':
      art = (
        <G>
          <Rect x={10} y={4} width={80} height={64} rx={2} fill="#FFFDF5" stroke={INK} strokeWidth={2.2} />
          <Path d={gridLines(10, 4, 90, 68, 16, 14)} stroke="#9AA3AE" strokeWidth={1.2} />
          <Path d="M10 18H90" stroke={INK} strokeWidth={1.6} />
          <Path
            d={star5(26, 32, 5) + star5(42, 32, 5) + star5(58, 46, 5) + star5(74, 32, 5) + star5(26, 60, 5)}
            fill="#D9443A"
            stroke={INK}
            strokeWidth={0.8}
            strokeLinejoin="round"
          />
        </G>
      );
      break;
    default:
      art = (
        <G>
          <Path
            d="M50 62C26 62 14 46 20 32C26 18 40 24 50 36C60 24 74 18 80 32C86 46 74 62 50 62Z"
            fill="none"
            stroke="#B87428"
            strokeWidth={9}
            strokeLinejoin="round"
          />
          <Path d="M50 62C26 62 14 46 20 32C26 18 40 24 50 36C60 24 74 18 80 32C86 46 74 62 50 62Z" fill="none" stroke={INK} strokeWidth={1.2} opacity={0.5} />
          <Path d={circle(26, 40, 1.2) + circle(34, 28, 1.2) + circle(70, 28, 1.2) + circle(76, 42, 1.2) + circle(50, 52, 1.2)} fill="#FFFFFF" />
        </G>
      );
  }
  return (
    <G transform={`translate(${b.x} ${b.y}) rotate(2 ${b.w / 2} ${b.h / 2})`}>
      <Rect x={3} y={4} width={b.w - 6} height={b.h - 8} rx={8} fill="#000" opacity={0.1} />
      {art}
    </G>
  );
}
