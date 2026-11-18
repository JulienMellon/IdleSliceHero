// The banner while a weekly event runs (BANNERS stack): "Friday Night Rush!  ×1.5 · 1h 12m". Nothing otherwise: the hour before an event
// is the HUD chip (event-chip.tsx). Repaints once a minute (the text it shows), never per game tick.
import { memo } from 'react';
import { StyleSheet, Text, View } from 'react-native';

import { useGame } from '../../store/game-store';
import { C, F } from '../../theme';
import { FlameIcon } from '../icons';
import { eventBannerView, eventViewNow } from './event-model';
import { STACK } from './stack-model';
import { gameNow } from '../../engine/clock';

/** `shown`: the sky strip's queue gave the banner the strip (stack-model.ts `skyShown`). */
export const EventBanner = memo(function EventBanner({ shown = true }: { shown?: boolean }) {
  // a string: the banner repaints when the event or the minutes left change
  const key = useGame((s) => {
    const b = eventBannerView(eventViewNow(gameNow(), s.game));
    return b ? `${b.id}|${b.left}` : '';
  });
  const b = key && shown ? eventBannerView(eventViewNow(gameNow(), useGame.getState().game)) : null;
  if (!b) return null;
  return (
    <View testID="event-banner" accessibilityLabel={`${b.title} ${b.mult} income, ${b.left} left`} style={styles.banner} pointerEvents="none">
      <FlameIcon size={16} />
      <Text style={styles.title} numberOfLines={1} maxFontSizeMultiplier={1.15}>
        {b.title}
      </Text>
      <Text style={styles.meta} numberOfLines={1} maxFontSizeMultiplier={1.15}>
        {`${b.mult} · ${b.left}`}
      </Text>
    </View>
  );
});

const styles = StyleSheet.create({
  banner: {
    height: STACK.event,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    paddingHorizontal: 12,
    borderRadius: 15,
    backgroundColor: C.cheese,
    borderWidth: 2,
    borderColor: C.cheeseDark,
    boxShadow: '0 2px 0 rgba(59,31,20,0.25)',
  } as object,
  title: { flexShrink: 1, fontFamily: F.bold, fontSize: 13, color: C.ink },
  meta: { fontFamily: F.bold, fontSize: 12, color: C.tomatoDark },
});
