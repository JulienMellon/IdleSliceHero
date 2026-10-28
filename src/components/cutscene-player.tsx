// Non-interactive comic-panel cut-scene player. Auto-advances; tap to speed up; Skip ends it.
import { useEffect, useRef, useState } from 'react';
import { Animated, Platform, Pressable, StyleSheet, Text, useWindowDimensions, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import type { Scene } from '../content/types';
import { C, F } from '../theme';
import { Backdrop } from './backdrop';
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

  const p = scene.panels[panel];
  const current = p.lines[line];
  const frameW = Math.min(width - 24, 520);
  // 4:3 frame matches the backdrop art exactly, so nothing gets cropped.
  const frameH = Math.min(height * 0.48, frameW * 0.75);

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
    if (scene.reward) return setShowReward(true);
    onDone();
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
  const portraitSize = Math.min(frameH * 0.62, frameW * 0.4);

  return (
    <View style={StyleSheet.absoluteFill}>
      <Pressable style={[styles.root, { paddingTop: insets.top + 8, paddingBottom: insets.bottom + 16 }]} onPress={advance} testID="cutscene">
        <View style={styles.topRow}>
          <Text style={styles.title}>{scene.title}</Text>
          <Pressable onPress={onDone} hitSlop={12} style={styles.skip} testID="skip-scene">
            <Text style={styles.skipText}>Skip ▸▸</Text>
          </Pressable>
        </View>

        <View style={styles.stage}>
        <Animated.View style={[styles.frame, { width: frameW, height: frameH, transform: [{ translateX: slide }] }]}>
          <Animated.View style={{ position: 'absolute', inset: 0, transform: [{ scale: zoom }] } as never}>
            <Backdrop id={p.backdrop} width={frameW} height={frameH} />
          </Animated.View>
          <View style={styles.castRow}>
            {p.cast.map((c, i) => (
              <View key={c.id} style={{ opacity: speakerIndex === -1 || speakerIndex === i ? 1 : 0.75 }}>
                <Portrait id={c.id} mood={c.mood} size={portraitSize} flip={p.cast.length === 2 && i === 1} />
              </View>
            ))}
          </View>
          {p.caption ? (
            <View style={styles.caption}>
              <Text style={styles.captionText}>{p.caption}</Text>
            </View>
          ) : null}
        </Animated.View>

        <View style={[styles.bubbleArea, { width: frameW }]}>
          {showReward && scene.reward ? (
            <Animated.View style={[styles.reward, { transform: [{ scale: bubble }] }]}>
              <Text style={styles.rewardHead}>★ UNLOCKED ★</Text>
              <Text style={styles.rewardText}>{REWARD_TEXT[scene.reward]}</Text>
            </Animated.View>
          ) : current ? (
            <Animated.View style={[styles.bubble, { transform: [{ scale: bubble }] }]}>
              <View style={[styles.tail, { left: speakerIndex === 1 ? '70%' : '18%' }]} />
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
  caption: { position: 'absolute', top: 10, left: 10, right: 10, backgroundColor: C.cheese, borderWidth: 2.5, borderColor: C.ink, borderRadius: 6, paddingHorizontal: 10, paddingVertical: 6 },
  captionText: { fontFamily: F.semi, color: C.ink, fontSize: 15 },
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
