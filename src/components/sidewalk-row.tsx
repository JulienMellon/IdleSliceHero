// The upgrade row standing on the sidewalk: four station buttons (or, on a shop with no manager, a chip row and the
// manager button) plus "All". Every control is drawn at 44 pt (see tap-targets.ts). Moved out of app/index.tsx (A15).
// Tied stations and capped stations merge into one wider card in their slots (sidewalk-model.ts `sidewalkSlots`).
import { Pressable, StyleSheet, Text, View } from 'react-native';

import { HEAD_ROLE, HEADS } from '../content/tuning';
import type { NeighborhoodId } from '../content/types';
import { money } from '../engine/format';
import * as G from '../engine/game';
import { rewardsUnlocked } from '../engine/rewards';
import { useGame } from '../store/game-store';
import { C, F } from '../theme';
import { BuyButton, haptic } from './game-ui';
import { DriverIcon, FlameIcon, PrepIcon, RegisterIcon } from './icons';
import { amountCard, amountLabel, BUY_AMOUNTS, type BuyAmount, cardLook, type MergedSlot, needLine, sidewalkSlots, stationTitle, type StationKey, type StationView } from './sidewalk-model';
import { COMPACT_FONT_MAX_SCALE, IDLE_STACK_GAP, SIDEWALK_ROW, STATION_CARD, TAP } from './tap-targets';

// static icon elements: built once, not per render (M24)
const ICON: Record<StationKey, React.ReactNode> = {
  prep: <PrepIcon size={11} />,
  ovens: <FlameIcon size={11} />,
  counter: <RegisterIcon size={11} />,
  drivers: <DriverIcon size={11} />,
};

/** v5.15: ×1 / ×10 / MAX. Three segments, each drawn 44 pt tall (never a hitSlop); MAX is a little wider for its three letters. */
function AmountToggle({ amount, onPick, bottom }: { amount: BuyAmount; onPick: (a: BuyAmount) => void; bottom: number }) {
  return (
    <View style={[styles.amounts, { bottom }]} testID="buy-amounts" accessibilityRole="radiogroup">
      {BUY_AMOUNTS.map((a) => (
        <Pressable key={String(a)} testID={`buy-amount-${a}`} accessibilityRole="radio" accessibilityState={{ selected: amount === a }} accessibilityLabel={a === 'max' ? 'Buy as many as you can afford' : `Buy ${a} at a time`} onPress={() => { haptic(); onPick(a); }} style={[styles.amountSeg, a === 'max' && styles.amountSegMax, amount === a && styles.amountOn]}>
          <Text style={[styles.amountText, amount === a && styles.amountTextOn]} maxFontSizeMultiplier={COMPACT_FONT_MAX_SCALE}>
            {amountLabel(a)}
          </Text>
        </Pressable>
      ))}
    </View>
  );
}

export function SidewalkRow({ game, id, idleShop, bottom, onBuy, onOpen, highlight = null, bundle = null, onBundle }: { game: G.GameState; id: NeighborhoodId; /** The hire stack replaces the framed cards: `hireOnSidewalk` (sidewalk-model.ts). */ idleShop: boolean; bottom: number; onBuy: (what: G.Upgrade) => boolean; onOpen: () => void; highlight?: StationKey | null; /** The tied stations' bundle: their cards merge into one "Buy both" card; null keeps them apart. */ bundle?: G.BundleHint | null; onBundle?: () => boolean }) {
  // v5.15: the amount the player chose (not saved); a primitive, so the row repaints only when it changes
  const amount = useGame((s) => s.buyAmount);
  const toggleOn = rewardsUnlocked(game);
  const picked: BuyAmount = toggleOn ? amount : 1;
  // the name always stays on top; a player who has some cash but not enough sees "need $X" under the muted price (D359, D402)
  const station = (v: StationView, framed: boolean) => {
    // ×10 / MAX: the card shows the total price and the levels gained, and a tap buys them all at once (sidewalk-model `buyPlan`)
    const many = amountCard(game, id, v, picked);
    const button = (
      <BuyButton compact testID={framed ? `walk-${v.key}` : `mini-${v.key}`} icon={ICON[v.key]} sub={stationTitle(v)} need={many ? null : needLine(v, framed)} foot={many?.foot} tone={v.tone} label={many?.label ?? v.label} enabled={many ? many.enabled : v.affordable} saving={framed && v.frame === 'waiting'} progress={v.progress} onPress={() => (many ? useGame.getState().buyStation(v.what) : onBuy(v.what))} />
    );
    const badge = (
      <View style={[styles.level, v.frame === 'hot' && styles.levelHot]} pointerEvents="none">
        <Text style={styles.levelText} numberOfLines={1} maxFontSizeMultiplier={COMPACT_FONT_MAX_SCALE}>
          {v.badge}
        </Text>
      </View>
    );
    return framed ? (
      <View key={v.key} style={[styles.card, look(v.frame, v.affordable), highlight === v.key && styles.cardCoach]}>
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
  // one card for several slots (D405, D407): the same frame as a bottleneck card, no level badge (it stands for several stations)
  const merged = (m: MergedSlot, framed: boolean) => {
    const button = (
      <BuyButton compact testID={m.kind === 'bundle' ? 'walk-bundle' : 'walk-expand'} sub={m.title} label={m.label} foot={m.foot} tone={m.kind === 'expand' ? 'expand' : 'normal'} enabled={m.enabled} onPress={() => (m.kind === 'bundle' ? onBundle?.() ?? false : onBuy('expand'))} />
    );
    return framed ? (
      <View key={m.kind} style={[styles.card, { flex: m.span }, look(m.frame, m.enabled)]}>
        {button}
      </View>
    ) : (
      <View key={m.kind} style={[styles.chip, { flex: m.span }]}>
        {button}
      </View>
    );
  };
  const slots = sidewalkSlots(game, id, bundle);
  const cards = (framed: boolean) => slots.map((sl) => (sl.kind === 'station' ? station(sl.view, framed) : merged(sl, framed)));
  // the next hire: each head in turn, then the General Manager
  const hire = G.nextHire(game.shops[id]) ?? 'manager';
  const hireCost = G.upgradeCostOf(game, id, hire);
  // say what the hire does, not just who (D341)
  const hireLabel = G.isHeadUpgrade(hire) ? `HIRE ${HEADS[id][G.headOf(hire)].toUpperCase()} · RUNS ${HEAD_ROLE[G.headOf(hire)].toUpperCase()} FOR YOU` : `HIRE A MANAGER · ×2 INCOME + EARNS AWAY`;
  return (
    <>
    {toggleOn && <AmountToggle amount={picked} onPick={useGame.getState().setBuyAmount} bottom={bottom + (idleShop ? SIDEWALK_ROW.idleStackHeight : SIDEWALK_ROW.cardHeight) + AMOUNTS_GAP} />}
    <View style={[styles.row, { bottom }]} pointerEvents="box-none">
      {idleShop ? (
        <View style={styles.idleStack}>
          <View style={styles.chipRow}>{cards(false)}</View>
          {/* what you get on top, the price below (D310, D311) */}
          <BuyButton compact testID="walk-manager" sub={hireLabel} label={money(hireCost ?? 0)} enabled={hireCost !== null && !G.upgradeLock(game, id, hire) && game.cash >= hireCost} onPress={() => onBuy(hire)} />
        </View>
      ) : (
        cards(true)
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
    </>
  );
}

/** D419: an affordable card is a 2 pt #3B1F14 outline on a solid face; a quiet or saving card keeps its 2.5 pt frame. The content box stays the same size. */
const look = (frame: 'hot' | 'waiting' | null, affordable: boolean) => {
  const l = cardLook(frame, affordable);
  return { borderColor: l.borderColor, borderWidth: l.borderWidth, borderStyle: l.borderStyle, backgroundColor: l.backgroundColor, padding: STATION_CARD.padding + (STATION_CARD.border - l.borderWidth) } as const;
};

/** The toggle floats this far above the row (pt). */
const AMOUNTS_GAP = 6;
const shadow = { boxShadow: '0 4px 0 rgba(59,31,20,0.25)' } as object;
const styles = StyleSheet.create({
  row: { position: 'absolute', left: 8, right: 8, flexDirection: 'row', gap: 5, alignItems: 'flex-end' },
  card: { flex: 1, height: SIDEWALK_ROW.cardHeight, backgroundColor: 'rgba(255,255,255,0.95)', borderRadius: 12, borderWidth: STATION_CARD.border, borderColor: C.ink, padding: STATION_CARD.padding, ...shadow },
  // Nonna's tutorial points here: a gold frame
  cardCoach: { borderColor: '#FFC531', borderWidth: 4, borderStyle: 'solid' },
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
  amounts: { position: 'absolute', right: 8, flexDirection: 'row', height: TAP.min, borderRadius: 14, overflow: 'hidden', backgroundColor: C.ink, ...shadow },
  amountSeg: { width: TAP.min, height: TAP.min, alignItems: 'center', justifyContent: 'center' },
  amountSegMax: { width: 52 },
  amountOn: { backgroundColor: C.basil },
  amountText: { fontFamily: F.bold, fontSize: 14, color: '#FFE7C2' },
  amountTextOn: { color: '#fff' },
});
