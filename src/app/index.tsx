import { router } from 'expo-router';
import { ScrollView, StyleSheet, Text, useWindowDimensions, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { type Goal, Hud, OfflinePopup, Toast } from '@/components/game-ui';
import { DriverIcon } from '@/components/icons';
import { emitPayout } from '@/components/pulse-bus';
import { ShopCutaway } from '@/components/shop-cutaway';
import { ShopTabs, StationCard } from '@/components/shop-ui';
import { CITY_NAME, FOOTPRINTS, NEIGHBORHOODS, OVEN_GRADES, VEHICLES } from '@/content/tuning';
import { APP_VERSION } from '@/content/version';
import { money } from '@/engine/format';
import * as G from '@/engine/game';
import { useGame } from '@/store/game-store';
import { C, F } from '@/theme';

const STAGE_NAME: Record<G.Stage, string> = { prep: 'prep', ovens: 'ovens', counter: 'counter', customers: 'drivers & seats' };

export default function GameScreen() {
  const { width, height } = useWindowDimensions();
  const insets = useSafeAreaInsets();
  const game = useGame((s) => s.game);
  const offline = useGame((s) => s.offline);
  const toast = useGame((s) => s.toast);
  const covered = useGame((s) => !!s.playing || !!s.offline);
  const { tapShop, buy, buyFleet, build, setActive, dismissOffline } = useGame.getState();

  const id = game.active;
  const shop = game.shops[id];
  const nd = G.def(id);
  const v = game.vehicle;
  const neck = G.bottleneck(shop, v);
  const rates: Record<G.Stage, number> = { prep: G.prepRate(shop), ovens: G.ovenRate(shop), counter: G.counterRate(shop), customers: G.demandRate(shop, v) };
  const minRate = Math.min(...Object.values(rates));
  const tied = (st: G.Stage) => rates[st] <= minRate * (1 + 1e-9);
  const plus = (x: number) => `+${money(x)}/s`;
  const cutH = Math.min(height * 0.34, width * 0.62);
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
  let goal: Goal | null = candidates[0] ?? null;
  if (!goal) {
    goal = { label: game.cityComplete ? `${CITY_NAME} is yours! Franchising soon` : `Story ${game.seenScenes.length}/24`, current: 1, target: 1, text: '🏆' };
  }

  const subtitle = !shop.managed
    ? id === 'downtown'
      ? 'Tap the kitchen to bake each batch!'
      : 'Tap to bake here · or hire a manager'
    : `${money(eps)}/sec across the city`;

  const card = (what: G.Upgrade, props: { icon: React.ReactNode; title: string; level?: string; detail: string; hot?: boolean; wide?: boolean; costLabel?: string }) => {
    const cost = G.upgradeCostOf(game, id, what);
    const lock = G.upgradeLock(game, id, what);
    return (
      <StationCard
        key={what}
        testID={`buy-${what}`}
        {...props}
        detail={lock && what !== 'manager' ? lock : props.detail}
        cost={lock ? null : cost}
        costLabel={props.costLabel ?? (lock ? 'Locked' : 'MAX')}
        canBuy={!lock && cost !== null && game.cash >= cost}
        onBuy={() => buy(what)}
      />
    );
  };
  const stationDetail = (st: G.Stage, what: G.Upgrade, rateText: string) => {
    const g = G.upgradeGain(game, id, what) ?? 0;
    if (g > 1e-9) return `${rateText} · ${plus(g)}`;
    if (tied(st)) {
      const others = (Object.keys(rates) as G.Stage[]).filter((x) => x !== st && tied(x)).map((x) => STAGE_NAME[x]);
      return `${rateText} · tied with ${others.join(' & ')}`;
    }
    return `${rateText} · waiting on ${STAGE_NAME[neck]}`;
  };
  const gradeNext = OVEN_GRADES[shop.grade + 1];
  const fpNext = FOOTPRINTS[shop.footprint + 1];
  const fleetLock = G.nextVehicleLock(game);
  const nextVeh = VEHICLES[v + 1];

  return (
    <View style={[styles.root, { paddingTop: insets.top }]}>
      <Hud cash={game.cash} subtitle={subtitle} goal={goal} newScenes={newScenes} onScrapbook={() => router.push('/scrapbook')} onSettings={() => router.push('/settings')} onCity={() => router.push('/city')} />
      <ShopTabs game={game} onSelect={setActive} onBuild={build} />
      <View style={{ height: cutH, backgroundColor: nd.wall, overflow: 'hidden' }}>
        <ShopCutaway
          game={game}
          id={id}
          width={width}
          height={cutH}
          paused={covered}
          onTap={() => {
            tapShop();
            if (shop.managed) emitPayout();
          }}
        />
      </View>
      <ScrollView style={styles.sheet} contentContainerStyle={[styles.grid, { paddingBottom: insets.bottom + 20 }]}>
        {!shop.managed &&
          card('manager', {
            icon: '🧑‍💼',
            title: id === 'downtown' ? 'Manager: Nonna Rosa' : `Hire a ${nd.name} manager`,
            detail: id === 'downtown' ? 'Keep baking — Nonna will take over the kitchen soon' : `Runs this pizzeria on its own and earns while you're away (${plus(G.shopEarnings(game, id))})`,
            hot: id !== 'downtown',
            wide: true,
            costLabel: id === 'downtown' ? 'Soon' : undefined,
          })}
        {card('prep', { icon: '🧑‍🍳', title: 'Prep Cooks', level: `Lv ${shop.prep}`, detail: stationDetail('prep', 'prep', `${rates.prep.toFixed(1)}/s`), hot: tied('prep') })}
        {card('ovens', { icon: '🔥', title: 'Ovens', level: `Lv ${shop.ovens}`, detail: stationDetail('ovens', 'ovens', `${rates.ovens.toFixed(1)}/s`), hot: tied('ovens') })}
        {card('counter', { icon: '🧾', title: 'Counter', level: `Lv ${shop.counter}`, detail: stationDetail('counter', 'counter', `${rates.counter.toFixed(1)}/s`), hot: tied('counter') })}
        {card('drivers', { icon: <DriverIcon size={28} />, title: 'Drivers', level: `× ${shop.drivers}`, detail: stationDetail('customers', 'drivers', `${G.deliveryRate(shop, v).toFixed(1)}/s`), hot: tied('customers') })}
        {card('tables', { icon: '🪑', title: 'Seating', level: `Lv ${shop.tables}`, detail: stationDetail('customers', 'tables', `${G.walkInRate(shop).toFixed(1)} walk-ins/s`), hot: false })}
        {card('grade', { icon: '✨', title: 'Oven Grade', level: OVEN_GRADES[shop.grade].name, detail: gradeNext ? `→ ${gradeNext.name}: ×2 bake speed` : 'Finest ovens in town' })}
        {card('expand', { icon: '🏗️', title: 'Expand', level: `${shop.footprint + 1}/5`, detail: fpNext ? `→ ${fpNext.name}: max Lv ${G.levelCap(shop) + 25}, more room` : `${FOOTPRINTS[shop.footprint].name} — biggest it gets` })}
        <StationCard
          testID="buy-fleet"
          icon={nextVeh ? nextVeh.emoji : VEHICLES[v].emoji}
          title="Fleet"
          detail={nextVeh ? fleetLock ?? `→ ${nextVeh.name}s, all shops · ${vg && vg > 0 ? plus(vg) : '+$0/s now'}` : `${VEHICLES[v].name}s — top tier`}
          cost={nextVeh && !fleetLock ? nextVeh.cost : null}
          costLabel={nextVeh ? 'Locked' : 'MAX'}
          canBuy={!!nextVeh && !fleetLock && game.cash >= nextVeh.cost}
          onBuy={buyFleet}
        />
        <Text style={styles.footer}>
          {CITY_NAME} · {NEIGHBORHOODS.filter((n) => game.shops[n.id].built).length}/6 pizzerias · v{APP_VERSION}
        </Text>
      </ScrollView>
      {offline && <OfflinePopup seconds={offline.seconds} earned={offline.earned} onCollect={dismissOffline} />}
      {toast && <Toast text={toast.text} top={insets.top + 140} />}
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: C.tomato },
  sheet: { flex: 1, backgroundColor: C.bg, borderTopLeftRadius: 18, borderTopRightRadius: 18, marginTop: -10 },
  grid: { padding: 10, gap: 8, flexDirection: 'row', flexWrap: 'wrap', justifyContent: 'space-between' },
  footer: { width: '100%', textAlign: 'center', fontFamily: F.regular, color: C.inkSoft, fontSize: 12, marginTop: 4 },
});
