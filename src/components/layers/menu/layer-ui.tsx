// The pieces every layer of card S2b draws the same way: the HUD chip (a 44 pt pill with the look and the size rule of card S2a's layer chips,
// ../layer-chip.tsx, which opens only its own sheets), the sheet shell (a dim, a card with a title and a 44 pt Close) and the notice in the
// layers' column (../layer-stack.tsx). The University, Industrial and Uptown folders import these.
import { useEffect, useRef, useState, type ReactNode } from 'react';
import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';

import { useGame } from '../../../store/game-store';
import { C, F } from '../../../theme';
import { ORDER_VIEW } from '../../../content/hooks';
import { attackLite } from '../../endgame/attack-model';
import { useBannerOpen } from '../../endgame/banner-state';
import { eventBannerView, eventViewNow } from '../../endgame/event-model';
import { chipPhase } from '../../order-model';
import { CHIP_H, layerTop } from '../layer-model';
import { BUTTON_H, chipPillWidth, isNews, TOAST_H, TOAST_MS } from './layer-model';
import { gameNow } from '../../../engine/clock';

/** A HUD chip (HUD_CHIPS slot): two short rows (model `twoRows`, or the rows the model gives), a 44 pt pill. */
export function LayerChip({ testID, rows, label, onPress }: { testID: string; rows: readonly [string, string]; label: string; onPress: () => void }) {
  const [a, b] = rows;
  return (
    <Pressable testID={testID} accessibilityRole="button" accessibilityLabel={label} onPress={onPress} style={[styles.chip, { width: chipPillWidth(rows) }]}>
      <Text style={styles.text} numberOfLines={1} maxFontSizeMultiplier={1.1}>
        {a}
      </Text>
      {b ? (
        <Text style={[styles.text, styles.time]} numberOfLines={1} maxFontSizeMultiplier={1.1}>
          {b}
        </Text>
      ) : null}
    </Pressable>
  );
}

/** A layer's sheet (SHEETS slot): taps on the dim or Close shut it. The body scrolls when it is taller than the card. */
export function LayerSheet({ testID, title, onClose, children }: { testID: string; title: string; onClose: () => void; children: ReactNode }) {
  return (
    <View style={styles.overlay} testID={testID}>
      <Pressable style={StyleSheet.absoluteFill} onPress={onClose} accessibilityRole="button" accessibilityLabel={`Close ${title}`} />
      <View style={styles.card}>
        <Text style={styles.title} numberOfLines={1}>
          {title}
        </Text>
        <ScrollView style={styles.scroll} contentContainerStyle={styles.body}>
          {children}
        </ScrollView>
        <Pressable testID={`${testID}-close`} accessibilityRole="button" onPress={onClose} style={styles.close}>
          <Text style={styles.closeText}>Close</Text>
        </Pressable>
      </View>
    </View>
  );
}

/** A layer's notice: one or two lines (a headline and an optional line under it, with who says it). */
export interface ToastText {
  text: string;
  line?: string | null;
  speaker?: string | null;
}

/** Where the notice goes now: where S2a's layer column starts (under the order chip, the event banner and the attack's row). Primitive selectors only. */
function useToastTop(): number {
  const bannerOpen = useBannerOpen();
  return useGame((s) =>
    layerTop({
      orderUp: chipPhase(s.game) !== 'none',
      eventUp: !!eventBannerView(eventViewNow(gameNow(), s.game)),
      attack: attackLite(s.game).face,
      collapsed: !bannerOpen,
    }),
  );
}

/** A notice in the endgame stack's column. It takes no touches. */
export function LayerToast({ testID, toast, tone = 'cheese' }: { testID: string; toast: ToastText; tone?: 'cheese' | 'basil' | 'plain' }) {
  const top = useToastTop();
  return (
    <View
      testID={testID}
      pointerEvents="none"
      accessibilityLabel={toast.line ? `${toast.text}. ${toast.line}` : toast.text}
      style={[styles.toast, { top }, tone === 'basil' && styles.toastBasil, tone === 'plain' && styles.toastPlain]}
    >
      <Text style={styles.toastText} numberOfLines={1} maxFontSizeMultiplier={1.15}>
        {toast.text}
      </Text>
      {toast.line ? (
        <Text style={styles.toastLine} numberOfLines={2} maxFontSizeMultiplier={1.15}>
          {toast.speaker ? `${toast.speaker}: ${toast.line}` : toast.line}
        </Text>
      ) : null}
    </View>
  );
}

/**
 * A notice that shows for TOAST_MS when `key` changes to a new real value (the first value seen is not news). `make` turns the key into the
 * notice, or null for none. Returns what to draw now.
 */
export function useChangeToast(key: string, make: (key: string) => ToastText | null): ToastText | null {
  const prev = useRef<string | null>(null);
  const makeRef = useRef(make);
  const [shown, setShown] = useState<ToastText | null>(null);
  useEffect(() => {
    makeRef.current = make;
  });
  useEffect(() => {
    const was = prev.current;
    prev.current = key;
    const t = isNews(was, key) ? makeRef.current(key) : null;
    setShown(t);
    if (!t) return;
    const h = setTimeout(() => setShown(null), TOAST_MS);
    return () => clearTimeout(h);
  }, [key]);
  return shown;
}

const styles = StyleSheet.create({
  toast: {
    position: 'absolute',
    left: ORDER_VIEW.side,
    right: ORDER_VIEW.side,
    minHeight: TOAST_H,
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 15,
    borderWidth: 2,
    borderColor: C.cheeseDark,
    backgroundColor: C.cheese,
    justifyContent: 'center',
    gap: 1,
  },
  toastBasil: { borderColor: C.basilDark, backgroundColor: '#DDF3E2' },
  toastPlain: { borderColor: C.ink, backgroundColor: '#fff' },
  toastText: { fontFamily: F.bold, fontSize: 13, lineHeight: 16, color: C.ink, textAlign: 'center' },
  toastLine: { fontFamily: F.semi, fontSize: 11, lineHeight: 13, color: C.ink, textAlign: 'center' },
  chip: {
    minWidth: CHIP_H,
    height: CHIP_H,
    borderRadius: CHIP_H / 2,
    paddingHorizontal: 4,
    backgroundColor: C.cheese,
    borderWidth: 2,
    borderColor: C.cheeseDark,
    alignItems: 'center',
    justifyContent: 'center',
  },
  text: { fontFamily: F.bold, fontSize: 10, lineHeight: 12, color: C.ink, textAlign: 'center' },
  time: { fontSize: 11, lineHeight: 13 },
  overlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(30,14,8,0.6)',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 16,
  },
  card: { backgroundColor: C.bg, borderRadius: 20, borderWidth: 4, borderColor: C.ink, padding: 14, width: '100%', maxWidth: 360, maxHeight: '88%', gap: 8 },
  title: { fontFamily: F.bold, fontSize: 22, color: C.ink, textAlign: 'center' },
  scroll: { flexGrow: 0 },
  body: { gap: 8 },
  close: { height: BUTTON_H, borderRadius: 12, borderWidth: 2, borderColor: C.ink, backgroundColor: '#fff', alignItems: 'center', justifyContent: 'center' },
  closeText: { fontFamily: F.bold, fontSize: 15, color: C.ink },
});
