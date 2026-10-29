import { Circle, Ellipse, G, Path, Rect } from 'react-native-svg';
import { INK, P, kAt, shade } from './projection';

export type Kind = 'cook' | 'baker' | 'staff' | 'driver' | 'guest' | 'sit';

// ---------- characters ----------
// Light comes from the upper left: every figure has a shadow side on the right, a highlight on the left,
// and the same 1.1 ink outline as the furniture. Figures face +x (flip mirrors them).
export const SKINS = ['#F6D3B3', '#EDB98A', '#D69A6A', '#B07446', '#7E4F30'];
export const HAIR_COLORS = ['#2B1A12', '#4A2C1D', '#8E5A3C', '#E3C16F', '#B5462E', '#8F8A86'];
export const PANTS = ['#3B4A6B', '#5C4033', '#2F3140', '#6B7A8F', '#7A5C8E'];
export const GUEST_SHIRTS = ['#F2994A', '#56CCF2', '#BB6BD9', '#6FCF97', '#F2C94C', '#EB6F92', '#3D9970', '#5C6BC0'];

export interface Look { skin: string; hair: string; style: number; trait: number; wide: number; pants: string; shirt: string; tall: number; outfit: number }
/** Integer hash (mulberry32 step) so every look field is independent of the others. */
export function hash32(n: number) {
  let t = (n + 0x6d2b79f5) | 0;
  t = Math.imul(t ^ (t >>> 15), t | 1);
  t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
  return (t ^ (t >>> 14)) >>> 0;
}
/** Traits: 0 none · 1 glasses · 2 moustache · 3 freckles · 4 hair tuft. Workers always get one. */
export function lookFor(seed: number, worker = false): Look {
  const n = Math.abs(Math.floor(seed));
  const pick = (field: number, m: number) => hash32(n * 131 + field * 7919) % m;
  return {
    skin: SKINS[pick(1, SKINS.length)],
    hair: HAIR_COLORS[pick(2, HAIR_COLORS.length)],
    style: pick(3, 6),
    trait: worker ? 1 + pick(4, 4) : [0, 0, 1, 2, 3][pick(4, 5)],
    wide: pick(5, 3) - 1,
    pants: PANTS[pick(6, PANTS.length)],
    shirt: GUEST_SHIRTS[pick(7, GUEST_SHIRTS.length)],
    tall: pick(8, 5) - 2,
    outfit: pick(9, 6),
  };
}

export const OUT = { stroke: INK, strokeWidth: 1.1, strokeLinejoin: 'round' as const };

/** An outlined limb: ink stroke under a coloured stroke, ending in a hand or shoe. */
export function Limb({ d, color, w = 4.4 }: { d: string; color: string; w?: number }) {
  return (
    <G>
      <Path d={d} stroke={INK} strokeWidth={w + 2.2} fill="none" strokeLinecap="round" strokeLinejoin="round" />
      <Path d={d} stroke={color} strokeWidth={w} fill="none" strokeLinecap="round" strokeLinejoin="round" />
    </G>
  );
}

export function Hair({ style, color, hy, part }: { style: number; color: string; hy: number; part: 'back' | 'front' }) {
  if (part === 'back') {
    if (style === 1) return <Path d={`M-9.6 ${hy - 2} Q-11.2 ${hy + 9} -5 ${hy + 9.5} L-1 ${hy + 9} Q-4 ${hy + 3} -3 ${hy - 4} Z`} fill={color} {...OUT} />;
    if (style === 3) return <G>{[[-6, -6, 6], [-9, 0, 5.5], [-7, 6, 5], [0, -9, 6.5], [6, -7, 6]].map(([dx, dy, r], i) => <Circle key={i} cx={dx} cy={hy + dy} r={r} fill={color} {...OUT} />)}</G>;
    if (style === 4) return <Path d={`M-8 ${hy - 4} Q-15 ${hy - 2} -13 ${hy + 8} Q-11 ${hy + 4} -7.5 ${hy + 1} Z`} fill={color} {...OUT} />;
    return null;
  }
  if (style === 5) {
    // bald on top, trimmed sides and a beard
    return (
      <G>
        <Path d={`M-9.3 ${hy - 1} Q-9.8 ${hy + 4} -7 ${hy + 6} L-6 ${hy} Z`} fill={color} />
        <Path d={`M1.5 ${hy + 5.5} Q4.5 ${hy + 10.6} 8.5 ${hy + 8} Q10 ${hy + 6.5} 9.8 ${hy + 4} Q8 ${hy + 7.4} 5 ${hy + 7.4} Q3 ${hy + 7.2} 1.5 ${hy + 5.5} Z`} fill={color} {...OUT} strokeWidth={0.7} />
        <Path d={`M-3 ${hy - 7.5} Q1 ${hy - 9.5} 5 ${hy - 7.5}`} stroke="#fff" strokeWidth={1.6} opacity={0.35} fill="none" strokeLinecap="round" />
      </G>
    );
  }
  if (style === 3) {
    return <G>{[[-5, -8.5, 3.6], [-0.5, -10, 3.8], [4, -9, 3.6], [7.5, -6, 3.2]].map(([dx, dy, r], i) => <Circle key={i} cx={dx + 0.5} cy={hy + dy} r={r} fill={color} {...OUT} strokeWidth={0.9} />)}</G>;
  }
  // short / bob / bun / ponytail share a cap with a side-swept fringe
  return (
    <G>
      <Path d={`M-9.2 ${hy + 1} Q-10.4 ${hy - 11.5} 1 ${hy - 10.6} Q10.6 ${hy - 10.2} 10 ${hy - 2} Q7.5 ${hy - 6.8} 2.5 ${hy - 6.4} Q-1.5 ${hy - 6} -4 ${hy - 3} Q-5.5 ${hy - 1} -6.2 ${hy + 2} Z`} fill={color} {...OUT} />
      <Path d={`M-5 ${hy - 8} Q0 ${hy - 10.5} 5 ${hy - 8.5}`} stroke="#fff" strokeWidth={1.4} opacity={0.25} fill="none" strokeLinecap="round" />
      {style === 2 && <Circle cx={-3} cy={hy - 11} r={3.8} fill={color} {...OUT} />}
    </G>
  );
}

/** Hats and headwear that make each job readable at a glance. */
export function Headwear({ kind, hy, front = false, alt = false, dot = '#D9443A', cap }: { kind: Kind; hy: number; front?: boolean; alt?: boolean; dot?: string; cap?: string }) {
  if (kind === 'cook') {
    return (
      <G>
        {[[-3.4, -15.6, 4.2], [0.8, -18.2, 4.8], [5, -15.4, 4]].map(([dx, dy, r], i) => <Circle key={i} cx={dx} cy={hy + dy} r={r} fill="#FBF8F3" {...OUT} />)}
        <Circle cx={-0.8} cy={hy - 19.4} r={1.6} fill="#fff" />
        <Rect x={-6.2} y={hy - 12.8} width={13.6} height={5} rx={1.6} fill="#F1ECE4" {...OUT} />
        <Rect x={3} y={hy - 12.2} width={4} height={3.8} fill="#000" opacity={0.08} />
      </G>
    );
  }
  if (kind === 'baker') {
    return (
      <G>
        <Path d={`M-10 ${hy - 1} Q-9.4 ${hy - 12.2} 1 ${hy - 11.6} Q10.4 ${hy - 11} 10.2 ${hy - 2.2} Q1.5 ${hy - 6.5} -10 ${hy - 1} Z`} fill="#F3ECE2" {...OUT} />
        {[[-4, -8], [1, -9.5], [6, -7.5], [-7, -4], [3.5, -5.6]].map(([dx, dy], i) => <Circle key={i} cx={dx} cy={hy + dy} r={1.1} fill={dot} />)}
        <Circle cx={-10.4} cy={hy - 2} r={2} fill="#F3ECE2" {...OUT} strokeWidth={0.8} />
        <Path d={`M-11.5 ${hy - 1.5} l-3.6 -3.4 l-0.6 4.6 Z M-11.4 ${hy - 1} l-2.6 4.4 l3.8 -0.2 Z`} fill="#F3ECE2" {...OUT} strokeWidth={0.8} />
      </G>
    );
  }
  if (kind === 'staff' && alt) {
    return (
      <G>
        <Path d={`M-9.4 ${hy - 5.5} Q0.5 ${hy - 9.5} 10.2 ${hy - 5.5} L10.2 ${hy - 3.6} Q0.5 ${hy - 7.4} -9.4 ${hy - 3.6} Z`} fill="#2E7D4A" {...OUT} strokeWidth={0.9} />
        <Path d={`M-7 ${hy - 4.4} Q0.5 ${hy - 1} 9 ${hy - 4.4} Q0.5 ${hy - 2.4} -7 ${hy - 4.4} Z`} fill="#256B3E" {...OUT} strokeWidth={0.8} />
      </G>
    );
  }
  if (kind === 'staff' || kind === 'driver') {
    const c = kind === 'staff' ? cap ?? '#F5C33B' : '#D9443A';
    return (
      <G>
        <Path d={`M-9.2 ${hy - 3} Q-9.2 ${hy - 12.6} 0.5 ${hy - 12.6} Q10 ${hy - 12.6} 10 ${hy - 4} Z`} fill={c} {...OUT} />
        {front ? (
          <Path d={`M-8 ${hy - 4} Q0.5 ${hy - 6} 9 ${hy - 4} Q9 ${hy - 1.6} 0.5 ${hy - 1.8} Q-8 ${hy - 1.6} -8 ${hy - 4} Z`} fill={shade(c, -0.18)} {...OUT} strokeWidth={0.9} />
        ) : (
          <Path d={`M7 ${hy - 4.4} Q14 ${hy - 4.6} 15.5 ${hy - 2.6} Q11 ${hy - 1.6} 6.5 ${hy - 2.6} Z`} fill={shade(c, -0.18)} {...OUT} strokeWidth={0.9} />
        )}
        <Path d={`M-5.5 ${hy - 9.5} Q0 ${hy - 12} 5 ${hy - 10}`} stroke="#fff" strokeWidth={1.4} opacity={0.35} fill="none" strokeLinecap="round" />
        <Circle cx={1.5} cy={hy - 8} r={2} fill={kind === 'staff' ? '#3FAE5A' : '#FFF4E0'} stroke={INK} strokeWidth={0.6} />
      </G>
    );
  }
  return null;
}

/** A polished chibi worker or customer with a contact shadow, feet at room point (x, y). */
export type Mood = 'smile' | 'focus' | 'happy' | 'o' | 'chew';
/** What a worker's hands are doing: cooks roll / toss / ladle; bakers hold an empty peel, a pizza, or slide one in. */
export type Act = 'none' | 'pin' | 'toss' | 'ladle' | 'peel' | 'pizza' | 'slide' | 'slice' | 'cup' | 'lean';

/** Props for one chibi figure. Role (`kind`) picks the uniform; look comes from `seed` unless overridden. */
export interface PersonProps {
  x: number;
  y: number;
  kind: Kind;
  seed?: number;
  // look overrides
  shirt?: string;
  hair?: string;
  cap?: string;
  dot?: string;
  gold?: boolean;
  alt?: boolean;
  // pose
  act?: Act;
  mood?: Mood;
  arm?: number;
  step?: number;
  flip?: boolean;
  front?: boolean;
  blink?: boolean;
  talk?: boolean;
  /** holding a pizza box; `carryWalk` holds it centred in both hands while walking */
  carry?: boolean;
  carryWalk?: boolean;
  peelK?: number;
  o?: number;
}

export function Person({ x, y, kind, shirt, arm = 0, flip = false, carry = false, carryWalk = false, step = 0, seed = 0, o = 1, front = false, blink = false, talk = false, act = 'none', mood = 'smile', alt = false, dot = '#D9443A', cap, gold = false, hair, peelK = 1 }: PersonProps) {
  const pin = act === 'pin';
  const [sx, sy] = P(x, y);
  const k = kAt(y) * 1.14;
  const sitting = kind === 'sit';
  const worker = kind === 'cook' || kind === 'baker' || kind === 'staff' || kind === 'driver';
  const look = lookFor(seed, worker);
  const hairC = hair ?? look.hair;
  // keep the light coming from the upper left on mirrored figures
  const unflipBody = flip ? 'translate(0.5 0) scale(-1 1)' : undefined;
  const unflipHead = flip ? 'translate(1 0) scale(-1 1)' : undefined;
  const top = kind === 'cook' ? '#FBF8F3' : kind === 'baker' ? shirt ?? '#B23A48' : kind === 'staff' ? '#3FAE5A' : kind === 'driver' ? '#2F80ED' : shirt ?? look.shirt;
  const sleeve = top;
  const pants = kind === 'cook' ? '#4A4A6E' : kind === 'baker' ? '#3B3B5C' : kind === 'staff' ? '#8C7356' : kind === 'driver' ? '#2E3A59' : look.pants;
  const skin = look.skin;
  const walking = step !== 0 && !sitting;
  const sw = walking ? Math.sin(step) : 0;
  const bob = walking ? Math.abs(Math.cos(step)) * 1.2 : 0;
  const by = (sitting ? -21 : -30) - bob - (sitting ? 0 : look.tall);
  const hy = by - 9;
  const ww = worker ? (look.wide > 0 ? 0.9 : 0) : look.wide * 1.1;
  // face layout: three-quarter (features toward +x) or front-facing (centred, ears both sides)
  const eyeX = front ? [-1.9, 2.9] : [2.4, 6.9];
  const fx = front ? 0.5 : 4.65;
  const torso = `M${-8 - ww} ${by + 3.5} Q${-8 - ww} ${by} ${-4.5} ${by} L5 ${by} Q${8.5 + ww} ${by} ${8.5 + ww} ${by + 3.5} L${8 + ww} ${by + 16.5} Q${8 + ww} ${by + 19} ${5.5 + ww} ${by + 19} L${-5.5 - ww} ${by + 19} Q${-7.6 - ww} ${by + 19} ${-7.6 - ww} ${by + 16.5} Z`;
  // front-arm hand position: working (arm), carrying, eating, or swinging
  const hand: [number, number] = carry
    ? carryWalk
      ? [5, by + 10]
      : [12, by + 8]
    : sitting
      ? act === 'slice'
        ? [7.5, hy + 5.5]
        : act === 'cup'
          ? [10.5, by + 6.5]
          : [12 + arm, by + 9 - arm]
      : act === 'toss'
        ? [5, hy - 14 - arm]
        : act === 'ladle'
          ? [10, by + 11 - arm]
          : pin
            ? [6 + arm, by + 13 - arm * 1.2]
            : worker && arm > 0
              ? [10 + arm, by + 13 - arm * 2]
              : [9 + sw * 2.5, by + 16];
  // a walking carrier holds the box centred in front, both hands on it
  const bx = carryWalk ? 10 : 3;
  const backHand: [number, number] = carry && carryWalk ? [-4, by + 10] : pin ? [hand[0] - 9, hand[1]] : sitting ? (act === 'lean' ? [-12, by + 3] : [-7, by + 15]) : [-8.5 - sw * 2.5, by + 15.5];
  const peel = kind === 'baker';
  return (
    <G opacity={o} transform={`translate(${sx.toFixed(1)} ${sy.toFixed(1)}) scale(${(flip ? -k : k).toFixed(3)} ${k.toFixed(3)})`}>
      {!sitting && <Ellipse cx={0.5} cy={0} rx={11.5} ry={3.4} fill="rgba(59,31,20,0.26)" />}
      {/* legs */}
      {sitting ? (
        <G>
          <Limb d={`M-2 ${by + 16} L8 ${by + 17}`} color={pants} w={6} />
          <Limb d={`M8.5 ${by + 17} L9.5 -2`} color={pants} w={5} />
          <Ellipse cx={11.4} cy={-1.6} rx={3.8} ry={2} fill="#3A2A24" {...OUT} strokeWidth={0.8} />
        </G>
      ) : (
        [-1, 1].map((side) => {
          const lx = side * 3.2 + (walking ? -side * sw * 2.8 : 0);
          const lift = walking ? Math.max(0, side * sw) * 1.6 : 0;
          return (
            <G key={side}>
              <Limb d={`M${side * 3} ${by + 17} L${lx} ${-2.5 - lift}`} color={side < 0 ? shade(pants, -0.12) : pants} w={4.8} />
              <Ellipse cx={lx + 1.6} cy={-1.4 - lift} rx={3.7} ry={2.1} fill="#3A2A24" {...OUT} strokeWidth={0.8} />
              <Ellipse cx={lx + 0.6} cy={-2.2 - lift} rx={1.4} ry={0.6} fill="#fff" opacity={0.3} />
            </G>
          );
        })
      )}
      {/* back arm */}
      <Limb d={`M-6 ${by + 4} Q${-8.5} ${by + 10} ${backHand[0]} ${backHand[1]}`} color={shade(sleeve, -0.18)} />
      <Circle cx={backHand[0]} cy={backHand[1]} r={2.3} fill={shade(skin, -0.12)} {...OUT} strokeWidth={0.8} />
      {/* back hair (behind the head) */}
      <Hair style={look.style === 5 ? 0 : look.style} color={hairC} hy={hy} part="back" />
      {/* torso with shadow side and highlight */}
      <Path d={torso} fill={top} {...OUT} />
      <G transform={unflipBody}>
        <Path d={`M3.5 ${by} L5 ${by} Q${8.5 + ww} ${by} ${8.5 + ww} ${by + 3.5} L${8 + ww} ${by + 16.5} Q${8 + ww} ${by + 19} ${5.5 + ww} ${by + 19} L3.5 ${by + 19} Z`} fill="#000" opacity={0.13} />
        <Rect x={-6.2 - ww} y={by + 2.5} width={2.4} height={9} rx={1.2} fill="#fff" opacity={0.25} />
      </G>
      {/* outfit details */}
      {kind === 'cook' && (
        <G>
          <Path d={`M-4 ${by} L4.5 ${by} L0.3 ${by + 5} Z`} fill="#E8432E" {...OUT} strokeWidth={0.8} />
          {[[-2.2, 7], [-2.2, 12], [3, 7], [3, 12]].map(([dx, dy], i) => <Circle key={i} cx={dx} cy={by + dy} r={0.9} fill="#C9C3BA" />)}
          <Path d={`M0.4 ${by + 5} V${by + 19}`} stroke="#E1DAD0" strokeWidth={0.8} />
        </G>
      )}
      {kind === 'baker' && (
        <G>
          <Path d={`M-5.5 ${by + 4} L6 ${by + 4} L6.8 ${by + 19} L-6.2 ${by + 19} Z`} fill="#8C5A3C" {...OUT} strokeWidth={0.9} />
          <Path d={`M-5 ${by + 4} L-3 ${by} M5.5 ${by + 4} L3.6 ${by}`} stroke="#8C5A3C" strokeWidth={1.4} />
          <Rect x={-3} y={by + 9} width={6.5} height={4} rx={1} fill="#A8714B" stroke={INK} strokeWidth={0.6} />
          <Path d={`M-2.5 ${by} Q0.5 ${by + 2.5} 3.5 ${by}`} fill={skin} />
        </G>
      )}
      {kind === 'staff' && alt && <Path d={`M-5.5 ${by + 6} L6 ${by + 6} L6.6 ${by + 19} L-6 ${by + 19} Z`} fill="#2E7D4A" {...OUT} strokeWidth={0.9} />}
      {kind === 'staff' && (
        <G>
          <Path d={`M-4 ${by} L0.5 ${by + 4} L5 ${by} L3 ${by - 0.5} L0.5 ${by + 2} L-2 ${by - 0.5} Z`} fill="#fff" {...OUT} strokeWidth={0.7} />
          <Rect x={-6} y={by + 6} width={5} height={3.2} rx={0.8} fill="#fff" stroke={INK} strokeWidth={0.6} />
          <Path d={`M-5 ${by + 7.6} h3`} stroke="#3FAE5A" strokeWidth={0.8} />
        </G>
      )}
      {kind === 'driver' && (
        <G>
          <Path d={`M0.5 ${by + 1} V${by + 19}`} stroke="#1F5FB8" strokeWidth={1.2} />
          <Path d={`M-3.5 ${by} L0.5 ${by + 3} L4.5 ${by}`} fill="none" stroke="#fff" strokeWidth={1.2} />
          <Circle cx={-4} cy={by + 8} r={2.4} fill="#D9443A" stroke="#fff" strokeWidth={0.7} />
          <Path d={`M-8 ${by + 14} H${8.5}`} stroke="#1F5FB8" strokeWidth={1.4} opacity={0.7} />
        </G>
      )}
      {/* guest outfits: 0 tee · 1 striped tee · 2 hoodie · 3 collared shirt · 4 cardigan · 5 overalls */}
      {!worker && look.outfit === 3 && (
        <G>
          <Path d={`M-3.6 ${by} L0.5 ${by + 3.4} L-1 ${by + 5.2} Z M4.6 ${by} L0.5 ${by + 3.4} L2 ${by + 5.2} Z`} fill="#fff" stroke={INK} strokeWidth={0.6} />
          {[7, 11, 15].map((d) => <Circle key={d} cx={0.5} cy={by + d} r={0.6} fill={shade(top, -0.4)} />)}
        </G>
      )}
      {!worker && look.outfit === 4 && (
        <G>
          <Path d={`M-2 ${by} L-1 ${by + 19} L2 ${by + 19} L3 ${by} Z`} fill={shade(top, 0.45)} />
          <Path d={`M-2 ${by} L-1 ${by + 19} M3 ${by} L2 ${by + 19}`} stroke={INK} strokeWidth={0.6} />
          {[6, 10.5, 15].map((d) => <Circle key={d} cx={-1.4} cy={by + d} r={0.7} fill="#fff" stroke={INK} strokeWidth={0.3} />)}
        </G>
      )}
      {!worker && look.outfit === 5 && (
        <G>
          <Path d={`M-5.5 ${by + 7} L6.5 ${by + 7} L7.4 ${by + 19} L-6.6 ${by + 19} Z`} fill="#4A6FA5" stroke={INK} strokeWidth={0.7} />
          <Path d={`M-4.5 ${by + 7} L-4 ${by} M5.5 ${by + 7} L5 ${by}`} stroke="#4A6FA5" strokeWidth={1.6} />
          <Circle cx={-4.4} cy={by + 7.6} r={0.7} fill="#E0B000" />
          <Circle cx={5.4} cy={by + 7.6} r={0.7} fill="#E0B000" />
          <Rect x={-2.5} y={by + 10} width={6} height={3.4} rx={0.8} fill="#3E5F8E" stroke={INK} strokeWidth={0.4} />
        </G>
      )}
      {!worker && look.outfit === 1 && [6, 10.5, 15].map((d) => <Path key={d} d={`M${-7.6 - ww} ${by + d} H${8 + ww}`} stroke="#fff" strokeWidth={1.6} opacity={0.55} />)}
      {!worker && look.outfit === 2 && (
        <G>
          <Path d={`M-6 ${by + 1} Q0.5 ${by + 7} 7 ${by + 1}`} fill={shade(top, -0.15)} stroke={INK} strokeWidth={0.8} />
          <Rect x={-4.5 - ww * 0.5} y={by + 11} width={10 + ww} height={5} rx={1.6} fill={shade(top, -0.12)} stroke={INK} strokeWidth={0.6} />
          <Path d={`M-1 ${by + 4} v4 M2 ${by + 4} v4`} stroke="#fff" strokeWidth={0.8} />
        </G>
      )}
      {!worker && (look.outfit === 0 || look.outfit === 1 || look.outfit === 5) && <Path d={`M-2.6 ${by} Q0.5 ${by + 3.4} 3.6 ${by}`} fill={skin} stroke={INK} strokeWidth={0.7} />}
      {/* head */}
      <Circle cx={0.5} cy={hy} r={9.6} fill={skin} {...OUT} />
      <G transform={unflipHead}>
        <Path d={`M5.3 ${hy - 8.3} A9.6 9.6 0 0 1 3.8 ${hy + 9} Q8 ${hy} 5.3 ${hy - 8.3} Z`} fill="#000" opacity={0.09} />
        <Circle cx={-2.8} cy={hy - 4.2} r={2.6} fill="#fff" opacity={0.28} />
      </G>
      {(front ? [-9, 10] : [-6]).map((ex) => (
        <G key={ex}>
          <Circle cx={ex} cy={hy + 1.2} r={2.3} fill={skin} {...OUT} strokeWidth={0.9} />
          <Path d={`M${ex - 0.6} ${hy + 0.4} q0.8 0.9 0 1.8`} stroke={shade(skin, -0.25)} strokeWidth={0.7} fill="none" />
        </G>
      ))}
      {/* face: eyes with catchlights (or a blink), brows, nose, mouth, blush */}
      {eyeX.map((ex) => (
        <G key={ex}>
          {blink ? (
            <Path d={`M${ex - 1.3} ${hy - 0.2} q1.3 0.9 2.6 0`} stroke={INK} strokeWidth={0.9} fill="none" strokeLinecap="round" />
          ) : mood === 'happy' ? (
            <Path d={`M${ex - 1.3} ${hy + 0.2} q1.3 -2 2.6 0`} stroke={INK} strokeWidth={1} fill="none" strokeLinecap="round" />
          ) : (
            <G>
              <Ellipse cx={ex} cy={hy - 0.4} rx={1.25} ry={1.65} fill={INK} />
              <Circle cx={ex + 0.4} cy={hy - 1} r={0.5} fill="#fff" />
            </G>
          )}
          <Path d={mood === 'focus' ? (ex === eyeX[0] ? `M${ex - 1.4} ${hy - 4.2} l2.8 0.9` : `M${ex - 1.4} ${hy - 3.3} l2.8 -0.9`) : `M${ex - 1.4} ${hy - 3.6} q1.4 -0.9 2.8 0`} stroke={worker ? INK : hairC} strokeWidth={0.9} fill="none" strokeLinecap="round" />
        </G>
      ))}
      {look.trait === 1 && (
        <G>
          <Circle cx={eyeX[0]} cy={hy - 0.4} r={2.5} fill="rgba(255,255,255,0.35)" stroke={INK} strokeWidth={1.1} />
          <Circle cx={eyeX[1]} cy={hy - 0.4} r={2.5} fill="rgba(255,255,255,0.35)" stroke={INK} strokeWidth={1.1} />
          <Path d={`M${eyeX[0] + 2.5} ${hy - 0.7} L${eyeX[1] - 2.5} ${hy - 0.7}`} stroke={INK} strokeWidth={1.1} />
        </G>
      )}
      <Ellipse cx={front ? 0.5 : 8.6} cy={hy + 1.6} rx={0.9} ry={0.75} fill={shade(skin, -0.2)} />
      {talk || mood === 'o' ? (
        <Ellipse cx={fx} cy={hy + 4.4} rx={1.3} ry={1.6} fill="#B5462E" stroke={INK} strokeWidth={0.8} />
      ) : mood === 'focus' ? (
        <Path d={`M${fx - 1.5} ${hy + 4.2} h3`} stroke={INK} strokeWidth={0.95} strokeLinecap="round" />
      ) : mood === 'chew' ? (
        <Path d={`M${fx - 1.2} ${hy + 4} q1.2 0.8 2.4 0`} stroke={INK} strokeWidth={0.95} fill="none" strokeLinecap="round" />
      ) : (
        <Path d={`M${fx - 1.9} ${hy + 3.6} q1.9 ${mood === 'happy' ? 2.6 : 1.9} 3.8 0`} stroke={INK} strokeWidth={0.95} fill={mood === 'happy' ? '#B5462E' : 'none'} strokeLinecap="round" />
      )}
      {mood === 'chew' && (
        <G>
          <Circle cx={front ? -3.4 : 1} cy={hy + 3} r={2.2} fill={skin} stroke={INK} strokeWidth={0.6} />
          <Circle cx={front ? 4.4 : 9} cy={hy + 2.8} r={2} fill={skin} stroke={INK} strokeWidth={0.6} />
        </G>
      )}
      <Ellipse cx={front ? -3.6 : 0.8} cy={hy + 2.6} rx={1.5} ry={0.95} fill="#F28B82" opacity={0.55} />
      <Ellipse cx={front ? 4.6 : 9.2} cy={hy + 2.4} rx={front ? 1.5 : 1.1} ry={0.9} fill="#F28B82" opacity={0.5} />
      {look.trait === 2 && <Path d={`M${fx - 4.2} ${hy + 3.2} q2.1 -2.3 4.2 -0.5 q2.1 -1.8 4.2 0.5 q-2.1 1.5 -4.2 0.3 q-2.1 1.2 -4.2 -0.3 Z`} fill={hairC} stroke={INK} strokeWidth={0.9} />}
      {look.trait === 3 &&
        [[-1.4, 1.6], [-0.4, 2.4], [0.6, 1.5], [1.6, 2.3]].map(([dx, dy], i) => (
          <Circle key={i} cx={(front ? -3.6 : 0.8) + dx * 1.2} cy={hy + dy} r={0.7} fill="#A8552F" opacity={0.85} />
        ))}
      {/* hair + headwear */}
      {worker ? <Path d={`M-9.4 ${hy + 0.5} Q-9.8 ${hy - 4} -7.5 ${hy - 5} L-6 ${hy + 0.5} Z`} fill={hairC} /> : <Hair style={look.style} color={hairC} hy={hy} part="front" />}
      {/* hair shows under every hat */}
      {worker && kind !== 'baker' && (
        <Path
          d={front ? `M-7 ${hy - 6.4} Q-6 ${hy - 3} -3.5 ${hy - 4.4} Q-1.5 ${hy - 2.6} 0.8 ${hy - 4.3} Q3 ${hy - 2.6} 5.2 ${hy - 4.4} Q7.5 ${hy - 3} 8.2 ${hy - 6.4} Z` : `M-2 ${hy - 6.6} Q1 ${hy - 3.2} 4 ${hy - 4.8} Q6.5 ${hy - 3} 9.2 ${hy - 5.4} L9 ${hy - 7} Z`}
          fill={hairC}
          stroke={INK}
          strokeWidth={0.6}
        />
      )}
      {kind === 'baker' && <Circle cx={-9.5} cy={hy + 4.5} r={3.6} fill={hairC} {...OUT} strokeWidth={0.8} />}
      <Headwear kind={kind} hy={hy} front={front} alt={alt} dot={dot} cap={cap} />
      {gold && kind === 'cook' && <Rect x={-6.2} y={hy - 11.6} width={13.6} height={2.2} rx={1} fill="#E0B000" stroke={INK} strokeWidth={0.5} />}
      {worker && look.trait === 4 && <Path d={`M${front ? -1 : 3} ${hy - 6.5} q-2.5 2.6 -0.4 4 q0.6 -2 2.6 -2.2 q-0.2 2 1.6 2.6 q0.8 -2.4 -1 -4.4 Z`} fill={hairC} stroke={INK} strokeWidth={0.6} />}
      {/* front arm + props */}
      {peel && (
        <G transform={`${act === 'slide' ? `rotate(62 ${hand[0]} ${hand[1]})` : `rotate(-8 ${hand[0]} ${hand[1]})`} translate(${hand[0]} ${hand[1]}) scale(${peelK}) translate(${-hand[0]} ${-hand[1]})`}>
          <Path d={`M${hand[0] + 1} ${hand[1] + 9} L${hand[0] + 2.5} ${hand[1] - 18}`} stroke={INK} strokeWidth={3.4} strokeLinecap="round" />
          <Path d={`M${hand[0] + 1} ${hand[1] + 9} L${hand[0] + 2.5} ${hand[1] - 18}`} stroke="#C99A6B" strokeWidth={1.8} strokeLinecap="round" />
          <Path d={`M${hand[0] - 1.5} ${hand[1] - 17} Q${hand[0] - 2} ${hand[1] - 29} ${hand[0] + 3} ${hand[1] - 29} Q${hand[0] + 8} ${hand[1] - 29} ${hand[0] + 7} ${hand[1] - 17} Z`} fill="#D9B48A" {...OUT} strokeWidth={0.9} />
          {act !== 'peel' && (
            <G>
              <Ellipse cx={hand[0] + 2.7} cy={hand[1] - 23} rx={4.6} ry={4.4} fill="#E9A64B" {...OUT} strokeWidth={0.7} />
              <Ellipse cx={hand[0] + 2.7} cy={hand[1] - 23} rx={3.5} ry={3.3} fill="#FFC531" />
              {[[-1.2, -1], [1.4, 0.4], [-0.4, 1.6]].map(([dx, dy], i) => <Circle key={i} cx={hand[0] + 2.7 + dx} cy={hand[1] - 23 + dy} r={0.8} fill="#E8432E" />)}
            </G>
          )}
        </G>
      )}
      <Limb d={act === 'toss' ? `M6.5 ${by + 4} L${10.5} ${by - 3} L${hand[0]} ${hand[1]}` : `M6.5 ${by + 4} Q${9.5} ${by + 9} ${hand[0]} ${hand[1]}`} color={sleeve} />
      {kind === 'cook' || kind === 'baker' ? <Path d={`M${hand[0] - 2.4} ${hand[1] - 2.2} l2.8 -1`} stroke={kind === 'cook' ? '#E1DAD0' : '#7E2A35'} strokeWidth={1.2} /> : null}
      {pin && (
        <G>
          <Rect x={hand[0] - 10.5} y={hand[1] - 1.8} width={14} height={3.6} rx={1.8} fill="#E2B985" {...OUT} strokeWidth={0.8} />
          <Rect x={hand[0] - 9.5} y={hand[1] - 1.4} width={12} height={1.1} rx={0.5} fill="#fff" opacity={0.4} />
        </G>
      )}
      {act === 'toss' && (
        <G>
          <Ellipse cx={hand[0] + 0.5} cy={hand[1] - 5 - arm * 2} rx={6.5} ry={1.9} fill="#F0C98A" stroke="#C98A4B" strokeWidth={1.1} transform={`rotate(-15 ${hand[0] + 0.5} ${hand[1] - 5 - arm * 2})`} />
          <Ellipse cx={hand[0] - 0.8} cy={hand[1] - 5.5 - arm * 2} rx={3} ry={0.7} fill="#FFF1D6" opacity={0.8} />
          <Path d={`M${hand[0] - 7} ${hand[1] - 9 - arm * 2} q-2 3 0 6 M${hand[0] + 8} ${hand[1] - 9 - arm * 2} q2 3 0 6`} stroke={INK} strokeWidth={0.7} fill="none" opacity={0.6} strokeLinecap="round" />
        </G>
      )}
      {act === 'ladle' && (
        <G>
          <Path d={`M${hand[0]} ${hand[1]} L${hand[0] + 4} ${hand[1] + 8}`} stroke={INK} strokeWidth={2.2} strokeLinecap="round" />
          <Path d={`M${hand[0]} ${hand[1]} L${hand[0] + 4} ${hand[1] + 8}`} stroke="#BFC4CA" strokeWidth={1} strokeLinecap="round" />
          <Path d={`M${hand[0] + 1} ${hand[1] + 8} Q${hand[0] + 4} ${hand[1] + 13} ${hand[0] + 7.5} ${hand[1] + 8} Z`} fill="#D9443A" {...OUT} strokeWidth={0.8} />
        </G>
      )}
      <Circle cx={hand[0]} cy={hand[1]} r={2.4} fill={skin} {...OUT} strokeWidth={0.8} />
      {pin && <Circle cx={hand[0] - 9} cy={hand[1]} r={2.1} fill={shade(skin, -0.08)} {...OUT} strokeWidth={0.7} />}
      {/* seated poses: a slice raised to the mouth, or a mug */}
      {act === 'slice' && (
        <G>
          <Path d={`M${hand[0] - 1} ${hand[1] - 1} L${hand[0] + 6} ${hand[1] - 5} L${hand[0] + 4} ${hand[1] + 3} Z`} fill="#FFC531" stroke={INK} strokeWidth={0.7} strokeLinejoin="round" />
          <Circle cx={hand[0] + 3.4} cy={hand[1] - 1.4} r={0.8} fill="#E8432E" />
        </G>
      )}
      {act === 'cup' && (
        <G>
          <Rect x={hand[0] - 1} y={hand[1] - 5.5} width={4.5} height={5.5} rx={0.8} fill="#FFFFFF" stroke={INK} strokeWidth={0.8} />
          <Path d={`M${hand[0] + 3.5} ${hand[1] - 4.5} q2 0.5 0 3`} stroke={INK} strokeWidth={0.8} fill="none" />
          <Path d={`M${hand[0]} ${hand[1] - 7.5} q1 -1.5 0 -3 M${hand[0] + 2.2} ${hand[1] - 7.5} q1 -1.5 0 -3`} stroke="#C9C3BA" strokeWidth={0.6} fill="none" />
        </G>
      )}
      {carry && (
        <G>
          <Rect x={hand[0] - bx} y={hand[1] - 6.5} width={17} height={6} rx={1.2} fill="#F6E7C1" {...OUT} strokeWidth={0.9} />
          <Rect x={hand[0] - bx} y={hand[1] - 6.5} width={17} height={1.8} rx={0.9} fill="#fff" opacity={0.5} />
          <Circle cx={hand[0] - bx + 8.5} cy={hand[1] - 3.5} r={1.7} fill="#E8432E" />
        </G>
      )}
    </G>
  );
}
