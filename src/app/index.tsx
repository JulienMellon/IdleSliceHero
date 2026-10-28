import { router } from 'expo-router';
import { useEffect, useState } from 'react';
import { ScrollView, StyleSheet, Text, useWindowDimensions, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { CityMap } from '@/components/city-map';
import { Hud, OfflinePopup, OvenCard, Toast, UpgradeRow } from '@/components/game-ui';
import { HOME_SCENES } from '@/content/scenes/home';
import { CITY_NAME, NEIGHBORHOODS, VEHICLES } from '@/content/tuning';
import { money } from '@/engine/format';
import * as G from '@/engine/game';
import { useGame } from '@/store/game-store';
import { C, F } from '@/theme';

export default function GameScreen() {
  const { width, height } = useWindowDimensions();
  const insets = useSafeAreaInsets();
  const game = useGame((s) => s.game);
  const offline = useGame((s) => s.offline);
  const toast = useGame((s) => s.toast);
  const { tapOven, buy, unlock, dismissOffline } = useGame.getState();
  const [clock, setClock] = useState(0);
  const [now, setNow] = useState(Date.now());

  // Animation clock for the map (drivers, pulses).
  useEffect(() => {
    const start = Date.now();
    const t = setInterval(() => {
      setClock((Date.now() - start) / 1000);
      setNow(Date.now());
    }, 50);
    return () => clearInterval(t);
  }, []);

  const bakeT = G.bakeSeconds(game.ovenLevel);
  const idle = game.batchProgress < 0 && game.stock < G.shelfCapacity();
  const delivering = game.stock > 0.01 || game.batchProgress >= 0 || game.autoBake;
  const eps = G.earningsPerSecond(game);
  const neck = G.bottleneck(game);
  const veh = VEHICLES[game.vehicle];
  const nextVeh = VEHICLES[game.vehicle + 1];
  const vehLock = G.nextVehicleLock(game);
  const nextHood = NEIGHBORHOODS.find((n) => !game.unlocked.includes(n.id));
  const hoodLock = nextHood ? G.neighborhoodLock(game, nextHood.id) : null;
  const seenCount = game.seenScenes.length;
  const mapH = Math.min(height * 0.4, width * 0.95);

  return (
    <View style={[styles.root, { paddingTop: insets.top, backgroundColor: C.tomato }]}>
      <Hud cash={game.cash} perSecond={eps} auto={game.autoBake} newScenes={0} onScrapbook={() => router.push('/scrapbook')} onSettings={() => router.push('/settings')} />
      <View style={{ height: mapH, backgroundColor: C.map }}>
        <CityMap game={game} width={width} height={mapH} clock={clock} active={delivering} onPressHood={(id) => unlock(id)} />
        <View style={styles.cityTag}>
          <Text style={styles.cityTagText}>
            {CITY_NAME} · {game.unlocked.length}/6
          </Text>
        </View>
      </View>
      <ScrollView style={styles.sheet} contentContainerStyle={[styles.sheetInner, { paddingBottom: insets.bottom + 24 }]}>
        <OvenCard progress={game.batchProgress < 0 ? 0 : Math.min(1, game.batchProgress / bakeT)} stock={game.stock} shelf={G.shelfCapacity()} auto={game.autoBake} idle={idle} onTap={tapOven} />

        {nextHood ? (
          <UpgradeRow
            testID="buy-neighborhood"
            icon="🗺️"
            title={`Open ${nextHood.name}`}
            level=""
            detail={hoodLock ? hoodLock : `Pays ${money(nextHood.orderValue)} per pizza · ${nextHood.distance} blocks away`}
            cost={hoodLock ? null : nextHood.unlockCost}
            costLabel="Locked"
            canBuy={!hoodLock && game.cash >= nextHood.unlockCost}
            highlight={!hoodLock && game.cash >= nextHood.unlockCost}
            onBuy={() => unlock(nextHood.id)}
          />
        ) : (
          <View style={styles.doneCard}>
            <Text style={styles.doneText}>🏆 Every neighborhood loves Rosa’s! Franchising arrives in a future update.</Text>
          </View>
        )}

        <UpgradeRow
          testID="buy-oven"
          icon="🔥"
          title="Oven Speed"
          level={`Lv ${game.ovenLevel}`}
          detail={`${G.bakeRate(game).toFixed(1)} pizzas/sec${neck === 'oven' ? ' · bottleneck!' : ''}`}
          milestone={milestoneFor(game.ovenLevel)}
          cost={G.ovenCost(game)}
          canBuy={game.cash >= G.ovenCost(game)}
          highlight={neck === 'oven' && game.cash >= G.ovenCost(game)}
          onBuy={() => buy('oven')}
        />
        <UpgradeRow
          testID="buy-driver"
          icon="🧑‍🍳"
          title="Drivers"
          level={`× ${game.drivers}`}
          detail={`${G.deliveryRate(game).toFixed(1)} pizzas/sec${neck === 'drivers' ? ' · bottleneck!' : ''}`}
          milestone={milestoneFor(game.drivers)}
          cost={G.driverCost(game)}
          canBuy={game.cash >= G.driverCost(game)}
          highlight={neck === 'drivers' && game.cash >= G.driverCost(game)}
          onBuy={() => buy('driver')}
        />
        <UpgradeRow
          testID="buy-vehicle"
          icon={nextVeh ? nextVeh.emoji : veh.emoji}
          title={nextVeh ? `Upgrade to ${nextVeh.name}` : veh.name}
          level=""
          detail={nextVeh ? (vehLock ?? `${veh.name} → ${nextVeh.name}: ${nextVeh.capacity} pizzas/trip, ${(nextVeh.speed / veh.speed).toFixed(1)}× faster`) : 'Fastest fleet in town'}
          cost={nextVeh && !vehLock ? nextVeh.cost : null}
          costLabel={nextVeh ? 'Locked' : 'MAX'}
          canBuy={!!nextVeh && !vehLock && game.cash >= nextVeh.cost}
          onBuy={() => buy('vehicle')}
        />
        <Text style={styles.footer}>
          Story {seenCount}/{HOME_SCENES.length} · v0.1
        </Text>
      </ScrollView>
      {offline && <OfflinePopup seconds={offline.seconds} earned={offline.earned} onCollect={dismissOffline} />}
      {toast && now - toast.at < 1800 && <Toast text={toast.text} />}
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
  root: { flex: 1 },
  sheet: { flex: 1, backgroundColor: C.bg, borderTopLeftRadius: 24, borderTopRightRadius: 24, marginTop: -18 },
  sheetInner: { padding: 14, gap: 10 },
  cityTag: { position: 'absolute', top: 8, left: 10, backgroundColor: 'rgba(255,255,255,0.9)', borderRadius: 12, paddingHorizontal: 10, paddingVertical: 4, borderWidth: 2, borderColor: C.ink },
  cityTagText: { fontFamily: F.bold, color: C.ink, fontSize: 13 },
  doneCard: { backgroundColor: C.cheese, borderRadius: 18, padding: 14, borderWidth: 3, borderColor: C.ink },
  doneText: { fontFamily: F.semi, color: C.ink, fontSize: 15 },
  footer: { textAlign: 'center', fontFamily: F.regular, color: C.inkSoft, fontSize: 12, marginTop: 6 },
});
