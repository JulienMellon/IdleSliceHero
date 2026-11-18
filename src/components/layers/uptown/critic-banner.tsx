// The critic's notices (BANNERS slot): "A critic is dining here!" with Genevieve's warning when the figure comes in, and the pass or fail
// moment with her line when the visit ends. The moment stays MOMENT_MS, then the UI acknowledges the result (the store clears it). A pass
// also cheers the kitchen. Whichever shop is on screen.
import { memo, useEffect } from 'react';

import { criticView } from '../../../engine/features/layers/uptown-stars';
import { useGame } from '../../../store/game-store';
import { builtHood } from '../city-layers';
import { emitCheer } from '../../pulse-bus';
import { LayerToast, useChangeToast } from '../university/layer-ui';
import { arrival, criticPhase, moment, MOMENT_MS } from './critic-model';

export const CriticBanner = memo(function CriticBanner() {
  const walking = useGame((s) => (builtHood(s.game, 'stars') ? criticPhase(criticView(s.game)) === 'walking' : false));
  // the finished visit as a string (target, stars, hit, cash), or '' for none
  const lastKey = useGame((s) => {
    const l = builtHood(s.game, 'stars') ? criticView(s.game).last : null;
    return l ? `${l.target}|${l.stars}|${l.hit ? 1 : 0}|${l.cash}` : '';
  });
  const ack = useGame((s) => s.ackCritic);
  const arrive = useChangeToast(walking ? 'walk' : 'idle', (k) => (k === 'walk' ? arrival() : null));
  const pass = lastKey.split('|')[2] === '1';
  useEffect(() => {
    if (!lastKey) return;
    if (pass) emitCheer();
    const h = setTimeout(ack, MOMENT_MS);
    return () => clearTimeout(h);
  }, [lastKey, pass, ack]);
  if (lastKey) {
    const [target, stars, hit, cash] = lastKey.split('|');
    const m = moment({ target: Number(target), stars: Number(stars), hit: hit === '1', cash: Number(cash) });
    return (
      <LayerToast
        testID={m.hit ? 'critic-pass' : 'critic-fail'}
        toast={{ text: m.headline, line: m.line, speaker: m.speaker }}
        tone={m.hit ? 'basil' : 'plain'}
      />
    );
  }
  return arrive ? <LayerToast testID="critic-arrives" toast={arrive} /> : null;
});
