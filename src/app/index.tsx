import { router, useFocusEffect } from 'expo-router';
import { useCallback, useEffect, useMemo, useState } from 'react';
import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { CoinLayer } from '@/components/coin-layer';
import { CoachCard } from '@/components/coach-card';
import { FloatingBonus } from '@/components/floating-bonus';
import { OrderChip } from '@/components/order-chip';
import { chipPhase } from '@/components/order-model';
import { BONUS_VIEW, ORDER_VIEW } from '@/content/hooks';
import { GiftCalendar, TasksDrawer, useSlowSnapshot } from '@/components/rewards-ui';
import { citywideText, hudRateText, rewardsHud, TAP_PREP_TEXT } from '@/components/rewards-model';
import { coachStep } from '@/engine/tutorial';
import { BuyButton, type Goal, haptic, Hud, MoonIcon, NightOvenSheet, OfflinePopup, Toast } from '@/components/game-ui';
import { bonusLaneTop } from '@/components/endgame/stack-model';
import { masteryGoal } from '@/components/goal-model';
import { BANNERS, DRAWER_CARDS, HUD_CHIPS, onOvenAsk, SHEETS, Slots } from '@/components/slots';
import { type DrawerIcon, type DrawerView, drawerCards, tiedBundle } from '@/components/drawer-model';
import { buttonTone, buyBundle, goalHidesOwnHire, hireOnSidewalk, showBundlePill } from '@/components/sidewalk-model';
import { SidewalkRow } from '@/components/sidewalk-row';
import { CLOSE_SLOP, DRAWER_HEAD, SIDEWALK_ROW, TAP } from '@/components/tap-targets';
import { TrophyIcon, DecorIcon, DriverIcon, ExpandIcon, FlameIcon, PrepIcon, RegisterIcon, ScooterIcon, SeatIcon, SparkleIcon } from '@/components/icons';
import { Portrait } from '@/components/portrait';
import { HeadFace } from '@/components/scene/head-face';
import Svg from 'react-native-svg';
import { CURB_Y, SCENE_H, sceneFit, Storefront } from '@/components/storefront';
import { ShopTabs, StationCard } from '@/components/shop-ui';
import { CITY_NAME, DECOR, DECOR_KINDS, FOOTPRINTS, HEAD_ROLE, HEADS, type HeadKind, NEIGHBORHOODS, OVEN_GRADES, PIER9_BID, VEHICLES } from '@/content/tuning';
import { APP_VERSION } from '@/content/version';
import { money, pizzas } from '@/engine/format';
import * as G from '@/engine/game';
import { nightOvenView } from '@/engine/night-oven';
import * as R from '@/engine/rewards';
import { nextSceneTeaser } from '@/engine/teaser';
import type { Station } from '@/engine/pipeline';
import { useGame } from '@/store/game-store';
import { C, F } from '@/theme';

/** A head's face for the drawer cards (D345). */
function HeadIcon({ kind, name }: { kind: HeadKind | 'gm'; name: string }) {
  return (
    <Svg width={34} height={36} viewBox="-20 -24 40 44">
      <HeadFace kind={kind} name={name} size={40} />
    </Svg>
  );
}

const STATION_ICON: Record<Extract<DrawerIcon, { t: 'station' }>['what'], React.ReactNode> = {
  prep: <PrepIcon size={26} />,
  ovens: <FlameIcon size={26} />,
  counter: <RegisterIcon size={26} />,
  drivers: <DriverIcon size={28} />,
  tables: <SeatIcon size={26} />,
  grade: <SparkleIcon size={26} />,
  expand: <ExpandIcon size={26} />,
  fleet: <ScooterIcon size={26} />,
};

/** The SVG for a drawer card's icon (the model only names it). */
function drawerIcon(icon: DrawerIcon): React.ReactNode {
  switch (icon.t) {
    case 'head':
      return <HeadIcon kind={icon.kind} name={icon.name} />;
    case 'gm':
      return <HeadIcon kind="gm" name={icon.name} />;
    case 'nonna':
      return <Portrait id="nonna-rosa" mood="happy" size={32} />;
    case 'station':
      return STATION_ICON[icon.what];
    case 'decor':
      return <DecorIcon kind={icon.kind} size={26} />;
  }
}

type DrawerCardView = DrawerView['cards'][number];

export default function GameScreen() {
  const insets = useSafeAreaInsets();
  const game = useGame((s) => s.game);
  // the offline popup waits for the title card
  const offline = useGame((s) => (s.titleDone ? s.offline : null));
  const toast = useGame((s) => s.toast);
  const covered = useGame((s) => !!s.playing || !!s.offline);
  const { tapShop, buy, buyFleet, buyDecor, build, setActive, dismissOffline, bidPier9, claimDaily, claimWeekly, claimChest, claimWeeklyChest, startBooster, claimGift, markGiftShown, buyNightOven } = useGame.getState();
  // stable (the store's actions never change), so the memoised drawer and calendar aren't re-rendered by them
  const taskActions = useMemo(() => ({ claimDaily, claimWeekly, claimChest, claimWeeklyChest, startBooster }), [claimDaily, claimWeekly, claimChest, claimWeeklyChest, startBooster]);
  const onClaimGift = useCallback((repair: boolean) => claimGift(repair), [claimGift]);
  const titleDone = useGame((s) => s.titleDone);
  // stable, so the memoised scene isn't re-rendered by every 200 ms game tick
  // a rush on a GM shop: jobs finish sooner; the cash still arrives with the pies (no payout here)
  const onShopTap = useCallback(() => tapShop(), [tapShop]);
  const onStationTap = useCallback((st: Station) => {
    const reason = useGame.getState().tapStation(st);
    if (!reason) haptic();
    return reason;
  }, []);
  const [area, setArea] = useState({ w: 0, h: 0 });
  // The full upgrade list opens over the shop on a tap of "All" (no gestures).
  const [drawerOpen, setDrawerOpen] = useState(false);
  // v5.4: the tasks sheet and the gift calendar (the icons appear once Nonna has taken over)
  const [tasksOpen, setTasksOpen] = useState(false);
  const [tasksTab, setTasksTab] = useState<'daily' | 'weekly'>('daily');
  const [giftOpen, setGiftOpen] = useState(false);
  // v5.14: Nonna's night oven info sheet (opened from the HUD chip)
  const [ovenOpen, setOvenOpen] = useState(false);
  // v5.13: the golden pizza waits behind any drawer, the tasks sheet, the calendar, or another screen (scrapbook, city)
  const [focused, setFocused] = useState(true);
  useFocusEffect(
    useCallback(() => {
      setFocused(true);
      // G94: a refused-tap toast belongs to the screen it was shown on; it doesn't ride along onto the City or the Scrapbook
      return () => {
        setFocused(false);
        useGame.setState({ toast: null });
      };
    }, []),
  );
  const setBonusHold = useGame((s) => s.setBonusHold);
  const hold = drawerOpen || tasksOpen || giftOpen || ovenOpen || !focused;
  useEffect(() => {
    setBonusHold(hold);
  }, [hold, setBonusHold]);
  // an order chip is up: the golden pizza flies just below it, not behind it
  const chipUp = chipPhase(game) !== 'none';
  // v5.15: ...and below the endgame notices (event banner, attack banner / challenge chip), which share that column
  const baseTop = chipUp ? ORDER_VIEW.top + ORDER_VIEW.height + 6 : BONUS_VIEW.laneTop;
  // the game tick's clock, never behind rewards.lastSeen (a claim moves lastSeen up to 200 ms ahead of the next tick);
  // a real rollback (lastSeen well ahead of the tick) is `clockOff`
  const tickAt = useGame((s) => s.tickAt);
  const now = Math.max(tickAt, game.rewards.lastSeen);
  const bonusTop = bonusLaneTop(game, now, baseTop);
  const clockOff = game.rewards.lastSeen - tickAt > 2000;
  const rewardsOn = R.rewardsUnlocked(game);
  const hud = rewardsHud(game, now);
  const tutorialOn = !!coachStep(game);
  // the calendar opens by itself on the first open of a day: after the title card, the offline popup, any story scene and the tutorial
  const autoGift = titleDone && !covered && !tutorialOn && hud.autoGift;
  // U1: the tasks drawer and the calendar see a snapshot that moves once a second, or at once when rewards change
  // (a claim), not on every 200 ms tick, and is only taken while one of them is open
  const sec = Math.max(Math.floor(now / 1000) * 1000, game.rewards.lastSeen);
  const slow = useSlowSnapshot(game, sec, tasksOpen || giftOpen);
  const onScrapbook = useCallback(() => router.push('/scrapbook'), []);
  const onCity = useCallback(() => router.push('/city'), []);
  const onTasks = useCallback(() => { haptic(); setDrawerOpen(false); setTasksOpen(true); }, []);
  const onGift = useCallback(() => { haptic(); setTasksOpen(false); setGiftOpen(true); }, []);
  const closeTasks = useCallback(() => setTasksOpen(false), []);
  const closeGift = useCallback(() => setGiftOpen(false), []);
  const onOven = useCallback(() => { haptic(); setDrawerOpen(false); setTasksOpen(false); setGiftOpen(false); setOvenOpen(true); }, []);
  const closeOven = useCallback(() => setOvenOpen(false), []);
  // the night-oven chip is a HUD_CHIPS slot: it asks, the screen opens the sheet
  useEffect(() => onOvenAsk(onOven), [onOven]);
  // the night oven's sheet and drawer card read one view, built only while one of them is open (it prices the tiers); the chip is a string
  const ovenView = ovenOpen || drawerOpen ? nightOvenView(game) : null;
  // the ring on the scrapbook button: how far the next story scene is (whole 5% steps, so it repaints rarely)
  const teaser = nextSceneTeaser(game);
  useEffect(() => {
    if (!autoGift) return;
    markGiftShown();
    setGiftOpen(true);
  }, [autoGift, markGiftShown]);

  const id = game.active;
  const shop = game.shops[id];
  const nd = G.def(id);
  const v = game.vehicle;
  const plus = (x: number) => `+${money(x)}/s`;
  const newScenes = Math.max(0, game.seenScenes.length - game.scrapbookViewed);
  const coach = coachStep(game);
  const eps = G.earningsPerSecond(game);
  // Tied stations: one upgrade alone adds $0/s, so say what to buy together. Keyed on levels, not cash or sales.
  const bundle = tiedBundle(game, id);

  // the sidewalk offers the next hire (each head, then the GM) here; see hireOnSidewalk (B1)
  const idleShopHere = hireOnSidewalk(shop, id);
  // Goal bar: the big purchase worth saving for, by cash/sec per dollar.
  const candidates: (Goal & { ratio: number })[] = [];
  for (const n of NEIGHBORHOODS) {
    const sh = game.shops[n.id];
    // the next hire in a shop without a GM: each head, then the GM (Downtown's GM is Nonna, via the story)
    const hire = sh.built ? G.nextHire(sh) : null;
    if (hire && !(hire === 'manager' && n.id === 'downtown')) {
      const cost = G.upgradeCostOf(game, n.id, hire) ?? 0;
      // short enough to fit beside the amount (D338): "Waterfront: hire Finn (prep)"
      const label = G.isHeadUpgrade(hire) ? `${n.name}: hire ${HEADS[n.id][G.headOf(hire)]} (${HEAD_ROLE[G.headOf(hire)]})` : `${n.name}: hire a manager`;
      candidates.push({ label, current: game.cash, target: cost, ratio: (G.shopEarnings(game, n.id) / Math.max(1, cost)) * 3, onPress: () => {
        if (game.active !== n.id) setActive(n.id);
        return useGame.getState().buy(hire);
      } });
    }
  }
  const next = G.nextToBuild(game);
  // a locked build (Nonna's takeover, an unbuilt neighbour) is not a goal: its tap would do nothing (B2)
  if (next && !G.buildLock(game, next.id)) candidates.push({ label: `Build a pizzeria in ${next.name}`, current: game.cash, target: next.buildCost, ratio: G.buildGain(game, next.id) / G.buildAllIn(next.id), onPress: () => build(next.id) });
  const vg = G.vehicleGain(game);
  if (vg && vg > 0) candidates.push({ label: `Upgrade fleet to ${VEHICLES[v + 1].name}s · ${plus(vg)}`, current: game.cash, target: VEHICLES[v + 1].cost, ratio: vg / VEHICLES[v + 1].cost, onPress: buyFleet });
  candidates.sort((a, b) => b.ratio - a.ratio);
  // Waterfront's finale is a purchase, so it leads the goal bar while it's on offer
  if (G.pier9Available(game)) candidates.unshift({ label: 'Bid on Pier 9 to save Marisol’s dock', current: game.cash, target: PIER9_BID.cost, ratio: Number.MAX_VALUE, onPress: bidPier9 });
  // viewing an unmanaged shop: its next hire is the goal
  // while the sidewalk offers a head, the goal bar moves on to the next goal (D341); the GM hire is offered in both places until it is hired (B1).
  // Downtown's sidewalk shows its stations instead, so there the hire leads the goal bar
  const mine = (c: Goal) => c.label.startsWith(`${nd.name}: hire`);
  const shown = goalHidesOwnHire(shop, id) ? candidates.filter((c) => !mine(c)) : !shop.managed ? [...candidates.filter(mine), ...candidates.filter((c) => !mine(c))] : candidates;
  let goal: Goal | null = shown[0] ?? null;
  // v5.15 (D427): once the story is told and nothing else is worth saving for, the bar shows the city's mastery stars
  const mg = masteryGoal(game);
  if (!goal && mg) goal = { label: mg.label, text: mg.text, current: mg.current, target: mg.target };
  // Late game: fall back to the best big buy in this shop (Expand, Grade or a Decor tier) before the story count.
  if (!goal) {
    const big: (Goal & { ratio: number })[] = [];
    for (const what of ['expand', 'grade'] as const) {
      const cost = G.upgradeCostOf(game, id, what);
      if (cost !== null && !G.upgradeLock(game, id, what)) {
        const gain = G.upgradeGain(game, id, what) ?? 0;
        big.push({ label: what === 'expand' ? `Expand ${nd.name} · ${FOOTPRINTS[shop.footprint + 1]?.name ?? ''}` : `${OVEN_GRADES[shop.grade + 1]?.name ?? ''} ovens in ${nd.name}`, current: game.cash, target: cost, ratio: (gain + 1e-6) / cost, onPress: () => buy(what) });
      }
    }
    for (const kind of DECOR_KINDS) {
      const cost = G.decorCost(game, id, kind);
      if (cost !== null) big.push({ label: `${DECOR[kind].tiers[shop.decor[kind] + 1]} in ${nd.name}`, current: game.cash, target: cost, ratio: ((G.decorGain(game, id, kind) ?? 0) + 1e-6) / cost, onPress: () => buyDecor(kind) });
    }
    big.sort((a, b) => b.ratio - a.ratio);
    goal = big[0] ?? null;
  }
  if (!goal) {
    goal = { label: game.cityComplete ? `${CITY_NAME} is yours! Franchising soon` : `Story ${game.seenScenes.length}/24`, current: game.seenScenes.length, target: 24, icon: <TrophyIcon size={22} /> };
  }

  // the HUD names the next station to tap (prep → oven → counter) until a GM runs the shop
  const nextSt = shop.managed ? null : G.nextStation(shop);
  const line = shop.line;
  const boost = hud.boost;
  const baseSubtitle = shop.managed
    ? citywideText(eps, hud.mult)
    : nextSt === 'counter'
      ? `Tap to serve · ${pizzas(line.baked)} baked`
      : nextSt === 'oven'
        ? `Tap to bake · ${pizzas(line.prepped)} prepped`
        : nextSt === 'prep'
          ? TAP_PREP_TEXT
          : line.oven
            ? 'Baking…'
            : line.prep
              ? 'Prepping…'
              : line.counter
                ? 'Serving…'
                : 'Your heads are on it';
  // while boosted the rate shown is what lineTick really earns (G84); the boost itself is drawn in basil after it
  const subtitle = boost && shop.managed ? hudRateText(eps, hud.mult) : baseSubtitle;

  // the drawer's cards are a pure model (drawer-model.ts): its level-dependent part is cached on the levels of every shop, so only cash is applied per tick; nothing while it is closed
  const drawer = drawerOpen ? drawerCards({ game, id }) : null;

  const drawerCard = (c: DrawerCardView) => (
    <StationCard
      key={c.key}
      testID={c.testID}
      icon={drawerIcon(c.icon)}
      title={c.title}
      level={c.level}
      detail={c.detail}
      hot={c.hot}
      wide={c.wide}
      muted={c.muted}
      tone={c.tone}
      cost={c.cost}
      buyLabel={c.buyLabel}
      costLabel={c.costLabel}
      canBuy={c.canBuy}
      onBuy={() => (c.buy.t === 'fleet' ? buyFleet() : c.buy.t === 'decor' ? buyDecor(c.buy.kind) : buy(c.buy.what))}
    />
  );

  // ---- sidewalk row: the four stations (or the manager, on a shop that needs one) + "All"
  const fit = sceneFit(area.w || 1, area.h || 1);
  // the row's foot sits above the kerb line; see SIDEWALK_ROW for why each mode uses its height
  const rowBottom = (SCENE_H - CURB_Y) * fit.s + (idleShopHere ? SIDEWALK_ROW.raiseIdle : SIDEWALK_ROW.raiseManaged);
  const openDrawer = () => {
    haptic();
    setDrawerOpen(true);
  };

  return (
    <View style={[styles.root, { paddingTop: insets.top }]}>
      <Hud cash={game.cash} subtitle={coach && id === 'downtown' ? '' : subtitle} boostText={boost?.text} goal={goal} newScenes={newScenes} onScrapbook={onScrapbook} onCity={onCity}
        onTasks={rewardsOn ? onTasks : undefined}
        tasksBadge={hud.badge}
        onGift={rewardsOn ? onGift : undefined}
        giftDot={hud.giftDot}
        chips={<Slots items={HUD_CHIPS} />}
        scrapRing={teaser.kind === 'complete' ? undefined : teaser.step}
        halo={coach?.target === 'cash' ? 'cash' : coach?.target === 'goal' ? 'goal' : null} />
      <ShopTabs game={game} boostMult={hud.mult} onSelect={setActive} onBuild={build} />
      <View style={styles.sceneArea} onLayout={(e) => setArea({ w: e.nativeEvent.layout.width, h: e.nativeEvent.layout.height })}>
        {area.w > 0 && (
          <Storefront
            // a new shop gets a fresh scene: clock, tap pills, rush burst and cash pop all reset
            key={id}
            id={id}
            width={area.w}
            height={area.h}
            paused={covered || drawerOpen || tasksOpen || giftOpen}
            onTap={onShopTap}
            onStation={onStationTap}
            spotlight={coach && id === 'downtown' && (coach.target === 'prep' || coach.target === 'oven' || coach.target === 'counter') ? coach.target : null}
            spotlightWait={!!coach?.wait}
          />
        )}
        {/* upgrade row standing on the sidewalk */}
        <SidewalkRow game={game} id={id} idleShop={idleShopHere} bottom={rowBottom} onBuy={buy} onOpen={openDrawer} highlight={coach?.target === 'walk-ovens' ? 'ovens' : null}
          // the tied stations merge into one "Buy both" card in the row; kept apart while Nonna's coach is up
          bundle={showBundlePill(bundle, !!coach) ? bundle : null} onBundle={bundle ? () => buyBundle(bundle.steps, buy) : undefined} />
        {/* D378: the tutorial scrim carries on over the sidewalk row (same 60% tone as the scene's), touches pass through */}
        {coach && id === 'downtown' && !drawerOpen && (coach.target === 'prep' || coach.target === 'oven' || coach.target === 'counter') && (
          <View pointerEvents="none" testID="coach-row-scrim" style={[styles.rowScrim, { bottom: rowBottom - 6, height: (idleShopHere ? SIDEWALK_ROW.idleStackHeight : SIDEWALK_ROW.cardHeight) + 12 }]} />
        )}
        {/* Nonna's tutorial (P2) */}
        {/* D366: docked over the street band (decoration only), clear of the seating area */}
        {coach && id === 'downtown' && !drawerOpen && <CoachCard step={coach} low={Math.max(8, insets.bottom)} high={12} />}
        {/* v5.13: the special-order chip under the goal bar, and the golden pizza in the sky (both sit under the drawers) */}
        <OrderChip top={ORDER_VIEW.top} onShop={setActive} />
        {area.w > 0 && <FloatingBonus width={area.w} height={area.h} top={bonusTop} />}
        {/* the BANNERS slot: notices over the scene, under the drawers */}
        <Slots items={BANNERS} />
        {drawer && (
          <View style={StyleSheet.absoluteFill}>
            <Pressable testID="close-upgrades-dim" style={styles.dim} onPress={() => setDrawerOpen(false)} />
            <View style={styles.drawer}>
              <View style={styles.drawerHead}>
                <View style={{ flex: 1 }}>
                  <Text style={styles.drawerTitle}>{drawer.title}</Text>
                  <Text style={styles.drawerSub} numberOfLines={1}>{drawer.bottleneck}</Text>
                </View>
                <Pressable testID="close-upgrades" onPress={() => setDrawerOpen(false)} style={styles.closeBtn} hitSlop={CLOSE_SLOP}>
                  <Text style={styles.closeText}>Close ▼</Text>
                </Pressable>
              </View>
              <ScrollView contentContainerStyle={[styles.grid, { paddingBottom: insets.bottom + 20 }]}>
                {drawer.idleBanner && (
                  <View style={styles.banner}>
                    <Text style={styles.bannerText}>Without a manager, upgrades here only pay while you tap.</Text>
                  </View>
                )}
                {drawer.perkBanner && (
                  <View style={styles.banner}>
                    <Text style={styles.bannerText}>{drawer.perkBanner}</Text>
                  </View>
                )}
                {drawer.bundle && (
                  // D304: the tied stations' bundle is a button, not a label: it buys every step through the ordinary buy path
                  <View style={styles.bundleRow}>
                    <BuyButton compact testID="buy-bundle" label={drawer.bundle.label} sub={drawer.bundle.sub} enabled={drawer.bundle.enabled} onPress={() => buyBundle(drawer.bundle!.steps, buy)} />
                  </View>
                )}
                {drawer.cards.map(drawerCard)}
                {ovenView && (
                  <StationCard
                    testID="buy-night-oven"
                    icon={<MoonIcon size={26} />}
                    title={ovenView.next ? ovenView.next.title : `Night oven: holds ${ovenView.hours}`}
                    detail={ovenView.next ? ovenView.next.lock ?? `Nonna keeps baking while you're away · now ${ovenView.hours}` : 'Biggest it gets'}
                    cost={ovenView.next && !ovenView.next.lock ? ovenView.next.price : null}
                    costLabel={ovenView.next ? 'Locked' : 'MAX'}
                    canBuy={!!ovenView.next?.canBuy}
                    tone={buttonTone({ lock: !ovenView.next || !!ovenView.next.lock, gain: 1 })}
                    onBuy={buyNightOven}
                  />
                )}
                {/* the DRAWER_CARDS slot: city-wide cards */}
                <Slots items={DRAWER_CARDS} />
                <Text style={styles.section}>{drawer.decorTitle}</Text>
                {drawer.decor.map(drawerCard)}
                <Text style={styles.footer}>
                  {CITY_NAME} · {drawer.built}/6 pizzerias · v{APP_VERSION}
                </Text>
              </ScrollView>
            </View>
          </View>
        )}
        {tasksOpen && <TasksDrawer game={slow.game} now={slow.sec} clockOff={clockOff} bottomInset={insets.bottom} tab={tasksTab} onTab={setTasksTab} onClose={closeTasks} actions={taskActions} />}
        {/* Toast floats in the open sky at the top of the scene, clear of the shop, the row and the cards. */}
        {toast && <Toast compact text={toast.text} top={10} />}
      </View>
      {giftOpen && !covered && <GiftCalendar game={slow.game} now={slow.sec} onClaim={onClaimGift} onClose={closeGift} />}
      {ovenOpen && !covered && ovenView && <NightOvenSheet view={ovenView} onBuy={buyNightOven} onClose={closeOven} />}
      {/* the SHEETS slot: modal sheets over the whole screen, under the offline popup */}
      <Slots items={SHEETS} />
      {offline && <OfflinePopup summary={offline} nightOven={game.nightOven} onCollect={dismissOffline} onUpgrade={onOven} />}
      {/* payout coins fly from the carrier to the cash (D344); last, so the offline popup's burst from the oven's mouth shows over it (D454) */}
      <CoinLayer />
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: C.tomato },
  sceneArea: { flex: 1, overflow: 'hidden', backgroundColor: '#BFE0F7' },
  dim: { position: 'absolute', left: 0, right: 0, top: 0, bottom: 0, backgroundColor: 'rgba(30,14,8,0.4)' },
  rowScrim: { position: 'absolute', left: 0, right: 0, backgroundColor: 'rgba(42,20,8,0.6)' },
  drawer: { position: 'absolute', left: 0, right: 0, bottom: 0, top: '30%', backgroundColor: C.bg, borderTopLeftRadius: 20, borderTopRightRadius: 20, borderTopWidth: 3, borderColor: C.ink },
  drawerHead: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: DRAWER_HEAD.padX, paddingTop: DRAWER_HEAD.padTop, paddingBottom: DRAWER_HEAD.padBottom },
  drawerTitle: { fontFamily: F.bold, fontSize: 17, color: C.ink },
  drawerSub: { fontFamily: F.semi, fontSize: 12, color: C.tomatoDark },
  closeBtn: { backgroundColor: '#fff', borderWidth: 2, borderColor: C.ink, borderRadius: 12, paddingHorizontal: 12, height: TAP.controls.closeButton.height, justifyContent: 'center' },
  closeText: { fontFamily: F.bold, fontSize: 13, color: C.ink },
  grid: { padding: 10, gap: 8, flexDirection: 'row', flexWrap: 'wrap', justifyContent: 'space-between' },
  banner: { width: '100%', backgroundColor: '#FFE7C2', borderRadius: 10, paddingVertical: 6, paddingHorizontal: 10, borderWidth: 1.5, borderColor: C.cheeseDark },
  bannerText: { fontFamily: F.semi, fontSize: 12.5, color: C.ink, textAlign: 'center' },
  bundleRow: { width: '100%' },
  section: { width: '100%', fontFamily: F.bold, fontSize: 14, color: C.ink, marginTop: 6 },
  footer: { width: '100%', textAlign: 'center', fontFamily: F.regular, color: C.inkSoft, fontSize: 12, marginTop: 4 },
});
