// The Shop screen's Store tab (card U3): the Starter Pack until it is bought, Nonna's Plus and the three diamond packs. Prices are the store's own
// (`purchases.products()`); while they load, or when they don't come, a pack shows no price and a disabled button, never a placeholder.
// Debug on the web build only: `?prices=loading` never answers, `?prices=failed` answers with none.
import { memo, useCallback, useEffect, useState } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';

import { analytics, EVENTS, purchases, type ProductId } from '../../services';
import { queryFlag } from '../../services/query';
import { C, F } from '../../theme';
import { DiamondIcon, GiftIcon, StarIcon } from '../icons';
import { pricesFrom, productRows, type Prices, type ProductRow } from './store-model';
import { usePurchase } from './use-purchase';

/** The prices from the store, `null` while it is asked. */
export function usePrices(): Prices {
  const [prices, setPrices] = useState<Prices>(null);
  useEffect(() => {
    let live = true;
    const flag = queryFlag('prices');
    if (flag === 'loading') return;
    if (flag === 'failed') {
      setPrices({});
      return;
    }
    purchases
      .products()
      .then((list) => live && setPrices(pricesFrom(list)))
      .catch(() => live && setPrices({}));
    return () => {
      live = false;
    };
  }, []);
  return prices;
}

function ProductIcon({ id }: { id: ProductId }) {
  return id === 'starter_pack' ? <GiftIcon size={40} /> : id === 'nonnas_plus' ? <StarIcon size={40} /> : <DiamondIcon size={40} />;
}

const ProductCard = memo(function ProductCard({ id, title, blurb, label, state, enabled, busy, onBuy }: { id: ProductId; title: string; blurb: string; label: string; state: ProductRow['state']; enabled: boolean; busy: boolean; onBuy: (id: ProductId) => void }) {
  const press = useCallback(() => onBuy(id), [onBuy, id]);
  return (
    <View testID={`product-${id}`} style={styles.card}>
      <View style={styles.top}>
        <ProductIcon id={id} />
        <View style={styles.text}>
          <Text style={styles.name} numberOfLines={1} maxFontSizeMultiplier={1.15}>
            {title}
          </Text>
          <Text style={styles.desc} numberOfLines={3} maxFontSizeMultiplier={1.15}>
            {blurb}
          </Text>
        </View>
      </View>
      <Pressable
        testID={`buy-${id}`}
        accessibilityRole="button"
        accessibilityLabel={state === 'owned' ? `${title}: owned` : enabled ? `Buy ${title} for ${label}` : `${title}: ${label}`}
        accessibilityState={{ disabled: !enabled || busy, busy }}
        disabled={!enabled || busy}
        onPress={press}
        style={({ pressed }) => [styles.btn, enabled ? styles.btnBuy : state === 'owned' ? styles.btnOwned : styles.btnOff, busy && styles.busy, pressed && enabled && { transform: [{ translateY: 2 }] }]}>
        <Text style={[styles.btnText, !enabled && (state === 'owned' ? styles.btnTextOwned : styles.btnTextOff)]} numberOfLines={1} adjustsFontSizeToFit maxFontSizeMultiplier={1.15}>
          {busy ? 'One moment…' : label}
        </Text>
      </Pressable>
    </View>
  );
});

export function StoreTab() {
  const prices = usePrices();
  const { busy, line, owned, buy } = usePurchase();
  useEffect(() => {
    analytics.track(EVENTS.iapViewed, { surface: 'store_tab' });
  }, []);
  const rows = productRows(prices, owned);
  return (
    <View style={styles.list} testID="store-tab">
      <Text style={styles.note} testID="store-note">
        Every pack gives exactly what it says. Nothing here is a random prize.
      </Text>
      {rows.map((r) => (
        <ProductCard key={r.id} id={r.id} title={r.title} blurb={r.blurb} label={r.label} state={r.state} enabled={r.enabled} busy={busy === r.id} onBuy={buy} />
      ))}
      {line !== '' && (
        <Text style={styles.line} testID="store-line" accessibilityLiveRegion="polite">
          {line}
        </Text>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  list: { gap: 10 },
  note: { fontFamily: F.semi, fontSize: 13, color: C.inkSoft, textAlign: 'center' },
  card: { backgroundColor: '#fff', borderRadius: 16, borderWidth: 2.5, borderColor: C.ink, padding: 10, gap: 8 },
  top: { flexDirection: 'row', alignItems: 'center', gap: 10 },
  text: { flex: 1 },
  name: { fontFamily: F.bold, fontSize: 16, color: C.ink },
  desc: { fontFamily: F.regular, fontSize: 13, lineHeight: 16, color: C.inkSoft },
  btn: { minHeight: 44, borderRadius: 12, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', paddingHorizontal: 12, borderBottomWidth: 4 },
  btnBuy: { backgroundColor: '#2D8FD9', borderBottomColor: '#1D5F9A' },
  btnOff: { backgroundColor: '#E2D9CE', borderBottomColor: '#C9BCAD' },
  btnOwned: { backgroundColor: '#fff', borderBottomColor: C.basil, borderWidth: 2, borderColor: C.basil },
  busy: { opacity: 0.6 },
  btnText: { fontFamily: F.bold, fontSize: 15, color: '#fff' },
  btnTextOff: { color: '#665A4F' },
  btnTextOwned: { color: C.basilDark },
  line: { fontFamily: F.semi, fontSize: 14, color: C.ink, textAlign: 'center' },
});
