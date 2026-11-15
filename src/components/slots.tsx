// Slots: the places a new feature plugs into the game screen by appending ONE entry to an array here.
//
//   HUD_CHIPS       small round chips at the end of the goal row (44 pt tap targets)         mounted in app/index.tsx -> <Hud chips>
//   BANNERS         notices over the shop scene, under the drawers (position yourself)       mounted in app/index.tsx, scene area
//   SHEETS          modal sheets / popups over the whole screen                              mounted in app/index.tsx, root
//   SHOP_REPORT     the shop report's strip: a 44 pt row over the sidewalk row, told its `bottom`   mounted in app/index.tsx, scene area
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
import { RecipeReveal } from './endgame/recipe-reveal';
import { MoonIcon } from './game-ui';
import { AuctionCardSlot, RackCardSlot } from './layers/drawer-cards';
import { GameDayChip, HarbourChip, RivalTag } from './layers/layer-hud';
import { LayerSheet } from './layers/layer-sheet';
import { LayerStack } from './layers/layer-stack';
import { RivalScene } from './layers/rival/rival-scene';
import { GameDayScene } from './layers/suburbs/gameday-scene';
import { HarbourScene } from './layers/waterfront/harbour-scene';
import { CriticBanner } from './layers/uptown/critic-banner';
import { CriticScene } from './layers/uptown/critic-scene';
import { IndustrialSheet } from './layers/industrial/industrial-sheet';
import { IngredientsCard } from './layers/uptown/ingredients-card';
import { JamOverlay } from './layers/industrial/jam-overlay';
import { JamPulses } from './layers/industrial/jam-pulses';
import { NightTint } from './layers/industrial/night-tint';
import { ShiftBanner } from './layers/industrial/shift-banner';
import { ShiftChip } from './layers/industrial/shift-chip';
import { SignPlaque } from './layers/uptown/sign-plaque';
import { StarsChip } from './layers/uptown/stars-chip';
import { StarsSheet } from './layers/uptown/stars-sheet';
import { DroneFlight } from './layers/university/drone-flight';
import { UniversityChip } from './layers/university/university-chip';
import { UniversitySheet } from './layers/university/university-sheet';
import { ZonesStrip } from './layers/university/zones-strip';
import { ReportSheet } from './report/report-sheet';
import { ReportStrip } from './report/report-strip';

/** The slot kinds with no props: each component reads its own state. */
export type SlotProps = Readonly<Record<never, never>>;
/** What a scene overlay is told: the shop it draws in and the scene area's size in pt. */
export interface SceneSlotProps {
  shopId: string;
  width: number;
  height: number;
}

/** What the shop report's strip is told: its foot's distance from the scene area's bottom, just above the sidewalk row. */
export interface ShopReportSlotProps {
  bottom: number;
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

/** Renders every shop-report entry with the strip's `bottom`. Nothing (no wrapper) when the array is empty. */
export function ReportSlots({ items, bottom }: { items: readonly SlotEntry<ShopReportSlotProps>[]; bottom: number }) {
  if (items.length === 0) return null;
  return (
    <>
      {inOrder(items).map(({ id, Component }) => (
        <Component key={id} bottom={bottom} />
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
  // v5.15 (U1): the event countdown in the hour before an event
  { id: 'event-countdown', order: 15, Component: EventChip },
  // v5.16 (S2a): Game Day's countdown, the harbour's boat / auction clock, and the rival's "-20% sales" tag (a tap opens the layer's sheet)
  { id: 'gameday-chip', order: 20, Component: GameDayChip },
  { id: 'harbour-chip', order: 25, Component: HarbourChip },
  { id: 'rival-tag', order: 30, Component: RivalTag },
  // v5.16 (S2b): University's campus count, Industrial's shift clock and Uptown's rating (a tap opens the layer's sheet)
  { id: 'university-chip', order: 40, Component: UniversityChip },
  { id: 'shift-chip', order: 45, Component: ShiftChip },
  { id: 'stars-chip', order: 50, Component: StarsChip },
];
// G98: the diamonds chip lives in the HUD's top row (after the gift), so it never narrows the goal bar
export const HUD_TOP_CHIPS: SlotEntry[] = [{ id: 'diamond-shop', order: 20, Component: DiamondChip }];
// v5.15 (U1): the event banner, the counter-attack banner / challenge chip and the star, recipe and event toasts, one column under the order chip
export const BANNERS: SlotEntry[] = [
  { id: 'endgame-stack', order: 10, Component: BannerStack },
  // D469: a recipe card turns over in the middle of the scene
  { id: 'recipe-reveal', order: 20, Component: RecipeReveal },
  // v5.16 (S2a): the layers' notices and the rival's card, a column under the endgame stack
  { id: 'layer-stack', order: 30, Component: LayerStack },
  // v5.16 (S2b): the factory whistle, the jam pulses for the audio lane (draws nothing), and the critic's arrival and verdict
  { id: 'shift-banner', order: 40, Component: ShiftBanner },
  { id: 'jam-pulses', order: 41, Component: JamPulses },
  { id: 'critic-banner', order: 42, Component: CriticBanner },
];
// v5.15 (U1): "Coming soon: Boston", once, after the last finale
export const SHEETS: SlotEntry[] = [
  { id: 'boston-card', order: 10, Component: BostonSheet },
  // v5.16 (P1): the shop report's sheet, opened by a tap on its strip
  { id: 'shop-report', order: 20, Component: ReportSheet },
  // v5.16 (S2a): the layers' info sheets, opened from their HUD chips
  { id: 'layer-sheet', order: 30, Component: LayerSheet },
  // v5.16 (S2b): University's menu and zones, Industrial's shifts and jams, Uptown's stars and critic
  { id: 'university-sheet', order: 40, Component: UniversitySheet },
  { id: 'industrial-sheet', order: 50, Component: IndustrialSheet },
  { id: 'stars-sheet', order: 60, Component: StarsSheet },
];
// v5.16 (P1): the shop report's strip, one 44 pt row above the sidewalk row
export const SHOP_REPORT: SlotEntry<ShopReportSlotProps>[] = [
  { id: 'shop-report-strip', order: 10, Component: ReportStrip },
  // v5.16 (S2b): University's zones strip, stacked over the report's strip
  { id: 'zones-strip', order: 20, Component: ZonesStrip },
];
// v5.16 (S2a): Waterfront's Pier 9 bid card (while the auction is live) and its warming rack
export const DRAWER_CARDS: SlotEntry[] = [
  { id: 'auction-card', order: 10, Component: AuctionCardSlot },
  { id: 'rack-card', order: 20, Component: RackCardSlot },
  // v5.16 (S2b): Uptown's Ingredients track
  { id: 'ingredients-card', order: 30, Component: IngredientsCard },
];
// v5.16 (S2a): Game Day's free seats and wave of families, the harbour's boat and warming rack, the rival's shop across the street
export const SCENE_OVERLAYS: SlotEntry<SceneSlotProps>[] = [
  { id: 'gameday-scene', order: 10, Component: GameDayScene },
  { id: 'harbour-scene', order: 20, Component: HarbourScene },
  { id: 'rival-scene', order: 30, Component: RivalScene },
  // v5.16 (S2b): the night shift's tint, the jammed oven's smoke and wrench, the drones, the rating on the sign, the critic
  { id: 'night-tint', order: 40, Component: NightTint },
  { id: 'jam-overlay', order: 45, Component: JamOverlay },
  { id: 'drone-flight', order: 50, Component: DroneFlight },
  { id: 'sign-plaque', order: 60, Component: SignPlaque },
  { id: 'critic-scene', order: 70, Component: CriticScene },
];

const styles = StyleSheet.create({
  ovenChip: { width: 44, height: 44, borderRadius: 22, backgroundColor: 'rgba(255,255,255,0.22)', alignItems: 'center', justifyContent: 'center' },
  ovenPillText: { fontFamily: F.bold, fontSize: 10, lineHeight: 12, color: '#fff' },
});
