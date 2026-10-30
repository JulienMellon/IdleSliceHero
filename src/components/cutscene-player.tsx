// Non-interactive comic-panel cut-scene player. Auto-advances; tap to speed up; Skip ends it.
import { useEffect, useRef, useState } from 'react';
import { Animated, Platform, Pressable, StyleSheet, Text, useWindowDimensions, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { PERKS } from '../content/tuning';
import type { Scene } from '../content/types';
import { C, F } from '../theme';
import { Backdrop } from './backdrop';
import { canAdvance, sceneHeading } from '../engine/cutscene-input';
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
  const zoom = useRef(new Animated.Value(1)).current;
  const slide = useRef(new Animated.Value(0)).current;
  const bubble = useRef(new Animated.Value(0)).current;
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
  const current = p.lines[line];
  const frameW = Math.min(width - 24, 520);
  // Tall panel (~55% of the screen); the backdrop grows its sky to fill it, so nothing is cropped.
  const frameH = Math.max(frameW * 0.75, Math.min(height * 0.66 - insets.top, frameW * 1.45));

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
    const ms = 1800 + text.length * 45;
    const t = setTimeout(advance, ms);
    return () => clearTimeout(t);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [panel, line, showReward]);

  const speakerIndex = current ? p.cast.findIndex((c) => current.speaker.toLowerCase().includes(c.id.split('-')[0]) || current.speaker.startsWith(nameOf(c.id))) : -1;
  const portraitSize = Math.min(frameH * 0.62, p.cast.length > 1 ? frameW * 0.49 : frameW * 0.78);

  return (
    <View style={StyleSheet.absoluteFill}>
      <Pressable style={[styles.root, { paddingTop: insets.top + 8, paddingBottom: insets.bottom + 16 }]} onPress={onTap} testID="cutscene">
        <View style={styles.topRow}>
          <Text style={styles.title}>{sceneHeading(scene, panel, showReward)}</Text>
          <Pressable onPress={onDone} hitSlop={12} style={styles.skip} testID="skip-scene">
            <Text style={styles.skipText}>Skip ▸▸</Text>
          </Pressable>
        </View>

        <View style={styles.stage}>
        <Animated.View style={[styles.frame, { width: frameW, height: frameH, transform: [{ translateX: slide }] }]}>
          <Animated.View style={{ position: 'absolute', inset: 0, transform: [{ scale: zoom }] } as never}>
            <Backdrop id={p.backdrop} width={frameW} height={frameH} prop={p.prop} />
          </Animated.View>
          <View style={styles.castRow}>
            {p.cast.map((c, i) => (
              <View key={c.id} style={{ transform: [{ scale: speakerIndex === -1 || speakerIndex === i ? 1 : 0.9 }], transformOrigin: 'bottom' } as never}>
                <Portrait id={c.id} mood={c.mood} size={portraitSize} flip={p.cast.length === 2 && i === 1} />
              </View>
            ))}
          </View>
          {p.caption && p.lines.length > 0 ? (
            <View style={styles.caption}>
              <Text style={styles.captionText}>{p.caption}</Text>
            </View>
          ) : null}
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
                <View style={[styles.tail, { left: p.cast.length === 1 ? '47%' : speakerIndex === 1 ? '70%' : '22%' }]} />
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

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: '#1E0E08', alignItems: 'center' },
  topRow: { width: '100%', maxWidth: 540, flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingHorizontal: 16, marginBottom: 10 },
  title: { color: C.cheese, fontFamily: F.bold, fontSize: 22 },
  skip: { backgroundColor: 'rgba(255,255,255,0.15)', paddingHorizontal: 14, paddingVertical: 6, borderRadius: 16 },
  skipText: { color: '#fff', fontFamily: F.semi, fontSize: 15 },
  frame: { borderRadius: 18, overflow: 'hidden', borderWidth: 4, borderColor: '#fff', backgroundColor: '#000' },
  castRow: { position: 'absolute', bottom: -6, left: 0, right: 0, flexDirection: 'row', justifyContent: 'space-around', alignItems: 'flex-end' },
  caption: { position: 'absolute', top: 10, left: 10, right: 10, backgroundColor: C.cheese, opacity: 0.94, borderWidth: 2.5, borderColor: C.ink, borderRadius: 6, paddingHorizontal: 10, paddingVertical: 6, shadowColor: '#000', shadowOpacity: 0.35, shadowRadius: 4, shadowOffset: { width: 0, height: 3 } },
  captionText: { fontFamily: F.semi, color: C.ink, fontSize: 15 },
  narration: { backgroundColor: C.cheese, borderWidth: 3, borderColor: C.ink, borderRadius: 14, paddingHorizontal: 16, paddingVertical: 14 },
  narrationText: { fontFamily: F.bold, fontSize: 18, lineHeight: 24, color: C.ink, textAlign: 'center' },
  bubbleArea: { minHeight: 130, marginTop: 18, justifyContent: 'flex-start' },
  bubble: { backgroundColor: '#fff', borderRadius: 20, borderWidth: 3, borderColor: C.ink, padding: 14 },
  tail: { position: 'absolute', top: -13, width: 22, height: 22, backgroundColor: '#fff', borderLeftWidth: 3, borderTopWidth: 3, borderColor: C.ink, transform: [{ rotate: '45deg' }] },
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
