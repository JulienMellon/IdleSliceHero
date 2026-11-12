// "Coming soon: Boston" (SHEETS slot): shown once, the first time the player is back on the game screen after the last finale. It is
// remembered on the device (like the title card's day), so it never opens twice; the City screen's locked seventh tile shows it again.
import AsyncStorage from '@react-native-async-storage/async-storage';
import { memo, useEffect, useState } from 'react';

import { finaleSeen } from '../../engine/features/counterattack';
import { gameCovered, useGame } from '../../store/game-store';
import { SoonCard } from '../title-card';

export const SEEN_KEY = 'slice-empire/boston-seen';

export const BostonSheet = memo(function BostonSheet() {
  // after the finale's scene, the return popup and the title card
  const due = useGame((s) => finaleSeen(s.game) && s.titleDone && !gameCovered(s));
  const [state, setState] = useState<'unknown' | 'show' | 'seen'>('unknown');
  useEffect(() => {
    if (!due || state !== 'unknown') return;
    let alive = true;
    AsyncStorage.getItem(SEEN_KEY)
      .catch(() => 'x')
      .then((v) => alive && setState(v ? 'seen' : 'show'));
    return () => {
      alive = false;
    };
  }, [due, state]);
  if (!due || state !== 'show') return null;
  return (
    <SoonCard
      onDone={() => {
        setState('seen');
        AsyncStorage.setItem(SEEN_KEY, '1').catch(() => {});
      }}
    />
  );
});
