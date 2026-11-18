import { Fredoka_400Regular, Fredoka_600SemiBold, Fredoka_700Bold, useFonts } from '@expo-google-fonts/fredoka';
import { Stack } from 'expo-router';
import * as SplashScreen from 'expo-splash-screen';
import { StatusBar } from 'expo-status-bar';
import { useEffect, useRef } from 'react';
import { AppState, View } from 'react-native';
import { SafeAreaProvider } from 'react-native-safe-area-context';

import { startAudio } from '@/audio/director';
import { isForeground } from '@/components/app-state-model';
import { CutscenePlayer } from '@/components/cutscene-player';
import { TitleCard } from '@/components/title-card';
import { TUNING } from '@/content/tuning';
import { TUTORIAL_DONE } from '@/engine/game';
import { gameNow } from '@/engine/clock';
import { adsTutorialDone, analytics, EVENTS, startServices } from '@/services';
import { createLifecycle } from '@/services/lifecycle';
import { useGame } from '@/store/game-store';
import { C } from '@/theme';

SplashScreen.preventAutoHideAsync().catch(() => {});
// before the first load, so the offline popup's cue isn't missed
startAudio();

/** Runs the simulation, autosave, and app open/close handling for every screen. */
function GameRunner() {
  const load = useGame((s) => s.load);
  const background = useGame((s) => s.background);
  const lastTick = useRef(gameNow());

  // The tick timer only runs in the foreground: nothing fires every 200 ms while the app is in the background.
  useEffect(() => {
    if (background) return;
    lastTick.current = gameNow();
    const tickTimer = setInterval(() => {
      const now = gameNow();
      // Clamp so a stalled JS thread can't produce a giant step; long gaps go through offline catch-up.
      const dt = Math.min(2, (now - lastTick.current) / 1000);
      lastTick.current = now;
      useGame.getState().tick(dt);
    }, 200);
    return () => clearInterval(tickTimer);
  }, [background]);

  useEffect(() => {
    void load();
    const saveTimer = setInterval(() => void useGame.getState().save(), TUNING.saveIntervalSeconds * 1000);
    // The one AppState owner. Only a real background counts as leaving: the tracking prompt and other system sheets
    // make the app inactive and active again, and must not reload the game (that closed the offline popup and voided its 2x ad).
    const life = createLifecycle();
    const sub = AppState.addEventListener('change', (state) => {
      // C134: the game tick stops in the background (the animation loops and the scene clock follow AppState themselves); the time away is paid when it returns
      useGame.getState().setBackground(!isForeground(state));
      if (state === 'background' || state === 'inactive') void useGame.getState().save();
      const t = life.next(state);
      if (t === 'left') analytics.track(EVENTS.sessionEnd);
      if (t === 'returned') {
        lastTick.current = gameNow();
        void useGame.getState().load();
        analytics.track(EVENTS.sessionStart);
      }
    });
    return () => {
      clearInterval(saveTimer);
      sub.remove();
    };
  }, [load]);
  return null;
}

/** Starts the four services (opt-out first, no prompts), counts the first session, and tells the ads when the tutorial is over. */
function ServicesRunner() {
  const tutorialDone = useGame((s) => s.game.tutorial >= TUTORIAL_DONE);
  useEffect(() => {
    // later sessions (after a real background) are counted by GameRunner's one AppState listener
    void startServices().then(() => analytics.track(EVENTS.sessionStart));
  }, []);
  useEffect(() => {
    if (tutorialDone) adsTutorialDone();
  }, [tutorialDone]);
  return null;
}

function SceneOverlay() {
  const playing = useGame((s) => s.playing);
  const offline = useGame((s) => s.offline);
  const titleDone = useGame((s) => s.titleDone);
  const finishScene = useGame((s) => s.finishScene);
  if (!playing || offline || !titleDone) return null;
  return <CutscenePlayer key={playing.scene.id + String(playing.replay)} scene={playing.scene} onDone={finishScene} />;
}

export default function RootLayout() {
  const [fontsLoaded, fontError] = useFonts({ Fredoka_400Regular, Fredoka_600SemiBold, Fredoka_700Bold });
  const loaded = useGame((s) => s.loaded);
  const ready = (fontsLoaded || !!fontError) && loaded;

  // the title card hides the native splash once it has laid out (no flash between them); on a failed font load
  // the splash still goes
  useEffect(() => {
    if (fontError) SplashScreen.hideAsync().catch(() => {});
  }, [fontError]);
  const titleDone = useGame((s) => s.titleDone);
  const finishTitle = useGame((s) => s.finishTitle);

  return (
    <SafeAreaProvider>
      <StatusBar style="light" />
      <GameRunner />
      <ServicesRunner />
      <View style={{ flex: 1, backgroundColor: C.bg }}>
        {ready ? (
          <>
            <Stack screenOptions={{ headerShown: false, contentStyle: { backgroundColor: C.bg } }} />
            <SceneOverlay />
            {!titleDone && <TitleCard onDone={finishTitle} />}
          </>
        ) : null}
      </View>
    </SafeAreaProvider>
  );
}
