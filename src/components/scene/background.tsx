import { memo, type ReactElement } from 'react';
import type { NeighborhoodId } from '../../content/types';
import { Circle, Defs, G, LinearGradient, Path, Rect, Stop } from 'react-native-svg';
import { INK, SCENE_W, shade } from './projection';

// ---------- background: sky, skyline, trees ----------
export function Tree({ x, y, k, c = '#4FA048', palm = false }: { x: number; y: number; k: number; c?: string; palm?: boolean }) {
  if (palm) {
    return (
      <G transform={`translate(${x} ${y}) scale(${k})`}>
        <Path d="M-2 40 Q-6 10 2 -26 L6 -26 Q2 10 4 40 Z" fill="#9C6B3F" stroke={INK} strokeWidth={1} />
        {[-60, -25, 15, 50, 85].map((a) => (
          <Path key={a} d={`M4 -28 q${Math.cos((a * Math.PI) / 180) * 18} ${-10 + Math.sin((a * Math.PI) / 180) * 6} ${Math.cos((a * Math.PI) / 180) * 30} ${Math.sin((a * Math.PI) / 180) * 14}`} stroke={c} strokeWidth={7} fill="none" strokeLinecap="round" />
        ))}
      </G>
    );
  }
  return (
    <G transform={`translate(${x} ${y}) scale(${k})`}>
      <Rect x={-4} y={-6} width={8} height={44} fill="#7A4A26" stroke={INK} strokeWidth={1} />
      <Circle cx={0} cy={-22} r={22} fill={shade(c, -0.15)} stroke={INK} strokeWidth={1.1} />
      <Circle cx={-12} cy={-12} r={15} fill={c} stroke={INK} strokeWidth={1.1} />
      <Circle cx={12} cy={-14} r={16} fill={c} stroke={INK} strokeWidth={1.1} />
      <Circle cx={-4} cy={-30} r={14} fill={shade(c, 0.18)} />
      <Circle cx={-7} cy={-33} r={5} fill={shade(c, 0.4)} opacity={0.7} />
    </G>
  );
}

// Each neighbourhood gets its own sky, ground, skyline and side props.
export const LOOK: Record<NeighborhoodId, { sky: [string, string, string]; ground: string; ground2: string }> = {
  downtown: { sky: ['#5FA8E8', '#B9DEF8', '#EAF6FF'], ground: '#9CCB86', ground2: '#86BA72' },
  suburbs: { sky: ['#72BDF0', '#CDE9FA', '#FFF3DC'], ground: '#A6D48A', ground2: '#8FC475' },
  waterfront: { sky: ['#4FB3EA', '#BDE7FA', '#E9FAFF'], ground: '#E8D7A8', ground2: '#D9C48E' },
  university: { sky: ['#8A86DE', '#C9C2F2', '#F6EEFF'], ground: '#97C786', ground2: '#7FB471' },
  industrial: { sky: ['#8E9DAA', '#B8C2C9', '#DDE2E5'], ground: '#A8A497', ground2: '#949082' },
  uptown: { sky: ['#3E4A8C', '#C98BA8', '#FBD3AE'], ground: '#8FBF7E', ground2: '#78AA6B' },
};

export function Windows({ x, y, w, h, c }: { x: number; y: number; w: number; h: number; c: string }) {
  const cols = Math.max(1, Math.floor((w - 6) / 9));
  const rows = Math.max(1, Math.floor((h - 8) / 12));
  return (
    <G>
      {Array.from({ length: cols * rows }).map((_, i) => (
        <Rect key={i} x={x + 5 + (i % cols) * 9} y={y + 6 + Math.floor(i / cols) * 12} width={4.5} height={6} rx={0.8} fill={c} />
      ))}
    </G>
  );
}

export const SKYLINE: Record<NeighborhoodId, () => ReactElement> = {
  downtown: () => (
    <G>
      {[[-6, 150, 40], [36, 186, 34], [72, 120, 30], [292, 170, 36], [330, 130, 30], [362, 196, 40]].map(([x, h, w], i) => (
        <G key={i}>
          <Rect x={x} y={200 - h} width={w} height={h} fill={i % 2 ? '#93A6C4' : '#A9B8D0'} stroke="#7F92B0" strokeWidth={0.8} />
          <Windows x={x} y={200 - h} w={w} h={h} c="#D8E3F2" />
        </G>
      ))}
    </G>
  ),
  suburbs: () => (
    <G>
      {[[-4, '#F6E7C1', 118], [306, '#FADADD', 104], [352, '#D6EAF8', 128]].map(([x, c, top], i) => {
        const X = x as number;
        const T = top as number;
        return (
          <G key={i}>
            <Rect x={X} y={T} width={46} height={214 - T} fill={c as string} stroke="#B9A78E" strokeWidth={0.8} />
            <Path d={`M${X - 6} ${T + 2} L${X + 23} ${T - 26} L${X + 52} ${T + 2} Z`} fill="#C9775F" stroke="#A85E49" strokeWidth={0.8} />
            <Rect x={X + 30} y={T - 22} width={7} height={12} fill="#A85E49" />
            {[0, 1].map((r) => [0, 1].map((cc) => <Rect key={`${r}${cc}`} x={X + 7 + cc * 20} y={T + 12 + r * 30} width={11} height={12} fill="#BFE3F5" stroke="#8E7A62" strokeWidth={0.6} />))}
          </G>
        );
      })}
      {/* picket fences and a mailbox in the yards */}
      {[[-10, 64], [326, 404]].map(([x0, x1]) => (
        <G key={x0}>
          <Path d={`M${x0} 300 H${x1} M${x0} 310 H${x1}`} stroke="#E9E4DC" strokeWidth={2.2} />
          {Array.from({ length: Math.ceil((x1 - x0) / 9) }).map((_, i) => (
            <Path key={i} d={`M${x0 + i * 9 + 1} 318 V296 l2.5 -4 l2.5 4 V318 Z`} fill="#FFFFFF" stroke="#B9B2A8" strokeWidth={0.7} />
          ))}
        </G>
      ))}
      <Rect x={368} y={282} width={3} height={36} fill="#7A4A26" />
      <Path d="M360 272 h18 v10 h-18 Z" fill="#3F7FB0" stroke={INK} strokeWidth={0.9} />
      <Path d="M376 268 v-8 h6 v4 h-6" fill="#E8432E" stroke={INK} strokeWidth={0.7} />
    </G>
  ),
  waterfront: () => (
    <G>
      <Rect x={-20} y={176} width={440} height={60} fill="#5BB8E8" />
      <Rect x={-20} y={176} width={440} height={8} fill="#8FD3F4" />
      {[192, 210, 226].map((yy, j) => (
        <Path key={yy} d={`M${-10 + j * 14} ${yy} ${Array.from({ length: 12 }).map((_, i) => `q10 -4 20 0 t20 0`).join(' ')}`} stroke="#D6F0FB" strokeWidth={1.6} fill="none" opacity={0.8} />
      ))}
      {/* sailboat and pier at the sides */}
      <Path d="M8 176 L48 176 L42 186 L14 186 Z M28 174 L28 136 L50 172 Z" fill="#fff" stroke="#7FA6C0" strokeWidth={1} />
      <Rect x={330} y={226} width={80} height={6} fill="#A8714B" stroke={INK} strokeWidth={0.8} />
      {[336, 356, 376, 396].map((px) => <Rect key={px} x={px} y={230} width={4} height={18} fill="#7A4A26" />)}
      <Rect x={-20} y={226} width={70} height={6} fill="#A8714B" stroke={INK} strokeWidth={0.8} />
      {[-4, 16, 36].map((px) => <Rect key={px} x={px} y={230} width={4} height={18} fill="#7A4A26" />)}
    </G>
  ),
  university: () => (
    <G fill="#B9A6DE" stroke="#9A86C4" strokeWidth={0.8}>
      <Rect x={-10} y={120} width={84} height={84} />
      <Path d="M-16 122 L32 92 L80 122 Z" />
      <Windows x={-10} y={126} w={84} h={70} c="#EDE4FF" />
      <Rect x={310} y={76} width={26} height={128} />
      <Path d="M306 78 L323 50 L340 78 Z" />
      <Circle cx={323} cy={96} r={7} fill="#fff" />
      <Rect x={346} y={140} width={60} height={64} />
      <Windows x={346} y={140} w={60} h={60} c="#EDE4FF" />
    </G>
  ),
  industrial: () => (
    <G>
      <Path d="M-10 204 L-10 150 L26 166 L26 150 L62 166 L62 150 L98 166 L98 204 Z" fill="#9A968E" stroke="#827E76" strokeWidth={0.8} />
      {[[300, 40], [330, 70], [362, 30]].map(([x, top], i) => (
        <G key={i}>
          <Rect x={x} y={top} width={16} height={204 - top} fill="#8E8A83" stroke="#76726B" strokeWidth={0.8} />
          <Rect x={x} y={top + 10} width={16} height={6} fill="#C8463A" />
          <Circle cx={x + 8} cy={top - 10} r={10} fill="#ECEAE6" opacity={0.75} />
          <Circle cx={x + 18} cy={top - 26} r={14} fill="#ECEAE6" opacity={0.5} />
        </G>
      ))}
      <Rect x={10} y={120} width={14} height={84} fill="#8E8A83" stroke="#76726B" strokeWidth={0.8} />
      <Circle cx={17} cy={108} r={11} fill="#ECEAE6" opacity={0.7} />
    </G>
  ),
  uptown: () => (
    <G>
      {[[-6, 190, 36], [30, 230, 34], [64, 160, 30], [288, 210, 34], [322, 250, 36], [358, 180, 40]].map(([x, h, w], i) => (
        <G key={i}>
          <Rect x={x} y={204 - h} width={w} height={h} fill={i % 2 ? '#6E6FA0' : '#8487B5'} stroke="#5B5C8C" strokeWidth={0.8} />
          <Windows x={x} y={204 - h} w={w} h={h} c="#FFE7A0" />
        </G>
      ))}
    </G>
  ),
};

/** Chain-link fence segment (Industrial). */
export function Fence({ x0, x1, y }: { x0: number; x1: number; y: number }) {
  return (
    <G>
      <Rect x={x0} y={y - 34} width={x1 - x0} height={34} fill="none" />
      {Array.from({ length: Math.ceil((x1 - x0) / 8) }).map((_, i) => (
        <Path key={i} d={`M${x0 + i * 8} ${y} l8 -34 M${x0 + i * 8 + 8} ${y} l-8 -34`} stroke="#8E959B" strokeWidth={0.7} />
      ))}
      {Array.from({ length: Math.ceil((x1 - x0) / 32) + 1 }).map((_, i) => (
        <Rect key={i} x={x0 + i * 32 - 1.5} y={y - 36} width={3} height={36} fill="#6E757B" />
      ))}
      <Path d={`M${x0} ${y - 34} H${x1}`} stroke="#6E757B" strokeWidth={2} />
    </G>
  );
}

/** `L`/`R`: the room's side walls; edge props only appear where they show whole beside the shop. */
export const Backdrop = memo(function Backdrop({ id, L = 0, R = SCENE_W }: { id: NeighborhoodId; L?: number; R?: number }) {
  const look = LOOK[id];
  const palm = id === 'waterfront';
  const treeC = id === 'uptown' ? '#3F8F4A' : '#4FA048';
  const trees = id !== 'industrial';
  return (
    <G>
      <Defs>
        <LinearGradient id="sky" x1="0" y1="-40" x2="0" y2="300" gradientUnits="userSpaceOnUse">
          <Stop offset="0" stopColor={look.sky[0]} />
          <Stop offset="0.55" stopColor={look.sky[1]} />
          <Stop offset="1" stopColor={look.sky[2]} />
        </LinearGradient>
      </Defs>
      <Rect x={-20} y={-400} width={SCENE_W + 40} height={1100} fill="url(#sky)" />
      {id === 'uptown' && <Circle cx={60} cy={150} r={26} fill="#FFD8A0" opacity={0.85} />}
      {SKYLINE[id]()}
      <Path d={`M-10 214 Q60 186 130 206 Q200 180 270 204 Q330 184 403 202 L403 700 L-10 700 Z`} fill={look.ground} />
      <Path d={`M-10 262 Q90 246 196 258 Q300 246 403 260 L403 700 L-10 700 Z`} fill={look.ground2} />
      {trees && (
        <G>
          <Tree x={14} y={262} k={1.15} c={treeC} palm={palm} />
          <Tree x={46} y={330} k={0.9} c={shade(treeC, 0.1)} palm={palm} />
          <Tree x={352} y={252} k={1.0} c={shade(treeC, 0.1)} palm={palm} />
          <Tree x={382} y={330} k={1.2} c={treeC} palm={palm} />
        </G>
      )}
      {id === 'industrial' && (
        <G>
          <Fence x0={-10} x1={70} y={330} />
          <Fence x0={326} x1={404} y={330} />
          {[[30, 380], [352, 370]].filter(([x]) => (x < 196 ? x + 14 < L - 6 : x - 14 > R + 6)).map(([x, y]) => (
            <G key={x}>
              <Rect x={x - 12} y={y - 22} width={24} height={22} rx={2} fill="#3F7FB0" stroke={INK} strokeWidth={1} />
              {[0, 7, 14].map((d) => <Path key={d} d={`M${x - 12} ${y - 18 + d} H${x + 12}`} stroke="#2E6690" strokeWidth={1.4} />)}
            </G>
          ))}
        </G>
      )}
    </G>
  );
});
