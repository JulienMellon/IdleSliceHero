import { memo } from 'react';
import { Defs, LinearGradient, Stop } from 'react-native-svg';
import { OVEN_GRADES } from '../../content/tuning';
import { shade } from './projection';

/** Gradients shared by the scene; static, so mounted once rather than rebuilt every frame. */
export const SceneDefs = memo(function SceneDefs() {
  return (
    <Defs>
      <LinearGradient id="sheen" x1="0" y1="0" x2="1" y2="1">
        <Stop offset="0" stopColor="#FFFFFF" stopOpacity={0} />
        <Stop offset="0.45" stopColor="#FFFFFF" stopOpacity={0.35} />
        <Stop offset="0.6" stopColor="#FFFFFF" stopOpacity={0} />
      </LinearGradient>
      <LinearGradient id="glass" x1="0" y1="0" x2="0" y2="1">
        <Stop offset="0" stopColor="#A9D4EC" stopOpacity={0.6} />
        <Stop offset="1" stopColor="#A9D4EC" stopOpacity={0.4} />
      </LinearGradient>
      <LinearGradient id="ember" x1="0" y1="0" x2="0" y2="1">
        <Stop offset="0" stopColor="#5A1A0A" />
        <Stop offset="0.45" stopColor="#E8432E" />
        <Stop offset="1" stopColor="#FFB23A" />
      </LinearGradient>
      {OVEN_GRADES.map((g, i) => (
        <LinearGradient key={i} id={`oven${i}`} x1="0" y1="0" x2="1" y2="0">
          <Stop offset="0" stopColor={shade(g.color, 0.3)} />
          <Stop offset="0.5" stopColor={g.color} />
          <Stop offset="1" stopColor={shade(g.color, -0.35)} />
        </LinearGradient>
      ))}
    </Defs>
  );
});
