// The Shop screen (v5.15), opened from the diamond chip. Tab 1, Shop Style: the seven cosmetics, each owned (wear / take off), for
// 150 diamonds, or earned (the master's plaque: "earn 18 stars", never sold). Tab 2, Booster Shelf: the inventory with an Activate
// button each, or the empty-shelf line. Boosters have no diamond price: they are never sold for diamonds. Data: endgame/shop-model.ts.
import { router, useFocusEffect } from 'expo-router';
import { useCallback, useMemo, useState } from 'react';
import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { boosterShelf, SHELF_EMPTY, SHOP_TABS, vanityViews, type VanityView } from '@/components/endgame/shop-model';
import { VanityArt } from '@/components/endgame/vanity-art';
import { haptic, Toast } from '@/components/game-ui';
import { BoostIcon, DiamondIcon } from '@/components/icons';
import { TAP } from '@/components/tap-targets';
import { useGame } from '@/store/game-store';
import { C, F } from '@/theme';

type Tab = 0 | 1;

function VanityCard({ v, onWear, onBuy }: { v: VanityView; onWear: (id: string, on: boolean) => void; onBuy: (id: string) => void }) {
  const can = v.state === 'owned' || v.state === 'worn' || v.state === 'buy';
  const press = () => {
    if (v.state === 'buy' && v.buyId) onBuy(v.buyId);
    else if (v.wearId) onWear(v.wearId, v.state !== 'worn');
    else if (v.state === 'poor' && v.buyId) onBuy(v.buyId);
  };
  return (
    <View testID={`vanity-${v.id}`} style={styles.card}>
      <View style={styles.cardTop}>
        <VanityArt id={v.id} />
        <View style={styles.cardText}>
          <Text style={styles.name} numberOfLines={1} maxFontSizeMultiplier={1.15}>
            {v.name}
          </Text>
          <Text style={styles.desc} numberOfLines={3} maxFontSizeMultiplier={1.15}>
            {v.desc}
          </Text>
        </View>
      </View>
      <Pressable
        testID={`vanity-${v.id}-button`}
        disabled={v.state === 'earn'}
        accessibilityRole="button"
        accessibilityLabel={v.state === 'worn' ? `${v.name}: worn. Take off` : v.state === 'owned' ? `Wear ${v.name}` : v.state === 'earn' ? `${v.name}: ${v.label}` : `${v.name}: ${v.label}`}
        onPress={press}
        style={({ pressed }) => [styles.btn, v.state === 'worn' && styles.btnWorn, v.state === 'owned' && styles.btnWear, v.state === 'buy' && styles.btnBuy, (v.state === 'poor' || v.state === 'earn') && styles.btnOff, pressed && can && styles.pressed]}>
        {(v.state === 'buy' || v.state === 'poor') && <DiamondIcon size={18} />}
        <Text style={[styles.btnText, v.state === 'worn' && styles.btnTextWorn, (v.state === 'poor' || v.state === 'earn') && styles.btnTextOff]} numberOfLines={1} adjustsFontSizeToFit maxFontSizeMultiplier={1.15}>
          {v.state === 'worn' ? 'Worn ✓' : v.label}
        </Text>
      </Pressable>
    </View>
  );
}

export default function Shop() {
  const insets = useSafeAreaInsets();
  const toast = useGame((s) => s.toast);
  const diamonds = useGame((s) => Math.floor(s.game.rewards.diamonds));
  // primitives: the screen repaints when a diamond, a cosmetic or a booster changes, not on every game tick
  const wardrobe = useGame((s) => `${s.game.rewards.cosmetics.join(',')}|${s.game.rewards.worn.join(',')}|${Math.floor(s.game.rewards.diamonds)}`);
  const shelfKey = useGame((s) => s.game.rewards.boosters.map((b) => `${b.mult}:${b.seconds}`).join(','));
  const [tab, setTab] = useState<Tab>(0);
  // G94: leaving the screen takes its toast with it
  useFocusEffect(useCallback(() => () => useGame.setState({ toast: null }), []));
  const { equip, buyCosmetic, startBooster } = useGame.getState();
  const vanity = useMemo(() => vanityViews(useGame.getState().game), [wardrobe]); // eslint-disable-line react-hooks/exhaustive-deps -- `wardrobe` is what the views depend on
  const shelf = useMemo(() => boosterShelf(useGame.getState().game), [shelfKey]); // eslint-disable-line react-hooks/exhaustive-deps -- `shelfKey` is what the shelf depends on
  const tabs = SHOP_TABS();
  return (
    <View style={[styles.root, { paddingTop: insets.top }]}>
      <View style={styles.header}>
        <Pressable onPress={() => router.back()} style={styles.back} testID="back" accessibilityRole="button" accessibilityLabel="Back">
          <Text style={styles.backText}>{'‹ Back'}</Text>
        </Pressable>
        <View style={styles.gems} testID="shop-diamonds">
          <DiamondIcon size={22} />
          <Text style={styles.gemsText}>{diamonds}</Text>
        </View>
      </View>
      <View style={styles.tabs} accessibilityRole="tablist">
        {tabs.map((label, i) => (
          <Pressable key={label} testID={`shop-tab-${i}`} accessibilityRole="tab" accessibilityState={{ selected: tab === i }} onPress={() => setTab(i as Tab)} style={[styles.tab, tab === i && styles.tabOn]}>
            <Text style={[styles.tabText, tab === i && styles.tabTextOn]} numberOfLines={1} adjustsFontSizeToFit>
              {label}
            </Text>
          </Pressable>
        ))}
      </View>
      <ScrollView contentContainerStyle={{ padding: 14, gap: 10, paddingBottom: insets.bottom + 24 }}>
        {tab === 0 ? (
          vanity.map((v) => <VanityCard key={v.id} v={v} onWear={(id, on) => equip(id, on)} onBuy={(id) => haptic(buyCosmetic(id) ? 'success' : 'error')} />)
        ) : shelf.length === 0 ? (
          <Text testID="shelf-empty" style={styles.empty}>
            {SHELF_EMPTY()}
          </Text>
        ) : (
          shelf.map((row) => (
            <View key={row.index} testID={`shelf-${row.index}`} style={styles.shelfRow}>
              <BoostIcon size={26} />
              <Text style={styles.shelfLabel} numberOfLines={1}>
                {row.label}
              </Text>
              <Pressable testID={`shelf-activate-${row.index}`} accessibilityRole="button" accessibilityLabel={`Activate ${row.label} booster`} onPress={() => haptic(startBooster(row.index) ? 'success' : 'error')} style={({ pressed }) => [styles.btn, styles.btnBuy, styles.activate, pressed && styles.pressed]}>
                <Text style={styles.btnText}>Activate</Text>
              </Pressable>
            </View>
          ))
        )}
      </ScrollView>
      {toast && <Toast compact text={toast.text} top={insets.top + 56} />}
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: C.bg },
  header: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 14, paddingVertical: 8, backgroundColor: C.tomato, borderBottomWidth: 4, borderColor: C.tomatoDark },
  back: { minWidth: 70, minHeight: TAP.min, justifyContent: 'center' },
  backText: { fontFamily: F.bold, color: '#fff', fontSize: 18 },
  gems: { flexDirection: 'row', alignItems: 'center', gap: 6, minHeight: TAP.min, paddingHorizontal: 12, borderRadius: 22, backgroundColor: 'rgba(255,255,255,0.22)' },
  gemsText: { fontFamily: F.bold, fontSize: 18, color: '#fff' },
  tabs: { flexDirection: 'row', gap: 8, paddingHorizontal: 14, paddingTop: 10 },
  tab: { flex: 1, minHeight: TAP.min, borderRadius: 14, borderWidth: 2.5, borderColor: C.ink, backgroundColor: '#fff', alignItems: 'center', justifyContent: 'center', paddingHorizontal: 6 },
  tabOn: { backgroundColor: C.tomato, borderColor: C.tomatoDark },
  tabText: { fontFamily: F.bold, fontSize: 15, color: C.ink },
  tabTextOn: { color: '#fff' },
  card: { backgroundColor: '#fff', borderRadius: 16, borderWidth: 2.5, borderColor: C.ink, padding: 10, gap: 8 },
  cardTop: { flexDirection: 'row', alignItems: 'center', gap: 10 },
  cardText: { flex: 1 },
  name: { fontFamily: F.bold, fontSize: 16, color: C.ink },
  desc: { fontFamily: F.regular, fontSize: 13, lineHeight: 16, color: C.inkSoft },
  btn: { minHeight: TAP.min, borderRadius: 12, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 6, paddingHorizontal: 12, borderBottomWidth: 4 },
  btnWear: { backgroundColor: C.basil, borderBottomColor: C.basilDark },
  btnWorn: { backgroundColor: '#E6F4E8', borderBottomColor: '#B9DDBF', borderWidth: 2, borderColor: C.basil },
  btnBuy: { backgroundColor: C.basil, borderBottomColor: C.basilDark },
  btnOff: { backgroundColor: '#E2D9CE', borderBottomColor: '#C9BCAD' },
  btnText: { fontFamily: F.bold, fontSize: 15, color: '#fff' },
  btnTextWorn: { color: C.basilDark },
  btnTextOff: { color: '#665A4F' },
  pressed: { transform: [{ translateY: 2 }] },
  empty: { fontFamily: F.semi, fontSize: 15, color: C.inkSoft, textAlign: 'center', paddingVertical: 30 },
  shelfRow: { flexDirection: 'row', alignItems: 'center', gap: 10, backgroundColor: '#fff', borderRadius: 16, borderWidth: 2.5, borderColor: C.ink, padding: 10 },
  shelfLabel: { flex: 1, fontFamily: F.bold, fontSize: 16, color: C.ink },
  activate: { minWidth: 96 },
});
