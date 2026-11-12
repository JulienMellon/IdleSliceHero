// The special-order chip (v5.13), docked at the top of the scene area under the goal bar. One chip, four faces:
//   offer   the character's portrait, their line, an Accept button and a ✕ (both drawn at 44 pt)
//   active  pies sold / target with a bar, the clock and the reward; a tap switches to that shop's tab
//   done    a gold flash behind the content, "+$X" (20 pt green), the character's thanks, a bounce and five coins to the cash (2.5 s)
//   failed  "So close — next time!" (2 s), no penalty
// It re-renders at most once a second: it subscribes to the phase and to the whole seconds left (primitives), and reads the
// rest from the store when it does. The rules are engine/orders.ts; the text is order-model.ts.
import { memo, useEffect, useRef, useState, type ComponentRef } from 'react';
import { Animated, Pressable, StyleSheet, Text, View } from 'react-native';

import { ORDER_VIEW } from '../content/hooks';
import type { NeighborhoodId } from '../content/types';
import { useGame } from '../store/game-store';
import { C, F } from '../theme';
import { haptic } from './game-ui';
import { emitCheer, emitCoin, emitPayout } from './pulse-bus';
import { chipPhase, chipView, RUSH_HINT } from './order-model';
import { Portrait } from './portrait';
import { TAP } from './tap-targets';

const FLASH_MS = 260;

export const OrderChip = memo(function OrderChip({ top, onShop }: { top: number; onShop: (hood: NeighborhoodId) => void }) {
  // Reads the live store below (like the scene does): React Compiler must not cache that.
  'use no memo';
  const phase = useGame((s) => chipPhase(s.game));
  // whole seconds left on the active order or the offer: the one thing that changes under the chip while it is up
  useGame((s) => Math.ceil(s.game.order.active?.left ?? s.game.order.offer?.left ?? 0));
  const [flash] = useState(() => new Animated.Value(0));
  const [bounce] = useState(() => new Animated.Value(1));
  const root = useRef<ComponentRef<typeof View>>(null);
  useEffect(() => {
    if (phase !== 'done') return;
    flash.setValue(0);
    bounce.setValue(1);
    const run = Animated.parallel([
      Animated.sequence([0, 1, 0, 1, 0].map((to) => Animated.timing(flash, { toValue: to, duration: FLASH_MS, useNativeDriver: true }))),
      Animated.sequence([ORDER_VIEW.bounce, 1].map((to) => Animated.timing(bounce, { toValue: to, duration: ORDER_VIEW.bounceMs, useNativeDriver: true }))),
    ]);
    run.start();
    // D436: the reward is paid, so the coins leave the portrait for the cash counter, the counter kicks and the cooks cheer
    root.current?.measureInWindow((x: number, y: number, _w: number, h: number) => {
      for (let i = 0; i < ORDER_VIEW.coins; i++) emitCoin({ x: x + 30, y: y + h / 2, ms: 420 + i * 90 });
      emitPayout();
      emitCheer();
    });
    return () => run.stop();
  }, [phase, flash, bounce]);
  const view = chipView(useGame.getState().game);
  if (!view) return null;
  const { acceptOrder, declineOrder } = useGame.getState();
  const face = (
    <>
      <Animated.View style={{ transform: [{ scale: bounce }] }}>
        <Portrait id={view.who} mood={view.phase === 'failed' ? 'sad' : 'happy'} size={40} />
      </Animated.View>
      {view.phase === 'active' ? (
        <>
          <View style={styles.mid}>
            <Text style={styles.name} numberOfLines={1}>{`${view.name}’s order`}</Text>
            <Text testID="order-progress" style={styles.progress} numberOfLines={1}>
              {view.progress}
            </Text>
            <View style={styles.track}>
              <View style={[styles.fill, { width: `${Math.round(view.fill * 100)}%` }]} />
            </View>
            {view.behind && (
              <Text testID="order-rush" style={styles.rush} numberOfLines={1}>
                {RUSH_HINT}
              </Text>
            )}
          </View>
          <View style={styles.right}>
            <Text testID="order-clock" style={[styles.clock, view.urgent && styles.clockUrgent]}>
              {view.clock}
            </Text>
            <Text testID="order-reward" style={styles.reward}>
              {view.reward}
            </Text>
          </View>
        </>
      ) : (
        <View style={styles.mid}>
          <Text style={styles.name} numberOfLines={1}>
            {view.phase === 'done' && <Text testID="order-reward-done" style={styles.doneReward}>{view.reward}</Text>}
            {view.phase === 'done' ? ` · ${view.name}` : view.name}
          </Text>
          <Text testID={view.phase === 'offer' ? 'order-line' : `order-${view.phase}`} style={styles.line} numberOfLines={2} maxFontSizeMultiplier={1.2}>
            {view.line}
          </Text>
        </View>
      )}
    </>
  );
  return (
    <View ref={root} testID="order-chip" style={[styles.chip, { top }, view.phase === 'done' && styles.chipDone, view.phase === 'failed' && styles.chipFailed]}>
      {/* D436: the flash sits behind the content (first child), so the portrait and the reward are never washed out */}
      {view.phase === 'done' && <Animated.View pointerEvents="none" style={[styles.glow, { opacity: flash }]} />}
      {view.phase === 'active' ? (
        <Pressable testID="order-active" accessibilityLabel={`${view.name}’s order: ${view.progress}. Show the shop`} style={styles.row} onPress={() => { haptic(); onShop(view.hood); }}>
          {face}
        </Pressable>
      ) : (
        <View style={styles.row}>{face}</View>
      )}
      {view.phase === 'offer' && (
        <>
          <View style={styles.acceptCol}>
            <Pressable testID="order-accept" accessibilityRole="button" accessibilityLabel={`Accept ${view.name}’s order`} style={({ pressed }) => [styles.accept, pressed && styles.pressed]} onPress={() => { haptic('success'); acceptOrder(); }}>
              <Text style={styles.acceptText}>Accept</Text>
            </Pressable>
            <Text testID="order-offer-reward" style={styles.offerReward}>
              {view.reward}
            </Text>
          </View>
          <Pressable testID="order-decline" accessibilityRole="button" accessibilityLabel="Decline" style={styles.decline} onPress={() => { haptic(); declineOrder(); }}>
            <Text style={styles.declineText}>✕</Text>
          </Pressable>
        </>
      )}
      {view.phase === 'offer' && <View testID="order-expiry" pointerEvents="none" style={[styles.expiry, { width: `${Math.round(view.expiry * 100)}%` }]} />}
    </View>
  );
});

const styles = StyleSheet.create({
  chip: {
    position: 'absolute',
    left: ORDER_VIEW.side,
    right: ORDER_VIEW.side,
    minHeight: ORDER_VIEW.height,
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFF4DC',
    borderWidth: 2,
    borderColor: '#5A2E1A',
    borderRadius: 16,
    paddingLeft: 8,
    paddingRight: 4,
    gap: 4,
    overflow: 'hidden',
    boxShadow: '0 3px 0 rgba(59,31,20,0.25)',
  } as object,
  chipDone: { backgroundColor: '#FFD04A', borderColor: C.cheeseDark },
  chipFailed: { backgroundColor: '#EFE6D8', borderColor: C.inkSoft },
  row: { flex: 1, flexDirection: 'row', alignItems: 'center', gap: 8, minHeight: TAP.min },
  mid: { flex: 1, justifyContent: 'center' },
  name: { fontFamily: F.bold, fontSize: 12, color: C.tomatoDark },
  line: { fontFamily: F.semi, fontSize: 12.5, lineHeight: 15, color: C.ink },
  progress: { fontFamily: F.bold, fontSize: 14, color: C.ink },
  track: { height: 8, borderRadius: 4, backgroundColor: '#E2D3BC', overflow: 'hidden', marginTop: 2 },
  fill: { height: 8, borderRadius: 4, backgroundColor: C.basil },
  right: { alignItems: 'flex-end', minWidth: 54, paddingRight: 6 },
  clock: { fontFamily: F.bold, fontSize: 17, color: C.ink },
  clockUrgent: { color: C.tomato },
  reward: { fontFamily: F.bold, fontSize: 12, color: C.basilDark },
  accept: { height: TAP.min, minWidth: 72, paddingHorizontal: 10, borderRadius: 12, backgroundColor: C.basil, borderBottomWidth: 4, borderBottomColor: C.basilDark, alignItems: 'center', justifyContent: 'center' },
  acceptText: { fontFamily: F.bold, fontSize: 14, color: '#fff' },
  pressed: { transform: [{ translateY: 2 }] },
  // a small ✕ drawn inside a 44 pt target
  decline: { width: TAP.min, height: TAP.min, alignItems: 'center', justifyContent: 'center' },
  declineText: { fontFamily: F.bold, fontSize: 15, color: C.inkSoft },
  acceptCol: { alignItems: 'center' },
  offerReward: { fontFamily: F.bold, fontSize: 12, lineHeight: 14, color: C.basilDark },
  rush: { fontFamily: F.bold, fontSize: 11, lineHeight: 13, color: C.tomato },
  doneReward: { fontFamily: F.bold, fontSize: 20, color: '#2E7D32' },
  expiry: { position: 'absolute', left: 0, bottom: 0, height: 4, backgroundColor: C.basil },
  glow: { position: 'absolute', left: 0, right: 0, top: 0, bottom: 0, backgroundColor: '#FFF6C2' },
});
