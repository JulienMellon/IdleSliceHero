// The Shop screen (v5.15), opened from the diamond chip. Tab 1, Shop Style: the seven cosmetics, each owned (wear / take off), for
// 150 diamonds, or earned (the master's plaque: "earn 18 stars", never sold). Tab 2, Booster Shelf: a "Buy" section of three diamond boosters
// (v5.23, endgame/booster-buy.tsx), then one free booster a day for an ad, then the inventory with an Activate button each, or the empty-shelf line.
// Tab 3, Store (v5.17, components/store): the Starter Pack, Nonna's Plus and the diamond packs, for money. Data: endgame/shop-model.ts.
// No tab is locked (DECISIONS #47). `?tab=store` opens the Store tab; `?from=` says how the Shop was reached (store_opened). The first refused
// buy of a look shows Nonna's nudge to the Store (once per save).
import { router, useFocusEffect, useLocalSearchParams } from 'expo-router';
import { useCallback, useEffect, useMemo, useState } from 'react';
import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import Svg, { Path, Rect } from 'react-native-svg';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { CoachOverlay } from '@/components/coach/overlay';
import { BoosterBuy } from '@/components/endgame/booster-buy';
import { storeFrom, STORE_OPENED_EVENT, tabFromParam } from '@/components/endgame/diamond-chip-model';
import { NudgeCard } from '@/components/endgame/nudge-card';
import { useShopFlags } from '@/components/endgame/shop-flags';
import { nudgeShows } from '@/components/endgame/shop-flags-model';
import { boosterShelf, SHELF_EMPTY, SHOP_TABS, vanityViews, type VanityView } from '@/components/endgame/shop-model';
import { VanityArt } from '@/components/endgame/vanity-art';
import { haptic, Toast } from '@/components/game-ui';
import { AdButton } from '@/components/store/ad-button';
import { boosterAdOffer } from '@/components/store/ad-model';
import { StoreTab } from '@/components/store/store-tab';
import { BoostIcon, DiamondIcon } from '@/components/icons';
import { TAP } from '@/components/tap-targets';
import { Z } from '@/components/z-order';
import { analytics } from '@/services';
import { useGame } from '@/store/game-store';
import { C, F } from '@/theme';
import { gameNow } from '../engine/clock';
import type { CoachTargetId } from '../engine/coach-types';
import { coachStep, STARTER_STEP } from '../engine/tutorial';
import { rewardsUnlocked } from '../engine/rewards';

type Tab = 0 | 1 | 2;

/** The shelf's ad gives the booster; the store sets today as taken. Module-level, so the memoised button keeps one callback. */
const takeBooster = () => void useGame.getState().freeBooster();

const STARTER_TARGETS: readonly CoachTargetId[] = ['store:starter'];

/** Nonna's Store intro on this screen (tutorial 16-17): the Store tab opening ends 16, the Starter card is lit while 17 runs, and leaving the Shop ends 17. */
function StoreCoach({ tab }: { tab: Tab }) {
  const text = useGame((s) => (s.game.tutorial === STARTER_STEP ? (coachStep(s.game)?.text ?? '') : ''));
  const [seen, setSeen] = useState(false);
  useEffect(() => {
    if (tab === 2) useGame.getState().noteCoach('store-open');
  }, [tab]);
  useEffect(() => () => useGame.getState().noteCoach('store-left'), []);
  const onDone = useCallback(() => setSeen(true), []);
  if (!text || tab !== 2) return null;
  return (
    <View pointerEvents="box-none" style={styles.coachLayer}>
      <CoachOverlay targets={STARTER_TARGETS} mode={seen ? 'free' : 'look'} text={text} hand={false} onDone={onDone} />
    </View>
  );
}

function VanityCard({ v, onWear, onBuy }: { v: VanityView; onWear: (id: string, on: boolean) => void; onBuy: (id: string, short: boolean) => void }) {
  const can = v.state === 'owned' || v.state === 'worn' || v.state === 'buy';
  const press = () => {
    if (v.state === 'buy' && v.buyId) onBuy(v.buyId, false);
    else if (v.wearId) onWear(v.wearId, v.state !== 'worn');
    else if (v.state === 'poor' && v.buyId) onBuy(v.buyId, true);
  };
  return (
    <View testID={`vanity-${v.id}`} style={styles.card}>
      <View style={styles.cardTop}>
        <VanityArt id={v.id} size={64} />
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
        accessibilityLabel={
          v.state === 'worn'
            ? `${v.name}: worn. Take off`
            : v.state === 'owned'
              ? `Wear ${v.name}`
              : v.state === 'earn'
                ? `${v.name}: ${v.label}`
                : `${v.name}: ${v.label}`
        }
        onPress={press}
        style={({ pressed }) => [
          styles.btn,
          v.state === 'worn' && styles.btnWorn,
          v.state === 'owned' && styles.btnWear,
          v.state === 'buy' && styles.btnBuy,
          (v.state === 'poor' || v.state === 'earn') && styles.btnOff,
          pressed && can && styles.pressed,
        ]}
      >
        {(v.state === 'buy' || v.state === 'poor') && <DiamondIcon size={18} />}
        <Text
          style={[styles.btnText, v.state === 'worn' && styles.btnTextWorn, (v.state === 'poor' || v.state === 'earn') && styles.btnTextOff]}
          numberOfLines={1}
          adjustsFontSizeToFit
          maxFontSizeMultiplier={1.15}
        >
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
  const boosterAd = useGame((s) => boosterAdOffer(s.game, gameNow(), s.prefs.boosterAdDay));
  const params = useLocalSearchParams<{ tab?: string; from?: string }>();
  const [tab, setTab] = useState<Tab>(() => tabFromParam(params.tab));
  const [nudge, setNudge] = useState(false);
  // the Shop opened: say how, and use up the chip's dot if the takeover has happened
  useEffect(() => {
    analytics.track(STORE_OPENED_EVENT, { from: storeFrom(params.from) });
    useShopFlags.getState().opened(rewardsUnlocked(useGame.getState().game));
  }, []); // eslint-disable-line react-hooks/exhaustive-deps -- once per opening: the route's params are what it was opened with
  const nudgeToStore = useCallback(() => {
    analytics.track(STORE_OPENED_EVENT, { from: 'nudge' });
    setNudge(false);
    setTab(2);
  }, []);
  // G94: leaving the screen takes its toast with it
  useFocusEffect(useCallback(() => () => useGame.setState({ toast: null }), []));
  const { equip, buyCosmetic, startBooster } = useGame.getState();
  const vanity = useMemo(() => vanityViews(useGame.getState().game), [wardrobe]); // eslint-disable-line react-hooks/exhaustive-deps -- `wardrobe` is what the views depend on
  const shelf = useMemo(() => boosterShelf(useGame.getState().game), [shelfKey]); // eslint-disable-line react-hooks/exhaustive-deps -- `shelfKey` is what the shelf depends on
  const tabs = [...SHOP_TABS(), 'Store'];
  const buyLook = (id: string, short: boolean) => {
    const ok = buyCosmetic(id);
    haptic(ok ? 'success' : 'error');
    if (nudgeShows(useShopFlags.getState(), ok, short)) {
      useShopFlags.getState().markNudged();
      setNudge(true);
    }
  };
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
          <Pressable
            key={label}
            testID={`shop-tab-${i}`}
            accessibilityRole="tab"
            accessibilityState={{ selected: tab === i }}
            onPress={() => setTab(i as Tab)}
            style={[styles.tab, tab === i && styles.tabOn]}
          >
            <Text style={[styles.tabText, tab === i && styles.tabTextOn]} numberOfLines={1} adjustsFontSizeToFit>
              {label}
            </Text>
          </Pressable>
        ))}
      </View>
      <ScrollView contentContainerStyle={{ padding: 14, gap: 10, paddingBottom: insets.bottom + 24 }}>
        {tab === 1 && <BoosterBuy />}
        {tab === 1 && boosterAd && (
          <AdButton
            placement="daily_booster"
            label="Free booster: 2× for 15 min"
            plusLabel="Free booster · Nonna’s Plus"
            testID="booster-ad"
            onBenefit={takeBooster}
          />
        )}
        {tab === 0 && nudge && <NudgeCard onStore={nudgeToStore} />}
        {tab === 0 ? (
          vanity.map((v) => <VanityCard key={v.id} v={v} onWear={(id, on) => equip(id, on)} onBuy={buyLook} />)
        ) : tab === 2 ? (
          <StoreTab />
        ) : shelf.length === 0 ? (
          <View style={styles.emptyBox}>
            <Text testID="shelf-empty" style={styles.empty}>
              {SHELF_EMPTY()}
            </Text>
            {/* D462: an empty shelf, drawn below the line */}
            <Svg width={220} height={90} viewBox="0 0 220 90" accessibilityElementsHidden importantForAccessibility="no-hide-descendants">
              <Rect x={10} y={46} width={200} height={12} rx={3} fill="#A8714B" stroke={C.ink} strokeWidth={2} />
              <Path d="M30 58 V78 M190 58 V78 M30 58 L50 58 M190 58 L170 58" stroke={C.ink} strokeWidth={3} strokeLinecap="round" />
              <Path d="M70 46 q4 -22 14 -22 q10 0 14 22 Z" fill="none" stroke={C.locked} strokeWidth={2} strokeDasharray="4 4" />
              <Rect x={130} y={26} width={26} height={20} rx={3} fill="none" stroke={C.locked} strokeWidth={2} strokeDasharray="4 4" />
            </Svg>
          </View>
        ) : (
          shelf.map((row) => (
            <View key={row.index} testID={`shelf-${row.index}`} style={styles.shelfRow}>
              <BoostIcon size={26} />
              <Text style={styles.shelfLabel} numberOfLines={1}>
                {row.label}
              </Text>
              <Pressable
                testID={`shelf-activate-${row.index}`}
                accessibilityRole="button"
                accessibilityLabel={`Activate ${row.label} booster`}
                onPress={() => haptic(startBooster(row.index) ? 'success' : 'error')}
                style={({ pressed }) => [styles.btn, styles.btnWear, styles.activate, pressed && styles.pressed]}
              >
                <Text style={styles.btnText}>Activate</Text>
              </Pressable>
            </View>
          ))
        )}
      </ScrollView>
      {toast && <Toast compact text={toast.text} top={insets.top + 56} />}
      <StoreCoach tab={tab} />
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: C.bg },
  coachLayer: { ...StyleSheet.absoluteFillObject, zIndex: Z.coach },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 14,
    paddingVertical: 8,
    backgroundColor: C.tomato,
    borderBottomWidth: 4,
    borderColor: C.tomatoDark,
  },
  back: { minWidth: 70, minHeight: TAP.min, justifyContent: 'center' },
  backText: { fontFamily: F.bold, color: '#fff', fontSize: 18 },
  gems: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    minHeight: TAP.min,
    paddingHorizontal: 12,
    borderRadius: 22,
    backgroundColor: 'rgba(255,255,255,0.22)',
  },
  gemsText: { fontFamily: F.bold, fontSize: 18, color: '#fff' },
  tabs: { flexDirection: 'row', gap: 8, paddingHorizontal: 14, paddingTop: 10 },
  tab: {
    flex: 1,
    minHeight: TAP.min,
    borderRadius: 14,
    borderWidth: 2.5,
    borderColor: C.ink,
    backgroundColor: '#fff',
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 6,
  },
  tabOn: { backgroundColor: C.tomato, borderColor: C.tomatoDark },
  tabText: { fontFamily: F.bold, fontSize: 15, color: C.ink },
  tabTextOn: { color: '#fff' },
  card: { backgroundColor: '#fff', borderRadius: 16, borderWidth: 2.5, borderColor: C.ink, padding: 10, gap: 8 },
  cardTop: { flexDirection: 'row', alignItems: 'center', gap: 10 },
  cardText: { flex: 1 },
  name: { fontFamily: F.bold, fontSize: 16, color: C.ink },
  desc: { fontFamily: F.regular, fontSize: 13, lineHeight: 16, color: C.inkSoft },
  btn: {
    minHeight: TAP.min,
    borderRadius: 12,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    paddingHorizontal: 12,
    borderBottomWidth: 4,
  },
  btnWear: { backgroundColor: C.basil, borderBottomColor: C.basilDark },
  btnWorn: { backgroundColor: '#fff', borderBottomColor: C.basil, borderWidth: 2, borderColor: C.basil },
  // D461: buying is blue (the diamond's colour), wearing green, worn an outlined chip: three looks, never two identical greens
  btnBuy: { backgroundColor: '#2D8FD9', borderBottomColor: '#1D5F9A' },
  btnOff: { backgroundColor: '#E2D9CE', borderBottomColor: '#C9BCAD' },
  btnText: { fontFamily: F.bold, fontSize: 15, color: '#fff' },
  btnTextWorn: { color: C.basilDark },
  btnTextOff: { color: '#665A4F' },
  pressed: { transform: [{ translateY: 2 }] },
  emptyBox: { alignItems: 'center', gap: 8, paddingVertical: 24 },
  empty: { fontFamily: F.semi, fontSize: 15, color: C.inkSoft, textAlign: 'center' },
  shelfRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    backgroundColor: '#fff',
    borderRadius: 16,
    borderWidth: 2.5,
    borderColor: C.ink,
    padding: 10,
  },
  shelfLabel: { flex: 1, fontFamily: F.bold, fontSize: 16, color: C.ink },
  activate: { minWidth: 96 },
});
