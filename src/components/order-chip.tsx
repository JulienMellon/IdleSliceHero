// The special-order chip (v5.13), docked at the top of the scene area under the goal bar. One chip, four faces:
//   offer   the character's portrait, their line, an Accept button and a ✕ (both drawn at 44 pt)
//   active  pies sold / target with a bar, the clock and the reward; a tap switches to that shop's tab
//   done    gold flash, "+$X" and the character's thanks (2.5 s)
//   failed  "So close — next time!" (2 s), no penalty
// It re-renders at most once a second: it subscribes to the phase and to the whole seconds left (primitives), and reads the
// rest from the store when it does. The rules are engine/orders.ts; the text is order-model.ts.
import { memo, useEffect, useState } from 'react';
import { Animated, Pressable, StyleSheet, Text, View } from 'react-native';

import { ORDER_VIEW } from '../content/hooks';
import type { NeighborhoodId } from '../content/types';
import { useGame } from '../store/game-store';
import { C, F } from '../theme';
import { haptic } from './game-ui';
import { chipPhase, chipView } from './order-model';
import { Portrait } from './portrait';
import { TAP } from './tap-targets';

const FLASH_MS = 260;

export const OrderChip = memo(function OrderChip({ top, onShop }: { top: number; onShop: (hood: NeighborhoodId) => void }) {
  // Reads the live store below (like the scene does): React Compiler must not cache that.
  'use no memo';
  const phase = useGame((s) => chipPhase(s.game));
  // whole seconds left on the active order: the one thing that changes under the chip while it is up
  useGame((s) => Math.ceil(s.game.order.active?.left ?? 0));
  const [flash] = useState(() => new Animated.Value(0));
  useEffect(() => {
    if (phase !== 'done') return;
    flash.setValue(0);
    const run = Animated.sequence([0, 1, 0, 1, 0].map((to) => Animated.timing(flash, { toValue: to, duration: FLASH_MS, useNativeDriver: true })));
    run.start();
    return () => run.stop();
  }, [phase, flash]);
  const view = chipView(useGame.getState().game);
  if (!view) return null;
  const { acceptOrder, declineOrder } = useGame.getState();
  const face = (
    <>
      <Portrait id={view.who} mood={view.phase === 'failed' ? 'sad' : 'happy'} size={40} />
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
            {view.phase === 'done' ? `${view.reward} · ${view.name}` : view.name}
          </Text>
          <Text testID={view.phase === 'offer' ? 'order-line' : `order-${view.phase}`} style={styles.line} numberOfLines={2} maxFontSizeMultiplier={1.2}>
            {view.line}
          </Text>
        </View>
      )}
    </>
  );
  return (
    <View testID="order-chip" style={[styles.chip, { top }, view.phase === 'done' && styles.chipDone, view.phase === 'failed' && styles.chipFailed]}>
      {view.phase === 'active' ? (
        <Pressable testID="order-active" accessibilityLabel={`${view.name}’s order: ${view.progress}. Show the shop`} style={styles.row} onPress={() => { haptic(); onShop(view.hood); }}>
          {face}
        </Pressable>
      ) : (
        <View style={styles.row}>{face}</View>
      )}
      {view.phase === 'offer' && (
        <>
          <Pressable testID="order-accept" accessibilityRole="button" accessibilityLabel={`Accept ${view.name}’s order`} style={({ pressed }) => [styles.accept, pressed && styles.pressed]} onPress={() => { haptic('success'); acceptOrder(); }}>
            <Text style={styles.acceptText}>Accept</Text>
          </Pressable>
          <Pressable testID="order-decline" accessibilityRole="button" accessibilityLabel="Decline" style={styles.decline} onPress={() => { haptic(); declineOrder(); }}>
            <Text style={styles.declineText}>✕</Text>
          </Pressable>
        </>
      )}
      {view.phase === 'done' && <Animated.View pointerEvents="none" style={[styles.glow, { opacity: flash }]} />}
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
  glow: { position: 'absolute', left: 0, right: 0, top: 0, bottom: 0, backgroundColor: '#FFF6C2' },
});
