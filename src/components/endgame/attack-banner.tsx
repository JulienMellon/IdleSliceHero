// The counter-attack banner (BANNERS stack): while MegaSlice's attack is open it names the shop and offers a 44 pt Defend button that
// starts the challenge. A tap on the words swaps them for Victor's announcement for that shop. After a lost challenge the button waits
// ("Retry in 42m"). Fixed height (stack-model.ts). Repaints when the shop changes and once a minute (the time left), never per tick.
import { memo, useEffect, useState } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';

import { attackView, KEY as ATTACK_KEY, type AttackState } from '../../engine/features/counterattack';
import { useGame } from '../../store/game-store';
import { C, F } from '../../theme';
import { haptic } from '../game-ui';
import { Portrait } from '../portrait';
import { TAP } from '../tap-targets';
import { attackLite, bannerView } from './attack-model';
import { BANNER_OPEN_MS, setBannerOpen } from './banner-state';
import { STACK } from './stack-model';

export const AttackBanner = memo(function AttackBanner() {
  // Reads the live store below: React Compiler must not cache that.
  'use no memo';
  const shop = useGame((s) => {
    const l = attackLite(s.game);
    return l.face === 'banner' ? l.shopId : null;
  });
  // C114: the Defend button re-enables the moment the retry wait ends: a boolean that flips when `retryAt` passes
  useGame((s) => ((s.game.x?.[ATTACK_KEY] as AttackState | undefined)?.retryAt ?? 0) <= Date.now());
  // the words under it change by the minute
  useGame((s) => (attackLite(s.game).face === 'banner' ? Math.floor(Math.max(Date.now(), s.tickAt) / 60_000) : 0));
  const [victor, setVictor] = useState(false);
  // G95: open in full for its first 10 s (the golden pizza waits), then a 44 pt badge; a tap on the badge opens it again
  const [st, setSt] = useState<{ announced: string | null; open: boolean; n: number }>({ announced: null, open: false, n: 0 });
  // a shop not yet announced counts as open at once (no frame of badge first)
  const open = !!shop && (st.announced === shop ? st.open : true);
  useEffect(() => {
    if (shop && st.announced !== shop) setSt((o) => ({ announced: shop, open: true, n: o.n + 1 }));
  }, [shop, st.announced]);
  useEffect(() => {
    setBannerOpen(open);
    if (!open) return;
    const t = setTimeout(() => setSt((o) => ({ ...o, open: false })), BANNER_OPEN_MS);
    return () => {
      clearTimeout(t);
      setBannerOpen(false);
    };
  }, [open, st.n]);
  if (!shop) return null;
  const g = useGame.getState().game;
  const b = bannerView(attackView(g, Date.now()));
  if (!b) return null;
  const defend = () => {
    const ok = useGame.getState().defend();
    haptic(ok ? 'success' : 'error');
    // the player taps the shop to rush: show it
    if (ok) useGame.getState().setActive(b.shopId);
  };
  if (!open) {
    return (
      <Pressable testID="attack-badge" accessibilityRole="button" accessibilityLabel={`MegaSlice is attacking ${b.name}. Open`} onPress={() => { haptic(); setSt((o) => ({ announced: shop, open: true, n: o.n + 1 })); }} style={styles.badge}>
        <Text style={styles.badgeText}>!</Text>
      </Pressable>
    );
  }
  return (
    <View testID="attack-banner" style={styles.banner}>
      <Pressable testID="attack-words" accessibilityRole="button" accessibilityLabel={`${b.name}: ${b.title}`} style={styles.words} onPress={() => setVictor((v) => !v)}>
        <Portrait id="victor-crust" mood="angry" size={36} />
        <View style={styles.text}>
          {victor ? (
            <Text style={styles.victor} numberOfLines={3} maxFontSizeMultiplier={1.1}>
              {b.victor}
            </Text>
          ) : (
            <>
              <Text style={styles.title} numberOfLines={2} maxFontSizeMultiplier={1.1}>
                <Text style={styles.name}>{`${b.name}: `}</Text>
                {b.title}
              </Text>
              <Text style={styles.ends} numberOfLines={1} maxFontSizeMultiplier={1.1}>
                {`${b.ends} left`}
              </Text>
            </>
          )}
        </View>
      </Pressable>
      <Pressable testID="attack-defend" accessibilityRole="button" accessibilityLabel={b.canDefend ? `Defend ${b.name}` : b.button} disabled={!b.canDefend} onPress={defend} style={({ pressed }) => [styles.defend, !b.canDefend && styles.defendWait, pressed && styles.pressed]}>
        <Text style={[styles.defendText, !b.canDefend && styles.defendTextWait]} numberOfLines={2} adjustsFontSizeToFit minimumFontScale={0.8} maxFontSizeMultiplier={1.1}>
          {b.button}
        </Text>
      </Pressable>
    </View>
  );
});

const styles = StyleSheet.create({
  banner: { height: STACK.banner, flexDirection: 'row', alignItems: 'center', gap: 6, paddingLeft: 8, paddingRight: 6, borderRadius: 16, backgroundColor: '#FDE3DC', borderWidth: 2, borderColor: C.tomatoDark, boxShadow: '0 3px 0 rgba(59,31,20,0.25)' } as object,
  badge: { alignSelf: 'flex-end', width: STACK.badge, height: STACK.badge, borderRadius: STACK.badge / 2, backgroundColor: C.tomato, borderWidth: 3, borderColor: '#fff', alignItems: 'center', justifyContent: 'center', boxShadow: '0 3px 0 rgba(59,31,20,0.25)' } as object,
  badgeText: { fontFamily: F.bold, fontSize: 24, lineHeight: 28, color: '#fff' },
  words: { flex: 1, flexDirection: 'row', alignItems: 'center', gap: 8, minHeight: TAP.min },
  text: { flex: 1, justifyContent: 'center' },
  name: { fontFamily: F.bold, color: C.tomatoDark },
  title: { fontFamily: F.semi, fontSize: 12, lineHeight: 14, color: C.ink },
  ends: { fontFamily: F.semi, fontSize: 11, lineHeight: 13, color: C.inkSoft },
  victor: { fontFamily: F.semi, fontSize: 11, lineHeight: 13, color: C.ink },
  defend: { width: 76, height: TAP.min, borderRadius: 12, backgroundColor: C.tomato, borderBottomWidth: 4, borderBottomColor: C.tomatoDark, alignItems: 'center', justifyContent: 'center', paddingHorizontal: 4 },
  defendWait: { backgroundColor: '#E2D9CE', borderBottomColor: '#C9BCAD' },
  defendText: { fontFamily: F.bold, fontSize: 14, lineHeight: 16, color: '#fff', textAlign: 'center' },
  defendTextWait: { fontSize: 11, lineHeight: 12, color: '#665A4F' },
  pressed: { transform: [{ translateY: 2 }] },
});
