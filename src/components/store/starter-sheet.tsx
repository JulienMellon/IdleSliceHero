// The Starter Pack, offered once after the tutorial (card U3). A modal sheet; "Not now" is as big as "Buy", and the pack stays in the Shop's Store tab.
import { memo, useCallback, useEffect, useState } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';

import { analytics, EVENTS, purchases } from '../../services';
import { useGame } from '../../store/game-store';
import { C, F } from '../../theme';
import { GiftIcon } from '../icons';
import { ChipRow, FounderAwning, Ribbon } from './store-art';
import { PRODUCT_RIBBON, PRODUCTS, productChips, productRows, starterShows } from './store-model';
import { usePrices } from './store-tab';
import { usePurchase } from './use-purchase';

/** The sheet's own gate, as primitives: the tutorial ended in play, it hasn't been offered, nothing else is up. */
function useStarterGate(): boolean {
  const at = useGame((s) => s.starterAt);
  const sec = useGame((s) => Math.floor(s.game.playSeconds));
  const offered = useGame((s) => s.prefs.starterOffered);
  const covered = useGame((s) => !!s.playing || !!s.offline || !s.titleDone || s.bonusHold);
  const [owned] = useState(() => purchases.owned().includes('starter_pack'));
  return starterShows({ at, playSeconds: sec, offered, owned, covered });
}

export const StarterSheet = memo(function StarterSheet() {
  const gate = useStarterGate();
  // once shown it stays up until answered, even when the gate would close (a drawer opening behind it)
  const [up, setUp] = useState(false);
  useEffect(() => {
    if (gate && !up) {
      setUp(true);
      useGame.getState().markStarterOffered();
      analytics.track(EVENTS.iapViewed, { surface: 'starter_sheet' });
    }
  }, [gate, up]);
  const close = useCallback(() => setUp(false), []);
  if (!up) return null;
  return <StarterCard onClose={close} />;
});

function StarterCard({ onClose }: { onClose: () => void }) {
  const prices = usePrices();
  const { busy, line, owned, buy } = usePurchase();
  const row = productRows(prices, owned).find((r) => r.id === 'starter_pack');
  // bought here: the pack leaves the rows, so the sheet shows the thanks and a Done
  const bought = !row;
  const press = useCallback(() => buy('starter_pack'), [buy]);
  return (
    <View style={styles.overlay} testID="starter-sheet">
      <View style={styles.modal}>
        <Ribbon text={PRODUCT_RIBBON.starter_pack ?? ''} />
        <FounderAwning height={64} />
        <View style={styles.gift}>
          <GiftIcon size={40} />
        </View>
        <Text style={styles.head}>{PRODUCTS.starter_pack.title}</Text>
        <Text style={styles.body}>{bought ? line || 'Thank you! It’s yours.' : PRODUCTS.starter_pack.blurb}</Text>
        {!bought && <ChipRow chips={productChips('starter_pack')} />}
        {!bought && row && (
          <Pressable
            testID="starter-buy"
            accessibilityRole="button"
            accessibilityLabel={row.enabled ? `Buy the Starter Pack for ${row.label}` : `Starter Pack: ${row.label}`}
            accessibilityState={{ disabled: !row.enabled || busy !== null, busy: busy !== null }}
            disabled={!row.enabled || busy !== null}
            onPress={press}
            style={[styles.btn, row.enabled ? styles.btnBuy : styles.btnOff, busy !== null && { opacity: 0.6 }]}>
            <Text style={[styles.btnText, !row.enabled && { color: '#665A4F' }]} numberOfLines={1} adjustsFontSizeToFit maxFontSizeMultiplier={1.15}>
              {busy !== null ? 'One moment…' : row.label}
            </Text>
          </Pressable>
        )}
        {!bought && line !== '' && <Text style={styles.line}>{line}</Text>}
        <Pressable testID="starter-close" accessibilityRole="button" accessibilityLabel={bought ? 'Done' : 'Not now'} onPress={onClose} style={styles.later}>
          <Text style={styles.laterText}>{bought ? 'Done' : 'Not now'}</Text>
        </Pressable>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  overlay: { position: 'absolute', top: 0, left: 0, right: 0, bottom: 0, backgroundColor: 'rgba(30,14,8,0.6)', alignItems: 'center', justifyContent: 'center', padding: 24 },
  modal: { backgroundColor: C.bg, borderRadius: 24, borderWidth: 4, borderColor: C.ink, padding: 18, paddingTop: 22, alignItems: 'stretch', width: '100%', maxWidth: 360, gap: 8 },
  gift: { alignSelf: 'center' },
  head: { fontFamily: F.bold, fontSize: 24, color: C.ink, textAlign: 'center' },
  body: { fontFamily: F.semi, fontSize: 15, color: C.inkSoft, textAlign: 'center' },
  btn: { minHeight: 48, borderRadius: 14, alignItems: 'center', justifyContent: 'center', paddingHorizontal: 12, borderBottomWidth: 4 },
  btnBuy: { backgroundColor: C.basil, borderBottomColor: C.basilDark },
  btnOff: { backgroundColor: '#E2D9CE', borderBottomColor: '#C9BCAD' },
  btnText: { fontFamily: F.bold, fontSize: 17, color: '#fff' },
  line: { fontFamily: F.semi, fontSize: 13, color: C.ink, textAlign: 'center' },
  later: { minHeight: 44, borderRadius: 14, borderWidth: 2, borderColor: C.ink, backgroundColor: '#fff', alignItems: 'center', justifyContent: 'center' },
  laterText: { fontFamily: F.bold, fontSize: 15, color: C.ink },
});
