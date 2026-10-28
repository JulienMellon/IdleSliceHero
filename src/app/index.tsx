import { router } from 'expo-router';
import { useCallback } from 'react';
import { ScrollView, StyleSheet, Text, useWindowDimensions, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { CityMap } from '@/components/city-map';
import { DriverIcon } from '@/components/icons';
import { type Goal, Hud, OfflinePopup, OvenCard, Toast, UpgradeRow } from '@/components/game-ui';
import { HOME_SCENES } from '@/content/scenes/home';
import { CITY_NAME, MAP_VIEWBOX, NEIGHBORHOODS, VEHICLES } from '@/content/tuning';
import type { NeighborhoodId } from '@/content/types';
import { count, money } from '@/engine/format';
import * as G from '@/engine/game';
import { APP_VERSION } from '@/content/version';
import { useGame } from '@/store/game-store';
import { C, F } from '@/theme';



export default function GameScreen() {
  const { width, height } = useWindowDimensions();
  const insets = useSafeAreaInsets();
  const game = useGame((s) => s.game);
  const offline = useGame((s) => s.offline);
  const toast = useGame((s) => s.toast);
  const covered = useGame((s) => !!s.playing || !!s.offline);
  const { tapOven, buy, unlock, dismissOffline } = useGame.getState();

  const bakeT = G.bakeSeconds(game.ovenLevel);
  const shelf = G.shelfCapacity();
  // Never nag to tap once Nonna runs the oven (G15).
  const idle = !game.autoBake && game.batchProgress < 0 && G.canStartBatch(game);
  const shelfFull = G.shelfFull(game);
  const onPressHood = useCallback((id: NeighborhoodId) => unlock(id), [unlock]);
  const delivering = game.stock > 0.01 || game.batchProgress >= 0 || game.autoBake;
  const eps = G.earningsPerSecond(game);
  const neck = G.bottleneck(game);
  const veh = VEHICLES[game.vehicle];
  const nextVeh = VEHICLES[game.vehicle + 1];
  const vehLock = G.nextVehicleLock(game);
  const nextHood = NEIGHBORHOODS.find((n) => !game.unlocked.includes(n.id));
  const hoodLock = nextHood ? G.neighborhoodLock(game, nextHood.id) : null;
  const newScenes = Math.max(0, game.seenScenes.length - game.scrapbookViewed);
  const mapH = Math.min(height * 0.36, (width * MAP_VIEWBOX.h) / MAP_VIEWBOX.w);

  // One always-visible next goal: the purchase worth saving for, picked by cash/sec per dollar.
  const gain = (what: G.Purchase) => G.gainOf(game, what) ?? 0;
  const plus = (v: number) => `+${money(v)}/sec`;
  const big = G.bestBigPurchase(game);
  let goal: Goal | null = null;
  if (nextHood && hoodLock && nextVeh && game.vehicle < nextHood.minVehicle && !vehLock) {
    goal = { label: `Get ${nextVeh.name}s → reach ${nextHood.name}`, current: game.cash, target: nextVeh.cost, onPress: () => buy('vehicle') };
  } else if (big === 'vehicle' && nextVeh) {
    goal = { label: `Get ${nextVeh.name}s · ${plus(gain('vehicle'))}`, current: game.cash, target: nextVeh.cost, onPress: () => buy('vehicle') };
  } else if (big === 'unlock' && nextHood) {
    goal = { label: `Open ${nextHood.name} · ${plus(gain('unlock'))}`, current: game.cash, target: nextHood.unlockCost, onPress: () => unlock(nextHood.id) };
  } else if ((nextHood || (nextVeh && !vehLock)) && neck === 'oven') {
    goal = { label: 'Oven is the limit — upgrade it', current: game.cash, target: G.ovenCost(game), onPress: () => buy('oven') };
  } else {
    // Next story beat that's waiting on deliveries: say exactly where to deliver.
    const pending = HOME_SCENES.find((sc) => !game.seenScenes.includes(sc.id) && sc.trigger.kind === 'deliveries' && game.unlocked.includes(sc.trigger.neighborhood));
    if (pending && pending.trigger.kind === 'deliveries') {
      const hood = NEIGHBORHOODS.find((n) => n.id === pending.trigger.neighborhood)!;
      goal = {
        label: `Deliver to ${hood.name} for the next story`,
        current: game.delivered[hood.id],
        target: pending.trigger.count,
        text: `${count(game.delivered[hood.id])} / ${count(pending.trigger.count)} 🍕`,
      };
    } else {
      goal = { label: game.cityComplete ? `${CITY_NAME} is yours! Franchising soon` : `Story ${game.seenScenes.length}/${HOME_SCENES.length}`, current: 1, target: 1, text: '🏆' };
    }
  }

  // HUD hint (G4): tell the player what actually helps right now.
  const subtitle = game.autoBake
    ? `${money(eps)}/sec`
    : neck === 'drivers'
      ? game.cash >= G.driverCost(game)
        ? 'Hire a driver to deliver faster!'
        : shelfFull
          ? `Shelf full — saving for a driver: ${money(game.cash)} / ${money(G.driverCost(game))}`
          : idle && game.stock < 1
            ? 'Tap the oven to bake!'
            : `Saving for a driver: ${money(game.cash)} / ${money(G.driverCost(game))}`
      : 'Tap the oven to bake faster!';

  return (
    <View style={[styles.root, { paddingTop: insets.top }]}>
      <Hud
        cash={game.cash}
        subtitle={subtitle}
        goal={goal}
        newScenes={newScenes}
        onScrapbook={() => router.push('/scrapbook')}
        onSettings={() => router.push('/settings')}
      />
      <View style={{ height: mapH, backgroundColor: C.map }}>
        <CityMap game={game} width={width} height={mapH} active={delivering} paused={covered} onPressHood={onPressHood} />
      </View>
      <ScrollView style={styles.sheet} contentContainerStyle={[styles.sheetInner, { paddingBottom: insets.bottom + 20 }]}>
        <OvenCard progress={game.batchProgress < 0 ? 0 : Math.min(1, game.batchProgress / bakeT)} stock={game.stock} shelf={shelf} auto={game.autoBake} idle={idle} full={shelfFull} fast={G.ovenIsFast(game)} rate={G.bakeRate(game)} onTap={tapOven} />
        <UpgradeRow
          testID="buy-driver"
          icon={<DriverIcon />}
          title="Drivers"
          level={`× ${game.drivers}`}
          detail={neck === 'drivers' ? `${G.deliveryRate(game).toFixed(1)} pizzas/sec · ${plus(gain('driver'))}` : `${G.deliveryRate(game).toFixed(1)} pizzas/sec · waiting on oven`}
          milestone={milestoneFor(game.drivers)}
          cost={G.driverCost(game)}
          canBuy={game.cash >= G.driverCost(game)}
          highlight={neck === 'drivers' && game.cash >= G.driverCost(game)}
          onBuy={() => buy('driver')}
        />
        <UpgradeRow
          testID="buy-oven"
          icon="🔥"
          title="Oven Speed"
          level={`Lv ${game.ovenLevel}`}
          detail={neck === 'oven' ? `${G.bakeRate(game).toFixed(1)} pizzas/sec · ${plus(gain('oven'))}` : `${G.bakeRate(game).toFixed(1)} pizzas/sec · waiting on drivers`}
          milestone={milestoneFor(game.ovenLevel)}
          cost={G.ovenCost(game)}
          canBuy={game.cash >= G.ovenCost(game)}
          highlight={neck === 'oven' && game.cash >= G.ovenCost(game)}
          onBuy={() => buy('oven')}
        />
        <UpgradeRow
          testID="buy-vehicle"
          icon={nextVeh ? nextVeh.emoji : veh.emoji}
          title={nextVeh ? `${nextVeh.name}s` : `${veh.name}s`}
          level={nextVeh ? `(now: ${veh.name})` : ''}
          detail={nextVeh ? (vehLock ?? (gain('vehicle') > 0.005 ? `+${Math.round(((nextVeh.capacity * nextVeh.speed) / (veh.capacity * veh.speed) - 1) * 100)}% deliveries · ${plus(gain('vehicle'))}` : '+$0/sec now · oven is the limit')) : 'Fastest fleet in town'}
          cost={nextVeh && !vehLock ? nextVeh.cost : null}
          costLabel={nextVeh ? 'Locked' : 'MAX'}
          canBuy={!!nextVeh && !vehLock && game.cash >= nextVeh.cost}
          highlight={big === 'vehicle' && !!nextVeh && game.cash >= nextVeh.cost}
          onBuy={() => buy('vehicle')}
        />
        <Text style={styles.footer}>
          {CITY_NAME} · {game.unlocked.length}/6 neighborhoods · v{APP_VERSION}
        </Text>
      </ScrollView>
      {offline && <OfflinePopup seconds={offline.seconds} earned={offline.earned} onCollect={dismissOffline} />}
      {toast && <Toast text={toast.text} top={insets.top + 96} />}
    </View>
  );
}

function milestoneFor(level: number) {
  const to = G.nextMilestone(level);
  if (!to) return null;
  const from = to === 25 ? 0 : to === 50 ? 25 : 50;
  return { from, to, level };
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: C.tomato },
  sheet: { flex: 1, backgroundColor: C.bg, borderTopLeftRadius: 22, borderTopRightRadius: 22, marginTop: -14 },
  sheetInner: { padding: 12, gap: 9 },
  footer: { textAlign: 'center', fontFamily: F.regular, color: C.inkSoft, fontSize: 12, marginTop: 4 },
});
