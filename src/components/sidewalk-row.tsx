// The upgrade row standing on the sidewalk: four station buttons (or, on a shop with no manager, a chip row and the
// manager button) plus "All". Every control is drawn at 44 pt (see tap-targets.ts). Moved out of app/index.tsx (A15).
import { Pressable, StyleSheet, Text, View } from 'react-native';

import type { NeighborhoodId } from '../content/types';
import { money } from '../engine/format';
import * as G from '../engine/game';
import { C, F } from '../theme';
import { BuyButton } from './game-ui';
import { DriverIcon, FlameIcon, PrepIcon, RegisterIcon } from './icons';
import type { StationKey } from './storefront';
import { IDLE_STACK_GAP, SIDEWALK_ROW, STATION_CARD } from './tap-targets';

const STATION_KEYS: StationKey[] = ['prep', 'ovens', 'counter', 'drivers'];
const STATION: Record<StationKey, { what: G.Upgrade; name: string; stage: G.Stage }> = {
  prep: { what: 'prep', name: 'PREP', stage: 'prep' },
  ovens: { what: 'ovens', name: 'OVENS', stage: 'ovens' },
  counter: { what: 'counter', name: 'COUNTER', stage: 'counter' },
  drivers: { what: 'drivers', name: 'DRIVERS', stage: 'customers' },
};
// static icon elements: built once, not per render (M24)
const ICON: Record<StationKey, React.ReactNode> = {
  prep: <PrepIcon size={13} />,
  ovens: <FlameIcon size={13} />,
  counter: <RegisterIcon size={13} />,
  drivers: <DriverIcon size={13} />,
};
const levelOf = (k: StationKey, shop: G.Shop) => (k === 'drivers' ? `×${shop.drivers}` : `${shop[k]}`);

export function SidewalkRow({ game, id, idleShop, bottom, tied, onBuy, onOpen }: { game: G.GameState; id: NeighborhoodId; idleShop: boolean; bottom: number; tied: (stage: G.Stage) => boolean; onBuy: (what: G.Upgrade) => boolean; onOpen: () => void }) {
  const shop = game.shops[id];
  const station = (k: StationKey, framed: boolean) => {
    const { what, name, stage } = STATION[k];
    const cost = G.upgradeCostOf(game, id, what);
    const lock = G.upgradeLock(game, id, what);
    const gain = G.upgradeGain(game, id, what) ?? 0;
    const affordable = !lock && cost !== null && game.cash >= cost;
    const useful = gain > 1e-9;
    // the bottleneck: solid red once you can buy it, a soft dashed outline while you save for it (D316)
    const neck = tied(stage) && useful;
    const button = (
      <BuyButton compact testID={framed ? `walk-${k}` : `mini-${k}`} icon={ICON[k]} sub={name} tone={useful || lock ? 'normal' : 'nogain'} label={lock ? 'MAX' : money(cost ?? 0)} enabled={affordable} onPress={() => onBuy(what)} />
    );
    const badge = (
      <View style={[styles.level, neck && affordable && styles.levelHot]} pointerEvents="none">
        <Text style={styles.levelText} numberOfLines={1}>
          {levelOf(k, shop)}
        </Text>
      </View>
    );
    return framed ? (
      <View key={k} style={[styles.card, neck && (affordable ? styles.cardHot : styles.cardWaiting)]}>
        {button}
        {badge}
      </View>
    ) : (
      // an unmanaged shop has no room for frames: the same button and badge, unframed (D315)
      <View key={k} style={styles.chip}>
        {button}
        {badge}
      </View>
    );
  };
  const managerCost = G.upgradeCostOf(game, id, 'manager');
  return (
    <View style={[styles.row, { bottom }]} pointerEvents="box-none">
      {idleShop ? (
        <View style={styles.idleStack}>
          <View style={styles.chipRow}>{STATION_KEYS.map((k) => station(k, false))}</View>
          {/* what you get on top, the price below (D310, D311) */}
          <BuyButton compact testID="walk-manager" sub={`HIRE A MANAGER · +${money(G.shopEarnings(game, id))}/s`} label={money(managerCost ?? 0)} enabled={managerCost !== null && game.cash >= managerCost} onPress={() => onBuy('manager')} />
        </View>
      ) : (
        STATION_KEYS.map((k) => station(k, true))
      )}
      <Pressable testID="open-upgrades" onPress={onOpen} style={[styles.all, idleShop && styles.allIdle]}>
        <Text style={styles.allIcon}>☰</Text>
        <Text style={styles.allText}>All</Text>
      </Pressable>
    </View>
  );
}

const shadow = { boxShadow: '0 4px 0 rgba(59,31,20,0.25)' } as object;
const styles = StyleSheet.create({
  row: { position: 'absolute', left: 8, right: 8, flexDirection: 'row', gap: 5, alignItems: 'flex-end' },
  card: { flex: 1, height: SIDEWALK_ROW.cardHeight, backgroundColor: 'rgba(255,255,255,0.95)', borderRadius: 12, borderWidth: STATION_CARD.border, borderColor: C.ink, padding: STATION_CARD.padding, ...shadow },
  cardHot: { borderColor: C.tomato, backgroundColor: '#FFF4F0' },
  cardWaiting: { borderColor: '#F2B8B0', borderStyle: 'dashed' },
  idleStack: { flex: 4, gap: IDLE_STACK_GAP },
  chipRow: { flexDirection: 'row', gap: 4 },
  chip: { flex: 1 },
  level: { position: 'absolute', top: -9, right: -4, minWidth: 22, paddingHorizontal: 5, height: 17, borderRadius: 9, backgroundColor: C.ink, borderWidth: 1.5, borderColor: '#fff', alignItems: 'center', justifyContent: 'center' },
  levelHot: { backgroundColor: C.tomato },
  levelText: { fontFamily: F.bold, fontSize: 10, color: '#fff' },
  all: { width: 46, height: SIDEWALK_ROW.cardHeight, backgroundColor: C.ink, borderRadius: 12, alignItems: 'center', justifyContent: 'center', ...shadow },
  // on an unmanaged shop "All" sits beside the manager button only, not stretched over both rows
  allIdle: { height: 44 },
  allIcon: { color: '#fff', fontSize: 16, lineHeight: 18 },
  allText: { color: '#fff', fontFamily: F.bold, fontSize: 12 },
});
