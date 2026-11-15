// The BANNERS slot's one entry for the endgame: a column at the top of the scene area, under the order chip while one is up.
// One of the event banner, the attack's banner or challenge chip shows (the sky queue, stack-model.ts `skyOf`), then the toast. Each piece
// draws nothing when it has nothing to say; the rows have fixed heights. The golden pizza waits while anything ahead of it shows (`holdsBonus`).
import { memo } from 'react';
import { StyleSheet, View } from 'react-native';

import { ORDER_VIEW } from '../../content/hooks';
import { useGame } from '../../store/game-store';
import { AttackBanner } from './attack-banner';
import { useBannerOpen } from './banner-state';
import { ChallengeChip } from './challenge-chip';
import { EventBanner } from './event-banner';
import { NewsToast } from './news-toast';
import { skyOf, STACK, stackTop } from './stack-model';

export const BannerStack = memo(function BannerStack() {
  // one sky event at a time (stack-model.ts): a string, so this repaints only when the front item changes
  const bannerOpen = useBannerOpen();
  const first = useGame((s) => skyOf(s.game, bannerOpen, Date.now()));
  // the order chip (or offer) is drawn by OrderChip at the top; the news toast stacks under it
  const orderUp = first === 'order' || first === 'offer';
  return (
    <View testID="endgame-stack" pointerEvents="box-none" style={[styles.stack, { top: stackTop(orderUp) }]}>
      <EventBanner shown={first === 'event'} />
      <AttackBanner shown={first === 'attack'} />
      <ChallengeChip shown={first === 'attack'} />
      <NewsToast />
    </View>
  );
});

const styles = StyleSheet.create({
  stack: { position: 'absolute', left: ORDER_VIEW.side, right: ORDER_VIEW.side, gap: STACK.gap },
});
