// The BANNERS slot's entry for the layers: a column under the endgame stack (layer-model.ts `layerTop`), with
//   a one-line notice: "Game Day! Fill every seat!" and "Boat in! All hands on deck!" while they run, "+$X from Game Day" after the rush,
//   "Pier 9 auction is live!" on opening and "MegaSlice raised its bid" / "Outbid!" at each raise
//   the rival's card: the offer (a Defend-style Start button, collapsing to a 44 pt badge), the running chip and how it ended.
// It also watches the layers for the audio lane: the final whistle (`gameday` on the pulse bus) when the rush begins.
import { memo, useEffect, useRef, useState, type ComponentRef } from 'react';
import { Animated, Pressable, StyleSheet, Text, View } from 'react-native';

import { ORDER_VIEW } from '../../content/hooks';
import { GAME_DAY } from '../../content/layers';
import { valuePerPizza, featureMults } from '../../engine/game';
import { gameDayView } from '../../engine/features/layers/suburbs-gameday';
import { boatsView } from '../../engine/features/layers/waterfront-boats';
import { challengeWon, rivalView } from '../../engine/features/layers/rival';
import { useGame } from '../../store/game-store';
import { C, F } from '../../theme';
import { attackLite } from '../endgame/attack-model';
import { useBannerOpen } from '../endgame/banner-state';
import { eventBannerView, eventViewNow } from '../endgame/event-model';
import { STACK } from '../endgame/stack-model';
import { haptic } from '../game-ui';
import { chipPhase } from '../order-model';
import { Portrait } from '../portrait';
import { emitCheer, emitCoin, emitGameDay, emitPayout } from '../pulse-bus';
import { TAP } from '../tap-targets';
import { layerTop, pct5, ROWS } from './layer-model';
import { gameDayBanner, gameDayPopText } from './suburbs/gameday-model';
import { auctionStatus, boatBanner, raiseNotice } from './waterfront/boats-model';
import { RESULT_MS, rivalCard, rivalLite, type RivalCardModel } from './rival/rival-model';
import { lc } from './layer-text';

const NOTICE_MS = 3600;
const AUCTION_OPEN_MS = 8000;

// ---------- the notice line ----------

interface Notice {
  text: string;
  good: boolean;
}

/** Watches the layers for the moments worth a notice or a pulse: the rush starting and ending, the auction opening and its raises. */
function useTransientNotice(): Notice | null {
  const [notice, setNotice] = useState<Notice | null>(null);
  const timer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const show = (n: Notice, ms: number) => {
    setNotice(n);
    if (timer.current) clearTimeout(timer.current);
    timer.current = setTimeout(() => setNotice(null), ms);
  };
  const rush = useGame((s) => gameDayView(s.game, Date.now()).rush);
  const live = useGame((s) => auctionStatus(s.game).live);
  const price = useGame((s) => auctionStatus(s.game).price);
  const sold0 = useRef<number | null>(null);
  const wasRush = useRef(false);
  const wasLive = useRef(false);
  const lastPrice = useRef(price);

  useEffect(() => {
    const g = useGame.getState().game;
    if (rush && !wasRush.current) {
      sold0.current = g.shops[GAME_DAY.hood].sold;
      emitGameDay();
    }
    if (!rush && wasRush.current && sold0.current !== null) {
      const shop = g.shops[GAME_DAY.hood];
      const text = gameDayPopText(sold0.current, shop.sold, valuePerPizza(GAME_DAY.hood, shop, g.vehicle, featureMults(g, GAME_DAY.hood, Date.now())));
      sold0.current = null;
      show({ text, good: true }, NOTICE_MS);
      emitPayout();
    }
    wasRush.current = rush;
    // eslint-disable-next-line react-hooks/exhaustive-deps -- `show` only sets state
  }, [rush]);

  useEffect(() => {
    if (live && !wasLive.current) show({ text: lc('layer.waterfront.auction.banner'), good: false }, AUCTION_OPEN_MS);
    wasLive.current = live;
    // eslint-disable-next-line react-hooks/exhaustive-deps -- `show` only sets state
  }, [live]);

  useEffect(() => {
    const before = lastPrice.current;
    lastPrice.current = price;
    if (!live || before <= 0) return;
    const text = raiseNotice(before, price, useGame.getState().game.cash);
    if (text) show({ text, good: false }, NOTICE_MS);
    // eslint-disable-next-line react-hooks/exhaustive-deps -- `show` only sets state
  }, [price, live]);

  useEffect(() => () => {
    if (timer.current) clearTimeout(timer.current);
  }, []);
  return notice;
}

const NoticeLine = memo(function NoticeLine({ text, good }: { text: string; good: boolean }) {
  if (!text) return null;
  return (
    <View testID="layer-notice" accessibilityLabel={text} style={[styles.notice, good && styles.noticeGood]} pointerEvents="none">
      <Text style={styles.noticeText} numberOfLines={1} maxFontSizeMultiplier={1.15}>
        {text}
      </Text>
    </View>
  );
});

// ---------- the rival's card ----------
// D480: the offer is no longer a card over the roof: the "-20% sales" chip in the HUD opens the rival's sheet, which has Todd's line and the
// Start button. Only a running challenge and how it ended stand in the column, one compact row each.

/** Which of the column's pieces are up: the golden pizza waits while any is (G105), so it never flies over their words. */
const holds = new Set<string>();
function useHold(key: string, on: boolean) {
  useEffect(() => {
    if (on) holds.add(key);
    else holds.delete(key);
    useGame.getState().setLayerHold(holds.size > 0);
    return () => {
      holds.delete(key);
      useGame.getState().setLayerHold(holds.size > 0);
    };
  }, [key, on]);
}

const RivalCard = memo(function RivalCard() {
  // Reads the live store below (like the order chip): React Compiler must not cache that.
  'use no memo';
  const hood = useGame((s) => s.game.active);
  // the face and what changes under a running chip (whole seconds left, the pies bar's 5% step), in one string
  const key = useGame((s) => rivalLite(rivalView(s.game, s.game.active, Date.now())));
  const phase = key.split('|')[1];
  const [result, setResult] = useState<{ kind: 'won' | 'lost'; hood: typeof hood } | null>(null);
  const prev = useRef({ phase, hood });
  const [flash] = useState(() => new Animated.Value(0));
  const root = useRef<ComponentRef<typeof View>>(null);

  useEffect(() => {
    const p = prev.current;
    prev.current = { phase, hood };
    if (p.hood === hood && p.phase === 'running' && phase !== 'running') {
      setResult({ kind: challengeWon(useGame.getState().game, hood) ? 'won' : 'lost', hood });
    }
  }, [phase, hood]);
  useEffect(() => {
    if (!result) return;
    const t = setTimeout(() => setResult(null), RESULT_MS);
    return () => clearTimeout(t);
  }, [result]);
  useEffect(() => {
    if (result?.kind !== 'won') return;
    flash.setValue(0);
    const run = Animated.sequence([0, 1, 0, 1, 0].map((to) => Animated.timing(flash, { toValue: to, duration: 220, useNativeDriver: true })));
    run.start();
    haptic('success');
    root.current?.measureInWindow((x: number, y: number, _w: number, h: number) => {
      for (let i = 0; i < ORDER_VIEW.coins; i++) emitCoin({ x: x + 30, y: y + h / 2, ms: 420 + i * 90 });
      emitPayout();
      emitCheer();
    });
    return () => run.stop();
  }, [result, flash]);

  const g = useGame.getState().game;
  const shown = result && result.hood === hood ? result.kind : null;
  const m: RivalCardModel = rivalCard(rivalView(g, hood, Date.now()), hood, shown);
  const up = m.face === 'running' || m.face === 'won' || m.face === 'lost';
  useHold('rival', up);
  if (!up) return null;
  if (m.face === 'running') {
    return (
      <View testID="rival-chip" style={styles.card}>
        <Pressable testID="rival-active" accessibilityRole="button" accessibilityLabel={`${m.title}: ${m.progress}. Show the shop`} style={styles.row} onPress={() => { haptic(); useGame.getState().setActive(hood); }}>
          <Portrait id={m.who} mood="angry" size={34} />
          <View style={styles.mid}>
            <Text testID="rival-progress" style={styles.progress} numberOfLines={1}>
              {m.progress}
              {m.behind ? <Text testID="rival-rush" style={styles.rush}>{'  tap to rush!'}</Text> : null}
            </Text>
            <View style={styles.track}>
              <View style={[styles.fill, { width: `${pct5(m.fillStep)}%` }]} />
            </View>
          </View>
          <View style={styles.right}>
            <Text testID="rival-clock" style={[styles.clock, m.urgent && styles.clockUrgent]}>{m.clock}</Text>
          </View>
        </Pressable>
        <View testID="rival-drain" pointerEvents="none" style={[styles.drain, { width: `${pct5(m.drainStep)}%` }]} />
      </View>
    );
  }
  const won = m.face === 'won';
  return (
    <Animated.View ref={root} testID={`rival-${m.face}`} style={[styles.card, won ? styles.cardWon : styles.cardLost]}>
      {won && <Animated.View pointerEvents="none" style={[styles.glow, { opacity: flash }]} />}
      <Pressable accessibilityRole="button" accessibilityLabel={`${m.speaker}: ${m.line}. Dismiss`} style={styles.row} onPress={() => setResult(null)}>
        <Portrait id={m.who} mood={won ? 'happy' : 'sad'} size={34} />
        <View style={styles.mid}>
          <Text testID="rival-line" style={styles.line} numberOfLines={3} maxFontSizeMultiplier={1.1}>{`${m.speaker}: ${m.line}`}</Text>
        </View>
      </Pressable>
    </Animated.View>
  );
});

// ---------- the column ----------

export const LayerStack = memo(function LayerStack() {
  const bannerOpen = useBannerOpen();
  const top = useGame((s) => layerTop({
    orderUp: chipPhase(s.game) !== 'none',
    eventUp: !!eventBannerView(eventViewNow(Date.now(), s.game)),
    attack: attackLite(s.game).face,
    collapsed: !bannerOpen,
  }));
  const base = useGame((s) => {
    const g = s.game;
    return gameDayBanner(gameDayView(g, Date.now())) || boatBanner(boatsView(g, Date.now()));
  });
  const transient = useTransientNotice();
  const text = transient?.text ?? base;
  useHold('notice', !!text);
  return (
    <View testID="layer-stack" pointerEvents="box-none" style={[styles.stack, { top }]}>
      <NoticeLine text={text} good={!!transient?.good} />
      <RivalCard />
    </View>
  );
});

const styles = StyleSheet.create({
  stack: { position: 'absolute', left: ORDER_VIEW.side, right: ORDER_VIEW.side, gap: STACK.gap },
  notice: { height: ROWS.notice, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', paddingHorizontal: 12, borderRadius: 15, backgroundColor: C.cheese, borderWidth: 2, borderColor: C.cheeseDark, boxShadow: '0 2px 0 rgba(59,31,20,0.25)' } as object,
  noticeGood: { backgroundColor: '#CDEFC9', borderColor: C.basilDark },
  noticeText: { fontFamily: F.bold, fontSize: 13, color: C.ink },
  card: { minHeight: ROWS.rival, maxHeight: 64, backgroundColor: '#FFF4DC', borderWidth: 2, borderColor: '#5A2E1A', borderRadius: 16, paddingLeft: 8, paddingRight: 4, justifyContent: 'center', overflow: 'hidden', boxShadow: '0 3px 0 rgba(59,31,20,0.25)' } as object,
  cardWon: { backgroundColor: '#FFD04A', borderColor: C.cheeseDark },
  cardLost: { backgroundColor: '#EFE6D8', borderColor: C.inkSoft },
  row: { flexDirection: 'row', alignItems: 'center', gap: 8, minHeight: TAP.min },
  mid: { flex: 1, justifyContent: 'center' },
  line: { fontFamily: F.semi, fontSize: 11.5, lineHeight: 13, color: C.ink },
  progress: { fontFamily: F.bold, fontSize: 14, lineHeight: 16, color: C.ink },
  track: { height: 8, borderRadius: 4, backgroundColor: '#E2D3BC', overflow: 'hidden', marginTop: 2 },
  fill: { height: 8, borderRadius: 4, backgroundColor: C.basil },
  right: { alignItems: 'flex-end', minWidth: 52, paddingRight: 6 },
  clock: { fontFamily: F.bold, fontSize: 17, color: C.ink },
  clockUrgent: { color: C.tomato },
  rush: { fontFamily: F.bold, fontSize: 11, lineHeight: 13, color: C.tomato },
  drain: { position: 'absolute', left: 0, bottom: 0, height: 4, backgroundColor: C.tomato },
  glow: { position: 'absolute', left: 0, right: 0, top: 0, bottom: 0, backgroundColor: '#FFF6C2' },
});
