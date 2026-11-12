// The endgame toast (BANNERS stack): a star earned (with a burst of coins from the toast to the cash), a recipe card, a cosmetic a
// milestone gave, Nonna's line for the master plaque, and an event's start line. The engine keeps the news until it is acknowledged;
// the toast takes the whole batch, acknowledges it at once and shows the items one at a time (news-model.ts).
// Re-renders only when news arrives or the shown item changes.
import { memo, useEffect, useRef, useState, type ComponentRef } from 'react';
import { Animated, StyleSheet, Text, View } from 'react-native';

import { eventView } from '../../engine/features/events';
import { gameCovered, useGame } from '../../store/game-store';
import { C, F } from '../../theme';
import { haptic } from '../game-ui';
import { StarIcon } from '../icons';
import { emitCheer, emitCoin, emitPayout } from '../pulse-bus';
import { eventBannerView } from './event-model';
import { eventNews, NEWS_MS, newsItems, newsKey, type NewsItem } from './news-model';
import { STACK } from './stack-model';

const COINS = 8;

export const NewsToast = memo(function NewsToast() {
  // Reads the live store below: React Compiler must not cache that.
  'use no memo';
  // the batch is taken when something is waiting and nothing covers the screen (a scene, the return popup, the title card)
  const key = useGame((s) => (gameCovered(s) ? '' : newsKey(s.game)));
  // an event that is running: its start line is a toast too, once per event per launch
  const eventId = useGame((s) => eventBannerView(eventView(Date.now()))?.id ?? '');
  const told = useRef('');
  const [queue, setQueue] = useState<NewsItem[]>([]);
  const [pop] = useState(() => new Animated.Value(0));
  const root = useRef<ComponentRef<typeof View>>(null);

  useEffect(() => {
    if (!key) return;
    const items = newsItems(useGame.getState().game);
    if (!items.length) return;
    setQueue((q) => [...q, ...items]);
    useGame.getState().ackEndgame('news');
  }, [key]);

  useEffect(() => {
    if (!eventId || told.current === eventId) return;
    told.current = eventId;
    const b = eventBannerView(eventView(Date.now()));
    if (b) setQueue((q) => [...q, eventNews(b)]);
  }, [eventId]);

  const head = queue[0];
  const headKey = head?.key ?? '';
  const kind = head?.kind;
  useEffect(() => {
    if (!headKey) return;
    pop.setValue(0);
    Animated.spring(pop, { toValue: 1, friction: 6, tension: 90, useNativeDriver: true }).start();
    if (kind === 'star' || kind === 'all') {
      haptic('success');
      // the coins leave the toast for the cash, the counter kicks and the cooks cheer (the order chip's burst)
      root.current?.measureInWindow((x: number, y: number, _w: number, h: number) => {
        for (let i = 0; i < COINS; i++) emitCoin({ x: x + 28, y: y + h / 2, ms: 420 + i * 80 });
        emitPayout();
        emitCheer();
      });
    }
    const t = setTimeout(() => setQueue((q) => q.slice(1)), NEWS_MS);
    return () => clearTimeout(t);
  }, [headKey, kind, pop]);

  if (!head) return null;
  const star = head.kind === 'star' || head.kind === 'all';
  return (
    <Animated.View ref={root} testID={`news-${head.kind}`} pointerEvents="none" style={[styles.toast, star && styles.toastStar, { opacity: pop, transform: [{ scale: pop.interpolate({ inputRange: [0, 1], outputRange: [0.9, 1] }) }] }]}>
      <View style={styles.icon}>{star ? <StarIcon size={26} /> : null}</View>
      <View style={styles.text}>
        {head.sub && head.kind !== 'recipe' ? <Text style={styles.who} numberOfLines={1}>{head.sub}</Text> : null}
        <Text style={styles.line} numberOfLines={head.kind === 'recipe' ? 1 : 2} maxFontSizeMultiplier={1.15}>
          {head.text}
        </Text>
        {head.kind === 'recipe' ? <Text style={styles.sub} numberOfLines={1}>{head.sub}</Text> : null}
      </View>
    </Animated.View>
  );
});

const styles = StyleSheet.create({
  toast: { height: STACK.toast, flexDirection: 'row', alignItems: 'center', gap: 8, paddingHorizontal: 10, borderRadius: 16, borderWidth: 2, borderColor: '#5A2E1A', backgroundColor: '#FFF4DC', boxShadow: '0 3px 0 rgba(59,31,20,0.25)' } as object,
  toastStar: { backgroundColor: '#FFE9A8', borderColor: C.cheeseDark },
  icon: { width: 26, alignItems: 'center' },
  text: { flex: 1, justifyContent: 'center' },
  who: { fontFamily: F.bold, fontSize: 11, lineHeight: 13, color: C.tomatoDark },
  line: { fontFamily: F.bold, fontSize: 13, lineHeight: 15, color: C.ink },
  sub: { fontFamily: F.semi, fontSize: 11.5, lineHeight: 14, color: C.inkSoft },
});
