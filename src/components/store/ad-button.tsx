// The one ad button (card U3). The rule is ad-model.ts `runAd`: a Nonna's Plus owner gets the benefit at once (and the button says so);
// anyone else sees the film icon, watches the ad, and on a dismissed or missing ad simply goes on, with no error screen.
import * as Haptics from 'expo-haptics';
import { memo, useCallback, useEffect, useState } from 'react';
import { Platform, Pressable, StyleSheet, Text, View } from 'react-native';
import Svg, { Circle, Path, Rect } from 'react-native-svg';

import { ads, analytics, EVENTS, type AdPlacement } from '../../services';
import { useGame } from '../../store/game-store';
import { C, F } from '../../theme';
import { StarIcon } from '../icons';
import { adLabel, adOffering, buttonShown, gives, READY_CHECK_MS, runAd } from './ad-model';

/** The film-strip icon of every ad button. */
export function FilmIcon({ size = 20, color = C.ink }: { size?: number; color?: string }) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" accessibilityElementsHidden importantForAccessibility="no-hide-descendants">
      <Rect x={2.5} y={4.5} width={19} height={15} rx={3} fill="none" stroke={color} strokeWidth={2} />
      <Path d="M10 9 L15.5 12 L10 15 Z" fill={color} />
      <Circle cx={5.6} cy={8} r={0.9} fill={color} />
      <Circle cx={5.6} cy={12} r={0.9} fill={color} />
      <Circle cx={5.6} cy={16} r={0.9} fill={color} />
      <Circle cx={18.4} cy={8} r={0.9} fill={color} />
      <Circle cx={18.4} cy={12} r={0.9} fill={color} />
      <Circle cx={18.4} cy={16} r={0.9} fill={color} />
    </Svg>
  );
}

export interface AdButtonProps {
  placement: AdPlacement;
  /** The words with the film icon: "Double it". */
  label: string;
  /** The words for a Plus owner, whose benefit is given at once: "Double it · Plus". */
  plusLabel: string;
  testID: string;
  /** The benefit: called after a finished ad, or at once for a Plus owner. */
  onBenefit: () => void;
  /** The ad was dismissed or none was there: the player goes on without the benefit. */
  onSkip?: () => void;
  /** The narrow form for a list row: icon and a short word, 8 pt padding. Still 44 pt tall. */
  compact?: boolean;
}

/** A 44 pt button; nothing at all when the player has no Plus and no ad could be shown. Memoised on primitives and stable callbacks. */
export const AdButton = memo(function AdButton({ placement, label, plusLabel, testID, onBenefit, onSkip, compact = false }: AdButtonProps) {
  const plus = useGame((s) => s.plus);
  const [ready, setReady] = useState(() => ads.ready(placement));
  const [busy, setBusy] = useState(false);
  const [note, setNote] = useState('');
  useEffect(() => {
    // asks again now and every few seconds: after a stale or unfilled ad the service loads another, and the button returns on its own
    setReady(ads.ready(placement));
    const t = setInterval(() => setReady(ads.ready(placement)), READY_CHECK_MS);
    return () => clearInterval(t);
  }, [placement]);
  const shown = buttonShown(plus, ready);
  // ad_offered: each time the button comes on show for a player who would watch an ad (an ad is ready, no Plus)
  const offering = adOffering(plus, ready);
  useEffect(() => {
    if (offering) analytics.track(EVENTS.adOffered, { placement });
  }, [offering, placement]);
  const press = useCallback(() => {
    if (busy) return;
    setBusy(true);
    setNote('');
    void runAd(placement, { plus, show: ads.show }).then((outcome) => {
      setBusy(false);
      // the ad is spent: ask again, so a failed show hides the button until the next one has loaded and a good one brings it back
      setReady(ads.ready(placement));
      if (gives(outcome)) {
        if (Platform.OS !== 'web') void Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success).catch(() => {});
        onBenefit();
      } else {
        setNote('No ad right now. Carry on!');
        onSkip?.();
      }
    });
  }, [busy, placement, plus, onBenefit, onSkip]);
  if (!shown) return null;
  const text = adLabel(plus, label, plusLabel);
  return (
    <View style={styles.wrap}>
      <Pressable
        testID={testID}
        accessibilityRole="button"
        accessibilityLabel={plus ? plusLabel : `${label}. Watch a short ad`}
        accessibilityState={{ disabled: busy, busy }}
        disabled={busy}
        onPress={press}
        style={({ pressed }) => [styles.btn, compact && styles.btnCompact, plus ? styles.btnPlus : styles.btnAd, busy && styles.busy, pressed && { transform: [{ translateY: 2 }] }]}>
        {plus ? <StarIcon size={20} /> : <FilmIcon size={20} />}
        <Text style={[styles.text, compact && styles.textCompact, plus && styles.textPlus]} numberOfLines={1} adjustsFontSizeToFit maxFontSizeMultiplier={1.15}>
          {busy ? (compact ? '…' : 'One moment…') : text}
        </Text>
      </Pressable>
      {note !== '' && (
        <Text testID={`${testID}-note`} style={styles.note} accessibilityLiveRegion="polite">
          {note}
        </Text>
      )}
    </View>
  );
});

const styles = StyleSheet.create({
  wrap: { alignSelf: 'stretch', gap: 4 },
  btn: { minHeight: 44, borderRadius: 14, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8, paddingHorizontal: 14, borderBottomWidth: 4 },
  btnAd: { backgroundColor: C.cheese, borderBottomColor: C.cheeseDark },
  btnPlus: { backgroundColor: C.basil, borderBottomColor: C.basilDark },
  btnCompact: { gap: 4, paddingHorizontal: 6 },
  busy: { opacity: 0.6 },
  text: { fontFamily: F.bold, fontSize: 16, color: C.ink, flexShrink: 1 },
  textCompact: { fontSize: 14 },
  textPlus: { color: '#fff' },
  note: { fontFamily: F.semi, fontSize: 12, color: C.inkSoft, textAlign: 'center' },
});
