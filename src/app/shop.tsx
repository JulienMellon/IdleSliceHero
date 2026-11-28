// The Shop screen (v5.15), opened from the diamond chip. Tab 1, the Vanity tab (v5.24): the Featured four, each set with its progress, then the generic looks
// by tier; each look owned (wear / take off), for its tier's diamonds, or earned (the master's plaque: "earn 18 stars", never sold). Tab 2, Booster Shelf: a "Buy" section of three diamond boosters
// (v5.23, endgame/booster-buy.tsx), then one free booster a day for an ad. Boosters the player owns come first under "Yours" with an Activate button each; an empty shelf shows nothing.
// Tab 3, Store (v5.17, components/store): the Starter Pack, Nonna's Plus and the diamond packs, for money. Data: endgame/shop-model.ts.
// No tab is locked (DECISIONS #47). `?tab=store` opens the Store tab; `?from=` says how the Shop was reached (store_opened). The first refused
// buy of a look shows Nonna's nudge to the Store (once per save).
import { router, useFocusEffect, useLocalSearchParams } from 'expo-router';
import { useCallback, useEffect, useMemo, useState } from 'react';
import { Pressable, ScrollView, StyleSheet, Text, useWindowDimensions, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { CoachOverlay } from '@/components/coach/overlay';
import { BoosterBuy } from '@/components/endgame/booster-buy';
import { storeFrom, STORE_OPENED_EVENT, tabFromParam } from '@/components/endgame/diamond-chip-model';
import { NudgeCard } from '@/components/endgame/nudge-card';
import { useShopFlags } from '@/components/endgame/shop-flags';
import { nudgeShows } from '@/components/endgame/shop-flags-model';
import { boosterShelf, SHOP_TABS, vanitySections } from '@/components/endgame/shop-model';
import { SectionHead, VanityCard } from '@/components/endgame/vanity-card';
import { haptic, Toast } from '@/components/game-ui';
import { AdButton } from '@/components/store/ad-button';
import { boosterAdOffer } from '@/components/store/ad-model';
import { resetPacksSeen, StoreTab } from '@/components/store/store-tab';
import { BoostIcon, DiamondIcon } from '@/components/icons';
import { TAP } from '@/components/tap-targets';
import { Z } from '@/components/z-order';
import { analytics } from '@/services';
import { useGame } from '@/store/game-store';
import { C, F } from '@/theme';
import { gameNow } from '../engine/clock';
import { weekIndex } from '../engine/vanity';
import type { CoachTargetId } from '../engine/coach-types';
import { coachStep, STARTER_STEP } from '../engine/tutorial';
import { rewardsUnlocked } from '../engine/rewards';

type Tab = 0 | 1 | 2;

/** The toast sits near the bottom edge (this far above it), never over the tab row or Nonna's nudge card at the top (D562). */
const TOAST_FROM_BOTTOM = 96;

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

/** Wearing and taking off, for the memoised cards: one callback for the life of the screen. */
const wearLook = (id: string, on: boolean) => useGame.getState().equip(id, on);

export default function Shop() {
  const insets = useSafeAreaInsets();
  const { height } = useWindowDimensions();
  const toast = useGame((s) => s.toast);
  const diamonds = useGame((s) => Math.floor(s.game.rewards.diamonds));
  // primitives: the screen repaints when a diamond, a cosmetic or a booster changes, not on every game tick
  const wardrobe = useGame(
    (s) =>
      `${s.game.rewards.cosmetics.join(',')}|${s.game.rewards.worn.join(',')}|${Math.floor(s.game.rewards.diamonds)}|${s.game.seenScenes.reduce((n, x) => n + (x.endsWith('-hire') ? 1 : 0), 0)}`,
  );
  const shelfKey = useGame((s) => s.game.rewards.boosters.map((b) => `${b.mult}:${b.seconds}`).join(','));
  const boosterAd = useGame((s) => boosterAdOffer(s.game, gameNow(), s.prefs.boosterAdDay));
  const params = useLocalSearchParams<{ tab?: string; from?: string }>();
  const [tab, setTab] = useState<Tab>(() => tabFromParam(params.tab));
  const [nudge, setNudge] = useState(false);
  // the Shop opened: say how, and use up the chip's dot if the takeover has happened
  useEffect(() => {
    resetPacksSeen(); // a new Shop opening counts its pack cards afresh, whichever tab it opens on (C192)
    analytics.track(STORE_OPENED_EVENT, { from: storeFrom(params.from) });
    useShopFlags.getState().opened(rewardsUnlocked(useGame.getState().game));
  }, []); // eslint-disable-line react-hooks/exhaustive-deps -- once per opening: the route's params are what it was opened with
  // Nonna's nudge and a booster the player can't afford both lead to the Store tab
  const nudgeToStore = useCallback(() => {
    analytics.track(STORE_OPENED_EVENT, { from: 'nudge' });
    setNudge(false);
    setTab(2);
  }, []);
  // a booster the player can't afford: its own source, and Nonna's nudge card (not on this tab) is untouched
  const shortToStore = useCallback(() => {
    analytics.track(STORE_OPENED_EVENT, { from: 'booster' });
    setTab(2);
  }, []);
  // G94: leaving the screen takes its toast with it
  useFocusEffect(useCallback(() => () => useGame.setState({ toast: null }), []));
  const { buyCosmetic, startBooster } = useGame.getState();
  const week = weekIndex(gameNow());
  // eslint-disable-next-line react-hooks/exhaustive-deps -- `wardrobe` (and the week the Featured row is in) are what the sections depend on
  const sections = useMemo(() => vanitySections(useGame.getState().game, gameNow()), [wardrobe, week]);
  const shelf = useMemo(() => boosterShelf(useGame.getState().game), [shelfKey]); // eslint-disable-line react-hooks/exhaustive-deps -- `shelfKey` is what the shelf depends on
  const tabs = [...SHOP_TABS(), 'Store'];
  // the first refused buy of a look short of diamonds shows Nonna's nudge (v5.23, once per save)
  const buyLook = useCallback(
    (id: string, short: boolean) => {
      const ok = buyCosmetic(id);
      haptic(ok ? 'success' : 'error');
      if (nudgeShows(useShopFlags.getState(), ok, short)) {
        useShopFlags.getState().markNudged();
        setNudge(true);
      }
    },
    [buyCosmetic],
  );
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
        {tab === 1 && shelf.length > 0 && (
          <Text style={styles.head} accessibilityRole="header">
            Yours
          </Text>
        )}
        {tab === 1 &&
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
          ))}
        {tab === 1 && <BoosterBuy onStore={shortToStore} />}
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
        {tab === 0 &&
          sections.map((sec) => (
            <View key={sec.key} style={styles.section}>
              <SectionHead section={sec} />
              {sec.kind === 'featured' ? (
                <View style={styles.featured} testID="vanity-featured">
                  {sec.cards.map((v) => (
                    <VanityCard key={v.id} {...v} prefix="vanity-featured" compact onWear={wearLook} onBuy={buyLook} />
                  ))}
                </View>
              ) : (
                sec.cards.map((v) => <VanityCard key={v.id} {...v} prefix="vanity" onWear={wearLook} onBuy={buyLook} />)
              )}
            </View>
          ))}
        {tab === 2 && <StoreTab />}
      </ScrollView>
      {toast && <Toast compact text={toast.text} top={height - insets.bottom - TOAST_FROM_BOTTOM} />}
      <StoreCoach tab={tab} />
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: C.bg },
  coachLayer: { ...StyleSheet.absoluteFill, zIndex: Z.coach },
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
  btnText: { fontFamily: F.bold, fontSize: 15, color: '#fff' },
  pressed: { transform: [{ translateY: 2 }] },
  head: { fontFamily: F.bold, fontSize: 18, color: C.ink },
  section: { gap: 10 },
  featured: { flexDirection: 'row', flexWrap: 'wrap', gap: 10 },
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
