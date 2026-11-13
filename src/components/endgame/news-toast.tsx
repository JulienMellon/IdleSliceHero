// The endgame toast (BANNERS stack): a star earned (with a burst of coins from the toast to the cash), a recipe card, a cosmetic a
// milestone gave, Nonna's line for the master plaque, and an event's start line. The engine keeps the news until it is acknowledged;
// the toast takes the whole batch, acknowledges it at once and shows the items one at a time (news-model.ts).
// Re-renders only when news arrives or the shown item changes.
import { memo, useEffect, useRef, useState, type ComponentRef } from 'react';
import { Animated, StyleSheet, Text, View } from 'react-native';

import { gameCovered, useGame } from '../../store/game-store';
import { C, F } from '../../theme';
import { haptic } from '../game-ui';
import { StarIcon } from '../icons';
import { emitCheer, emitCoin, emitPayout } from '../pulse-bus';
import { eventBannerView, eventViewNow } from './event-model';
import { eventNews, NEWS_MS, newsItems, newsKey, RECIPE_HEADER, type NewsItem } from './news-model';
import { RecipeArt } from './recipe-art';
import { emitReveal } from './reveal-bus';
import { STACK } from './stack-model';

const COINS = 8;

export const NewsToast = memo(function NewsToast() {
  // Reads the live store below: React Compiler must not cache that.
  'use no memo';
  // the batch is taken when something is waiting and nothing covers the screen (a scene, the return popup, the title card)
  const key = useGame((s) => (gameCovered(s) ? '' : newsKey(s.game)));
  // an event that is running: its start line is a toast too, once per event per launch
  const eventId = useGame((s) => eventBannerView(eventViewNow(Date.now()))?.id ?? '');
  const told = useRef('');
  const [queue, setQueue] = useState<NewsItem[]>([]);
  const [pop] = useState(() => new Animated.Value(0));
  const root = useRef<ComponentRef<typeof View>>(null);

  useEffect(() => {
    if (!key) return;
    // D469: a recipe card turns over in the middle of the scene (recipe-reveal.tsx); the rest are toasts in the notice column
    const items = newsItems(useGame.getState().game).filter((i) => !(i.kind === 'recipe' && emitReveal(i)));
    const any = items.length > 0;
    if (any) setQueue((q) => [...q, ...items]);
    useGame.getState().ackEndgame('news');
  }, [key]);

  useEffect(() => {
    if (!eventId || told.current === eventId) return;
    told.current = eventId;
    const b = eventBannerView(eventViewNow(Date.now()));
    if (b) setQueue((q) => [...q, eventNews(b)]);
  }, [eventId]);

  const head = queue[0];
  const headKey = head?.key ?? '';
  const kind = head?.kind;
  useEffect(() => {
    if (!headKey) return;
    pop.setValue(0);
    Animated.spring(pop, { toValue: 1, friction: 6, tension: 90, useNativeDriver: true }).start();
    if (kind === 'star' || kind === 'all' || kind === 'recipe') {
      haptic('success');
      // the coins leave the toast for the cash, the counter kicks and the cooks cheer (the order chip's burst)
      root.current?.measureInWindow((x: number, y: number, _w: number, h: number) => {
        for (let i = 0; i < (kind === 'recipe' ? 5 : COINS); i++) emitCoin({ x: x + 28, y: y + h / 2, ms: 420 + i * 80 });
        emitPayout();
        emitCheer();
      });
    }
    const t = setTimeout(() => setQueue((q) => q.slice(1)), NEWS_MS);
    return () => clearTimeout(t);
  }, [headKey, kind, pop]);

  if (!head) return null;
  const star = head.kind === 'star' || head.kind === 'all';
  // D469: a recipe card flips over (its width opens from the edge) onto its picture; the others pop
  const recipe = head.kind === 'recipe' ? head : null;
  const scaleX = pop.interpolate({ inputRange: [0, 1], outputRange: [recipe ? 0.04 : 0.9, 1] });
  const scaleY = pop.interpolate({ inputRange: [0, 1], outputRange: [0.9, 1] });
  return (
    <Animated.View ref={root} testID={`news-${head.kind}`} pointerEvents="none" style={[styles.toast, recipe && styles.toastRecipe, star && styles.toastStar, { opacity: recipe ? 1 : pop, transform: [{ scaleX }, { scaleY }] }]}>
      <View style={[styles.icon, recipe && styles.iconRecipe]}>{star ? <StarIcon size={26} /> : recipe ? <RecipeArt hood={recipe.hood} n={recipe.n} owned size={52} /> : null}</View>
      <View style={styles.text}>
        {recipe ? <Text testID="news-recipe-header" style={styles.header}>{RECIPE_HEADER}</Text> : head.sub ? <Text style={styles.who} numberOfLines={1}>{head.sub}</Text> : null}
        <Text style={styles.line} numberOfLines={recipe ? 1 : 2} maxFontSizeMultiplier={1.15}>
          {head.text}
        </Text>
        {recipe ? <Text style={styles.sub} numberOfLines={2}>{head.sub}</Text> : null}
      </View>
    </Animated.View>
  );
});

const styles = StyleSheet.create({
  toast: { height: STACK.toast, flexDirection: 'row', alignItems: 'center', gap: 8, paddingHorizontal: 10, borderRadius: 16, borderWidth: 2, borderColor: '#5A2E1A', backgroundColor: '#FFF4DC', boxShadow: '0 3px 0 rgba(59,31,20,0.25)' } as object,
  toastRecipe: { height: STACK.recipe, backgroundColor: '#FFF9EC', borderColor: C.cheeseDark },
  iconRecipe: { width: 52 },
  header: { fontFamily: F.bold, fontSize: 10, lineHeight: 12, letterSpacing: 1, color: C.tomato },
  toastStar: { backgroundColor: '#FFE9A8', borderColor: C.cheeseDark },
  icon: { width: 26, alignItems: 'center' },
  text: { flex: 1, justifyContent: 'center' },
  who: { fontFamily: F.bold, fontSize: 11, lineHeight: 13, color: C.tomatoDark },
  line: { fontFamily: F.bold, fontSize: 13, lineHeight: 15, color: C.ink },
  sub: { fontFamily: F.semi, fontSize: 11, lineHeight: 13, color: C.inkSoft },
});
