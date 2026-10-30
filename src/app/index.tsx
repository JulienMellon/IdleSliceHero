import { router } from 'expo-router';
import { useCallback, useState } from 'react';
import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { type Goal, haptic, Hud, OfflinePopup, Toast } from '@/components/game-ui';
import { buttonTone } from '@/components/sidewalk-model';
import { SidewalkRow } from '@/components/sidewalk-row';
import { CLOSE_SLOP, DRAWER_HEAD, SIDEWALK_ROW, TAP } from '@/components/tap-targets';
import { TrophyIcon, DecorIcon, DriverIcon, ExpandIcon, FlameIcon, ManagerIcon, PrepIcon, RegisterIcon, ScooterIcon, SeatIcon, SparkleIcon } from '@/components/icons';
import { Portrait } from '@/components/portrait';
import { CURB_Y, SCENE_H, sceneFit, Storefront } from '@/components/storefront';
import { ShopTabs, StationCard } from '@/components/shop-ui';
import { CITY_NAME, DECOR, DECOR_BOOST, DECOR_KINDS, FOOTPRINTS, HEAD_KINDS, HEAD_ROLE, HEAD_TITLE, HEADS, NEIGHBORHOODS, OVEN_GRADES, PIER9_BID, VEHICLES } from '@/content/tuning';
import { APP_VERSION } from '@/content/version';
import { money, pizzas, rate } from '@/engine/format';
import * as G from '@/engine/game';
import type { Station } from '@/engine/pipeline';
import { useGame } from '@/store/game-store';
import { C, F } from '@/theme';

const STAGE_NAME: Record<G.Stage, string> = { prep: 'prep', ovens: 'ovens', counter: 'counter', customers: 'drivers & seats' };

export default function GameScreen() {
  const insets = useSafeAreaInsets();
  const game = useGame((s) => s.game);
  const offline = useGame((s) => s.offline);
  const toast = useGame((s) => s.toast);
  const covered = useGame((s) => !!s.playing || !!s.offline);
  const { tapShop, buy, buyFleet, buyDecor, build, setActive, dismissOffline, bidPier9 } = useGame.getState();
  // stable, so the memoised scene isn't re-rendered by every 200 ms game tick
  // a rush on a GM shop: jobs finish sooner; the cash still arrives with the pies (no payout here)
  const onShopTap = useCallback(() => tapShop(), [tapShop]);
  const onStationTap = useCallback((st: Station) => {
    if (useGame.getState().tapStation(st)) haptic();
  }, []);
  const [area, setArea] = useState({ w: 0, h: 0 });
  // The full upgrade list opens over the shop on a tap of "All" (no gestures).
  const [drawerOpen, setDrawerOpen] = useState(false);

  const id = game.active;
  const shop = game.shops[id];
  const nd = G.def(id);
  const v = game.vehicle;
  const neck = G.bottleneck(shop, v);
  const rates: Record<G.Stage, number> = { prep: G.prepRate(shop), ovens: G.ovenRate(shop), counter: G.counterRate(shop), customers: G.demandRate(shop, v) };
  const minRate = Math.min(...Object.values(rates));
  const tied = (st: G.Stage) => rates[st] <= minRate * (1 + 1e-9);
  const plus = (x: number) => `+${money(x)}/s`;
  const newScenes = Math.max(0, game.seenScenes.length - game.scrapbookViewed);
  const eps = G.earningsPerSecond(game);
  const perk = G.perkOf(id, shop);
  // Tied stations: one upgrade alone adds $0/s, so say what to buy together. Keyed on levels, not cash or sales.
  const tiedCount = (['prep', 'ovens', 'counter', 'customers'] as const).filter(tied).length;
  const bundle = tiedCount >= 2 ? G.bundleHint(game, id) : null;

  const idleShopHere = !shop.managed && id !== 'downtown';
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
  if (next) candidates.push({ label: `Build a pizzeria in ${next.name}`, current: game.cash, target: next.buildCost, ratio: G.buildGain(game, next.id) / G.buildAllIn(next.id), onPress: () => build(next.id) });
  const vg = G.vehicleGain(game);
  if (vg && vg > 0) candidates.push({ label: `Upgrade fleet to ${VEHICLES[v + 1].name}s · ${plus(vg)}`, current: game.cash, target: VEHICLES[v + 1].cost, ratio: vg / VEHICLES[v + 1].cost, onPress: buyFleet });
  candidates.sort((a, b) => b.ratio - a.ratio);
  // Waterfront's finale is a purchase, so it leads the goal bar while it's on offer
  if (G.pier9Available(game)) candidates.unshift({ label: 'Bid on Pier 9 to save Marisol’s dock', current: game.cash, target: PIER9_BID.cost, ratio: Number.MAX_VALUE, onPress: bidPier9 });
  // On an unmanaged shop the sidewalk already offers "Hire a manager" here: show the next goal instead.
  // viewing an unmanaged shop: its manager is the goal
  // the sidewalk already offers this shop's next hire, so the goal bar moves on to the next goal (D341);
  // Downtown's sidewalk shows its stations instead, so there the hire leads the goal bar
  const mine = (c: Goal) => c.label.startsWith(`${nd.name}: hire`);
  const shown = idleShopHere ? candidates.filter((c) => !mine(c)) : !shop.managed ? [...candidates.filter(mine), ...candidates.filter((c) => !mine(c))] : candidates;
  let goal: Goal | null = shown[0] ?? null;
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
  const subtitle = shop.managed
    ? `${money(eps)}/sec across the city`
    : nextSt === 'counter'
      ? `Tap to serve · ${pizzas(line.baked)} baked`
      : nextSt === 'oven'
        ? `Tap to bake · ${pizzas(line.prepped)} prepped`
        : nextSt === 'prep'
          ? 'Tap to prep a batch of pizzas!'
          : line.oven
            ? 'Baking…'
            : line.prep
              ? 'Prepping…'
              : line.counter
                ? 'Serving…'
                : 'Your heads are on it';

  // Until the stations run themselves, upgrades here only pay while you tap: mute them so the hires stand out (C68).
  const idleShop = !G.runsItself(shop) && id !== 'downtown';
  // Expand is still worth it when a station is stuck at its level cap.
  const atCap = (['prep', 'ovens', 'counter', 'tables'] as const).some((w) => shop[w] >= G.levelCap(shop));
  const card = (what: G.Upgrade, props: { icon: React.ReactNode; title: string; level?: string; detail: string; hot?: boolean; wide?: boolean; costLabel?: string }) => {
    const cost = G.upgradeCostOf(game, id, what);
    const lock = G.upgradeLock(game, id, what);
    const muted = idleShop && what !== 'manager' && !G.isHeadUpgrade(what);
    // Expand is still worth buying when a station is stuck at its level cap, even though it adds $0/s by itself
    const gain = what === 'manager' || G.isHeadUpgrade(what) || (what === 'expand' && atCap) ? 1 : G.upgradeGain(game, id, what);
    return (
      <StationCard
        key={what}
        testID={`buy-${what}`}
        {...props}
        detail={lock && what !== 'manager' ? lock : lock && what === 'manager' && id !== 'downtown' ? `${lock} · then ×2 income here, and it earns while you're away` : props.detail}
        hot={muted ? false : props.hot}
        muted={muted}
        tone={buttonTone({ lock, gain, muted })}
        cost={lock ? null : cost}
        costLabel={props.costLabel ?? (lock && !/Finest|Biggest|Max/.test(lock) ? 'Locked' : 'MAX')}
        canBuy={!lock && cost !== null && game.cash >= cost}
        onBuy={() => buy(what)}
      />
    );
  };
  // Seating card: when the next visible table arrives
  const nextTableHint = (() => {
    const now = G.tablesShown(shop);
    for (let l = shop.tables + 1; l <= shop.tables + 400; l++) {
      if (G.tablesShown({ ...shop, tables: l }) > now) return l === shop.tables + 1 ? 'next level: +1 table' : `+1 table at Lv\u00A0${l}`;
    }
    return 'dining room full';
  })();
  const stationDetail = (st: G.Stage, what: G.Upgrade, rateText: string) => {
    const g = G.upgradeGain(game, id, what) ?? 0;
    if (g > 1e-9) return `${rateText} · ${plus(g)}`;
    if (tied(st)) {
      const others = (Object.keys(rates) as G.Stage[]).filter((x) => x !== st && tied(x)).map((x) => STAGE_NAME[x]);
      return `${rateText} · tied with ${others.join(' & ')}`;
    }
    // the shared reason ("waiting on …") is shown once in the drawer header; the button already says "no gain now" (D324)
    return rateText;
  };
  const gradeNext = OVEN_GRADES[shop.grade + 1];
  const fpNext = FOOTPRINTS[shop.footprint + 1];
  // computed once per render, not once per use (M32)
  const gradeGain = G.upgradeGain(game, id, 'grade') ?? 0;
  const expandGain = G.upgradeGain(game, id, 'expand') ?? 0;
  const lock = G.nextVehicleLock(game);
  const fleetLock = lock ? G.vehicleLockLabel(lock) : null;
  const nextVeh = VEHICLES[v + 1];

  // ---- sidewalk row: the four stations (or the manager, on a shop that needs one) + "All"
  const fit = sceneFit(area.w || 1, area.h || 1);
  // the row's foot sits above the kerb line; see SIDEWALK_ROW for why each mode uses its height
  const rowBottom = (SCENE_H - CURB_Y) * fit.s + (idleShop ? SIDEWALK_ROW.raiseIdle : SIDEWALK_ROW.raiseManaged);
  const openDrawer = () => {
    haptic();
    setDrawerOpen(true);
  };

  return (
    <View style={[styles.root, { paddingTop: insets.top }]}>
      <Hud cash={game.cash} subtitle={subtitle} goal={goal} newScenes={newScenes} onScrapbook={() => router.push('/scrapbook')} onCity={() => router.push('/city')} />
      <ShopTabs game={game} onSelect={setActive} onBuild={build} />
      <View style={styles.sceneArea} onLayout={(e) => setArea({ w: e.nativeEvent.layout.width, h: e.nativeEvent.layout.height })}>
        {area.w > 0 && (
          <Storefront
            // a new shop gets a fresh scene: clock, tap pills, rush burst and cash pop all reset
            key={id}
            id={id}
            width={area.w}
            height={area.h}
            paused={covered || drawerOpen}
            onTap={onShopTap}
            onStation={onStationTap}
          />
        )}
        {/* upgrade row standing on the sidewalk */}
        <SidewalkRow game={game} id={id} idleShop={idleShop} bottom={rowBottom} onBuy={buy} onOpen={openDrawer} />
        {drawerOpen && (
          <View style={StyleSheet.absoluteFill}>
            <Pressable testID="close-upgrades-dim" style={styles.dim} onPress={() => setDrawerOpen(false)} />
            <View style={styles.drawer}>
              <View style={styles.drawerHead}>
                <View style={{ flex: 1 }}>
                  <Text style={styles.drawerTitle}>{`Rosa’s · ${nd.name}`}</Text>
                  <Text style={styles.drawerSub} numberOfLines={1}>{`Bottleneck: ${STAGE_NAME[neck]}`}</Text>
                </View>
                <Pressable testID="close-upgrades" onPress={() => setDrawerOpen(false)} style={styles.closeBtn} hitSlop={CLOSE_SLOP}>
                  <Text style={styles.closeText}>Close ▼</Text>
                </Pressable>
              </View>
              <ScrollView contentContainerStyle={[styles.grid, { paddingBottom: insets.bottom + 20 }]}>
                {idleShop && (
                  <View style={styles.banner}>
                    <Text style={styles.bannerText}>Without a manager, upgrades here only pay while you tap.</Text>
                  </View>
                )}
                {perk && (
                  <View style={styles.banner}>
                    <Text style={styles.bannerText}>{`★ ${perk.who}’s perk: ${perk.text}`}</Text>
                  </View>
                )}
                {bundle && (
                  <View style={styles.banner}>
                    <Text style={styles.bannerText}>{`${bundle.label} · ${money(bundle.cost)} (one alone adds $0/s)`}</Text>
                  </View>
                )}
                {!shop.managed &&
                  HEAD_KINDS.map((k) =>
                    card(G.HEAD_UPGRADE[k], {
                      icon: <ManagerIcon size={26} />,
                      title: `${HEAD_TITLE[k]}: ${HEADS[id][k]}`,
                      detail: shop.heads[k] ? `Runs your ${k === 'oven' ? 'ovens' : k} for you` : `Runs the ${k === 'prep' ? 'prep table' : k === 'oven' ? 'ovens' : 'counter'} so you don't have to tap it`,
                      wide: true,
                      costLabel: 'Hired',
                    }),
                  )}
                {!shop.managed &&
                  card('manager', {
                    icon: id === 'downtown' ? <Portrait id="nonna-rosa" mood="happy" size={32} /> : <ManagerIcon size={26} />,
                    title: id === 'downtown' ? 'Manager: Nonna Rosa' : `Hire a ${nd.name} manager`,
                    detail: id === 'downtown' ? `Keep baking — ${G.nonnaCountdownText(game)}` : `General Manager: ×2 income here, and it earns while you're away (${plus(G.shopEarnings(game, id))})`,
                    wide: true,
                    costLabel: id === 'downtown' ? 'Soon' : undefined,
                  })}
                {card('prep', { icon: <PrepIcon size={26} />, title: 'Prep Cooks', level: `Lv ${shop.prep}`, detail: `${stationDetail('prep', 'prep', `${rate(rates.prep)}/s`)} · batch ${G.tapBatch(shop)} (bigger at Lv\u00A0${G.nextBatchLevel(shop)})`, hot: tied('prep') })}
                {card('ovens', { icon: <FlameIcon size={26} />, title: 'Ovens', level: `Lv ${shop.ovens}`, detail: stationDetail('ovens', 'ovens', `${rate(rates.ovens)}/s`), hot: tied('ovens') })}
                {card('counter', { icon: <RegisterIcon size={26} />, title: 'Counter', level: `Lv ${shop.counter}`, detail: stationDetail('counter', 'counter', `${rate(rates.counter)}/s`), hot: tied('counter') })}
                {card('drivers', { icon: <DriverIcon size={28} />, title: 'Drivers', level: `× ${shop.drivers}`, detail: stationDetail('customers', 'drivers', `${rate(G.deliveryRate(shop, v))}/s`), hot: tied('customers') })}
                {card('tables', { icon: <SeatIcon size={26} />, title: 'Seating', level: `Lv ${shop.tables}`, detail: nextTableHint === 'dining room full' ? `Dining room full · ${rate(G.walkInRate(shop))}\u00A0walk‑ins/s` : `${stationDetail('customers', 'tables', `${rate(G.walkInRate(shop))}\u00A0walk‑ins/s`)} · ${nextTableHint}`, hot: tied('customers') })}
                {card('grade', { icon: <SparkleIcon size={26} />, title: 'Grade', level: OVEN_GRADES[shop.grade].name, detail: gradeNext ? (gradeGain > 1e-9 ? `→ ${gradeNext.name} ×2 · ${plus(gradeGain)}` : `→ ${gradeNext.name} ×2`) : 'Finest ovens in town' })}
                {card('expand', { icon: <ExpandIcon size={26} />, title: 'Expand', level: `${shop.footprint + 1}/5`, detail: fpNext ? `×1.5 prep & counter${expandGain > 1e-9 ? ` · ${plus(expandGain)}` : atCap ? ` · Lv cap → ${G.levelCap(shop) + 25}` : ''}` : `${FOOTPRINTS[shop.footprint].name} — biggest it gets` })}
                <StationCard
                  testID="buy-fleet"
                  icon={<ScooterIcon size={26} />}
                  title="Fleet"
                  detail={nextVeh ? (fleetLock ? `→ ${nextVeh.name}s · ${fleetLock.charAt(0).toLowerCase()}${fleetLock.slice(1)}` : `→ ${nextVeh.name}s, all shops${vg && vg > 0 ? ` · ${plus(vg)}` : ''}`) : `${VEHICLES[v].name}s — top tier`}
                  cost={nextVeh && !fleetLock ? nextVeh.cost : null}
                  costLabel={nextVeh ? 'Locked' : 'MAX'}
                  canBuy={!!nextVeh && !fleetLock && game.cash >= nextVeh.cost}
                  tone={buttonTone({ lock: !nextVeh || !!fleetLock, gain: vg })}
                  onBuy={buyFleet}
                />
                <Text style={styles.section}>{`Decor · each tier: +${Math.round((perk?.decorBoost ?? DECOR_BOOST) * 100)}% pizza price in this shop`}</Text>
                {DECOR_KINDS.map((kind) => {
                  const d = DECOR[kind];
                  const tier = shop.decor[kind];
                  const cost = G.decorCost(game, id, kind);
                  const gain = G.decorGain(game, id, kind) ?? 0;
                  return (
                    <StationCard
                      key={kind}
                      testID={`decor-${kind}`}
                      icon={<DecorIcon kind={kind} size={26} />}
                      title={d.name}
                      level={`${tier}/3`}
                      detail={cost === null ? d.tiers[3] : `→ ${d.tiers[tier + 1]} · ${plus(gain)}`}
                      cost={cost}
                      costLabel="MAX"
                      canBuy={cost !== null && game.cash >= cost}
                      tone={buttonTone({ lock: cost === null, gain, muted: idleShop })}
                      muted={idleShop}
                      onBuy={() => buyDecor(kind)}
                    />
                  );
                })}
                <Text style={styles.footer}>
                  {CITY_NAME} · {NEIGHBORHOODS.filter((n) => game.shops[n.id].built).length}/6 pizzerias · v{APP_VERSION}
                </Text>
              </ScrollView>
            </View>
          </View>
        )}
        {/* Toast floats in the open sky at the top of the scene, clear of the shop, the row and the cards. */}
        {toast && <Toast compact text={toast.text} top={10} />}
      </View>
      {offline && <OfflinePopup seconds={offline.seconds} capped={offline.capped} awaySeconds={offline.awaySeconds} earned={offline.earned} byShop={offline.byShop} onCollect={dismissOffline} />}
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: C.tomato },
  sceneArea: { flex: 1, overflow: 'hidden', backgroundColor: '#BFE0F7' },
  dim: { position: 'absolute', left: 0, right: 0, top: 0, bottom: 0, backgroundColor: 'rgba(30,14,8,0.4)' },
  drawer: { position: 'absolute', left: 0, right: 0, bottom: 0, top: '30%', backgroundColor: C.bg, borderTopLeftRadius: 20, borderTopRightRadius: 20, borderTopWidth: 3, borderColor: C.ink },
  drawerHead: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: DRAWER_HEAD.padX, paddingTop: DRAWER_HEAD.padTop, paddingBottom: DRAWER_HEAD.padBottom },
  drawerTitle: { fontFamily: F.bold, fontSize: 17, color: C.ink },
  drawerSub: { fontFamily: F.semi, fontSize: 12, color: C.tomatoDark },
  closeBtn: { backgroundColor: '#fff', borderWidth: 2, borderColor: C.ink, borderRadius: 12, paddingHorizontal: 12, height: TAP.controls.closeButton.height, justifyContent: 'center' },
  closeText: { fontFamily: F.bold, fontSize: 13, color: C.ink },
  grid: { padding: 10, gap: 8, flexDirection: 'row', flexWrap: 'wrap', justifyContent: 'space-between' },
  banner: { width: '100%', backgroundColor: '#FFE7C2', borderRadius: 10, paddingVertical: 6, paddingHorizontal: 10, borderWidth: 1.5, borderColor: C.cheeseDark },
  bannerText: { fontFamily: F.semi, fontSize: 12.5, color: C.ink, textAlign: 'center' },
  section: { width: '100%', fontFamily: F.bold, fontSize: 14, color: C.ink, marginTop: 6 },
  footer: { width: '100%', textAlign: 'center', fontFamily: F.regular, color: C.inkSoft, fontSize: 12, marginTop: 4 },
});
