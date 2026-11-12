// The banner while a weekly event runs (BANNERS stack): "Friday Night Rush!  ×1.5 · 1h 12m". Nothing otherwise: the hour before an event
// is the HUD chip (event-chip.tsx). Repaints once a minute (the text it shows), never per game tick.
import { memo } from 'react';
import { StyleSheet, Text, View } from 'react-native';

import { eventView } from '../../engine/features/events';
import { useGame } from '../../store/game-store';
import { C, F } from '../../theme';
import { FlameIcon } from '../icons';
import { eventBannerView } from './event-model';
import { STACK } from './stack-model';

export const EventBanner = memo(function EventBanner() {
  // a string: the banner repaints when the event or the minutes left change
  const key = useGame((s) => {
    const b = eventBannerView(eventView(Math.max(Date.now(), s.tickAt)));
    return b ? `${b.id}|${b.left}` : '';
  });
  const b = key ? eventBannerView(eventView(Date.now())) : null;
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
  banner: { height: STACK.event, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 6, paddingHorizontal: 12, borderRadius: 15, backgroundColor: C.cheese, borderWidth: 2, borderColor: C.cheeseDark, boxShadow: '0 2px 0 rgba(59,31,20,0.25)' } as object,
  title: { flexShrink: 1, fontFamily: F.bold, fontSize: 13, color: C.ink },
  meta: { fontFamily: F.bold, fontSize: 12, color: C.tomatoDark },
});
