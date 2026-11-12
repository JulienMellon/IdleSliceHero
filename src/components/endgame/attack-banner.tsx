// The counter-attack banner (BANNERS stack): while MegaSlice's attack is open it names the shop and offers a 44 pt Defend button that
// starts the challenge. A tap on the words swaps them for Victor's announcement for that shop. After a lost challenge the button waits
// ("Retry in 42m"). Fixed height (stack-model.ts). Repaints when the shop changes and once a minute (the time left), never per tick.
import { memo, useState } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';

import { attackView } from '../../engine/features/counterattack';
import { useGame } from '../../store/game-store';
import { C, F } from '../../theme';
import { haptic } from '../game-ui';
import { Portrait } from '../portrait';
import { TAP } from '../tap-targets';
import { attackLite, bannerView } from './attack-model';
import { STACK } from './stack-model';

export const AttackBanner = memo(function AttackBanner() {
  // Reads the live store below: React Compiler must not cache that.
  'use no memo';
  const shop = useGame((s) => {
    const l = attackLite(s.game);
    return l.face === 'banner' ? l.shopId : null;
  });
  // the words under it change by the minute
  useGame((s) => (attackLite(s.game).face === 'banner' ? Math.floor(Math.max(Date.now(), s.tickAt) / 60_000) : 0));
  const [victor, setVictor] = useState(false);
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
