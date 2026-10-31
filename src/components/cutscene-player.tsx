// Non-interactive comic-panel cut-scene player. Auto-advances; tap to speed up; Skip ends it.
import { useEffect, useRef, useState } from 'react';
import { Animated, Platform, Pressable, StyleSheet, Text, useWindowDimensions, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { emitAudio } from '../audio/bus';
import { panelCue } from '../audio/logic';
import { STORY } from '../audio/manifest';
import { PERKS } from '../content/tuning';
import type { Scene } from '../content/types';
import { C, F } from '../theme';
import { Backdrop } from './backdrop';
import { canAdvance, sceneHeading } from '../engine/cutscene-input';
import { CAPTION, PANEL_BORDER, hasCaptionBar, panelSize, poseFor, stageLayout, tailShare } from './cutscene/staging';
import { Portrait } from './portrait';

const native = Platform.OS !== 'web';
const REWARD_TEXT: Record<string, string> = {
  'auto-bake': 'Nonna now keeps the oven baking — even while you’re away!',
  drones: 'Drones unlocked in the garage!',
  'city-complete': 'Port Marinara is yours! More cities coming soon.',
};

export function CutscenePlayer({ scene, onDone }: { scene: Scene; onDone: () => void }) {
  const { width, height } = useWindowDimensions();
  const insets = useSafeAreaInsets();
  const [panel, setPanel] = useState(0);
  const [line, setLine] = useState(0);
  const [showReward, setShowReward] = useState(false);
  const [zoom] = useState(() => new Animated.Value(1));
  const [slide] = useState(() => new Animated.Value(0));
  const [bubble] = useState(() => new Animated.Value(0));
  // Input lockout: a tapping player must not blow past a line or the whole scene (see cutscene-input.ts).
  const openedAt = useRef(0);
  const lineShownAt = useRef(0);
  useEffect(() => {
    openedAt.current = Date.now();
    lineShownAt.current = Date.now();
  }, [scene.id]);

  // the closing card: a gameplay unlock and/or this neighbourhood's perk
  const perk = scene.perk ? PERKS[scene.neighborhood] : undefined;
  const hasCard = !!scene.reward || !!perk;
  const p = scene.panels[panel];
  const captionBar = hasCaptionBar(p);
  const current = p.lines[line];
  // Tall panel (~55% of the screen); the backdrop grows its sky to fill it, so nothing is cropped.
  const { w: frameW, h: frameH, innerW, innerH } = panelSize(width, height, insets.top);

  // Story music for this panel (docs/AUDIO.md); replays use the same cues.
  useEffect(() => {
    emitAudio({ type: 'scene-panel', sceneId: scene.id, panel });
  }, [scene.id, panel]);
  useEffect(() => {
    if (showReward && perk) emitAudio({ type: 'perk' });
  }, [showReward, perk]);

  // Panel motion: slide in, then slow zoom.
  useEffect(() => {
    slide.setValue(40);
    zoom.setValue(1);
    Animated.parallel([
      Animated.timing(slide, { toValue: 0, duration: 350, useNativeDriver: native }),
      Animated.timing(zoom, { toValue: 1.08, duration: 6000, useNativeDriver: native }),
    ]).start();
  }, [panel, slide, zoom]);

  // Speech bubble pop for each line.
  useEffect(() => {
    lineShownAt.current = Date.now();
    if (p.lines.length > 0 || p.caption) emitAudio({ type: 'bubble' });
    bubble.setValue(0.6);
    Animated.spring(bubble, { toValue: 1, friction: 5, useNativeDriver: native }).start();
  }, [panel, line, bubble]);

  const advance = () => {
    if (showReward) return onDone();
    if (line < p.lines.length - 1) return setLine(line + 1);
    if (panel < scene.panels.length - 1) {
      setPanel(panel + 1);
      setLine(0);
      return;
    }
    if (hasCard) return setShowReward(true);
    onDone();
  };

  const onTap = () => {
    const now = Date.now();
    if (canAdvance(now - lineShownAt.current, now - openedAt.current)) advance();
  };

  // Auto-advance after a reading pause scaled to text length.
  useEffect(() => {
    const text = showReward ? 'x'.repeat(60) : (current?.text ?? p.caption ?? '');
    // the city theme's panel waits for its music to finish (AU26); the player can still tap on
    const hold = !showReward && panelCue(scene, panel) === 'city-theme' ? STORY.city_theme.seconds * 1000 : 0;
    const ms = Math.max(1800 + text.length * 45, hold);
    const t = setTimeout(advance, ms);
    return () => clearTimeout(t);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [panel, line, showReward]);

  const speakerIndex = current ? p.cast.findIndex((c) => current.speaker.toLowerCase().includes(c.id.split('-')[0]) || current.speaker.startsWith(nameOf(c.id))) : -1;
  // waist-up figures: centred, or at 30 % / 70 % facing each other; the speaker in front, the listener smaller and dimmed
  // a figure holding the recipe card shows it in its hands (the backdrop doesn't draw it), so the gesture is sized in too
  const holder = p.prop === 'recipe-card' ? Math.max(0, p.cast.findIndex((c) => c.id === 'nonna-rosa')) : -1;
  const stage = stageLayout(p.cast.length, innerW, innerH, speakerIndex, p.cast.map((c, i) => poseFor(c.id, c.mood, i === holder ? 'recipe-card' : undefined)));

  return (
    <View style={StyleSheet.absoluteFill}>
      <Pressable style={[styles.root, { paddingTop: insets.top + 8, paddingBottom: insets.bottom + 16 }]} onPress={onTap} testID="cutscene">
        <View style={styles.topRow}>
          <Text style={styles.title}>{sceneHeading(scene, panel, showReward)}</Text>
          <Pressable
            onPress={() => {
              emitAudio({ type: 'scene-skip' });
              onDone();
            }}
            hitSlop={12}
            style={styles.skip}
            testID="skip-scene">
            <Text style={styles.skipText}>Skip ▸▸</Text>
          </Pressable>
        </View>

        <View style={styles.stage}>
        <Animated.View style={[styles.frameShadow, { width: frameW, height: frameH, transform: [{ translateX: slide }] }]}>
          <View style={styles.frame}>
            <Animated.View style={{ position: 'absolute', inset: 0, transform: [{ scale: zoom }] } as never}>
              <Backdrop id={p.backdrop} width={innerW} height={innerH} prop={p.prop === 'recipe-card' ? undefined : p.prop} captioned={captionBar} />
            </Animated.View>
            {p.cast.map((c, i) => {
              const s = stage[i];
              return (
                <View key={c.id} style={[styles.figure, { left: s.left, width: s.width, height: s.height, zIndex: s.z, transform: [{ scale: s.scale }] }]}>
                  <Portrait id={c.id} mood={c.mood} size={s.height} flip={s.flip} dim={s.dim} variant="stage" holding={i === holder ? 'recipe-card' : undefined} />
                </View>
              );
            })}
            {captionBar ? (
              <View style={styles.caption}>
                <Text style={styles.captionText}>{p.caption}</Text>
              </View>
            ) : null}
            <View pointerEvents="none" style={styles.keyline} />
          </View>
        </Animated.View>

        <View style={[styles.bubbleArea, { width: frameW }]}>
          {showReward && hasCard ? (
            <Animated.View style={[styles.reward, { transform: [{ scale: bubble }] }]}>
              {scene.reward ? (
                <>
                  <Text style={styles.rewardHead}>★ UNLOCKED ★</Text>
                  <Text style={styles.rewardText}>{REWARD_TEXT[scene.reward]}</Text>
                </>
              ) : null}
              {perk ? (
                <>
                  <Text style={[styles.rewardHead, scene.reward ? { marginTop: 10 } : null]}>{`★ ${perk.who.toUpperCase()}’S PERK ★`}</Text>
                  <Text style={styles.rewardText}>{perk.text}</Text>
                </>
              ) : null}
            </Animated.View>
          ) : p.lines.length === 0 && p.caption ? (
            // narration-only panel: the caption reads below the art like a storybook line
            <Animated.View style={[styles.narration, { transform: [{ scale: bubble }] }]}>
              <Text style={styles.narrationText}>{p.caption}</Text>
            </Animated.View>
          ) : current ? (
            <Animated.View style={[styles.bubble, { transform: [{ scale: bubble }] }]}>
              {p.cast.length > 0 && current.speaker !== 'You' && (
                <View style={[styles.tail, { left: tailShare(p.cast.length, speakerIndex) * frameW - TAIL / 2 }]} />
              )}
              <Text style={styles.speaker}>{current.speaker}</Text>
              <Text style={styles.line}>{current.text}</Text>
            </Animated.View>
          ) : null}
        </View>

        </View>
        <View style={styles.dots}>
          {scene.panels.map((_, i) => (
            <View key={i} style={[styles.dot, i === panel && styles.dotOn]} />
          ))}
        </View>
        <Text style={styles.hint}>Tap to continue</Text>
      </Pressable>
    </View>
  );
}

function nameOf(id: string) {
  return id
    .split('-')
    .map((w) => w[0].toUpperCase() + w.slice(1))
    .join(' ');
}

const TAIL = 22;
const CREAM = '#FFF4E0';

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: '#1E0E08', alignItems: 'center' },
  topRow: { width: '100%', maxWidth: 540, flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingHorizontal: 16, marginBottom: 10 },
  title: { color: C.cheese, fontFamily: F.bold, fontSize: 22 },
  skip: { backgroundColor: 'rgba(255,255,255,0.15)', paddingHorizontal: 14, paddingVertical: 6, borderRadius: 16 },
  skipText: { color: '#fff', fontFamily: F.semi, fontSize: 15 },
  // comic panel: ink border, a cream keyline just inside it, and a drop shadow under the whole panel
  frameShadow: { borderRadius: 12, backgroundColor: C.ink, boxShadow: '0 8px 18px rgba(0,0,0,0.6)' } as object,
  frame: { flex: 1, borderRadius: 12, overflow: 'hidden', borderWidth: PANEL_BORDER, borderColor: C.ink, backgroundColor: '#000' },
  keyline: { position: 'absolute', top: 0, left: 0, right: 0, bottom: 0, borderRadius: 9, borderWidth: 1, borderColor: CREAM },
  figure: { position: 'absolute', bottom: 0, transformOrigin: 'bottom' } as object,
  caption: { position: 'absolute', top: CAPTION.top, left: 10, right: 10, backgroundColor: C.cheese, borderWidth: CAPTION.border, borderColor: C.ink, borderRadius: 6, paddingHorizontal: 10, paddingVertical: CAPTION.padV, shadowColor: '#000', shadowOpacity: 0.35, shadowRadius: 4, shadowOffset: { width: 0, height: 3 } },
  captionText: { fontFamily: F.semi, color: C.ink, fontSize: CAPTION.fontSize, lineHeight: CAPTION.lineHeight },
  narration: { backgroundColor: C.cheese, borderWidth: 3, borderColor: C.ink, borderRadius: 14, paddingHorizontal: 16, paddingVertical: 14 },
  narrationText: { fontFamily: F.bold, fontSize: 18, lineHeight: 24, color: C.ink, textAlign: 'center' },
  bubbleArea: { minHeight: 130, marginTop: 18, justifyContent: 'flex-start' },
  bubble: { backgroundColor: '#fff', borderRadius: 20, borderWidth: 3, borderColor: C.ink, padding: 14 },
  tail: { position: 'absolute', top: -13, width: TAIL, height: TAIL, backgroundColor: '#fff', borderLeftWidth: 3, borderTopWidth: 3, borderColor: C.ink, transform: [{ rotate: '45deg' }] },
  speaker: { fontFamily: F.bold, color: C.tomato, fontSize: 16, marginBottom: 2 },
  line: { fontFamily: F.regular, color: C.ink, fontSize: 19, lineHeight: 25 },
  reward: { backgroundColor: C.cheese, borderRadius: 20, borderWidth: 3, borderColor: C.ink, padding: 16, alignItems: 'center' },
  rewardHead: { fontFamily: F.bold, color: C.tomatoDark, fontSize: 20 },
  rewardText: { fontFamily: F.semi, color: C.ink, fontSize: 17, textAlign: 'center', marginTop: 4 },
  stage: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  dots: { flexDirection: 'row', gap: 6 },
  dot: { width: 8, height: 8, borderRadius: 4, backgroundColor: 'rgba(255,255,255,0.3)' },
  dotOn: { backgroundColor: C.cheese, width: 20 },
  hint: { color: 'rgba(255,255,255,0.5)', fontFamily: F.regular, fontSize: 13, marginTop: 6 },
});
