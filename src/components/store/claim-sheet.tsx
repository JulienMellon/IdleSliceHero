// "Double it": what the last daily, weekly or gift claim paid, with the ad button that pays it again (card U3, placement double_claim).
// A card at the bottom of the screen, not a wall: a light scrim sits behind it (D497) but lets every touch through, a new claim replaces it,
// and it goes by itself after a while. A Nonna's Plus owner is paid double at once (the store does it), so the card just says "Doubled! ×2".
import { memo, useCallback, useEffect } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { money } from '../../engine/format';
import { useGame } from '../../store/game-store';
import { C, F } from '../../theme';
import { AdButton } from './ad-button';
import { deltaText, doubleLabel, type ClaimKind } from './ad-model';

/** The card leaves by itself after this long (ms). */
export const CLAIM_SHEET_MS = 12_000;

const TITLE: Record<ClaimKind, string> = { daily: 'Task reward', weekly: 'Weekly reward', gift: 'Daily gift' };

export const ClaimSheet = memo(function ClaimSheet() {
  const insets = useSafeAreaInsets();
  const at = useGame((s) => s.claimed?.at ?? 0);
  const kind = useGame((s) => s.claimed?.kind ?? 'daily');
  const doubled = useGame((s) => s.claimed?.doubled ?? false);
  const cash = useGame((s) => s.claimed?.delta.cash ?? 0);
  const diamonds = useGame((s) => s.claimed?.delta.diamonds ?? 0);
  const covered = useGame((s) => !!s.playing || !!s.offline);
  const dismiss = useCallback(() => useGame.getState().dismissClaim(), []);
  const double = useCallback(() => void useGame.getState().doubleClaim(), []);
  useEffect(() => {
    if (!at) return;
    const t = setTimeout(dismiss, CLAIM_SHEET_MS);
    return () => clearTimeout(t);
  }, [at, dismiss]);
  if (!at || covered) return null;
  const paid = deltaText({ cash: doubled ? cash * 2 : cash, diamonds: doubled ? diamonds * 2 : diamonds }, money);
  return (
    <View style={StyleSheet.absoluteFill} pointerEvents="box-none">
      <View style={styles.scrim} pointerEvents="none" testID="claim-scrim" />
      <View style={[styles.wrap, { paddingBottom: insets.bottom + 12 }]} pointerEvents="box-none">
        <View style={styles.card} testID="claim-sheet" accessibilityViewIsModal={false}>
          <Text style={styles.title} testID="claim-title">
            {doubled ? 'Doubled! ×2' : TITLE[kind]}
          </Text>
          <Text style={styles.paid} testID="claim-paid" accessibilityLiveRegion="polite">
            {paid}
          </Text>
          {!doubled && <AdButton placement="double_claim" label={doubleLabel({ cash, diamonds }, money)} plusLabel="Double it · Nonna’s Plus" testID="claim-double" onBenefit={double} onSkip={dismiss} />}
          <Pressable testID="claim-done" accessibilityRole="button" accessibilityLabel={doubled ? 'Done' : 'No thanks'} onPress={dismiss} style={styles.done}>
            <Text style={styles.doneText}>{doubled ? 'Done' : 'No thanks'}</Text>
          </Pressable>
        </View>
      </View>
    </View>
  );
});

const styles = StyleSheet.create({
  scrim: { position: 'absolute', top: 0, left: 0, right: 0, bottom: 0, backgroundColor: 'rgba(30,14,8,0.45)' },
  wrap: { position: 'absolute', left: 0, right: 0, bottom: 0, alignItems: 'center', paddingHorizontal: 12 },
  card: { alignSelf: 'stretch', maxWidth: 420, backgroundColor: C.bg, borderRadius: 20, borderWidth: 3, borderColor: C.ink, padding: 14, gap: 8, alignItems: 'stretch' },
  title: { fontFamily: F.bold, fontSize: 17, color: C.ink, textAlign: 'center' },
  paid: { fontFamily: F.bold, fontSize: 22, color: C.basilDark, textAlign: 'center' },
  done: { minHeight: 44, borderRadius: 14, borderWidth: 2, borderColor: C.ink, backgroundColor: '#fff', alignItems: 'center', justifyContent: 'center' },
  doneText: { fontFamily: F.bold, fontSize: 15, color: C.ink },
});
