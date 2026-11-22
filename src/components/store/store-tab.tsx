// The Shop screen's Store tab (card U3): the Starter Pack until it is bought, Nonna's Plus and the three diamond packs. Prices are the store's own
// (`purchases.products()`); while they load, or when they don't come, a pack shows no price and a disabled button, never a placeholder.
// Debug on the web build only: `?prices=loading` never answers, `?prices=failed` answers with none.
import { router, useNavigation } from 'expo-router';
import { memo, useCallback, useEffect, useMemo, useState } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';

import { rewardIncome } from '../../engine/rewards';
import { analytics, EVENTS, purchases, type ProductId } from '../../services';
import { queryFlag } from '../../services/query';
import { useGame } from '../../store/game-store';
import { C, F } from '../../theme';
import { useCoachTarget } from '../coach/targets';
import { Portrait } from '../portrait/index';
import { gameNow } from '../../engine/clock';
import { adCount7, amountsFrom, createSeenOnce, looksUnowned, pricesFrom, productRows, type Amounts, type Prices, type ProductRow } from './store-model';
import { ChipRow, FounderStorefront, PackArt, Ribbon } from './store-art';
import { usePurchase } from './use-purchase';

/** The store's answer: its price texts and its numbers (for "Best rate"), both `null` while it is asked. */
export interface Catalog {
  prices: Prices;
  amounts: Amounts;
}
const LOADING: Catalog = { prices: null, amounts: null };
const NONE: Catalog = { prices: {}, amounts: {} };

/** The prices from the store, `null` while it is asked. */
export function useCatalog(): Catalog {
  const [catalog, setCatalog] = useState<Catalog>(LOADING);
  useEffect(() => {
    let live = true;
    const flag = queryFlag('prices');
    if (flag === 'loading') return;
    if (flag === 'failed') {
      setCatalog(NONE);
      return;
    }
    purchases
      .products()
      .then((list) => live && setCatalog({ prices: pricesFrom(list), amounts: amountsFrom(list) }))
      .catch(() => live && setCatalog(NONE));
    return () => {
      live = false;
    };
  }, []);
  return catalog;
}

/** The card's picture: a storefront under the Founder awning for the Starter Pack, Nonna on her Plus, a gem, a pouch or a crate of them on the packs. */
function ProductArt({ id }: { id: ProductId }) {
  if (id === 'nonnas_plus') return <Portrait id="nonna-rosa" size={56} />;
  if (id === 'starter_pack') return null;
  return <PackArt id={id} size={56} />;
}

/** One `pack_card_seen` per card per Shop opening (the Store tab is left and returned to inside one). */
const packsSeen = createSeenOnce();

const ProductCard = memo(function ProductCard({
  row,
  busy,
  onBuy,
  onClose,
}: {
  row: ProductRow;
  busy: boolean;
  onBuy: (id: ProductId) => void;
  onClose: () => void;
}) {
  const { id, title, blurb, label, state, enabled } = row;
  const press = useCallback(() => onBuy(id), [onBuy, id]);
  const starter = id === 'starter_pack';
  // Nonna's Store intro (tutorial step 17) lights the Starter card; only that card is the target
  const target = useCoachTarget('store:starter');
  const owned = state === 'owned';
  useEffect(() => {
    if (!owned && packsSeen.first(id)) analytics.track(EVENTS.packCardSeen, { id });
  }, [id, owned]);
  return (
    <View testID={`product-${id}`} style={styles.card} {...(starter ? { ref: target, onLayout: target.onLayout, collapsable: false } : null)}>
      {starter && <FounderStorefront height={44} />}
      <View style={styles.top}>
        <ProductArt id={id} />
        <View style={styles.text}>
          <View style={styles.nameRow}>
            <Text style={styles.name} numberOfLines={2} maxFontSizeMultiplier={1.15}>
              {title}
            </Text>
          </View>
          {row.tags.length > 0 && (
            <View style={styles.tags}>
              {row.tags.map((tag) => (
                <Ribbon key={tag} inline text={tag} />
              ))}
            </View>
          )}
          {row.nonna !== null && (
            <Text style={styles.nonna} testID="starter-nonna" maxFontSizeMultiplier={1.15}>
              “{row.nonna}”
            </Text>
          )}
          {row.base !== null && (
            <View style={styles.baseRow}>
              <Text style={styles.base} testID={`base-${id}`} maxFontSizeMultiplier={1.15}>
                {row.base.toLocaleString('en-US')}
              </Text>
              {row.bonus !== null && (
                <Text style={styles.bonus} testID={`bonus-${id}`} maxFontSizeMultiplier={1.15}>
                  {row.bonus}
                </Text>
              )}
            </View>
          )}
          {row.firstLine !== null && (
            <Text style={styles.first} testID={`first-${id}`} maxFontSizeMultiplier={1.15}>
              {row.firstLine}
            </Text>
          )}
          {blurb !== '' && (
            <Text style={styles.desc} numberOfLines={3} maxFontSizeMultiplier={1.15}>
              {blurb}
            </Text>
          )}
          {row.adLine !== null && (
            <Text style={styles.desc} testID="plus-ads" maxFontSizeMultiplier={1.15}>
              {row.adLine}
            </Text>
          )}
          {row.once !== null && (
            <Text style={styles.once} maxFontSizeMultiplier={1.15}>
              {row.once}
            </Text>
          )}
        </View>
      </View>
      <ChipRow chips={row.chips} />
      {row.rate !== null && (
        <Text style={styles.rate} testID="starter-rate" maxFontSizeMultiplier={1.15}>
          {row.rate}
        </Text>
      )}
      <Pressable
        testID={`buy-${id}`}
        accessibilityRole="button"
        accessibilityLabel={owned ? `${title}: owned` : enabled ? `Buy ${title} for ${label}` : `${title}: ${label}`}
        accessibilityState={{ disabled: !enabled || busy, busy }}
        disabled={!enabled || busy}
        onPress={press}
        style={({ pressed }) => [
          styles.btn,
          enabled ? styles.btnBuy : owned ? styles.btnOwned : styles.btnOff,
          busy && styles.busy,
          pressed && enabled && { transform: [{ translateY: 2 }] },
        ]}
      >
        <Text
          style={[styles.btnText, !enabled && (owned ? styles.btnTextOwned : styles.btnTextOff)]}
          numberOfLines={1}
          adjustsFontSizeToFit
          maxFontSizeMultiplier={1.15}
        >
          {busy ? 'One moment…' : label}
        </Text>
      </Pressable>
      {starter && !owned && (
        <Pressable testID="starter-not-now" accessibilityRole="button" accessibilityLabel="Not now" onPress={onClose} style={styles.later}>
          <Text style={styles.laterText} maxFontSizeMultiplier={1.15}>
            Not now
          </Text>
        </Pressable>
      )}
    </View>
  );
});

/** `onClose` closes the Shop (the Starter card's "Not now"); the Shop gives it, and without one the screen goes back. */
export function StoreTab({ onClose = router.back }: { onClose?: () => void }) {
  const { prices, amounts } = useCatalog();
  const { busy, line, owned, firstUsed, buy } = usePurchase();
  // the pace is read once as the tab opens: "about" what the Starter's boost earns, not a live counter
  const [income] = useState(() => rewardIncome(useGame.getState().game));
  // looks for sale the player does not own, read once too (G121: "Enough for N looks" never promises more than the Style tab sells)
  const [looksLeft] = useState(() => looksUnowned(useGame.getState().game.rewards.cosmetics));
  const adGrants = useGame((s) => s.prefs.adGrants);
  const adCount = adCount7(adGrants, gameNow());
  useEffect(() => {
    analytics.track(EVENTS.iapViewed, { surface: 'store_tab' });
  }, []);
  // the Shop closing (or another screen over it) starts a new count of cards seen (C186)
  // the screen's own blur (a tab switch unmounts this tab without one, C188), so a tab switch does not count as a new opening
  const navigation = useNavigation();
  useEffect(() => navigation.addListener('blur', () => packsSeen.reset()), [navigation]);
  const rows = useMemo(
    () => productRows(prices, owned, { amounts, firstUsed, adCount, income, looksLeft }),
    [prices, owned, amounts, firstUsed, adCount, income, looksLeft],
  );
  return (
    <View style={styles.list} testID="store-tab">
      <Text style={styles.note} testID="store-note">
        Every pack gives exactly what it says. Nothing here is a random prize.
      </Text>
      {rows.map((r) => (
        <ProductCard key={r.id} row={r} busy={busy === r.id} onBuy={buy} onClose={onClose} />
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
  card: { backgroundColor: '#fff', borderRadius: 16, borderWidth: 2.5, borderColor: C.ink, padding: 10, paddingTop: 12, gap: 8, overflow: 'hidden' },
  top: { flexDirection: 'row', alignItems: 'center', gap: 10 },
  text: { flex: 1 },
  nameRow: { flexDirection: 'row', alignItems: 'center' },
  tags: { flexDirection: 'row', flexWrap: 'wrap', gap: 6, marginTop: 2 },
  first: { fontFamily: F.semi, fontSize: 13, color: C.ink },
  name: { fontFamily: F.bold, fontSize: 16, color: C.ink },
  nonna: { fontFamily: F.semi, fontSize: 13, lineHeight: 17, fontStyle: 'italic', color: C.ink },
  baseRow: { flexDirection: 'row', alignItems: 'center', gap: 8, flexWrap: 'wrap' },
  base: { fontFamily: F.bold, fontSize: 20, color: C.ink },
  bonus: { fontFamily: F.bold, fontSize: 14, color: C.basilDark },
  once: { fontFamily: F.semi, fontSize: 13, color: C.basilDark },
  rate: { fontFamily: F.bold, fontSize: 13, color: C.basilDark, textAlign: 'center' },
  later: {
    minHeight: 44,
    borderRadius: 12,
    borderWidth: 2,
    borderColor: C.ink,
    backgroundColor: '#fff',
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 12,
  },
  laterText: { fontFamily: F.bold, fontSize: 15, color: C.ink },
  desc: { fontFamily: F.regular, fontSize: 13, lineHeight: 16, color: C.inkSoft },
  btn: { minHeight: 44, borderRadius: 12, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', paddingHorizontal: 12, borderBottomWidth: 4 },
  btnBuy: { backgroundColor: C.basil, borderBottomColor: C.basilDark },
  btnOff: { backgroundColor: '#E2D9CE', borderBottomColor: '#C9BCAD' },
  btnOwned: { backgroundColor: '#fff', borderBottomColor: C.basil, borderWidth: 2, borderColor: C.basil },
  busy: { opacity: 0.6 },
  btnText: { fontFamily: F.bold, fontSize: 15, color: '#fff' },
  btnTextOff: { color: '#665A4F' },
  btnTextOwned: { color: C.basilDark },
  line: { fontFamily: F.semi, fontSize: 14, color: C.ink, textAlign: 'center' },
});
