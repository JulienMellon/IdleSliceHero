import { router, useFocusEffect, useLocalSearchParams } from 'expo-router';
import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { Pressable, ScrollView, StyleSheet, Text, useWindowDimensions, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { CoinLayer } from '@/components/coin-layer';
import { CoachOverlay } from '@/components/coach/overlay';
import { useCoachTarget } from '@/components/coach/targets';
import { useCoachFlow, useReportCoachNotes } from '@/components/coach/use-coach-flow';
import { FloatingBonus } from '@/components/floating-bonus';
import { OrderChip } from '@/components/order-chip';
import { chipPhase } from '@/components/order-model';
import { ORDER_VIEW } from '@/content/hooks';
import { GiftCalendar, TasksDrawer, useSlowSnapshot } from '@/components/rewards-ui';
import { emitRivalGlow } from '@/components/layers/rival/rival-glow';
import { citywideText, hudRateText, rewardsHud, TAP_PREP_TEXT, type StoryGo, type TasksTab } from '@/components/rewards-model';
import { coachMode, coachStep, hintsAllowed, reportCoachLive, reportCoachStep } from '@/engine/tutorial';
import { useReportOpen } from '@/components/report/sheet-state';
import { BuyButton, type Goal, haptic, Hud, MoonIcon, NightOvenSheet, OfflinePopup, Toast } from '@/components/game-ui';
import { useBannerOpen } from '@/components/endgame/banner-state';
import { holdsBonus } from '@/components/endgame/stack-model';
import { fitFont, MIN_FONT } from '@/components/endgame/fit-model';
import { chapterGoal, cityStory, type GoalCheer, goalCheer, GOAL_TAB, masteryGoal, tasksParamTab } from '@/components/goal-model';
import { BANNERS, DRAWER_CARDS, HUD_CHIPS, HUD_TOP_CHIPS, onOvenAsk, ReportSlots, SHEETS, SHOP_REPORT, Slots } from '@/components/slots';
import { buyKeyOf, type DrawerIcon, type DrawerView, drawerCards, parseBuyKey } from '@/components/drawer-model';
import { buttonTone, hireOnSidewalk } from '@/components/sidewalk-model';
import { SidewalkRow } from '@/components/sidewalk-row';
import { bonusLaneTop, idleStripTop, STRIP } from '@/components/report/report-model';
import { CLOSE_SLOP, DRAWER_CLOSE_W, DRAWER_HEAD, SIDEWALK_ROW, TAP } from '@/components/tap-targets';
import { TrophyIcon, DecorIcon, DriverIcon, ExpandIcon, FlameIcon, PrepIcon, RegisterIcon, ScooterIcon, SeatIcon, SparkleIcon } from '@/components/icons';
import { Portrait } from '@/components/portrait/index';
import { HeadFace } from '@/components/scene/head-face';
import Svg from 'react-native-svg';
import { CURB_Y, SCENE_H, sceneFrame, sceneView, Storefront } from '@/components/storefront';
import { usePerfMarks } from '@/components/scene/clock';
import { ShopTabs, StationCard } from '@/components/shop-ui';
import { Z } from '@/components/z-order';
import { cityOf } from '@/content/cities';
import type { HeadKind } from '@/content/tuning';
import type { NeighborhoodId } from '@/content/types';
import { APP_VERSION } from '@/content/version';
import { gameNow } from '@/engine/clock';
import { pizzas } from '@/engine/format';
import * as G from '@/engine/game';
import { nightOvenView } from '@/engine/night-oven';
import * as R from '@/engine/rewards';
import { nextScene, teaserStep } from '@/engine/teaser';
import type { Station } from '@/engine/pipeline';
import { useGame } from '@/store/game-store';
import { C, F } from '@/theme';

/** A head's face for the drawer cards (D345). */
function HeadIcon({ kind, name }: { kind: HeadKind | 'gm'; name: string }) {
  return (
    <Svg accessibilityElementsHidden importantForAccessibility="no-hide-descendants" width={34} height={36} viewBox="-20 -24 40 44">
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

/** M63: one element per icon, so the memoised StationCard sees the same prop on every tick. */
const ICONS = new Map<string, React.ReactNode>();
function cachedIcon(icon: DrawerIcon): React.ReactNode {
  const k =
    icon.t === 'head'
      ? `head:${icon.kind}:${icon.name}`
      : icon.t === 'gm'
        ? `gm:${icon.name}`
        : icon.t === 'station'
          ? `st:${icon.what}`
          : icon.t === 'decor'
            ? `decor:${icon.kind}`
            : 'nonna';
  let el = ICONS.get(k);
  if (el === undefined) {
    el = drawerIcon(icon);
    ICONS.set(k, el);
  }
  return el;
}
const MOON_ICON = <MoonIcon size={26} />;

/** C175: a toast that owns its own timer (the effect that asks for it may re-run or unmount before it ends). */
function flashToast(text: string, ms = 2200) {
  const at = gameNow();
  useGame.setState({ toast: { text, at } });
  setTimeout(() => {
    if (useGame.getState().toast?.at === at) useGame.setState({ toast: null });
  }, ms);
}

type DrawerCardView = DrawerView['cards'][number];

export default function GameScreen() {
  usePerfMarks('GameScreen');
  const insets = useSafeAreaInsets();
  const { width: screenW } = useWindowDimensions();
  const game = useGame((s) => s.game);
  // the offline popup waits for the title card
  const offline = useGame((s) => (s.titleDone ? s.offline : null));
  const toast = useGame((s) => s.toast);
  const covered = useGame((s) => !!s.playing || !!s.offline);
  const {
    tapShop,
    buy,
    buyFleet,
    buyDecor,
    build,
    setActive,
    dismissOffline,
    claimDaily,
    claimWeekly,
    claimChest,
    claimWeeklyChest,
    startBooster,
    claimGift,
    markGiftShown,
    buyNightOven,
  } = useGame.getState();
  // stable (the store's actions never change), so the memoised drawer and calendar aren't re-rendered by them
  const taskActions = useMemo(
    () => ({ claimDaily, claimWeekly, claimChest, claimWeeklyChest, startBooster }),
    [claimDaily, claimWeekly, claimChest, claimWeeklyChest, startBooster],
  );
  // M63: one stable buy handler for the drawer's cards; each card passes its own key ('fleet', 'decor:<kind>', 'up:<upgrade>')
  const onDrawerBuy = useCallback(
    (key: string) => {
      const b = parseBuyKey(key);
      return !b ? false : b.t === 'fleet' ? buyFleet() : b.t === 'decor' ? buyDecor(b.kind) : buy(b.what);
    },
    [buy, buyFleet, buyDecor],
  );
  const onClaimGift = useCallback((repair: boolean) => claimGift(repair), [claimGift]);
  const titleDone = useGame((s) => s.titleDone);
  const lastSceneEndPlay = useGame((s) => s.lastSceneEndPlay);
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
  const [tasksTab, setTasksTab] = useState<TasksTab>(GOAL_TAB);
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
  // E1b: a tap on a chapter-locked lot in the City comes back here with `tasks=story`: open the list on that tab, then clear the param
  const { tasks: tasksParam } = useLocalSearchParams<{ tasks?: string }>();
  useFocusEffect(
    useCallback(() => {
      const tab = tasksParamTab(tasksParam);
      if (!tab) return;
      setDrawerOpen(false);
      setGiftOpen(false);
      setTasksTab(tab);
      setTasksOpen(true);
      router.setParams({ tasks: undefined });
    }, [tasksParam]),
  );
  const setBonusHold = useGame((s) => s.setBonusHold);
  // G95: the golden pizza also waits while a card is up (an order, or Victor's challenge): the sky has no room beside it
  const bannerOpen = useBannerOpen();
  const cardUp = holdsBonus(game, bannerOpen);
  const hold = drawerOpen || tasksOpen || giftOpen || ovenOpen || !focused || cardUp;
  useEffect(() => {
    setBonusHold(hold);
  }, [hold, setBonusHold]);
  // an order chip is up: the golden pizza flies just below it, not behind it
  const chipUp = chipPhase(game) !== 'none';
  // the game tick's clock, never behind rewards.lastSeen (a claim moves lastSeen up to 200 ms ahead of the next tick);
  // a real rollback (lastSeen well ahead of the tick) is `clockOff`
  const tickAt = useGame((s) => s.tickAt);
  const now = Math.max(tickAt, game.rewards.lastSeen);
  const clockOff = game.rewards.lastSeen - tickAt > 2000;
  const rewardsOn = R.rewardsUnlocked(game);
  const hud = rewardsHud(game, now);
  const tutorialOn = coachMode(game) !== null;
  // the calendar opens by itself on the first open of a day: after the title card, the offline popup, any story scene and the tutorial
  const autoGift = titleDone && !covered && !tutorialOn && hud.autoGift;
  // U1: the tasks drawer and the calendar see a snapshot that moves once a second, or at once when rewards change
  // (a claim), not on every 200 ms tick, and is only taken while one of them is open
  const sec = Math.max(Math.floor(now / 1000) * 1000, game.rewards.lastSeen);
  const slow = useSlowSnapshot(game, sec, tasksOpen || giftOpen);
  const onScrapbook = useCallback(() => router.push('/scrapbook'), []);
  const onCity = useCallback(() => router.push('/city'), []);
  // the clipboard and the goal bar open the task list on its Story tab (the drawer shows Daily where the city has no chapters)
  const onTasks = useCallback(() => {
    haptic();
    setDrawerOpen(false);
    setTasksTab(GOAL_TAB);
    setTasksOpen(true);
  }, []);
  // the goal bar: a tap opens the task list on its Story tab (never a buy)
  const onGoal = useCallback(() => {
    setDrawerOpen(false);
    setGiftOpen(false);
    setTasksTab(GOAL_TAB);
    setTasksOpen(true);
  }, []);
  // D536: the Story tab's "Go" on a hire, build, win or bid row takes the player where the task is done, and the list closes:
  // hire: the shop's upgrade drawer (its hire card) · bid: the same drawer, where the Pier 9 auction card is · win: the shop, where the rival's
  // challenge card is · build: the city map, where the lot to build waits (C174: setActive ignores a shop that is not built yet)
  const onGo = useCallback(
    (kind: StoryGo, shop: NeighborhoodId) => {
      haptic();
      setTasksOpen(false);
      if (kind === 'build') {
        router.push('/city');
        return;
      }
      setActive(shop);
      if (kind === 'hire' || kind === 'bid') setDrawerOpen(true);
      // D547: a "Beat MegaSlice" row lands on the shop with the rival's band glowing for 2 s
      if (kind === 'win') emitRivalGlow(shop);
    },
    [setActive],
  );
  const onGift = useCallback(() => {
    haptic();
    setTasksOpen(false);
    setGiftOpen(true);
  }, []);
  const closeTasks = useCallback(() => setTasksOpen(false), []);
  const closeGift = useCallback(() => setGiftOpen(false), []);
  const onOven = useCallback(() => {
    haptic();
    setDrawerOpen(false);
    setTasksOpen(false);
    setGiftOpen(false);
    setOvenOpen(true);
  }, []);
  const closeOven = useCallback(() => setOvenOpen(false), []);
  // the night-oven chip is a HUD_CHIPS slot: it asks, the screen opens the sheet
  useEffect(() => onOvenAsk(onOven), [onOven]);
  // the night oven's sheet and drawer card read one view, built only while one of them is open (it prices the tiers); the chip is a string
  const ovenView = ovenOpen || drawerOpen ? nightOvenView(game) : null;
  // the ring on the scrapbook button: how far the next story scene is (whole 5% steps, so it repaints rarely)
  // no ring once the story is complete (no scene left); the set of seen scenes changes rarely, so that check is memoised on it
  const storyDone = useMemo(() => nextScene(game) === null, [game.seenScenes]); // eslint-disable-line react-hooks/exhaustive-deps -- nextScene reads only seenScenes
  const ring = storyDone ? undefined : teaserStep(game);
  useEffect(() => {
    if (!autoGift) return;
    markGiftShown();
    setGiftOpen(true);
  }, [autoGift, markGiftShown]);

  const id = game.active;
  const shop = game.shops[id];
  // v5.18: every table below is the CURRENT city's (Boston after the franchise), never the home constants
  const city = cityOf(game);
  const { neighbourhoods: NEIGHBORHOODS, name: CITY_NAME } = city;
  const first = G.firstHood(city);
  const newScenes = Math.max(0, game.seenScenes.length - game.scrapbookViewed);
  const coach = coachStep(game);
  // v5.20: Nonna's flow (what ends each step, where she points) is components/coach/use-coach-flow.ts
  const coachFlow = useCoachFlow(coach, id === first, drawerOpen, tasksOpen);
  // v5.21 (E2): the task list opening ends step 7 and its closing ends step 8; step 8's look turns free once seen (both in the flow, A44)
  const coachView = coachFlow.view;
  const coachDone = coachFlow.onDone;
  // v5.22 (E4): the shop report's coach. Strip lit while the sheet is shut, then (over the sheet) the Ovens bar and the dashed line; it ends when the sheet closes.
  const sheetOpen = useReportOpen();
  const reportStep = reportCoachStep(game, { sheetOpen, clear: !covered && focused && !drawerOpen && !tasksOpen && !giftOpen && !ovenOpen });
  const reportStepId = reportStep?.id ?? '';
  const reportLive = reportCoachLive(game);
  useReportCoachNotes(sheetOpen, reportStepId === 'strip', reportLive);
  const onReportLook = useCallback(() => useGame.getState().noteCoach('report-look'), []);
  // the prep head's hire card in the drawer is where step 13 points: one ref, given to that one card (S72: while Nonna teaches, the drawer does not point at anything else)
  const hireRef = useCoachTarget('drawer:hire:prep');
  const eps = G.earningsPerSecond(game);

  // the sidewalk offers the next hire (each head, then the GM) here; see hireOnSidewalk (B1)
  const idleShopHere = hireOnSidewalk(shop, id, city);
  // the golden pizza's lane: under the order chip, and under an unmanaged shop's report strip (which stands at the top of the area, under the chip when one is up)
  const bonusTop = bonusLaneTop(chipUp, idleShopHere);
  // Goal bar (v5.21): the next task of the chapter the player is on, "Ch 2 · Serve 424 pies in Downtown 212/424"; a done chapter waiting on the story's
  // pacing shows "Ready" with the countdown. It buys nothing: a tap opens the task list. Once every chapter is done the city's mastery stars show, then the story count.
  let goal: Goal | null = null;
  const cg = chapterGoal(game, lastSceneEndPlay);
  const mg = cg ? null : masteryGoal(game);
  if (cg) goal = { ...cg, onPress: onGoal };
  else if (mg) goal = { label: mg.label, short: mg.short, tiny: mg.tiny, text: mg.text, current: mg.current, target: mg.target, onPress: onGoal };
  else {
    // G116: the active city's own count ("Story 0/36" in Boston), never the home city's total
    const story = cityStory(game);
    goal = {
      label: game.cityComplete ? `${CITY_NAME} is yours! Franchising soon` : story.label,
      current: story.current,
      target: story.target,
      icon: <TrophyIcon size={22} />,
      onPress: onGoal,
    };
  }
  // D541: a task completing says so: a tick pops on the bar, a toast names the task ("✓ Serve 424 pies in Downtown"), and the chapter's last gets a
  // "Chapter 2 complete" ribbon (the bar itself flashes once)
  const goalKey = cg?.key;
  const goalLabel = cg?.label ?? '';
  const prevGoal = useRef<{ key: string; label: string } | null>(null);
  const [cheer, setCheer] = useState<(GoalCheer & { id: number }) | null>(null);
  useEffect(() => {
    const prev = prevGoal.current;
    const next = goalKey === undefined ? null : { key: goalKey, label: goalLabel };
    prevGoal.current = next;
    const c = goalCheer(prev, next);
    if (!c) return;
    setCheer({ ...c, id: Date.now() });
    if (!c.chapter) flashToast(`\u2713 ${c.text}`);
  }, [goalKey, goalLabel]);

  // the HUD names the next station to tap (prep → oven → counter) until a GM runs the shop
  // G106: a shop whose three heads are hired runs itself too: it shows its rate, not "Baking…"
  const runs = G.runsItself(shop);
  const nextSt = runs ? null : G.nextStation(shop);
  const line = shop.line;
  const boost = hud.boost;
  const baseSubtitle = runs
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
  const subtitle = boost && runs ? hudRateText(eps, hud.mult) : baseSubtitle;

  // the drawer's cards are a pure model (drawer-model.ts): its level-dependent part is cached on the levels of every shop, so only cash is applied per tick; nothing while it is closed
  const drawer = drawerOpen ? drawerCards({ game, id }) : null;

  const drawerCard = (c: DrawerCardView) => (
    <StationCard
      key={c.key}
      testID={c.testID}
      icon={cachedIcon(c.icon)}
      title={c.title}
      level={c.level}
      detail={c.detail}
      wide={c.wide}
      muted={c.muted}
      tone={c.tone}
      cost={c.cost}
      buyLabel={c.buyLabel}
      costLabel={c.costLabel}
      canBuy={c.canBuy}
      buyKey={buyKeyOf(c.buy)}
      onBuyKey={onDrawerBuy}
      rootRef={c.testID === 'buy-headPrep' ? hireRef : undefined}
    />
  );

  // ---- sidewalk row: the four stations (or the manager, on a shop that needs one) + "All"
  // the same fit the scene itself uses (a wide shop scales by one screen's width or the height, like every shop: only its drawing is wider)
  const fit = sceneView(area.w || 1, area.h || 1, sceneFrame(game.shops[id].footprint)).fit;
  // the row's foot sits above the kerb line; see SIDEWALK_ROW for why each mode uses its height
  const rowBottom = (SCENE_H - CURB_Y) * fit.s + (idleShopHere ? SIDEWALK_ROW.raiseIdle : SIDEWALK_ROW.raiseManaged);
  const openDrawer = () => {
    haptic();
    setDrawerOpen(true);
  };

  return (
    <View style={[styles.root, { paddingTop: insets.top }]}>
      <Hud
        cash={game.cash}
        subtitle={coach && id === first ? '' : subtitle}
        boostText={boost?.text}
        goal={goal}
        cheer={cheer}
        newScenes={newScenes}
        onScrapbook={onScrapbook}
        onCity={onCity}
        onTasks={onTasks}
        tasksBadge={hud.badge}
        onGift={rewardsOn ? onGift : undefined}
        giftDot={hud.giftDot}
        chips={<Slots items={HUD_CHIPS} />}
        topChips={<Slots items={HUD_TOP_CHIPS} />}
        scrapRing={ring}
        coachLit={!!coachFlow.view && coachFlow.view.mode !== 'free' && !coachFlow.view.targets.includes('hud:goal')}
      />
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
          />
        )}
        {/* upgrade row standing on the sidewalk */}
        <SidewalkRow game={game} id={id} idleShop={idleShopHere} bottom={rowBottom} onBuy={buy} onOpen={openDrawer} quiet={coach?.id === 1} />
        {/* v5.16 (P1): the shop report's strip, one 44 pt row directly above the sidewalk row */}
        <ReportSlots
          items={SHOP_REPORT}
          bottom={idleShopHere ? Math.max(0, area.h - idleStripTop(chipUp) - STRIP.height) : rowBottom + SIDEWALK_ROW.cardHeight + STRIP.above}
        />
        {/* v5.13: the special-order chip under the goal bar, and the golden pizza in the sky (both sit under the drawers) */}
        <OrderChip top={ORDER_VIEW.top} onShop={setActive} />
        {/* the BANNERS slot: notices over the scene, under the drawers */}
        <Slots items={BANNERS} />
        {/* G95: drawn after the banners, so the pizza flies over a banner (a week-long attack) and stays tappable */}
        {area.w > 0 && <FloatingBonus width={area.w} height={area.h} top={bonusTop} />}
        {drawer && (
          <View style={StyleSheet.absoluteFill}>
            <Pressable
              testID="close-upgrades-dim"
              accessibilityRole="button"
              accessibilityLabel="Close the upgrades"
              style={styles.dim}
              onPress={() => setDrawerOpen(false)}
            />
            <View style={styles.drawer}>
              <View style={styles.drawerHead}>
                <View style={{ flex: 1 }}>
                  <Text style={styles.drawerTitle}>{drawer.title}</Text>
                  {/* the report's line ("Served 41/min · Missed 7/min") is long: it shrinks (never under 10 pt) to the room beside Close, then wraps rather than clip */}
                  {!coach && drawer.line && (
                    <Text
                      style={[styles.drawerSub, { fontSize: fitFont(drawer.line, screenW - 2 * DRAWER_HEAD.padX - DRAWER_CLOSE_W, 12, MIN_FONT) }]}
                      numberOfLines={2}
                    >
                      {drawer.line}
                    </Text>
                  )}
                </View>
                <Pressable
                  testID="close-upgrades"
                  accessibilityRole="button"
                  accessibilityLabel="Close the upgrades"
                  onPress={() => setDrawerOpen(false)}
                  style={styles.closeBtn}
                  hitSlop={CLOSE_SLOP}
                >
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
                {drawer.cards.map(drawerCard)}
                {ovenView && (
                  <StationCard
                    testID="buy-night-oven"
                    icon={MOON_ICON}
                    // D487: "Night oven · 8 h" is short enough for one line, and the unit never breaks off the number
                    title={`Night oven · ${(ovenView.next ? ovenView.next.hours : ovenView.hours).replace(/(\d) h$/, '$1\u00A0h')}`}
                    detail={ovenView.next ? (ovenView.next.lock ?? `Nonna keeps baking while you're away · now ${ovenView.hours}`) : 'Biggest it gets'}
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
                  {CITY_NAME} · {drawer.built}/{NEIGHBORHOODS.length} pizzerias · v{APP_VERSION}
                </Text>
              </ScrollView>
            </View>
          </View>
        )}
        {tasksOpen && (
          <TasksDrawer
            game={slow.game}
            now={slow.sec}
            clockOff={clockOff}
            bottomInset={insets.bottom}
            tab={tasksTab}
            onTab={setTasksTab}
            onClose={closeTasks}
            onGo={onGo}
            actions={taskActions}
          />
        )}
        {/* Toast floats in the open sky at the top of the scene, clear of the shop, the row and the cards. */}
        {toast && hintsAllowed(game).toast && <Toast compact text={toast.text} top={10} />}
      </View>
      {/* v5.20 (C1): the one tutorial highlight: a scrim with a cut-out over the HUD, the shop, the row and the drawer; under the calendar, the sheets and the cut-scenes */}
      {/* r4: the screen's layers take their zIndex from z-order.ts (HUD < coach < gift < night oven < SHEETS < offline popup < coins), so no overlay sits under the HUD or under the coach's scrim */}
      {coachView && (
        <View pointerEvents="box-none" style={styles.coachLayer}>
          <CoachOverlay {...coachView} onDone={coachDone} />
        </View>
      )}
      {/* v5.22 (E4): the report's coach (no hand on a look: it would cover the numbers it points at): over the strip (the coach's own layer), then over the sheet itself (above the SHEETS slot, under only the offline popup) */}
      {reportStep && (
        <View pointerEvents="box-none" style={reportStep.id === 'strip' ? styles.coachLayer : styles.reportCoachLayer}>
          <CoachOverlay targets={reportStep.targets} mode={reportStep.mode} text={reportStep.text} hand={reportStep.mode === 'tap'} onDone={onReportLook} />
        </View>
      )}
      {giftOpen && !covered && (
        <View pointerEvents="box-none" style={styles.giftLayer}>
          <GiftCalendar game={slow.game} now={slow.sec} onClaim={onClaimGift} onClose={closeGift} />
        </View>
      )}
      {ovenOpen && !covered && ovenView && (
        <View pointerEvents="box-none" style={styles.ovenLayer}>
          <NightOvenSheet view={ovenView} onBuy={buyNightOven} onClose={closeOven} />
        </View>
      )}
      {/* the SHEETS slot: modal sheets over the whole screen, under the offline popup */}
      <View pointerEvents="box-none" style={styles.sheetsLayer}>
        <Slots items={SHEETS} />
      </View>
      {offline && (
        <View pointerEvents="box-none" style={styles.offlineLayer}>
          <OfflinePopup summary={offline} nightOven={game.nightOven} onCollect={dismissOffline} onUpgrade={onOven} />
        </View>
      )}
      {/* payout coins fly from the carrier to the cash (D344); last, so the offline popup's burst from the oven's mouth shows over it (D454) */}
      <View pointerEvents="none" style={styles.coinsLayer}>
        <CoinLayer />
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: C.tomato },
  sceneArea: { flex: 1, overflow: 'hidden', backgroundColor: '#BFE0F7' },
  coachLayer: { ...StyleSheet.absoluteFill, zIndex: Z.coach },
  reportCoachLayer: { ...StyleSheet.absoluteFill, zIndex: Z.offline },
  giftLayer: { ...StyleSheet.absoluteFill, zIndex: Z.gift },
  ovenLayer: { ...StyleSheet.absoluteFill, zIndex: Z.nightOven },
  sheetsLayer: { ...StyleSheet.absoluteFill, zIndex: Z.sheets },
  offlineLayer: { ...StyleSheet.absoluteFill, zIndex: Z.offline },
  coinsLayer: { ...StyleSheet.absoluteFill, zIndex: Z.coins },
  dim: { position: 'absolute', left: 0, right: 0, top: 0, bottom: 0, backgroundColor: 'rgba(30,14,8,0.4)' },
  drawer: {
    position: 'absolute',
    left: 0,
    right: 0,
    bottom: 0,
    top: '30%',
    backgroundColor: C.bg,
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    borderTopWidth: 3,
    borderColor: C.ink,
  },
  drawerHead: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: DRAWER_HEAD.padX,
    paddingTop: DRAWER_HEAD.padTop,
    paddingBottom: DRAWER_HEAD.padBottom,
  },
  drawerTitle: { fontFamily: F.bold, fontSize: 17, color: C.ink },
  // the report's line is neutral: nothing in the drawer is colour coded (v5.22)
  drawerSub: { fontFamily: F.semi, fontSize: 12, color: C.inkSoft },
  closeBtn: {
    backgroundColor: '#fff',
    borderWidth: 2,
    borderColor: C.ink,
    borderRadius: 12,
    paddingHorizontal: 12,
    height: TAP.controls.closeButton.height,
    justifyContent: 'center',
  },
  closeText: { fontFamily: F.bold, fontSize: 13, color: C.ink },
  grid: { padding: 10, gap: 8, flexDirection: 'row', flexWrap: 'wrap', justifyContent: 'space-between' },
  banner: {
    width: '100%',
    backgroundColor: '#FFE7C2',
    borderRadius: 10,
    paddingVertical: 6,
    paddingHorizontal: 10,
    borderWidth: 1.5,
    borderColor: C.cheeseDark,
  },
  bannerText: { fontFamily: F.semi, fontSize: 12.5, color: C.ink, textAlign: 'center' },
  section: { width: '100%', fontFamily: F.bold, fontSize: 14, color: C.ink, marginTop: 6 },
  footer: { width: '100%', textAlign: 'center', fontFamily: F.regular, color: C.inkSoft, fontSize: 12, marginTop: 4 },
});
