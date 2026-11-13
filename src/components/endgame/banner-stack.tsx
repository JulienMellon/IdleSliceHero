// The BANNERS slot's one entry for the endgame: a column at the top of the scene area, under the order chip while one is up.
// Event banner, then the attack's banner or challenge chip, then the toast. Each piece draws nothing when it has nothing to say;
// the rows have fixed heights (stack-model.ts). The golden pizza waits while a card or the open banner is up (`holdsBonus`).
import { memo } from 'react';
import { StyleSheet, View } from 'react-native';

import { ORDER_VIEW } from '../../content/hooks';
import { useGame } from '../../store/game-store';
import { chipPhase } from '../order-model';
import { AttackBanner } from './attack-banner';
import { ChallengeChip } from './challenge-chip';
import { EventBanner } from './event-banner';
import { NewsToast } from './news-toast';
import { STACK, stackTop } from './stack-model';

export const BannerStack = memo(function BannerStack() {
  const orderUp = useGame((s) => chipPhase(s.game) !== 'none');
  return (
    <View testID="endgame-stack" pointerEvents="box-none" style={[styles.stack, { top: stackTop(orderUp) }]}>
      <EventBanner />
      <AttackBanner />
      <ChallengeChip />
      <NewsToast />
    </View>
  );
});

const styles = StyleSheet.create({
  stack: { position: 'absolute', left: ORDER_VIEW.side, right: ORDER_VIEW.side, gap: STACK.gap },
});
