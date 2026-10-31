// The upgrade row standing on the sidewalk: four station buttons (or, on a shop with no manager, a chip row and the
// manager button) plus "All". Every control is drawn at 44 pt (see tap-targets.ts). Moved out of app/index.tsx (A15).
import { Pressable, StyleSheet, Text, View } from 'react-native';

import { HEAD_ROLE, HEADS } from '../content/tuning';
import type { NeighborhoodId } from '../content/types';
import { money } from '../engine/format';
import * as G from '../engine/game';
import { C, F } from '../theme';
import { BuyButton } from './game-ui';
import { DriverIcon, FlameIcon, PrepIcon, RegisterIcon } from './icons';
import { stationViews, type StationKey, type StationView } from './sidewalk-model';
import { COMPACT_FONT_MAX_SCALE, IDLE_STACK_GAP, SIDEWALK_ROW, STATION_CARD } from './tap-targets';

// static icon elements: built once, not per render (M24)
const ICON: Record<StationKey, React.ReactNode> = {
  prep: <PrepIcon size={11} />,
  ovens: <FlameIcon size={11} />,
  counter: <RegisterIcon size={11} />,
  drivers: <DriverIcon size={11} />,
};

export function SidewalkRow({ game, id, idleShop, bottom, onBuy, onOpen, highlight = null }: { game: G.GameState; id: NeighborhoodId; idleShop: boolean; bottom: number; onBuy: (what: G.Upgrade) => boolean; onOpen: () => void; highlight?: StationKey | null }) {
  // a station the player can't afford yet shows its price muted, with "need $X" in place of its name (D359; the icon stays)
  const station = (v: StationView, framed: boolean) => {
    const button = (
      <BuyButton compact testID={framed ? `walk-${v.key}` : `mini-${v.key}`} icon={ICON[v.key]} sub={v.need ?? v.name} tone={v.tone} label={v.label} enabled={v.affordable} saving={framed && v.frame === 'waiting'} progress={v.progress} onPress={() => onBuy(v.what)} />
    );
    const badge = (
      <View style={[styles.level, v.frame === 'hot' && styles.levelHot]} pointerEvents="none">
        <Text style={styles.levelText} numberOfLines={1} maxFontSizeMultiplier={COMPACT_FONT_MAX_SCALE}>
          {v.level}
        </Text>
      </View>
    );
    return framed ? (
      <View key={v.key} style={[styles.card, v.frame === 'hot' && styles.cardHot, v.frame === 'waiting' && styles.cardWaiting, highlight === v.key && styles.cardCoach]}>
        {button}
        {badge}
      </View>
    ) : (
      // an unmanaged shop has no room for frames: the same button and badge, unframed (D315)
      <View key={v.key} style={styles.chip}>
        {button}
        {badge}
      </View>
    );
  };
  const views = stationViews(game, id);
  // the next hire: each head in turn, then the General Manager
  const hire = G.nextHire(game.shops[id]) ?? 'manager';
  const hireCost = G.upgradeCostOf(game, id, hire);
  // say what the hire does, not just who (D341)
  const hireLabel = G.isHeadUpgrade(hire) ? `HIRE ${HEADS[id][G.headOf(hire)].toUpperCase()} · RUNS ${HEAD_ROLE[G.headOf(hire)].toUpperCase()} FOR YOU` : `HIRE A MANAGER · ×2 INCOME + EARNS AWAY`;
  return (
    <View style={[styles.row, { bottom }]} pointerEvents="box-none">
      {idleShop ? (
        <View style={styles.idleStack}>
          <View style={styles.chipRow}>{views.map((v) => station(v, false))}</View>
          {/* what you get on top, the price below (D310, D311) */}
          <BuyButton compact testID="walk-manager" sub={hireLabel} label={money(hireCost ?? 0)} enabled={hireCost !== null && !G.upgradeLock(game, id, hire) && game.cash >= hireCost} onPress={() => onBuy(hire)} />
        </View>
      ) : (
        views.map((v) => station(v, true))
      )}
      <Pressable testID="open-upgrades" onPress={onOpen} style={[styles.all, idleShop && styles.allIdle]}>
        <Text style={styles.allIcon} maxFontSizeMultiplier={COMPACT_FONT_MAX_SCALE}>
          ☰
        </Text>
        <Text style={styles.allText} maxFontSizeMultiplier={COMPACT_FONT_MAX_SCALE}>
          All
        </Text>
      </Pressable>
    </View>
  );
}

const shadow = { boxShadow: '0 4px 0 rgba(59,31,20,0.25)' } as object;
const styles = StyleSheet.create({
  row: { position: 'absolute', left: 8, right: 8, flexDirection: 'row', gap: 5, alignItems: 'flex-end' },
  card: { flex: 1, height: SIDEWALK_ROW.cardHeight, backgroundColor: 'rgba(255,255,255,0.95)', borderRadius: 12, borderWidth: STATION_CARD.border, borderColor: C.ink, padding: STATION_CARD.padding, ...shadow },
  cardHot: { borderColor: C.tomato, backgroundColor: '#FFF4F0' },
  // Nonna's tutorial points here: a gold frame
  cardCoach: { borderColor: '#FFC531', borderWidth: 4, borderStyle: 'solid' },
  // saving for it: a basil dashed outline that matches the pale basil face inside (D330; was pink)
  cardWaiting: { borderColor: 'rgba(46,125,62,0.6)', borderStyle: 'dashed' },
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
