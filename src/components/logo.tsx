// The Slice Empire mark in the app (title card), drawn from the same data as the icon and splash PNGs.
import { memo } from 'react';
import Svg, { Circle, Path } from 'react-native-svg';

import { LOGO_SHAPES } from './logo-art';

export const Logo = memo(function Logo({ size }: { size: number }) {
  return (
    <Svg width={size} height={size} viewBox="0 0 200 200">
      {LOGO_SHAPES.map((sh, i) =>
        sh.k === 'path' ? (
          <Path key={i} d={sh.d} fill={sh.fill} stroke={sh.stroke} strokeWidth={sh.sw} strokeLinejoin="round" strokeLinecap="round" />
        ) : (
          <Circle key={i} cx={sh.cx} cy={sh.cy} r={sh.r} fill={sh.fill} stroke={sh.stroke} strokeWidth={sh.sw} />
        ),
      )}
    </Svg>
  );
});
