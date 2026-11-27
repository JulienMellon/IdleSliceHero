// The look thumbnails (v5.24, card S4): one 48 pt picture of each look the shop draws, for the Shop's Style tab (card U6 imports `LookThumb`). Each is the look's own art at a
// small scale, read from the same tables as the scene (look-art.ts), so the picture on the card is the thing the shop wears. No text: a thumbnail's words are the card's.
// Looks nobody draws (the oven skins, the neon sign) get the plain tile, which names the part by its glyph. Card S5 added the University, Industrial and Uptown sets.
import { memo, type ReactElement } from 'react';
import Svg, { Circle, Ellipse, G, Path, Rect } from 'react-native-svg';

import { lookOf, type Part } from '../../content/catalog';
import { AWNING_GOLD } from './cosmetics';
import { ApronOverlay, DoorChime, TableCloth, TipJar } from './cosmetic-props';
import { AWNING_LOOKS, COUNTERS, FACADE_THEMES, MENUS, OVEN_LOOKS, SIGN_BOARDS, variantOfLook, hasArt } from './look-art';
import { GENERIC } from './palette';
import { INK } from './projection';
import { ParkedVehicle } from './street';

/** The thumbnail's size in points. */
export const LOOK_THUMB = 48;

const TILE = '#FBF1DE';

/** A scalloped awning across the top of the picture: the stripes, the valance and the piping. */
function Awning({ main, alt, piping, y = 8, w = 38, x = 5 }: { main: string; alt: string; piping: string; y?: number; w?: number; x?: number }) {
  const n = 6;
  const sw = w / n;
  return (
    <G>
      {Array.from({ length: n }).map((_, i) => (
        <G key={i}>
          <Path d={`M${x + i * sw} ${y} h${sw} v10 h-${sw} Z`} fill={i % 2 === 0 ? main : alt} stroke={INK} strokeWidth={0.8} />
          <Path d={`M${x + i * sw} ${y + 10} q${sw / 2} 5 ${sw} 0`} fill={i % 2 === 0 ? main : alt} stroke={INK} strokeWidth={0.8} />
        </G>
      ))}
      <Path d={`M${x} ${y + 10} H${x + w}`} stroke={piping} strokeWidth={1.6} />
    </G>
  );
}

function Facade({ variant }: { variant: string }) {
  const t = FACADE_THEMES[variant];
  if (!t) return null;
  return (
    <G>
      {/* the fascia with its sign plate and the theme's line, the two pilasters, the door and the window, the plinth */}
      <Rect x={4} y={7} width={40} height={11} fill={t.fascia} stroke={INK} strokeWidth={1} />
      {t.trim === 'checker' ? (
        <G>
          <Rect x={5} y={14} width={38} height={4} fill={t.trimAlt} />
          <Path d="M5 15 H43" stroke={t.trimColor} strokeWidth={2} strokeDasharray="2 2" />
          <Path d="M5 17 H43" stroke={t.trimColor} strokeWidth={2} strokeDasharray="2 2" strokeDashoffset={2} />
        </G>
      ) : t.trim === 'bunting' ? (
        <G>
          {Array.from({ length: 8 }).map((_, i) => (
            <Path key={i} d={`M${5 + i * 4.75} 13 h4.75 l-2.4 4.6 Z`} fill={i % 2 === 0 ? t.trimColor : t.trimAlt} stroke={INK} strokeWidth={0.4} />
          ))}
        </G>
      ) : t.trim === 'rivets' ? (
        <G>
          <Rect x={5} y={14} width={38} height={3.6} fill={t.trimAlt} />
          <Path d="M5 15.8 H43" stroke="#2A2A33" strokeWidth={3.2} strokeDasharray="2.6 2.6" />
          {[8, 16, 24, 32, 40].map((x) => (
            <Circle key={x} cx={x} cy={9.2} r={0.8} fill={t.trimColor} />
          ))}
        </G>
      ) : (
        <Path
          d="M5 16 H43"
          stroke={t.trimColor}
          strokeWidth={t.trim === 'rope' ? 2 : t.trim === 'gilt' ? 1.6 : 1.2}
          strokeDasharray={t.trim === 'rope' ? '2.4 1.4' : undefined}
        />
      )}
      <Rect
        x={14}
        y={9}
        width={20}
        height={6}
        rx={t.sign === 'pill' ? 3 : t.sign === 'cartouche' ? 2.6 : 1.4}
        fill={SIGN_BOARDS[t.sign === 'board' ? 'cartouche' : t.sign].board}
        stroke={SIGN_BOARDS[t.sign === 'board' ? 'cartouche' : t.sign].edge}
        strokeWidth={1}
      />
      {[4, 38].map((x) => (
        <G key={x}>
          <Rect x={x} y={18} width={6} height={24} fill={t.pilaster} stroke={INK} strokeWidth={1} />
          <Path d={`M${x} 26 H${x + 6} M${x} 34 H${x + 6}`} stroke={t.seam} strokeWidth={0.8} />
          {t.cap && <Rect x={x - 1} y={18} width={8} height={2.6} fill={t.cap} stroke={INK} strokeWidth={0.6} />}
        </G>
      ))}
      <Rect x={10} y={22} width={28} height={20} fill="#BFE3F5" stroke={INK} strokeWidth={1} />
      <Rect x={20} y={26} width={10} height={16} fill="#6B4330" stroke={INK} strokeWidth={0.8} />
      <Path d="M12 25 L16 32" stroke="#fff" strokeWidth={1.4} opacity={0.6} strokeLinecap="round" />
      <Rect x={3} y={41} width={42} height={4} rx={1} fill={t.plinth} stroke={INK} strokeWidth={1} />
    </G>
  );
}

function Menu({ variant }: { variant: string }) {
  const m = MENUS[variant];
  if (!m) return null;
  return (
    <G>
      <Rect x={8} y={8} width={34} height={34} rx={4} fill="rgba(59,31,20,0.25)" />
      <Rect x={6} y={6} width={34} height={34} rx={4} fill={m.board} stroke={m.frame} strokeWidth={2.6} />
      <Rect x={13} y={11} width={20} height={3} rx={1.5} fill={m.head} />
      {[0, 1, 2].map((i) => (
        <G key={i}>
          <Path d={`M10 ${19 + i * 6} l4 0 l-2 4 Z`} fill={m.slice} />
          <Rect x={17} y={20 + i * 6} width={12} height={2} rx={1} fill={m.text} opacity={0.85} />
          <Rect x={31} y={20 + i * 6} width={5} height={2} rx={1} fill={m.price} />
        </G>
      ))}
    </G>
  );
}

function Counter({ variant }: { variant: string }) {
  const c = COUNTERS[variant];
  if (!c) return null;
  return (
    <G>
      <Ellipse cx={24} cy={41} rx={20} ry={3} fill="rgba(59,31,20,0.2)" />
      <Path d="M4 20 H44 L41 14 H7 Z" fill={c.top} stroke={INK} strokeWidth={1} strokeLinejoin="round" />
      <Rect x={4} y={20} width={40} height={20} fill={c.front} stroke={INK} strokeWidth={1.2} />
      <Path d="M4 21.4 H44" stroke={c.trim} strokeWidth={2} />
      <Rect x={7} y={23} width={34} height={11} rx={2} fill="none" stroke={c.trim} strokeWidth={1.2} />
      {c.checker && (
        <G>
          <Rect x={5} y={35} width={38} height={4.4} fill="#fff" />
          <Path d="M5 36.1 H43" stroke="#2A2A33" strokeWidth={2.2} strokeDasharray="2.2 2.2" />
          <Path d="M5 38.3 H43" stroke="#2A2A33" strokeWidth={2.2} strokeDasharray="2.2 2.2" strokeDashoffset={2.2} />
        </G>
      )}
    </G>
  );
}

/** The Industrial oven: a soot-red dome on a steel plinth with a riveted band and a glowing mouth. */
function BrickOven() {
  const o = OVEN_LOOKS.brick;
  return (
    <G>
      <Ellipse cx={24} cy={41} rx={18} ry={2.6} fill="rgba(59,31,20,0.2)" />
      <Path d="M8 36 V28 A16 17 0 0 1 40 28 V36 Z" fill={o.base} stroke={INK} strokeWidth={1.2} />
      <Path d="M10 22 Q24 16 38 22 M9 29 Q24 23 39 29" stroke="#000" strokeWidth={0.8} opacity={0.3} fill="none" />
      <Rect x={8} y={28} width={32} height={4.8} fill={o.band} stroke={INK} strokeWidth={0.8} />
      {[12, 18, 24, 30, 36].map((x) => (
        <Circle key={x} cx={x} cy={30.4} r={1} fill={o.rivet} />
      ))}
      <Path d="M18 36 V24 A6 6 0 0 1 30 24 V36 Z" fill="#FFB347" stroke={INK} strokeWidth={1} />
      <Path d="M21 36 V28 L23 25 L24.5 28 L26 24 L27 36 Z" fill="#FFE08A" />
      <Rect x={6} y={36} width={36} height={5} rx={1} fill="#59626B" stroke={INK} strokeWidth={1} />
    </G>
  );
}

function Plank() {
  const s = SIGN_BOARDS.plank;
  return (
    <G>
      <Path d="M12 6 V13 M36 6 V13" stroke={INK} strokeWidth={1.6} />
      <Path d="M12 6 V13 M36 6 V13" stroke={s.edge} strokeWidth={0.9} strokeDasharray="1.6 1" />
      <Rect x={5} y={13} width={38} height={22} rx={2} fill={s.board} stroke={INK} strokeWidth={1.3} />
      <Rect x={8} y={16} width={32} height={16} rx={1.4} fill="none" stroke={s.edge} strokeWidth={1} />
      <Path d="M18 13 V35 M30 13 V35" stroke={INK} strokeWidth={0.7} opacity={0.35} />
      {/* an anchor */}
      <G stroke={s.text} strokeWidth={1.7} strokeLinecap="round" fill="none">
        <Circle cx={24} cy={19.2} r={1.5} />
        <Path d="M24 20.8 V30 M20.6 23.4 H27.4 M19 27 Q20 31 24 31 Q28 31 29 27" />
      </G>
    </G>
  );
}

/** The plain tile: a look this module does not draw yet (or one that is not worn on the scene), named by its part's glyph. */
function Glyph({ part, tone }: { part: Part; tone: string }) {
  return (
    <G>
      <Circle cx={24} cy={24} r={15} fill={tone} stroke={INK} strokeWidth={1.2} opacity={0.9} />
      {part === 'oven' ? (
        <Path d="M16 30 V22 Q24 12 32 22 V30 Z" fill="#fff" opacity={0.85} stroke={INK} strokeWidth={1} />
      ) : part === 'counter' || part === 'plaque' ? (
        <Rect x={15} y={19} width={18} height={10} rx={2} fill="#fff" opacity={0.85} stroke={INK} strokeWidth={1} />
      ) : (
        <Path
          d="M24 14 L27 21 L34 22 L29 27 L30.5 34 L24 30.5 L17.5 34 L19 27 L14 22 L21 21 Z"
          fill="#fff"
          opacity={0.85}
          stroke={INK}
          strokeWidth={1}
          strokeLinejoin="round"
        />
      )}
    </G>
  );
}

const TONES: Partial<Record<Part, string>> = {
  oven: '#E9A64B',
  facade: '#8EB8C9',
  awning: '#E3B52E',
  counter: '#D4607E',
  scooter: '#6FD8B8',
  plaque: '#F2C94C',
};

/**
 * The 48 pt thumbnail of a look (a catalog id such as `awning-classic`). The looks of the six sets and the generic small looks are drawn; any other id gets
 * the plain tile of its part. Memoised on the id and the size.
 */
export const LookThumb = memo(function LookThumb({ id, size = LOOK_THUMB }: { id: string; size?: number }) {
  const l = lookOf(id);
  const part = l?.part;
  const v = variantOfLook(id);
  let art: ReactElement | null = null;
  if (part && hasArt(id)) {
    if (part === 'facade') art = <Facade variant={v} />;
    else if (part === 'awning') {
      const a = AWNING_LOOKS[v];
      art = <Awning main={a.main} alt={a.alt} piping={a.piping} />;
    } else if (part === 'menu') art = <Menu variant={v} />;
    else if (part === 'counter') art = <Counter variant={v} />;
    else if (part === 'sign') art = <Plank />;
    else if (part === 'apron')
      art = (
        <G transform="translate(24 22) scale(2.2) translate(0 -9)">
          <ApronOverlay look={v} by={0} kind="baker" />
        </G>
      );
    else if (part === 'tablecloth')
      art = (
        <G transform="translate(24 42) scale(1.45)">
          <Path d="M-1.6 -14 H1.6 V0 H-1.6 Z" fill="#9A958E" stroke={INK} strokeWidth={0.6} />
          <Ellipse cx={0} cy={-1} rx={6} ry={2} fill="#9A958E" />
          <TableCloth look={v} />
        </G>
      );
    else if (part === 'tipjar')
      art = (
        <G transform="translate(24 36) scale(2.4)">
          <TipJar look={v} />
        </G>
      );
    else if (part === 'chime')
      art = (
        <G transform="translate(24 8) scale(1.6)">
          <DoorChime look={v} />
        </G>
      );
    else if (part === 'oven') art = <BrickOven />;
    else if (part === 'scooter')
      art = (
        <G transform="translate(24 40) scale(0.95)">
          <ParkedVehicle x={0} y={0} v={1} paint={v} />
        </G>
      );
  } else if (id === 'awning-gold') art = <Awning main={AWNING_GOLD.main} alt={AWNING_GOLD.alt} piping={AWNING_GOLD.piping} />;
  else if (id === 'scooter-mint')
    art = (
      <G transform="translate(24 40) scale(0.95)">
        <ParkedVehicle x={0} y={0} v={1} paint="mint" />
      </G>
    );
  return (
    <Svg width={size} height={size} viewBox="0 0 48 48">
      <Rect x={0.6} y={0.6} width={46.8} height={46.8} rx={9} fill={TILE} stroke={INK} strokeWidth={1.2} />
      {art ?? <Glyph part={part ?? 'plaque'} tone={(part && TONES[part]) || GENERIC.glass} />}
    </Svg>
  );
});
