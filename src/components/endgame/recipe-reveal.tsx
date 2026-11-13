// A recipe card turns over in the middle of the scene (BANNERS slot): D469. It flips open from its edge onto the card's picture, a "NEW RECIPE"
// header, the name and the line; coins fly from it to the cash and the cooks cheer. A tap closes it (or it closes by itself after 4 s). The
// cards of one batch show one after another. Primitive state only; the card is drawn at 220 pt or less, so it fits an iPhone SE.
import { memo, useEffect, useRef, useState, type ComponentRef } from 'react';
import { Animated, Pressable, StyleSheet, Text, useWindowDimensions, View } from 'react-native';

import { C, F } from '../../theme';
import { haptic } from '../game-ui';
import { emitCheer, emitCoin, emitPayout } from '../pulse-bus';
import { NEWS_MS, RECIPE_HEADER } from './news-model';
import { RecipeArt } from './recipe-art';
import { onReveal, revealWidth, type RecipeNews } from './reveal-bus';

const COINS = 8;
export const REVEAL_MS = NEWS_MS + 800;

export const RecipeReveal = memo(function RecipeReveal() {
  const [queue, setQueue] = useState<RecipeNews[]>([]);
  const [flip] = useState(() => new Animated.Value(0));
  const root = useRef<ComponentRef<typeof View>>(null);
  const { width } = useWindowDimensions();
  useEffect(() => onReveal((item) => setQueue((q) => [...q, item])), []);
  const head = queue[0];
  const key = head?.key ?? '';
  useEffect(() => {
    if (!key) return;
    flip.setValue(0);
    Animated.spring(flip, { toValue: 1, friction: 6, tension: 70, useNativeDriver: true }).start();
    haptic('success');
    // the coins leave the card for the cash counter, the counter kicks and the cooks cheer
    root.current?.measureInWindow?.((x: number, y: number, w: number, h: number) => {
      for (let i = 0; i < COINS; i++) emitCoin({ x: x + w / 2, y: y + h / 2, ms: 480 + i * 80 });
      emitPayout();
      emitCheer();
    });
    const t = setTimeout(() => setQueue((q) => q.slice(1)), REVEAL_MS);
    return () => clearTimeout(t);
  }, [key, flip]);
  if (!head) return null;
  return (
    <View pointerEvents="box-none" style={styles.layer}>
      <Animated.View ref={root} testID="recipe-reveal" style={{ transform: [{ scaleX: flip.interpolate({ inputRange: [0, 1], outputRange: [0.04, 1] }) }, { scale: flip.interpolate({ inputRange: [0, 0.6, 1], outputRange: [0.8, 1.06, 1] }) }] }}>
        <Pressable accessibilityRole="button" accessibilityLabel={`${RECIPE_HEADER}: ${head.text}. ${head.sub}. Dismiss`} onPress={() => setQueue((q) => q.slice(1))} style={[styles.card, { width: revealWidth(width) }]}>
          <Text style={styles.header}>{RECIPE_HEADER}</Text>
          <RecipeArt hood={head.hood} n={head.n} owned size={84} />
          <Text style={styles.name} numberOfLines={2} maxFontSizeMultiplier={1.15}>
            {head.text}
          </Text>
          <Text style={styles.line} numberOfLines={3} maxFontSizeMultiplier={1.15}>
            {head.sub}
          </Text>
        </Pressable>
      </Animated.View>
    </View>
  );
});

const styles = StyleSheet.create({
  layer: { position: 'absolute', left: 0, right: 0, top: 0, bottom: 0, alignItems: 'center', justifyContent: 'center' },
  card: { alignItems: 'center', gap: 4, paddingVertical: 14, paddingHorizontal: 14, borderRadius: 18, borderWidth: 3, borderColor: C.cheeseDark, backgroundColor: '#FFF9EC', boxShadow: '0 6px 0 rgba(59,31,20,0.3)' } as object,
  header: { fontFamily: F.bold, fontSize: 12, letterSpacing: 1.5, color: C.tomato },
  name: { fontFamily: F.bold, fontSize: 18, lineHeight: 21, color: C.ink, textAlign: 'center' },
  line: { fontFamily: F.semi, fontSize: 12, lineHeight: 15, color: C.inkSoft, textAlign: 'center' },
});
