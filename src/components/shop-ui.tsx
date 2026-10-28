// Neighborhood tabs and the compact upgrade cards under the pizzeria cutaway.
import type { ReactNode } from 'react';
import { Platform, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';

import { NEIGHBORHOODS } from '../content/tuning';
import type { NeighborhoodId } from '../content/types';
import { money } from '../engine/format';
import * as Game from '../engine/game';
import { C, F } from '../theme';
import { BuyButton, haptic } from './game-ui';

export function ShopTabs({ game, onSelect, onBuild }: { game: Game.GameState; onSelect: (id: NeighborhoodId) => void; onBuild: (id: NeighborhoodId) => boolean }) {
  const next = Game.nextToBuild(game);
  return (
    <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.tabsWrap} contentContainerStyle={styles.tabs}>
      {NEIGHBORHOODS.map((n) => {
        const shop = game.shops[n.id];
        const active = game.active === n.id;
        if (!shop.built && next?.id !== n.id) {
          return (
            <View key={n.id} style={[styles.tab, styles.tabLocked]}>
              <Text style={styles.tabLockedText}>🔒</Text>
            </View>
          );
        }
        if (!shop.built) {
          const can = game.cash >= n.buildCost;
          return (
            <Pressable
              key={n.id}
              testID={`build-${n.id}`}
              onPress={() => {
                const ok = onBuild(n.id);
                haptic(ok ? 'success' : 'error');
              }}
              style={[styles.tab, styles.tabBuild, can && styles.tabBuildReady]}>
              <Text style={[styles.tabName, { color: can ? '#fff' : C.ink }]}>+ {n.name}</Text>
              <Text style={[styles.tabSub, { color: can ? '#fff' : C.tomato }]}>Build {money(n.buildCost)}</Text>
            </Pressable>
          );
        }
        const eps = Game.shopEarnings(game, n.id);
        return (
          <Pressable key={n.id} testID={`tab-${n.id}`} onPress={() => onSelect(n.id)} style={[styles.tab, { borderColor: n.color }, active && { backgroundColor: n.color }]}>
            <Text style={styles.tabName}>{n.name}</Text>
            <Text style={[styles.tabSub, !shop.managed && { color: active ? '#fff' : C.tomato }]}>{shop.managed ? `${money(eps)}/s` : 'tap to run'}</Text>
          </Pressable>
        );
      })}
    </ScrollView>
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
  onBuy: () => boolean | void;
  testID?: string;
  wide?: boolean;
}) {
  return (
    <View style={[styles.card, props.wide && styles.cardWide, props.hot && styles.cardHot]}>
      <View style={styles.cardHead}>
        <View style={styles.icon}>{typeof props.icon === 'string' ? <Text style={styles.iconText}>{props.icon}</Text> : props.icon}</View>
        <View style={{ flex: 1 }}>
          <Text style={styles.title} numberOfLines={1}>
            {props.title}
            {props.level ? <Text style={styles.level}> {props.level}</Text> : null}
          </Text>
          <Text style={[styles.detail, props.hot && { color: C.tomatoDark }]} numberOfLines={2}>
            {props.detail}
          </Text>
        </View>
      </View>
      <View style={props.wide ? { width: 96 } : undefined}>
        <BuyButton compact testID={props.testID} label={props.cost === null ? props.costLabel ?? 'MAX' : money(props.cost)} enabled={props.canBuy} onPress={props.onBuy} />
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
  tabs: { paddingHorizontal: 10, paddingVertical: 6, gap: 6 },
  tab: { minWidth: 86, paddingHorizontal: 10, paddingVertical: 4, borderRadius: 12, backgroundColor: '#fff', borderWidth: 2.5, alignItems: 'center' },
  tabName: { fontFamily: F.bold, fontSize: 13, color: C.ink },
  tabSub: { fontFamily: F.semi, fontSize: 11, color: C.basilDark },
  tabLocked: { minWidth: 40, backgroundColor: 'rgba(255,255,255,0.25)', borderColor: 'transparent', justifyContent: 'center' },
  tabLockedText: { fontSize: 14 },
  tabBuild: { borderStyle: 'dashed', borderColor: C.cheese, backgroundColor: '#FFF4E0' },
  tabBuildReady: { backgroundColor: C.basil, borderColor: '#fff', borderStyle: 'solid' },

  card: { width: '48.5%', backgroundColor: C.panel, borderRadius: 16, padding: 7, gap: 5, borderWidth: 2.5, borderColor: C.ink, ...shadow },
  cardWide: { width: '100%', flexDirection: 'row', alignItems: 'center' },
  cardHot: { borderColor: C.tomato, backgroundColor: '#FFF4F0' },
  cardHead: { flexDirection: 'row', gap: 6, alignItems: 'center', flex: 1 },
  icon: { width: 34, height: 34, borderRadius: 10, backgroundColor: '#FFE9C7', alignItems: 'center', justifyContent: 'center', borderWidth: 1.5, borderColor: C.cheeseDark },
  iconText: { fontSize: 19 },
  title: { fontFamily: F.bold, color: C.ink, fontSize: 14 },
  level: { fontFamily: F.semi, color: C.inkSoft, fontSize: 12 },
  detail: { fontFamily: F.regular, color: C.inkSoft, fontSize: 11.5, lineHeight: 14 },
});
