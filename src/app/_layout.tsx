import { Fredoka_400Regular, Fredoka_600SemiBold, Fredoka_700Bold, useFonts } from '@expo-google-fonts/fredoka';
import { Stack } from 'expo-router';
import * as SplashScreen from 'expo-splash-screen';
import { StatusBar } from 'expo-status-bar';
import { useEffect, useRef } from 'react';
import { AppState, View } from 'react-native';
import { SafeAreaProvider } from 'react-native-safe-area-context';

import { startAudio } from '@/audio/director';
import { CutscenePlayer } from '@/components/cutscene-player';
import { TUNING } from '@/content/tuning';
import { useGame } from '@/store/game-store';
import { C } from '@/theme';

SplashScreen.preventAutoHideAsync().catch(() => {});
// before the first load, so the offline popup's cue isn't missed
startAudio();

/** Runs the simulation, autosave, and app open/close handling for every screen. */
function GameRunner() {
  const load = useGame((s) => s.load);
  const lastTick = useRef(Date.now());

  useEffect(() => {
    void load();
    const tickTimer = setInterval(() => {
      const now = Date.now();
      // Clamp so a stalled JS thread can't produce a giant step; long gaps go through offline catch-up.
      const dt = Math.min(2, (now - lastTick.current) / 1000);
      lastTick.current = now;
      useGame.getState().tick(dt);
    }, 200);
    const saveTimer = setInterval(() => void useGame.getState().save(), TUNING.saveIntervalSeconds * 1000);
    const sub = AppState.addEventListener('change', (state) => {
      if (state === 'background' || state === 'inactive') void useGame.getState().save();
      if (state === 'active') {
        lastTick.current = Date.now();
        void useGame.getState().load();
      }
    });
    return () => {
      clearInterval(tickTimer);
      clearInterval(saveTimer);
      sub.remove();
    };
  }, [load]);
  return null;
}

function SceneOverlay() {
  const playing = useGame((s) => s.playing);
  const offline = useGame((s) => s.offline);
  const finishScene = useGame((s) => s.finishScene);
  if (!playing || offline) return null;
  return <CutscenePlayer key={playing.scene.id + String(playing.replay)} scene={playing.scene} onDone={finishScene} />;
}

export default function RootLayout() {
  const [fontsLoaded, fontError] = useFonts({ Fredoka_400Regular, Fredoka_600SemiBold, Fredoka_700Bold });
  const loaded = useGame((s) => s.loaded);
  const ready = (fontsLoaded || !!fontError) && loaded;

  useEffect(() => {
    if (ready) SplashScreen.hideAsync().catch(() => {});
  }, [ready]);

  return (
    <SafeAreaProvider>
      <StatusBar style="light" />
      <GameRunner />
      <View style={{ flex: 1, backgroundColor: C.bg }}>
        {ready ? (
          <>
            <Stack screenOptions={{ headerShown: false, contentStyle: { backgroundColor: C.bg } }} />
            <SceneOverlay />
          </>
        ) : null}
      </View>
    </SafeAreaProvider>
  );
}
