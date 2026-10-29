import { router } from 'expo-router';
import { useCallback, useState } from 'react';
import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { BuyButton, type Goal, haptic, Hud, OfflinePopup, Toast } from '@/components/game-ui';
import { TrophyIcon, DecorIcon, DriverIcon, ExpandIcon, FlameIcon, ManagerIcon, PrepIcon, RegisterIcon, ScooterIcon, SeatIcon, SparkleIcon } from '@/components/icons';
import { Portrait } from '@/components/portrait';
import { emitPayout } from '@/components/pulse-bus';
import { CURB_Y, SCENE_H, sceneFit, type StationKey, Storefront } from '@/components/storefront';
import { ShopTabs, StationCard } from '@/components/shop-ui';
import { CITY_NAME, DECOR, DECOR_BOOST, DECOR_KINDS, FOOTPRINTS, NEIGHBORHOODS, OVEN_GRADES, TUNING, VEHICLES } from '@/content/tuning';
import { APP_VERSION } from '@/content/version';
import { money } from '@/engine/format';
import * as G from '@/engine/game';
import { useGame } from '@/store/game-store';
import { C, F } from '@/theme';

const STAGE_NAME: Record<G.Stage, string> = { prep: 'prep', ovens: 'ovens', counter: 'counter', customers: 'drivers & seats' };

export default function GameScreen() {
  const insets = useSafeAreaInsets();
  const game = useGame((s) => s.game);
  const offline = useGame((s) => s.offline);
  const toast = useGame((s) => s.toast);
  const covered = useGame((s) => !!s.playing || !!s.offline);
  const { tapShop, buy, buyFleet, buyDecor, build, setActive, dismissOffline } = useGame.getState();
  // stable, so the memoised scene isn't re-rendered by every 200 ms game tick
  const onShopTap = useCallback(() => {
    tapShop();
    const g = useGame.getState().game;
    if (g.shops[g.active].managed) emitPayout();
  }, [tapShop]);
  const [area, setArea] = useState({ w: 0, h: 0 });
  // The full upgrade list opens over the shop on a tap (no gestures); a station tag can focus one card.
  const [drawer, setDrawer] = useState<{ open: boolean; focus: G.Upgrade | null }>({ open: false, focus: null });

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

  // Goal bar: the big purchase worth saving for, by cash/sec per dollar.
  const candidates: (Goal & { ratio: number })[] = [];
  for (const n of NEIGHBORHOODS) {
    const sh = game.shops[n.id];
    if (sh.built && !sh.managed && n.id !== 'downtown') {
      candidates.push({ label: `Hire a manager for ${n.name}`, current: game.cash, target: n.managerCost, ratio: (G.shopEarnings(game, n.id) / n.managerCost) * 3, onPress: () => {
        if (game.active !== n.id) setActive(n.id);
        return useGame.getState().buy('manager');
      } });
    }
  }
  const next = G.nextToBuild(game);
  if (next) candidates.push({ label: `Build a pizzeria in ${next.name}`, current: game.cash, target: next.buildCost, ratio: G.buildGain(game, next.id) / (next.buildCost + next.managerCost), onPress: () => build(next.id) });
  const vg = G.vehicleGain(game);
  if (vg && vg > 0) candidates.push({ label: `Upgrade fleet to ${VEHICLES[v + 1].name}s · ${plus(vg)}`, current: game.cash, target: VEHICLES[v + 1].cost, ratio: vg / VEHICLES[v + 1].cost, onPress: buyFleet });
  candidates.sort((a, b) => b.ratio - a.ratio);
  // On an unmanaged shop the sidewalk already offers "Hire a manager" here: show the next goal instead.
  // viewing an unmanaged shop: its manager is the goal
  const shown = !shop.managed && id !== 'downtown' ? [...candidates.filter((c) => c.label === `Hire a manager for ${nd.name}`), ...candidates.filter((c) => c.label !== `Hire a manager for ${nd.name}`)] : candidates;
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

  const queueFull = !shop.managed && shop.queued > TUNING.tapQueueMax - 1;
  const neckCost = G.upgradeCostOf(game, id, neck === 'customers' ? 'drivers' : neck);
  const neckUpgrade = neck === 'customers' ? 'drivers' : neck === 'ovens' ? 'oven' : neck === 'prep' ? 'prep cooks' : 'counter staff';
  const subtitle = !shop.managed
    ? queueFull
      ? neckCost !== null && game.cash < neckCost
        ? `Kitchen full — save ${money(neckCost)} for more ${neck === 'ovens' ? 'ovens' : neckUpgrade}`
        : neck === 'ovens' ? 'Kitchen full — upgrade your ovens!' : `Kitchen full — hire more ${neckUpgrade}!`
      : id === 'downtown'
        ? 'Tap the kitchen to bake each batch!'
        : 'Tap to bake here · or hire a manager'
    : `${money(eps)}/sec across the city`;

  // Until a manager is hired, upgrades here only pay while you tap: mute them so the manager stands out.
  const idleShop = !shop.managed && id !== 'downtown';
  // Expand is still worth it when a station is stuck at its level cap.
  const atCap = (['prep', 'ovens', 'counter', 'tables'] as const).some((w) => shop[w] >= G.levelCap(shop));
  const card = (what: G.Upgrade, props: { icon: React.ReactNode; title: string; level?: string; detail: string; hot?: boolean; wide?: boolean; costLabel?: string }) => {
    const cost = G.upgradeCostOf(game, id, what);
    const lock = G.upgradeLock(game, id, what);
    const muted = idleShop && what !== 'manager';
    return (
      <StationCard
        key={what}
        testID={`buy-${what}`}
        {...props}
        detail={lock && what !== 'manager' ? lock : props.detail}
        hot={muted ? false : props.hot}
        focus={drawer.focus === what}
        muted={muted}
        useless={(G.upgradeGain(game, id, what) ?? 0) <= 1e-9 && what !== 'manager' && !(what === 'expand' && atCap)}
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
      if (G.tablesShown({ ...shop, tables: l }) > now) return l === shop.tables + 1 ? 'next level: +1 table' : `+1 table at Lv ${l}`;
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
    // the shared reason ("waiting on …") is shown once in the drawer header
    return `${rateText} · +$0/s\u00A0now`;
  };
  const gradeNext = OVEN_GRADES[shop.grade + 1];
  const fpNext = FOOTPRINTS[shop.footprint + 1];
  const lock = G.nextVehicleLock(game);
  const fleetLock = lock ? G.vehicleLockLabel(lock) : null;
  const nextVeh = VEHICLES[v + 1];

  // ---- sidewalk row: the four stations (or the manager, on a shop that needs one) + "All"
  const fit = sceneFit(area.w || 1, area.h || 1);
  const rowBottom = (SCENE_H - CURB_Y) * fit.s + 6;
  const STATION: Record<StationKey, { what: G.Upgrade; icon: React.ReactNode; name: string; level: string }> = {
    prep: { what: 'prep', icon: <PrepIcon size={18} />, name: 'Prep', level: `${shop.prep}` },
    ovens: { what: 'ovens', icon: <FlameIcon size={18} />, name: 'Ovens', level: `${shop.ovens}` },
    counter: { what: 'counter', icon: <RegisterIcon size={18} />, name: 'Counter', level: `${shop.counter}` },
    drivers: { what: 'drivers', icon: <DriverIcon size={18} />, name: 'Drivers', level: `×${shop.drivers}` },
  };
  const walkButton = (k: StationKey) => {
    const { what, icon, name, level } = STATION[k];
    const cost = G.upgradeCostOf(game, id, what);
    const lock = G.upgradeLock(game, id, what);
    const gain = G.upgradeGain(game, id, what) ?? 0;
    const stage: G.Stage = k === 'drivers' ? 'customers' : k;
    const best = tied(stage) && gain > 1e-9;
    return (
      <View key={k} style={[styles.walkBtn, best && styles.walkBtnHot]}>
        {/* tapping the card head opens the drawer on that station (replaces the in-scene tags) */}
        <Pressable testID={`tag-${k}`} onPress={() => openDrawer(what)} style={styles.walkTop} hitSlop={4}>
          {icon}
          <Text style={styles.walkName} numberOfLines={1}>
            {name}
          </Text>
        </Pressable>
        <View style={[styles.walkLevel, best && { backgroundColor: C.tomato }]} pointerEvents="none">
          <Text style={styles.walkLevelText} numberOfLines={1}>
            {level}
          </Text>
        </View>
        <BuyButton
          compact
          testID={`walk-${k}`}
          tone={gain > 1e-9 ? 'normal' : 'neutral'}
          label={lock ? 'MAX' : money(cost ?? 0)}
          enabled={!lock && cost !== null && game.cash >= cost}
          onPress={() => buy(what)}
        />
      </View>
    );
  };
  const openDrawer = (focus: G.Upgrade | null) => {
    haptic();
    setDrawer({ open: true, focus });
  };
  const managerCost = G.upgradeCostOf(game, id, 'manager');

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
            paused={covered || drawer.open}
            onTap={onShopTap}
          />
        )}
        {/* upgrade row standing on the sidewalk */}
        <View style={[styles.walkRow, { bottom: rowBottom }]} pointerEvents="box-none">
          {idleShop ? (
            <View style={{ flex: 4, gap: 5 }}>
              {/* a slim station strip stays available on unmanaged shops */}
              <View style={styles.miniRow}>
                {(['prep', 'ovens', 'counter', 'drivers'] as StationKey[]).map((k) => {
                  const what = STATION[k].what;
                  const cost = G.upgradeCostOf(game, id, what);
                  const can = cost !== null && game.cash >= cost;
                  return (
                    <Pressable key={k} testID={`mini-${k}`} onPress={() => buy(what)} style={[styles.miniChip, can && styles.miniChipOn]}>
                      <Text style={[styles.miniText, can && { color: '#fff' }]} numberOfLines={1}>
                        {`${STATION[k].name} ${money(cost ?? 0)}`}
                      </Text>
                    </Pressable>
                  );
                })}
              </View>
            <View style={[styles.walkBtn, styles.walkBtnHot]}>
              <View style={styles.walkTop}>
                <ManagerIcon size={18} />
                <Text style={styles.walkName} numberOfLines={1}>
                  Hire a {nd.name} manager · {plus(G.shopEarnings(game, id))}
                </Text>
              </View>
              <BuyButton compact testID="walk-manager" label={money(managerCost ?? 0)} enabled={managerCost !== null && game.cash >= managerCost} onPress={() => buy('manager')} />
            </View>
            </View>
          ) : (
            (['prep', 'ovens', 'counter', 'drivers'] as StationKey[]).map(walkButton)
          )}
          <Pressable testID="open-upgrades" onPress={() => openDrawer(null)} style={styles.allBtn}>
            <Text style={styles.allIcon}>☰</Text>
            <Text style={styles.allText}>All</Text>
          </Pressable>
        </View>
        {drawer.open && (
          <View style={StyleSheet.absoluteFill}>
            <Pressable testID="close-upgrades-dim" style={styles.dim} onPress={() => setDrawer({ open: false, focus: null })} />
            <View style={styles.drawer}>
              <View style={styles.drawerHead}>
                <View style={{ flex: 1 }}>
                  <Text style={styles.drawerTitle}>{`Rosa’s · ${nd.name}`}</Text>
                  <Text style={styles.drawerSub} numberOfLines={1}>{`Bottleneck: ${STAGE_NAME[neck]}`}</Text>
                </View>
                <Pressable testID="close-upgrades" onPress={() => setDrawer({ open: false, focus: null })} style={styles.closeBtn} hitSlop={10}>
                  <Text style={styles.closeText}>Close ▼</Text>
                </Pressable>
              </View>
              <ScrollView contentContainerStyle={[styles.grid, { paddingBottom: insets.bottom + 20 }]}>
                {idleShop && (
                  <View style={styles.banner}>
                    <Text style={styles.bannerText}>Without a manager, upgrades here only pay while you tap.</Text>
                  </View>
                )}
                {!shop.managed &&
                  card('manager', {
                    icon: id === 'downtown' ? <Portrait id="nonna-rosa" mood="happy" size={32} /> : <ManagerIcon size={26} />,
                    title: id === 'downtown' ? 'Manager: Nonna Rosa' : `Hire a ${nd.name} manager`,
                    detail: id === 'downtown' ? 'Keep baking — Nonna will take over the kitchen soon' : `Runs this pizzeria on its own and earns while you're away (${plus(G.shopEarnings(game, id))})`,
                    hot: id !== 'downtown',
                    wide: true,
                    costLabel: id === 'downtown' ? 'Soon' : undefined,
                  })}
                {card('prep', { icon: <PrepIcon size={26} />, title: 'Prep Cooks', level: `Lv ${shop.prep}`, detail: stationDetail('prep', 'prep', `${rates.prep.toFixed(1)}/s`), hot: tied('prep') })}
                {card('ovens', { icon: <FlameIcon size={26} />, title: 'Ovens', level: `Lv ${shop.ovens}`, detail: stationDetail('ovens', 'ovens', `${rates.ovens.toFixed(1)}/s`), hot: tied('ovens') })}
                {card('counter', { icon: <RegisterIcon size={26} />, title: 'Counter', level: `Lv ${shop.counter}`, detail: stationDetail('counter', 'counter', `${rates.counter.toFixed(1)}/s`), hot: tied('counter') })}
                {card('drivers', { icon: <DriverIcon size={28} />, title: 'Drivers', level: `× ${shop.drivers}`, detail: stationDetail('customers', 'drivers', `${G.deliveryRate(shop, v).toFixed(1)}/s`), hot: tied('customers') })}
                {card('tables', { icon: <SeatIcon size={26} />, title: 'Seating', level: `Lv ${shop.tables}`, detail: nextTableHint === 'dining room full' ? `Dining room full · ${G.walkInRate(shop).toFixed(1)}\u00A0walk‑ins/s` : `${stationDetail('customers', 'tables', `${G.walkInRate(shop).toFixed(1)}\u00A0walk‑ins/s`)} · ${nextTableHint}`, hot: tied('customers') })}
                {card('grade', { icon: <SparkleIcon size={26} />, title: 'Grade', level: OVEN_GRADES[shop.grade].name, detail: gradeNext ? ((G.upgradeGain(game, id, 'grade') ?? 0) > 1e-9 ? `→ ${gradeNext.name} ×2 · ${plus(G.upgradeGain(game, id, 'grade')!)}` : `→ ${gradeNext.name} ×2`) : 'Finest ovens in town' })}
                {card('expand', { icon: <ExpandIcon size={26} />, title: 'Expand', level: `${shop.footprint + 1}/5`, detail: fpNext ? `×1.5 prep & counter · ${(G.upgradeGain(game, id, 'expand') ?? 0) > 1e-9 ? plus(G.upgradeGain(game, id, 'expand')!) : atCap ? `Lv cap → ${G.levelCap(shop) + 25}` : '+$0/s\u00A0now'}` : `${FOOTPRINTS[shop.footprint].name} — biggest it gets` })}
                <StationCard
                  testID="buy-fleet"
                  icon={<ScooterIcon size={26} />}
                  title="Fleet"
                  detail={nextVeh ? (fleetLock ? `→ ${nextVeh.name}s · ${fleetLock.charAt(0).toLowerCase()}${fleetLock.slice(1)}` : `→ ${nextVeh.name}s, all shops · ${vg && vg > 0 ? plus(vg) : '+$0/s\u00A0now'}`) : `${VEHICLES[v].name}s — top tier`}
                  cost={nextVeh && !fleetLock ? nextVeh.cost : null}
                  costLabel={nextVeh ? 'Locked' : 'MAX'}
                  canBuy={!!nextVeh && !fleetLock && game.cash >= nextVeh.cost}
                  useless={!vg || vg <= 1e-9}
                  onBuy={buyFleet}
                />
                <Text style={styles.section}>{`Decor · each tier: +${Math.round(DECOR_BOOST * 100)}% pizza price in this shop`}</Text>
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
      {offline && <OfflinePopup seconds={offline.seconds} earned={offline.earned} byShop={offline.byShop} onCollect={dismissOffline} />}
    </View>
  );
}

const shadow = { boxShadow: '0 4px 0 rgba(59,31,20,0.25)' } as object;
const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: C.tomato },
  sceneArea: { flex: 1, overflow: 'hidden', backgroundColor: '#BFE0F7' },
  walkRow: { position: 'absolute', left: 8, right: 8, flexDirection: 'row', gap: 5 },
  walkBtn: { flex: 1, backgroundColor: 'rgba(255,255,255,0.95)', borderRadius: 12, borderWidth: 2.5, borderColor: C.ink, paddingHorizontal: 3, paddingTop: 2, paddingBottom: 4, gap: 2, ...shadow },
  walkBtnHot: { borderColor: C.tomato, backgroundColor: '#FFF4F0' },
  walkTop: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 3, height: 20 },
  walkIcon: { fontSize: 14 },
  walkName: { fontFamily: F.bold, fontSize: 12, color: C.ink, flexShrink: 1 },
  miniRow: { flexDirection: 'row', gap: 4 },
  miniChip: { flex: 1, backgroundColor: 'rgba(255,255,255,0.95)', borderRadius: 9, borderWidth: 2, borderColor: C.ink, paddingVertical: 3, alignItems: 'center' },
  miniChipOn: { backgroundColor: C.basil, borderColor: C.basilDark },
  miniText: { fontFamily: F.bold, fontSize: 10.5, color: C.inkSoft },
  walkLevel: { position: 'absolute', top: -9, right: -4, minWidth: 22, paddingHorizontal: 5, height: 17, borderRadius: 9, backgroundColor: C.ink, borderWidth: 1.5, borderColor: '#fff', alignItems: 'center', justifyContent: 'center' },
  walkLevelText: { fontFamily: F.bold, fontSize: 10, color: '#fff' },
  allBtn: { width: 46, backgroundColor: C.ink, borderRadius: 12, alignItems: 'center', justifyContent: 'center', ...shadow },
  allIcon: { color: '#fff', fontSize: 16, lineHeight: 18 },
  allText: { color: '#fff', fontFamily: F.bold, fontSize: 12 },
  dim: { position: 'absolute', left: 0, right: 0, top: 0, bottom: 0, backgroundColor: 'rgba(30,14,8,0.4)' },
  drawer: { position: 'absolute', left: 0, right: 0, bottom: 0, top: '30%', backgroundColor: C.bg, borderTopLeftRadius: 20, borderTopRightRadius: 20, borderTopWidth: 3, borderColor: C.ink },
  drawerHead: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 14, paddingTop: 10, paddingBottom: 4 },
  drawerTitle: { fontFamily: F.bold, fontSize: 17, color: C.ink },
  drawerSub: { fontFamily: F.semi, fontSize: 12, color: C.tomatoDark },
  closeBtn: { backgroundColor: '#fff', borderWidth: 2, borderColor: C.ink, borderRadius: 12, paddingHorizontal: 12, paddingVertical: 2 },
  closeText: { fontFamily: F.bold, fontSize: 13, color: C.ink },
  grid: { padding: 10, gap: 8, flexDirection: 'row', flexWrap: 'wrap', justifyContent: 'space-between' },
  banner: { width: '100%', backgroundColor: '#FFE7C2', borderRadius: 10, paddingVertical: 6, paddingHorizontal: 10, borderWidth: 1.5, borderColor: C.cheeseDark },
  bannerText: { fontFamily: F.semi, fontSize: 12.5, color: C.ink, textAlign: 'center' },
  section: { width: '100%', fontFamily: F.bold, fontSize: 14, color: C.ink, marginTop: 6 },
  footer: { width: '100%', textAlign: 'center', fontFamily: F.regular, color: C.inkSoft, fontSize: 12, marginTop: 4 },
});
