import { router } from 'expo-router';
import { Pressable, ScrollView, StyleSheet, Text, useWindowDimensions, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { CityMap } from '@/components/city-map';
import { Toast } from '@/components/game-ui';
import { LockIcon } from '@/components/icons';
import { CITY_NAME, FOOTPRINTS, NEIGHBORHOODS, OVEN_GRADES } from '@/content/tuning';
import { money } from '@/engine/format';
import * as G from '@/engine/game';
import { useGame } from '@/store/game-store';
import { C, F } from '@/theme';

export default function City() {
  const insets = useSafeAreaInsets();
  const { width, height } = useWindowDimensions();
  const game = useGame((s) => s.game);
  const toast = useGame((s) => s.toast);
  const { setActive, build } = useGame.getState();
  const built = NEIGHBORHOODS.filter((n) => game.shops[n.id].built).length;
  const mapH = Math.min(height * 0.6, width * 0.84);
  return (
    <View style={[styles.root, { paddingTop: insets.top }]}>
      <View style={styles.header}>
        <Pressable onPress={() => router.back()} hitSlop={12} style={{ width: 70 }} testID="back">
          <Text style={styles.backText}>‹ Back</Text>
        </Pressable>
        <Text style={styles.title}>{CITY_NAME}</Text>
        <Pressable onPress={() => router.push('/settings')} hitSlop={12} style={{ width: 70, alignItems: 'flex-end' }} testID="open-settings">
          <Text style={{ fontSize: 24, color: '#FFF4E0', fontFamily: F.bold }}>⚙︎</Text>
        </Pressable>
      </View>
      <View style={{ height: mapH + 14, paddingTop: 14, backgroundColor: C.map }}>
        <CityMap
          game={game}
          width={width}
          height={mapH}
          onPress={(id) => {
            if (game.shops[id].built) {
              setActive(id);
              router.back();
            } else if (build(id)) router.back();
          }}
        />
      </View>
      <ScrollView contentContainerStyle={styles.summary}>
        <Text style={styles.big}>{money(G.earningsPerSecond(game))}/sec</Text>
        <Text style={styles.small}>{built}/6 pizzerias built · {NEIGHBORHOODS.filter((n) => game.shops[n.id].managed).length} with managers · tap one to visit</Text>
        {NEIGHBORHOODS.map((n) => {
          const sh = game.shops[n.id];
          const isNext = G.nextToBuild(game)?.id === n.id;
          if (!sh.built) {
            return (
              <Pressable
                key={n.id}
                testID={`city-row-${n.id}`}
                disabled={!isNext}
                onPress={() => {
                  if (build(n.id)) router.back();
                }}
                style={[styles.row, styles.rowLocked, isNext && { borderColor: C.cheeseDark, borderStyle: 'dashed', opacity: 1 }]}>
                <View style={[styles.dot, { backgroundColor: isNext ? n.color : C.locked }]} />
                <View style={{ flex: 1 }}>
                  <Text style={styles.rowName}>{n.name}</Text>
                  <Text style={styles.rowSub}>{isNext ? `Pays ${money(n.orderValue)} a pizza · manager ${money(n.managerCost)}` : 'Build the previous pizzeria first'}</Text>
                </View>
                {isNext ? <Text style={[styles.rowEps, { color: C.tomato }]}>{`Build ${money(n.buildCost)}`}</Text> : <LockIcon size={18} color="#E2D9CE" />}
              </Pressable>
            );
          }
          return (
            <Pressable
              key={n.id}
              testID={`city-row-${n.id}`}
              onPress={() => {
                setActive(n.id);
                router.back();
              }}
              style={[styles.row, { borderColor: n.color }]}>
              <View style={[styles.dot, { backgroundColor: n.color }]} />
              <View style={{ flex: 1 }}>
                <Text style={styles.rowName}>{n.name}</Text>
                <Text style={styles.rowSub}>
                  {FOOTPRINTS[sh.footprint].name} · {OVEN_GRADES[sh.grade].name} ovens · {sh.drivers} driver{sh.drivers === 1 ? '' : 's'}
                </Text>
              </View>
              <Text style={[styles.rowEps, !sh.managed && { color: C.tomato }]}>{sh.managed ? `${money(G.shopEarnings(game, n.id))}/s` : 'no manager'}</Text>
            </Pressable>
          );
        })}
      </ScrollView>
      {/* build failures ("Build Suburbs: need $300") show here, where the tap happened */}
      {toast && <Toast compact text={toast.text} top={insets.top + 56} />}
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: C.bg },
  header: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 14, paddingVertical: 10, backgroundColor: C.tomato, borderBottomWidth: 4, borderColor: C.tomatoDark },
  backText: { fontFamily: F.bold, color: '#fff', fontSize: 18 },
  title: { fontFamily: F.bold, color: '#fff', fontSize: 22 },
  count: { width: 70, textAlign: 'right', fontFamily: F.semi, color: '#FFE7C2', fontSize: 16 },
  summary: { padding: 14, alignItems: 'stretch', gap: 6 },
  big: { fontFamily: F.bold, fontSize: 28, color: C.basilDark, textAlign: 'center' },
  small: { fontFamily: F.regular, fontSize: 14, color: C.inkSoft, textAlign: 'center', marginBottom: 4 },
  row: { flexDirection: 'row', alignItems: 'center', gap: 10, backgroundColor: '#fff', borderRadius: 14, borderWidth: 2.5, padding: 10 },
  rowLocked: { borderColor: C.locked, opacity: 0.7 },
  dot: { width: 14, height: 14, borderRadius: 7, borderWidth: 1.5, borderColor: C.ink },
  rowName: { fontFamily: F.bold, fontSize: 16, color: C.ink },
  rowSub: { fontFamily: F.regular, fontSize: 12, color: C.inkSoft },
  rowEps: { fontFamily: F.bold, fontSize: 15, color: C.basilDark },
});
