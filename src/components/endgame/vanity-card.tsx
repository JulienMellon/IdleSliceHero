// The Vanity tab's pieces (v5.24, card U6): one look's card (thumbnail, name, a second line, and the button that buys, wears or takes off) and a section's header (title,
// a set's progress, its check and the set-complete line). Props are primitives, so a card repaints only when its own look changes. The names and words come from
// shop-model.ts; the thumbnail is S4's `LookThumb`, except for the older looks whose own art (vanity-art.tsx) draws them better than the plain tile.
import { memo } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';

import { C, F } from '../../theme';
import { LookThumb } from '../scene/look-thumb';
import { TAP } from '../tap-targets';
import { buttonA11y, OWN_ART, OWNED_TAG, WORN_CHIP, type VanitySection, type VanityState } from './shop-model';
import { VanityArt } from './vanity-art';

export interface VanityCardProps {
  id: string;
  /** Test id prefix: `vanity` (or `vanity-featured` for the Featured four, whose looks also show in their set or tier). */
  prefix: string;
  name: string;
  desc: string;
  /** A set piece's "set · shows in hood" line (the Featured tile has no room for `desc`, but still says where the look shows). */
  where: string;
  state: VanityState;
  owned: boolean;
  label: string;
  price: number;
  wearId: string | null;
  buyId: string | null;
  /** The Featured tile: half the width, the button under the name. */
  compact?: boolean;
  onWear: (id: string, on: boolean) => void;
  onBuy: (id: string, short: boolean) => void;
}

export const VanityCard = memo(function VanityCard({
  id,
  prefix,
  name,
  desc,
  where,
  state,
  owned,
  label,
  price,
  wearId,
  buyId,
  compact = false,
  onWear,
  onBuy,
}: VanityCardProps) {
  const press = () => {
    if (state === 'buy' && buyId) onBuy(buyId, false);
    else if (wearId) onWear(wearId, state !== 'worn');
    else if (state === 'poor' && buyId) onBuy(buyId, true);
  };
  const art = OWN_ART.includes(id) ? <VanityArt id={id} size={compact ? 48 : 56} /> : <LookThumb id={id} size={compact ? 48 : 56} />;
  const button = (
    <Pressable
      testID={`${prefix}-${id}-button`}
      disabled={state === 'earn'}
      accessibilityRole="button"
      accessibilityState={{ disabled: state === 'earn' || state === 'poor' }}
      accessibilityLabel={buttonA11y(state, name, price, label)}
      onPress={press}
      style={({ pressed }) => [
        styles.btn,
        compact && styles.btnCompact,
        state === 'worn' && styles.btnWorn,
        state === 'owned' && styles.btnWear,
        state === 'buy' && styles.btnBuy,
        (state === 'poor' || state === 'earn') && styles.btnOff,
        pressed && state !== 'earn' && styles.pressed,
      ]}
    >
      <Text
        style={[styles.btnText, state === 'worn' && styles.btnTextWorn, (state === 'poor' || state === 'earn') && styles.btnTextOff]}
        numberOfLines={1}
        adjustsFontSizeToFit
        minimumFontScale={0.8}
        maxFontSizeMultiplier={1.15}
      >
        {state === 'worn' ? WORN_CHIP() : label}
      </Text>
    </Pressable>
  );
  const text = (
    <View style={styles.text}>
      <Text style={[styles.name, compact && styles.nameCompact]} numberOfLines={compact ? 3 : 2} maxFontSizeMultiplier={1.15}>
        {name}
      </Text>
      {!!desc && !compact && (
        <Text style={styles.desc} numberOfLines={2} maxFontSizeMultiplier={1.15}>
          {desc}
        </Text>
      )}
      {owned && !compact && (
        <Text style={styles.ownedTag} maxFontSizeMultiplier={1.15}>
          {OWNED_TAG()}
        </Text>
      )}
    </View>
  );
  if (compact)
    return (
      <View testID={`${prefix}-${id}`} style={[styles.card, styles.tile]}>
        <View style={styles.tileTop}>
          {art}
          {text}
        </View>
        {!!where && (
          <Text testID={`${prefix}-${id}-where`} style={styles.whereCompact} numberOfLines={2} maxFontSizeMultiplier={1.15}>
            {where}
          </Text>
        )}
        {button}
      </View>
    );
  return (
    <View testID={`${prefix}-${id}`} style={[styles.card, styles.row]}>
      {art}
      {text}
      {button}
    </View>
  );
});

/** A section's header: its title, a set's progress and check, and the set-complete line (the manager's, or nameless before their hire scene). */
export const SectionHead = memo(function SectionHead({
  section,
}: {
  section: Pick<VanitySection, 'key' | 'title' | 'progress' | 'done' | 'doneLine' | 'speaker'>;
}) {
  const { key, title, progress, done, doneLine, speaker } = section;
  return (
    <View testID={`vanity-section-${key}`} style={styles.head}>
      <View style={styles.headRow}>
        <Text style={styles.title} accessibilityRole="header" numberOfLines={1} maxFontSizeMultiplier={1.15}>
          {title}
        </Text>
        {!!progress && (
          <Text testID={`vanity-progress-${key}`} style={[styles.progress, done && styles.progressDone]} maxFontSizeMultiplier={1.15}>
            {done ? `✓ ${progress}` : progress}
          </Text>
        )}
      </View>
      {done && !!doneLine && (
        <Text testID={`vanity-done-${key}`} style={styles.doneLine} maxFontSizeMultiplier={1.15}>
          {speaker ? `${speaker}: ` : ''}
          {doneLine}
        </Text>
      )}
    </View>
  );
});

const styles = StyleSheet.create({
  card: { backgroundColor: '#fff', borderRadius: 16, borderWidth: 2.5, borderColor: C.ink, padding: 10 },
  row: { flexDirection: 'row', alignItems: 'center', gap: 10 },
  tile: { flexBasis: '47%', flexGrow: 1, gap: 8, justifyContent: 'space-between' },
  whereCompact: { fontFamily: F.regular, fontSize: 11, lineHeight: 14, color: C.inkSoft },
  tileTop: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  text: { flex: 1 },
  name: { fontFamily: F.bold, fontSize: 16, lineHeight: 19, color: C.ink },
  nameCompact: { fontSize: 13, lineHeight: 16 },
  desc: { fontFamily: F.regular, fontSize: 12, lineHeight: 15, color: C.inkSoft },
  ownedTag: { fontFamily: F.bold, fontSize: 11, color: C.basilDark },
  btn: {
    minHeight: TAP.min,
    minWidth: 96,
    borderRadius: 12,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 8,
    borderBottomWidth: 4,
  },
  btnCompact: { alignSelf: 'stretch' },
  btnWear: { backgroundColor: C.basil, borderBottomColor: C.basilDark },
  btnWorn: { backgroundColor: '#fff', borderBottomColor: C.basil, borderWidth: 2, borderColor: C.basil },
  // D461: buying is blue (the diamond's colour), wearing green, worn an outlined chip: three looks, never two identical greens
  btnBuy: { backgroundColor: '#2D8FD9', borderBottomColor: '#1D5F9A' },
  btnOff: { backgroundColor: '#E2D9CE', borderBottomColor: '#C9BCAD' },
  btnText: { fontFamily: F.bold, fontSize: 15, color: '#fff' },
  btnTextWorn: { color: C.basilDark },
  btnTextOff: { color: '#665A4F' },
  pressed: { transform: [{ translateY: 2 }] },
  head: { gap: 2, marginTop: 8 },
  headRow: { flexDirection: 'row', alignItems: 'baseline', justifyContent: 'space-between', gap: 8 },
  title: { flexShrink: 1, fontFamily: F.bold, fontSize: 18, color: C.ink },
  progress: { fontFamily: F.bold, fontSize: 13, color: C.inkSoft },
  progressDone: { color: C.basilDark },
  doneLine: { fontFamily: F.semi, fontSize: 13, lineHeight: 17, color: C.basilDark },
});
