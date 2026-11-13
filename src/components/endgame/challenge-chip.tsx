// The defence challenge (BANNERS stack), docked like the order chip. One chip, three faces:
//   running  Victor's portrait, "MegaSlice Counter-Attack", the pie count, a pies bar, a draining time bar, the clock and the reward;
//            "tap to rush!" when the pies are behind the clock (the orders' pace rule); a tap shows the shop
//   won      the shop's character's win line, "+$X", a gold flash and a burst of coins to the cash
//   lost     the shop's character's lose line (no penalty: the banner waits an hour for a retry)
// A result stays 6 s or until tapped, then `ackEndgame('attack')`. Repaints at most once a second and when the pies bar moves a 5% step.
import { memo, useEffect, useRef, useState, type ComponentRef } from 'react';
import { Animated, Pressable, StyleSheet, Text, View } from 'react-native';

import { ORDER_VIEW } from '../../content/hooks';
import { money } from '../../engine/format';
import { attackView } from '../../engine/features/counterattack';
import { useGame } from '../../store/game-store';
import { C, F } from '../../theme';
import { haptic } from '../game-ui';
import { RUSH_HINT } from '../order-model';
import { Portrait } from '../portrait';
import { emitCheer, emitCoin, emitPayout } from '../pulse-bus';
import { TAP } from '../tap-targets';
import { attackLite, barPct, challengeView, RESULT_MS, resultView, winDiamondsText } from './attack-model';
import { STACK } from './stack-model';

const FLASH_MS = 260;

export const ChallengeChip = memo(function ChallengeChip() {
  // Reads the live store below (like the order chip): React Compiler must not cache that.
  'use no memo';
  const face = useGame((s) => attackLite(s.game).face);
  // whole seconds left and the pies bar's 5% step: the two things that change under a running chip
  useGame((s) => attackLite(s.game).left);
  useGame((s) => attackLite(s.game).step);
  const [flash] = useState(() => new Animated.Value(0));
  const [bounce] = useState(() => new Animated.Value(1));
  // D469: the won chip flips over from the edge to the win line (its width opens from a sliver)
  const [flip] = useState(() => new Animated.Value(1));
  const root = useRef<ComponentRef<typeof View>>(null);
  const done = face === 'won' || face === 'lost';

  useEffect(() => {
    if (!done) return;
    const t = setTimeout(() => useGame.getState().ackEndgame('attack'), RESULT_MS);
    return () => clearTimeout(t);
  }, [done, face]);

  useEffect(() => {
    if (face !== 'won') return;
    flash.setValue(0);
    bounce.setValue(1);
    flip.setValue(0.05);
    const run = Animated.parallel([
      Animated.spring(flip, { toValue: 1, friction: 6, tension: 80, useNativeDriver: true }),
      Animated.sequence([0, 1, 0, 1, 0].map((to) => Animated.timing(flash, { toValue: to, duration: FLASH_MS, useNativeDriver: true }))),
      Animated.sequence([ORDER_VIEW.bounce, 1].map((to) => Animated.timing(bounce, { toValue: to, duration: ORDER_VIEW.bounceMs, useNativeDriver: true }))),
    ]);
    run.start();
    haptic('success');
    // the reward is paid: the coins leave the portrait for the cash counter, the counter kicks and the cooks cheer
    root.current?.measureInWindow((x: number, y: number, _w: number, h: number) => {
      for (let i = 0; i < ORDER_VIEW.coins; i++) emitCoin({ x: x + 30, y: y + h / 2, ms: 420 + i * 90 });
      emitPayout();
      emitCheer();
    });
    return () => run.stop();
  }, [face, flash, bounce, flip]);

  if (face !== 'running' && !done) return null;
  const g = useGame.getState().game;
  const view = attackView(g, Date.now());
  const run = challengeView(view);
  const result = resultView(view);
  if (face === 'running' && run) {
    const { setActive } = useGame.getState();
    return (
      <View testID="challenge-chip" style={styles.chip}>
        <Pressable testID="challenge-active" accessibilityLabel={`${run.title}: ${run.progress}. Show the shop`} style={styles.row} onPress={() => { haptic(); setActive(run.shopId); }}>
          <Portrait id="victor-crust" mood="angry" size={40} />
          <View style={styles.mid}>
            <Text style={styles.name} numberOfLines={1}>{`${run.title} · ${run.name}`}</Text>
            <Text testID="challenge-progress" style={styles.progress} numberOfLines={1}>
              {run.progress}
            </Text>
            <View style={styles.track}>
              <View style={[styles.fill, { width: `${barPct(run.fillStep)}%` }]} />
            </View>
            {run.behind && (
              <Text testID="challenge-rush" style={styles.rush} numberOfLines={1}>
                {RUSH_HINT}
              </Text>
            )}
          </View>
          <View style={styles.right}>
            <Text testID="challenge-clock" style={[styles.clock, run.urgent && styles.clockUrgent]}>
              {run.clock}
            </Text>
            <Text style={styles.reward}>{`+${money(run.rewardCash)}`}</Text>
          </View>
        </Pressable>
        {/* the time left drains along the chip's foot */}
        <View testID="challenge-drain" pointerEvents="none" style={[styles.drain, { width: `${barPct(run.drainStep)}%` }]} />
      </View>
    );
  }
  if (!result) return null;
  const won = result.kind === 'won';
  return (
    <Animated.View ref={root} testID={`challenge-${result.kind}`} style={[styles.chip, won ? styles.chipWon : styles.chipLost, won && { transform: [{ scaleX: flip }] }]}>
      {won && <Animated.View pointerEvents="none" style={[styles.glow, { opacity: flash }]} />}
      <Pressable accessibilityRole="button" accessibilityLabel={`${result.speaker}: ${result.line}. Dismiss`} style={styles.row} onPress={() => useGame.getState().ackEndgame('attack')}>
        <Animated.View style={{ transform: [{ scale: bounce }] }}>
          <Portrait id={result.who} mood={won ? 'happy' : 'sad'} size={40} />
        </Animated.View>
        <View style={styles.mid}>
          <Text style={styles.name} numberOfLines={1}>
            {result.speaker}
          </Text>
          <Text testID="challenge-line" style={styles.line} numberOfLines={3} maxFontSizeMultiplier={1.1}>
            {result.line}
          </Text>
        </View>
        {won && (
          <View style={styles.right}>
            <Text testID="challenge-won-cash" style={styles.doneReward}>{`+${money(result.cash)}`}</Text>
            <Text style={styles.reward}>{winDiamondsText(result.diamonds)}</Text>
          </View>
        )}
      </Pressable>
    </Animated.View>
  );
});

const styles = StyleSheet.create({
  chip: { height: STACK.chip, flexDirection: 'row', alignItems: 'center', backgroundColor: '#FFF4DC', borderWidth: 2, borderColor: '#5A2E1A', borderRadius: 16, paddingLeft: 8, paddingRight: 4, overflow: 'hidden', boxShadow: '0 3px 0 rgba(59,31,20,0.25)' } as object,
  chipWon: { backgroundColor: '#FFD04A', borderColor: C.cheeseDark },
  chipLost: { backgroundColor: '#EFE6D8', borderColor: C.inkSoft },
  row: { flex: 1, flexDirection: 'row', alignItems: 'center', gap: 8, minHeight: TAP.min },
  mid: { flex: 1, justifyContent: 'center' },
  name: { fontFamily: F.bold, fontSize: 11.5, lineHeight: 14, color: C.tomatoDark },
  line: { fontFamily: F.semi, fontSize: 11.5, lineHeight: 13, color: C.ink },
  progress: { fontFamily: F.bold, fontSize: 14, lineHeight: 16, color: C.ink },
  track: { height: 8, borderRadius: 4, backgroundColor: '#E2D3BC', overflow: 'hidden', marginTop: 2 },
  fill: { height: 8, borderRadius: 4, backgroundColor: C.basil },
  right: { alignItems: 'flex-end', minWidth: 58, paddingRight: 6 },
  clock: { fontFamily: F.bold, fontSize: 17, color: C.ink },
  clockUrgent: { color: C.tomato },
  reward: { fontFamily: F.bold, fontSize: 11.5, color: C.basilDark },
  rush: { fontFamily: F.bold, fontSize: 11, lineHeight: 13, color: C.tomato },
  doneReward: { fontFamily: F.bold, fontSize: 18, color: '#2E7D32' },
  drain: { position: 'absolute', left: 0, bottom: 0, height: 4, backgroundColor: C.tomato },
  glow: { position: 'absolute', left: 0, right: 0, top: 0, bottom: 0, backgroundColor: '#FFF6C2' },
});
