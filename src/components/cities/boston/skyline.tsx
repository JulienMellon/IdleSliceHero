// What stands behind Boston's shops on the street, and along the foot of the card that announces the city. Drawing only: the colours are shop.ts's.
import type { ComponentType, ReactElement } from 'react';
import { G, Path, Rect } from 'react-native-svg';

import { INK } from '../../scene/projection';
import type { CityArt, WindowsProps } from '../types';
import { BOSTON_LOOKS } from './shop';

/** A Boston neighbourhood's skyline: its building colours and heights (BOSTON_LOOKS), three beside the shop on each side, and its signature piece (the church steeple, the ballpark's light towers). */
const skylineOf =
  (id: string, Windows: ComponentType<WindowsProps>): (() => ReactElement) =>
  () => {
    const L = BOSTON_LOOKS[id];
    const slots: [number, number][] = [
      [-6, 36],
      [30, 34],
      [64, 30],
      [288, 34],
      [322, 36],
      [358, 40],
    ];
    return (
      <G>
        {slots.map(([x, w], i) => {
          const [, , top, c] = L.buildings[i % L.buildings.length];
          const h = 140 - top - (i % 3) * 10;
          return (
            <G key={i}>
              <Rect x={x} y={200 - h} width={w} height={h} fill={c} stroke={L.trim} strokeWidth={0.8} />
              <Windows x={x} y={200 - h} w={w} h={h} c={L.glass} />
              {L.sig === 'steeple' && i === 1 && (
                <Path
                  d={`M${x + 4} ${200 - h} L${x + w / 2} ${200 - h - 34} L${x + w - 4} ${200 - h} Z`}
                  fill={L.trim}
                  stroke={INK}
                  strokeWidth={0.8}
                  strokeLinejoin="round"
                />
              )}
              {L.sig === 'towers' && (i === 2 || i === 3) && (
                <Path
                  d={`M${x + w / 2} ${200 - h} V${200 - h - 28} M${x + w / 2 - 8} ${200 - h - 28} H${x + w / 2 + 8}`}
                  stroke={L.glass}
                  strokeWidth={2.4}
                  strokeLinecap="round"
                />
              )}
            </G>
          );
        })}
      </G>
    );
  };

export const BOSTON_SKYLINES: CityArt['skylines'] = ({ Windows }) =>
  Object.fromEntries(Object.keys(BOSTON_LOOKS).map((id) => [id, skylineOf(id, Windows)]));

/** D460: along the foot of the "Coming soon" card, a tower, the dome of a statehouse and brownstones (a viewBox 0 0 200 60 drawing). */
export const BOSTON_TEASER_SKYLINE = (
  <>
    <Path
      d="M0 60 V44 H10 V36 H18 V44 H26 V30 H30 V20 L33 12 L36 20 V30 H40 V40 H52 V26 H62 V40 H70 V34 H78 V44 H88 V38 Q96 22 104 38 V44 H112 V32 H120 V14 H126 V32 H134 V42 H146 V28 H158 V42 H168 V36 H178 V44 H188 V38 H200 V60 Z"
      fill="#8F2216"
    />
    <Path d="M0 60 V50 H14 V46 H24 V50 H44 V44 H58 V50 H90 V46 H106 V50 H140 V45 H152 V50 H176 V47 H200 V60 Z" fill="#6F1A10" />
  </>
);
