// The upgrade row standing on the sidewalk: four station buttons (or, on a shop with no manager, a chip row and the
// manager button) plus "All". Every control is drawn at 44 pt (see tap-targets.ts). Moved out of app/index.tsx (A15).
// Capped stations merge into one wider Expand card in their slots (sidewalk-model.ts `sidewalkSlots`). v5.22: every station card has the same look
// and says what the station handles, now and after the buy; no card is framed, tinted or bundled with another.
import type { ReactNode } from 'react';
import { Pressable, type StyleProp, StyleSheet, Text, useWindowDimensions, View, type ViewStyle } from 'react-native';

import { cityOf } from '../content/cities';
import type { NeighborhoodId } from '../content/types';
import { money } from '../engine/format';
import * as G from '../engine/game';
import { rewardsUnlocked } from '../engine/rewards';
import { useGame } from '../store/game-store';
import { C, F } from '../theme';
import { useCoachTarget, type CoachTargetId } from './coach/targets';
import { BuyButton, haptic } from './game-ui';
import { cardFonts, cardTextWidths, fitFont, iconWidth, MIN_FONT } from './endgame/fit-model';
import { DriverIcon, FlameIcon, PrepIcon, RegisterIcon } from './icons';
import {
  amountCard,
  amountLabel,
  type BuyAmount,
  cardLook,
  footLine,
  type MergedSlot,
  nextAmount,
  hireSidewalkLabel,
  sidewalkSlots,
  stationTitle,
  type StationKey,
  type StationView,
} from './sidewalk-model';
import { COMPACT_FONT_MAX_SCALE, IDLE_STACK_GAP, SIDEWALK_ROW, SIDEWALK_SLOP, STATION_CARD } from './tap-targets';

// static icon elements: built once, not per render (M24)
const ICON: Record<StationKey, React.ReactNode> = {
  prep: <PrepIcon size={11} />,
  ovens: <FlameIcon size={11} />,
  counter: <RegisterIcon size={11} />,
  drivers: <DriverIcon size={11} />,
};

/** D456: the amount is one 44 pt chip at the row's left end: a tap cycles x1 -> x10 -> MAX (a three-way toggle that takes no space over the street). */
function AmountChip({ amount, onPick }: { amount: BuyAmount; onPick: (a: BuyAmount) => void }) {
  return (
    <Pressable
      testID="buy-amount"
      accessibilityRole="button"
      accessibilityLabel={`Buy ${amount === 'max' ? 'as many as you can afford' : `${amount} at a time`}. Tap to change`}
      onPress={() => {
        haptic();
        onPick(nextAmount(amount));
      }}
      hitSlop={SIDEWALK_SLOP.amount}
      style={[styles.amountChip, amount !== 1 && styles.amountOn]}
    >
      <Text style={[styles.amountText, amount !== 1 && styles.amountTextOn]} maxFontSizeMultiplier={COMPACT_FONT_MAX_SCALE}>
        {amountLabel(amount)}
      </Text>
    </Pressable>
  );
}

/** A card that names itself to the Coach (`walk:<station>`): a view that measures itself, so the slot loop above needs no hook of its own. */
function Registered({ id, style, children }: { id: CoachTargetId; style: StyleProp<ViewStyle>; children: ReactNode }) {
  const t = useCoachTarget(id);
  return (
    <View ref={t} onLayout={t.onLayout} style={style}>
      {children}
    </View>
  );
}

export function SidewalkRow({
  game,
  id,
  idleShop,
  bottom,
  onBuy,
  onOpen,
  quiet = false,
}: {
  game: G.GameState;
  id: NeighborhoodId;
  /** The hire stack replaces the framed cards: `hireOnSidewalk` (sidewalk-model.ts). */ idleShop: boolean;
  bottom: number;
  onBuy: (what: G.Upgrade) => boolean;
  onOpen: () => void;
  /** D500: before the first roll the row steps back (faded, still tappable) so the hand on the prep table is the one cue. */ quiet?: boolean;
}) {
  // v5.15: the amount the player chose (not saved); a primitive, so the row repaints only when it changes
  const amount = useGame((s) => s.buyAmount);
  const allTarget = useCoachTarget('walk:all');
  const toggleOn = rewardsUnlocked(game);
  const picked: BuyAmount = toggleOn ? amount : 1;
  // the name always stays on top; the foot says what the station handles now and after the buy (sidewalk-model `footLine`)
  const station = (v: StationView, framed: boolean, textW: number) => {
    // ×10 / MAX: the card shows the total price and the levels gained, and a tap buys them all at once (sidewalk-model `buyPlan`)
    const many = amountCard(game, id, v, picked);
    // G102: the price, the title and the foot line each get the size the card's width allows (the icon takes 14 pt of the title's line, and goes when the card is too narrow for both)
    const foot = footLine(v, many, textW);
    const iconW = iconWidth(textW, stationTitle(v));
    const fonts = cardFonts(textW, { label: many?.label ?? v.label, sub: stationTitle(v), foot, iconW });
    const button = (
      <BuyButton
        compact
        testID={framed ? `walk-${v.key}` : `mini-${v.key}`}
        icon={iconW ? ICON[v.key] : undefined}
        sub={stationTitle(v)}
        foot={foot}
        labelSize={fonts.label}
        subSize={fonts.sub}
        footSize={fonts.foot}
        tone={v.tone}
        label={many?.label ?? v.label}
        enabled={many ? many.enabled : v.affordable}
        onPress={() => (many ? useGame.getState().buyStation(v.what) : onBuy(v.what))}
      />
    );
    const badge = (
      <View style={styles.level} pointerEvents="none">
        <Text style={styles.levelText} numberOfLines={1} maxFontSizeMultiplier={COMPACT_FONT_MAX_SCALE}>
          {v.badge}
        </Text>
      </View>
    );
    return framed ? (
      <Registered key={v.key} id={`walk:${v.key}`} style={[styles.card, look(many?.enabled ?? v.affordable)]}>
        {button}
        {badge}
      </Registered>
    ) : (
      // an unmanaged shop has no room for frames: the same button and badge, unframed (D315)
      <Registered key={v.key} id={`walk:${v.key}`} style={styles.chip}>
        {button}
        {badge}
      </Registered>
    );
  };
  // one card for the capped stations' slots (D407): the same card as the others, no level badge (it stands for several stations)
  const merged = (m: MergedSlot, framed: boolean, textW: number) => {
    const fonts = cardFonts(textW, { label: m.label, sub: m.title, foot: m.foot });
    const button = (
      <BuyButton
        compact
        testID="walk-expand"
        sub={m.title}
        label={m.label}
        foot={m.foot}
        labelSize={fonts.label}
        subSize={fonts.sub}
        footSize={fonts.foot}
        tone="expand"
        enabled={m.enabled}
        onPress={() => onBuy('expand')}
      />
    );
    return framed ? (
      <View key={m.kind} style={[styles.card, { flex: m.span }, look(m.enabled)]}>
        {button}
      </View>
    ) : (
      <View key={m.kind} style={[styles.chip, { flex: m.span }]}>
        {button}
      </View>
    );
  };
  const slots = sidewalkSlots(game, id);
  const { width: screenW } = useWindowDimensions();
  const cards = (framed: boolean) => {
    const widths = cardTextWidths(
      screenW,
      slots.map((sl) => sl.span),
      { chip: toggleOn, framed },
    );
    return slots.map((sl, i) => (sl.kind === 'station' ? station(sl.view, framed, widths[i]) : merged(sl, framed, widths[i])));
  };
  // the next hire: each head in turn, then the General Manager
  const hire = G.nextHire(game.shops[id]) ?? 'manager';
  const hireCost = G.upgradeCostOf(game, id, hire);
  // say what the hire does, in words and with no number (D341): "HIRE MARCO · TAKES THE PREP TABLE"
  const hireLabel = hireSidewalkLabel(hire, G.isHeadUpgrade(hire) ? cityOf(game).heads[id][G.headOf(hire)] : '');
  return (
    <>
      <View style={[styles.row, { bottom }, quiet && styles.quiet]} pointerEvents="box-none">
        {toggleOn && <AmountChip amount={picked} onPick={useGame.getState().setBuyAmount} />}
        {idleShop ? (
          <View style={styles.idleStack}>
            <View style={styles.chipRow}>{cards(false)}</View>
            {/* what you get on top, the price below (D310, D311) */}
            <BuyButton
              compact
              testID="walk-manager"
              subSize={fitFont(
                hireLabel,
                screenW -
                  2 * SIDEWALK_ROW.edge -
                  SIDEWALK_ROW.allWidth -
                  (toggleOn ? SIDEWALK_ROW.amountWidth : 0) -
                  SIDEWALK_ROW.gap * (toggleOn ? 2 : 1) -
                  24,
                10,
                MIN_FONT,
              )}
              sub={hireLabel}
              label={money(hireCost ?? 0)}
              enabled={hireCost !== null && !G.upgradeLock(game, id, hire) && G.canAfford(game, hireCost)}
              onPress={() => onBuy(hire)}
            />
          </View>
        ) : (
          cards(true)
        )}
        <Pressable
          ref={allTarget}
          onLayout={allTarget.onLayout}
          testID="open-upgrades"
          accessibilityRole="button"
          accessibilityLabel="All upgrades"
          onPress={onOpen}
          hitSlop={SIDEWALK_SLOP.all}
          style={[styles.all, idleShop && styles.allIdle]}
        >
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

/** D419: an affordable card is a 2 pt #3B1F14 outline on a solid face; a card you cannot buy keeps its 2.5 pt frame. The content box stays the same size. */
const look = (affordable: boolean) => {
  const l = cardLook(affordable);
  return {
    borderColor: l.borderColor,
    borderWidth: l.borderWidth,
    borderStyle: l.borderStyle,
    backgroundColor: l.backgroundColor,
    padding: STATION_CARD.padding + (STATION_CARD.border - l.borderWidth),
  } as const;
};

const shadow = { boxShadow: '0 4px 0 rgba(59,31,20,0.25)' } as object;
const styles = StyleSheet.create({
  row: { position: 'absolute', left: SIDEWALK_ROW.edge, right: SIDEWALK_ROW.edge, flexDirection: 'row', gap: SIDEWALK_ROW.gap, alignItems: 'flex-end' },
  quiet: { opacity: 0.5 },
  card: {
    flex: 1,
    height: SIDEWALK_ROW.cardHeight,
    backgroundColor: 'rgba(255,255,255,0.95)',
    borderRadius: 12,
    borderWidth: STATION_CARD.border,
    borderColor: C.ink,
    padding: STATION_CARD.padding,
    ...shadow,
  },
  idleStack: { flex: 4, gap: IDLE_STACK_GAP },
  chipRow: { flexDirection: 'row', gap: SIDEWALK_ROW.chipGap },
  chip: { flex: 1 },
  level: {
    position: 'absolute',
    top: -9,
    right: -4,
    minWidth: 22,
    paddingHorizontal: 5,
    height: 17,
    borderRadius: 9,
    backgroundColor: C.ink,
    borderWidth: 1.5,
    borderColor: '#fff',
    alignItems: 'center',
    justifyContent: 'center',
  },
  levelText: { fontFamily: F.bold, fontSize: 10, color: '#fff' },
  all: {
    width: SIDEWALK_ROW.allWidth,
    height: SIDEWALK_ROW.cardHeight,
    backgroundColor: C.ink,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
    ...shadow,
  },
  // on an unmanaged shop "All" sits beside the manager button only, not stretched over both rows
  allIdle: { height: 44 },
  allIcon: { color: '#fff', fontSize: 16, lineHeight: 18 },
  allText: { color: '#fff', fontFamily: F.bold, fontSize: 12 },
  // G102: 40 pt wide (the cards need the room; 4 pt more reach into the gap on its right, SIDEWALK_SLOP) and the row's full 55 pt tall
  amountChip: {
    width: SIDEWALK_ROW.amountWidth,
    height: SIDEWALK_ROW.cardHeight,
    borderRadius: 14,
    backgroundColor: C.ink,
    alignItems: 'center',
    justifyContent: 'center',
    ...shadow,
  },
  amountOn: { backgroundColor: C.basil },
  amountText: { fontFamily: F.bold, fontSize: 14, color: '#FFE7C2' },
  amountTextOn: { color: '#fff' },
});
