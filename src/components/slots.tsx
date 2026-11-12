// Slots: the places a new feature plugs into the game screen by appending ONE entry to an array here.
//
//   HUD_CHIPS       small round chips at the end of the goal row (44 pt tap targets)         mounted in app/index.tsx -> <Hud chips>
//   BANNERS         notices over the shop scene, under the drawers (position yourself)       mounted in app/index.tsx, scene area
//   SHEETS          modal sheets / popups over the whole screen                              mounted in app/index.tsx, root
//   DRAWER_CARDS    city-wide cards in the upgrade drawer's list (after the Fleet card)      mounted in app/index.tsx, drawer
//   SCENE_OVERLAYS  drawn inside the shop scene, above the floor and furniture, below the HUD   mounted in scene/room.tsx <SceneOverlays>
//
// A component reads what it needs from the store with PRIMITIVE selectors and returns null when it has nothing to show.
// An empty array renders nothing and adds no wrapper view. `order` sorts ascending; ties keep insertion order.
import { memo, type ComponentType } from 'react';
import { Pressable, StyleSheet, Text } from 'react-native';

import { offlineCapOf } from '../engine/game';
import { hoursText } from '../engine/night-oven';
import { rewardsUnlocked } from '../engine/rewards';
import { useGame } from '../store/game-store';
import { F } from '../theme';
import { BannerStack } from './endgame/banner-stack';
import { BostonSheet } from './endgame/boston-sheet';
import { DiamondChip } from './endgame/diamond-chip';
import { EventChip } from './endgame/event-chip';
import { MoonIcon } from './game-ui';

/** The slot kinds with no props: each component reads its own state. */
export type SlotProps = Readonly<Record<never, never>>;
/** What a scene overlay is told: the shop it draws in and the scene area's size in pt. */
export interface SceneSlotProps {
  shopId: string;
  width: number;
  height: number;
}

export interface SlotEntry<P = SlotProps> {
  id: string;
  order: number;
  Component: ComponentType<P>;
}

// ---- a tiny bus, so a slot component can ask the screen to open one of its sheets without props ----
const ovenAsks = new Set<() => void>();
/** The screen listens here; returns the unsubscribe. */
export function onOvenAsk(fn: () => void) {
  ovenAsks.add(fn);
  return () => {
    ovenAsks.delete(fn);
  };
}
/** Ask the screen to open Nonna's night-oven sheet (it also closes the drawer, tasks and calendar). */
export function askOven() {
  ovenAsks.forEach((fn) => fn());
}

/** The entries in `order` (ascending, stable). Returns the array itself when it holds fewer than two. */
export function inOrder<P>(items: readonly SlotEntry<P>[]): readonly SlotEntry<P>[] {
  return items.length < 2 ? items : [...items].sort((a, b) => a.order - b.order);
}

/** Renders every entry of a prop-less slot. Nothing (no wrapper) when the array is empty. */
export function Slots({ items }: { items: readonly SlotEntry[] }) {
  if (items.length === 0) return null;
  return (
    <>
      {inOrder(items).map(({ id, Component }) => (
        <Component key={id} />
      ))}
    </>
  );
}

/** Renders every scene overlay with the shop and the scene size. Nothing (no wrapper) when the array is empty. */
export function SceneSlots({ items, shopId, width, height }: { items: readonly SlotEntry<SceneSlotProps>[]; shopId: string; width: number; height: number }) {
  if (items.length === 0) return null;
  return (
    <>
      {inOrder(items).map(({ id, Component }) => (
        <Component key={id} shopId={shopId} width={width} height={height} />
      ))}
    </>
  );
}

// ---- the entries (append yours; keep the component in this file or its own module) ----

/** v5.14 (R3): Nonna's night oven, a 44 pt round chip with the hours it holds; shows once rewards unlock. */
const NightOvenChip = memo(function NightOvenChip() {
  // a string: the chip repaints only when the hours text changes, never on a game tick
  const hours = useGame((s) => (rewardsUnlocked(s.game) ? hoursText(offlineCapOf(s.game)) : ''));
  if (!hours) return null;
  return (
    <Pressable testID="night-oven-chip" onPress={askOven} style={styles.ovenChip} accessibilityLabel={`Nonna's night oven: full in ${hours}`}>
      <MoonIcon size={16} />
      <Text style={styles.ovenPillText} numberOfLines={1} maxFontSizeMultiplier={1.1}>
        {hours}
      </Text>
    </Pressable>
  );
});

export const HUD_CHIPS: SlotEntry[] = [
  { id: 'night-oven', order: 10, Component: NightOvenChip },
  // v5.15 (U1): the event countdown in the hour before an event, then the diamonds chip that opens the Shop screen
  { id: 'event-countdown', order: 15, Component: EventChip },
  { id: 'diamond-shop', order: 20, Component: DiamondChip },
];
// v5.15 (U1): the event banner, the counter-attack banner / challenge chip and the star, recipe and event toasts, one column under the order chip
export const BANNERS: SlotEntry[] = [{ id: 'endgame-stack', order: 10, Component: BannerStack }];
// v5.15 (U1): "Coming soon: Boston", once, after the last finale
export const SHEETS: SlotEntry[] = [{ id: 'boston-card', order: 10, Component: BostonSheet }];
export const DRAWER_CARDS: SlotEntry[] = [];
export const SCENE_OVERLAYS: SlotEntry<SceneSlotProps>[] = [];

const styles = StyleSheet.create({
  ovenChip: { width: 44, height: 44, borderRadius: 22, backgroundColor: 'rgba(255,255,255,0.22)', alignItems: 'center', justifyContent: 'center' },
  ovenPillText: { fontFamily: F.bold, fontSize: 10, lineHeight: 12, color: '#fff' },
});
