// "Coming soon: <the next city>" (SHEETS slot): shown once, the first time the player is back on the game screen after the last finale. It is
// remembered on the device (like the title card's day), so it never opens twice. What it says is the next pack's teaser (`teaserFor`) and its
// skyline is the one that pack's art registers (cities/index.ts); with no next pack there is no card.
import AsyncStorage from '@react-native-async-storage/async-storage';
import { memo, useEffect, useState } from 'react';

import { teaserFor } from '../../content/cities';
import { finaleSeen } from '../../engine/features/counterattack';
import { nextCity } from '../../engine/features/franchise';
import { gameCovered, useGame } from '../../store/game-store';
import { CITIES } from '../cities';
import { seenKey } from '../cities/next-city';
import { SoonCard } from '../title-card';

export const NextCitySheet = memo(function NextCitySheet() {
  const teaser = useGame((s) => teaserFor(s.game));
  const next = useGame((s) => nextCity(s.game));
  // after the finale's scene, the return popup and the title card
  const due = useGame((s) => finaleSeen(s.game) && s.titleDone && !gameCovered(s));
  const [state, setState] = useState<'unknown' | 'show' | 'seen'>('unknown');
  const key = next ? seenKey(next) : null;
  useEffect(() => {
    if (!due || !key || !teaser || state !== 'unknown') return;
    let alive = true;
    AsyncStorage.getItem(key)
      .catch(() => 'x')
      .then((v) => alive && setState(v ? 'seen' : 'show'));
    return () => {
      alive = false;
    };
  }, [due, key, teaser, state]);
  if (!due || !key || !teaser || state !== 'show') return null;
  return (
    <SoonCard
      teaser={teaser}
      skyline={(next && CITIES[next]?.teaserSkyline) || null}
      onDone={() => {
        setState('seen');
        AsyncStorage.setItem(key, '1').catch(() => {});
      }}
    />
  );
});
