// Neighborhood tabs and the compact upgrade cards under the pizzeria cutaway.
import { type ReactNode, useEffect, useRef, useState } from 'react';
import { Platform, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';

import { emitAudio } from '../audio/bus';
import { NEIGHBORHOODS } from '../content/tuning';
import type { NeighborhoodId } from '../content/types';
import { money } from '../engine/format';
import * as Game from '../engine/game';
import { C, F } from '../theme';
import { LockIcon } from './icons';
import { buildChipHint } from './sidewalk-model';
import Svg, { Defs, LinearGradient, Rect, Stop } from 'react-native-svg';
import { BuyButton, haptic } from './game-ui';

export function ShopTabs({ game, boostMult = 1, onSelect, onBuild }: { game: Game.GameState; /** The running income boost: the chips show what the shop earns now. */ boostMult?: number; onSelect: (id: NeighborhoodId) => void; onBuild: (id: NeighborhoodId) => boolean }) {
  const next = Game.nextToBuild(game);
  const scroller = useRef<{ scrollTo: (o: { x: number; animated: boolean }) => void } | null>(null);
  const activeIdx = NEIGHBORHOODS.findIndex((n) => n.id === game.active);
  // Keep the active pizzeria's tab in view, snapped so the strip always starts on a tab edge.
  const xs = useRef<number[]>([]);
  const [offsets, setOffsets] = useState<number[]>([]);
  const onTab = (i: number) => (e: { nativeEvent: { layout: { x: number } } }) => {
    xs.current[i] = e.nativeEvent.layout.x;
    if (xs.current.filter((v) => v !== undefined).length === NEIGHBORHOODS.length) setOffsets(xs.current.map((x, i) => (i === 0 ? 0 : x - 6)));
  };
  const [dims, setDims] = useState({ content: 0, view: 0 });
  const [sx, setSx] = useState(0);
  const maxScroll = Math.max(0, dims.content - dims.view);
  // only snap to offsets the strip can actually reach, so the end clamp never leaves a sliver
  const reachable = offsets.filter((o) => o <= maxScroll + 0.5);
  useEffect(() => {
    const want = offsets[Math.max(0, activeIdx - 1)] ?? 0;
    const x = reachable.filter((o) => o <= want).pop() ?? 0;
    scroller.current?.scrollTo({ x, animated: true });
  }, [activeIdx, offsets, maxScroll]);
  return (
    <View style={styles.tabsWrap}>
      <ScrollView ref={scroller as never} horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.tabs} snapToOffsets={reachable.length ? reachable : undefined} decelerationRate="fast" scrollEventThrottle={32} onScroll={(e) => setSx(e.nativeEvent.contentOffset.x)} onLayout={(e) => setDims((d) => ({ ...d, view: e.nativeEvent.layout.width }))} onContentSizeChange={(w) => setDims((d) => ({ ...d, content: w }))}>
        {NEIGHBORHOODS.map((n, i) => {
          const shop = game.shops[n.id];
          const active = game.active === n.id;
          if (!shop.built && next?.id !== n.id) {
            return (
              <View key={n.id} onLayout={onTab(i)} style={[styles.tab, styles.tabLocked]}>
                <LockIcon size={16} />
              </View>
            );
          }
          if (!shop.built) {
            const can = game.cash >= n.buildCost;
            // while the Pier 9 bid is on offer, building spends the cash saved for it: say so under the price
            const warn = buildChipHint(game);
            return (
              <Pressable
                key={n.id}
                onLayout={onTab(i)}
                testID={`build-${n.id}`}
                onPress={() => {
                  const ok = onBuild(n.id);
                  haptic(ok ? 'success' : 'error');
                }}
                style={[styles.tab, styles.tabBuild, can && styles.tabBuildReady, warn && styles.tabBuildWarn]}>
                <Text style={[styles.tabName, warn && styles.tabTight, { color: can ? '#fff' : C.ink }]}>+ {n.name}</Text>
                <Text style={[styles.tabSub, warn && styles.tabTight, { color: can ? '#fff' : C.tomato }]}>Build {money(n.buildCost)}</Text>
                {warn ? (
                  <Text style={[styles.tabWarn, can && styles.tabWarnOnGreen]} numberOfLines={1}>
                    {warn}
                  </Text>
                ) : null}
              </Pressable>
            );
          }
          const eps = Game.shopEarnings(game, n.id) * boostMult;
          return (
            <Pressable key={n.id} onLayout={onTab(i)} testID={`tab-${n.id}`} onPress={() => {
                if (!active) emitAudio({ type: 'click' });
                onSelect(n.id);
              }} style={[styles.tab, { borderColor: n.color }, active && styles.tabActive]}>
              <Text style={styles.tabName}>{n.name}</Text>
              <Text style={[styles.tabSub, active && { color: C.ink }, !shop.managed && !active && { color: C.tomato }]}>{shop.managed ? `${money(eps)}/s` : 'you run it'}</Text>
            </Pressable>
          );
        })}
      </ScrollView>
      {/* edge fades so a clipped tab reads as "scroll for more" */}
      {/* hide each fade when the strip is already at that end */}
      {(['l', 'r'] as const).filter((side) => (side === 'l' ? sx > 2 : sx < maxScroll - 2)).map((side) => (
        <Svg key={side} width={30} height="100%" style={[styles.tabFade, side === 'l' ? { left: 0 } : { right: 0 }]} viewBox="0 0 30 10" preserveAspectRatio="none" pointerEvents="none">
          <Defs>
            <LinearGradient id={`tf-${side}`} x1={side === 'l' ? '0' : '1'} y1="0" x2={side === 'l' ? '1' : '0'} y2="0">
              <Stop offset="0" stopColor="#B52C1C" stopOpacity={1} />
              <Stop offset="0.3" stopColor="#B52C1C" stopOpacity={0.95} />
              <Stop offset="1" stopColor="#B52C1C" stopOpacity={0} />
            </LinearGradient>
          </Defs>
          <Rect x={0} y={0} width={30} height={10} fill={`url(#tf-${side})`} />
        </Svg>
      ))}
    </View>
  );
}

export function StationCard(props: {
  icon: ReactNode;
  title: string;
  level?: string;
  detail: string;
  cost: number | null;
  costLabel?: string;
  canBuy: boolean;
  hot?: boolean;
  /** Opened from its sidewalk card: highlight in cheese yellow (distinct from the red bottleneck). */
  onBuy: () => boolean | void;
  testID?: string;
  wide?: boolean;
  muted?: boolean;
  /** Button tone from `buttonTone` (sidewalk-model.ts): `nogain` draws the flat "no gain now" look. */
  tone: 'normal' | 'neutral' | 'nogain';
}) {
  return (
    <View style={[styles.card, props.wide && styles.cardWide, props.hot && styles.cardHot, props.muted && styles.cardMuted]}>
      <View style={styles.cardHead}>
        <View style={styles.icon}>{typeof props.icon === 'string' ? <Text style={styles.iconText}>{props.icon}</Text> : props.icon}</View>
        <View style={{ flex: 1 }}>
          <Text style={styles.title} numberOfLines={1}>
            {props.title}
            {props.level ? <Text style={styles.level}> {props.level}</Text> : null}
          </Text>
          {props.hot && !props.muted ? (
            <View style={styles.neckChip}>
              <Text style={styles.neckText}>BOTTLENECK</Text>
            </View>
          ) : null}
          <Text style={styles.detail} numberOfLines={3}>
            {/* a line may break before a "·", never after it */}
            {props.detail.replace(/ · /g, ' ·\u00A0')}
          </Text>
        </View>
      </View>
      <View style={props.wide ? { width: 96 } : undefined}>
        <BuyButton compact tone={props.tone} testID={props.testID} label={props.cost === null ? props.costLabel ?? 'MAX' : money(props.cost)} sub={props.tone === 'nogain' ? 'no gain now' : undefined} enabled={props.canBuy} onPress={props.onBuy} />
      </View>
    </View>
  );
}

const shadow = Platform.select({
  web: { boxShadow: '0 3px 0 rgba(59,31,20,0.18)' } as object,
  default: { shadowColor: '#3B1F14', shadowOpacity: 0.18, shadowRadius: 0, shadowOffset: { width: 0, height: 3 } },
});

const styles = StyleSheet.create({
  tabsWrap: { flexGrow: 0, backgroundColor: C.tomatoDark },
  tabFade: { position: 'absolute', top: 0, bottom: 0 },
  tabs: { paddingHorizontal: 10, paddingVertical: 6, gap: 6 },
  tab: { minWidth: 86, paddingHorizontal: 10, paddingVertical: 4, borderRadius: 12, backgroundColor: '#fff', borderWidth: 2.5, alignItems: 'center' },
  tabActive: { backgroundColor: C.cheese, borderColor: '#FFFFFF', borderWidth: 3, transform: [{ translateY: -1 }] },
  tabName: { fontFamily: F.bold, fontSize: 13, color: C.ink },
  tabSub: { fontFamily: F.semi, fontSize: 11, color: C.basilDark },
  tabLocked: { minWidth: 40, backgroundColor: 'rgba(255,255,255,0.25)', borderColor: 'transparent', justifyContent: 'center' },
  tabLockedText: { fontSize: 14 },
  tabBuild: { borderStyle: 'dashed', borderColor: C.cheese, backgroundColor: '#FFF4E0' },
  // the extra line is paid for by tighter padding and line heights, so the chip keeps its height (14 + 12 + 10 = 36 vs ~29 + 8)
  tabBuildWarn: { paddingVertical: 0, justifyContent: 'center' },
  tabTight: { lineHeight: 13 },
  tabWarn: { fontFamily: F.semi, fontSize: 9, lineHeight: 10, color: '#B3261E' },
  // on the solid-green ready chip red would not read: a cream pill behind it
  tabWarnOnGreen: { backgroundColor: '#FFF4E0', borderRadius: 4, paddingHorizontal: 4 },
  tabBuildReady: { backgroundColor: C.basil, borderColor: '#fff', borderStyle: 'solid' },

  card: { justifyContent: 'space-between', width: '48.5%', backgroundColor: C.panel, borderRadius: 16, padding: 7, gap: 5, borderWidth: 2.5, borderColor: C.ink, ...shadow },
  cardWide: { width: '100%', flexDirection: 'row', alignItems: 'flex-start' },
  cardMuted: { opacity: 0.6 },
  cardHot: { borderColor: C.tomato, backgroundColor: '#FFF4F0' },
  neckChip: { alignSelf: 'flex-start', backgroundColor: C.tomato, borderRadius: 6, paddingHorizontal: 5, paddingVertical: 1, marginVertical: 1 },
  neckText: { fontFamily: F.bold, fontSize: 8.5, letterSpacing: 0.6, color: '#fff' },
  cardHead: { flexDirection: 'row', gap: 6, alignItems: 'flex-start', flex: 1 },
  icon: { width: 34, height: 34, borderRadius: 10, backgroundColor: '#FFE9C7', alignItems: 'center', justifyContent: 'center', borderWidth: 1.5, borderColor: C.cheeseDark },
  iconText: { fontSize: 19 },
  title: { fontFamily: F.bold, color: C.ink, fontSize: 14 },
  level: { fontFamily: F.semi, color: C.inkSoft, fontSize: 12 },
  detail: { fontFamily: F.regular, color: C.inkSoft, fontSize: 11.5, lineHeight: 14 },
});
