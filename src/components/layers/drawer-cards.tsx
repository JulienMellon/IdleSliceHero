// The Waterfront's drawer cards (DRAWER_CARDS slot): the warming rack's next tier, and while the Pier 9 auction is live its bid card
// (the current price, "MegaSlice raised it" with the time to the next raise, and the cap). Each repaints when its own text changes.
import { memo } from 'react';
import { StyleSheet, Text, View } from 'react-native';

import { money } from '../../engine/format';
import { boatsView } from '../../engine/features/layers/waterfront-boats';
import { useGame } from '../../store/game-store';
import { C, F } from '../../theme';
import { BuyButton } from '../game-ui';
import { StationCard } from '../shop-ui';
import { buttonTone } from '../sidewalk-model';
import { auctionCard, auctionStatus, rackCard } from './waterfront/boats-model';
import { LABELS } from './layer-text';

/** The warming rack's card: the tier it holds, what the next one holds and costs. Shown once the Waterfront shop is built. */
export const RackCardSlot = memo(function RackCardSlot() {
  // "tier|price": the card repaints on a purchase or a price change, never on a game tick
  const key = useGame((s) => {
    const v = boatsView(s.game, Date.now());
    return v.active ? `${v.rackTier}|${v.rackPrice ?? ''}|${s.game.cash >= (v.rackPrice ?? Infinity) ? 1 : 0}` : '';
  });
  if (!key) return null;
  const v = boatsView(useGame.getState().game, Date.now());
  const c = rackCard(v);
  const canBuy = key.endsWith('|1');
  return (
    <StationCard
      testID="buy-rack"
      icon="🍕"
      title={c.title}
      detail={c.detail}
      cost={c.cost}
      costLabel={c.costLabel}
      canBuy={canBuy}
      wide
      tone={buttonTone({ lock: c.cost === null, gain: 1 })}
      onBuy={() => useGame.getState().buyRack()}
    />
  );
});

/** The Pier 9 bid card, while the auction is live. */
export const AuctionCardSlot = memo(function AuctionCardSlot() {
  // "price|raises|nextIn|can": changes at each raise, each second of the raise clock, and when the cash crosses the price
  const key = useGame((s) => {
    const a = auctionStatus(s.game);
    return a.live ? `${a.price}|${a.raises}|${a.nextIn}|${s.game.cash >= a.price ? 1 : 0}` : '';
  });
  if (!key) return null;
  const g = useGame.getState().game;
  const c = auctionCard(auctionStatus(g), g.cash);
  return (
    <View testID="auction-card" style={styles.card}>
      <View style={styles.head}>
        <Text style={styles.title}>{c.title}</Text>
        {c.raised ? <Text testID="auction-raised" style={styles.raised} numberOfLines={2}>{c.raised}</Text> : null}
        <Text testID="auction-meta" style={styles.meta} numberOfLines={1}>{[c.next, c.cap].filter(Boolean).join(' · ')}</Text>
      </View>
      <View style={styles.buy}>
        <BuyButton compact testID="bid-pier9" tone={buttonTone({ lock: false, gain: 1 })} label={money(c.price)} sub={LABELS.bid} enabled={c.canBuy} onPress={() => useGame.getState().bidPier9()} />
      </View>
    </View>
  );
});

const styles = StyleSheet.create({
  card: { width: '100%', flexDirection: 'row', alignItems: 'center', gap: 8, backgroundColor: '#FFF4F0', borderRadius: 16, borderWidth: 2.5, borderColor: C.tomato, padding: 6 },
  head: { flex: 1, gap: 1 },
  title: { fontFamily: F.bold, fontSize: 14, color: C.ink },
  raised: { fontFamily: F.semi, fontSize: 12, lineHeight: 14, color: C.tomatoDark },
  meta: { fontFamily: F.regular, fontSize: 11.5, color: C.inkSoft },
  buy: { width: 96 },
});
